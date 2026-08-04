import { NextResponse } from 'next/server';
import { withAuth, AuthRequest } from '@/lib/api/middleware';
import { ApiError, handleApiError } from '@/lib/api/errors';
import { getStripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import { resolveSetupFeeAmountCents, getBarberWithSubscription } from '@/lib/subscription';
import { PAYMENT_POLICY } from '@/lib/copy/v2';
import { createLogger } from '@/lib/logger';
import { BillingPlan } from '@prisma/client';
import { z } from 'zod';

const logger = createLogger('SETUP_FEE_CHECKOUT');

/**
 * CBR v2.0 — FEAT-001 Verification setup fee checkout.
 *
 * Creates a one-time Stripe Checkout Session ($49 intro / $99 standard) that
 * unlocks the barber's "submit for verification" gate when paid. The webhook
 * (handleSetupFeeCompleted) records setupFeePaidAt + Stripe payment-intent ID
 * on the BarberProfile.
 *
 * Founding Members (admin-flagged) bypass this route entirely — admins can
 * approve them directly without payment.
 */
/**
 * Which membership cadence the barber picked before paying the fee. Annual is
 * the default and the headline offer; monthly is the opt-out. Captured here so
 * approval can provision the subscription without asking a second time.
 */
const planSchema = z.object({
  plan: z.nativeEnum(BillingPlan).optional(),
});

async function createSetupFeeCheckoutHandler(request: AuthRequest) {
  try {
    const userId = request.userId!;

    // Body is optional — an older client that posts nothing still gets annual.
    let selectedPlan: BillingPlan = BillingPlan.annual;
    try {
      const body = await request.json();
      selectedPlan = planSchema.parse(body).plan ?? BillingPlan.annual;
    } catch {
      // no body, or an unparseable one: keep the default
    }

    const barberProfile = await getBarberWithSubscription(userId);
    if (!barberProfile) {
      throw new ApiError(404, 'NOT_FOUND', 'Barber profile not found');
    }

    if (barberProfile.setupFeePaidAt) {
      throw new ApiError(
        400,
        'SETUP_FEE_ALREADY_PAID',
        'Setup fee has already been paid for this profile.',
      );
    }

    if (barberProfile.foundingMember) {
      throw new ApiError(
        400,
        'FOUNDING_MEMBER',
        'Founding Members are exempt from the setup fee — your account is already eligible for verification.',
      );
    }

    if (barberProfile.verificationStatus === 'approved') {
      throw new ApiError(
        400,
        'ALREADY_VERIFIED',
        'This profile is already verified.',
      );
    }

    // Friendly fail-fast for missing Stripe config (dev). Production should always have this set.
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new ApiError(
        503,
        'STRIPE_NOT_CONFIGURED',
        'Payments are not configured in this environment. Set STRIPE_SECRET_KEY in your .env, or ask an admin to flag your account as a Founding Member to bypass the setup fee.',
      );
    }

    const { amountCents, tier, introSeatsRemaining } = await resolveSetupFeeAmountCents();

    // Reuse existing Stripe customer if one exists from a prior subscription attempt.
    let customerId = barberProfile.subscription?.stripeCustomerId;
    if (!customerId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, firstName: true, lastName: true },
      });
      const customer = await getStripe().customers.create({
        email: user!.email,
        name: `${user!.firstName} ${user!.lastName}`,
        metadata: { barberProfileId: barberProfile.id, userId },
      });
      customerId = customer.id;
    }

    // Record the choice before sending them to Stripe. Doing it here rather than
    // in the webhook means an abandoned checkout still leaves the preference
    // stored, and approval never has to guess.
    await prisma.barberProfile.update({
      where: { id: barberProfile.id },
      data: { selectedPlan },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      customer: customerId,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: amountCents,
            product_data: {
              name: tier === 'intro'
                ? 'CBR Verification Setup Fee — Founding Member'
                : 'CBR Verification Setup Fee',
              description:
                'One-time application fee covering manual license verification, background check, and digital credential issuance.',
            },
          },
        },
      ],
      // Shown on Stripe's own payment page, beside the card field — the only
      // place we control at the moment the number is actually typed.
      custom_text: {
        submit: { message: PAYMENT_POLICY.prepaidNotAcceptedLong },
      },
      // Metadata mirrors the column so the choice is recoverable from Stripe
      // alone if the two ever disagree.
      payment_intent_data: {
        // Save the card. Without this the barber pays the setup fee and leaves
        // no payment method on the customer, so the Verified Member trial that
        // starts at approval has nothing to bill when it ends — the renewal
        // invoice fails and the subscription lands in past_due having never
        // collected a cent. This is also the point where card.funding first
        // becomes visible to the webhook.
        setup_future_usage: 'off_session',
        metadata: {
          barberProfileId: barberProfile.id,
          purpose: 'verification_setup_fee',
          tier,
          selectedPlan,
        },
      },
      metadata: {
        barberProfileId: barberProfile.id,
        purpose: 'verification_setup_fee',
        tier,
        selectedPlan,
      },
      success_url: `${appUrl}/dashboard/profile?setup_fee=paid&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard/profile?setup_fee=canceled`,
    });

    logger.info('Setup fee checkout session created', {
      barberProfileId: barberProfile.id,
      tier,
      amountCents,
      introSeatsRemaining,
    });

    return NextResponse.json({
      success: true,
      data: {
        url: session.url,
        amountCents,
        tier,
        introSeatsRemaining,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export const POST = withAuth(createSetupFeeCheckoutHandler, { requiredRole: 'barber' });
