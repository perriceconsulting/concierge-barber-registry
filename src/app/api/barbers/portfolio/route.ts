import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api/middleware';
import { handleApiError } from '@/lib/api/errors';

// GET /api/barbers/portfolio - Get authenticated barber's portfolio images
const getPortfolioHandler = async (request: any) => {
  try {
    const userId = request.userId;

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

    const images = await prisma.portfolioImage.findMany({
      where: { barberProfileId: barberProfile.id },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: { images },
    });
  } catch (error) {
    return handleApiError(error);
  }
};

// POST /api/barbers/portfolio - Add portfolio image
const addPortfolioImageHandler = async (request: any) => {
  try {
    const userId = request.userId;

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
    const { imageUrl, caption } = body;

    // Get current max sort order
    const maxSortOrder = await prisma.portfolioImage.aggregate({
      where: { barberProfileId: barberProfile.id },
      _max: { sortOrder: true },
    });

    const newImage = await prisma.portfolioImage.create({
      data: {
        barberProfileId: barberProfile.id,
        imageUrl,
        caption: caption || '',
        sortOrder: (maxSortOrder._max.sortOrder || -1) + 1,
      },
    });

    return NextResponse.json({
      success: true,
      data: { image: newImage },
      message: 'Image added successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
};

export const GET = withAuth(getPortfolioHandler, { requiredRole: 'barber' });
export const POST = withAuth(addPortfolioImageHandler, { requiredRole: 'barber' });
