import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, AuthRequest } from '@/lib/api/middleware';
import { ApiError, handleApiError } from '@/lib/api/errors';
import { z } from 'zod';

const serviceSchema = z.object({
  name: z.string().min(1).max(150),
  description: z.string().max(500).optional(),
  priceCents: z.number().int().min(0),
  durationMinutes: z.number().int().min(1).max(480),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().default(0),
});

const updateServiceSchema = serviceSchema.partial().extend({
  id: z.string().uuid(),
});

const bulkUpdateSchema = z.object({
  services: z.array(z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1).max(150),
    description: z.string().max(500).optional(),
    priceCents: z.number().int().min(0),
    durationMinutes: z.number().int().min(1).max(480),
    isActive: z.boolean().optional().default(true),
    sortOrder: z.number().int().optional().default(0),
  })),
});

// GET /api/barbers/services - Get authenticated barber's services
const getServicesHandler = async (request: AuthRequest) => {
  try {
    const userId = request.userId!;

    const barberProfile = await prisma.barberProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!barberProfile) {
      throw new ApiError(404, 'NOT_FOUND', 'Barber profile not found');
    }

    const services = await prisma.service.findMany({
      where: { barberProfileId: barberProfile.id },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: { services },
    });
  } catch (error) {
    return handleApiError(error);
  }
};

// POST /api/barbers/services - Add a new service
const addServiceHandler = async (request: AuthRequest) => {
  try {
    const userId = request.userId!;

    const barberProfile = await prisma.barberProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!barberProfile) {
      throw new ApiError(404, 'NOT_FOUND', 'Barber profile not found');
    }

    const body = await request.json();
    const data = serviceSchema.parse(body);

    const service = await prisma.service.create({
      data: {
        barberProfileId: barberProfile.id,
        ...data,
      },
    });

    return NextResponse.json({
      success: true,
      data: { service },
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
};

// PUT /api/barbers/services - Bulk update all services (replace)
const bulkUpdateHandler = async (request: AuthRequest) => {
  try {
    const userId = request.userId!;

    const barberProfile = await prisma.barberProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!barberProfile) {
      throw new ApiError(404, 'NOT_FOUND', 'Barber profile not found');
    }

    const body = await request.json();
    const { services } = bulkUpdateSchema.parse(body);

    // Use a transaction: delete removed, upsert existing/new
    const result = await prisma.$transaction(async (tx) => {
      const existingIds = services
        .filter((s) => s.id)
        .map((s) => s.id as string);

      // Delete services not in the new list
      await tx.service.deleteMany({
        where: {
          barberProfileId: barberProfile.id,
          id: { notIn: existingIds },
        },
      });

      // Upsert each service
      const upserted = [];
      for (let i = 0; i < services.length; i++) {
        const s = services[i];
        if (s.id) {
          // Update existing
          const updated = await tx.service.update({
            where: { id: s.id },
            data: {
              name: s.name,
              description: s.description || null,
              priceCents: s.priceCents,
              durationMinutes: s.durationMinutes,
              isActive: s.isActive ?? true,
              sortOrder: i,
            },
          });
          upserted.push(updated);
        } else {
          // Create new
          const created = await tx.service.create({
            data: {
              barberProfileId: barberProfile.id,
              name: s.name,
              description: s.description || null,
              priceCents: s.priceCents,
              durationMinutes: s.durationMinutes,
              isActive: s.isActive ?? true,
              sortOrder: i,
            },
          });
          upserted.push(created);
        }
      }

      return upserted;
    });

    return NextResponse.json({
      success: true,
      data: { services: result },
    });
  } catch (error) {
    return handleApiError(error);
  }
};

export const GET = withAuth(getServicesHandler, { requiredRole: 'barber' });
export const POST = withAuth(addServiceHandler, { requiredRole: 'barber' });
export const PUT = withAuth(bulkUpdateHandler, { requiredRole: 'barber' });
