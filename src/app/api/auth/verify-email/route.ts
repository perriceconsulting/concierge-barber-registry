import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { hashToken } from '@/lib/auth/password';
import { generateTokenPair } from '@/lib/auth/jwt';
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

    const user = verificationToken.user;

    // Check if email is already verified
    if (user.emailVerified) {
      await prisma.verificationToken.delete({
        where: { id: verificationToken.id },
      });

      // Auto-login even if already verified
      const response = await createSessionResponse(user, request);
      return response;
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

    // Auto-login after verification
    const response = await createSessionResponse(user, request);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

async function createSessionResponse(
  user: { id: string; email: string; role: string; emailVerified: boolean },
  request: NextRequest,
) {
  const { accessToken, refreshToken } = await generateTokenPair({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const refreshTokenHash = await hashToken(refreshToken);
  const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId: user.id,
      refreshTokenHash,
      expiresAt: sessionExpiresAt,
      userAgent: request.headers.get('user-agent'),
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    },
  });

  const response = successResponse({
    message: user.emailVerified ? 'Email is already verified' : 'Email verified successfully',
    alreadyVerified: user.emailVerified,
    verified: !user.emailVerified,
    role: user.role,
  });

  response.cookies.set('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60,
    path: '/',
  });

  response.cookies.set('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  });

  return response;
}
