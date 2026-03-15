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

// GET /api/admin/barbers - List all barbers with filters (admin only)
const listBarbersHandler = async (request: NextRequest, context: any) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const status = searchParams.get('status') || '';

    // Validate and sanitize pagination parameters
    const pageParam = parseInt(searchParams.get('page') || '1');
    const page = isNaN(pageParam) || pageParam < 1 ? 1 : Math.min(pageParam, 10000);

    const limitParam = parseInt(searchParams.get('limit') || '20');
    const limit = isNaN(limitParam) || limitParam < 1 ? 20 : Math.min(limitParam, 100);

    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (query) {
      // SECURITY FIX: Escape LIKE pattern special characters to prevent SQL injection
      const escapedQuery = escapeLikePattern(query);
      where.OR = [
        { displayName: { contains: escapedQuery, mode: 'insensitive' } },
        { shopName: { contains: escapedQuery, mode: 'insensitive' } },
        { city: { contains: escapedQuery, mode: 'insensitive' } },
        { user: { email: { contains: escapedQuery, mode: 'insensitive' } } },
      ];
    }

    if (status && ['pending', 'approved', 'rejected', 'suspended'].includes(status)) {
      where.verificationStatus = status;
    }

    // Execute query
    const [barbers, total] = await Promise.all([
      prisma.barberProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              createdAt: true,
            },
          },
          specialties: {
            include: {
              specialty: true,
            },
          },
          _count: {
            select: {
              reviews: true,
              portfolioImages: true,
              services: true,
            },
          },
        },
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.barberProfile.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        barbers,
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

export const GET = withAuth(listBarbersHandler, { requiredRole: 'admin' });
