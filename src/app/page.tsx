import { Metadata } from 'next';
import { APP_CONFIG } from '@/config';
import HomeContent from './_home-content';
import { OrganizationSchema } from '@/components/seo/organization-schema';

export const metadata: Metadata = {
  title: `Find Your Perfect Barber | ${APP_CONFIG.name}`,
  description: 'Discover and connect with verified, top-rated barbers in your area. Browse portfolios, read reviews, compare services, and book appointments with trusted barbers near you.',
  keywords: ['barber near me', 'find barbers', 'best barber', 'barbershop', 'fade', 'beard trim', 'barber reviews', 'barber directory', 'book barber', 'grooming'],
  openGraph: {
    title: `Find Your Perfect Barber | ${APP_CONFIG.name}`,
    description: 'Discover and connect with verified, top-rated barbers in your area.',
    url: '/',
    type: 'website',
  },
};

export default function HomePage() {
  return (
    <>
      <OrganizationSchema />
      <HomeContent />
    </>
  );
}
