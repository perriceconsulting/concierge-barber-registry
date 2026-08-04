import { test, expect } from '@playwright/test';
import Stripe from 'stripe';
import { loadEnvConfig } from '@next/env';
import { testUsers } from './helpers/test-users';
import { VERIFIED_TRIAL_DAYS, FOUNDING_TRIAL_DAYS } from '../src/lib/copy/v2';

/**
 * Payment flow assertion suite for CBR v2.0.
 *
 * Verifies the full money path:
 *   1. POST /api/barbers/verification-payment/checkout creates a real Stripe
 *      Checkout Session against TEST mode
 *   2. The session has the correct amount (intro $49 or standard $99 based on
 *      Founding Member seat count) + the right metadata
 *   3. A fabricated checkout.session.completed webhook event (with valid
 *      Stripe signature) flips the barber's setupFeePaidAt + records the
 *      Stripe payment-intent id
 *   4. Admin approval after payment auto-creates a Verified Member trial
 *      subscription on the Verified Member monthly price
 *
 * Runs against TEST mode only. Loads STRIPE_SECRET_KEY + price IDs from
 * .env.local; aborts cleanly if the dev env is misconfigured.
 */

loadEnvConfig(process.cwd());

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const VERIFIED_MONTHLY_PRICE = process.env.STRIPE_PRICE_VERIFIED_MONTHLY;
const VERIFIED_ANNUAL_PRICE = process.env.STRIPE_PRICE_VERIFIED_ANNUAL;
const SETUP_INTRO = 4900;
const SETUP_STANDARD = 9900;

test.skip(
  !STRIPE_KEY || !STRIPE_KEY.startsWith('sk_test_'),
  'STRIPE_SECRET_KEY must be a sk_test_... key to run payment assertions safely',
);

const stripe = new Stripe(STRIPE_KEY!, { apiVersion: '2026-02-25.clover' });

test.afterAll(async () => {
  await testUsers.cleanup();
  await testUsers.disconnect();
});

test.describe('Payments — setup fee Checkout Session creation', () => {
  test('barber can create a setup-fee checkout session with valid Stripe URL + correct amount + metadata', async () => {
    const barber = await testUsers.createApprovedBarber({ emailLabel: 'pay-setup-fee' });
    // Reset to "not yet verified, no setup fee paid" so the checkout endpoint
    // doesn't reject us with ALREADY_VERIFIED / ALREADY_PAID.
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.barberProfile.update({
      where: { id: barber.barberProfileId! },
      data: { verificationStatus: 'pending', verifiedAt: null, setupFeePaidAt: null },
    });
    await prisma.$disconnect();

    const res = await barber.request.post('/api/barbers/verification-payment/checkout', {
      headers: { 'x-csrf-token': barber.csrfToken },
    });
    expect(res.status(), await res.text()).toBe(200);

    const body = await res.json();
    expect(body.data.url, 'session URL must be a stripe.com checkout URL').toMatch(
      /^https:\/\/checkout\.stripe\.com\//,
    );
    expect([SETUP_INTRO, SETUP_STANDARD]).toContain(body.data.amountCents);
    expect(['intro', 'standard']).toContain(body.data.tier);

    // Reach into Stripe + verify the session itself was created correctly
    const sessionId = body.data.url.split('/').pop()!;
    // Stripe URLs are like https://checkout.stripe.com/c/pay/cs_test_..._secret
    // We can't always extract a usable session ID from the URL, so list recent
    // sessions instead and find ours by metadata.
    const sessions = await stripe.checkout.sessions.list({ limit: 5 });
    const ours = sessions.data.find(
      (s) => s.metadata?.barberProfileId === barber.barberProfileId,
    );
    expect(ours, `couldn't find Stripe session with our barberProfileId metadata`).toBeTruthy();
    expect(ours!.mode).toBe('payment');
    expect(ours!.metadata?.purpose).toBe('verification_setup_fee');
    expect(ours!.amount_total).toBe(body.data.amountCents);
    // payment_intent is null until the session is actually paid — that's
    // tested separately in the webhook handler test below.

    await barber.request.dispose();
    // Avoid the lint warning about unused sessionId — keep for debugging context
    void sessionId;
  });

  test('founding member is exempt — checkout endpoint returns FOUNDING_MEMBER error', async () => {
    const barber = await testUsers.createApprovedBarber({
      emailLabel: 'pay-fm-exempt',
      foundingMember: true,
    });
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.barberProfile.update({
      where: { id: barber.barberProfileId! },
      data: { verificationStatus: 'pending', verifiedAt: null, setupFeePaidAt: null },
    });
    await prisma.$disconnect();

    const res = await barber.request.post('/api/barbers/verification-payment/checkout', {
      headers: { 'x-csrf-token': barber.csrfToken },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('FOUNDING_MEMBER');

    await barber.request.dispose();
  });

  test('already-paid barber gets SETUP_FEE_ALREADY_PAID, not a duplicate session', async () => {
    const barber = await testUsers.createApprovedBarber({ emailLabel: 'pay-double-charge-guard' });
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.barberProfile.update({
      where: { id: barber.barberProfileId! },
      data: {
        verificationStatus: 'pending',
        verifiedAt: null,
        setupFeePaidAt: new Date(), // pre-mark as paid
        setupFeeAmountCents: 9900,
      },
    });
    await prisma.$disconnect();

    const res = await barber.request.post('/api/barbers/verification-payment/checkout', {
      headers: { 'x-csrf-token': barber.csrfToken },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('SETUP_FEE_ALREADY_PAID');

    await barber.request.dispose();
  });
});

test.describe('Payments — webhook handling', () => {
  test.skip(
    !WEBHOOK_SECRET,
    'STRIPE_WEBHOOK_SECRET not set — webhook signature tests need it',
  );

  test('checkout.session.completed for a setup fee writes setupFeePaidAt + payment intent id', async ({
    request,
  }) => {
    const barber = await testUsers.createApprovedBarber({ emailLabel: 'pay-webhook' });
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.barberProfile.update({
      where: { id: barber.barberProfileId! },
      data: { verificationStatus: 'pending', verifiedAt: null, setupFeePaidAt: null },
    });

    // Fabricate a checkout.session.completed event mirroring what Stripe
    // would send in production. The webhook handler only cares about:
    //   - id (the session id)
    //   - mode === 'payment'
    //   - metadata.purpose === 'verification_setup_fee'
    //   - metadata.barberProfileId
    //   - payment_intent (string)
    //   - amount_total (cents)
    const fakePaymentIntentId = `pi_test_pw_${Date.now()}`;
    const eventBody = {
      id: `evt_test_${Date.now()}`,
      object: 'event',
      type: 'checkout.session.completed',
      api_version: '2026-02-25.clover',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: `cs_test_pw_${Date.now()}`,
          object: 'checkout.session',
          mode: 'payment',
          status: 'complete',
          amount_total: 9900,
          customer: 'cus_test_pw',
          payment_intent: fakePaymentIntentId,
          metadata: {
            barberProfileId: barber.barberProfileId,
            purpose: 'verification_setup_fee',
            tier: 'standard',
          },
        },
      },
    };

    const payloadStr = JSON.stringify(eventBody);
    const signature = stripe.webhooks.generateTestHeaderString({
      payload: payloadStr,
      secret: WEBHOOK_SECRET!,
    });

    const res = await request.post('/api/stripe/webhooks', {
      data: payloadStr,
      headers: {
        'stripe-signature': signature,
        'content-type': 'application/json',
      },
    });
    expect(res.status(), await res.text()).toBe(200);

    // Verify the DB write
    const updated = await prisma.barberProfile.findUnique({
      where: { id: barber.barberProfileId! },
      select: {
        setupFeePaidAt: true,
        setupFeeAmountCents: true,
        setupFeeStripePaymentIntentId: true,
      },
    });
    expect(updated?.setupFeePaidAt).not.toBeNull();
    expect(updated?.setupFeeAmountCents).toBe(9900);
    expect(updated?.setupFeeStripePaymentIntentId).toBe(fakePaymentIntentId);

    await prisma.$disconnect();
    await barber.request.dispose();
  });

  test('webhook with invalid signature is rejected with 400', async ({ request }) => {
    const res = await request.post('/api/stripe/webhooks', {
      data: JSON.stringify({ id: 'evt_garbage', type: 'checkout.session.completed' }),
      headers: {
        'stripe-signature': 't=1,v1=invalid',
        'content-type': 'application/json',
      },
    });
    expect(res.status()).toBe(400);
  });
});

/**
 * Approval is where the money actually starts, and it is the one step with two
 * independent variables: which cadence the barber picked at checkout, and
 * whether they paid the founding rate. Four outcomes, and the expensive one —
 * a 365-day free year — is granted by the same code path as the 30-day trial.
 *
 * Asserting only the monthly/standard corner (which this suite did until the
 * pricing change) leaves the free year untested. Every expectation below is
 * derived from the canonical constants rather than restated, so a pricing change
 * moves the test with the product instead of leaving it asserting last quarter's
 * model.
 */
test.describe('Payments — admin approval provisions the right plan and trial', () => {
  test.skip(
    !VERIFIED_MONTHLY_PRICE || !VERIFIED_ANNUAL_PRICE,
    'STRIPE_PRICE_VERIFIED_MONTHLY/_ANNUAL not set — trial subscription creation needs both',
  );

  const COHORTS = [
    {
      label: 'standard member who accepted the default plan gets annual + a 30-day trial',
      emailLabel: 'pay-trial-default',
      foundingMember: false,
      // Deliberately not set: proves annual is the default, not just the
      // value the test wrote a moment earlier.
      selectedPlan: null,
      expectedPrice: () => VERIFIED_ANNUAL_PRICE,
      expectedTrialDays: VERIFIED_TRIAL_DAYS,
    },
    {
      label: 'standard member who opted into monthly gets monthly + a 30-day trial',
      emailLabel: 'pay-trial-monthly',
      foundingMember: false,
      selectedPlan: 'monthly' as const,
      expectedPrice: () => VERIFIED_MONTHLY_PRICE,
      expectedTrialDays: VERIFIED_TRIAL_DAYS,
    },
    {
      label: 'founding member gets a full free year, not the 30-day trial',
      emailLabel: 'pay-trial-founding',
      foundingMember: true,
      selectedPlan: null,
      expectedPrice: () => VERIFIED_ANNUAL_PRICE,
      expectedTrialDays: FOUNDING_TRIAL_DAYS,
    },
  ];

  for (const cohort of COHORTS) {
    test(cohort.label, async () => {
      const admin = await testUsers.createAdmin(`${cohort.emailLabel}-admin`);
      const barber = await testUsers.createApprovedBarber({
        emailLabel: cohort.emailLabel,
        foundingMember: cohort.foundingMember,
      });

      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      const createdCustomer = await stripe.customers.create({
        email: barber.email,
        metadata: { barberProfileId: barber.barberProfileId!, test: 'pw' },
      });

      await prisma.barberProfile.update({
        where: { id: barber.barberProfileId! },
        data: {
          verificationStatus: 'pending',
          verifiedAt: null,
          setupFeePaidAt: new Date(),
          setupFeeAmountCents: cohort.foundingMember ? 4900 : 9900,
          submittedForVerificationAt: new Date(),
          // License document must exist for the admin verify endpoint to
          // accept an approve action (MISSING_LICENSE_DOCUMENT guard).
          licenseDocumentUrl: 'https://example.test/playwright-fake-license.pdf',
          licenseNumber: 'NJ-TEST-PW',
          licenseState: 'NJ',
          ...(cohort.selectedPlan ? { selectedPlan: cohort.selectedPlan } : {}),
        },
      });

      // Subscription row holds the customer id so ensureVerifiedTrialSubscription
      // can reuse it.
      await prisma.subscription.create({
        data: {
          barberProfileId: barber.barberProfileId!,
          stripeCustomerId: createdCustomer.id,
          tier: 'starter', // placeholder; overwritten by the trial path
          status: 'active',
        },
      });

      const res = await admin.request.patch(
        `/api/admin/barbers/${barber.barberProfileId}/verify`,
        {
          headers: { 'x-csrf-token': admin.csrfToken },
          data: { status: 'approved' },
        },
      );
      expect(res.status(), await res.text()).toBe(200);

      const subs = await stripe.subscriptions.list({ customer: createdCustomer.id, limit: 5 });
      const trialSub = subs.data.find((s) => s.status === 'trialing');
      expect(trialSub, 'expected a trialing subscription on a Verified Member price').toBeTruthy();

      expect(
        trialSub!.items.data[0]?.price.id,
        `${cohort.foundingMember ? 'founding' : 'standard'} member should be on the expected cadence`,
      ).toBe(cohort.expectedPrice());

      expect(trialSub!.trial_end, 'subscription should carry a trial_end').toBeTruthy();
      const daysFromNow = (trialSub!.trial_end! * 1000 - Date.now()) / 86400000;
      // ±2 days absorbs clock skew and Stripe's own rounding without letting a
      // 30-vs-365 mixup through.
      expect(
        Math.abs(daysFromNow - cohort.expectedTrialDays),
        `expected a ~${cohort.expectedTrialDays}-day trial, got ~${Math.round(daysFromNow)} days`,
      ).toBeLessThan(2);

      // Cancel + delete so Stripe TEST mode doesn't accumulate garbage.
      await stripe.subscriptions.cancel(trialSub!.id);
      await stripe.customers.del(createdCustomer.id);
      await prisma.$disconnect();
      await admin.request.dispose();
      await barber.request.dispose();
    });
  }
});
