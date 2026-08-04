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
 * The forwarding secret it prints (whsec_…) is per-session and differs from the
 * dashboard endpoint's secret. Put it in STRIPE_WEBHOOK_SECRET while you're
 * using it, or signature verification rejects everything with a 400.
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
