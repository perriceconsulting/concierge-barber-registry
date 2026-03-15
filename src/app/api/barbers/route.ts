import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api/middleware';
import { createBarberProfileSchema } from '@/lib/validations/barber';
import { ApiError, handleApiError } from '@/lib/api/errors';
import { z } from 'zod';

// Schema for validating search parameters
const searchParamsSchema = z.object({
  q: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().length(2).regex(/^[A-Z]{2}$/).optional(),
  specialty: z.string().max(100).optional(),
  min_rating: z.coerce.number().min(0).max(5).optional().default(0),
  page: z.coerce.number().int().min(1).max(10000).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

// GET /api/barbers - Search and list barbers
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Validate search parameters
    const validationResult = searchParamsSchema.safeParse({
      q: searchParams.get('q') || undefined,
      city: searchParams.get('city') || undefined,
      state: searchParams.get('state')?.toUpperCase() || undefined,
      specialty: searchParams.get('specialty') || undefined,
      min_rating: searchParams.get('min_rating') || undefined,
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
    });

    if (!validationResult.success) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid search parameters', validationResult.error.issues);
    }

    const { q: query, city, state, specialty, min_rating: minRating, page, limit } = validationResult.data;

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
      where.state = state;
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
      throw new ApiError(403, 'FORBIDDEN', 'Only barbers can create barber profiles');
    }

    // Check if user already has a barber profile
    const existingProfile = await prisma.barberProfile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      throw new ApiError(409, 'CONFLICT', 'You already have a barber profile');
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
        acceptsWalkins: validatedData.acceptsWalkins,
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
