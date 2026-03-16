import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, AuthRequest } from '@/lib/api/middleware';
import { handleApiError } from '@/lib/api/errors';
import type { AppealStatus } from '@prisma/client';

const validStatuses: AppealStatus[] = ['pending', 'approved', 'denied'];

// GET /api/admin/appeals - List all appeals with filters
const listAppealsHandler = async (request: AuthRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status') || 'all';

    const where = statusParam !== 'all' && validStatuses.includes(statusParam as AppealStatus)
      ? { status: statusParam as AppealStatus }
      : {};

    const appeals = await prisma.suspensionAppeal.findMany({
      where,
      include: {
        barberProfile: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        reviewedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // pending first
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({
      success: true,
      data: { appeals },
    });
  } catch (error) {
    return handleApiError(error);
  }
};

export const GET = withAuth(listAppealsHandler, { requiredRole: 'admin' });
