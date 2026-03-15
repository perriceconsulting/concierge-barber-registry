import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, TokenExpiredError, TokenInvalidError } from '@/lib/auth/jwt';
import { AuthErrors, handleApiError } from '@/lib/api/errors';
import { UserRole } from '@/types';
import { verifyCsrfToken } from '@/lib/api/csrf';

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
 * Supports both cookie-based (preferred) and Authorization header (for API clients)
 */
export async function getAuthUser(request: NextRequest) {
  // Try to get token from cookie first (more secure)
  let token = request.cookies.get('accessToken')?.value;

  // Fallback to Authorization header for API clients
  if (!token) {
    const authHeader = request.headers.get('authorization');
    token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  }

  if (!token) {
    throw AuthErrors.UNAUTHORIZED;
  }

  try {
    const payload = await verifyAccessToken(token);

    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role as UserRole,
    };
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      throw AuthErrors.TOKEN_EXPIRED;
    }
    if (error instanceof TokenInvalidError) {
      throw AuthErrors.TOKEN_INVALID;
    }
    throw error;
  }
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
  } catch {
    return null;
  }
}

/**
 * Higher-order function to wrap API route handlers with authentication
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RouteContext = { params: Promise<any> } | undefined;

type ApiHandler = (req: AuthRequest, context?: RouteContext) => Promise<NextResponse> | NextResponse;

interface WithAuthOptions {
  requiredRole?: UserRole | UserRole[];
  skipCsrf?: boolean; // Allow skipping CSRF for specific endpoints (e.g., GET requests)
}

export function withAuth(
  handler: ApiHandler,
  options: WithAuthOptions = {}
): (req: NextRequest, context?: RouteContext) => Promise<NextResponse> {
  return async (req: NextRequest, context?: RouteContext) => {
    try {
      // Verify CSRF token for state-changing requests (POST, PUT, DELETE, PATCH)
      const isStateChanging = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method);

      if (isStateChanging && !options.skipCsrf) {
        try {
          verifyCsrfToken(req);
        } catch {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'CSRF_TOKEN_INVALID',
                message: 'CSRF token validation failed'
              }
            },
            { status: 403 }
          );
        }
      }

      // Extract and verify auth
      const user = await getAuthUser(req);

      // Check role if specified
      if (options.requiredRole) {
        const allowedRoles = Array.isArray(options.requiredRole)
          ? options.requiredRole
          : [options.requiredRole];

        // Explicit role check - admin doesn't bypass unless explicitly allowed
        if (!allowedRoles.includes(user.role)) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'FORBIDDEN',
                message: 'Insufficient permissions'
              }
            },
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
