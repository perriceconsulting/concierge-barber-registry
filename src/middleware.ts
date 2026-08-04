import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAccessToken, verifyRefreshToken, generateAccessToken, TokenExpiredError, TokenInvalidError } from '@/lib/auth/jwt';
import { authCookieOptions } from '@/lib/auth/cookies';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Short marketing alias used on the barber-acquisition ads
  // (conciergebarberregistry.com/join) — hard-redirect straight to barber
  // signup to match the "Get Registered" CTA.
  if (pathname === '/join') {
    return NextResponse.redirect(new URL('/register?role=barber', request.url));
  }

  // Create response
  const response = await handleProtectedRoutes(request);

  // Add security headers to all responses
  addSecurityHeaders(response);

  return response;
}

async function handleProtectedRoutes(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/admin'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // CBR v2.0 — /black-label is gated separately: invitation-only, but on a miss
  // we redirect to the public request-access form instead of /login (preserves
  // marketing funnel for someone who lands on the URL without an account).
  // The /black-label/request-access route itself is always public.
  const isBlackLabelGated =
    pathname === '/black-label' || pathname.startsWith('/black-label/');
  const isBlackLabelPublic = pathname.startsWith('/black-label/request-access');

  if (isBlackLabelGated && !isBlackLabelPublic) {
    const accessToken = request.cookies.get('accessToken')?.value;
    if (!accessToken) {
      return NextResponse.redirect(new URL('/black-label/request-access', request.url));
    }
    try {
      const payload = await verifyAccessToken(accessToken);
      if (payload.role !== 'hnwi' && payload.role !== 'admin') {
        return NextResponse.redirect(new URL('/black-label/request-access', request.url));
      }
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL('/black-label/request-access', request.url));
    }
  }

  if (isProtectedRoute) {
    const accessToken = request.cookies.get('accessToken')?.value;

    if (!accessToken) {
      // No token - redirect to login
      const url = new URL('/login', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    try {
      // Verify token
      const payload = await verifyAccessToken(accessToken);

      // Check role-based access
      if (pathname.startsWith('/admin') && payload.role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      if (pathname.startsWith('/dashboard') && payload.role !== 'barber') {
        return NextResponse.redirect(new URL('/', request.url));
      }

      // Token valid - allow request
      return NextResponse.next();
    } catch (error) {
      // Access token expired — try to refresh using the refresh token
      if (error instanceof TokenExpiredError) {
        const refreshToken = request.cookies.get('refreshToken')?.value;

        if (refreshToken) {
          try {
            const refreshPayload = await verifyRefreshToken(refreshToken);
            const newAccessToken = await generateAccessToken({
              userId: refreshPayload.userId,
              email: refreshPayload.email,
              role: refreshPayload.role,
            });

            // Check role-based access with refreshed payload
            if (pathname.startsWith('/admin') && refreshPayload.role !== 'admin') {
              return NextResponse.redirect(new URL('/dashboard', request.url));
            }
            if (pathname.startsWith('/dashboard') && refreshPayload.role !== 'barber') {
              return NextResponse.redirect(new URL('/', request.url));
            }

            // Allow request and set new access token cookie
            const response = NextResponse.next();
            response.cookies.set('accessToken', newAccessToken, authCookieOptions(15 * 60));
            return response;
          } catch {
            // Refresh token also invalid — fall through to login redirect
          }
        }
      }

      // No valid tokens — redirect to login
      const url = new URL('/login', request.url);
      url.searchParams.set('redirect', pathname);

      if (error instanceof TokenExpiredError) {
        url.searchParams.set('error', 'session_expired');
      } else if (error instanceof TokenInvalidError) {
        url.searchParams.set('error', 'invalid_session');
      }

      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: NextResponse): void {
  // Prevent clickjacking attacks
  response.headers.set('X-Frame-Options', 'DENY');

  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    [
      "frame-ancestors 'none'",
      "connect-src 'self' https://*.blob.vercel-storage.com https://images.unsplash.com",
      "img-src 'self' data: blob: https://*.blob.vercel-storage.com https://images.unsplash.com",
    ].join('; ')
  );

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Enable browser XSS protection (legacy, but doesn't hurt)
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer policy - only send origin on cross-origin requests
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy - restrict browser features
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  // Strict-Transport-Security (HSTS) - only enable in production with HTTPS
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
