'use client';

import { BlogPost } from '@/content/blog/types';
import { APP_CONFIG } from '@/config';

export function ArticleStructuredData({ post }: { post: BlogPost }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    author: {
      '@type': 'Organization',
      name: APP_CONFIG.name,
      url: APP_CONFIG.url,
    },
    publisher: {
      '@type': 'Organization',
      name: APP_CONFIG.name,
      url: APP_CONFIG.url,
    },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${APP_CONFIG.url}/blog/${post.slug}`,
    },
    keywords: post.keywords.join(', '),
    articleSection: post.categoryLabel,
    wordCount: post.readingTime * 200,
    ...(post.image && {
      image: {
        '@type': 'ImageObject',
        url: post.image,
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
