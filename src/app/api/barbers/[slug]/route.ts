import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ApiError, handleApiError } from '@/lib/api/errors';

interface RouteParams {
  params: Promise<{
    slug: string;
  }>;
}

// GET /api/barbers/:slug - Get single barber profile by slug
export async function GET(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const params = await context.params;
    const { slug } = params;

    const barberProfile = await prisma.barberProfile.findUnique({
      where: { slug },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        specialties: {
          include: {
            specialty: true,
          },
        },
        services: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        portfolioImages: {
          orderBy: { sortOrder: 'asc' },
        },
        operatingHours: {
          orderBy: { dayOfWeek: 'asc' },
        },
        reviews: {
          where: { isVisible: true },
          include: {
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!barberProfile) {
      throw new ApiError(404, 'NOT_FOUND', 'Barber not found');
    }

    // Increment profile views (fire and forget)
    prisma.barberProfile.update({
      where: { id: barberProfile.id },
      data: { profileViews: { increment: 1 } },
    }).catch(() => {}); // Ignore errors

    return NextResponse.json({
      success: true,
      data: { barberProfile },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
