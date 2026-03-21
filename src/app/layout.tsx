import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ToastProvider } from "@/components/ui/toast";
import { APP_CONFIG } from "@/config";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(APP_CONFIG.url),
  title: {
    default: 'Concierge Barber Registry - Find Top Rated Barbers Near You',
    template: `%s | ${APP_CONFIG.name}`,
  },
  description: 'Discover verified, professional barbers in your area. View portfolios, read reviews, compare services and pricing. Book appointments with trusted barbers near you.',
  keywords: [
    'barber near me',
    'best barber',
    'barbershop',
    'haircut',
    'mens haircut',
    'fade',
    'beard trim',
    'grooming',
    'mens grooming',
    'barber directory',
    'find barber',
    'barber reviews',
    'professional barber',
    'licensed barber',
  ],
  verification: {
    google: 'Gm1CnwKCcs2ZjZKmPSMTYB7pn-65Rz61vFJhLU4ZstE',
  },
  authors: [{ name: APP_CONFIG.name }],
  creator: APP_CONFIG.name,
  publisher: APP_CONFIG.name,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: APP_CONFIG.url,
    siteName: APP_CONFIG.name,
    title: 'Find Top Rated Barbers Near You | Concierge Barber Registry',
    description: 'Connect with verified professional barbers. View portfolios, read authentic reviews, and book appointments with the best barbers in your area.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Concierge Barber Registry',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@ConciergeBarber',
    creator: '@ConciergeBarber',
    title: 'Concierge Barber Registry - Find Top Rated Barbers',
    description: 'Discover verified professional barbers. View portfolios, read reviews, and book appointments.',
    images: ['/twitter-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ToastProvider>
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
