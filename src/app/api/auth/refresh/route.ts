import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyRefreshToken, generateTokenPair, TokenExpiredError, TokenInvalidError } from '@/lib/auth/jwt';
import { verifyToken, hashToken } from '@/lib/auth/password';
import { handleApiError, successResponse, AuthErrors } from '@/lib/api/errors';
import { rateLimiters } from '@/lib/api/rate-limit';
import { verifyCsrfToken } from '@/lib/api/csrf';

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

    // Find all active sessions for this user
    const sessions = await prisma.session.findMany({
      where: {
        userId: payload.userId,
        isRevoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    // Verify the refresh token against stored hashes
    let matchingSession = null;
    for (const session of sessions) {
      const isValid = await verifyToken(refreshToken, session.refreshTokenHash);
      if (isValid) {
        matchingSession = session;
        break;
      }
    }

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
    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    });

    // Set new refresh token cookie
    response.cookies.set('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
