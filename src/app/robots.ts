import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://conciergebarberregistry.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
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
        ],
        disallow: [
          '/dashboard/*',
          '/admin/*',
          '/api/*',
          '/login',
          '/register',
          '/forgot-password',
        ],
      },
      {
        userAgent: 'GPTBot',
        disallow: ['/'],
      },
      {
        userAgent: 'ChatGPT-User',
        disallow: ['/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
