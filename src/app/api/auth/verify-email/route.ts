import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth/password';
import { handleApiError, successResponse, ApiError } from '@/lib/api/errors';

// GET /api/auth/verify-email?token=xxx - Verify email with token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      throw new ApiError(400, 'BAD_REQUEST', 'Verification token is required');
    }

    // Find all non-expired email verification tokens
    const potentialTokens = await prisma.verificationToken.findMany({
      where: {
        type: 'email_verification',
        expiresAt: {
          gte: new Date(),
        },
      },
      include: { user: true },
    });

    // Verify the token against stored hashes
    let verificationToken = null;
    for (const storedToken of potentialTokens) {
      const isValid = await verifyToken(token, storedToken.token);
      if (isValid) {
        verificationToken = storedToken;
        break;
      }
    }

    if (!verificationToken) {
      throw new ApiError(400, 'INVALID_TOKEN', 'Invalid or expired verification token');
    }

    // Check if token has expired
    if (verificationToken.expiresAt < new Date()) {
      // Delete expired token
      await prisma.verificationToken.delete({
        where: { id: verificationToken.id },
      });
      throw new ApiError(400, 'TOKEN_EXPIRED', 'Verification token has expired. Please request a new one.');
    }

    // Check if email is already verified
    if (verificationToken.user.emailVerified) {
      // Delete the token since it's no longer needed
      await prisma.verificationToken.delete({
        where: { id: verificationToken.id },
      });
      return successResponse({
        message: 'Email is already verified',
        alreadyVerified: true,
      });
    }

    // Update user's emailVerified status
    await prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: true },
    });

    // Delete the used token
    await prisma.verificationToken.delete({
      where: { id: verificationToken.id },
    });

    return successResponse({
      message: 'Email verified successfully',
      verified: true,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
