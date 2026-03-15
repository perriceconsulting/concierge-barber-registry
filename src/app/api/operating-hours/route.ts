import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api/middleware';
import { ApiError, handleApiError } from '@/lib/api/errors';

// Validation schema for operating hours
const operatingHoursSchema = z.object({
  hours: z.array(
    z.object({
      dayOfWeek: z.number().min(0).max(6),
      openTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional().nullable(),
      closeTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional().nullable(),
      isClosed: z.boolean(),
    })
  ).length(7),
});

// GET /api/operating-hours - Get barber's operating hours
async function getOperatingHoursHandler(req: any) {
  const userId = req.userId!;

  // Get the barber profile
  const barber = await prisma.barberProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!barber) {
    throw new ApiError(404, 'NOT_FOUND', 'Barber profile not found');
  }

    // Get operating hours
    const hours = await prisma.operatingHours.findMany({
      where: { barberProfileId: barber.id },
      orderBy: { dayOfWeek: 'asc' },
    });

    // If no hours exist, return default closed hours
    if (hours.length === 0) {
      const defaultHours = Array.from({ length: 7 }, (_, i) => ({
        dayOfWeek: i,
        dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][i],
        openTime: null,
        closeTime: null,
        isClosed: true,
      }));
      return NextResponse.json({ hours: defaultHours });
    }

    // Add day names to response
    const hoursWithNames = hours.map(h => ({
      dayOfWeek: h.dayOfWeek,
      dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][h.dayOfWeek],
      openTime: h.openTime,
      closeTime: h.closeTime,
      isClosed: h.isClosed,
    }));

    return NextResponse.json({ hours: hoursWithNames });
}

// PUT /api/operating-hours - Update barber's operating hours
async function updateOperatingHoursHandler(req: any) {
  const userId = req.userId!;
  const body = await req.json();

  // Validate input
  const validationResult = operatingHoursSchema.safeParse(body);
  if (!validationResult.success) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid input', validationResult.error.issues);
  }

  const { hours } = validationResult.data;

  // Validate that open days have both open and close times
  for (const day of hours) {
    if (!day.isClosed) {
      if (!day.openTime || !day.closeTime) {
        throw new ApiError(400, 'VALIDATION_ERROR', `Day ${day.dayOfWeek} must have both open and close times`);
      }
      if (day.openTime >= day.closeTime) {
        throw new ApiError(400, 'VALIDATION_ERROR', `Day ${day.dayOfWeek}: Close time must be after open time`);
      }
    }
  }

  // Get the barber profile
  const barber = await prisma.barberProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!barber) {
    throw new ApiError(404, 'NOT_FOUND', 'Barber profile not found');
  }

    // Delete existing hours and create new ones in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.operatingHours.deleteMany({
        where: { barberProfileId: barber.id },
      });

      await tx.operatingHours.createMany({
        data: hours.map(h => ({
          barberProfileId: barber.id,
          dayOfWeek: h.dayOfWeek,
          openTime: h.isClosed ? null : h.openTime!,
          closeTime: h.isClosed ? null : h.closeTime!,
          isClosed: h.isClosed,
        })),
      });
    });

    // Fetch updated hours
    const updatedHours = await prisma.operatingHours.findMany({
      where: { barberProfileId: barber.id },
      orderBy: { dayOfWeek: 'asc' },
    });

    const hoursWithNames = updatedHours.map(h => ({
      dayOfWeek: h.dayOfWeek,
      dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][h.dayOfWeek],
      openTime: h.openTime,
      closeTime: h.closeTime,
      isClosed: h.isClosed,
    }));

    return NextResponse.json({
      message: 'Operating hours updated successfully',
      hours: hoursWithNames,
    });
}

export const GET = withAuth(async (req: any) => {
  try {
    return await getOperatingHoursHandler(req);
  } catch (error) {
    return handleApiError(error);
  }
}, { requiredRole: 'barber' });

export const PUT = withAuth(async (req: any) => {
  try {
    return await updateOperatingHoursHandler(req);
  } catch (error) {
    return handleApiError(error);
  }
}, { requiredRole: 'barber' });
