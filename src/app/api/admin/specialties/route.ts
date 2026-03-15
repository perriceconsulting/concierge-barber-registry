import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api/middleware';
import { handleApiError, successResponse, ApiError } from '@/lib/api/errors';

const listSpecialtiesHandler = async (_request: NextRequest) => {
  try {
    const specialties = await prisma.specialty.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { barbers: true } },
      },
    });

    const result = specialties.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      icon: s.icon,
      barberCount: s._count.barbers,
    }));

    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
};

const createSpecialtyHandler = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { name, slug, icon } = body;

    if (!name || !slug) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Name and slug are required');
    }

    const specialty = await prisma.specialty.create({
      data: {
        name,
        slug,
        icon: icon || null,
      },
    });

    return successResponse(specialty, 201);
  } catch (error) {
    return handleApiError(error);
  }
};

export const GET = withAuth(listSpecialtiesHandler, { requiredRole: 'admin' });
export const POST = withAuth(createSpecialtyHandler, { requiredRole: 'admin' });
