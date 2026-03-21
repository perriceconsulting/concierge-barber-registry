import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Expert tips, guides, and insights on barbering, grooming, and growing your barber business. Find everything from haircut guides to barber licensing advice.',
  keywords: [
    'barber blog', 'barbershop tips', 'grooming guide', 'mens haircut guide',
    'barber business tips', 'fade haircut guide', 'barber licensing',
    'barbershop marketing', 'mens grooming tips', 'barber industry news',
  ],
  openGraph: {
    title: 'Blog | Concierge Barber Registry',
    description: 'Expert tips, guides, and insights on barbering, grooming, and growing your barber business.',
    url: '/blog',
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
