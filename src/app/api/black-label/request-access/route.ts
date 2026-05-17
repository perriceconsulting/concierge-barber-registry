import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { handleApiError, successResponse, ApiError } from '@/lib/api/errors';
import { rateLimiters } from '@/lib/api/rate-limit';
import { createAuditLog } from '@/lib/audit';
import { createLogger } from '@/lib/logger';

const logger = createLogger('BLACK_LABEL_LEAD');

const requestAccessSchema = z.object({
  fullName: z.string().min(1).max(120),
  email: z.string().email().max(254),
  city: z.string().max(120).optional().or(z.literal('')),
  source: z.string().max(120).optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
});

/**
 * Black Label membership-request capture (CBR v2.0 — W7).
 *
 * Persists to the BlackLabelLead table for admin triage at
 * /admin/black-label-leads. De-dupes on email — re-submissions for an existing
 * email update the most-recent lead's notes/city/source rather than creating
 * a duplicate row, but only when the existing lead is still in `new` status.
 * Once admin moves a lead to `contacted` or beyond, a re-submission creates
 * a fresh row (treated as a separate inbound).
 */
export async function POST(request: NextRequest) {
  try {
    await rateLimiters.contact(request);

    const body = await request.json();
    const data = requestAccessSchema.parse(body);

    if (!data.fullName.trim() || !data.email.trim()) {
      throw new ApiError(400, 'VALIDATION_FAILED', 'Name and email are required.');
    }

    const email = data.email.toLowerCase().trim();
    const fullName = data.fullName.trim();
    const city = data.city?.trim() || null;
    const source = data.source?.trim() || null;
    const notes = data.notes?.trim() || null;

    // De-dupe: if the most-recent lead for this email is still `new`, update it
    // rather than creating a fresh row. Avoids spam from impatient re-submitters.
    const existing = await prisma.blackLabelLead.findFirst({
      where: { email, status: 'new' },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      await prisma.blackLabelLead.update({
        where: { id: existing.id },
        data: {
          fullName,
          city,
          source,
          notes,
        },
      });
      logger.info('Black Label lead updated (re-submit)', {
        leadId: existing.id,
        email,
      });
    } else {
      const created = await prisma.blackLabelLead.create({
        data: {
          fullName,
          email,
          city,
          source,
          notes,
        },
      });

      await createAuditLog({
        action: 'black_label.lead_received',
        entityType: 'support',
        entityId: created.id,
        details: { email, fullName, hasNotes: Boolean(notes) },
      });

      logger.info('Black Label lead persisted', {
        leadId: created.id,
        email,
      });
    }

    return successResponse({ received: true });
  } catch (error) {
    return handleApiError(error);
  }
}
