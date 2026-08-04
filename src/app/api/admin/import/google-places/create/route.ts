import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api/middleware';
import { handleApiError } from '@/lib/api/errors';
import { generateUniqueBarberSlug } from '@/lib/slug';
import { createLogger } from '@/lib/logger';
import { sendClaimInvitationEmail } from '@/lib/email';
import crypto from 'crypto';
import { APP_CONFIG } from '@/config';

const logger = createLogger('GOOGLE_PLACES_IMPORT');

const PlaceItemSchema = z.object({
  placeId: z.string().min(1),
  displayName: z.string().min(1).max(150),
  city: z.string().min(1).max(100).nullable(),
  state: z.string().length(2).nullable(),
  zipCode: z.string().max(20).nullable(),
  phone: z.string().max(50).nullable(),
  websiteUri: z.string().nullable(),
  formattedAddress: z.string().max(255).nullable(),
  outreachEmail: z
    .string()
    .email()
    .optional()
    .or(z.literal('').transform(() => undefined)),
});

const CreateSchema = z.object({
  items: z.array(PlaceItemSchema).min(1).max(50),
});

interface CreatedSummary {
  placeId: string;
  displayName: string;
  slug?: string;
  publicUrl?: string;
  claimUrl?: string;
  invitationStatus?: 'sent' | 'no_email' | 'failed';
  status: 'created' | 'skipped' | 'error';
  reason?: string;
}

const createHandler = async (request: Request) => {
  try {
    const body = await request.json();
    const parsed = CreateSchema.safeParse(body);

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

    for (const item of parsed.data.items) {
      // Validate required fields the Places result might have lacked
      if (!item.city || !item.state || !item.zipCode) {
        results.push({
          placeId: item.placeId,
          displayName: item.displayName,
          status: 'skipped',
          reason: 'Missing city, state, or zip — cannot create profile',
        });
        continue;
      }

      // Skip if already imported
      const existing = await prisma.barberProfile.findUnique({
        where: { googlePlaceId: item.placeId },
        select: { id: true, slug: true },
      });
      if (existing) {
        results.push({
          placeId: item.placeId,
          displayName: item.displayName,
          status: 'skipped',
          reason: 'Already imported',
          slug: existing.slug,
        });
        continue;
      }

      // Best-effort split of "First Last" — Google returns business names that
      // are sometimes shop names rather than person names. Default first/last
      // to displayName to keep User valid; admin can correct after claim.
      const nameParts = item.displayName.trim().split(/\s+/);
      const firstName = nameParts[0] || item.displayName;
      const lastName = nameParts.slice(1).join(' ') || '—';

      // Email collision check if we have an outreach email
      if (item.outreachEmail) {
        const existingEmailUser = await prisma.user.findUnique({
          where: { email: item.outreachEmail },
          select: { id: true },
        });
        if (existingEmailUser) {
          results.push({
            placeId: item.placeId,
            displayName: item.displayName,
            status: 'error',
            reason: 'A user with that email already exists',
          });
          continue;
        }
      }

      try {
        const stubId = crypto.randomUUID();
        const stubEmail = `stub-${stubId}@unclaimed.local`;
        const claimToken = crypto.randomUUID();
        const slug = await generateUniqueBarberSlug(item.displayName, stubId);

        const profile = await prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: {
              email: item.outreachEmail || stubEmail,
              role: 'barber',
              firstName,
              lastName,
              phone: item.phone || undefined,
              isStub: true,
              isActive: true,
              emailVerified: false,
            },
          });

          return tx.barberProfile.create({
            data: {
              userId: user.id,
              displayName: item.displayName,
              slug,
              city: item.city!,
              state: item.state!.toUpperCase(),
              zipCode: item.zipCode!,
              shopAddressLine1: item.formattedAddress || undefined,
              websiteUrl: item.websiteUri || undefined,
              claimStatus: 'unclaimed',
              dataSource: 'google_places',
              claimToken,
              outreachEmail: item.outreachEmail || null,
              googlePlaceId: item.placeId,
              verificationStatus: 'approved',
            },
          });
        });

        const claimUrl = `${baseUrl}/claim/${claimToken}`;
        const publicUrl = `${baseUrl}/barbers/${profile.slug}`;
        let invitationStatus: 'sent' | 'no_email' | 'failed' = 'no_email';

        if (item.outreachEmail) {
          try {
            const sendResult = await sendClaimInvitationEmail({
              to: item.outreachEmail,
              firstName,
              displayName: item.displayName,
              city: item.city,
              state: item.state.toUpperCase(),
              claimUrl,
              publicUrl,
            });
            if (sendResult.success) {
              await prisma.barberProfile.update({
                where: { id: profile.id },
                data: {
                  claimStatus: 'claim_sent',
                  claimInvitationSentAt: new Date(),
                  claimInvitationCount: { increment: 1 },
                },
              });
              invitationStatus = 'sent';
            } else {
              invitationStatus = 'failed';
            }
          } catch (emailErr) {
            logger.error('Claim email send failed for imported profile', {
              profileId: profile.id,
              error: emailErr instanceof Error ? emailErr.message : 'unknown',
            });
            invitationStatus = 'failed';
          }
        }

        results.push({
          placeId: item.placeId,
          displayName: item.displayName,
          slug: profile.slug,
          publicUrl,
          claimUrl,
          invitationStatus,
          status: 'created',
        });
      } catch (err) {
        logger.error('Failed to create profile from Google Places result', {
          placeId: item.placeId,
          error: err instanceof Error ? err.message : 'unknown',
        });
        results.push({
          placeId: item.placeId,
          displayName: item.displayName,
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

    logger.info('Google Places import complete', summary);

    return NextResponse.json({
      success: true,
      data: { results, summary },
    });
  } catch (error) {
    return handleApiError(error);
  }
};

export const POST = withAuth(createHandler, { requiredRole: 'admin' });
