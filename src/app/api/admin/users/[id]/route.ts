import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, AuthRequest } from '@/lib/api/middleware';
import { handleApiError, ApiError, ResourceErrors } from '@/lib/api/errors';
import { createAuditLog } from '@/lib/audit';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ADMIN_USER_UPDATE');

// CBR v2.0 — `hnwi` added (W7) for invitation-only Black Label access.
const VALID_ROLES = ['client', 'barber', 'admin', 'hnwi'] as const;

// PATCH /api/admin/users/[id] - Update user (admin only)
const updateUserHandler = async (request: AuthRequest, context?: { params: Promise<{ id: string }> }) => {
  try {
    const adminUserId = request.userId!;
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
        throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid role. Must be one of: client, barber, admin, hnwi');
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

    // CBR v2.0 — audit HNWI grant/revoke for compliance
    if (body.role !== undefined && existingUser.role !== body.role) {
      const grantedHnwi = body.role === 'hnwi';
      const revokedHnwi = existingUser.role === 'hnwi' && body.role !== 'hnwi';
      if (grantedHnwi || revokedHnwi) {
        await createAuditLog({
          actorUserId: adminUserId,
          action: grantedHnwi ? 'user.hnwi_grant' : 'user.hnwi_revoke',
          entityType: 'user',
          entityId: id,
          details: {
            previousRole: existingUser.role,
            newRole: body.role,
            email: existingUser.email,
          },
        });
        logger.info(`HNWI ${grantedHnwi ? 'granted' : 'revoked'}`, {
          userId: id,
          previousRole: existingUser.role,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: { user: updatedUser },
    });
  } catch (error) {
    return handleApiError(error);
  }
};

export const PATCH = withAuth(updateUserHandler, { requiredRole: 'admin' });
