import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { resetPasswordSchema } from '@/lib/validations/auth';
import { hashPassword, hashToken } from '@/lib/auth/password';
import { handleApiError, successResponse, AuthErrors } from '@/lib/api/errors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = resetPasswordSchema.parse(body);

    // SECURITY FIX: Prevent timing attack from N bcrypt operations
    // Solution: Hash the provided token and lookup by hash (O(1) via unique index)
    const tokenHash = await hashToken(validatedData.token);

    const tokenRecord = await prisma.verificationToken.findUnique({
      where: {
        token: tokenHash,
      },
      include: { user: true },
    });

    // Verify token type and expiration (constant time checks)
    if (!tokenRecord ||
        tokenRecord.type !== 'password_reset' ||
        tokenRecord.expiresAt < new Date()) {
      throw AuthErrors.TOKEN_INVALID;
    }

    // Hash new password
    const passwordHash = await hashPassword(validatedData.password);

    // Update password, delete token, and revoke sessions atomically
    await prisma.$transaction(async (tx) => {
      // Update user password
      await tx.user.update({
        where: { id: tokenRecord.userId },
        data: { passwordHash },
      });

      // Delete the reset token
      await tx.verificationToken.delete({
        where: { id: tokenRecord.id },
      });

      // Revoke all sessions for this user (force re-login)
      await tx.session.updateMany({
        where: { userId: tokenRecord.userId },
        data: { isRevoked: true },
      });
    });

    return successResponse({
      message: 'Password reset successfully. Please login with your new password.',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
