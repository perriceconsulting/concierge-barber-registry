import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, hashToken } from '@/lib/auth/password';
import { generateTokenPair } from '@/lib/auth/jwt';
import { registerSchema } from '@/lib/validations/auth';
import { handleApiError, successResponse, ValidationErrors } from '@/lib/api/errors';
import { sendWelcomeEmail, sendVerificationEmail } from '@/lib/email';
import { rateLimiters } from '@/lib/api/rate-limit';
import { verifyCsrfToken } from '@/lib/api/csrf';
import { auditAuthEvent } from '@/lib/audit';
import { createLogger } from '@/lib/logger';
import crypto from 'crypto';
import { authCookieOptions } from '@/lib/auth/cookies';

const logger = createLogger('AUTH'); // [AUTH] tag for log messages

export async function POST(request: NextRequest) {
  try {
    // Verify CSRF token
    verifyCsrfToken(request);

    // Apply strict rate limiting (3 requests per hour)
    await rateLimiters.authStrict(request);

    const body = await request.json();

    // Validate input
    const validatedData = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      throw ValidationErrors.EMAIL_EXISTS;
    }

    // Hash password
    const passwordHash = await hashPassword(validatedData.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        passwordHash,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        phone: validatedData.phone,
        role: validatedData.role,
        emailVerified: false,
        agreedToTermsAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const { accessToken, refreshToken } = await generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Hash the refresh token before storing
    const refreshTokenHash = await hashToken(refreshToken);

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

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Hash the token before storing in database
    const hashedToken = await hashToken(verificationToken);

    // Store hashed verification token in database
    await prisma.verificationToken.create({
      data: {
        token: hashedToken,
        userId: user.id,
        type: 'email_verification',
        expiresAt: verificationExpiresAt,
      },
    });

    // Send both emails in parallel
    // DO NOT log email addresses - GDPR violation
    await Promise.all([
      sendWelcomeEmail(user.email, user.firstName, user.role as 'client' | 'barber')
        .then((result) => {
          if (result.success) {
            logger.info('Welcome email sent successfully');
          } else {
            logger.error('Failed to send welcome email:', result.message || result.error);
          }
        })
        .catch((error) => logger.error('Error sending welcome email:', error)),

      sendVerificationEmail(user.email, user.firstName, verificationToken)
        .then((result) => {
          if (result.success) {
            logger.info('Verification email sent successfully');
          } else {
            logger.error('Failed to send verification email:', result.message || result.error);
          }
        })
        .catch((error) => logger.error('Error sending verification email:', error)),
    ]).catch((error) => logger.error('Error in email sending:', error));

    // Set cookies for both tokens (httpOnly for security)
    const response = successResponse(
      {
        user,
        message: 'Account created successfully',
      },
      201
    );

    // Set access token cookie (httpOnly, short-lived)
    response.cookies.set('accessToken', accessToken, authCookieOptions(15 * 60));

    // Set refresh token cookie (httpOnly, long-lived)
    response.cookies.set('refreshToken', refreshToken, authCookieOptions(7 * 24 * 60 * 60));

    // Audit log for successful registration (fire and forget)
    auditAuthEvent('user.register', user.id, request, {
      email: user.email,
      role: user.role,
    }).catch((error) => createLogger('AUDIT').error('Failed to log registration event:', error));

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
