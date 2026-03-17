import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, AuthRequest } from '@/lib/api/middleware';
import { ApiError, handleApiError } from '@/lib/api/errors';
import { updateTravelDateSchema } from '@/lib/validations/barber';

async function verifyOwnership(userId: string, travelDateId: string) {
  const profile = await prisma.barberProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) throw new ApiError(404, 'NOT_FOUND', 'Barber profile not found');

  const travelDate = await prisma.travelDate.findUnique({ where: { id: travelDateId } });
  if (!travelDate || travelDate.barberProfileId !== profile.id) {
    throw new ApiError(404, 'NOT_FOUND', 'Travel date not found');
  }
  return travelDate;
}

// PATCH /api/barbers/travel-dates/[id]
const updateHandler = async (
  request: AuthRequest,
  context?: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await context!.params;
    await verifyOwnership(request.userId!, id);

    const body = await request.json();
    const data = updateTravelDateSchema.parse(body);

    const updateData: Record<string, unknown> = {};
    if (data.city !== undefined) updateData.city = data.city;
    if (data.state !== undefined) updateData.state = data.state;
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const updated = await prisma.travelDate.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: { travelDate: updated } });
  } catch (error) {
    return handleApiError(error);
  }
};

// DELETE /api/barbers/travel-dates/[id]
const deleteHandler = async (
  request: AuthRequest,
  context?: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await context!.params;
    await verifyOwnership(request.userId!, id);

    await prisma.travelDate.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Travel date removed' });
  } catch (error) {
    return handleApiError(error);
  }
};

export const PATCH = withAuth(updateHandler, { requiredRole: 'barber' });
export const DELETE = withAuth(deleteHandler, { requiredRole: 'barber' });
