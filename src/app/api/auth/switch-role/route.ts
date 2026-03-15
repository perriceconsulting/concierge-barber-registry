import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/api/middleware';
import { handleApiError, successResponse, ApiError } from '@/lib/api/errors';
import { verifyCsrfToken } from '@/lib/api/csrf';

const VALID_ROLES = ['client', 'barber', 'admin'] as const;

// POST /api/auth/switch-role - Switch active role (admin only)
export async function POST(request: NextRequest) {
  try {
    verifyCsrfToken(request);

    const authUser = await getAuthUser(request);

    // Only admins can switch roles
    if (authUser.role !== 'admin') {
      throw new ApiError(403, 'FORBIDDEN', 'Only admins can switch roles');
    }

    const body = await request.json();
    const { role } = body;

    if (!role || !VALID_ROLES.includes(role)) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid role');
    }

    const response = successResponse({
      message: `Switched to ${role} view`,
      activeRole: role,
    });

    if (role === 'admin') {
      // Clear the override — use actual role
      response.cookies.set('adminRoleOverride', '', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0,
        path: '/',
      });
    } else {
      // Set override cookie
      response.cookies.set('adminRoleOverride', role, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60, // 1 day
        path: '/',
      });
    }

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
