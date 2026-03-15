import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Frequently asked questions about Concierge Barber Registry. Learn how to find barbers, register as a barber, manage your profile, and more.',
  keywords: ['barber registry FAQ', 'how to find barbers', 'barber registration help', 'barber questions'],
  openGraph: {
    title: 'FAQ | Concierge Barber Registry',
    description: 'Frequently asked questions about finding and registering as a barber.',
    url: '/faq',
  },
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children;
}
