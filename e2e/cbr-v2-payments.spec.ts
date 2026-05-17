import { test, expect } from '@playwright/test';
import Stripe from 'stripe';
import { loadEnvConfig } from '@next/env';
import { testUsers } from './helpers/test-users';

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

test.describe('Payments — admin approval creates Verified Member trial subscription', () => {
  test.skip(
    !VERIFIED_MONTHLY_PRICE,
    'STRIPE_PRICE_VERIFIED_MONTHLY not set — trial subscription creation needs it',
  );

  test('after setup fee paid, admin approve creates trial sub on Verified Member monthly price', async () => {
    const admin = await testUsers.createAdmin('pay-admin');
    const barber = await testUsers.createApprovedBarber({ emailLabel: 'pay-trial-sub' });

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    // Set up: paid setup fee + pending verification (so admin approve has
    // something to flip)
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
        setupFeeAmountCents: 9900,
        submittedForVerificationAt: new Date(),
        // License document must exist for the admin verify endpoint to
        // accept an approve action (MISSING_LICENSE_DOCUMENT guard).
        licenseDocumentUrl: 'https://example.test/playwright-fake-license.pdf',
        licenseNumber: 'NJ-TEST-PW',
        licenseState: 'NJ',
      },
    });
    // Subscription row holds the customer id so ensureVerifiedTrialSubscription
    // can reuse it.
    await prisma.subscription.create({
      data: {
        barberProfileId: barber.barberProfileId!,
        stripeCustomerId: createdCustomer.id,
        tier: 'starter', // placeholder; will be overwritten by trial path
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

    // Verify the Stripe subscription was created
    const subs = await stripe.subscriptions.list({
      customer: createdCustomer.id,
      limit: 5,
    });
    const trialSub = subs.data.find((s) => s.status === 'trialing');
    expect(trialSub, 'expected a trialing subscription on the Verified Member price').toBeTruthy();
    expect(trialSub!.items.data[0]?.price.id).toBe(VERIFIED_MONTHLY_PRICE);
    expect(trialSub!.trial_end, 'should have a trial_end ~30 days from now').toBeTruthy();
    const trialEndsMs = trialSub!.trial_end! * 1000;
    const daysFromNow = (trialEndsMs - Date.now()) / 86400000;
    expect(daysFromNow).toBeGreaterThan(28);
    expect(daysFromNow).toBeLessThan(32);

    // Cleanup: cancel the test sub + delete the customer so Stripe TEST mode
    // doesn't accumulate garbage.
    await stripe.subscriptions.cancel(trialSub!.id);
    await stripe.customers.del(createdCustomer.id);
    await prisma.$disconnect();
    await admin.request.dispose();
    await barber.request.dispose();
  });
});
