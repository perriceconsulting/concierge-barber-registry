import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, AuthRequest } from '@/lib/api/middleware';
import { handleApiError } from '@/lib/api/errors';
import { ReferralStatus } from '@prisma/client';

const VALID_STATUSES = ['pending', 'approved', 'paid', 'disputed', 'declined'] as const;

/**
 * GET /api/admin/referrals — admin queue + status breakdown for triage.
 *
 * Filterable by ?status=…  Returns both row data and grouped counts so the
 * page can render status pills with badge counts in one round trip.
 */
async function listReferralsHandler(request: AuthRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get('status') ?? 'all';
    const pageParam = parseInt(searchParams.get('page') || '1');
    const page = isNaN(pageParam) || pageParam < 1 ? 1 : Math.min(pageParam, 10000);
    const limit = 50;
    const offset = (page - 1) * limit;

    const where: { status?: ReferralStatus } = {};
    if (status !== 'all' && VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
      where.status = status as ReferralStatus;
    }

    const [referrals, total, statusCounts] = await Promise.all([
      prisma.referral.findMany({
        where,
        orderBy: { submittedAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          referringBarber: {
            select: { id: true, slug: true, displayName: true, city: true, state: true },
          },
          performingBarber: {
            select: { id: true, slug: true, displayName: true, city: true, state: true },
          },
        },
      }),
      prisma.referral.count({ where }),
      prisma.referral.groupBy({
        by: ['status'],
        _count: { _all: true },
        _sum: { payoutCents: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        referrals,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        statusCounts: Object.fromEntries(
          statusCounts.map((row) => [row.status, row._count._all]),
        ),
        statusPayoutCents: Object.fromEntries(
          statusCounts.map((row) => [row.status, row._sum.payoutCents ?? 0]),
        ),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuth(listReferralsHandler, { requiredRole: 'admin' });
