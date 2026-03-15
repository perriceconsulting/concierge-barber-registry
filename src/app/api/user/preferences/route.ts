import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, AuthRequest } from '@/lib/api/middleware';
import { handleApiError } from '@/lib/api/errors';
import { z } from 'zod';

const updatePreferencesSchema = z.object({
  notifyEmailEnabled: z.boolean().optional(),
  notifyContactRequests: z.boolean().optional(),
  notifyNewReviews: z.boolean().optional(),
  notifyMarketingEmails: z.boolean().optional(),
});

// GET /api/user/preferences - Get user's notification preferences
const getPreferencesHandler = async (request: AuthRequest) => {
  try {
    const userId = request.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        notifyEmailEnabled: true,
        notifyContactRequests: true,
        notifyNewReviews: true,
        notifyMarketingEmails: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: { preferences: user },
    });
  } catch (error) {
    return handleApiError(error);
  }
};

// PUT /api/user/preferences - Update user's notification preferences
const updatePreferencesHandler = async (request: AuthRequest) => {
  try {
    const userId = request.userId;
    const body = await request.json();

    const validatedData = updatePreferencesSchema.parse(body);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: validatedData,
      select: {
        notifyEmailEnabled: true,
        notifyContactRequests: true,
        notifyNewReviews: true,
        notifyMarketingEmails: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: { preferences: updatedUser },
      message: 'Notification preferences updated successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
};

export const GET = withAuth(getPreferencesHandler);
export const PUT = withAuth(updatePreferencesHandler);
