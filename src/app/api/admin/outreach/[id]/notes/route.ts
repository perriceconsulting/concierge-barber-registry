import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withAuth, type AuthRequest } from '@/lib/api/middleware';
import { handleApiError } from '@/lib/api/errors';

const ENTRY_SELECT = {
  id: true,
  body: true,
  createdAt: true,
  author: { select: { firstName: true, lastName: true } },
} as const;

const CreateSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

function getId(params: Record<string, string | string[]>): string {
  return typeof params.id === 'string' ? params.id : String(params.id);
}

const listHandler = async (
  _request: AuthRequest,
  context?: { params: Promise<Record<string, string | string[]>> }
) => {
  try {
    if (!context?.params) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Missing id' } },
        { status: 400 }
      );
    }
    const id = getId(await context.params);

    const entries = await prisma.outreachNote.findMany({
      where: { profileId: id },
      orderBy: { createdAt: 'asc' },
      select: ENTRY_SELECT,
    });

    return NextResponse.json({ success: true, data: { entries } });
  } catch (error) {
    return handleApiError(error);
  }
};

const createHandler = async (
  request: AuthRequest,
  context?: { params: Promise<Record<string, string | string[]>> }
) => {
  try {
    if (!context?.params) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Missing id' } },
        { status: 400 }
      );
    }
    const id = getId(await context.params);

    const { body } = CreateSchema.parse(await request.json());

    // Create the entry and bump the profile's outreach timestamp together so
    // the list view's "last updated" reflects note activity.
    const [entry] = await prisma.$transaction([
      prisma.outreachNote.create({
        data: { profileId: id, authorId: request.userId ?? null, body },
        select: ENTRY_SELECT,
      }),
      prisma.barberProfile.update({
        where: { id },
        data: { outreachUpdatedAt: new Date() },
        select: { id: true },
      }),
    ]);

    return NextResponse.json({ success: true, data: { entry } });
  } catch (error) {
    return handleApiError(error);
  }
};

export const GET = withAuth(listHandler, { requiredRole: 'admin' });
export const POST = withAuth(createHandler, { requiredRole: 'admin' });
