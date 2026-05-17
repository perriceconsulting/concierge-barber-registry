import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/api/middleware';
import { ApiError, handleApiError, successResponse, AuthErrors } from '@/lib/api/errors';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // /api/auth/me is the "who am I?" question used by the global header.
    // For guests it should return 200 { user: null } rather than 401 — a 401
    // pollutes the browser console on every public-page load. Auth-required
    // endpoints (everywhere else) still 401 correctly.
    let authUser;
    try {
      authUser = await getAuthUser(request);
    } catch (err) {
      // Only swallow the routine "not logged in" / token-issue cases. Other
      // errors (e.g. DB failures inside getAuthUser) should still surface.
      if (
        err instanceof ApiError &&
        ['UNAUTHORIZED', 'AUTH_TOKEN_EXPIRED', 'AUTH_TOKEN_INVALID'].includes(err.code)
      ) {
        return successResponse({ user: null });
      }
      throw err;
    }

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

    // Check for admin role override (allows admin to test as other roles)
    let activeRole = user.role;
    const isAdmin = user.role === 'admin';
    const roleOverride = request.cookies.get('adminRoleOverride')?.value;
    if (isAdmin && roleOverride && ['client', 'barber'].includes(roleOverride)) {
      activeRole = roleOverride as typeof user.role;
    }

    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: activeRole,
        actualRole: user.role,
        emailVerified: user.emailVerified,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
