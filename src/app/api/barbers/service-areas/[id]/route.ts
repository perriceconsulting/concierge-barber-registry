import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, AuthRequest } from '@/lib/api/middleware';
import { ApiError, handleApiError } from '@/lib/api/errors';

// DELETE /api/barbers/service-areas/[id]
const deleteHandler = async (
  request: AuthRequest,
  context?: { params: Promise<{ id: string }> }
) => {
  try {
    const userId = request.userId!;
    const { id } = await context!.params;

    const profile = await prisma.barberProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) throw new ApiError(404, 'NOT_FOUND', 'Barber profile not found');

    const area = await prisma.serviceArea.findUnique({ where: { id } });
    if (!area || area.barberProfileId !== profile.id) {
      throw new ApiError(404, 'NOT_FOUND', 'Service area not found');
    }

    await prisma.serviceArea.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Service area removed' });
  } catch (error) {
    return handleApiError(error);
  }
};

export const DELETE = withAuth(deleteHandler, { requiredRole: 'barber' });
