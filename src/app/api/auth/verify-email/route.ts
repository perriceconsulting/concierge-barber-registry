import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handleApiError, successResponse, ApiError } from '@/lib/api/errors';

// GET /api/auth/verify-email?token=xxx - Verify email with token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      throw new ApiError(400, 'BAD_REQUEST', 'Verification token is required');
    }

    // Find the verification token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

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
