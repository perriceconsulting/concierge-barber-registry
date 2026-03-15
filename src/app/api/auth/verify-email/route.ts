import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { hashToken } from '@/lib/auth/password';
import { handleApiError, successResponse, ApiError } from '@/lib/api/errors';
import { rateLimiters } from '@/lib/api/rate-limit';

// GET /api/auth/verify-email?token=xxx - Verify email with token
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting to prevent token brute-forcing
    await rateLimiters.auth(request);

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      throw new ApiError(400, 'BAD_REQUEST', 'Verification token is required');
    }

    // SECURITY FIX: Prevent timing attack from N bcrypt operations
    // Solution: Hash the provided token and lookup by hash (O(1) via unique index)
    const tokenHash = await hashToken(token);

    const verificationToken = await prisma.verificationToken.findUnique({
      where: {
        token: tokenHash,
      },
      include: { user: true },
    });

    // Verify token type and expiration (constant time checks)
    if (!verificationToken || verificationToken.type !== 'email_verification') {
      throw new ApiError(400, 'INVALID_TOKEN', 'Invalid verification token');
    }

    // Check if token has expired
    if (verificationToken.expiresAt < new Date()) {
      // Delete expired token
      await prisma.verificationToken.delete({
        where: { id: verificationToken.id },
      });
      throw new ApiError(400, 'TOKEN_EXPIRED', 'Verification token has expired. Please request a new one.');
    }

    // Check if email is already verified
    if (verificationToken.user.emailVerified) {
      // Delete the token since it's no longer needed
      await prisma.verificationToken.delete({
        where: { id: verificationToken.id },
      });
      return successResponse({
        message: 'Email is already verified',
        alreadyVerified: true,
        role: verificationToken.user.role,
      });
    }

    // Update user's emailVerified status
    await prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: true },
    });

    // Delete the used token
    await prisma.verificationToken.delete({
      where: { id: verificationToken.id },
    });

    return successResponse({
      message: 'Email verified successfully',
      verified: true,
      role: verificationToken.user.role,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
