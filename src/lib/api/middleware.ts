import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { AuthErrors, handleApiError } from '@/lib/api/errors';
import { UserRole } from '@/types';

export interface AuthRequest extends NextRequest {
  userId?: string;
  userEmail?: string;
  userRole?: UserRole;
}

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string;
    email: string;
    role: UserRole;
  };
}

/**
 * Extract and verify JWT token from request
 */
export async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    throw AuthErrors.UNAUTHORIZED;
  }

  const payload = await verifyAccessToken(token);

  if (!payload) {
    throw AuthErrors.TOKEN_EXPIRED;
  }

  return {
    userId: payload.userId,
    email: payload.email,
    role: payload.role as UserRole,
  };
}

/**
 * Middleware to require authentication
 */
export async function requireAuth(request: NextRequest) {
  return await getAuthUser(request);
}

/**
 * Middleware to require specific role
 */
export async function requireRole(request: NextRequest, role: UserRole | UserRole[]) {
  const user = await getAuthUser(request);

  const allowedRoles = Array.isArray(role) ? role : [role];

  if (!allowedRoles.includes(user.role)) {
    throw AuthErrors.FORBIDDEN;
  }

  return user;
}

/**
 * Middleware to require admin role
 */
export async function requireAdmin(request: NextRequest) {
  return await requireRole(request, 'admin');
}

/**
 * Middleware to require barber role
 */
export async function requireBarber(request: NextRequest) {
  return await requireRole(request, 'barber');
}

/**
 * Middleware to require client role
 */
export async function requireClient(request: NextRequest) {
  return await requireRole(request, 'client');
}

/**
 * Optional auth - doesn't throw if not authenticated
 */
export async function optionalAuth(request: NextRequest) {
  try {
    return await getAuthUser(request);
  } catch (error) {
    return null;
  }
}

/**
 * Higher-order function to wrap API route handlers with authentication
 */

type ApiHandler = (req: AuthRequest, context?: any) => Promise<NextResponse> | NextResponse;

interface WithAuthOptions {
  requiredRole?: UserRole | UserRole[];
}

export function withAuth(
  handler: ApiHandler,
  options: WithAuthOptions = {}
): (req: NextRequest, context?: any) => Promise<NextResponse> {
  return async (req: NextRequest, context?: any) => {
    try {
      // Extract and verify auth
      const user = await getAuthUser(req);

      // Check role if specified
      if (options.requiredRole) {
        const allowedRoles = Array.isArray(options.requiredRole)
          ? options.requiredRole
          : [options.requiredRole];

        if (!allowedRoles.includes(user.role)) {
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          );
        }
      }

      // Attach user info to request
      const authReq = req as AuthRequest;
      authReq.userId = user.userId;
      authReq.userEmail = user.email;
      authReq.userRole = user.role;

      // Call the handler
      return await handler(authReq, context);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
