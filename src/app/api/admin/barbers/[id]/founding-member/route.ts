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
 *   - waives the post-trial Verified Member subscription indefinitely
 *     (subscriptionWaivedUntil is set far in the future)
 *
 * Revoking it reverses both — the barber would need to pay the setup fee
 * (if not already paid) and a recurring sub would resume on next trial-lifecycle pass.
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
        subscriptionWaivedUntil: foundingMember ? new Date('2099-12-31T00:00:00Z') : null,
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
