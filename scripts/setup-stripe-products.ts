/**
 * One-shot Stripe product/price setup for CBR v2.0.
 *
 * Creates the two v2 Stripe products (Verification Setup Fee + Verified
 * Member) with all 5 prices. Idempotent — looks up by lookup_key before
 * creating, so re-runs are safe.
 *
 * Reads STRIPE_SECRET_KEY from .env.local (test mode) or env (prod). Run with:
 *   npx tsx scripts/setup-stripe-products.ts
 *
 * For LIVE mode, set STRIPE_SECRET_KEY=sk_live_... inline:
 *   STRIPE_SECRET_KEY=sk_live_... npx tsx scripts/setup-stripe-products.ts
 *
 * Outputs a block of env-var lines at the end to paste into Vercel.
 *
 * NOTE: Stripe prices are immutable. To change an amount, you must create
 * a new price (re-run the script with a different `unit_amount`) and the
 * old one gets deactivated. Subscribers on the old price are NOT auto-
 * migrated — you have to update each subscription in Stripe Dashboard.
 */
import Stripe from 'stripe';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY is not set. Aborting.');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-02-25.clover',
});

const MODE = process.env.STRIPE_SECRET_KEY.startsWith('sk_live_')
  ? 'LIVE'
  : 'TEST';

// ─── Spec ─────────────────────────────────────────────────────────────────────
// Lookup keys are stable identifiers Stripe lets us use to look prices up
// instead of memorizing IDs. Each price gets a unique key.

interface PriceSpec {
  lookupKey: string;
  /** USD cents. Stripe stores in the currency's smallest unit. */
  unitAmount: number;
  currency: 'usd';
  recurring?: { interval: 'month' | 'year' };
  envVar: string;
  nickname: string;
}

interface ProductSpec {
  name: string;
  description: string;
  /** Used to look up the product idempotently. Stripe doesn't have a native
   *  product lookup_key field, so we tag with metadata.cbr_key instead. */
  cbrKey: string;
  prices: PriceSpec[];
}

const PRODUCTS: ProductSpec[] = [
  {
    name: 'Verification Setup Fee',
    description:
      'One-time fee that funds the manual three-point license verification (state license number, state of issue, expiration date) for the Concierge Barber Registry.',
    cbrKey: 'cbr_v2_setup_fee',
    prices: [
      {
        lookupKey: 'cbr_v2_setup_intro',
        unitAmount: 4900,
        currency: 'usd',
        envVar: 'STRIPE_PRICE_SETUP_INTRO',
        nickname: 'Founding Member intro ($49)',
      },
      {
        lookupKey: 'cbr_v2_setup_standard',
        unitAmount: 9900,
        currency: 'usd',
        envVar: 'STRIPE_PRICE_SETUP_STANDARD',
        nickname: 'Standard ($99)',
      },
      {
        lookupKey: 'cbr_v2_setup_expedited',
        unitAmount: 5000,
        currency: 'usd',
        envVar: 'STRIPE_PRICE_SETUP_EXPEDITED',
        nickname: 'Expedited 24-hr add-on (+$50)',
      },
    ],
  },
  {
    name: 'Verified Member',
    description:
      'Recurring subscription for license-verified barbers on the Concierge Barber Registry. Includes the Grooming Passport, the Travel Referral Network, the encrypted client vault, the digital wallet pass, and the Concierge Privacy Agreement template.',
    cbrKey: 'cbr_v2_verified_member',
    prices: [
      // Annual is the headline plan; monthly exists as the opt-out. $299/yr
      // against $39/mo is a ~36% saving, which is what makes annual the default
      // choice at application checkout.
      {
        lookupKey: 'cbr_v2_verified_monthly',
        unitAmount: 3900,
        currency: 'usd',
        recurring: { interval: 'month' },
        envVar: 'STRIPE_PRICE_VERIFIED_MONTHLY',
        nickname: 'Monthly ($39/mo)',
      },
      {
        lookupKey: 'cbr_v2_verified_annual',
        unitAmount: 29900,
        currency: 'usd',
        recurring: { interval: 'year' },
        envVar: 'STRIPE_PRICE_VERIFIED_ANNUAL',
        nickname: 'Annual ($299/yr — best value)',
      },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function ensureProduct(spec: ProductSpec): Promise<Stripe.Product> {
  // Stripe doesn't index metadata for product search, but we can list and
  // filter. There aren't many products on a typical account so list-and-find
  // is fine.
  const list = await stripe.products.list({ active: true, limit: 100 });
  const existing = list.data.find((p) => p.metadata?.cbr_key === spec.cbrKey);
  if (existing) {
    console.log(`  product exists: ${spec.name} (${existing.id})`);
    return existing;
  }
  const created = await stripe.products.create({
    name: spec.name,
    description: spec.description,
    metadata: { cbr_key: spec.cbrKey, cbr_version: '2.0' },
  });
  console.log(`  product created: ${spec.name} (${created.id})`);
  return created;
}

async function ensurePrice(
  product: Stripe.Product,
  spec: PriceSpec,
): Promise<Stripe.Price> {
  // Lookup keys make idempotency trivial.
  const list = await stripe.prices.list({
    lookup_keys: [spec.lookupKey],
    active: true,
    limit: 1,
  });
  if (list.data[0]) {
    const existing = list.data[0];

    if (existing.unit_amount === spec.unitAmount) {
      console.log(`  price exists: ${spec.nickname} (${existing.id})`);
      return existing;
    }

    // Amount changed. Stripe prices are immutable, so the only way to reprice
    // is to mint a new one and retire the old. `transfer_lookup_key` moves the
    // stable key across in the same call, so callers keep resolving by key.
    //
    // This used to just warn and return the stale price, which meant editing an
    // amount here silently did nothing — the script reported success while the
    // old number stayed live.
    //
    // Existing subscribers are NOT moved. Stripe keeps billing them at the old
    // price; migrating them is a separate, deliberate act.
    console.log(
      `  repricing ${spec.lookupKey}: ${existing.unit_amount}c -> ${spec.unitAmount}c`,
    );
    const replacement = await stripe.prices.create({
      product: product.id,
      unit_amount: spec.unitAmount,
      currency: spec.currency,
      lookup_key: spec.lookupKey,
      transfer_lookup_key: true,
      nickname: spec.nickname,
      ...(spec.recurring && { recurring: spec.recurring }),
      metadata: { cbr_version: '2.0', replaces: existing.id },
    });
    await stripe.prices.update(existing.id, { active: false });
    console.log(`  price replaced: ${spec.nickname} (${replacement.id}), archived ${existing.id}`);
    return replacement;
  }
  const created = await stripe.prices.create({
    product: product.id,
    unit_amount: spec.unitAmount,
    currency: spec.currency,
    lookup_key: spec.lookupKey,
    nickname: spec.nickname,
    ...(spec.recurring && { recurring: spec.recurring }),
    metadata: { cbr_version: '2.0' },
  });
  console.log(`  price created: ${spec.nickname} (${created.id})`);
  return created;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🔧 Stripe setup — mode: ${MODE}\n`);

  const envLines: string[] = [];

  for (const productSpec of PRODUCTS) {
    console.log(`▸ ${productSpec.name}`);
    const product = await ensureProduct(productSpec);
    for (const priceSpec of productSpec.prices) {
      const price = await ensurePrice(product, priceSpec);
      envLines.push(`${priceSpec.envVar}=${price.id}`);
    }
    console.log('');
  }

  console.log('═'.repeat(60));
  console.log(`✓ All products + prices ready in Stripe ${MODE} mode.\n`);
  console.log('Paste these into Vercel project env vars:\n');
  for (const line of envLines) console.log(`  ${line}`);
  console.log('');
  if (MODE === 'TEST') {
    console.log(
      'These are TEST mode price IDs (start with price_...). To create LIVE prices, re-run with:\n  STRIPE_SECRET_KEY=sk_live_... npx tsx scripts/setup-stripe-products.ts\n',
    );
  }
}

main().catch((err) => {
  console.error('\n✗ Setup failed:', err.message);
  if (err.raw) console.error('  Stripe response:', err.raw);
  process.exit(1);
});
