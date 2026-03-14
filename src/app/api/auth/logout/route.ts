import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyRefreshToken } from '@/lib/auth/jwt';
import { verifyToken } from '@/lib/auth/password';
import { handleApiError, successResponse } from '@/lib/api/errors';
import { verifyCsrfToken } from '@/lib/api/csrf';

export async function POST(request: NextRequest) {
  try {
    // Verify CSRF token
    verifyCsrfToken(request);

    const refreshToken = request.cookies.get('refreshToken')?.value;

    if (refreshToken) {
      // Verify and decode the refresh token
      const payload = await verifyRefreshToken(refreshToken);

      if (payload) {
        // Find all active sessions for this user
        const sessions = await prisma.session.findMany({
          where: {
            userId: payload.userId,
            isRevoked: false,
          },
        });

        // Find and revoke the matching session
        for (const session of sessions) {
          const isValid = await verifyToken(refreshToken, session.refreshTokenHash);
          if (isValid) {
            await prisma.session.update({
              where: { id: session.id },
              data: { isRevoked: true },
            });
            break;
          }
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
