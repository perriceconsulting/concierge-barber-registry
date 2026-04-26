import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://conciergebarberregistry.com';

  const publicAllow = [
    '/',
    '/barbers',
    '/barbers/*',
    '/specialties',
    '/specialties/*',
    '/search',
    '/about',
    '/contact',
    '/faq',
    '/blog',
    '/blog/*',
    '/for-barbers',
    '/for-clients',
  ];

  const publicDisallow = [
    '/dashboard/*',
    '/admin/*',
    '/api/*',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
  ];

  return {
    rules: [
      // Default policy for all crawlers
      {
        userAgent: '*',
        allow: publicAllow,
        disallow: publicDisallow,
      },

      // AI training crawlers — explicitly disallowed
      { userAgent: 'GPTBot', disallow: ['/'] },
      { userAgent: 'ChatGPT-User', disallow: ['/'] },

      // AI citation / retrieval crawlers — explicitly allowed (no training, but they may
      // cite us in answers on Perplexity, Claude search, Google AI Overviews, etc.)
      {
        userAgent: 'PerplexityBot',
        allow: publicAllow,
        disallow: publicDisallow,
      },
      {
        userAgent: 'ClaudeBot',
        allow: publicAllow,
        disallow: publicDisallow,
      },
      {
        userAgent: 'anthropic-ai',
        allow: publicAllow,
        disallow: publicDisallow,
      },
      {
        userAgent: 'Google-Extended',
        allow: publicAllow,
        disallow: publicDisallow,
      },
      {
        userAgent: 'CCBot',
        allow: publicAllow,
        disallow: publicDisallow,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
