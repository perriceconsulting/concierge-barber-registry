import { Metadata } from 'next';
import { APP_CONFIG } from '@/config';
import HomeContent from './_home-content';
import { OrganizationSchema } from '@/components/seo/organization-schema';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: `Find Your Perfect Barber | ${APP_CONFIG.name}`,
  description:
    'Find verified barbers near you. Browse portfolios, read real client reviews, and book trusted pros on Concierge Barber Registry.',
  path: '/',
  keywords: [
    'barber near me',
    'find barbers',
    'best barber',
    'barbershop',
    'fade',
    'beard trim',
    'barber reviews',
    'barber directory',
    'book barber',
    'grooming',
  ],
});

export default function HomePage() {
  return (
    <>
      <OrganizationSchema />
      <HomeContent />
    </>
  );
}
