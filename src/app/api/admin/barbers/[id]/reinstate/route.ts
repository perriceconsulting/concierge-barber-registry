import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, AuthRequest } from '@/lib/api/middleware';
import { ApiError, handleApiError } from '@/lib/api/errors';
import { sendReinstatedEmail } from '@/lib/email';
import { auditVerificationEvent } from '@/lib/audit';
import { z } from 'zod';

const reinstateSchema = z.object({
  notes: z.string().max(1000).optional(),
});

// PATCH /api/admin/barbers/[id]/reinstate - Reinstate a suspended barber
const reinstateHandler = async (
  request: AuthRequest,
  context?: { params: Promise<{ id: string }> }
) => {
  try {
    const adminUserId = request.userId!;
    const params = await context!.params;
    const barberId = params.id;

    const barberProfile = await prisma.barberProfile.findUnique({
      where: { id: barberId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!barberProfile) {
      throw new ApiError(404, 'NOT_FOUND', 'Barber profile not found');
    }

    if (barberProfile.verificationStatus !== 'suspended') {
      throw new ApiError(400, 'NOT_SUSPENDED', 'Barber is not currently suspended');
    }

    const body = await request.json();
    const { notes } = reinstateSchema.parse(body);

    const updatedProfile = await prisma.barberProfile.update({
      where: { id: barberId },
      data: {
        verificationStatus: 'approved',
        licenseVerified: true,
        verifiedAt: new Date(),
        verifiedByUserId: adminUserId,
        verificationNotes: notes || 'Reinstated by admin',
        suspensionReason: null,
        suspendedAt: null,
        suspendedByUserId: null,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    await auditVerificationEvent(
      'barber.reinstate',
      adminUserId,
      barberId,
      request,
      {
        notes: notes || null,
        barberEmail: barberProfile.user.email,
        previousReason: barberProfile.suspensionReason || null,
      }
    );

    await sendReinstatedEmail(
      barberProfile.user.email,
      barberProfile.user.firstName
    );

    return NextResponse.json({
      success: true,
      data: { barberProfile: updatedProfile },
      message: 'Barber profile reinstated successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
};

export const PATCH = withAuth(reinstateHandler, { requiredRole: 'admin' });
