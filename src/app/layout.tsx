import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ToastProvider } from "@/components/ui/toast";
import { APP_CONFIG, COLORS } from "@/config";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(APP_CONFIG.url),
  title: {
    default: 'Concierge Barber Registry - Find Top Rated Barbers Near You',
    template: `%s | ${APP_CONFIG.name}`,
  },
  description: 'Discover verified professional barbers near you. View portfolios, read reviews, and book appointments with trusted barbers in your area.',
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
    other: {
      'msvalidate.01': '650C99A71550A4653BDD25E10CD46C2D',
    },
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
  // Icons are auto-detected from app/favicon.ico + app/apple-icon.png.
  alternates: {
    canonical: '/',
  },
};

export const viewport: Viewport = {
  themeColor: COLORS.primary,
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
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
