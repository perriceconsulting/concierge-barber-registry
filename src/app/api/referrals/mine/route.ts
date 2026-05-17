import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, AuthRequest } from '@/lib/api/middleware';
import { ApiError, handleApiError } from '@/lib/api/errors';
import type { ReferralStatus } from '@prisma/client';

/**
 * GET /api/referrals/mine — barber's referral history (both sides).
 *
 * Returns referrals where the caller is either the referring (royalty earner)
 * or performing (royalty payer) barber. Includes a summary of pending/paid
 * earnings so the dashboard widget can render without a second query.
 */
async function getMyReferralsHandler(request: AuthRequest) {
  try {
    const barber = await prisma.barberProfile.findFirst({
      where: { userId: request.userId! },
      select: { id: true },
    });
    if (!barber) {
      throw new ApiError(404, 'NOT_FOUND', 'Barber profile not found');
    }

    const [received, performed] = await Promise.all([
      prisma.referral.findMany({
        where: { referringBarberId: barber.id },
        orderBy: { submittedAt: 'desc' },
        take: 100,
        include: {
          performingBarber: {
            select: { id: true, slug: true, displayName: true, city: true, state: true },
          },
        },
      }),
      prisma.referral.findMany({
        where: { performingBarberId: barber.id },
        orderBy: { submittedAt: 'desc' },
        take: 100,
        include: {
          referringBarber: {
            select: { id: true, slug: true, displayName: true, city: true, state: true },
          },
        },
      }),
    ]);

    // Earnings summary (caller-as-referring side only — that's where you earn).
    const summary = received.reduce<{
      pendingCents: number;
      approvedCents: number;
      paidCents: number;
      countByStatus: Record<ReferralStatus, number>;
    }>(
      (acc, r) => {
        if (r.status === 'pending') acc.pendingCents += r.payoutCents;
        if (r.status === 'approved') acc.approvedCents += r.payoutCents;
        if (r.status === 'paid') acc.paidCents += r.payoutCents;
        acc.countByStatus[r.status] = (acc.countByStatus[r.status] ?? 0) + 1;
        return acc;
      },
      {
        pendingCents: 0,
        approvedCents: 0,
        paidCents: 0,
        countByStatus: {
          pending: 0,
          approved: 0,
          paid: 0,
          disputed: 0,
          declined: 0,
        },
      },
    );

    return NextResponse.json({
      success: true,
      data: {
        received,
        performed,
        summary,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuth(getMyReferralsHandler, { requiredRole: 'barber' });
