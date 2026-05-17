import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { handleApiError } from '@/lib/api/errors';
import { createLogger } from '@/lib/logger';
import { createAuditLog } from '@/lib/audit';
import {
  sendTrialExpiringEmail,
  sendLicenseExpiredEmail,
  sendReverificationDueEmail,
} from '@/lib/email';

const logger = createLogger('CRON_TRIAL_LIFECYCLE');

function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
  } catch {
    return false;
  }
}

/**
 * Daily lifecycle sweep — three independent jobs:
 *
 *   1. Day-25 trial reminder: catches trials whose `trialEndsAt` falls in the
 *      next 5–6 day window. The 1-day window is what makes the cron idempotent
 *      without storing a "last notified" flag — a daily run hits each trial
 *      exactly once.
 *
 *   2. License expiration sweep: any approved barber whose license expired is
 *      marked `expired` + hidden from search. Already idempotent because the
 *      WHERE clause excludes status='expired'.
 *
 *   3. Re-verification nudge: barbers verified 365–366 days ago get a
 *      courtesy email. Same 1-day window pattern. We do NOT change their
 *      status; this is just a reminder. (If we want to enforce, that's a
 *      separate decision — for now: surface, don't expire.)
 *
 * Day-30 conversion is handled by Stripe natively. Failed payment is handled
 * by the existing webhook flow (`invoice.payment_failed` →
 * `verificationStatus='expired'` + `isHidden=true`).
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      logger.error('CRON_SECRET not configured');
      return NextResponse.json({ success: false, error: 'Service unavailable' }, { status: 503 });
    }

    const expectedAuth = `Bearer ${cronSecret}`;
    if (!authHeader || !secureCompare(authHeader, expectedAuth)) {
      logger.warn('Unauthorized cron access attempt', {
        ip: request.headers.get('x-forwarded-for'),
      });
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const summary = {
      trialReminders: 0,
      licensesExpired: 0,
      reverificationNudges: 0,
    };

    // ─── 1. Day-25 trial reminder (5-day-out window) ──────────────────────────
    const fiveDaysOut = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    const sixDaysOut = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);

    const trialsExpiringSoon = await prisma.subscription.findMany({
      where: {
        status: 'trialing',
        tier: 'verified',
        trialEndsAt: {
          gte: fiveDaysOut,
          lt: sixDaysOut,
        },
      },
      include: {
        barberProfile: {
          include: {
            user: {
              select: { email: true, firstName: true },
            },
          },
        },
      },
    });

    for (const sub of trialsExpiringSoon) {
      const user = sub.barberProfile.user;
      if (!sub.trialEndsAt) continue;
      try {
        await sendTrialExpiringEmail(user.email, user.firstName, sub.trialEndsAt, '$29/mo');
        await createAuditLog({
          action: 'subscription.trial_expiring_notice_sent',
          entityType: 'barber_profile',
          entityId: sub.barberProfileId,
          details: {
            trialEndsAt: sub.trialEndsAt.toISOString(),
            subscriptionId: sub.id,
          },
        });
        summary.trialReminders += 1;
      } catch (err) {
        logger.error('Trial reminder send failed', {
          subscriptionId: sub.id,
          error: err instanceof Error ? err.message : 'unknown',
        });
      }
    }

    // ─── 2. License expiration sweep ──────────────────────────────────────────
    const expiredLicenses = await prisma.barberProfile.findMany({
      where: {
        verificationStatus: 'approved',
        licenseExpirationDate: { lt: now },
      },
      include: {
        user: { select: { email: true, firstName: true } },
      },
    });

    for (const barber of expiredLicenses) {
      try {
        await prisma.barberProfile.update({
          where: { id: barber.id },
          data: {
            verificationStatus: 'expired',
            isHidden: true,
          },
        });
        await sendLicenseExpiredEmail(
          barber.user.email,
          barber.user.firstName,
          barber.licenseExpirationDate
        );
        await createAuditLog({
          action: 'barber.license_expired_auto',
          entityType: 'barber_profile',
          entityId: barber.id,
          details: {
            licenseExpirationDate: barber.licenseExpirationDate?.toISOString() ?? null,
          },
        });
        summary.licensesExpired += 1;
      } catch (err) {
        logger.error('License expiration update failed', {
          barberProfileId: barber.id,
          error: err instanceof Error ? err.message : 'unknown',
        });
      }
    }

    // ─── 3. Annual re-verification nudge (1-day window at 365d) ───────────────
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    const oneYearAndOneDayAgo = new Date(now.getTime() - 366 * 24 * 60 * 60 * 1000);

    const dueForReverification = await prisma.barberProfile.findMany({
      where: {
        verificationStatus: 'approved',
        verifiedAt: {
          gte: oneYearAndOneDayAgo,
          lt: oneYearAgo,
        },
      },
      include: {
        user: { select: { email: true, firstName: true } },
      },
    });

    for (const barber of dueForReverification) {
      if (!barber.verifiedAt) continue;
      try {
        await sendReverificationDueEmail(barber.user.email, barber.user.firstName, barber.verifiedAt);
        await createAuditLog({
          action: 'barber.reverification_notice_sent',
          entityType: 'barber_profile',
          entityId: barber.id,
          details: {
            verifiedAt: barber.verifiedAt.toISOString(),
          },
        });
        summary.reverificationNudges += 1;
      } catch (err) {
        logger.error('Re-verification nudge send failed', {
          barberProfileId: barber.id,
          error: err instanceof Error ? err.message : 'unknown',
        });
      }
    }

    logger.info('Trial-lifecycle sweep complete', summary);

    return NextResponse.json({
      success: true,
      data: summary,
      message: 'Trial-lifecycle sweep completed',
    });
  } catch (error) {
    logger.error('Trial-lifecycle sweep error:', error);
    return handleApiError(error);
  }
}

// Vercel Cron uses GET; allow POST for manual triggers
export const POST = GET;
