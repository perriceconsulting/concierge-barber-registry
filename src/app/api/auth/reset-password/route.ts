import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { resetPasswordSchema } from '@/lib/validations/auth';
import { hashPassword, verifyToken } from '@/lib/auth/password';
import { handleApiError, successResponse, AuthErrors } from '@/lib/api/errors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = resetPasswordSchema.parse(body);

    // Find all non-expired password reset tokens
    const potentialTokens = await prisma.verificationToken.findMany({
      where: {
        type: 'password_reset',
        expiresAt: {
          gte: new Date(),
        },
      },
      include: { user: true },
    });

    // Verify the token against stored hashes
    let tokenRecord = null;
    for (const storedToken of potentialTokens) {
      const isValid = await verifyToken(validatedData.token, storedToken.token);
      if (isValid) {
        tokenRecord = storedToken;
        break;
      }
    }

    if (!tokenRecord) {
      throw AuthErrors.TOKEN_INVALID;
    }

    // Hash new password
    const passwordHash = await hashPassword(validatedData.password);

    // Update user password
    await prisma.user.update({
      where: { id: tokenRecord.userId },
      data: { passwordHash },
    });

    // Delete the reset token
    await prisma.verificationToken.delete({
      where: { id: tokenRecord.id },
    });

    // Revoke all sessions for this user (force re-login)
    await prisma.session.updateMany({
      where: { userId: tokenRecord.userId },
      data: { isRevoked: true },
    });

    return successResponse({
      message: 'Password reset successfully. Please login with your new password.',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
