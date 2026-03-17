import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, AuthRequest } from '@/lib/api/middleware';
import { ApiError, handleApiError } from '@/lib/api/errors';
import { checkFeatureAccess } from '@/lib/subscription';
import { z } from 'zod';

const generateSchema = z.object({
  templateType: z.string().max(50),
  platform: z.string().max(50),
});

async function getBarberProfileId(userId: string) {
  const profile = await prisma.barberProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) throw new ApiError(404, 'NOT_FOUND', 'Barber profile not found');
  return profile.id;
}

// GET /api/barbers/social-posts — get monthly usage
const getHandler = async (request: AuthRequest) => {
  try {
    const barberProfileId = await getBarberProfileId(request.userId!);
    const access = await checkFeatureAccess(barberProfileId, 'socialPostsPerMonth');

    return NextResponse.json({
      success: true,
      data: {
        current: access.current,
        limit: access.limit,
        allowed: access.allowed,
        tier: access.currentTier,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
};

// POST /api/barbers/social-posts — record a generation
const postHandler = async (request: AuthRequest) => {
  try {
    const barberProfileId = await getBarberProfileId(request.userId!);
    const access = await checkFeatureAccess(barberProfileId, 'socialPostsPerMonth');

    if (!access.allowed) {
      throw new ApiError(403, 'LIMIT_REACHED', `You've reached your ${access.currentTier} plan limit of ${access.limit} social posts per month. Upgrade to create more.`);
    }

    const body = await request.json();
    const { templateType, platform } = generateSchema.parse(body);

    await prisma.socialPostGeneration.create({
      data: { barberProfileId, templateType, platform },
    });

    return NextResponse.json({
      success: true,
      data: {
        current: access.current + 1,
        limit: access.limit,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
};

export const GET = withAuth(getHandler, { requiredRole: 'barber' });
export const POST = withAuth(postHandler, { requiredRole: 'barber' });
