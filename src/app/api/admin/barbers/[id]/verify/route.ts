import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, AuthRequest } from '@/lib/api/middleware';
import { ApiError, handleApiError } from '@/lib/api/errors';
import { sendLicenseApprovedEmail, sendLicenseRejectedEmail, sendLicenseSuspendedEmail } from '@/lib/email';
import { auditVerificationEvent } from '@/lib/audit';
import { getStripe } from '@/lib/stripe';
import { isAppealable } from '@/lib/suspension';
import { SuspensionReason } from '@prisma/client';
import { z } from 'zod';
import { createLogger } from '@/lib/logger';

const logger = createLogger('VERIFY');

const verifyBarberSchema = z.object({
  status: z.enum(['approved', 'rejected', 'suspended']),
  notes: z.string().max(1000).optional(),
  suspensionReason: z.nativeEnum(SuspensionReason).optional(),
  isHidden: z.boolean().optional(),
}).refine(
  (data) => data.status !== 'suspended' || data.suspensionReason,
  { message: 'Suspension reason is required when suspending a barber', path: ['suspensionReason'] }
);

// PATCH /api/admin/barbers/[id]/verify - Verify/approve/reject barber profile
const verifyBarberHandler = async (
  request: AuthRequest,
  context?: { params: Promise<{ id: string }> }
) => {
  try {
    const adminUserId = request.userId!;
    const params = await context!.params;
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
    const { status, notes, suspensionReason, isHidden } = verifyBarberSchema.parse(body);

    // Block approval if no license document on file
    if (status === 'approved' && !barberProfile.licenseDocumentUrl) {
      throw new ApiError(400, 'MISSING_LICENSE_DOCUMENT', 'Cannot approve barber without a license document on file');
    }

    // Build update data based on status
    const updateData: Record<string, unknown> = {
      verificationStatus: status,
      licenseVerified: status === 'approved',
      verifiedAt: status === 'approved' ? new Date() : null,
      verifiedByUserId: status === 'approved' ? adminUserId : null,
      verificationNotes: notes,
    };

    if (isHidden !== undefined) {
      updateData.isHidden = isHidden;
    }

    if (status === 'suspended') {
      updateData.suspensionReason = suspensionReason;
      updateData.suspendedAt = new Date();
      updateData.suspendedByUserId = adminUserId;
    } else {
      // Clear suspension fields if not suspending
      updateData.suspensionReason = null;
      updateData.suspendedAt = null;
      updateData.suspendedByUserId = null;
    }

    // Update barber verification status
    const updatedProfile = await prisma.barberProfile.update({
      where: { id: barberId },
      data: updateData,
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

    // On suspension: cancel Stripe subscription with prorated refund
    if (status === 'suspended') {
      const subscription = await prisma.subscription.findUnique({
        where: { barberProfileId: barberId },
      });

      if (subscription?.stripeSubscriptionId) {
        try {
          const stripe = getStripe();
          await stripe.subscriptions.cancel(subscription.stripeSubscriptionId, {
            prorate: true,
          });

          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              status: 'canceled',
              canceledAt: new Date(),
            },
          });

          logger.info('Stripe subscription canceled for suspended barber');
        } catch (stripeError) {
          // Log but don't block suspension if Stripe fails
          logger.error('Failed to cancel Stripe subscription on suspend:', {
            errorType: stripeError instanceof Error ? stripeError.name : 'Unknown',
          });
        }
      }
    }

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
        suspensionReason: suspensionReason || null,
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
    } else if (status === 'suspended' && suspensionReason) {
      const appealable = isAppealable(suspensionReason);
      await sendLicenseSuspendedEmail(
        barberProfile.user.email,
        barberProfile.user.firstName,
        suspensionReason,
        appealable
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
