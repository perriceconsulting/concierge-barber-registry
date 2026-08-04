import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api/middleware';
import { handleApiError } from '@/lib/api/errors';
import { generateUniqueBarberSlug } from '@/lib/slug';
import { createLogger } from '@/lib/logger';
import crypto from 'crypto';
import { APP_CONFIG } from '@/config';

const logger = createLogger('IG_QUICK_IMPORT');

const RequestSchema = z.object({
  entries: z.array(z.string().min(1).max(500)).min(1).max(50),
});

interface CreatedSummary {
  input: string;
  handle?: string;
  slug?: string;
  claimUrl?: string;
  publicUrl?: string;
  status: 'created' | 'skipped' | 'error';
  reason?: string;
}

// Reserved IG paths that aren't user profiles
const RESERVED_HANDLES = new Set([
  'p',
  'reel',
  'reels',
  'tv',
  'explore',
  'accounts',
  'about',
  'developer',
  'directory',
  'legal',
  'privacy',
  'safety',
  'terms',
  'web',
  'stories',
]);

function extractIgHandle(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Strip @ prefix if user pasted "@handle"
  if (trimmed.startsWith('@')) {
    const handle = trimmed.slice(1).split(/[\s/?#]/)[0];
    return isValidHandle(handle) ? handle : null;
  }

  // Try to parse as URL — handle full URLs and bare handles
  try {
    // Add protocol if missing so URL parser works
    const urlString = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const url = new URL(urlString);

    if (!url.hostname.includes('instagram.com')) {
      // Not an IG URL — treat the whole input as a bare handle
      const handle = trimmed.split(/[\s/?#]/)[0];
      return isValidHandle(handle) ? handle : null;
    }

    // Pull the first non-empty path segment as the handle
    const segments = url.pathname.split('/').filter(Boolean);
    const handle = segments[0];
    if (!handle || RESERVED_HANDLES.has(handle.toLowerCase())) return null;
    return isValidHandle(handle) ? handle : null;
  } catch {
    // Not a parseable URL — treat as bare handle
    const handle = trimmed.split(/[\s/?#]/)[0];
    return isValidHandle(handle) ? handle : null;
  }
}

function isValidHandle(handle: string): boolean {
  // IG handles: 1–30 chars, letters/numbers/periods/underscores, no consecutive periods
  if (!handle) return false;
  if (handle.length > 30) return false;
  return /^[a-zA-Z0-9._]+$/.test(handle) && !handle.includes('..');
}

const handler = async (request: Request) => {
  try {
    const body = await request.json();
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid input' },
        },
        { status: 400 }
      );
    }

    const baseUrl =
      APP_CONFIG.url;

    const results: CreatedSummary[] = [];

    for (const input of parsed.data.entries) {
      const handle = extractIgHandle(input);

      if (!handle) {
        results.push({
          input,
          status: 'error',
          reason: 'Could not extract a valid Instagram handle',
        });
        continue;
      }

      // Dedup: skip if any profile already has this handle (case-insensitive match
      // would be ideal but Prisma JSON comparisons are case-sensitive by default;
      // the IG handle itself is case-insensitive on instagram.com, so we lowercase)
      const lowerHandle = handle.toLowerCase();
      const existing = await prisma.barberProfile.findFirst({
        where: {
          instagramHandle: { equals: lowerHandle, mode: 'insensitive' },
        },
        select: { slug: true },
      });

      if (existing) {
        results.push({
          input,
          handle: lowerHandle,
          status: 'skipped',
          reason: 'Already imported',
          slug: existing.slug,
        });
        continue;
      }

      try {
        const stubId = crypto.randomUUID();
        const stubEmail = `stub-${stubId}@unclaimed.local`;
        const claimToken = crypto.randomUUID();
        const displayName = `@${lowerHandle}`;
        const slug = await generateUniqueBarberSlug(displayName, stubId);

        const profile = await prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: {
              email: stubEmail,
              role: 'barber',
              firstName: `@${lowerHandle}`,
              lastName: '—',
              isStub: true,
              isActive: true,
              emailVerified: false,
            },
          });

          return tx.barberProfile.create({
            data: {
              userId: user.id,
              displayName,
              slug,
              city: '',
              state: '',
              zipCode: '',
              instagramHandle: lowerHandle,
              isHidden: true, // Stay hidden until barber claims and fills location
              claimStatus: 'unclaimed',
              dataSource: 'manual_admin',
              claimToken,
              verificationStatus: 'approved',
            },
          });
        });

        results.push({
          input,
          handle: lowerHandle,
          slug: profile.slug,
          claimUrl: `${baseUrl}/claim/${claimToken}`,
          publicUrl: `${baseUrl}/barbers/${profile.slug}`,
          status: 'created',
        });
      } catch (err) {
        logger.error('Failed to create profile from IG handle', {
          handle: lowerHandle,
          error: err instanceof Error ? err.message : 'unknown',
        });
        results.push({
          input,
          handle: lowerHandle,
          status: 'error',
          reason: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    const summary = {
      total: results.length,
      created: results.filter((r) => r.status === 'created').length,
      skipped: results.filter((r) => r.status === 'skipped').length,
      errored: results.filter((r) => r.status === 'error').length,
    };

    logger.info('IG quick import complete', summary);

    return NextResponse.json({
      success: true,
      data: { results, summary },
    });
  } catch (error) {
    return handleApiError(error);
  }
};

export const POST = withAuth(handler, { requiredRole: 'admin' });
