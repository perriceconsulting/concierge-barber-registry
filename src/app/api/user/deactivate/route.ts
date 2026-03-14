import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api/middleware';
import { handleApiError } from '@/lib/api/errors';

// POST /api/user/deactivate - Deactivate user's account
const deactivateAccountHandler = async (request: any) => {
  try {
    const userId = request.userId;

    // Deactivate user account
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    // Revoke all sessions
    await prisma.session.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });

    return NextResponse.json({
      success: true,
      message: 'Account deactivated successfully. Contact support to reactivate.',
    });
  } catch (error) {
    return handleApiError(error);
  }
};

export const POST = withAuth(deactivateAccountHandler);
