import { NextResponse } from 'next/server';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { prisma } from '@/lib/db';
import { withAuth, AuthRequest } from '@/lib/api/middleware';
import { ApiError, handleApiError } from '@/lib/api/errors';
import { createLogger } from '@/lib/logger';

const logger = createLogger('PASSPORT_SHARE');

export const runtime = 'nodejs';

// 5-minute window — long enough for the client to show the QR + the barber to
// scan, short enough that a screenshot leaked online is mostly harmless.
const SHARE_TTL_MS = 5 * 60 * 1000;

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * POST /api/passport/share — mint a single-use share token + QR PNG.
 *
 * Returns:
 *   - `token`: opaque string (256 bits, base64url) — embed in the QR
 *   - `qrPngDataUrl`: pre-rendered QR pointing at the redemption URL
 *   - `expiresAt`: ISO timestamp 5 minutes out
 *
 * The token is hashed before storage (same pattern as session refresh tokens),
 * so a leaked DB never leaks a redeemable token.
 */
async function shareHandler(request: AuthRequest) {
  try {
    const userId = request.userId!;
    const passport = await prisma.groomingPassport.findUnique({
      where: { clientUserId: userId },
      select: { id: true },
    });
    if (!passport) {
      throw new ApiError(
        404,
        'NO_PASSPORT',
        'You have not yet created a Grooming Passport. Build one first.',
      );
    }

    const token = crypto.randomBytes(32).toString('base64url');
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + SHARE_TTL_MS);

    await prisma.passportShareToken.create({
      data: { passportId: passport.id, tokenHash, expiresAt },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redemptionUrl = `${appUrl}/passport/scan?token=${encodeURIComponent(token)}`;

    const qrPngDataUrl = await QRCode.toDataURL(redemptionUrl, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 320,
      color: { dark: '#0D0D0D', light: '#F5F5F5' },
    });

    return NextResponse.json({
      success: true,
      data: {
        token,
        qrPngDataUrl,
        redemptionUrl,
        expiresAt: expiresAt.toISOString(),
        ttlSeconds: Math.floor(SHARE_TTL_MS / 1000),
      },
    });
  } catch (error) {
    logger.error('Share token mint failed', error);
    return handleApiError(error);
  }
}

export const POST = withAuth(shareHandler, { requiredRole: 'client' });
