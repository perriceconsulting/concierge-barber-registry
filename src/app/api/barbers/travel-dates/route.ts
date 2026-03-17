import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, AuthRequest } from '@/lib/api/middleware';
import { ApiError, handleApiError } from '@/lib/api/errors';
import { travelDateSchema } from '@/lib/validations/barber';

async function getBarberProfileId(userId: string) {
  const profile = await prisma.barberProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) throw new ApiError(404, 'NOT_FOUND', 'Barber profile not found');
  return profile.id;
}

// GET /api/barbers/travel-dates
const getHandler = async (request: AuthRequest) => {
  try {
    const barberProfileId = await getBarberProfileId(request.userId!);
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    const where: { barberProfileId: string; endDate?: { gte: Date }; isActive?: boolean } = {
      barberProfileId,
    };

    if (activeOnly) {
      where.endDate = { gte: new Date() };
      where.isActive = true;
    }

    const travelDates = await prisma.travelDate.findMany({
      where,
      orderBy: { startDate: 'asc' },
    });

    return NextResponse.json({ success: true, data: { travelDates } });
  } catch (error) {
    return handleApiError(error);
  }
};

// POST /api/barbers/travel-dates — add one
const addHandler = async (request: AuthRequest) => {
  try {
    const barberProfileId = await getBarberProfileId(request.userId!);

    const activeCount = await prisma.travelDate.count({
      where: {
        barberProfileId,
        endDate: { gte: new Date() },
        isActive: true,
      },
    });
    if (activeCount >= 10) {
      throw new ApiError(400, 'LIMIT_REACHED', 'Maximum of 10 upcoming travel dates allowed');
    }

    const body = await request.json();
    const data = travelDateSchema.parse(body);

    const travelDate = await prisma.travelDate.create({
      data: {
        barberProfileId,
        city: data.city,
        state: data.state,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        notes: data.notes,
      },
    });

    return NextResponse.json({ success: true, data: { travelDate } }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
};

export const GET = withAuth(getHandler, { requiredRole: 'barber' });
export const POST = withAuth(addHandler, { requiredRole: 'barber' });
