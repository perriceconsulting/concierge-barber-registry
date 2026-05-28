import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api/middleware';
import { handleApiError } from '@/lib/api/errors';
import type { OutreachStatus } from '@prisma/client';

const ALL_OUTREACH_STATUSES: OutreachStatus[] = [
  'not_contacted',
  'messaged_ig',
  'messaged_fb',
  'messaged_tiktok',
  'messaged_email',
  'messaged_phone',
  'responded',
  'not_interested',
  'bounced',
];

const listHandler = async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = (searchParams.get('q') || '').trim();
    const status = searchParams.get('status') || '';
    const claimStatus = searchParams.get('claimStatus') || '';

    const where: Record<string, unknown> = {
      removalRequestedAt: null,
      // Outreach is only relevant for unclaimed/claim_sent profiles
      claimStatus: { in: ['unclaimed', 'claim_sent'] },
    };

    if (status && ALL_OUTREACH_STATUSES.includes(status as OutreachStatus)) {
      where.outreachStatus = status;
    }

    if (claimStatus === 'unclaimed' || claimStatus === 'claim_sent') {
      where.claimStatus = claimStatus;
    }

    if (query) {
      const escaped = query.replace(/[%_\\]/g, '\\$&');
      where.OR = [
        { displayName: { contains: escaped, mode: 'insensitive' } },
        { city: { contains: escaped, mode: 'insensitive' } },
        { shopName: { contains: escaped, mode: 'insensitive' } },
        { instagramHandle: { contains: escaped, mode: 'insensitive' } },
      ];
    }

    const profiles = await prisma.barberProfile.findMany({
      where,
      orderBy: [
        { outreachStatus: 'asc' }, // not_contacted first
        { createdAt: 'desc' },
      ],
      take: 200,
      select: {
        id: true,
        slug: true,
        displayName: true,
        city: true,
        state: true,
        shopName: true,
        websiteUrl: true,
        instagramHandle: true,
        outreachEmail: true,
        outreachStatus: true,
        outreachUpdatedAt: true,
        outreachNotes: true,
        claimStatus: true,
        claimToken: true,
        dataSource: true,
        createdAt: true,
        user: { select: { firstName: true, lastName: true } },
        _count: { select: { outreachNoteEntries: true } },
      },
    });

    // Flatten the thread entry count onto each profile so the card can show
    // "Notes (N)" without loading the full thread.
    const profilesWithNoteCount = profiles.map(({ _count, ...p }) => ({
      ...p,
      noteCount: _count.outreachNoteEntries,
    }));

    // Aggregate counts by outreachStatus for filter chips
    const counts = await prisma.barberProfile.groupBy({
      by: ['outreachStatus'],
      where: {
        removalRequestedAt: null,
        claimStatus: { in: ['unclaimed', 'claim_sent'] },
      },
      _count: { _all: true },
    });

    const countMap = Object.fromEntries(
      counts.map((c) => [c.outreachStatus, c._count._all])
    );

    return NextResponse.json({
      success: true,
      data: { profiles: profilesWithNoteCount, counts: countMap },
    });
  } catch (error) {
    return handleApiError(error);
  }
};

export const GET = withAuth(listHandler, { requiredRole: 'admin' });
