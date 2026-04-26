import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api/middleware';
import { handleApiError } from '@/lib/api/errors';

const listHandler = async () => {
  try {
    const requests = await prisma.barberProfile.findMany({
      where: { removalRequestedAt: { not: null } },
      orderBy: { removalRequestedAt: 'desc' },
      select: {
        id: true,
        slug: true,
        displayName: true,
        city: true,
        state: true,
        outreachEmail: true,
        claimStatus: true,
        dataSource: true,
        removalRequestedAt: true,
      },
    });

    return NextResponse.json({ success: true, data: { requests } });
  } catch (error) {
    return handleApiError(error);
  }
};

export const GET = withAuth(listHandler, { requiredRole: 'admin' });
