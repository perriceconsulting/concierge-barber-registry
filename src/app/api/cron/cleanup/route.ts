import { NextRequest, NextResponse } from 'next/server';
import { runCleanupJob } from '@/lib/session-cleanup';
import { handleApiError } from '@/lib/api/errors';

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

    if (!cronSecret) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cron secret not configured',
        },
        { status: 500 }
      );
    }

    // Check authorization header
    if (authHeader !== `Bearer ${cronSecret}`) {
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
    console.error('[Cron Cleanup] Error:', error);
    return handleApiError(error);
  }
}

// Vercel Cron uses GET, but also support POST for manual triggers
export const POST = GET;
