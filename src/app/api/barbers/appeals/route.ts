import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api/middleware';
import { ApiError, handleApiError } from '@/lib/api/errors';
import { isAppealable } from '@/lib/suspension';
import { z } from 'zod';
import { createLogger } from '@/lib/logger';

const logger = createLogger('APPEALS');

const appealSchema = z.object({
  appealText: z.string().min(20, 'Appeal must be at least 20 characters').max(2000),
});

// POST /api/barbers/appeals - Submit a suspension appeal
const submitAppealHandler = async (request: { userId?: string; json: () => Promise<unknown> }) => {
  try {
    const userId = request.userId;

    const barberProfile = await prisma.barberProfile.findUnique({
      where: { userId },
      include: {
        appeals: {
          where: { status: 'pending' },
          take: 1,
        },
      },
    });

    if (!barberProfile) {
      throw new ApiError(404, 'NOT_FOUND', 'Barber profile not found');
    }

    if (barberProfile.verificationStatus !== 'suspended') {
      throw new ApiError(400, 'NOT_SUSPENDED', 'Your account is not currently suspended');
    }

    if (!barberProfile.suspensionReason) {
      throw new ApiError(400, 'NO_REASON', 'Suspension reason not found');
    }

    if (!isAppealable(barberProfile.suspensionReason)) {
      throw new ApiError(403, 'NOT_APPEALABLE', 'This type of suspension is not eligible for appeal');
    }

    if (barberProfile.appeals.length > 0) {
      throw new ApiError(409, 'APPEAL_EXISTS', 'You already have a pending appeal. Please wait for it to be reviewed.');
    }

    const body = await request.json();
    const { appealText } = appealSchema.parse(body);

    const appeal = await prisma.suspensionAppeal.create({
      data: {
        barberProfileId: barberProfile.id,
        reason: barberProfile.suspensionReason,
        appealText,
      },
    });

    return NextResponse.json({
      success: true,
      data: { appeal },
      message: 'Appeal submitted successfully. You will be notified when it is reviewed.',
    });
  } catch (error) {
    logger.error('Appeal submission failed:', {
      errorType: error instanceof Error ? error.name : 'Unknown',
    });
    return handleApiError(error);
  }
};

// GET /api/barbers/appeals - Get current barber's appeals
const getAppealsHandler = async (request: { userId?: string }) => {
  try {
    const userId = request.userId;

    const barberProfile = await prisma.barberProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        verificationStatus: true,
        suspensionReason: true,
        suspendedAt: true,
        appeals: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            reason: true,
            appealText: true,
            status: true,
            adminNotes: true,
            createdAt: true,
            reviewedAt: true,
          },
        },
      },
    });

    if (!barberProfile) {
      throw new ApiError(404, 'NOT_FOUND', 'Barber profile not found');
    }

    return NextResponse.json({
      success: true,
      data: {
        verificationStatus: barberProfile.verificationStatus,
        suspensionReason: barberProfile.suspensionReason,
        suspendedAt: barberProfile.suspendedAt,
        appeals: barberProfile.appeals,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
};

export const POST = withAuth(submitAppealHandler, { requiredRole: 'barber' });
export const GET = withAuth(getAppealsHandler, { requiredRole: 'barber' });
