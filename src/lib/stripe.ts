import Stripe from 'stripe';

/**
 * The API version this codebase is written against.
 *
 * Single source: outbound calls, the setup script, the env verifier, and the
 * webhook endpoint registered in Stripe must all agree. It used to be typed out
 * in three files, and the live endpoint quietly ran a fourth value.
 *
 * Bumping it means upgrading the `stripe` package too — the SDK's types only
 * accept versions it ships with — and re-checking payload shapes.
 */
export const STRIPE_API_VERSION = '2026-02-25.clover' as const;

/**
 * Every event the webhook route handles, and therefore exactly the set the
 * Stripe endpoint must be registered for.
 *
 * Registering fewer fails silently — Stripe simply never sends the event and
 * nothing errors. Registering an event with no `case` is harmless but noise.
 * `npm run verify:stripe` compares this list against the live endpoint.
 *
 * Note that Stripe treats `api_version` as create-only on an endpoint, so any
 * dashboard edit that rebuilds it resets the version to the account default.
 * That is why the verifier checks the version too, not just the events.
 */
export const STRIPE_WEBHOOK_EVENTS = [
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_failed',
  'invoice.paid',
  'payment_method.attached',
] as const;

export type StripeWebhookEvent = (typeof STRIPE_WEBHOOK_EVENTS)[number];

const globalForStripe = globalThis as unknown as {
  stripe: Stripe | undefined;
};

export function getStripe(): Stripe {
  if (!globalForStripe.stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    globalForStripe.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: STRIPE_API_VERSION,
      typescript: true,
    });
  }
  return globalForStripe.stripe;
}
