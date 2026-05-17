import { BlogPost } from '@/content/blog/types';
import { APP_CONFIG } from '@/config';
import { JsonLd } from './json-ld';

interface ArticleStructuredDataProps {
  post: BlogPost;
  /** Raw HTML content. If passed, a stripped-text version is added as
   *  schema.org `articleBody` — a known ranking signal for Article rich
   *  results that we'd otherwise leave on the table. */
  content?: string;
  /** Optional image dimensions; required for max image-carousel eligibility. */
  imageWidth?: number;
  imageHeight?: number;
}

function htmlToPlainText(html: string, maxChars = 5000): string {
  // Strip tags + collapse whitespace. We're not parsing, just feeding NLP a
  // clean string. Cap at 5k chars so the JSON-LD payload stays sane.
  const text = html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > maxChars ? text.slice(0, maxChars).trimEnd() + '…' : text;
}

export function ArticleStructuredData({
  post,
  content,
  imageWidth,
  imageHeight,
}: ArticleStructuredDataProps) {
  const pageUrl = `${APP_CONFIG.url}/blog/${post.slug}`;

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    inLanguage: 'en-US',
    // Person author preferred for E-E-A-T — falls back to the brand when an
    // author isn't named on the post.
    author: post.author
      ? {
          '@type': 'Person',
          name: post.author,
          worksFor: {
            '@type': 'Organization',
            name: APP_CONFIG.name,
            url: APP_CONFIG.url,
          },
        }
      : {
          '@type': 'Organization',
          name: APP_CONFIG.name,
          url: APP_CONFIG.url,
        },
    publisher: {
      '@type': 'Organization',
      name: APP_CONFIG.name,
      url: APP_CONFIG.url,
      logo: {
        '@type': 'ImageObject',
        url: `${APP_CONFIG.url}/icon.png`,
      },
    },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': pageUrl,
      url: pageUrl,
    },
    url: pageUrl,
    keywords: post.keywords.join(', '),
    articleSection: post.categoryLabel,
    wordCount: post.readingTime * 200,
  };

  if (content) {
    jsonLd.articleBody = htmlToPlainText(content);
  }

  if (post.image) {
    jsonLd.image = {
      '@type': 'ImageObject',
      url: post.image,
      ...(post.imageAlt && { caption: post.imageAlt }),
      ...(imageWidth && imageHeight && { width: imageWidth, height: imageHeight }),
    };
  }

  return <JsonLd data={jsonLd} />;
}
