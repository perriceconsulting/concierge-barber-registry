import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handleApiError } from '@/lib/api/errors';
import { rateLimiters } from '@/lib/api/rate-limit';

// GET /api/specialties - Get all specialties
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting to prevent abuse
    await rateLimiters.api(request);

    const specialties = await prisma.specialty.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: { specialties },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
