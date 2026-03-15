import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api/middleware';
import { handleApiError, ApiError, ResourceErrors } from '@/lib/api/errors';

const VALID_ROLES = ['client', 'barber', 'admin'] as const;

// PATCH /api/admin/users/[id] - Update user (admin only)
const updateUserHandler = async (request: NextRequest, context?: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context!.params;
    const body = await request.json();

    // Verify user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw ResourceErrors.USER_NOT_FOUND;
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (typeof body.isActive === 'boolean') {
      updateData.isActive = body.isActive;
    }

    if (body.role !== undefined) {
      if (!VALID_ROLES.includes(body.role)) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid role. Must be one of: client, barber, admin');
      }
      updateData.role = body.role;
    }

    if (Object.keys(updateData).length === 0) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'No valid fields provided for update');
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: { user: updatedUser },
    });
  } catch (error) {
    return handleApiError(error);
  }
};

export const PATCH = withAuth(updateUserHandler, { requiredRole: 'admin' });
