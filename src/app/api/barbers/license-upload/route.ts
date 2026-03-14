import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api/middleware';
import { handleApiError } from '@/lib/api/errors';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { randomBytes } from 'crypto';

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

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid file type. Only JPG, PNG, and PDF files are allowed.',
        },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: 'File size exceeds 5MB limit',
        },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = randomBytes(8).toString('hex');
    const ext = file.name.split('.').pop();
    const fileName = `license-${barberProfile.id}-${timestamp}-${randomString}.${ext}`;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to local storage (public/uploads/licenses)
    // In production, this should upload to cloud storage (S3, Cloudinary, etc.)
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'licenses');
    const filePath = join(uploadDir, fileName);

    // Create directory if it doesn't exist
    const fs = require('fs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    await writeFile(filePath, buffer);

    // Generate public URL
    const documentUrl = `/uploads/licenses/${fileName}`;

    // Update barber profile with document URL
    const updatedProfile = await prisma.barberProfile.update({
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
