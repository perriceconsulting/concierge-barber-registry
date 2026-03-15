import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api/middleware';
import { handleApiError, successResponse } from '@/lib/api/errors';
import { Prisma } from '@prisma/client';

// GET /api/admin/audit-log - List audit logs with filters (admin only)
const listAuditLogsHandler = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);

    const q = searchParams.get('q') || '';
    const action = searchParams.get('action') || '';
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));

    const where: Prisma.AuditLogWhereInput = {};
    const conditions: Prisma.AuditLogWhereInput[] = [];

    // Search by action or entityType
    if (q) {
      conditions.push({
        OR: [
          { action: { contains: q, mode: 'insensitive' } },
          { entityType: { contains: q, mode: 'insensitive' } },
        ],
      });
    }

    // Filter by action prefix
    if (action) {
      conditions.push({
        action: { startsWith: action, mode: 'insensitive' },
      });
    }

    // Date range filters
    if (from) {
      conditions.push({
        createdAt: { gte: new Date(from) },
      });
    }
    if (to) {
      // Include the entire "to" day by setting time to end of day
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      conditions.push({
        createdAt: { lte: toDate },
      });
    }

    if (conditions.length > 0) {
      where.AND = conditions;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          actor: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return successResponse({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
};

export const GET = withAuth(listAuditLogsHandler, { requiredRole: 'admin' });
