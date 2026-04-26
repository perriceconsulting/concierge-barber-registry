import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api/middleware';
import { handleApiError } from '@/lib/api/errors';
import {
  searchBarbersByLocation,
  GooglePlacesError,
  type PlacesSearchResult,
} from '@/lib/google-places';

const SearchSchema = z.object({
  city: z.string().min(1).max(100),
  state: z.string().length(2),
  maxResults: z.number().int().min(1).max(20).optional(),
});

const searchHandler = async (request: Request) => {
  try {
    const body = await request.json();
    const parsed = SearchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid input' },
        },
        { status: 400 }
      );
    }

    const { city, state, maxResults } = parsed.data;

    let results: PlacesSearchResult[];
    try {
      results = await searchBarbersByLocation(city, state.toUpperCase(), { maxResults });
    } catch (err) {
      if (err instanceof GooglePlacesError) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'GOOGLE_PLACES_ERROR', message: err.message },
          },
          { status: err.statusCode ?? 500 }
        );
      }
      throw err;
    }

    // Mark which results are already imported (by place_id)
    const placeIds = results.map((r) => r.placeId);
    const existing = placeIds.length
      ? await prisma.barberProfile.findMany({
          where: { googlePlaceId: { in: placeIds } },
          select: { googlePlaceId: true, slug: true },
        })
      : [];
    const existingMap = new Map(existing.map((e) => [e.googlePlaceId, e.slug]));

    const annotated = results.map((r) => ({
      ...r,
      alreadyImported: existingMap.has(r.placeId),
      existingSlug: existingMap.get(r.placeId) ?? null,
    }));

    return NextResponse.json({
      success: true,
      data: { results: annotated },
    });
  } catch (error) {
    return handleApiError(error);
  }
};

export const POST = withAuth(searchHandler, { requiredRole: 'admin' });
