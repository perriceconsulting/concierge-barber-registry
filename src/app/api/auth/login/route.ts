import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword, hashToken } from '@/lib/auth/password';
import { generateTokenPair } from '@/lib/auth/jwt';
import { loginSchema } from '@/lib/validations/auth';
import { handleApiError, successResponse, AuthErrors } from '@/lib/api/errors';
import { rateLimiters } from '@/lib/api/rate-limit';
import { verifyCsrfToken } from '@/lib/api/csrf';

export async function POST(request: NextRequest) {
  try {
    // Verify CSRF token
    verifyCsrfToken(request);

    // Apply rate limiting (5 requests per 15 minutes)
    await rateLimiters.auth(request);

    const body = await request.json();

    // Validate input
    const validatedData = loginSchema.parse(body);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (!user || !user.passwordHash) {
      throw AuthErrors.INVALID_CREDENTIALS;
    }

    // Verify password
    const isValidPassword = await verifyPassword(validatedData.password, user.passwordHash);

    if (!isValidPassword) {
      throw AuthErrors.INVALID_CREDENTIALS;
    }

    // Check if account is active
    if (!user.isActive) {
      throw AuthErrors.ACCOUNT_DEACTIVATED;
    }

    // Check if email is verified (optional: can be disabled for development)
    if (!user.emailVerified && process.env.REQUIRE_EMAIL_VERIFICATION !== 'false') {
      throw AuthErrors.EMAIL_NOT_VERIFIED;
    }

    // Generate tokens
    const { accessToken, refreshToken } = await generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Hash the refresh token before storing
    const refreshTokenHash = await hashToken(refreshToken);

    // Enforce maximum sessions per user
    const MAX_SESSIONS_PER_USER = 5;
    const activeSessions = await prisma.session.count({
      where: {
        userId: user.id,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (activeSessions >= MAX_SESSIONS_PER_USER) {
      // Delete oldest session to make room
      const oldestSession = await prisma.session.findFirst({
        where: {
          userId: user.id,
          isRevoked: false,
        },
        orderBy: { createdAt: 'asc' },
      });

      if (oldestSession) {
        await prisma.session.delete({ where: { id: oldestSession.id } });
      }
    }

    // Store hashed refresh token in database
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        userAgent: request.headers.get('user-agent'),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      },
    });

    // Prepare user response (exclude sensitive fields)
    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      emailVerified: user.emailVerified,
      avatarUrl: user.avatarUrl,
    };

    // Set cookies for both tokens (httpOnly for security)
    const response = successResponse({
      user: userResponse,
      message: 'Logged in successfully',
    });

    // Set access token cookie (httpOnly, short-lived)
    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    });

    // Set refresh token cookie (httpOnly, long-lived)
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
