import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { handleApiError, successResponse, AuthErrors } from '@/lib/api/errors';

export async function GET(request: NextRequest) {
  try {
    // Get access token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      throw AuthErrors.UNAUTHORIZED;
    }

    // Verify token
    const payload = await verifyAccessToken(token);

    if (!payload) {
      throw AuthErrors.TOKEN_EXPIRED;
    }

    // Get user with profile data
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        role: true,
        emailVerified: true,
        isActive: true,
        createdAt: true,
        barberProfile: {
          select: {
            id: true,
            displayName: true,
            slug: true,
            verificationStatus: true,
            averageRating: true,
            totalReviews: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw AuthErrors.ACCOUNT_DEACTIVATED;
    }

    return successResponse(user);
  } catch (error) {
    return handleApiError(error);
  }
}
