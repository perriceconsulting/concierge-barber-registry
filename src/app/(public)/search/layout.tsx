import { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Find Barbers Near You',
  description:
    'Search for verified barbers by location, specialty, rating, and availability. Compare prices, view portfolios, and read reviews to find your perfect barber.',
  path: '/search',
  keywords: [
    'find barbers',
    'barber near me',
    'search barbers',
    'barber directory',
    'local barbers',
    'best barber near me',
  ],
});

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
