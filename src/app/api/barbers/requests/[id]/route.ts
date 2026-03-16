import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, AuthRequest } from '@/lib/api/middleware';
import { ApiError, handleApiError } from '@/lib/api/errors';
import { z } from 'zod';

const updateRequestSchema = z.object({
  status: z.enum(['read', 'responded', 'archived']),
});

// PATCH /api/barbers/requests/[id] - Update a contact request status
const updateRequestHandler = async (
  request: AuthRequest,
  context?: { params: Promise<{ id: string }> }
) => {
  try {
    const userId = request.userId!;
    const params = await context!.params;
    const requestId = params.id;

    const barberProfile = await prisma.barberProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!barberProfile) {
      throw new ApiError(404, 'NOT_FOUND', 'Barber profile not found');
    }

    const contactRequest = await prisma.contactRequest.findUnique({
      where: { id: requestId },
    });

    if (!contactRequest || contactRequest.barberProfileId !== barberProfile.id) {
      throw new ApiError(404, 'NOT_FOUND', 'Contact request not found');
    }

    const body = await request.json();
    const { status } = updateRequestSchema.parse(body);

    const updated = await prisma.contactRequest.update({
      where: { id: requestId },
      data: { status },
    });

    return NextResponse.json({
      success: true,
      data: { request: updated },
    });
  } catch (error) {
    return handleApiError(error);
  }
};

export const PATCH = withAuth(updateRequestHandler, { requiredRole: 'barber' });
