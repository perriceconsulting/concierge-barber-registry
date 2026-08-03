import { APP_CONFIG } from '@/config';
import { JsonLd } from './json-ld';

interface ListedPost {
  slug: string;
  title: string;
  description: string;
  publishedAt: string | null;
}

interface BlogListStructuredDataProps {
  posts: ListedPost[];
  /** Optional category label so AI engines understand the topical scope of
   *  the filtered listing (e.g. "For Barbers"). */
  sectionLabel?: string;
}

/**
 * JSON-LD for the blog index page. Combines:
 *   - `Blog` (the publication itself)
 *   - `blogPost` (each entry as a BlogPosting reference)
 *
 * Listed posts use minimal refs (url + headline + description) — the full
 * BlogPosting payload lives on each detail page. This avoids duplicate
 * markup while still giving SGE/Perplexity a navigable feed structure.
 */
export function BlogListStructuredData({ posts, sectionLabel }: BlogListStructuredDataProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: sectionLabel
      ? `${APP_CONFIG.name} Blog — ${sectionLabel}`
      : `${APP_CONFIG.name} Blog`,
    url: `${APP_CONFIG.url}/blog`,
    inLanguage: 'en-US',
    publisher: {
      '@type': 'Organization',
      name: APP_CONFIG.name,
      url: APP_CONFIG.url,
    },
    blogPost: posts.map((p) => ({
      '@type': 'BlogPosting',
      url: `${APP_CONFIG.url}/blog/${p.slug}`,
      headline: p.title,
      description: p.description,
      ...(p.publishedAt && { datePublished: p.publishedAt }),
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${APP_CONFIG.url}/blog/${p.slug}`,
      },
    })),
  };

  return <JsonLd data={jsonLd} />;
}
