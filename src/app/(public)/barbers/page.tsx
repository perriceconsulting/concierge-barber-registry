import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@/components/layout/container';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Breadcrumb } from '@/components/breadcrumb';
import { prisma } from '@/lib/db';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { APP_CONFIG } from '@/config';
import { createLogger } from '@/lib/logger';

const logger = createLogger('BARBERS_DIRECTORY');

export const metadata: Metadata = buildPageMetadata({
  title: 'Browse Barbers',
  description:
    'Discover verified, top-rated barbers in your area. Browse portfolios, read reviews, compare services and pricing. Find your perfect barber on Concierge Barber Registry.',
  path: '/barbers',
  keywords: [
    'browse barbers',
    'find barbers',
    'barber directory',
    'verified barbers',
    'barber near me',
    'barber listings',
  ],
});

interface DirectoryBarber {
  slug: string;
  displayName: string;
  city: string;
  state: string;
  shopName: string | null;
  tagline: string | null;
  averageRating: number;
  totalReviews: number;
  licenseVerified: boolean;
  yearsExperience: number | null;
  specialties: { name: string; slug: string }[];
  image: string | null;
}

async function getDirectory(): Promise<DirectoryBarber[]> {
  try {
    // Canonical "publicly listable" filter — same as /api/barbers and sitemap.ts.
    const rows = await prisma.barberProfile.findMany({
      where: {
        verificationStatus: 'approved',
        isHidden: false,
        vacationMode: false,
        removalRequestedAt: null,
      },
      select: {
        slug: true,
        displayName: true,
        city: true,
        state: true,
        shopName: true,
        tagline: true,
        averageRating: true,
        totalReviews: true,
        licenseVerified: true,
        yearsExperience: true,
        specialties: {
          select: { specialty: { select: { name: true, slug: true } } },
          take: 3,
        },
        portfolioImages: {
          select: { imageUrl: true, thumbnailUrl: true },
          orderBy: { sortOrder: 'asc' },
          take: 1,
        },
      },
      orderBy: [{ isFeatured: 'desc' }, { averageRating: 'desc' }, { totalReviews: 'desc' }],
      take: 100, // flat list for now; pagination deferred until the set outgrows this
    });

    return rows.map((b) => ({
      slug: b.slug,
      displayName: b.displayName,
      city: b.city,
      state: b.state,
      shopName: b.shopName,
      tagline: b.tagline,
      averageRating: Number(b.averageRating), // Prisma Decimal -> number
      totalReviews: b.totalReviews,
      licenseVerified: b.licenseVerified,
      yearsExperience: b.yearsExperience,
      specialties: b.specialties.map((s) => s.specialty),
      image: b.portfolioImages[0]?.thumbnailUrl ?? b.portfolioImages[0]?.imageUrl ?? null,
    }));
  } catch (error) {
    logger.error('Failed to load barber directory:', error);
    return [];
  }
}

export default async function BarbersPage() {
  const barbers = await getDirectory();

  const breadcrumbItems = [
    { name: 'Home', path: '/' },
    { name: 'Barbers', path: '/barbers' },
  ];

  // ItemList JSON-LD so the category page surfaces its profile links to crawlers
  // and AI surfaces. Absolute URLs use APP_CONFIG.domain (never the request host).
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: barbers.map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `https://${APP_CONFIG.domain}/barbers/${b.slug}`,
      name: b.displayName,
    })),
  };

  return (
    <div className="min-h-[calc(100vh-16rem)] py-12">
      <Container>
        {barbers.length > 0 && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
          />
        )}

        <Breadcrumb items={breadcrumbItems} className="mb-6" />

        <div className="mx-auto max-w-2xl text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl mb-4">
            Browse Barbers
          </h1>
          <p className="text-lg text-muted-foreground">
            Discover verified, licensed barbers — browse portfolios, ratings, and
            specialties, then book direct.
          </p>
        </div>

        {barbers.length === 0 ? (
          <div className="mx-auto max-w-xl rounded-lg border bg-card p-12 text-center">
            <p className="text-muted-foreground mb-6">
              No verified barbers are listed yet. Try a search, or — if you&apos;re a
              barber — claim your spot.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/search">
                <Button size="lg">Search barbers</Button>
              </Link>
              <Link href="/for-barbers">
                <Button size="lg" variant="outline">
                  List your shop
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {barbers.map((b) => (
              <Link key={b.slug} href={`/barbers/${b.slug}`} className="group">
                <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  {b.image && (
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                      <Image
                        src={b.image}
                        alt={`${b.displayName} portfolio work`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-xl">{b.displayName}</CardTitle>
                          {b.licenseVerified && (
                            <Badge variant="default" className="text-xs">
                              ✓ Verified
                            </Badge>
                          )}
                        </div>
                        <CardDescription>
                          {b.city}, {b.state}
                          {b.shopName ? ` · ${b.shopName}` : ''}
                        </CardDescription>
                      </div>
                      {b.totalReviews > 0 && (
                        <div className="flex items-center gap-1 shrink-0">
                          <svg
                            className="w-5 h-5 text-yellow-400 fill-current"
                            viewBox="0 0 20 20"
                            aria-hidden="true"
                          >
                            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                          </svg>
                          <span className="font-semibold">{b.averageRating.toFixed(1)}</span>
                          <span className="text-sm text-muted-foreground">({b.totalReviews})</span>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {b.tagline && (
                      <p className="text-sm text-muted-foreground mb-3 italic line-clamp-2">
                        {b.tagline}
                      </p>
                    )}
                    {b.specialties.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {b.specialties.map((s) => (
                          <Badge key={s.slug} variant="secondary">
                            {s.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {b.yearsExperience ? (
                      <p className="text-xs text-muted-foreground mt-3">
                        {b.yearsExperience}+ years experience
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
