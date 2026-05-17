import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, AuthRequest } from '@/lib/api/middleware';
import { handleApiError } from '@/lib/api/errors';
import { BlackLabelLeadStatus } from '@prisma/client';

const VALID_STATUSES = ['new', 'contacted', 'converted', 'declined'] as const;

/**
 * GET /api/admin/black-label-leads — list waitlist submissions for admin triage.
 * Admin-only. Filterable by status (?status=new|contacted|converted|declined|all).
 */
const listLeadsHandler = async (request: AuthRequest) => {
  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get('status') ?? 'all';
    const pageParam = parseInt(searchParams.get('page') || '1');
    const page = isNaN(pageParam) || pageParam < 1 ? 1 : Math.min(pageParam, 10000);
    const limit = 50;
    const offset = (page - 1) * limit;

    const where: { status?: BlackLabelLeadStatus } = {};
    if (status !== 'all' && VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
      where.status = status as BlackLabelLeadStatus;
    }

    const [leads, total, statusCounts] = await Promise.all([
      prisma.blackLabelLead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.blackLabelLead.count({ where }),
      prisma.blackLabelLead.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        leads,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        statusCounts: Object.fromEntries(
          statusCounts.map((row) => [row.status, row._count._all]),
        ),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
};

export const GET = withAuth(listLeadsHandler, { requiredRole: 'admin' });
