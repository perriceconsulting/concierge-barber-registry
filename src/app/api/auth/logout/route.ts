import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyRefreshToken } from '@/lib/auth/jwt';
import { hashToken } from '@/lib/auth/password';
import { handleApiError, successResponse } from '@/lib/api/errors';
import { verifyCsrfToken } from '@/lib/api/csrf';
import { rateLimiters } from '@/lib/api/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Verify CSRF token
    verifyCsrfToken(request);

    // Apply rate limiting to prevent DoS
    await rateLimiters.api(request);

    const refreshToken = request.cookies.get('refreshToken')?.value;

    if (refreshToken) {
      // Verify and decode the refresh token
      const payload = await verifyRefreshToken(refreshToken);

      if (payload) {
        // SECURITY FIX: Prevent timing attack from N bcrypt operations
        // Solution: Hash the refresh token and lookup by hash
        const refreshTokenHash = await hashToken(refreshToken);

        // Find matching session by hash (O(1) lookup)
        const matchingSession = await prisma.session.findFirst({
          where: {
            userId: payload.userId,
            refreshTokenHash: refreshTokenHash,
            isRevoked: false,
          },
        });

        if (matchingSession) {
          await prisma.session.update({
            where: { id: matchingSession.id },
            data: { isRevoked: true },
          });
        }
      }
    }

    // Clear both token cookies
    const response = successResponse({ message: 'Logged out successfully' });

    // Clear access token
    response.cookies.set('accessToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });

    // Clear refresh token
    response.cookies.set('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
