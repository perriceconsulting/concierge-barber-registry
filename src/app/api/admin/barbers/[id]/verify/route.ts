import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, AuthRequest } from '@/lib/api/middleware';
import { ApiError, handleApiError } from '@/lib/api/errors';
import { sendLicenseApprovedEmail, sendLicenseRejectedEmail, sendLicenseSuspendedEmail } from '@/lib/email';
import { auditVerificationEvent } from '@/lib/audit';
import { getStripe } from '@/lib/stripe';
import { isAppealable } from '@/lib/suspension';
import { SUBSCRIPTION_PRICES, VERIFIED_TRIAL_DAYS } from '@/lib/subscription';
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

    // CBR v2.0 — gate approval on the setup fee unless this is a Founding Member.
    if (
      status === 'approved' &&
      !barberProfile.foundingMember &&
      !barberProfile.setupFeePaidAt
    ) {
      throw new ApiError(
        400,
        'SETUP_FEE_UNPAID',
        'Cannot approve verification: setup fee has not been paid. Either flag the barber as a Founding Member or have them complete the setup payment first.',
      );
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

    // CBR v2.0 — On approval, auto-create the Verified Member trial subscription.
    // Founding Members skip the recurring sub entirely (subscriptionWaivedUntil is set
    // far in the future via the founding-member admin endpoint).
    if (status === 'approved' && !updatedProfile.foundingMember) {
      try {
        await ensureVerifiedTrialSubscription(barberId, updatedProfile.user.email, {
          firstName: updatedProfile.user.firstName,
          lastName: updatedProfile.user.lastName,
          userId: updatedProfile.user.id,
        });
      } catch (subError) {
        // Log but don't block approval — admin can re-trigger sub creation later.
        logger.error('Failed to auto-create verified trial subscription on approval', {
          barberId,
          errorType: subError instanceof Error ? subError.name : 'Unknown',
          message: subError instanceof Error ? subError.message : String(subError),
        });
      }
    }

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

/**
 * CBR v2.0 — Create or hydrate the Verified Member trial subscription on Stripe.
 *
 * Idempotent: if a subscription row already exists for this barber, no-op
 * (treat as already provisioned). The barber's trialEndsAt drives the day-25
 * reminder + day-30 conversion cron (W8).
 *
 * If the verified-tier price IDs aren't configured in env, this throws —
 * the caller logs and continues so the verification approval itself still succeeds.
 */
async function ensureVerifiedTrialSubscription(
  barberProfileId: string,
  email: string,
  user: { firstName: string; lastName: string; userId: string },
) {
  const existing = await prisma.subscription.findUnique({
    where: { barberProfileId },
  });

  // Already provisioned — leave it alone.
  if (existing?.stripeSubscriptionId) {
    logger.info('Verified trial subscription already exists, skipping provisioning', {
      barberProfileId,
    });
    return;
  }

  const verifiedMonthlyPriceId = SUBSCRIPTION_PRICES.verified.monthly;
  if (!verifiedMonthlyPriceId) {
    throw new Error(
      'STRIPE_PRICE_VERIFIED_MONTHLY env var is not configured — cannot auto-create trial subscription. Create the Verified Member product in Stripe Dashboard and set the price ID.',
    );
  }

  const stripe = getStripe();

  // Reuse Stripe customer from prior setup-fee charge if present.
  let customerId = existing?.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email,
      name: `${user.firstName} ${user.lastName}`,
      metadata: { barberProfileId, userId: user.userId },
    });
    customerId = customer.id;
  }

  const stripeSub = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: verifiedMonthlyPriceId }],
    trial_period_days: VERIFIED_TRIAL_DAYS,
    metadata: { barberProfileId, source: 'cbr_v2_admin_approval' },
  });

  const item = stripeSub.items.data[0];
  const periodStart = item ? new Date(item.current_period_start * 1000) : null;
  const periodEnd = item ? new Date(item.current_period_end * 1000) : null;

  await prisma.subscription.upsert({
    where: { barberProfileId },
    create: {
      barberProfileId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: stripeSub.id,
      stripePriceId: verifiedMonthlyPriceId,
      tier: 'verified',
      status: stripeSub.status === 'trialing' ? 'trialing' : 'active',
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      trialEndsAt: stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000) : null,
    },
    update: {
      stripeSubscriptionId: stripeSub.id,
      stripePriceId: verifiedMonthlyPriceId,
      tier: 'verified',
      status: stripeSub.status === 'trialing' ? 'trialing' : 'active',
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      trialEndsAt: stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000) : null,
    },
  });

  logger.info('Verified trial subscription provisioned', {
    barberProfileId,
    stripeSubscriptionId: stripeSub.id,
    trialEnd: stripeSub.trial_end,
  });
}
