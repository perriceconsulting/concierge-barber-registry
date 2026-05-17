import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { withAuth, AuthRequest } from '@/lib/api/middleware';
import { ApiError, handleApiError } from '@/lib/api/errors';
import { decryptPassportSpecs } from '@/lib/crypto/aes';
import { createLogger } from '@/lib/logger';

const logger = createLogger('PASSPORT_BY_TOKEN');

export const runtime = 'nodejs';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * GET /api/passport/by-token?token=...
 *
 * Barber-only. Redeems a single-use share token (minted by /api/passport/share)
 * and returns the decrypted passport specs. The token is marked redeemed
 * atomically so a re-scan returns 410.
 *
 * Caller must be a verified (`approved`) barber — unverified barbers, even if
 * authenticated, cannot read another user's passport.
 */
async function byTokenHandler(request: AuthRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const token = searchParams.get('token');
    if (!token) {
      throw new ApiError(400, 'MISSING_TOKEN', 'token query param is required.');
    }

    // Verify caller is an approved barber.
    const barber = await prisma.barberProfile.findFirst({
      where: { userId: request.userId! },
      select: { id: true, displayName: true, verificationStatus: true },
    });
    if (!barber) {
      throw new ApiError(403, 'NOT_BARBER', 'Only verified barbers can scan a Grooming Passport.');
    }
    if (barber.verificationStatus !== 'approved') {
      throw new ApiError(
        403,
        'NOT_VERIFIED',
        'Your verification is not complete — you cannot redeem passport tokens yet.',
      );
    }

    const tokenHash = hashToken(token);
    const share = await prisma.passportShareToken.findUnique({
      where: { tokenHash },
      include: {
        passport: {
          include: {
            client: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!share) {
      throw new ApiError(404, 'INVALID_TOKEN', 'This passport token is not recognized.');
    }
    if (share.redeemedAt) {
      throw new ApiError(
        410,
        'TOKEN_ALREADY_USED',
        'This passport token has already been used. Ask the client to mint a fresh one.',
      );
    }
    if (share.expiresAt < new Date()) {
      throw new ApiError(
        410,
        'TOKEN_EXPIRED',
        'This passport token expired. Ask the client to mint a fresh one.',
      );
    }

    // Atomically mark redeemed — guard against a race where two scans arrive
    // simultaneously. The unique constraint on tokenHash + the WHERE on
    // redeemedAt: null ensures only one wins.
    const claim = await prisma.passportShareToken.updateMany({
      where: { id: share.id, redeemedAt: null },
      data: { redeemedAt: new Date(), redeemedByUserId: request.userId! },
    });
    if (claim.count === 0) {
      throw new ApiError(410, 'TOKEN_ALREADY_USED', 'This token was just used by another scan.');
    }

    const decrypted = decryptPassportSpecs(Buffer.from(share.passport.encryptedSpecs));

    return NextResponse.json({
      success: true,
      data: {
        client: {
          firstName: share.passport.client.firstName,
          lastName: share.passport.client.lastName,
        },
        specs: JSON.parse(decrypted),
        passportUpdatedAt: share.passport.updatedAt,
      },
    });
  } catch (error) {
    logger.error('Token redemption failed', error);
    return handleApiError(error);
  }
}

export const GET = withAuth(byTokenHandler, { requiredRole: 'barber', skipCsrf: true });
