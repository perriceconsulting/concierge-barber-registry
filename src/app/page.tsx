import { Metadata } from 'next';
import { APP_CONFIG } from '@/config';
import HomeContent from './_home-content';
import { OrganizationSchema } from '@/components/seo/organization-schema';
import { FeaturedArticles } from '@/components/blog/featured-articles';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: `${APP_CONFIG.name} — License-Verified Barber Directory`,
  description:
    'License-verified barber directory. Barbers: free profile, zero booking fees. Clients: browse portfolios, read reviews, book trusted pros.',
  path: '/',
  keywords: [
    'barber directory',
    'verified barbers',
    'barber platform',
    'independent barber',
    'join barber directory',
    'barber near me',
    'find barbers',
    'licensed barber',
    'barber reviews',
    'mobile barber',
  ],
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
