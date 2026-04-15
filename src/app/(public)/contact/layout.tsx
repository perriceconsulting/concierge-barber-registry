import { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Contact Us',
  description:
    "Get in touch with Concierge Barber Registry. Questions about our platform, support for barbers, or partnership inquiries — we're here to help.",
  path: '/contact',
  keywords: ['contact concierge barber registry', 'barber support', 'customer service'],
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
