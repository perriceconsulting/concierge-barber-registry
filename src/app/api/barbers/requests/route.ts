import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, AuthRequest } from '@/lib/api/middleware';
import { ApiError, handleApiError } from '@/lib/api/errors';
import type { ContactRequestStatus, Prisma } from '@prisma/client';

const validStatuses: ContactRequestStatus[] = ['new', 'read', 'responded', 'archived'];

// GET /api/barbers/requests - Get contact requests for the logged-in barber
const getRequestsHandler = async (request: AuthRequest) => {
  try {
    const userId = request.userId!;

    const barberProfile = await prisma.barberProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!barberProfile) {
      throw new ApiError(404, 'NOT_FOUND', 'Barber profile not found');
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');

    const where: Prisma.ContactRequestWhereInput = {
      barberProfileId: barberProfile.id,
    };

    if (statusParam && statusParam !== 'all' && validStatuses.includes(statusParam as ContactRequestStatus)) {
      where.status = statusParam as ContactRequestStatus;
    }

    const requests = await prisma.contactRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const counts = await prisma.contactRequest.groupBy({
      by: ['status'],
      where: { barberProfileId: barberProfile.id },
      _count: true,
    });

    const stats = {
      total: 0,
      new: 0,
      read: 0,
      responded: 0,
      archived: 0,
    };

    for (const c of counts) {
      stats[c.status as keyof typeof stats] = c._count;
      stats.total += c._count;
    }

    return NextResponse.json({
      success: true,
      data: { requests, stats },
    });
  } catch (error) {
    return handleApiError(error);
  }
};

export const GET = withAuth(getRequestsHandler, { requiredRole: 'barber' });
