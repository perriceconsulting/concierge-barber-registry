import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api/middleware';
import { ApiError, handleApiError } from '@/lib/api/errors';
import { z } from 'zod';

const verifyBarberSchema = z.object({
  status: z.enum(['approved', 'rejected', 'suspended']),
  notes: z.string().max(1000).optional(),
});

// PATCH /api/admin/barbers/[id]/verify - Verify/approve/reject barber profile
const verifyBarberHandler = async (
  request: any,
  context: { params: Promise<{ id: string }> }
) => {
  try {
    const adminUserId = request.userId;
    const params = await context.params;
    const barberId = params.id;

    // Validate barber exists
    const barberProfile = await prisma.barberProfile.findUnique({
      where: { id: barberId },
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

    if (!barberProfile) {
      throw new ApiError('Barber profile not found', 404);
    }

    const body = await request.json();
    const { status, notes } = verifyBarberSchema.parse(body);

    // Update barber verification status
    const updatedProfile = await prisma.barberProfile.update({
      where: { id: barberId },
      data: {
        verificationStatus: status,
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

    // Log the verification action
    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'barber_verification',
        entityType: 'barber_profile',
        entityId: barberId,
        details: {
          status,
          notes,
          barberEmail: barberProfile.user.email,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { barberProfile: updatedProfile },
      message: `Barber profile ${status} successfully`,
    });
  } catch (error) {
    return handleApiError(error);
  }
};

export const PATCH = withAuth(verifyBarberHandler, { requiredRole: 'admin' });
