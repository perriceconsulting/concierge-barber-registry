import { NextResponse } from 'next/server';
import { withAuth, AuthRequest } from '@/lib/api/middleware';
import { handleApiError } from '@/lib/api/errors';
import { getStripe } from '@/lib/stripe';
import { getBarberWithSubscription } from '@/lib/subscription';
import { APP_CONFIG } from '@/config';

async function createPortalHandler(request: AuthRequest) {
  try {
    const userId = request.userId!;

    const barberProfile = await getBarberWithSubscription(userId);
    if (!barberProfile?.subscription?.stripeCustomerId) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'No active subscription found' } },
        { status: 404 }
      );
    }

    const appUrl = APP_CONFIG.url;

    const session = await getStripe().billingPortal.sessions.create({
      customer: barberProfile.subscription.stripeCustomerId,
      return_url: `${appUrl}/dashboard/subscription`,
    });

    return NextResponse.json({ success: true, data: { url: session.url } });
  } catch (error) {
    return handleApiError(error);
  }
}

export const POST = withAuth(createPortalHandler, { requiredRole: 'barber' });
