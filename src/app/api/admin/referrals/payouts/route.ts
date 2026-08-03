import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withAuth, AuthRequest } from '@/lib/api/middleware';
import { ApiError, handleApiError } from '@/lib/api/errors';
import { createAuditLog, getIpFromRequest } from '@/lib/audit';
import { createLogger } from '@/lib/logger';

const logger = createLogger('REFERRAL_PAYOUTS');

const createPayoutSchema = z.object({
  // List of referral IDs to mark paid in this batch. All must currently be
  // status='approved'. If they belong to multiple barbers, we create one
  // payout record per barber and group by barber automatically.
  referralIds: z.array(z.string().uuid()).min(1).max(500),
  batchRef: z.string().max(120).optional(),
  notes: z.string().max(1000).optional(),
});

/**
 * GET /api/admin/referrals/payouts — list past payout batches.
 *
 * ?format=csv exports a flat CSV (one row per payout) for accounting.
 */
async function listPayoutsHandler(request: AuthRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const format = searchParams.get('format');

    const payouts = await prisma.referralPayout.findMany({
      orderBy: { paidAt: 'desc' },
      take: 200,
      include: {
        barber: {
          select: { id: true, slug: true, displayName: true, city: true, state: true },
        },
        referrals: {
          select: { id: true, payoutCents: true, serviceDescription: true },
        },
      },
    });

    if (format === 'csv') {
      const lines = ['paid_at,batch_ref,barber_slug,barber_name,total_cents,referral_count,notes'];
      for (const p of payouts) {
        const cells = [
          p.paidAt.toISOString(),
          p.batchRef ?? '',
          p.barber.slug,
          p.barber.displayName,
          String(p.totalCents),
          String(p.referrals.length),
          (p.notes ?? '').replace(/[\r\n,]+/g, ' '),
        ].map((c) => `"${c.replace(/"/g, '""')}"`);
        lines.push(cells.join(','));
      }
      return new NextResponse(lines.join('\n'), {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="referral-payouts-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json({ success: true, data: { payouts } });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/admin/referrals/payouts — batch mark approved referrals paid.
 *
 * Groups referral IDs by referring barber, creates one ReferralPayout per
 * barber, and atomically flips each referral's status='paid' + sets payoutId.
 * Manual / honor-system: doesn't actually move money. The CSV is what gets
 * handed to the bookkeeper.
 */
async function createPayoutHandler(request: AuthRequest) {
  try {
    const body = await request.json();
    const parsed = createPayoutSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid payout request', parsed.error.format());
    }
    const { referralIds, batchRef, notes } = parsed.data;

    const referrals = await prisma.referral.findMany({
      where: { id: { in: referralIds } },
      select: { id: true, status: true, referringBarberId: true, payoutCents: true },
    });

    if (referrals.length !== referralIds.length) {
      throw new ApiError(400, 'NOT_FOUND', 'One or more referrals were not found.');
    }

    const notApproved = referrals.filter((r) => r.status !== 'approved');
    if (notApproved.length > 0) {
      throw new ApiError(
        400,
        'NOT_APPROVED',
        `${notApproved.length} referral(s) are not in 'approved' status — only approved referrals can be paid.`,
        { ids: notApproved.map((r) => r.id) },
      );
    }

    // Group by referring barber.
    const byBarber = new Map<string, { ids: string[]; totalCents: number }>();
    for (const r of referrals) {
      const cur = byBarber.get(r.referringBarberId) ?? { ids: [], totalCents: 0 };
      cur.ids.push(r.id);
      cur.totalCents += r.payoutCents;
      byBarber.set(r.referringBarberId, cur);
    }

    const now = new Date();
    const createdPayouts: { id: string; barberId: string; totalCents: number; count: number }[] = [];

    await prisma.$transaction(async (tx) => {
      for (const [barberId, group] of byBarber) {
        const payout = await tx.referralPayout.create({
          data: {
            barberId,
            totalCents: group.totalCents,
            batchRef: batchRef ?? null,
            notes: notes ?? null,
            paidAt: now,
          },
          select: { id: true, barberId: true, totalCents: true },
        });
        await tx.referral.updateMany({
          where: { id: { in: group.ids } },
          data: {
            status: 'paid',
            paidAt: now,
            payoutId: payout.id,
          },
        });
        createdPayouts.push({ ...payout, count: group.ids.length });
      }
    });

    for (const p of createdPayouts) {
      await createAuditLog({
        actorUserId: request.userId,
        action: 'referral.payout_batch',
        entityType: 'barber_profile',
        entityId: p.barberId,
        details: {
          payoutId: p.id,
          totalCents: p.totalCents,
          referralCount: p.count,
          batchRef: batchRef ?? null,
        },
        ipAddress: getIpFromRequest(request),
      });
    }

    logger.info('Payout batch created', {
      batchRef,
      payouts: createdPayouts.length,
      referrals: referrals.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        payouts: createdPayouts,
        message: `Marked ${referrals.length} referral(s) paid across ${createdPayouts.length} barber(s).`,
      },
    });
  } catch (error) {
    logger.error('Payout creation failed', error);
    return handleApiError(error);
  }
}

export const GET = withAuth(listPayoutsHandler, { requiredRole: 'admin' });
export const POST = withAuth(createPayoutHandler, { requiredRole: 'admin' });
