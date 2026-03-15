import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api/middleware';
import { handleApiError, successResponse } from '@/lib/api/errors';

// GET /api/admin/dashboard - Dashboard stats (admin only)
const dashboardHandler = async (_request: NextRequest) => {
  try {
    const [
      totalBarbers,
      pendingVerifications,
      totalClients,
      totalReviews,
      pendingBarbers,
      recentSignups,
    ] = await Promise.all([
      prisma.barberProfile.count(),
      prisma.barberProfile.count({
        where: { verificationStatus: 'pending' },
      }),
      prisma.user.count({
        where: { role: 'client' },
      }),
      prisma.review.count(),
      prisma.barberProfile.findMany({
        where: { verificationStatus: 'pending' },
        select: {
          id: true,
          displayName: true,
          city: true,
          submittedForVerificationAt: true,
          user: {
            select: {
              email: true,
            },
          },
        },
        orderBy: { submittedForVerificationAt: 'desc' },
        take: 5,
      }),
      prisma.user.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    return successResponse({
      stats: {
        totalBarbers,
        pendingVerifications,
        totalClients,
        totalReviews,
      },
      pendingBarbers,
      recentSignups,
    });
  } catch (error) {
    return handleApiError(error);
  }
};

export const GET = withAuth(dashboardHandler, { requiredRole: 'admin' });
