/**
 * Reconcile the Stripe env vars against Stripe itself.
 *
 *   npx tsx scripts/verify-stripe-env.ts
 *   vercel env pull .env.check --environment=production && \
 *     npx tsx scripts/verify-stripe-env.ts .env.check
 *
 * DOSI > Single Source. Stripe is the canonical origin for price and product
 * identity; the STRIPE_PRICE_* env vars are a *copy* of it, and the caveat on
 * that pillar is that a copy must reconcile back to the origin. Nothing ever
 * reconciled these, so they drifted silently and in three different directions
 * at once:
 *
 *   - Development held live-mode price ids that a test key can never resolve
 *   - Production held ids belonging to an account that had been retired
 *   - Neither environment had the VERIFIED_* ids the approval flow requires
 *
 * None of that surfaced as an error, because the code never asks Stripe whether
 * the ids it was handed are real. This script asks. Run it after changing any
 * Stripe env var, and before trusting a deploy.
 *
 * Exits non-zero if anything is wrong, so it can gate a release.
 */
import { readFileSync } from 'fs';
import { loadEnvConfig } from '@next/env';
import Stripe from 'stripe';
import { STRIPE_API_VERSION, STRIPE_WEBHOOK_EVENTS } from '../src/lib/stripe';

/** Price vars the application actually reads. */
const REQUIRED = ['STRIPE_PRICE_VERIFIED_MONTHLY', 'STRIPE_PRICE_VERIFIED_ANNUAL'] as const;

/**
 * Present in Stripe and in env, but read by zero lines of src/. The setup fee is
 * built inline with price_data from VETTING_FEE_PRICING (lib/copy/v2.ts), so
 * these are parity only — their absence breaks nothing.
 */
const UNUSED = [
  'STRIPE_PRICE_SETUP_INTRO',
  'STRIPE_PRICE_SETUP_STANDARD',
  'STRIPE_PRICE_SETUP_EXPEDITED',
] as const;

/** Retired with the v1 pricing ladder. Their presence is now a smell. */
const RETIRED = [
  'STRIPE_PRICE_PRO_MONTHLY',
  'STRIPE_PRICE_PRO_ANNUAL',
  'STRIPE_PRICE_ELITE_MONTHLY',
  'STRIPE_PRICE_ELITE_ANNUAL',
] as const;

function loadEnvFile(path: string) {
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;
    // `vercel env pull` writes values wrapped in double quotes. Passing those
    // through verbatim sends a quoted key to Stripe and gets a 401 that looks
    // like a bad credential rather than a parsing bug.
    process.env[match[1]] = match[2].trim().replace(/^"(.*)"$/, '$1');
  }
}

/**
 * Check the registered webhook endpoint against what the code expects.
 *
 * Two things drift here, both silently:
 *
 *   events — an unregistered event is simply never sent. No error, no retry,
 *            no clue. Dropping checkout.session.completed means barbers pay
 *            and nothing records it.
 *
 *   api_version — Stripe treats this as create-only on an endpoint, so any
 *            dashboard edit that rebuilds it resets to the account default.
 *            That already happened once: adding one event moved a clover
 *            endpoint to dahlia, changing payload shapes under the code.
 */
async function checkWebhookEndpoint(stripe: Stripe): Promise<number> {
  console.log('');
  const endpoints = await stripe.webhookEndpoints.list({ limit: 20 });
  const live = endpoints.data.filter((e) => e.status === 'enabled');

  if (live.length === 0) {
    console.log('WARN  webhook endpoint                  none registered on this account');
    return 0;
  }

  let failures = 0;
  for (const endpoint of live) {
    console.log(`endpoint: ${endpoint.url}`);

    if (endpoint.api_version !== STRIPE_API_VERSION) {
      console.log(
        `FAIL    api_version ${endpoint.api_version} != ${STRIPE_API_VERSION} — recreate the endpoint; it cannot be updated`,
      );
      failures++;
    } else {
      console.log(`OK      api_version ${endpoint.api_version}`);
    }

    const registered = new Set(endpoint.enabled_events);
    const missing = STRIPE_WEBHOOK_EVENTS.filter((e) => !registered.has(e) && !registered.has('*'));
    const extra = endpoint.enabled_events.filter(
      (e) => e !== '*' && !(STRIPE_WEBHOOK_EVENTS as readonly string[]).includes(e),
    );

    if (missing.length) {
      console.log(`FAIL    missing events: ${missing.join(', ')} — handled in code, never sent`);
      failures++;
    }
    if (extra.length) {
      console.log(`note    extra events: ${extra.join(', ')} — sent but not handled`);
    }
    if (!missing.length) {
      console.log(`OK      all ${STRIPE_WEBHOOK_EVENTS.length} handled events registered`);
    }
  }
  return failures;
}

async function main() {
  const explicitFile = process.argv[2];
  if (explicitFile) {
    loadEnvFile(explicitFile);
    console.log(`env source: ${explicitFile}\n`);
  } else {
    loadEnvConfig(process.cwd());
    console.log('env source: .env.local / .env\n');
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    console.error('FAIL  STRIPE_SECRET_KEY is not set — nothing can be checked.');
    process.exit(1);
  }

  const stripe = new Stripe(secret, { apiVersion: STRIPE_API_VERSION });
  const account = await stripe.accounts.retrieve();
  const mode = secret.startsWith('sk_live_') ? 'LIVE' : 'TEST';

  console.log(`account : ${account.id}  ${account.settings?.dashboard?.display_name ?? ''}`);
  console.log(`key mode: ${mode}\n`);

  let failures = 0;

  for (const name of REQUIRED) {
    const id = process.env[name];
    if (!id) {
      console.log(`FAIL  ${name.padEnd(32)} not set — barber approval creates no subscription`);
      failures++;
      continue;
    }
    try {
      const price = await stripe.prices.retrieve(id);
      const amount = `$${((price.unit_amount ?? 0) / 100).toFixed(2)}`;
      const cadence = price.recurring?.interval ?? 'one-time';
      const flag = price.active ? 'OK  ' : 'WARN';
      if (!price.active) failures++;
      console.log(`${flag}  ${name.padEnd(32)} ${amount} / ${cadence}${price.active ? '' : '  (INACTIVE)'}`);
    } catch (error) {
      console.log(`FAIL  ${name.padEnd(32)} ${(error as Error).message.split(';')[0]}`);
      failures++;
    }
  }

  for (const name of UNUSED) {
    if (process.env[name]) console.log(`note  ${name.padEnd(32)} set, but read by no application code`);
  }

  for (const name of RETIRED) {
    if (process.env[name]) {
      console.log(`WARN  ${name.padEnd(32)} retired v1 variable is still set`);
    }
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.log('WARN  STRIPE_WEBHOOK_SECRET              not set — signature verification will reject everything');
  } else if (!webhookSecret.startsWith('whsec_')) {
    console.log('FAIL  STRIPE_WEBHOOK_SECRET              does not look like a signing secret');
    failures++;
  }

  failures += await checkWebhookEndpoint(stripe);

  console.log(failures === 0 ? '\nAll required Stripe config reconciles with Stripe.' : `\n${failures} problem(s).`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
