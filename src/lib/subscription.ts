import { prisma } from '@/lib/db';
import { VETTING_FEE_PRICING, VERIFIED_TRIAL_DAYS } from '@/lib/copy/v2';

export type TierName = 'starter' | 'professional' | 'elite' | 'verified';

export type FeatureKey =
  | 'portfolioImages'
  | 'services'
  | 'serviceAreas'
  | 'travelDates'
  | 'socialPostsPerMonth'
  | 'contactRequestsPerMonth'
  | 'reviewResponses'
  | 'seoStructuredData'
  | 'featuredInSearch'
  | 'profileBadge';

interface TierConfig {
  name: string;
  displayName: string;
  limits: Record<FeatureKey, number | boolean | string | null>;
}

export const TIER_LIMITS: Record<TierName, TierConfig> = {
  starter: {
    name: 'starter',
    displayName: 'Starter',
    limits: {
      portfolioImages: 5,
      services: 3,
      serviceAreas: 2,
      travelDates: 1,
      socialPostsPerMonth: 3,
      contactRequestsPerMonth: 10,
      reviewResponses: false,
      seoStructuredData: false,
      featuredInSearch: false,
      profileBadge: null,
    },
  },
  professional: {
    name: 'professional',
    displayName: 'Professional',
    limits: {
      portfolioImages: 20,
      services: 10,
      serviceAreas: 10,
      travelDates: 5,
      socialPostsPerMonth: 20,
      contactRequestsPerMonth: Infinity,
      reviewResponses: true,
      seoStructuredData: true,
      featuredInSearch: false,
      profileBadge: 'Pro',
    },
  },
  elite: {
    name: 'elite',
    displayName: 'Elite',
    limits: {
      portfolioImages: 100,
      services: 50,
      serviceAreas: 20,
      travelDates: 10,
      socialPostsPerMonth: Infinity,
      contactRequestsPerMonth: Infinity,
      reviewResponses: true,
      seoStructuredData: true,
      featuredInSearch: true,
      profileBadge: 'Elite',
    },
  },
  // CBR v2.0 — single flat tier post-verification (FEAT-001).
  // Replaces the old starter/pro/elite ladder for new signups.
  verified: {
    name: 'verified',
    displayName: 'Verified Member',
    limits: {
      portfolioImages: 100,
      services: 50,
      serviceAreas: 20,
      travelDates: 10,
      socialPostsPerMonth: Infinity,
      contactRequestsPerMonth: Infinity,
      reviewResponses: true,
      seoStructuredData: true,
      featuredInSearch: true,
      profileBadge: 'Verified',
    },
  },
};

export const SUBSCRIPTION_PRICES = {
  professional: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY!,
    annual: process.env.STRIPE_PRICE_PRO_ANNUAL!,
  },
  elite: {
    monthly: process.env.STRIPE_PRICE_ELITE_MONTHLY!,
    annual: process.env.STRIPE_PRICE_ELITE_ANNUAL!,
  },
  // CBR v2.0 — Verified Member recurring price (post-verification trial conversion)
  verified: {
    monthly: process.env.STRIPE_PRICE_VERIFIED_MONTHLY!,
    annual: process.env.STRIPE_PRICE_VERIFIED_ANNUAL!,
  },
} as const;

// TRIAL_DAYS (14) removed with the v1 checkout route that was its only consumer.
// Trial lengths are VERIFIED_TRIAL_DAYS and FOUNDING_TRIAL_DAYS in lib/copy/v2.

/**
 * CBR v2.0 — One-time setup-fee pricing (FEAT-001).
 * Charged before a barber can submit for verification.
 * Founding Members (first {@link VETTING_FEE_PRICING.intro_limit}) pay the intro rate.
 */
export const SETUP_FEE_PRICING = VETTING_FEE_PRICING;
// Re-exported from lib/copy/v2 so both the billing code and the customer copy
// read one number. Defined there because copy cannot import from this module.
export { VERIFIED_TRIAL_DAYS };

/**
 * How long a Founding seat stays held after checkout starts, before the seat is
 * released again. Long enough to finish paying on Stripe's page, short enough
 * that abandoned checkouts do not sit on a seat.
 */
export const SEAT_RESERVATION_MINUTES = 30;

/**
 * Atomically claim a Founding seat and return the fee that applies.
 *
 * The naive version of this — count paid seats, then decide — is a
 * check-then-act race with a very wide window. `setupFeePaidAt` is only written
 * by the webhook once payment completes, so the count stays stale for as long
 * as the applicant spends on Stripe's payment page. Fifteen people starting
 * checkout while the count reads zero all get told they are Founding Members.
 *
 * That is not a rounding error under the current model: each extra Founding
 * Member is $50 under-charged on the fee AND a 365-day free year, so eleven
 * concurrent applicants can give away more than a thousand dollars without
 * anyone doing anything wrong.
 *
 * Seats are therefore counted as paid-OR-reserved, and the reservation is
 * written inside the same serializable transaction that counts. Two concurrent
 * claims for the last seat cannot both succeed — Postgres fails one, and the
 * retry sees the seat taken and quotes the standard rate.
 */
export async function claimSetupFeeSeat(barberProfileId: string): Promise<{
  amountCents: number;
  tier: 'intro' | 'standard';
  introSeatsRemaining: number;
}> {
  const attempt = async () =>
    prisma.$transaction(
      async (tx) => {
        const cutoff = new Date(Date.now() - SEAT_RESERVATION_MINUTES * 60_000);

        // Exclude self: re-entering checkout must not count your own held seat
        // against you and bump you to the standard rate.
        const taken = await tx.barberProfile.count({
          where: {
            id: { not: barberProfileId },
            OR: [
              { setupFeePaidAt: { not: null } },
              { setupFeeReservedAt: { gt: cutoff } },
            ],
          },
        });

        const introSeatsRemaining = Math.max(0, SETUP_FEE_PRICING.intro_limit - taken);

        if (introSeatsRemaining > 0) {
          await tx.barberProfile.update({
            where: { id: barberProfileId },
            data: { setupFeeReservedAt: new Date() },
          });
          return {
            amountCents: SETUP_FEE_PRICING.intro * 100,
            tier: 'intro' as const,
            introSeatsRemaining,
          };
        }

        return {
          amountCents: SETUP_FEE_PRICING.standard * 100,
          tier: 'standard' as const,
          introSeatsRemaining: 0,
        };
      },
      { isolationLevel: 'Serializable' },
    );

  // Serializable conflicts are expected under contention and are exactly the
  // outcome we want — retry, and the loser sees the seat gone.
  try {
    return await attempt();
  } catch {
    return attempt();
  }
}

/**
 * Read-only preview of the current fee, for display. Does NOT hold a seat —
 * use claimSetupFeeSeat when actually starting checkout.
 */
export async function resolveSetupFeeAmountCents(): Promise<{
  amountCents: number;
  tier: 'intro' | 'standard';
  introSeatsRemaining: number;
}> {
  const paidCount = await prisma.barberProfile.count({
    where: { setupFeePaidAt: { not: null } },
  });
  const introSeatsRemaining = Math.max(0, SETUP_FEE_PRICING.intro_limit - paidCount);
  if (introSeatsRemaining > 0) {
    return {
      amountCents: SETUP_FEE_PRICING.intro * 100,
      tier: 'intro',
      introSeatsRemaining,
    };
  }
  return {
    amountCents: SETUP_FEE_PRICING.standard * 100,
    tier: 'standard',
    introSeatsRemaining: 0,
  };
}

export interface FeatureAccess {
  allowed: boolean;
  limit: number | null;
  current: number;
  upgradeRequired: boolean;
  currentTier: TierName;
}

/**
 * Get the current subscription tier for a barber profile.
 * Missing subscription row = starter tier.
 */
export async function getBarberTier(barberProfileId: string): Promise<TierName> {
  const subscription = await prisma.subscription.findUnique({
    where: { barberProfileId },
    select: { tier: true, status: true },
  });

  if (!subscription) return 'starter';

  // Only active/trialing subscriptions count
  if (subscription.status === 'active' || subscription.status === 'trialing') {
    return subscription.tier as TierName;
  }

  return 'starter';
}

/**
 * Check whether a barber can use a specific feature, with current usage counts.
 */
export async function checkFeatureAccess(
  barberProfileId: string,
  feature: FeatureKey
): Promise<FeatureAccess> {
  const tier = await getBarberTier(barberProfileId);
  const tierConfig = TIER_LIMITS[tier];
  const limit = tierConfig.limits[feature];

  // Boolean features
  if (typeof limit === 'boolean') {
    return {
      allowed: limit,
      limit: null,
      current: 0,
      upgradeRequired: !limit,
      currentTier: tier,
    };
  }

  // String/null features (badges)
  if (typeof limit === 'string' || limit === null) {
    return {
      allowed: limit !== null,
      limit: null,
      current: 0,
      upgradeRequired: limit === null,
      currentTier: tier,
    };
  }

  // Numeric limits — get current usage
  let current = 0;

  if (feature === 'portfolioImages') {
    current = await prisma.portfolioImage.count({
      where: { barberProfileId },
    });
  } else if (feature === 'services') {
    current = await prisma.service.count({
      where: { barberProfileId, isActive: true },
    });
  } else if (feature === 'serviceAreas') {
    current = await prisma.serviceArea.count({
      where: { barberProfileId },
    });
  } else if (feature === 'travelDates') {
    current = await prisma.travelDate.count({
      where: { barberProfileId, endDate: { gte: new Date() }, isActive: true },
    });
  } else if (feature === 'socialPostsPerMonth') {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    current = await prisma.socialPostGeneration.count({
      where: {
        barberProfileId,
        createdAt: { gte: thirtyDaysAgo },
      },
    });
  } else if (feature === 'contactRequestsPerMonth') {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    current = await prisma.contactRequest.count({
      where: {
        barberProfileId,
        createdAt: { gte: thirtyDaysAgo },
      },
    });
  }

  return {
    allowed: current < limit,
    limit: limit === Infinity ? null : limit,
    current,
    upgradeRequired: current >= limit && tier !== 'elite',
    currentTier: tier,
  };
}

/**
 * Get a barber profile with its subscription included.
 */
export async function getBarberWithSubscription(userId: string) {
  return prisma.barberProfile.findUnique({
    where: { userId },
    include: {
      subscription: true,
    },
  });
}

/**
 * Map a Stripe price ID to a tier name.
 */
export function getTierFromPriceId(priceId: string): TierName {
  const proMonthly = process.env.STRIPE_PRICE_PRO_MONTHLY;
  const proAnnual = process.env.STRIPE_PRICE_PRO_ANNUAL;
  const eliteMonthly = process.env.STRIPE_PRICE_ELITE_MONTHLY;
  const eliteAnnual = process.env.STRIPE_PRICE_ELITE_ANNUAL;
  const verifiedMonthly = process.env.STRIPE_PRICE_VERIFIED_MONTHLY;
  const verifiedAnnual = process.env.STRIPE_PRICE_VERIFIED_ANNUAL;

  if (priceId === proMonthly || priceId === proAnnual) return 'professional';
  if (priceId === eliteMonthly || priceId === eliteAnnual) return 'elite';
  if (priceId === verifiedMonthly || priceId === verifiedAnnual) return 'verified';

  // Falling through means Stripe handed us a price this deployment does not
  // recognise — almost always an env drift: a rotated key, a price minted in a
  // different account, or a var that was never set. Callers write this straight
  // into Subscription.tier, so an unrecognised price silently DOWNGRADES a
  // paying barber to the free tier. Say so loudly; the return value cannot
  // change without breaking those callers, but the silence can.
  console.error(
    `[subscription] Unrecognised Stripe price ${priceId} — defaulting to 'starter'. ` +
      `A paying subscriber may have just been downgraded. Check STRIPE_PRICE_* env vars ` +
      `against the account the current key belongs to: npx tsx scripts/verify-stripe-env.ts`,
  );

  return 'starter';
}
