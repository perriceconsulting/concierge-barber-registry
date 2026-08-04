import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, AuthRequest } from '@/lib/api/middleware';
import { ApiError, handleApiError } from '@/lib/api/errors';
import { sendLicenseApprovedEmail, sendLicenseRejectedEmail, sendLicenseSuspendedEmail } from '@/lib/email';
import { auditVerificationEvent } from '@/lib/audit';
import { getStripe } from '@/lib/stripe';
import { isAppealable } from '@/lib/suspension';
import { SUBSCRIPTION_PRICES, VERIFIED_TRIAL_DAYS } from '@/lib/subscription';
import { FOUNDING_TRIAL_DAYS } from '@/lib/copy/v2';
import { SuspensionReason, BillingPlan } from '@prisma/client';
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

    // On approval, provision the Verified Member subscription — for everyone.
    // Founding Members are no longer a separate branch: they take the same path
    // with a 365-day trial instead of 30, so their first year is included and
    // then converts by itself. Previously they skipped this entirely and were
    // marked waived until 2099, which meant they never converted at all.
    if (status === 'approved') {
      try {
        await ensureVerifiedTrialSubscription(
          barberId,
          updatedProfile.user.email,
          {
            firstName: updatedProfile.user.firstName,
            lastName: updatedProfile.user.lastName,
            userId: updatedProfile.user.id,
          },
          {
            foundingMember: updatedProfile.foundingMember,
            selectedPlan: updatedProfile.selectedPlan,
          },
        );
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
/**
 * Provision the Verified Member subscription on approval.
 *
 * One path for every barber. Founding and standard members differ by exactly
 * two values — the trial length and nothing else:
 *
 *   founding (paid the intro rate)  →  FOUNDING_TRIAL_DAYS (365)
 *   standard                        →  VERIFIED_TRIAL_DAYS (30)
 *
 * Founding members used to skip this function entirely and carry
 * `subscriptionWaivedUntil = 2099-12-31`, i.e. they never paid at all. That was
 * a second, parallel mechanism for "has access" that no code actually read.
 * A longer trial expresses the same perk using the machinery Stripe already
 * runs: the trial converts by itself, the existing day-25 reminder fires from
 * trialEndsAt, and access state comes from the subscription rather than a date
 * column nobody checks.
 */
async function ensureVerifiedTrialSubscription(
  barberProfileId: string,
  email: string,
  user: { firstName: string; lastName: string; userId: string },
  cohort: { foundingMember: boolean; selectedPlan: BillingPlan },
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

  const isAnnual = cohort.selectedPlan === BillingPlan.annual;
  const priceId = isAnnual
    ? SUBSCRIPTION_PRICES.verified.annual
    : SUBSCRIPTION_PRICES.verified.monthly;

  if (!priceId) {
    throw new Error(
      `STRIPE_PRICE_VERIFIED_${isAnnual ? 'ANNUAL' : 'MONTHLY'} env var is not configured — cannot auto-create the trial subscription. Run scripts/setup-stripe-products.ts and set the price IDs, then npm run verify:stripe.`,
    );
  }

  const trialDays = cohort.foundingMember ? FOUNDING_TRIAL_DAYS : VERIFIED_TRIAL_DAYS;

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
    items: [{ price: priceId }],
    trial_period_days: trialDays,
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
      stripePriceId: priceId,
      tier: 'verified',
      status: stripeSub.status === 'trialing' ? 'trialing' : 'active',
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      trialEndsAt: stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000) : null,
    },
    update: {
      stripeSubscriptionId: stripeSub.id,
      stripePriceId: priceId,
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
