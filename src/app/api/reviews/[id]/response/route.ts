import { NextResponse } from 'next/server';
import { withAuth, AuthRequest } from '@/lib/api/middleware';
import { handleApiError, ApiError } from '@/lib/api/errors';
import { prisma } from '@/lib/db';
import { checkFeatureAccess } from '@/lib/subscription';
import { z } from 'zod';

const responseSchema = z.object({
  comment: z.string().min(1, 'Response is required').max(2000, 'Response is too long'),
});

// POST /api/reviews/:id/response — Respond to a review (Pro/Elite only)
async function createResponseHandler(
  request: AuthRequest,
  context?: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.userId!;
    const { id: reviewId } = await context!.params;

    // Find the barber's profile
    const barberProfile = await prisma.barberProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!barberProfile) {
      throw new ApiError(404, 'NOT_FOUND', 'Barber profile not found');
    }

    // Check that the review belongs to this barber
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { barberProfileId: true },
    });

    if (!review || review.barberProfileId !== barberProfile.id) {
      throw new ApiError(404, 'NOT_FOUND', 'Review not found');
    }

    // Check tier access for review responses
    const access = await checkFeatureAccess(barberProfile.id, 'reviewResponses');
    if (!access.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TIER_LIMIT_REACHED',
            message: 'Review responses are available on the Professional plan and above.',
          },
          upgrade: true,
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { comment } = responseSchema.parse(body);

    // Upsert — allow editing existing response
    const reviewResponse = await prisma.reviewResponse.upsert({
      where: { reviewId },
      create: { reviewId, comment },
      update: { comment },
    });

    return NextResponse.json({
      success: true,
      data: { response: reviewResponse },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/reviews/:id/response — Delete a review response
async function deleteResponseHandler(
  request: AuthRequest,
  context?: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.userId!;
    const { id: reviewId } = await context!.params;

    const barberProfile = await prisma.barberProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!barberProfile) {
      throw new ApiError(404, 'NOT_FOUND', 'Barber profile not found');
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { barberProfileId: true },
    });

    if (!review || review.barberProfileId !== barberProfile.id) {
      throw new ApiError(404, 'NOT_FOUND', 'Review not found');
    }

    await prisma.reviewResponse.deleteMany({
      where: { reviewId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export const POST = withAuth(createResponseHandler, { requiredRole: 'barber' });
export const DELETE = withAuth(deleteResponseHandler, { requiredRole: 'barber' });
