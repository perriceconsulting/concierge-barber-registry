import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with Concierge Barber Registry. Questions about our platform, support for barbers, or partnership inquiries — we\'re here to help.',
  keywords: ['contact concierge barber registry', 'barber support', 'customer service'],
  openGraph: {
    title: 'Contact Us | Concierge Barber Registry',
    description: 'Get in touch with questions, support, or partnership inquiries.',
    url: '/contact',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
