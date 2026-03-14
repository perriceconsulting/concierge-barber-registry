import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { forgotPasswordSchema } from '@/lib/validations/auth';
import { generateToken } from '@/lib/auth/password';
import { handleApiError, successResponse, ResourceErrors } from '@/lib/api/errors';
import { rateLimiters } from '@/lib/api/rate-limit';

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

    // Store reset token
    await prisma.verificationToken.create({
      data: {
        token: resetToken,
        userId: user.id,
        type: 'password_reset',
        expiresAt,
      },
    });

    // TODO: Send password reset email
    // const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
    // await sendPasswordResetEmail(user.email, user.firstName, resetUrl);

    console.log(`Password reset token for ${user.email}: ${resetToken}`);

    return successResponse({
      message: 'If an account exists with this email, you will receive password reset instructions.',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
