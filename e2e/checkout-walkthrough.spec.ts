import { test, expect } from '@playwright/test';
import Stripe from 'stripe';
import { loadEnvConfig } from '@next/env';
import { testUsers } from './helpers/test-users';
import { PAYMENT_POLICY, VETTING_FEE_PRICING } from '../src/lib/copy/v2';

/**
 * The one step of the money path nothing else touches: Stripe's own page.
 *
 * cbr-v2-payments.spec.ts creates a Checkout Session and then *fabricates* a
 * signed webhook. That proves our handler is correct given a well-formed event,
 * and proves nothing about whether a human can actually pay us — the hosted page
 * is never loaded, no card is ever typed, and no real payment_intent is ever
 * minted. Everything between "we made a session" and "Stripe told us it was
 * paid" was assumed.
 *
 * This walks it: load the session URL, read what the barber reads, type a test
 * card, and confirm with Stripe that money moved.
 *
 * NOT a PHAST suite. PHAST asserts what breaks under parallelism; this is a
 * single observed walkthrough and is deliberately serial — eight parallel
 * contexts would mint eight real test charges to prove nothing extra.
 *
 *   npm run checkout:walk            headless
 *   npm run checkout:walk:headed     watch it happen
 *
 * Two things it deliberately asserts that no unit test can:
 *   - the prepaid-card notice actually RENDERS. We wrote it into
 *     custom_text.submit.message and, until this spec, had never seen it. Per
 *     CLAUDE.md, stating a policy the platform doesn't act on is the product
 *     claiming something it doesn't do — the least we owe it is proof it's on
 *     screen at the moment a card is typed.
 *   - the amount on Stripe's page equals the amount our seat logic decided.
 *
 * Caveat worth knowing: the selectors below target a third-party DOM we do not
 * control. If Stripe restyles Checkout, this breaks and that is not a product
 * regression. Fix the selectors; don't delete the coverage.
 */

loadEnvConfig(process.cwd());

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;

test.skip(
  !STRIPE_KEY || !STRIPE_KEY.startsWith('sk_test_'),
  'needs a sk_test_ key — this spec types a card number and will not run against live',
);

const stripe = new Stripe(STRIPE_KEY!, { apiVersion: '2026-02-25.clover' });

// Stripe's universal "payment succeeds" test card.
const TEST_CARD = { number: '4242424242424242', expiry: '12 / 34', cvc: '123', zip: '07102' };

test.describe.configure({ mode: 'serial', timeout: 180_000 });

test.afterAll(async () => {
  await testUsers.cleanup();
  await testUsers.disconnect();
});

test('a barber can actually pay the setup fee on Stripe-hosted Checkout', async ({ page }) => {
  const barber = await testUsers.createApprovedBarber({ emailLabel: 'checkout-walk' });

  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  // createApprovedBarber ships them pre-paid; wind back to the state a real
  // applicant is in when they reach the paywall.
  await prisma.barberProfile.update({
    where: { id: barber.barberProfileId! },
    data: { verificationStatus: 'pending', verifiedAt: null, setupFeePaidAt: null },
  });

  // The fixture authenticates an APIRequestContext, not the browser. Without
  // copying the session across, Stripe's redirect lands on /login and the
  // walkthrough looks like a payment failure when the payment was fine.
  const { cookies } = await barber.request.storageState();
  await page.context().addCookies(cookies);

  const res = await barber.request.post('/api/barbers/verification-payment/checkout', {
    headers: { 'x-csrf-token': barber.csrfToken },
  });
  expect(res.status(), await res.text()).toBe(200);
  const { data } = await res.json();

  const expectedDollars = (data.amountCents / 100).toFixed(2);
  expect([VETTING_FEE_PRICING.intro, VETTING_FEE_PRICING.standard]).toContain(
    data.amountCents / 100,
  );

  await page.goto(data.url);

  // What the barber sees before typing anything.
  await expect(page.getByText(`$${expectedDollars}`).first()).toBeVisible({ timeout: 30_000 });

  // The prepaid notice. First time this has ever been asserted to render.
  await expect(
    page.getByText(PAYMENT_POLICY.prepaidNotAcceptedLong, { exact: false }).first(),
    'the prepaid-card policy must be visible on the page where the card is typed',
  ).toBeVisible({ timeout: 30_000 });

  // Stripe pre-checks "Save my information for faster checkout" (Link), which
  // reveals a REQUIRED phone number field. Leaving it checked silently blocks
  // the Pay button on validation — the page just does nothing when clicked.
  // Worth knowing beyond this test: that default is friction on a one-time fee,
  // and every real applicant hits it.
  const linkOptIn = page.locator('#enableStripePass').first();
  const linkPresent = (await linkOptIn.count()) > 0;
  const linkPreChecked = linkPresent && (await linkOptIn.isChecked());
  // Reported every run: this is a live conversion tax that Stripe can re-enable
  // from their side, so it should be visible whenever the walkthrough runs
  // rather than rediscovered.
  // eslint-disable-next-line no-console
  console.log(`  link opt-in present=${linkPresent} preChecked=${linkPreChecked}`);
  if (linkPreChecked) {
    await linkOptIn.uncheck();
  }

  // Stripe's hosted page renders these as plain inputs, not iframes.
  await page.locator('#cardNumber').fill(TEST_CARD.number);
  await page.locator('#cardExpiry').fill(TEST_CARD.expiry);
  await page.locator('#cardCvc').fill(TEST_CARD.cvc);
  await page.locator('#billingName').fill('PW Barber');
  const zip = page.locator('#billingPostalCode');
  if (await zip.count()) await zip.fill(TEST_CARD.zip);

  // Record the redirect chain. Stripe bounces through several URLs of its own
  // before returning, and the app then strips its own query params on mount —
  // so a bare waitForURL that misses the window reports "never came back" when
  // it did. The trail is what makes that distinguishable.
  const trail: string[] = [];
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) trail.push(frame.url());
  });

  await page.locator('button[type="submit"]').first().click();

  // Back on our own origin is the real signal; the exact query may already be
  // stripped by the profile page's cleanup effect.
  await expect
    .poll(() => page.url(), {
      timeout: 90_000,
      message: 'never returned to the app after paying',
    })
    .toContain('localhost:3000');

  expect(
    trail.some((u) => u.includes('setup_fee=paid')),
    `expected a return to the success_url. navigation trail:\n  ${trail.join('\n  ')}`,
  ).toBe(true);

  // Ask Stripe directly rather than trusting the redirect — the redirect proves
  // navigation, not payment.
  const sessions = await stripe.checkout.sessions.list({ limit: 10 });
  const ours = sessions.data.find(
    (s) => s.metadata?.barberProfileId === barber.barberProfileId,
  );
  expect(ours, 'our session should exist in Stripe').toBeTruthy();
  expect(ours!.payment_status, 'Stripe should report the session as paid').toBe('paid');
  expect(ours!.amount_total).toBe(data.amountCents);
  expect(ours!.payment_intent, 'a real payment intent should exist').toBeTruthy();

  // The card that was just charged — the funding type the prepaid policy is
  // about. Recorded here so the walkthrough documents what a real card looks
  // like coming back through this path.
  const pi = await stripe.paymentIntents.retrieve(
    typeof ours!.payment_intent === 'string' ? ours!.payment_intent : ours!.payment_intent!.id,
    { expand: ['payment_method'] },
  );
  const pm = pi.payment_method as Stripe.PaymentMethod | null;
  expect(pm?.card?.funding, 'test card should report as credit').toBeTruthy();

  // setupFeePaidAt is written by the WEBHOOK, which localhost only receives if
  // `stripe listen` is forwarding. Report rather than assert, so the absence of
  // a listener doesn't read as a product failure.
  const profile = await prisma.barberProfile.findUnique({
    where: { id: barber.barberProfileId! },
    select: { setupFeePaidAt: true },
  });
  if (!profile?.setupFeePaidAt) {
    // eslint-disable-next-line no-console
    console.log(
      '\n  note: payment succeeded but setupFeePaidAt is unset — no webhook listener.' +
        '\n  Run `npm run stripe:listen` in another terminal to close the loop.\n',
    );
  }

  await prisma.$disconnect();
  await barber.request.dispose();
});
