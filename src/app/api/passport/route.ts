import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withAuth, AuthRequest } from '@/lib/api/middleware';
import { ApiError, handleApiError } from '@/lib/api/errors';
import { encryptPassportSpecs, decryptPassportSpecs } from '@/lib/crypto/aes';
import { createLogger } from '@/lib/logger';

const logger = createLogger('PASSPORT');

export const runtime = 'nodejs';

// Cap the unencrypted JSON at 32 KB — that's miles more than a real passport
// would ever need (a few hundred bytes), so anything bigger is suspicious.
const MAX_SPECS_BYTES = 32 * 1024;

// Free-form spec object. We don't enforce a particular schema since the UI
// shape is PD-1 blocked — we just enforce that it's an object and not too big.
const upsertSchema = z.object({
  specs: z.record(z.unknown()),
});

/**
 * GET /api/passport — return the caller's decrypted passport, or null if
 * none exists. Client-only.
 */
async function getPassportHandler(request: AuthRequest) {
  try {
    const userId = request.userId!;
    const passport = await prisma.groomingPassport.findUnique({
      where: { clientUserId: userId },
    });

    if (!passport) {
      return NextResponse.json({ success: true, data: { passport: null } });
    }

    const decrypted = decryptPassportSpecs(Buffer.from(passport.encryptedSpecs));
    return NextResponse.json({
      success: true,
      data: {
        passport: {
          id: passport.id,
          specs: JSON.parse(decrypted),
          keyVersion: passport.keyVersion,
          createdAt: passport.createdAt,
          updatedAt: passport.updatedAt,
        },
      },
    });
  } catch (error) {
    logger.error('Get passport failed', error);
    return handleApiError(error);
  }
}

/**
 * POST /api/passport — upsert the caller's passport. The body is
 * `{ specs: {...} }`; the server JSON-stringifies and encrypts.
 */
async function upsertPassportHandler(request: AuthRequest) {
  try {
    const userId = request.userId!;
    const body = await request.json();
    const parsed = upsertSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid passport body', parsed.error.format());
    }

    const plaintext = JSON.stringify(parsed.data.specs);
    if (Buffer.byteLength(plaintext, 'utf8') > MAX_SPECS_BYTES) {
      throw new ApiError(413, 'PAYLOAD_TOO_LARGE', `Passport specs must be under ${MAX_SPECS_BYTES} bytes.`);
    }

    const { data: encrypted, keyVersion } = encryptPassportSpecs(plaintext);
    // Prisma's Bytes field types as Uint8Array<ArrayBuffer>; Buffer extends
    // Uint8Array but TS is strict about the underlying ArrayBufferLike.
    const encryptedBytes = new Uint8Array(encrypted);

    const passport = await prisma.groomingPassport.upsert({
      where: { clientUserId: userId },
      create: {
        clientUserId: userId,
        encryptedSpecs: encryptedBytes,
        keyVersion,
      },
      update: {
        encryptedSpecs: encryptedBytes,
        keyVersion,
      },
      select: { id: true, keyVersion: true, createdAt: true, updatedAt: true },
    });

    return NextResponse.json({ success: true, data: { passport } });
  } catch (error) {
    logger.error('Upsert passport failed', error);
    return handleApiError(error);
  }
}

export const GET = withAuth(getPassportHandler, { requiredRole: 'client' });
export const POST = withAuth(upsertPassportHandler, { requiredRole: 'client' });
// PUT and POST do the same thing here — accept both so callers don't have to think.
export const PUT = withAuth(upsertPassportHandler, { requiredRole: 'client' });
