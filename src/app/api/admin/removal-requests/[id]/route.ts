import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api/middleware';
import { handleApiError } from '@/lib/api/errors';
import { createLogger } from '@/lib/logger';

const logger = createLogger('REMOVAL_REVIEW');

const ReviewSchema = z.object({
  action: z.enum(['approve', 'dismiss']),
});

const reviewHandler = async (
  request: NextRequest,
  context?: { params: Promise<Record<string, string | string[]>> }
) => {
  try {
    if (!context?.params) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Missing id' } },
        { status: 400 }
      );
    }
    const params = await context.params;
    const id = typeof params.id === 'string' ? params.id : String(params.id);

    const body = await request.json();
    const { action } = ReviewSchema.parse(body);

    const profile = await prisma.barberProfile.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        userId: true,
        claimStatus: true,
        removalRequestedAt: true,
        user: { select: { id: true, isStub: true, email: true } },
      },
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Profile not found' } },
        { status: 404 }
      );
    }

    if (!profile.removalRequestedAt) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'BAD_REQUEST', message: 'No pending removal request' },
        },
        { status: 400 }
      );
    }

    if (action === 'dismiss') {
      await prisma.barberProfile.update({
        where: { id: profile.id },
        data: { removalRequestedAt: null },
      });
      logger.info('Removal request dismissed', { slug: profile.slug });
      return NextResponse.json({ success: true, data: { action: 'dismissed' } });
    }

    // Approve removal: delete the profile. If the user was a stub and only owned
    // this profile, delete the user too. Never delete a real (non-stub) user.
    await prisma.$transaction(async (tx) => {
      await tx.barberProfile.delete({ where: { id: profile.id } });

      if (profile.user?.isStub) {
        await tx.user.delete({ where: { id: profile.userId } });
      }
    });

    logger.info('Removal request approved and profile deleted', {
      slug: profile.slug,
      stubUserDeleted: profile.user?.isStub === true,
    });

    return NextResponse.json({
      success: true,
      data: { action: 'removed', stubUserDeleted: profile.user?.isStub === true },
    });
  } catch (error) {
    return handleApiError(error);
  }
};

export const POST = withAuth(reviewHandler, { requiredRole: 'admin' });
