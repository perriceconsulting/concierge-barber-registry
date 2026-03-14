import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api/middleware';
import { handleApiError, ApiError } from '@/lib/api/errors';
import { z } from 'zod';

const deleteAccountSchema = z.object({
  confirmation: z.literal('DELETE', {
    errorMap: () => ({ message: 'You must type DELETE to confirm' }),
  }),
});

// DELETE /api/user/delete - Permanently delete user's account
const deleteAccountHandler = async (request: any) => {
  try {
    const userId = request.userId;
    const body = await request.json();

    const validatedData = deleteAccountSchema.parse(body);

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
