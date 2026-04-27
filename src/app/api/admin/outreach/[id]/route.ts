import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api/middleware';
import { handleApiError } from '@/lib/api/errors';

const UpdateSchema = z.object({
  outreachStatus: z
    .enum([
      'not_contacted',
      'messaged_ig',
      'messaged_fb',
      'messaged_tiktok',
      'messaged_email',
      'messaged_phone',
      'responded',
      'not_interested',
      'bounced',
    ])
    .optional(),
  outreachNotes: z.string().max(2000).nullable().optional(),
});

const updateHandler = async (
  request: NextRequest,
  context?: { params: Promise<Record<string, string | string[]>> }
) => {
  try {
    if (!context?.params) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Missing id' } },
        { status: 400 }
      );
    }
    const params = await context.params;
    const id = typeof params.id === 'string' ? params.id : String(params.id);

    const body = await request.json();
    const data = UpdateSchema.parse(body);

    if (data.outreachStatus === undefined && data.outreachNotes === undefined) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Nothing to update' } },
        { status: 400 }
      );
    }

    const updated = await prisma.barberProfile.update({
      where: { id },
      data: {
        ...(data.outreachStatus !== undefined
          ? { outreachStatus: data.outreachStatus }
          : {}),
        ...(data.outreachNotes !== undefined ? { outreachNotes: data.outreachNotes } : {}),
        outreachUpdatedAt: new Date(),
      },
      select: {
        id: true,
        outreachStatus: true,
        outreachNotes: true,
        outreachUpdatedAt: true,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return handleApiError(error);
  }
};

export const PATCH = withAuth(updateHandler, { requiredRole: 'admin' });
