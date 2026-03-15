import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api/middleware';
import { handleApiError, successResponse, ApiError } from '@/lib/api/errors';

const updateSpecialtyHandler = async (request: NextRequest, context?: { params: Promise<{ id: string }> }) => {
  try {
    const params = await context!.params;
    const id = parseInt(params.id);

    if (isNaN(id)) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid specialty ID');
    }

    const body = await request.json();
    const { name, slug, icon } = body;

    const specialty = await prisma.specialty.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(icon !== undefined && { icon: icon || null }),
      },
    });

    return successResponse(specialty);
  } catch (error) {
    return handleApiError(error);
  }
};

const deleteSpecialtyHandler = async (_request: NextRequest, context?: { params: Promise<{ id: string }> }) => {
  try {
    const params = await context!.params;
    const id = parseInt(params.id);

    if (isNaN(id)) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid specialty ID');
    }

    // Check if any barbers are using this specialty
    const barberCount = await prisma.barberSpecialty.count({
      where: { specialtyId: id },
    });

    if (barberCount > 0) {
      throw new ApiError(
        400,
        'SPECIALTY_IN_USE',
        `Cannot delete specialty that is assigned to ${barberCount} barber${barberCount !== 1 ? 's' : ''}. Remove barbers first.`
      );
    }

    await prisma.specialty.delete({
      where: { id },
    });

    return successResponse({ message: 'Specialty deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
};

export const PATCH = withAuth(updateSpecialtyHandler, { requiredRole: 'admin' });
export const DELETE = withAuth(deleteSpecialtyHandler, { requiredRole: 'admin' });
