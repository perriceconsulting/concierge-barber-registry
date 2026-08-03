import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import { getTierFromPriceId } from '@/lib/subscription';
import { createLogger } from '@/lib/logger';

const logger = createLogger('StripeWebhook');

/**
 * Extract current_period_start/end from a subscription's first item.
 * In Stripe API 2026-02-25, these moved from Subscription to SubscriptionItem.
 */
function getPeriodDates(sub: Stripe.Subscription) {
  const item = sub.items.data[0];
  return {
    periodStart: item ? new Date(item.current_period_start * 1000) : null,
    periodEnd: item ? new Date(item.current_period_end * 1000) : null,
  };
}

/**
 * Extract subscription ID from an invoice.
 * In Stripe API 2026-02-25, invoice.subscription moved to invoice.parent.subscription_details.
 */
function getSubscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const details = invoice.parent?.subscription_details;
  if (!details) return null;
  return typeof details.subscription === 'string'
    ? details.subscription
    : details.subscription?.id ?? null;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Webhook signature verification failed:', message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Idempotency: check if we already processed this event
  const existingLog = await prisma.auditLog.findFirst({
    where: { action: 'stripe_webhook', details: { path: ['eventId'], equals: event.id } },
  });

  if (existingLog) {
    logger.info('Skipping duplicate event:', event.id);
    return NextResponse.json({ received: true });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.paid':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      default:
        logger.info('Unhandled event type:', event.type);
    }

    // Log processed event for idempotency
    await prisma.auditLog.create({
      data: {
        action: 'stripe_webhook',
        entityType: 'subscription',
        details: { eventId: event.id, eventType: event.type },
      },
    });
  } catch (error) {
    logger.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const barberProfileId = session.metadata?.barberProfileId;
  if (!barberProfileId) {
    logger.error('No barberProfileId in checkout session metadata');
    return;
  }

  // CBR v2.0 — One-time setup fee (FEAT-001) takes a different path than
  // recurring subscription checkouts. mode='payment' + purpose metadata.
  if (session.mode === 'payment' && session.metadata?.purpose === 'verification_setup_fee') {
    await handleSetupFeeCompleted(session, barberProfileId);
    return;
  }

  const subscriptionId = session.subscription as string;
  const customerId = session.customer as string;

  // Fetch the full subscription to get price/tier info
  const stripeSubscription = await getStripe().subscriptions.retrieve(subscriptionId);
  const priceId = stripeSubscription.items.data[0]?.price.id;
  const tier = getTierFromPriceId(priceId);
  const { periodStart, periodEnd } = getPeriodDates(stripeSubscription);

  await prisma.subscription.upsert({
    where: { barberProfileId },
    create: {
      barberProfileId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId,
      tier,
      status: stripeSubscription.status === 'trialing' ? 'trialing' : 'active',
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      trialEndsAt: stripeSubscription.trial_end
        ? new Date(stripeSubscription.trial_end * 1000)
        : null,
    },
    update: {
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId,
      tier,
      status: stripeSubscription.status === 'trialing' ? 'trialing' : 'active',
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      trialEndsAt: stripeSubscription.trial_end
        ? new Date(stripeSubscription.trial_end * 1000)
        : null,
    },
  });

  // Set isFeatured for Elite tier
  if (tier === 'elite') {
    await prisma.barberProfile.update({
      where: { id: barberProfileId },
      data: { isFeatured: true },
    });
  }

  logger.info(`Subscription created for barber ${barberProfileId}: ${tier}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const existing = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!existing) {
    logger.error('No local subscription found for:', subscription.id);
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  const tier = getTierFromPriceId(priceId);
  const { periodStart, periodEnd } = getPeriodDates(subscription);

  const statusMap: Record<string, string> = {
    active: 'active',
    trialing: 'trialing',
    past_due: 'past_due',
    canceled: 'canceled',
    unpaid: 'unpaid',
  };

  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      stripePriceId: priceId,
      tier,
      status: (statusMap[subscription.status] || 'active') as 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid',
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      trialEndsAt: subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : null,
    },
  });

  // Update isFeatured based on tier
  await prisma.barberProfile.update({
    where: { id: existing.barberProfileId },
    data: { isFeatured: tier === 'elite' },
  });

  logger.info(`Subscription updated for ${existing.barberProfileId}: ${tier} (${subscription.status})`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const existing = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!existing) return;

  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      tier: 'starter',
      status: 'canceled',
      canceledAt: new Date(),
    },
  });

  // Remove featured status
  await prisma.barberProfile.update({
    where: { id: existing.barberProfileId },
    data: { isFeatured: false },
  });

  logger.info(`Subscription canceled for ${existing.barberProfileId}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = getSubscriptionIdFromInvoice(invoice);
  if (!subscriptionId) return;

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscriptionId },
    data: { status: 'past_due' },
  });

  logger.info(`Payment failed for subscription ${subscriptionId}`);
}

/**
 * CBR v2.0 — Mark a barber's setup fee paid + record the payment-intent ID.
 * Idempotent: safe to retry. Doesn't itself approve verification — that
 * remains a manual admin action.
 */
async function handleSetupFeeCompleted(
  session: Stripe.Checkout.Session,
  barberProfileId: string,
) {
  const paymentIntentId = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id ?? null;

  if (!paymentIntentId) {
    logger.error('No payment_intent on completed setup-fee session', { sessionId: session.id });
    return;
  }

  const profile = await prisma.barberProfile.findUnique({
    where: { id: barberProfileId },
    select: { setupFeePaidAt: true },
  });

  if (profile?.setupFeePaidAt) {
    logger.info('Setup fee already recorded — skipping', { barberProfileId });
    return;
  }

  await prisma.barberProfile.update({
    where: { id: barberProfileId },
    data: {
      setupFeePaidAt: new Date(),
      setupFeeAmountCents: session.amount_total ?? null,
      setupFeeStripePaymentIntentId: paymentIntentId,
    },
  });

  logger.info('Setup fee recorded', {
    barberProfileId,
    amountCents: session.amount_total,
    paymentIntentId,
  });
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = getSubscriptionIdFromInvoice(invoice);
  if (!subscriptionId) return;

  const existing = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (existing?.status === 'past_due') {
    await prisma.subscription.update({
      where: { stripeSubscriptionId: subscriptionId },
      data: { status: 'active' },
    });
    logger.info(`Payment recovered for subscription ${subscriptionId}`);
  }
}
