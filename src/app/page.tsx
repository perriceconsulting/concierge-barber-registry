import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { APP_CONFIG } from '@/config';
import HomeContent from './_home-content';
import { OrganizationSchema } from '@/components/seo/organization-schema';
import { FeaturedArticles } from '@/components/blog/featured-articles';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { verifyAccessToken } from '@/lib/auth/jwt';

export const metadata: Metadata = buildPageMetadata({
  title: `${APP_CONFIG.name} — License-Verified Barber Directory`,
  description:
    'Join the only license-verified barber directory built for independent pros. Keep 100% of your earnings with zero booking fees. Find top-rated local pros.',
  path: '/',
  keywords: [
    'barber directory',
    'license-verified barber',
    'independent barber',
    'join barber directory',
    'no chair rent',
    'barber platform',
    'verified barbers',
    'barber near me',
    'find barbers',
    'licensed barber',
    'mobile barber',
    'fade specialist',
  ],
  ogTitle: 'Own Your Chair. Join the Concierge Barber Registry.',
  ogDescription:
    'A professional directory built for independent, license-verified barbers. No shop drama, no middleman fees, just premium clients.',
});

/**
 * Read the access token from cookies and return the user's role server-side.
 * Returns null for guests or invalid/expired tokens (HomeContent then renders
 * the default barber-first pitch).
 */
async function getViewerRole(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return null;
    const payload = await verifyAccessToken(token);
    return (payload.role as string) ?? null;
  } catch {
    // Expired or invalid token → treat as guest. The middleware handles refresh
    // for protected routes; this is a public page so we don't bother.
    return null;
  }
}

export default async function HomePage() {
  const viewerRole = await getViewerRole();
  return (
    <>
      <OrganizationSchema />
      <HomeContent viewerRole={viewerRole} />
      <FeaturedArticles />
    </>
  );
}
