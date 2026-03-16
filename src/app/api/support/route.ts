import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError } from '@/lib/api/errors';
import { rateLimiters } from '@/lib/api/rate-limit';
import { verifyCsrfToken } from '@/lib/api/csrf';
import { optionalAuth } from '@/lib/api/middleware';
import { createAuditLog, getIpFromRequest } from '@/lib/audit';
import { createLogger } from '@/lib/logger';

const logger = createLogger('SUPPORT');

const supportRequestSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  subject: z.string().min(1).max(200),
  message: z.string().min(10).max(5000),
});

// POST /api/support - Submit a general support/contact request
export async function POST(request: NextRequest) {
  try {
    verifyCsrfToken(request);
    await rateLimiters.contact(request);

    const body = await request.json();
    const validatedData = supportRequestSchema.parse(body);

    const user = await optionalAuth(request);

    await createAuditLog({
      actorUserId: user?.userId || null,
      action: 'support.request',
      entityType: 'support',
      details: {
        name: validatedData.name,
        email: validatedData.email,
        subject: validatedData.subject,
        message: validatedData.message,
      },
      ipAddress: getIpFromRequest(request),
    });

    logger.info(`Support request from ${validatedData.email}: ${validatedData.subject}`);

    return NextResponse.json({
      success: true,
      message: 'Your message has been received. We\'ll get back to you within 24-48 hours.',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
