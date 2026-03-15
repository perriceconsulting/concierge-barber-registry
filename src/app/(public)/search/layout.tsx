import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Find Barbers Near You',
  description: 'Search for verified barbers by location, specialty, rating, and availability. Compare prices, view portfolios, and read reviews to find your perfect barber.',
  keywords: ['find barbers', 'barber near me', 'search barbers', 'barber directory', 'local barbers', 'best barber near me'],
  openGraph: {
    title: 'Find Barbers Near You | Concierge Barber Registry',
    description: 'Search for verified barbers by location, specialty, and rating.',
    url: '/search',
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
