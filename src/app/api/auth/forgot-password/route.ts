import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { forgotPasswordSchema } from '@/lib/validations/auth';
import { generateToken, hashToken } from '@/lib/auth/password';
import { handleApiError, successResponse } from '@/lib/api/errors';
import { rateLimiters } from '@/lib/api/rate-limit';
import { sendPasswordResetEmail } from '@/lib/email';
import { createLogger } from '@/lib/logger';

const logger = createLogger('AUTH'); // [AUTH] tag for log messages

export async function POST(request: NextRequest) {
  try {
    // Apply strict rate limiting (3 requests per hour)
    await rateLimiters.authStrict(request);

    const body = await request.json();

    // Validate input
    const validatedData = forgotPasswordSchema.parse(body);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return successResponse({
        message: 'If an account exists with this email, you will receive password reset instructions.',
      });
    }

    // Delete any existing password reset tokens for this user
    await prisma.verificationToken.deleteMany({
      where: {
        userId: user.id,
        type: 'password_reset',
      },
    });

    // Generate password reset token
    const resetToken = generateToken(32);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Hash token before storing
    const hashedToken = await hashToken(resetToken);

    // Store hashed reset token
    await prisma.verificationToken.create({
      data: {
        token: hashedToken,
        userId: user.id,
        type: 'password_reset',
        expiresAt,
      },
    });

    // Send password reset email (fire and forget to prevent timing attacks)
    // DO NOT log email addresses - GDPR violation
    sendPasswordResetEmail(user.email, user.firstName, resetToken)
      .then((result) => {
        if (result.success) {
          logger.info('Password reset email sent successfully');
        } else {
          logger.error('Failed to send password reset email:', result.message || result.error);
        }
      })
      .catch((error) => logger.error('Error sending password reset email:', error));

    return successResponse({
      message: 'If an account exists with this email, you will receive password reset instructions.',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
