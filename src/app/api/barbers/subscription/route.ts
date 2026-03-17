import { NextResponse } from 'next/server';
import { withAuth, AuthRequest } from '@/lib/api/middleware';
import { handleApiError } from '@/lib/api/errors';
import { prisma } from '@/lib/db';
import { getBarberTier, TIER_LIMITS } from '@/lib/subscription';

async function getSubscriptionHandler(request: AuthRequest) {
  try {
    const userId = request.userId!;

    const barberProfile = await prisma.barberProfile.findUnique({
      where: { userId },
      include: { subscription: true },
    });

    if (!barberProfile) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Barber profile not found' } },
        { status: 404 }
      );
    }

    const tier = await getBarberTier(barberProfile.id);
    const tierConfig = TIER_LIMITS[tier];

    // Get usage counts
    const [portfolioCount, serviceCount, serviceAreaCount, travelDateCount, socialPostCount, contactCount] = await Promise.all([
      prisma.portfolioImage.count({ where: { barberProfileId: barberProfile.id } }),
      prisma.service.count({ where: { barberProfileId: barberProfile.id, isActive: true } }),
      prisma.serviceArea.count({ where: { barberProfileId: barberProfile.id } }),
      prisma.travelDate.count({ where: { barberProfileId: barberProfile.id, endDate: { gte: new Date() }, isActive: true } }),
      prisma.socialPostGeneration.count({ where: { barberProfileId: barberProfile.id, createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
      prisma.contactRequest.count({
        where: {
          barberProfileId: barberProfile.id,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    const portfolioLimit = tierConfig.limits.portfolioImages;
    const serviceLimit = tierConfig.limits.services;
    const serviceAreaLimit = tierConfig.limits.serviceAreas;
    const travelDateLimit = tierConfig.limits.travelDates;
    const socialPostLimit = tierConfig.limits.socialPostsPerMonth;
    const contactLimit = tierConfig.limits.contactRequestsPerMonth;

    return NextResponse.json({
      success: true,
      data: {
        tier,
        status: barberProfile.subscription?.status || 'active',
        currentPeriodEnd: barberProfile.subscription?.currentPeriodEnd?.toISOString() || null,
        trialEndsAt: barberProfile.subscription?.trialEndsAt?.toISOString() || null,
        cancelAtPeriodEnd: barberProfile.subscription?.cancelAtPeriodEnd || false,
        usage: {
          portfolioImages: {
            current: portfolioCount,
            limit: typeof portfolioLimit === 'number' && isFinite(portfolioLimit) ? portfolioLimit : null,
          },
          services: {
            current: serviceCount,
            limit: typeof serviceLimit === 'number' && isFinite(serviceLimit) ? serviceLimit : null,
          },
          serviceAreas: {
            current: serviceAreaCount,
            limit: typeof serviceAreaLimit === 'number' && isFinite(serviceAreaLimit) ? serviceAreaLimit : null,
          },
          travelDates: {
            current: travelDateCount,
            limit: typeof travelDateLimit === 'number' && isFinite(travelDateLimit) ? travelDateLimit : null,
          },
          socialPosts: {
            current: socialPostCount,
            limit: typeof socialPostLimit === 'number' && isFinite(socialPostLimit) ? socialPostLimit : null,
          },
          contactRequests: {
            current: contactCount,
            limit: typeof contactLimit === 'number' && isFinite(contactLimit) ? contactLimit : null,
          },
        },
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuth(getSubscriptionHandler, { requiredRole: 'barber' });
