import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, AuthRequest } from '@/lib/api/middleware';
import { ApiError, handleApiError } from '@/lib/api/errors';
import { sendReinstatedEmail } from '@/lib/email';
import { auditVerificationEvent } from '@/lib/audit';
import { z } from 'zod';

const reviewAppealSchema = z.object({
  status: z.enum(['approved', 'denied']),
  adminNotes: z.string().max(1000).optional(),
});

// PATCH /api/admin/appeals/[id] - Review a suspension appeal
const reviewAppealHandler = async (
  request: AuthRequest,
  context?: { params: Promise<{ id: string }> }
) => {
  try {
    const adminUserId = request.userId!;
    const params = await context!.params;
    const appealId = params.id;

    const appeal = await prisma.suspensionAppeal.findUnique({
      where: { id: appealId },
      include: {
        barberProfile: {
          include: {
            user: {
              select: { id: true, firstName: true, email: true },
            },
          },
        },
      },
    });

    if (!appeal) {
      throw new ApiError(404, 'NOT_FOUND', 'Appeal not found');
    }

    if (appeal.status !== 'pending') {
      throw new ApiError(400, 'ALREADY_REVIEWED', 'This appeal has already been reviewed');
    }

    const body = await request.json();
    const { status, adminNotes } = reviewAppealSchema.parse(body);

    // Update appeal
    const updatedAppeal = await prisma.suspensionAppeal.update({
      where: { id: appealId },
      data: {
        status,
        adminNotes,
        reviewedByUserId: adminUserId,
        reviewedAt: new Date(),
      },
    });

    // If approved, reinstate the barber
    if (status === 'approved') {
      await prisma.barberProfile.update({
        where: { id: appeal.barberProfileId },
        data: {
          verificationStatus: 'approved',
          licenseVerified: true,
          verifiedAt: new Date(),
          verifiedByUserId: adminUserId,
          verificationNotes: `Reinstated via appeal: ${adminNotes || 'Appeal approved'}`,
          suspensionReason: null,
          suspendedAt: null,
          suspendedByUserId: null,
        },
      });

      await auditVerificationEvent(
        'barber.reinstate',
        adminUserId,
        appeal.barberProfileId,
        request,
        {
          appealId,
          method: 'appeal_approved',
          adminNotes: adminNotes || null,
        }
      );

      await sendReinstatedEmail(
        appeal.barberProfile.user.email,
        appeal.barberProfile.user.firstName
      );
    }

    return NextResponse.json({
      success: true,
      data: { appeal: updatedAppeal },
      message: status === 'approved'
        ? 'Appeal approved — barber has been reinstated'
        : 'Appeal denied',
    });
  } catch (error) {
    return handleApiError(error);
  }
};

export const PATCH = withAuth(reviewAppealHandler, { requiredRole: 'admin' });
