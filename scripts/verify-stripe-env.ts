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
    if (match) process.env[match[1]] = match[2].trim();
  }
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

  const stripe = new Stripe(secret, { apiVersion: '2026-02-25.clover' });
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

  console.log(failures === 0 ? '\nAll required Stripe env vars reconcile with Stripe.' : `\n${failures} problem(s).`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
