import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAccessToken, TokenExpiredError, TokenInvalidError } from '@/lib/auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/admin'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

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
      // Token expired or invalid - redirect to login with appropriate message
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

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
  ],
};
