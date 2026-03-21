import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { withAuth, AuthRequest } from '@/lib/api/middleware';
import { handleApiError } from '@/lib/api/errors';

const createBlogSchema = z.object({
  title: z.string().min(5).max(200),
  slug: z.string().min(3).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase with hyphens'),
  description: z.string().min(10).max(500),
  content: z.string().min(50),
  keywords: z.array(z.string()).min(1).max(15),
  category: z.enum(['for_clients', 'for_barbers', 'industry']),
  status: z.enum(['draft', 'published']).default('draft'),
  readingTime: z.number().int().min(1).max(60).default(5),
  author: z.string().max(200).default('Concierge Barber Registry'),
  imageUrl: z.string().url().optional().nullable(),
  imageAlt: z.string().max(300).optional().nullable(),
});

const getHandler = async (request: AuthRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (category) where.category = category;

    const posts = await prisma.blogPost.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        category: true,
        status: true,
        readingTime: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, data: { posts } });
  } catch (error) {
    return handleApiError(error);
  }
};

const postHandler = async (request: AuthRequest) => {
  try {
    const body = await request.json();
    const data = createBlogSchema.parse(body);

    const existing = await prisma.blogPost.findUnique({
      where: { slug: data.slug },
    });
    if (existing) {
      return NextResponse.json(
        { error: { code: 'CONFLICT', message: 'A blog post with this slug already exists' } },
        { status: 409 }
      );
    }

    const post = await prisma.blogPost.create({
      data: {
        title: data.title,
        slug: data.slug,
        description: data.description,
        content: data.content,
        keywords: data.keywords as unknown as Prisma.InputJsonValue,
        category: data.category as 'for_clients' | 'for_barbers' | 'industry',
        status: data.status as 'draft' | 'published',
        readingTime: data.readingTime,
        author: data.author,
        imageUrl: data.imageUrl ?? null,
        imageAlt: data.imageAlt ?? null,
        publishedAt: data.status === 'published' ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true, data: { post } }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
};

export const GET = withAuth(getHandler, { requiredRole: 'admin' });
export const POST = withAuth(postHandler, { requiredRole: 'admin' });
