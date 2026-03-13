import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyRefreshToken } from '@/lib/auth/jwt';
import { handleApiError, successResponse } from '@/lib/api/errors';

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refreshToken')?.value;

    if (refreshToken) {
      // Verify and decode the refresh token
      const payload = await verifyRefreshToken(refreshToken);

      if (payload) {
        // Revoke the session in database
        await prisma.session.updateMany({
          where: {
            userId: payload.userId,
            refreshTokenHash: refreshToken,
          },
          data: {
            isRevoked: true,
          },
        });
      }
    }

    // Clear the refresh token cookie
    const response = successResponse({ message: 'Logged out successfully' });

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
