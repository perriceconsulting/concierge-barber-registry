import type { Metadata } from 'next';
import { APP_CONFIG } from '@/config';
import { canonicalPath } from './canonical';
import { DEFAULT_TWITTER_IMAGE, resolveOgImages } from './og-image';

interface BuildPageMetadataInput {
  title: string;
  description: string;
  path: string;
  images?: Array<{ url: string; alt?: string; width?: number; height?: number }>;
  keywords?: string[];
  noindex?: boolean;
  ogType?: 'website' | 'article' | 'profile';
}

export function buildPageMetadata(input: BuildPageMetadataInput): Metadata {
  const { title, description, path, images, keywords, noindex, ogType = 'website' } = input;
  const canonical = canonicalPath(path);
  const ogImages = resolveOgImages(images);

  return {
    title,
    description,
    ...(keywords && keywords.length > 0 ? { keywords } : {}),
    alternates: {
      canonical,
    },
    openGraph: {
      type: ogType,
      locale: 'en_US',
      url: canonical,
      siteName: APP_CONFIG.name,
      title,
      description,
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      site: '@ConciergeBarber',
      creator: '@ConciergeBarber',
      title,
      description,
      images: images && images.length > 0 ? [images[0].url] : [DEFAULT_TWITTER_IMAGE],
    },
    ...(noindex
      ? {
          robots: {
            index: false,
            follow: true,
          },
        }
      : {}),
  };
}
