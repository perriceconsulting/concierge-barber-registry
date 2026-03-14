import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api/middleware';
import { handleApiError } from '@/lib/api/errors';
import { uploadFile, validateFile } from '@/lib/upload';

// POST /api/barbers/license-upload - Upload license document
const uploadLicenseHandler = async (request: { userId?: string; formData: () => Promise<FormData> }) => {
  try {
    const userId = request.userId;

    // Check if user has a barber profile
    const barberProfile = await prisma.barberProfile.findUnique({
      where: { userId },
    });

    if (!barberProfile) {
      return NextResponse.json(
        {
          success: false,
          message: 'Barber profile not found. Please create your profile first.',
        },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message: 'No file provided',
        },
        { status: 400 }
      );
    }

    // Validate file with magic number checking
    const validation = await validateFile(file, {
      maxSizeMB: 10,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    });

    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error,
        },
        { status: 400 }
      );
    }

    // Upload to Vercel Blob storage
    const documentUrl = await uploadFile(file, 'licenses');

    // Update barber profile with document URL
    await prisma.barberProfile.update({
      where: { id: barberProfile.id },
      data: {
        licenseDocumentUrl: documentUrl,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        documentUrl,
        message: 'License document uploaded successfully',
      },
    });
  } catch (error) {
    console.error('License upload error:', error);
    return handleApiError(error);
  }
};

export const POST = withAuth(uploadLicenseHandler, { requiredRole: 'barber' });
