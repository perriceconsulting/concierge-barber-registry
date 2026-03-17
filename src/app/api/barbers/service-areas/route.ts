import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, AuthRequest } from '@/lib/api/middleware';
import { ApiError, handleApiError } from '@/lib/api/errors';
import { serviceAreaSchema } from '@/lib/validations/barber';
import { z } from 'zod';

async function getBarberProfileId(userId: string) {
  const profile = await prisma.barberProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) throw new ApiError(404, 'NOT_FOUND', 'Barber profile not found');
  return profile.id;
}

// GET /api/barbers/service-areas
const getHandler = async (request: AuthRequest) => {
  try {
    const barberProfileId = await getBarberProfileId(request.userId!);

    const serviceAreas = await prisma.serviceArea.findMany({
      where: { barberProfileId },
      orderBy: [{ state: 'asc' }, { city: 'asc' }],
    });

    return NextResponse.json({ success: true, data: { serviceAreas } });
  } catch (error) {
    return handleApiError(error);
  }
};

// POST /api/barbers/service-areas — add one
const addHandler = async (request: AuthRequest) => {
  try {
    const barberProfileId = await getBarberProfileId(request.userId!);

    const count = await prisma.serviceArea.count({ where: { barberProfileId } });
    if (count >= 20) {
      throw new ApiError(400, 'LIMIT_REACHED', 'Maximum of 20 service areas allowed');
    }

    const body = await request.json();
    const data = serviceAreaSchema.parse(body);

    const serviceArea = await prisma.serviceArea.create({
      data: { barberProfileId, ...data },
    });

    return NextResponse.json({ success: true, data: { serviceArea } }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return handleApiError(new ApiError(409, 'DUPLICATE', 'You already have this city/state as a service area'));
    }
    return handleApiError(error);
  }
};

// PUT /api/barbers/service-areas — bulk replace
const bulkHandler = async (request: AuthRequest) => {
  try {
    const barberProfileId = await getBarberProfileId(request.userId!);

    const body = await request.json();
    const { serviceAreas } = z.object({
      serviceAreas: z.array(serviceAreaSchema).max(20),
    }).parse(body);

    const result = await prisma.$transaction(async (tx) => {
      await tx.serviceArea.deleteMany({ where: { barberProfileId } });
      if (serviceAreas.length > 0) {
        await tx.serviceArea.createMany({
          data: serviceAreas.map((sa) => ({ barberProfileId, ...sa })),
        });
      }
      return tx.serviceArea.findMany({
        where: { barberProfileId },
        orderBy: [{ state: 'asc' }, { city: 'asc' }],
      });
    });

    return NextResponse.json({ success: true, data: { serviceAreas: result } });
  } catch (error) {
    return handleApiError(error);
  }
};

export const GET = withAuth(getHandler, { requiredRole: 'barber' });
export const POST = withAuth(addHandler, { requiredRole: 'barber' });
export const PUT = withAuth(bulkHandler, { requiredRole: 'barber' });
