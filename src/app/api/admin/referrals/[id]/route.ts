import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withAuth, AuthRequest } from '@/lib/api/middleware';
import { ApiError, handleApiError } from '@/lib/api/errors';
import { createAuditLog, getIpFromRequest, type AuditAction } from '@/lib/audit';

const patchSchema = z.object({
  status: z.enum(['approved', 'declined', 'disputed']).optional(),
  adminNotes: z.string().max(2000).nullable().optional(),
  disputeReason: z.string().max(2000).nullable().optional(),
});

/**
 * PATCH /api/admin/referrals/[id] — admin moves a referral through its
 * lifecycle (approve / decline / dispute) and edits notes.
 *
 * Marking a referral `paid` happens via the batch payout endpoint, not here —
 * pay-out always belongs to a payout record so we can reconcile.
 */
async function patchReferralHandler(
  request: AuthRequest,
  context?: { params: Promise<{ id: string }> },
) {
  try {
    const params = await context?.params;
    const id = params?.id;
    if (!id) {
      throw new ApiError(400, 'INVALID_ID', 'Referral id is required');
    }

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid patch', parsed.error.format());
    }
    const data = parsed.data;

    const existing = await prisma.referral.findUnique({
      where: { id },
      select: { id: true, status: true, performingBarberId: true, payoutCents: true },
    });
    if (!existing) {
      throw new ApiError(404, 'NOT_FOUND', 'Referral not found');
    }

    if (existing.status === 'paid') {
      throw new ApiError(
        400,
        'ALREADY_PAID',
        'This referral has already been paid out and cannot be edited.',
      );
    }

    const updateData: {
      status?: 'approved' | 'declined' | 'disputed';
      adminNotes?: string | null;
      disputeReason?: string | null;
      approvedAt?: Date;
      approvedByUserId?: string;
    } = {};

    if (data.adminNotes !== undefined) updateData.adminNotes = data.adminNotes;
    if (data.disputeReason !== undefined) updateData.disputeReason = data.disputeReason;
    if (data.status) {
      updateData.status = data.status;
      if (data.status === 'approved') {
        updateData.approvedAt = new Date();
        updateData.approvedByUserId = request.userId!;
      }
    }

    const updated = await prisma.referral.update({
      where: { id },
      data: updateData,
    });

    if (data.status) {
      const auditAction: AuditAction =
        data.status === 'approved'
          ? 'referral.approve'
          : data.status === 'declined'
            ? 'referral.decline'
            : 'referral.dispute';

      await createAuditLog({
        actorUserId: request.userId,
        action: auditAction,
        entityType: 'barber_profile',
        entityId: existing.performingBarberId,
        details: {
          referralId: id,
          oldStatus: existing.status,
          newStatus: data.status,
          payoutCents: existing.payoutCents,
        },
        ipAddress: getIpFromRequest(request),
      });
    }

    return NextResponse.json({ success: true, data: { referral: updated } });
  } catch (error) {
    return handleApiError(error);
  }
}

export const PATCH = withAuth(patchReferralHandler, { requiredRole: 'admin' });
