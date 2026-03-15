import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api/middleware';
import { hashToken } from '@/lib/auth/password';
import { handleApiError, successResponse, ApiError } from '@/lib/api/errors';
import { sendVerificationEmail } from '@/lib/email';
import crypto from 'crypto';

// POST /api/auth/resend-verification - Resend email verification
const resendVerificationHandler = async (request: any) => {
  try {
    const userId = request.userId;

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        emailVerified: true,
      },
    });

    if (!user) {
      throw new ApiError(404, 'NOT_FOUND', 'User not found');
    }

    // Check if already verified
    if (user.emailVerified) {
      return successResponse({
        message: 'Email is already verified',
        alreadyVerified: true,
      });
    }

    // Delete any existing unused verification tokens for this user
    await prisma.verificationToken.deleteMany({
      where: {
        userId: user.id,
        type: 'email_verification',
      },
    });

    // Generate new verification token (random 64-char hex string)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Hash token before storing
    const hashedToken = await hashToken(token);

    // Store hashed token in database
    await prisma.verificationToken.create({
      data: {
        token: hashedToken,
        userId: user.id,
        type: 'email_verification',
        expiresAt,
      },
    });

    // Send verification email (fire and forget)
    sendVerificationEmail(user.email, user.firstName, token)
      .then((result) => {
        if (result.success) {
          console.log(`Verification email sent to ${user.email}`);
        } else {
          console.error(`Failed to send verification email to ${user.email}:`, result.message || result.error);
        }
      })
      .catch((error) => {
        console.error(`Error sending verification email to ${user.email}:`, error);
      });

    return successResponse({
      message: 'Verification email sent successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
};

export const POST = withAuth(resendVerificationHandler);
