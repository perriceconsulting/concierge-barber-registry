import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyRefreshToken, generateTokenPair, TokenExpiredError, TokenInvalidError } from '@/lib/auth/jwt';
import { hashToken } from '@/lib/auth/password';
import { handleApiError, successResponse, AuthErrors } from '@/lib/api/errors';
import { rateLimiters } from '@/lib/api/rate-limit';
import { verifyCsrfToken } from '@/lib/api/csrf';
import { authCookieOptions } from '@/lib/auth/cookies';

export async function POST(request: NextRequest) {
  try {
    // Verify CSRF token to prevent CSRF attacks on token refresh
    verifyCsrfToken(request);

    // Add rate limiting to prevent brute force attacks
    await rateLimiters.auth(request);

    const refreshToken = request.cookies.get('refreshToken')?.value;

    if (!refreshToken) {
      throw AuthErrors.TOKEN_INVALID;
    }

    // Verify the refresh token (now throws errors instead of returning null)
    let payload;
    try {
      payload = await verifyRefreshToken(refreshToken);
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw AuthErrors.TOKEN_EXPIRED;
      }
      if (error instanceof TokenInvalidError) {
        throw AuthErrors.TOKEN_INVALID;
      }
      throw error;
    }

    // SECURITY FIX: Prevent timing attack from N bcrypt operations
    // Solution: Hash the refresh token and lookup by hash
    // Note: Sessions don't have unique constraint on refreshTokenHash but we can
    // limit the search to this specific user which should typically be 1-5 sessions max
    const refreshTokenHash = await hashToken(refreshToken);

    // Find matching session by token hash for this user (limited scope)
    const matchingSession = await prisma.session.findFirst({
      where: {
        userId: payload.userId,
        refreshTokenHash: refreshTokenHash,
        isRevoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!matchingSession) {
      throw AuthErrors.TOKEN_INVALID;
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw AuthErrors.ACCOUNT_DEACTIVATED;
    }

    // Generate new token pair
    const { accessToken, refreshToken: newRefreshToken } = await generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Hash the new refresh token
    const newRefreshTokenHash = await hashToken(newRefreshToken);

    // Revoke old session
    await prisma.session.update({
      where: { id: matchingSession.id },
      data: { isRevoked: true },
    });

    // Create new session with hashed token
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: newRefreshTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        userAgent: request.headers.get('user-agent'),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      },
    });

    // Set new token cookies
    const response = successResponse({ message: 'Token refreshed successfully' });

    // Set new access token cookie
    response.cookies.set('accessToken', accessToken, authCookieOptions(15 * 60));

    // Set new refresh token cookie
    response.cookies.set('refreshToken', newRefreshToken, authCookieOptions(7 * 24 * 60 * 60));

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
