import { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Blog',
  description:
    'Expert tips, guides, and insights on barbering, grooming, and growing your barber business. Find everything from haircut guides to barber licensing advice.',
  path: '/blog',
  keywords: [
    'barber blog',
    'barbershop tips',
    'grooming guide',
    'mens haircut guide',
    'barber business tips',
    'fade haircut guide',
    'barber licensing',
    'barbershop marketing',
    'mens grooming tips',
    'barber industry news',
  ],
});

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
