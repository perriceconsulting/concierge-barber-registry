import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withAuth, AuthRequest } from '@/lib/api/middleware';
import { handleApiError } from '@/lib/api/errors';

const updateBlogSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  slug: z.string().min(3).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  description: z.string().min(10).max(500).optional(),
  content: z.string().min(50).optional(),
  keywords: z.array(z.string()).min(1).max(15).optional(),
  category: z.enum(['for_clients', 'for_barbers', 'industry']).optional(),
  status: z.enum(['draft', 'published']).optional(),
  readingTime: z.number().int().min(1).max(60).optional(),
  author: z.string().max(200).optional(),
  imageUrl: z.string().url().optional().nullable(),
  imageAlt: z.string().max(300).optional().nullable(),
});

const getHandler = async (
  request: AuthRequest,
  context?: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await context!.params;

    const post = await prisma.blogPost.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Blog post not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: { post } });
  } catch (error) {
    return handleApiError(error);
  }
};

const patchHandler = async (
  request: AuthRequest,
  context?: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await context!.params;
    const body = await request.json();
    const data = updateBlogSchema.parse(body);

    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Blog post not found' } },
        { status: 404 }
      );
    }

    if (data.slug && data.slug !== existing.slug) {
      const slugExists = await prisma.blogPost.findUnique({ where: { slug: data.slug } });
      if (slugExists) {
        return NextResponse.json(
          { error: { code: 'CONFLICT', message: 'A blog post with this slug already exists' } },
          { status: 409 }
        );
      }
    }

    const updateData: Record<string, unknown> = { ...data };
    if (data.status === 'published' && !existing.publishedAt) {
      updateData.publishedAt = new Date();
    }

    const post = await prisma.blogPost.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: { post } });
  } catch (error) {
    return handleApiError(error);
  }
};

const deleteHandler = async (
  request: AuthRequest,
  context?: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await context!.params;

    await prisma.blogPost.delete({ where: { id } });

    return NextResponse.json({ success: true, data: { message: 'Blog post deleted' } });
  } catch (error) {
    return handleApiError(error);
  }
};

export const GET = withAuth(getHandler, { requiredRole: 'admin' });
export const PATCH = withAuth(patchHandler, { requiredRole: 'admin' });
export const DELETE = withAuth(deleteHandler, { requiredRole: 'admin' });
