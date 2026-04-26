import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { handleApiError } from '@/lib/api/errors';
import { rateLimiters } from '@/lib/api/rate-limit';
import { verifyCsrfToken } from '@/lib/api/csrf';
import { sendEmail } from '@/lib/email';
import { createLogger } from '@/lib/logger';

const logger = createLogger('REMOVAL_REQUEST');

const RemovalRequestSchema = z.object({
  reason: z.string().max(2000).optional(),
  contactEmail: z.string().email().optional().or(z.literal('').transform(() => undefined)),
});

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function POST(request: NextRequest, context: RouteParams) {
  try {
    verifyCsrfToken(request);
    await rateLimiters.contact(request);

    const { slug } = await context.params;
    const body = await request.json();
    const data = RemovalRequestSchema.parse(body);

    const profile = await prisma.barberProfile.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        displayName: true,
        city: true,
        state: true,
        claimStatus: true,
        removalRequestedAt: true,
        outreachEmail: true,
      },
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Profile not found' } },
        { status: 404 }
      );
    }

    // Only allow removal requests on unclaimed profiles. Claimed barbers manage
    // removal through their dashboard.
    if (profile.claimStatus === 'claimed') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_ALLOWED',
            message:
              'Claimed profiles must be managed by the barber through their dashboard.',
          },
        },
        { status: 403 }
      );
    }

    // Idempotent: if already requested, just succeed
    if (!profile.removalRequestedAt) {
      await prisma.barberProfile.update({
        where: { id: profile.id },
        data: { removalRequestedAt: new Date() },
      });
    }

    // Email admin (best-effort — don't fail the request if email send fails)
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM;
    if (adminEmail) {
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || 'https://conciergebarberregistry.com';
      try {
        await sendEmail({
          to: adminEmail,
          subject: `Removal request: ${profile.displayName}`,
          html: `
            <p>A removal request was submitted for an unclaimed barber profile.</p>
            <ul>
              <li><strong>Profile:</strong> ${profile.displayName} (${profile.city}, ${profile.state})</li>
              <li><strong>Public URL:</strong> <a href="${baseUrl}/barbers/${profile.slug}">${baseUrl}/barbers/${profile.slug}</a></li>
              <li><strong>Outreach email on file:</strong> ${profile.outreachEmail || '—'}</li>
              <li><strong>Reply-to email submitted:</strong> ${data.contactEmail || '—'}</li>
            </ul>
            <p><strong>Reason:</strong></p>
            <blockquote style="border-left: 3px solid #ccc; padding-left: 12px; margin: 0;">${data.reason ? escapeHtml(data.reason) : '(no reason provided)'}</blockquote>
            <p><a href="${baseUrl}/admin/removal-requests">Review in admin queue →</a></p>
          `,
        });
      } catch (emailErr) {
        logger.warn('Admin notification email failed for removal request', {
          slug: profile.slug,
          error: emailErr instanceof Error ? emailErr.message : 'unknown',
        });
      }
    }

    logger.info('Removal request submitted', { slug: profile.slug });

    return NextResponse.json({
      success: true,
      data: { message: 'Removal request received. We will review it shortly.' },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
