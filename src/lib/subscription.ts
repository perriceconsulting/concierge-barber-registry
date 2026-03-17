import { prisma } from '@/lib/db';

export type TierName = 'starter' | 'professional' | 'elite';

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
} as const;

export const TRIAL_DAYS = 14;

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

  if (priceId === proMonthly || priceId === proAnnual) return 'professional';
  if (priceId === eliteMonthly || priceId === eliteAnnual) return 'elite';

  return 'starter';
}
