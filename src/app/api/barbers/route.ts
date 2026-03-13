import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api/middleware';
import { createBarberProfileSchema } from '@/lib/validations/barber';
import { ApiError, handleApiError } from '@/lib/api/errors';

// GET /api/barbers - Search and list barbers
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const city = searchParams.get('city') || '';
    const state = searchParams.get('state') || '';
    const specialty = searchParams.get('specialty') || '';
    const minRating = parseFloat(searchParams.get('min_rating') || '0');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {
      verificationStatus: 'approved',
    };

    if (query) {
      where.OR = [
        { displayName: { contains: query, mode: 'insensitive' } },
        { shopName: { contains: query, mode: 'insensitive' } },
        { city: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (state) {
      where.state = state.toUpperCase();
    }

    if (minRating > 0) {
      where.averageRating = { gte: minRating };
    }

    if (specialty) {
      where.specialties = {
        some: {
          specialty: {
            slug: specialty,
          },
        },
      };
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
            },
          },
          specialties: {
            include: {
              specialty: true,
            },
          },
        },
        skip: offset,
        take: limit,
        orderBy: { averageRating: 'desc' },
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
}

// POST /api/barbers - Create barber profile (authenticated barber only)
const createBarberHandler = async (request: NextRequest, context: any) => {
  try {
    const userId = context.user.id;
    const userRole = context.user.role;

    // Only barbers can create barber profiles
    if (userRole !== 'barber') {
      throw new ApiError('Only barbers can create barber profiles', 403);
    }

    // Check if user already has a barber profile
    const existingProfile = await prisma.barberProfile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      throw new ApiError('You already have a barber profile', 409);
    }

    const body = await request.json();
    const validatedData = createBarberProfileSchema.parse(body);

    // Generate slug from display name
    const slug = validatedData.displayName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      + '-' + Date.now();

    // Create barber profile
    const barberProfile = await prisma.barberProfile.create({
      data: {
        userId,
        displayName: validatedData.displayName,
        slug,
        bio: validatedData.bio,
        tagline: validatedData.tagline,
        yearsExperience: validatedData.yearsExperience,
        shopName: validatedData.shopName,
        shopAddressLine1: validatedData.shopAddressLine1,
        shopAddressLine2: validatedData.shopAddressLine2,
        city: validatedData.city,
        state: validatedData.state,
        zipCode: validatedData.zipCode,
        acceptsWalkIns: validatedData.acceptsWalkIns,
        acceptsAppointments: validatedData.acceptsAppointments,
        verificationStatus: 'pending',
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { barberProfile },
      message: 'Barber profile created successfully. Awaiting verification.',
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
};

export const POST = withAuth(createBarberHandler, { requiredRole: 'barber' });
