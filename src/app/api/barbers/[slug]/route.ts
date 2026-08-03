import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ApiError, handleApiError } from '@/lib/api/errors';
import { getBarberTier } from '@/lib/subscription';
import { createLogger } from '@/lib/logger';

const logger = createLogger('PROFILE_VIEWS');

interface RouteParams {
  params: Promise<{
    slug: string;
  }>;
}

/**
 * Get KV client for view deduplication
 */
async function getKVClient() {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      const { kv } = await import('@vercel/kv');
      return kv;
    } catch {
      return null;
    }
  }
  return null;
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
        serviceAreas: {
          orderBy: [{ state: 'asc' }, { city: 'asc' }],
        },
        travelDates: {
          where: { endDate: { gte: new Date() }, isActive: true },
          orderBy: { startDate: 'asc' },
        },
        portfolioImages: {
          orderBy: { sortOrder: 'asc' },
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

    // Hidden profiles (e.g., IG-quick-imports awaiting location data, or admin-hidden)
    // are not publicly viewable. 404 instead of leaking the existence of an unfilled stub.
    if (barberProfile.isHidden) {
      throw new ApiError(404, 'NOT_FOUND', 'Barber not found');
    }

    // Increment profile views with deduplication (fire and forget)
    (async () => {
      try {
        const kv = await getKVClient();

        if (kv) {
          // Use KV for distributed deduplication (production)
          const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
          const userAgent = request.headers.get('user-agent') || 'unknown';
          const viewKey = `view:${barberProfile.id}:${ip}:${userAgent.substring(0, 100)}`;

          // Check if already viewed in last 24 hours
          const alreadyViewed = await kv.get(viewKey);

          if (!alreadyViewed) {
            // Mark as viewed for 24 hours
            await kv.setex(viewKey, 86400, '1');

            // Increment counter
            await prisma.barberProfile.update({
              where: { id: barberProfile.id },
              data: { profileViews: { increment: 1 } },
            });
          }
        } else {
          // Development: increment without deduplication
          await prisma.barberProfile.update({
            where: { id: barberProfile.id },
            data: { profileViews: { increment: 1 } },
          });
        }
      } catch (error) {
        logger.error('Failed to increment view counter:', error);
      }
    })();

    // Include subscription tier for frontend feature gating
    const tier = await getBarberTier(barberProfile.id);

    return NextResponse.json({
      success: true,
      data: { barberProfile, tier },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
