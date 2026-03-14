import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, hashToken } from '@/lib/auth/password';
import { generateTokenPair } from '@/lib/auth/jwt';
import { registerSchema } from '@/lib/validations/auth';
import { handleApiError, successResponse, ValidationErrors } from '@/lib/api/errors';
import { sendWelcomeEmail, sendVerificationEmail } from '@/lib/email';
import { rateLimiters } from '@/lib/api/rate-limit';
import { verifyCsrfToken } from '@/lib/api/csrf';
import crypto from 'crypto';

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

    // Store verification token in database
    await prisma.verificationToken.create({
      data: {
        token: verificationToken,
        userId: user.id,
        type: 'email_verification',
        expiresAt: verificationExpiresAt,
      },
    });

    // Send both emails in parallel
    await Promise.all([
      sendWelcomeEmail(user.email, user.firstName, user.role as 'client' | 'barber')
        .then((result) => {
          if (result.success) {
            console.log(`✅ Welcome email sent to ${user.email}`);
          } else {
            console.error(`❌ Failed to send welcome email to ${user.email}:`, result.message || result.error);
          }
        })
        .catch((error) => console.error(`❌ Error sending welcome email:`, error)),

      sendVerificationEmail(user.email, user.firstName, verificationToken)
        .then((result) => {
          if (result.success) {
            console.log(`✅ Verification email sent to ${user.email}`);
          } else {
            console.error(`❌ Failed to send verification email to ${user.email}:`, result.message || result.error);
          }
        })
        .catch((error) => console.error(`❌ Error sending verification email:`, error)),
    ]).catch((error) => console.error(`❌ Error in email sending:`, error));

    // Set cookies for both tokens (httpOnly for security)
    const response = successResponse(
      {
        user,
        message: 'Account created successfully',
      },
      201
    );

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
