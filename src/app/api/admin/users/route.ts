import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api/middleware';
import { handleApiError } from '@/lib/api/errors';

/**
 * Escape special characters in LIKE patterns to prevent SQL injection
 */
function escapeLikePattern(str: string): string {
  return str.replace(/[%_\\]/g, '\\$&');
}

// GET /api/admin/users - List all users with filters (admin only)
const listUsersHandler = async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';

    // Validate and sanitize pagination parameters
    const pageParam = parseInt(searchParams.get('page') || '1');
    const page = isNaN(pageParam) || pageParam < 1 ? 1 : Math.min(pageParam, 10000);

    const limitParam = parseInt(searchParams.get('limit') || '20');
    const limit = isNaN(limitParam) || limitParam < 1 ? 20 : Math.min(limitParam, 100);

    const offset = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (query) {
      const escapedQuery = escapeLikePattern(query);
      where.OR = [
        { firstName: { contains: escapedQuery, mode: 'insensitive' } },
        { lastName: { contains: escapedQuery, mode: 'insensitive' } },
        { email: { contains: escapedQuery, mode: 'insensitive' } },
      ];
    }

    if (role && ['client', 'barber', 'admin'].includes(role)) {
      where.role = role;
    }

    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    // Execute query
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          phone: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
};

export const GET = withAuth(listUsersHandler, { requiredRole: 'admin' });
