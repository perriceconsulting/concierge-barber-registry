import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyRefreshToken, generateTokenPair } from '@/lib/auth/jwt';
import { handleApiError, successResponse, AuthErrors } from '@/lib/api/errors';

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refreshToken')?.value;

    if (!refreshToken) {
      throw AuthErrors.TOKEN_INVALID;
    }

    // Verify the refresh token
    const payload = await verifyRefreshToken(refreshToken);

    if (!payload) {
      throw AuthErrors.TOKEN_EXPIRED;
    }

    // Check if session exists and is not revoked
    const session = await prisma.session.findFirst({
      where: {
        userId: payload.userId,
        refreshTokenHash: refreshToken,
        isRevoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!session) {
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

    // Revoke old session
    await prisma.session.update({
      where: { id: session.id },
      data: { isRevoked: true },
    });

    // Create new session
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        userAgent: request.headers.get('user-agent'),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      },
    });

    // Set new refresh token cookie
    const response = successResponse({ accessToken });

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
