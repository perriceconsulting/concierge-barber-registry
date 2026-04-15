import { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { FAQStructuredData } from '@/components/seo/faq-structured-data';

export const metadata: Metadata = buildPageMetadata({
  title: 'FAQ',
  description:
    'Frequently asked questions about Concierge Barber Registry. Learn how to find barbers, register as a barber, manage your profile, and more.',
  path: '/faq',
  keywords: [
    'barber registry FAQ',
    'how to find barbers',
    'barber registration help',
    'barber questions',
  ],
});

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <FAQStructuredData />
      {children}
    </>
  );
}
