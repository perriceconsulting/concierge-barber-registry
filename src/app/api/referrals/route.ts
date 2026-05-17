import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withAuth, AuthRequest } from '@/lib/api/middleware';
import { ApiError, handleApiError } from '@/lib/api/errors';
import { createAuditLog, getIpFromRequest } from '@/lib/audit';
import { createLogger } from '@/lib/logger';

const logger = createLogger('REFERRALS_SUBMIT');

const submitSchema = z.object({
  // The slug of the barber whose client just walked in. Slug instead of ID
  // because a barber identifying another barber by slug is way more usable
  // than by UUID — and slugs are public.
  referringBarberSlug: z.string().min(1).max(150),
  serviceDescription: z.string().min(3).max(500),
  serviceFeeCents: z.number().int().positive().max(10_000_00),
  clientFirstName: z.string().max(100).optional(),
  clientCity: z.string().max(100).optional(),
});

const PLATFORM_CUT_PCT = 0.05;
const REFERRAL_PAYOUT_PCT = 0.10;

/**
 * POST /api/referrals — performing barber self-reports a referred service.
 *
 * The performing barber is the authenticated caller. They identify the
 * *referring* barber (the client's home barber) by public slug. CBR doesn't
 * process bookings, so this is honor-system: the performing barber declares
 * the fee, the platform calculates the 10% royalty + 5% platform cut, and
 * admin reviews before paying out monthly.
 */
async function submitReferralHandler(request: AuthRequest) {
  try {
    const body = await request.json();
    const parsed = submitSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid referral submission', parsed.error.format());
    }
    const data = parsed.data;

    const performingBarber = await prisma.barberProfile.findFirst({
      where: { userId: request.userId! },
      select: { id: true, slug: true, verificationStatus: true },
    });
    if (!performingBarber) {
      throw new ApiError(404, 'NOT_FOUND', 'Barber profile not found');
    }
    if (performingBarber.verificationStatus !== 'approved') {
      throw new ApiError(
        403,
        'NOT_VERIFIED',
        'Only verified barbers can submit referrals. Get verified first.',
      );
    }

    const referringBarber = await prisma.barberProfile.findUnique({
      where: { slug: data.referringBarberSlug },
      select: { id: true, slug: true, verificationStatus: true, displayName: true },
    });
    if (!referringBarber) {
      throw new ApiError(
        404,
        'REFERRING_BARBER_NOT_FOUND',
        'Could not find a barber with that profile link. Check the slug and try again.',
      );
    }
    if (referringBarber.verificationStatus !== 'approved') {
      throw new ApiError(
        400,
        'REFERRING_BARBER_NOT_VERIFIED',
        'The referring barber is not verified — royalties only flow between verified members.',
      );
    }
    if (referringBarber.id === performingBarber.id) {
      throw new ApiError(
        400,
        'CANNOT_REFER_SELF',
        'You cannot submit a referral with yourself as the referring barber.',
      );
    }

    const payoutCents = Math.round(data.serviceFeeCents * REFERRAL_PAYOUT_PCT);
    const platformCutCents = Math.round(data.serviceFeeCents * PLATFORM_CUT_PCT);

    const referral = await prisma.referral.create({
      data: {
        referringBarberId: referringBarber.id,
        performingBarberId: performingBarber.id,
        clientFirstName: data.clientFirstName || null,
        clientCity: data.clientCity || null,
        serviceDescription: data.serviceDescription,
        serviceFeeCents: data.serviceFeeCents,
        payoutCents,
        platformCutCents,
        status: 'pending',
      },
      select: { id: true, payoutCents: true, status: true, submittedAt: true },
    });

    await createAuditLog({
      actorUserId: request.userId,
      action: 'referral.submit',
      entityType: 'barber_profile',
      entityId: performingBarber.id,
      details: {
        referralId: referral.id,
        referringBarberId: referringBarber.id,
        serviceFeeCents: data.serviceFeeCents,
        payoutCents,
      },
      ipAddress: getIpFromRequest(request),
    });

    return NextResponse.json({
      success: true,
      data: {
        referral,
        message: `Royalty of $${(payoutCents / 100).toFixed(2)} queued for ${referringBarber.displayName}. Pending admin review.`,
      },
    });
  } catch (error) {
    logger.error('Referral submission failed', error);
    return handleApiError(error);
  }
}

export const POST = withAuth(submitReferralHandler, { requiredRole: 'barber' });
