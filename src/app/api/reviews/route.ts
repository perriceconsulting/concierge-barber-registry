import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api/middleware';
import { createReviewSchema } from '@/lib/validations/review';
import { ApiError, handleApiError } from '@/lib/api/errors';

// POST /api/reviews - Submit a review (authenticated client only)
const createReviewHandler = async (request: NextRequest, context: any) => {
  try {
    const userId = context.user.id;
    const userRole = context.user.role;

    // Only clients can submit reviews
    if (userRole !== 'client') {
      throw new ApiError('Only clients can submit reviews', 403);
    }

    const body = await request.json();
    const validatedData = createReviewSchema.parse(body);

    // Check if barber profile exists and is approved
    const barberProfile = await prisma.barberProfile.findUnique({
      where: { id: validatedData.barberProfileId },
    });

    if (!barberProfile) {
      throw new ApiError('Barber profile not found', 404);
    }

    if (barberProfile.verificationStatus !== 'approved') {
      throw new ApiError('Cannot review a barber that is not approved', 400);
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
      throw new ApiError('You have already reviewed this barber', 409);
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        barberProfileId: validatedData.barberProfileId,
        clientUserId: userId,
        rating: validatedData.rating,
        title: validatedData.title,
        comment: validatedData.comment,
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

    // Update barber's average rating and review count
    const reviews = await prisma.review.findMany({
      where: { barberProfileId: validatedData.barberProfileId },
    });

    const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await prisma.barberProfile.update({
      where: { id: validatedData.barberProfileId },
      data: {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: reviews.length,
      },
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
