import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, AuthRequest } from '@/lib/api/middleware';
import { ApiError, handleApiError } from '@/lib/api/errors';
import { uploadFile, validateFile } from '@/lib/upload';
import type { Prisma } from '@prisma/client';

// GET /api/admin/social/photos — list all uploaded social photos
const getHandler = async () => {
  try {
    const photos = await prisma.socialPhoto.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: { photos },
    });
  } catch (error) {
    return handleApiError(error);
  }
};

// POST /api/admin/social/photos — upload a new photo
const postHandler = async (request: AuthRequest) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const label = (formData.get('label') as string) || 'Untitled';
    const keywordsRaw = formData.get('keywords') as string;

    if (!file) {
      throw new ApiError(400, 'MISSING_FILE', 'No file provided');
    }

    const validation = await validateFile(file, {
      maxSizeMB: 10,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    });

    if (!validation.valid) {
      throw new ApiError(400, 'INVALID_FILE', validation.error || 'Invalid file');
    }

    const imageUrl = await uploadFile(file, 'social');

    let keywords: string[] = [];
    try {
      keywords = keywordsRaw ? JSON.parse(keywordsRaw) : [];
    } catch {
      keywords = [];
    }

    const photo = await prisma.socialPhoto.create({
      data: {
        imageUrl,
        label: label.slice(0, 200),
        keywords: keywords as unknown as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({
      success: true,
      data: { photo },
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
};

export const GET = withAuth(getHandler, { requiredRole: 'admin' });
export const POST = withAuth(postHandler, { requiredRole: 'admin' });
