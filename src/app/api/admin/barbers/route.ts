import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api/middleware';
import { handleApiError } from '@/lib/api/errors';

// GET /api/admin/barbers - List all barbers with filters (admin only)
const listBarbersHandler = async (request: NextRequest, context: any) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (query) {
      where.OR = [
        { displayName: { contains: query, mode: 'insensitive' } },
        { shopName: { contains: query, mode: 'insensitive' } },
        { city: { contains: query, mode: 'insensitive' } },
        { user: { email: { contains: query, mode: 'insensitive' } } },
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
