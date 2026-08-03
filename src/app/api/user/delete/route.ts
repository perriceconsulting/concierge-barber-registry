import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, AuthRequest } from '@/lib/api/middleware';
import { handleApiError } from '@/lib/api/errors';
import { z } from 'zod';

const deleteAccountSchema = z.object({
  confirmation: z.literal('DELETE', {
    errorMap: () => ({ message: 'You must type DELETE to confirm' }),
  }),
});

// DELETE /api/user/delete - Permanently delete user's account
const deleteAccountHandler = async (request: AuthRequest) => {
  try {
    const userId = request.userId;
    const body = await request.json();

    // Throws if the caller didn't type DELETE; the parse *is* the guard.
    deleteAccountSchema.parse(body);

    // Delete user account (cascading deletes will handle related records)
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
};

export const DELETE = withAuth(deleteAccountHandler);
