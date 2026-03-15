import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api/middleware';
import { createReviewSchema } from '@/lib/validations/review';
import { ApiError, handleApiError } from '@/lib/api/errors';
import { sanitizeText } from '@/lib/sanitize';
import { rateLimiters } from '@/lib/api/rate-limit';

// POST /api/reviews - Submit a review (authenticated client only)
const createReviewHandler = async (request: any) => {
  try {
    // Apply rate limiting (5 reviews per day)
    await rateLimiters.reviews(request);

    const userId = request.userId;
    const userRole = request.userRole;

    // Only clients can submit reviews
    if (userRole !== 'client') {
      throw new ApiError(403, 'FORBIDDEN', 'Only clients can submit reviews');
    }

    const body = await request.json();
    const validatedData = createReviewSchema.parse(body);

    // Sanitize review content
    const sanitizedData = {
      ...validatedData,
      title: validatedData.title ? sanitizeText(validatedData.title) : undefined,
      comment: validatedData.comment ? sanitizeText(validatedData.comment) : undefined,
    };

    // Check if barber profile exists and is approved
    const barberProfile = await prisma.barberProfile.findUnique({
      where: { id: validatedData.barberProfileId },
    });

    if (!barberProfile) {
      throw new ApiError(404, 'NOT_FOUND', 'Barber profile not found');
    }

    if (barberProfile.verificationStatus !== 'approved') {
      throw new ApiError(400, 'BAD_REQUEST', 'Cannot review a barber that is not approved');
    }

    // Check if user has already reviewed this barber
    const existingReview = await prisma.review.findUnique({
      where: {
        barberProfileId_clientUserId: {
          barberProfileId: validatedData.barberProfileId,
          clientUserId: userId,
        },
      },
    });

    if (existingReview) {
      throw new ApiError(409, 'CONFLICT', 'You have already reviewed this barber');
    }

    // Create the review and update rating in a transaction to prevent race conditions
    const review = await prisma.$transaction(async (tx) => {
      // Create the review
      const newReview = await tx.review.create({
        data: {
          barberProfileId: sanitizedData.barberProfileId,
          clientUserId: userId,
          rating: sanitizedData.rating,
          title: sanitizedData.title,
          comment: sanitizedData.comment,
          isVisible: true,
        },
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
      });

      // Use aggregate to calculate average rating atomically
      const aggregateResult = await tx.review.aggregate({
        where: { barberProfileId: validatedData.barberProfileId },
        _avg: {
          rating: true,
        },
        _count: {
          id: true,
        },
      });

      // Update barber's average rating and review count
      await tx.barberProfile.update({
        where: { id: validatedData.barberProfileId },
        data: {
          averageRating: aggregateResult._avg.rating
            ? Math.round(aggregateResult._avg.rating * 10) / 10
            : 0,
          totalReviews: aggregateResult._count.id,
        },
      });

      return newReview;
    });

    return NextResponse.json({
      success: true,
      data: { review },
      message: 'Review submitted successfully',
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
};

export const POST = withAuth(createReviewHandler, { requiredRole: 'client' });
