import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api/middleware';
import { handleApiError } from '@/lib/api/errors';
import { uploadFile, validateFile } from '@/lib/upload';

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

// POST /api/barbers/portfolio - Upload and add portfolio image
const addPortfolioImageHandler = async (request: { userId?: string; formData: () => Promise<FormData> }) => {
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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const caption = formData.get('caption') as string || '';

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file (images only for portfolio)
    const validation = await validateFile(file, {
      maxSizeMB: 10,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    });

    if (!validation.valid) {
      return NextResponse.json(
        { success: false, message: validation.error },
        { status: 400 }
      );
    }

    // Upload to Vercel Blob storage
    const imageUrl = await uploadFile(file, 'portfolio');

    // Get current max sort order
    const maxSortOrder = await prisma.portfolioImage.aggregate({
      where: { barberProfileId: barberProfile.id },
      _max: { sortOrder: true },
    });

    const newImage = await prisma.portfolioImage.create({
      data: {
        barberProfileId: barberProfile.id,
        imageUrl,
        caption,
        sortOrder: (maxSortOrder._max.sortOrder || -1) + 1,
      },
    });

    return NextResponse.json({
      success: true,
      data: { image: newImage },
      message: 'Image uploaded successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
};

export const GET = withAuth(getPortfolioHandler, { requiredRole: 'barber' });
export const POST = withAuth(addPortfolioImageHandler, { requiredRole: 'barber' });
