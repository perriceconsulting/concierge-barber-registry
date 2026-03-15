import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api/middleware';
import { ApiError, handleApiError } from '@/lib/api/errors';
import { sendLicenseApprovedEmail, sendLicenseRejectedEmail } from '@/lib/email';
import { auditVerificationEvent } from '@/lib/audit';
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
      throw new ApiError(404, 'NOT_FOUND', 'Barber profile not found');
    }

    const body = await request.json();
    const { status, notes } = verifyBarberSchema.parse(body);

    // Update barber verification status
    const updatedProfile = await prisma.barberProfile.update({
      where: { id: barberId },
      data: {
        verificationStatus: status,
        licenseVerified: status === 'approved',
        verifiedAt: status === 'approved' ? new Date() : null,
        verifiedByUserId: status === 'approved' ? adminUserId : null,
        verificationNotes: notes,
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

    // Audit log for verification action
    const actionMap = {
      approved: 'barber.verification_approve',
      rejected: 'barber.verification_reject',
      suspended: 'barber.verification_suspend',
    } as const;

    await auditVerificationEvent(
      actionMap[status],
      adminUserId,
      barberId,
      request,
      {
        status,
        notes,
        barberEmail: barberProfile.user.email,
        licenseNumber: barberProfile.licenseNumber,
      }
    );

    // Send email notification to barber
    if (status === 'approved') {
      await sendLicenseApprovedEmail(
        barberProfile.user.email,
        barberProfile.user.firstName
      );
    } else if (status === 'rejected') {
      await sendLicenseRejectedEmail(
        barberProfile.user.email,
        barberProfile.user.firstName,
        notes || 'License information could not be verified'
      );
    }

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
