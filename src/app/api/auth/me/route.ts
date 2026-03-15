import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/api/middleware';
import { handleApiError, successResponse, AuthErrors } from '@/lib/api/errors';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);

    // Fetch full user data from database
    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        emailVerified: true,
        avatarUrl: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw AuthErrors.ACCOUNT_DEACTIVATED;
    }

    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        emailVerified: user.emailVerified,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
