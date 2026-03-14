import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/api/middleware';
import { handleApiError, successResponse } from '@/lib/api/errors';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

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
