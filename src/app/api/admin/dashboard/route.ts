import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api/middleware';
import { handleApiError, successResponse } from '@/lib/api/errors';

// GET /api/admin/dashboard - Dashboard stats (admin only)
const dashboardHandler = async (_request: NextRequest) => {
  try {
    const [
      totalBarbers,
      claimedBarbers,
      pendingVerifications,
      totalClients,
      totalReviews,
      pendingBarbers,
      recentSignups,
      recentImports,
    ] = await Promise.all([
      prisma.barberProfile.count(),
      prisma.barberProfile.count({ where: { claimStatus: 'claimed' } }),
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
      // Real self-signups only — exclude stub users created by admin imports
      prisma.user.findMany({
        where: { isStub: false },
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
      // Recently imported (admin-created) profiles, labeled distinctly so the
      // dashboard doesn't misrepresent them as organic signups.
      prisma.barberProfile.findMany({
        where: {
          claimStatus: { in: ['unclaimed', 'claim_sent'] },
          dataSource: { in: ['manual_admin', 'google_places', 'state_license'] },
        },
        select: {
          id: true,
          displayName: true,
          shopName: true,
          city: true,
          state: true,
          dataSource: true,
          claimStatus: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    return successResponse({
      stats: {
        totalBarbers,
        claimedBarbers,
        unclaimedBarbers: totalBarbers - claimedBarbers,
        pendingVerifications,
        totalClients,
        totalReviews,
      },
      pendingBarbers,
      recentSignups,
      recentImports,
    });
  } catch (error) {
    return handleApiError(error);
  }
};

export const GET = withAuth(dashboardHandler, { requiredRole: 'admin' });
