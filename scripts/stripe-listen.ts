/**
 * Forward Stripe webhooks to the local dev server.
 *
 *   npm run stripe:listen
 *
 * This exists instead of a raw `stripe listen` because of a live landmine: the
 * Stripe CLI on this machine is logged into a DIFFERENT, retired account
 * (acct_1RonNJ…) and holds a **live-mode** restricted key. A bare `stripe
 * listen` or `stripe trigger` therefore talks to the wrong account in live mode
 * and succeeds quietly — the exact failure shape that made the env vars drift
 * three ways before (CLAUDE.md, "Stripe env vars are a copy").
 *
 * So the key is never taken from CLI config. It comes from the same .env the
 * app reads, and this refuses to run if that key isn't a test key.
 *
 * The forwarding secret it prints (whsec_…) is per-account and differs from the
 * dashboard endpoint's secret. Put it in STRIPE_WEBHOOK_SECRET while you're
 * using it, or signature verification rejects everything with a 400.
 *
 * ── Known fidelity gap: payload version ─────────────────────────────────────
 *
 * The CLI renders forwarded events at the ACCOUNT's default API version and
 * offers no way to pin an arbitrary one (`stripe listen` has only `--latest`).
 * The sandbox account currently defaults to 2026-07-29.dahlia, while the
 * production endpoint is registered at 2026-02-25.clover — the version this
 * code pins in lib/stripe.ts. So events forwarded here are shaped slightly
 * differently from the ones production actually receives.
 *
 * That is not currently a defect, and it is worth knowing why: the fabricated
 * events in cbr-v2-payments.spec.ts are built at clover, and the live-forwarded
 * ones in checkout-walkthrough.spec.ts arrive as dahlia, so between them both
 * payload generations are exercised. `getSubscriptionIdFromInvoice` already
 * tolerates both shapes for exactly this reason.
 *
 * The trap to avoid: treating a green local webhook run as proof that
 * production will parse the same event. If a handler ever reads a field that
 * moved between those versions, this is where the two will disagree.
 */
import { spawn } from 'node:child_process';
import { loadEnvConfig } from '@next/env';
import { STRIPE_WEBHOOK_EVENTS } from '../src/lib/stripe';

loadEnvConfig(process.cwd());

const key = process.env.STRIPE_SECRET_KEY;

if (!key) {
  console.error('STRIPE_SECRET_KEY is not set — nothing to forward with.');
  process.exit(1);
}

if (!key.startsWith('sk_test_')) {
  console.error(
    'Refusing to run: STRIPE_SECRET_KEY is not a sk_test_ key.\n' +
      'Forwarding live webhooks to a dev server would replay real customer events locally.',
  );
  process.exit(1);
}

// HTTPS dev server uses a locally-generated cert the CLI has no reason to trust.
const target = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://localhost:3000'}/api/stripe/webhooks`;

// Registering the same six events the endpoint handles keeps this in step with
// production rather than forwarding a broader or narrower set.
const args = [
  'listen',
  '--api-key',
  key,
  '--forward-to',
  target,
  '--events',
  STRIPE_WEBHOOK_EVENTS.join(','),
  '--skip-verify',
];

console.log(`forwarding ${STRIPE_WEBHOOK_EVENTS.length} event types -> ${target}`);
console.log('copy the whsec_… below into STRIPE_WEBHOOK_SECRET, then restart the dev server.\n');

const child = spawn('stripe', args, { stdio: 'inherit', shell: process.platform === 'win32' });

child.on('error', (err) => {
  console.error('failed to start the Stripe CLI — is it installed and on PATH?', err.message);
  process.exit(1);
});

child.on('exit', (code) => process.exit(code ?? 0));
