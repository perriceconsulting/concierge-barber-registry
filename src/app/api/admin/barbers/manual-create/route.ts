import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api/middleware';
import { handleApiError } from '@/lib/api/errors';
import { generateUniqueBarberSlug } from '@/lib/slug';
import { createLogger } from '@/lib/logger';
import crypto from 'crypto';

const logger = createLogger('ADMIN_BARBER_CREATE');

const ManualCreateSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  displayName: z.string().min(1).max(150),
  city: z.string().min(1).max(100),
  state: z.string().length(2),
  zipCode: z.string().min(5).max(10),
  outreachEmail: z.string().email().optional().or(z.literal('').transform(() => undefined)),
  shopName: z.string().max(200).optional(),
  shopAddressLine1: z.string().max(255).optional(),
  bio: z.string().max(2000).optional(),
  phone: z.string().max(20).optional(),
  websiteUrl: z.string().url().optional().or(z.literal('').transform(() => undefined)),
  instagramHandle: z.string().max(100).optional(),
  specialtyIds: z.array(z.number().int().positive()).optional(),
});

const manualCreateHandler = async (request: Request) => {
  try {
    const body = await request.json();
    const parsed = ManualCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: parsed.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // If outreachEmail provided, check if a user with that email already exists
    if (data.outreachEmail) {
      const existing = await prisma.user.findUnique({
        where: { email: data.outreachEmail },
        select: { id: true },
      });
      if (existing) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'EMAIL_IN_USE',
              message:
                'A user with this email already exists. Ask them to log in and create their barber profile, or omit the email.',
            },
          },
          { status: 409 }
        );
      }
    }

    // Stub user gets a placeholder email if none provided. The barber will set
    // their real email when they claim the profile.
    const stubId = crypto.randomUUID();
    const stubEmail = `stub-${stubId}@unclaimed.local`;
    const claimToken = crypto.randomUUID();

    const slug = await generateUniqueBarberSlug(data.displayName, stubId);

    const profile = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.outreachEmail || stubEmail,
          role: 'barber',
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          isStub: true,
          isActive: true,
          emailVerified: false,
        },
      });

      const created = await tx.barberProfile.create({
        data: {
          userId: user.id,
          displayName: data.displayName,
          slug,
          bio: data.bio,
          city: data.city,
          state: data.state.toUpperCase(),
          zipCode: data.zipCode,
          shopName: data.shopName,
          shopAddressLine1: data.shopAddressLine1,
          websiteUrl: data.websiteUrl,
          instagramHandle: data.instagramHandle,
          claimStatus: 'unclaimed',
          dataSource: 'manual_admin',
          claimToken,
          outreachEmail: data.outreachEmail || null,
          verificationStatus: 'approved', // Unclaimed profiles still listed publicly; verification happens after claim
          ...(data.specialtyIds && data.specialtyIds.length > 0
            ? {
                specialties: {
                  create: data.specialtyIds.map((specialtyId) => ({ specialtyId })),
                },
              }
            : {}),
        },
        include: { specialties: { include: { specialty: true } } },
      });

      return created;
    });

    logger.info('Created unclaimed barber profile via admin manual entry', {
      profileId: profile.id,
      slug: profile.slug,
    });

    return NextResponse.json({
      success: true,
      data: {
        profile: {
          id: profile.id,
          slug: profile.slug,
          displayName: profile.displayName,
          city: profile.city,
          state: profile.state,
        },
        claimToken,
        claimUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://conciergebarberregistry.com'}/claim/${claimToken}`,
        publicUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://conciergebarberregistry.com'}/barbers/${profile.slug}`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
};

export const POST = withAuth(manualCreateHandler, { requiredRole: 'admin' });
