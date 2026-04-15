export const DEFAULT_OG_IMAGE = {
  url: '/og-image.png',
  width: 1200,
  height: 630,
  alt: 'Concierge Barber Registry',
} as const;

export const DEFAULT_TWITTER_IMAGE = '/twitter-image.png';

interface OgImageInput {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
}

export function resolveOgImages(
  images?: OgImageInput[] | null
): Array<{ url: string; alt: string; width: number; height: number }> {
  if (!images || images.length === 0) {
    return [{ ...DEFAULT_OG_IMAGE }];
  }
  return images.map((img) => ({
    url: img.url,
    alt: img.alt ?? DEFAULT_OG_IMAGE.alt,
    width: img.width ?? DEFAULT_OG_IMAGE.width,
    height: img.height ?? DEFAULT_OG_IMAGE.height,
  }));
}
