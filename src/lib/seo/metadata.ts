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
  ogTitle?: string;
  ogDescription?: string;
  twitterTitle?: string;
  twitterDescription?: string;
}

export function buildPageMetadata(input: BuildPageMetadataInput): Metadata {
  const {
    title,
    description,
    path,
    images,
    keywords,
    noindex,
    ogType = 'website',
    ogTitle,
    ogDescription,
    twitterTitle,
    twitterDescription,
  } = input;
  const canonical = canonicalPath(path);
  const ogImages = resolveOgImages(images);

  const resolvedOgTitle = ogTitle ?? title;
  const resolvedOgDescription = ogDescription ?? description;
  const resolvedTwitterTitle = twitterTitle ?? resolvedOgTitle;
  const resolvedTwitterDescription = twitterDescription ?? resolvedOgDescription;

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
      title: resolvedOgTitle,
      description: resolvedOgDescription,
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      site: '@ConciergeBarber',
      creator: '@ConciergeBarber',
      title: resolvedTwitterTitle,
      description: resolvedTwitterDescription,
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
