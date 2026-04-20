import { Metadata } from 'next';
import { APP_CONFIG } from '@/config';
import HomeContent from './_home-content';
import { OrganizationSchema } from '@/components/seo/organization-schema';
import { FeaturedArticles } from '@/components/blog/featured-articles';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: `${APP_CONFIG.name} — License-Verified Barber Directory`,
  description:
    'Join the only license-verified barber directory built for independent pros. Keep 100% of your earnings with zero booking fees. Find top-rated local pros.',
  path: '/',
  keywords: [
    'barber directory',
    'license-verified barber',
    'independent barber',
    'join barber directory',
    'no chair rent',
    'barber platform',
    'verified barbers',
    'barber near me',
    'find barbers',
    'licensed barber',
    'mobile barber',
    'fade specialist',
  ],
  ogTitle: 'Own Your Chair. Join the Concierge Barber Registry.',
  ogDescription:
    'A professional directory built for independent, license-verified barbers. No shop drama, no middleman fees, just premium clients.',
});

export default function HomePage() {
  return (
    <>
      <OrganizationSchema />
      <HomeContent />
      <FeaturedArticles />
    </>
  );
}
