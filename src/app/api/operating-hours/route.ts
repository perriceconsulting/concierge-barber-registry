import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api/middleware';

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
  try {
    const userId = req.userId!;

    // Get the barber profile
    const barber = await prisma.barberProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!barber) {
      return NextResponse.json(
        { error: 'Barber profile not found' },
        { status: 404 }
      );
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
  } catch (error) {
    console.error('Error fetching operating hours:', error);
    return NextResponse.json(
      { error: 'Failed to fetch operating hours' },
      { status: 500 }
    );
  }
}

// PUT /api/operating-hours - Update barber's operating hours
async function updateOperatingHoursHandler(req: any) {
  try {
    const userId = req.userId!;
    const body = await req.json();

    // Validate input
    const validationResult = operatingHoursSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { hours } = validationResult.data;

    // Validate that open days have both open and close times
    for (const day of hours) {
      if (!day.isClosed) {
        if (!day.openTime || !day.closeTime) {
          return NextResponse.json(
            { error: `Day ${day.dayOfWeek} must have both open and close times` },
            { status: 400 }
          );
        }
        if (day.openTime >= day.closeTime) {
          return NextResponse.json(
            { error: `Day ${day.dayOfWeek}: Close time must be after open time` },
            { status: 400 }
          );
        }
      }
    }

    // Get the barber profile
    const barber = await prisma.barberProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!barber) {
      return NextResponse.json(
        { error: 'Barber profile not found' },
        { status: 404 }
      );
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
  } catch (error) {
    console.error('Error updating operating hours:', error);
    return NextResponse.json(
      { error: 'Failed to update operating hours' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getOperatingHoursHandler, { requiredRole: 'barber' });
export const PUT = withAuth(updateOperatingHoursHandler, { requiredRole: 'barber' });
