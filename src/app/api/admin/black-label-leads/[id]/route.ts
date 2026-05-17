import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withAuth, AuthRequest } from '@/lib/api/middleware';
import { handleApiError, ApiError } from '@/lib/api/errors';
import { createAuditLog } from '@/lib/audit';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ADMIN_BL_LEAD_UPDATE');

const updateSchema = z.object({
  status: z.enum(['new', 'contacted', 'converted', 'declined']).optional(),
  adminNotes: z.string().max(2000).optional(),
});

/**
 * PATCH /api/admin/black-label-leads/[id] — update status or admin notes on a
 * Black Label membership request. Admin-only.
 *
 * Setting status to 'converted' is the natural moment to also flip the
 * applicant's UserRole to `hnwi` (granting them /black-label access). That's
 * a separate manual step in the admin UI to keep the two decisions explicit.
 */
const updateLeadHandler = async (
  request: AuthRequest,
  context?: { params: Promise<{ id: string }> },
) => {
  try {
    const adminUserId = request.userId!;
    const { id } = await context!.params;
    const body = await request.json();
    const data = updateSchema.parse(body);

    const existing = await prisma.blackLabelLead.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError(404, 'NOT_FOUND', 'Black Label lead not found.');
    }

    const updateData: Record<string, unknown> = {};
    if (data.status && data.status !== existing.status) {
      updateData.status = data.status;
      updateData.reviewedAt = new Date();
      updateData.reviewedByUserId = adminUserId;
    }
    if (data.adminNotes !== undefined) {
      updateData.adminNotes = data.adminNotes;
    }
    if (Object.keys(updateData).length === 0) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'No fields provided.');
    }

    const updated = await prisma.blackLabelLead.update({
      where: { id },
      data: updateData,
    });

    if (data.status && data.status !== existing.status) {
      await createAuditLog({
        actorUserId: adminUserId,
        action: 'black_label.lead_status_changed',
        entityType: 'support',
        entityId: id,
        details: {
          previousStatus: existing.status,
          newStatus: data.status,
          email: existing.email,
        },
      });
      logger.info('Black Label lead status changed', {
        leadId: id,
        previousStatus: existing.status,
        newStatus: data.status,
      });
    }

    return NextResponse.json({ success: true, data: { lead: updated } });
  } catch (error) {
    return handleApiError(error);
  }
};

export const PATCH = withAuth(updateLeadHandler, { requiredRole: 'admin' });
