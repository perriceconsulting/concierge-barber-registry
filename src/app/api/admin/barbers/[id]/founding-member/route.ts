import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, AuthRequest } from '@/lib/api/middleware';
import { ApiError, handleApiError } from '@/lib/api/errors';
import { auditVerificationEvent } from '@/lib/audit';
import { z } from 'zod';
import { createLogger } from '@/lib/logger';

const logger = createLogger('FOUNDING_MEMBER');

const toggleSchema = z.object({
  foundingMember: z.boolean(),
});

/**
 * CBR v2.0 — FEAT-001 Founding Member toggle.
 *
 * Granting Founding Member status:
 *   - waives the verification setup fee (admin can approve immediately)
 *   - gives the first year of membership free — approval provisions the normal
 *     subscription with FOUNDING_TRIAL_DAYS (365) instead of the standard 30,
 *     so it converts to paid dues by itself on day 366
 *
 * This is now an OVERRIDE, not the primary mechanism. Founding status is
 * normally derived from the fee paid: the intro rate is only offered while
 * founding seats remain, so paying it sets `foundingMember` in the setup-fee
 * webhook. Use this endpoint to grant status to someone who never paid (a
 * comped barber) or to correct a mistake.
 *
 * It no longer writes `subscriptionWaivedUntil = 2099-12-31`. That column
 * expressed "never pays", which the one-year trial replaces, and nothing ever
 * read it for access — access state comes from the Stripe subscription.
 *
 * Reserved for the first 10 approved barbers (the source PRD's "Founding 10").
 */
const toggleFoundingMemberHandler = async (
  request: AuthRequest,
  context?: { params: Promise<{ id: string }> },
) => {
  try {
    const adminUserId = request.userId!;
    const params = await context!.params;
    const barberId = params.id;

    const barberProfile = await prisma.barberProfile.findUnique({
      where: { id: barberId },
      select: {
        id: true,
        foundingMember: true,
        user: { select: { email: true } },
      },
    });

    if (!barberProfile) {
      throw new ApiError(404, 'NOT_FOUND', 'Barber profile not found');
    }

    const body = await request.json();
    const { foundingMember } = toggleSchema.parse(body);

    if (foundingMember === barberProfile.foundingMember) {
      return NextResponse.json({
        success: true,
        data: { barberProfile },
        message: `Founding Member status already ${foundingMember ? 'granted' : 'revoked'}.`,
      });
    }

    // Cap at 10 active Founding Members (matches the source PRD).
    if (foundingMember) {
      const activeCount = await prisma.barberProfile.count({
        where: { foundingMember: true },
      });
      if (activeCount >= 10) {
        throw new ApiError(
          400,
          'FOUNDING_MEMBER_LIMIT_REACHED',
          'The 10-seat Founding Member roster is full. Revoke an existing seat first.',
        );
      }
    }

    const updated = await prisma.barberProfile.update({
      where: { id: barberId },
      data: {
        foundingMember,
        // Always cleared. The perk is now a 365-day trial on the real
        // subscription, not an indefinite waiver.
        subscriptionWaivedUntil: null,
      },
      select: {
        id: true,
        foundingMember: true,
        subscriptionWaivedUntil: true,
        user: { select: { email: true } },
      },
    });

    await auditVerificationEvent(
      foundingMember ? 'barber.founding_member_grant' : 'barber.founding_member_revoke',
      adminUserId,
      barberId,
      request,
      { barberEmail: updated.user.email },
    );

    logger.info('Founding Member status updated', {
      barberId,
      foundingMember,
    });

    return NextResponse.json({
      success: true,
      data: { barberProfile: updated },
      message: foundingMember
        ? 'Founding Member status granted. Setup fee waived and recurring subscription suppressed.'
        : 'Founding Member status revoked.',
    });
  } catch (error) {
    return handleApiError(error);
  }
};

export const PATCH = withAuth(toggleFoundingMemberHandler, { requiredRole: 'admin' });
