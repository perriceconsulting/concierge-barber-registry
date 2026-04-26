/**
 * Google Places API (New) wrapper for barber-directory imports.
 *
 * Docs: https://developers.google.com/maps/documentation/places/web-service/text-search
 *
 * Uses the v1 endpoint with field masks so we only pay for the fields we read.
 */

import { createLogger } from '@/lib/logger';

const logger = createLogger('GOOGLE_PLACES');

const TEXT_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.addressComponents',
  'places.nationalPhoneNumber',
  'places.internationalPhoneNumber',
  'places.websiteUri',
  'places.businessStatus',
  'places.types',
  'places.location',
].join(',');

export interface PlacesSearchResult {
  placeId: string;
  displayName: string;
  formattedAddress: string;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  phone: string | null;
  websiteUri: string | null;
  businessStatus: string | null;
  types: string[];
  latitude: number | null;
  longitude: number | null;
}

interface RawPlacesResponse {
  places?: Array<{
    id: string;
    displayName?: { text: string };
    formattedAddress?: string;
    addressComponents?: Array<{
      shortText?: string;
      longText?: string;
      types?: string[];
    }>;
    nationalPhoneNumber?: string;
    internationalPhoneNumber?: string;
    websiteUri?: string;
    businessStatus?: string;
    types?: string[];
    location?: { latitude?: number; longitude?: number };
  }>;
  error?: { message: string };
}

interface AddressComponent {
  shortText?: string;
  longText?: string;
  types?: string[];
}

function extractAddressPart(
  components: AddressComponent[] | undefined,
  type: string,
  variant: 'short' | 'long' = 'short'
): string | null {
  if (!components) return null;
  const match = components.find((c) => c.types?.includes(type));
  if (!match) return null;
  return (variant === 'short' ? match.shortText : match.longText) ?? null;
}

export class GooglePlacesError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'GooglePlacesError';
  }
}

export async function searchBarbersByLocation(
  city: string,
  state: string,
  options: { maxResults?: number } = {}
): Promise<PlacesSearchResult[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    throw new GooglePlacesError(
      'GOOGLE_PLACES_API_KEY is not configured. Set it in environment variables to enable Google Places imports.',
      503
    );
  }

  const textQuery = `barber in ${city}, ${state}`;
  const maxResults = Math.min(options.maxResults ?? 20, 20); // API caps at 20 per request

  try {
    const response = await fetch(TEXT_SEARCH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery,
        pageSize: maxResults,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'unknown error');
      logger.error('Google Places API request failed', {
        status: response.status,
        errorText,
      });
      throw new GooglePlacesError(
        `Google Places API returned ${response.status}`,
        response.status
      );
    }

    const data = (await response.json()) as RawPlacesResponse;

    if (data.error) {
      throw new GooglePlacesError(data.error.message, 400);
    }

    if (!data.places || data.places.length === 0) {
      return [];
    }

    return data.places.map((p): PlacesSearchResult => {
      const components = p.addressComponents;
      return {
        placeId: p.id,
        displayName: p.displayName?.text ?? 'Unnamed business',
        formattedAddress: p.formattedAddress ?? '',
        city: extractAddressPart(components, 'locality', 'long'),
        state: extractAddressPart(components, 'administrative_area_level_1', 'short'),
        zipCode: extractAddressPart(components, 'postal_code', 'short'),
        phone: p.nationalPhoneNumber ?? p.internationalPhoneNumber ?? null,
        websiteUri: p.websiteUri ?? null,
        businessStatus: p.businessStatus ?? null,
        types: p.types ?? [],
        latitude: p.location?.latitude ?? null,
        longitude: p.location?.longitude ?? null,
      };
    });
  } catch (err) {
    if (err instanceof GooglePlacesError) throw err;
    logger.error('Unexpected error during Google Places search', {
      error: err instanceof Error ? err.message : 'unknown',
    });
    throw new GooglePlacesError(
      'Failed to search Google Places. Please try again.',
      500
    );
  }
}
