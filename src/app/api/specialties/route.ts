import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handleApiError } from '@/lib/api/errors';

// GET /api/specialties - Get all specialties
export async function GET() {
  try {
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
