import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api/middleware';
import { handleApiError, successResponse, ApiError } from '@/lib/api/errors';

const updateReviewHandler = async (request: NextRequest, context?: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context!.params;
    const body = await request.json();
    const { isVisible } = body;

    if (typeof isVisible !== 'boolean') {
      throw new ApiError(400, 'VALIDATION_ERROR', 'isVisible must be a boolean');
    }

    const existing = await prisma.review.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError(404, 'NOT_FOUND', 'Review not found');
    }

    const updated = await prisma.review.update({
      where: { id },
      data: { isVisible },
    });

    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
};

const deleteReviewHandler = async (_request: NextRequest, context?: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context!.params;

    const existing = await prisma.review.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError(404, 'NOT_FOUND', 'Review not found');
    }

    await prisma.review.delete({ where: { id } });

    return successResponse({ message: 'Review deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
};

export const PATCH = withAuth(updateReviewHandler, { requiredRole: 'admin' });
export const DELETE = withAuth(deleteReviewHandler, { requiredRole: 'admin' });
