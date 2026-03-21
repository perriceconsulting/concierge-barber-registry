import { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';
import { createLogger } from '@/lib/logger';
// Blog posts now loaded from database below

const logger = createLogger('SITEMAP');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://conciergebarberregistry.com';

  try {
    // Fetch all approved barbers
    const barbers = await prisma.barberProfile.findMany({
      where: { verificationStatus: 'approved' },
      select: { slug: true, updatedAt: true },
    });

    // Fetch all specialties
    const specialties = await prisma.specialty.findMany({
      select: { slug: true },
    });

    return [
      // Static pages
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
      {
        url: `${baseUrl}/barbers`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/specialties`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      },
      {
        url: `${baseUrl}/search`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      },
      {
        url: `${baseUrl}/about`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.5,
      },
      {
        url: `${baseUrl}/contact`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.5,
      },
      {
        url: `${baseUrl}/faq`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.5,
      },
      {
        url: `${baseUrl}/privacy-policy`,
        lastModified: new Date(),
        changeFrequency: 'yearly',
        priority: 0.3,
      },
      {
        url: `${baseUrl}/terms-of-service`,
        lastModified: new Date(),
        changeFrequency: 'yearly',
        priority: 0.3,
      },

      // Blog listing page
      {
        url: `${baseUrl}/blog`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      },

      // Blog posts (from database)
      ...(await prisma.blogPost.findMany({
        where: { status: 'published' },
        select: { slug: true, updatedAt: true },
      })).map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: post.updatedAt,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      })),

      // Dynamic barber profile pages
      ...barbers.map((barber) => ({
        url: `${baseUrl}/barbers/${barber.slug}`,
        lastModified: barber.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })),

      // Dynamic specialty pages
      ...specialties.map((specialty) => ({
        url: `${baseUrl}/specialties/${specialty.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })),
    ];
  } catch (error) {
    logger.error('Error generating sitemap:', error);
    // Return basic sitemap if database query fails
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
    ];
  }
}
