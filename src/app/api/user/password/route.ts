import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, AuthRequest } from '@/lib/api/middleware';
import { handleApiError, ApiError } from '@/lib/api/errors';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { auditAuthEvent } from '@/lib/audit';
import { z } from 'zod';
import { passwordSchema } from '@/lib/validations/auth';
import { createLogger } from '@/lib/logger';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema, // Use same validation as registration
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// PUT /api/user/password - Change user's password
const changePasswordHandler = async (request: AuthRequest) => {
  try {
    const userId = request.userId;
    const body = await request.json();

    const validatedData = changePasswordSchema.parse(body);

    // Get user's current password hash
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user || !user.passwordHash) {
      throw new ApiError(404, 'NOT_FOUND', 'User not found');
    }

    // Verify current password
    const isValidPassword = await verifyPassword(
      validatedData.currentPassword,
      user.passwordHash
    );

    if (!isValidPassword) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await hashPassword(validatedData.newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    // Revoke all existing sessions except current one
    await prisma.session.updateMany({
      where: {
        userId,
        isRevoked: false,
      },
      data: { isRevoked: true },
    });

    // Audit log for password change (fire and forget)
    auditAuthEvent('user.password_change', userId!, request)
      .catch((error) => createLogger('AUDIT').error('Failed to log password change:', error));

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully. Please sign in again on other devices.',
    });
  } catch (error) {
    return handleApiError(error);
  }
};

export const PUT = withAuth(changePasswordHandler);
