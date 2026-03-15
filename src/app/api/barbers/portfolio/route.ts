import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, AuthRequest } from '@/lib/api/middleware';
import { handleApiError, ApiError } from '@/lib/api/errors';
import { uploadFile, validateFile } from '@/lib/upload';
import { rateLimiters } from '@/lib/api/rate-limit';
import { createLogger } from '@/lib/logger';

const logger = createLogger('PORTFOLIO');

const MAX_PORTFOLIO_IMAGES = 20; // Per barber limit
const MAX_TOTAL_PORTFOLIO_IMAGES = 50000; // Platform-wide DoS protection

// GET /api/barbers/portfolio - Get authenticated barber's portfolio images
const getPortfolioHandler = async (request: AuthRequest) => {
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
    // Add rate limiting
    await rateLimiters.upload(request as AuthRequest);

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

    // Check per-barber image count and platform-wide total
    const [currentCount, totalCount] = await Promise.all([
      prisma.portfolioImage.count({
        where: { barberProfileId: barberProfile.id },
      }),
      prisma.portfolioImage.count(), // Platform-wide count for DoS protection
    ]);

    if (currentCount >= MAX_PORTFOLIO_IMAGES) {
      return NextResponse.json(
        {
          success: false,
          message: `Maximum of ${MAX_PORTFOLIO_IMAGES} portfolio images allowed. Please delete some images first.`,
        },
        { status: 400 }
      );
    }

    // Platform-wide DoS protection - prevent storage exhaustion
    if (totalCount >= MAX_TOTAL_PORTFOLIO_IMAGES) {
      logger.error(`Platform-wide image limit reached: ${totalCount}/${MAX_TOTAL_PORTFOLIO_IMAGES}`);
      throw new ApiError(
        503,
        'SERVICE_UNAVAILABLE',
        'Platform storage limit reached. Please contact support.'
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
