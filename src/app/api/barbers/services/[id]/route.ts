import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, AuthRequest } from '@/lib/api/middleware';
import { ApiError, handleApiError } from '@/lib/api/errors';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  description: z.string().max(500).optional(),
  priceCents: z.number().int().min(0).optional(),
  durationMinutes: z.number().int().min(1).max(480).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

async function getBarberService(userId: string, serviceId: string) {
  const barberProfile = await prisma.barberProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!barberProfile) {
    throw new ApiError(404, 'NOT_FOUND', 'Barber profile not found');
  }

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
  });

  if (!service || service.barberProfileId !== barberProfile.id) {
    throw new ApiError(404, 'NOT_FOUND', 'Service not found');
  }

  return service;
}

// PATCH /api/barbers/services/[id] - Update a service
const updateHandler = async (
  request: AuthRequest,
  context?: { params: Promise<{ id: string }> }
) => {
  try {
    const userId = request.userId!;
    const { id } = await context!.params;

    await getBarberService(userId, id);

    const body = await request.json();
    const data = updateSchema.parse(body);

    const updated = await prisma.service.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      success: true,
      data: { service: updated },
    });
  } catch (error) {
    return handleApiError(error);
  }
};

// DELETE /api/barbers/services/[id] - Delete a service
const deleteHandler = async (
  request: AuthRequest,
  context?: { params: Promise<{ id: string }> }
) => {
  try {
    const userId = request.userId!;
    const { id } = await context!.params;

    await getBarberService(userId, id);

    await prisma.service.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'Service deleted',
    });
  } catch (error) {
    return handleApiError(error);
  }
};

export const PATCH = withAuth(updateHandler, { requiredRole: 'barber' });
export const DELETE = withAuth(deleteHandler, { requiredRole: 'barber' });
