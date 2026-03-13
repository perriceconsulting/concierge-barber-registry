import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api/middleware';
import { handleApiError } from '@/lib/api/errors';

// DELETE /api/barbers/portfolio/[id] - Delete portfolio image
const deletePortfolioImageHandler = async (
  request: any,
  context: { params: Promise<{ id: string }> }
) => {
  try {
    const userId = request.userId;
    const params = await context.params;
    const imageId = params.id;

    const barberProfile = await prisma.barberProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!barberProfile) {
      return NextResponse.json(
        { success: false, message: 'Barber profile not found' },
        { status: 404 }
      );
    }

    // Verify image belongs to this barber
    const image = await prisma.portfolioImage.findFirst({
      where: {
        id: imageId,
        barberProfileId: barberProfile.id,
      },
    });

    if (!image) {
      return NextResponse.json(
        { success: false, message: 'Image not found' },
        { status: 404 }
      );
    }

    await prisma.portfolioImage.delete({
      where: { id: imageId },
    });

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
};

// PATCH /api/barbers/portfolio/[id] - Update portfolio image caption
const updatePortfolioImageHandler = async (
  request: any,
  context: { params: Promise<{ id: string }> }
) => {
  try {
    const userId = request.userId;
    const params = await context.params;
    const imageId = params.id;

    const barberProfile = await prisma.barberProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!barberProfile) {
      return NextResponse.json(
        { success: false, message: 'Barber profile not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { caption } = body;

    const updatedImage = await prisma.portfolioImage.updateMany({
      where: {
        id: imageId,
        barberProfileId: barberProfile.id,
      },
      data: { caption },
    });

    if (updatedImage.count === 0) {
      return NextResponse.json(
        { success: false, message: 'Image not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Caption updated successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
};

export const DELETE = withAuth(deletePortfolioImageHandler, { requiredRole: 'barber' });
export const PATCH = withAuth(updatePortfolioImageHandler, { requiredRole: 'barber' });
