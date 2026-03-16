import { NextResponse } from 'next/server';
import { withAuth, AuthRequest } from '@/lib/api/middleware';
import { handleApiError } from '@/lib/api/errors';
import { getStripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import { SUBSCRIPTION_PRICES, TRIAL_DAYS, getBarberWithSubscription } from '@/lib/subscription';

async function createCheckoutHandler(request: AuthRequest) {
  try {
    const userId = request.userId!;
    const body = await request.json();
    const { priceKey, interval } = body as {
      priceKey: 'professional' | 'elite';
      interval: 'monthly' | 'annual';
    };

    if (!priceKey || !interval) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'priceKey and interval are required' } },
        { status: 400 }
      );
    }

    if (!['professional', 'elite'].includes(priceKey)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Invalid price tier' } },
        { status: 400 }
      );
    }

    const priceId = SUBSCRIPTION_PRICES[priceKey]?.[interval];
    if (!priceId) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Invalid pricing option' } },
        { status: 400 }
      );
    }

    const barberProfile = await getBarberWithSubscription(userId);
    if (!barberProfile) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Barber profile not found' } },
        { status: 404 }
      );
    }

    // Block checkout if profile is not approved
    if (barberProfile.verificationStatus !== 'approved') {
      return NextResponse.json(
        { success: false, error: { code: 'VERIFICATION_REQUIRED', message: 'Your profile must be verified before upgrading. Complete license verification first.' } },
        { status: 403 }
      );
    }

    // If barber already has a Stripe customer, reuse it
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

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: TRIAL_DAYS,
        metadata: { barberProfileId: barberProfile.id },
      },
      success_url: `${appUrl}/dashboard/subscription?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard/subscription`,
      metadata: { barberProfileId: barberProfile.id },
    });

    return NextResponse.json({ success: true, data: { url: session.url } });
  } catch (error) {
    return handleApiError(error);
  }
}

export const POST = withAuth(createCheckoutHandler, { requiredRole: 'barber' });
