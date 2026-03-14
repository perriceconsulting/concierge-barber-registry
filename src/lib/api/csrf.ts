import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { ApiError } from './errors';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Generate a CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Set CSRF token in cookie
 */
export function setCsrfToken(response: NextResponse): string {
  const token = generateCsrfToken();

  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Must be readable by JavaScript to send in headers
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });

  return token;
}

/**
 * Verify CSRF token from request
 *
 * @throws {ApiError} If CSRF token is invalid or missing
 */
export function verifyCsrfToken(request: NextRequest): void {
  // Skip CSRF for GET, HEAD, OPTIONS (safe methods)
  const method = request.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return;
  }

  // Get token from header
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  // Get token from cookie
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;

  // Both must exist and match
  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    throw new ApiError(
      403,
      'CSRF_TOKEN_INVALID',
      'Invalid or missing CSRF token'
    );
  }
}

/**
 * Middleware to add CSRF token to response
 * Call this in your route handlers to set the token
 */
export function withCsrfToken(response: NextResponse): NextResponse {
  const existingToken = response.cookies.get(CSRF_COOKIE_NAME);

  if (!existingToken) {
    setCsrfToken(response);
  }

  return response;
}

/**
 * Get CSRF token endpoint - for client to retrieve token
 * Add this as GET /api/csrf-token
 */
export function createCsrfTokenEndpoint() {
  return async (request: NextRequest) => {
    const token = generateCsrfToken();

    const response = NextResponse.json({
      success: true,
      data: { csrfToken: token },
    });

    response.cookies.set(CSRF_COOKIE_NAME, token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;
  };
}
