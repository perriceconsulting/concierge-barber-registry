import { NextRequest, NextResponse } from 'next/server';
import { runCleanupJob } from '@/lib/session-cleanup';
import { handleApiError } from '@/lib/api/errors';
import { createLogger } from '@/lib/logger';
import crypto from 'crypto';

const logger = createLogger('CRON');

/**
 * Constant-time string comparison to prevent timing attacks
 */
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(a, 'utf8'),
      Buffer.from(b, 'utf8')
    );
  } catch {
    return false;
  }
}

/**
 * Cron job endpoint for cleaning up expired sessions and tokens
 *
 * This endpoint should be called by Vercel Cron or another scheduling service.
 * It's protected by an authorization header to prevent unauthorized execution.
 *
 * To set up with Vercel Cron:
 * 1. Add to vercel.json:
 *    {
 *      "crons": [{
 *        "path": "/api/cron/cleanup",
 *        "schedule": "0 2 * * *"
 *      }]
 *    }
 * 2. Set CRON_SECRET environment variable in Vercel dashboard
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Require CRON_SECRET in all environments
    if (!cronSecret) {
      logger.error('CRON_SECRET not configured - cron endpoint unavailable');
      return NextResponse.json(
        {
          success: false,
          error: 'Service unavailable',
        },
        { status: 503 }
      );
    }

    // Validate authorization header exists and matches (using timing-safe comparison)
    const expectedAuth = `Bearer ${cronSecret}`;
    if (!authHeader || !secureCompare(authHeader, expectedAuth)) {
      logger.warn('Unauthorized cron access attempt', {
        ip: request.headers.get('x-forwarded-for'),
        userAgent: request.headers.get('user-agent'),
        hasAuth: !!authHeader,
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    // Run cleanup job
    const result = await runCleanupJob();

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Cleanup completed successfully',
    });
  } catch (error) {
    logger.error('Error:', error);
    return handleApiError(error);
  }
}

// Vercel Cron uses GET, but also support POST for manual triggers
export const POST = GET;
