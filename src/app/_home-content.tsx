'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Container } from '@/components/layout/container';
import { ROUTES, SPECIALTIES } from '@/config';
import { createLogger } from '@/lib/logger';
import { slugify } from '@/lib/slug';

const FEATURED_SPECIALTIES = [
  'Fades',
  'Beard Trim',
  'Hot Towel Shave',
  'Lineups',
  'Scissor Cut',
  'Kids Cuts',
] as const satisfies ReadonlyArray<(typeof SPECIALTIES)[number]>;

const logger = createLogger('HOME');

interface FeaturedBarber {
  id: string;
  slug: string;
  displayName: string;
  city: string;
  state: string;
  tagline: string | null;
  averageRating: number;
  yearsExperience: number | null;
  specialties: Array<{ specialty: { id: number; name: string } }>;
}

export default function HomeContent() {
  const [featuredBarbers, setFeaturedBarbers] = useState<FeaturedBarber[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedBarbers();
  }, []);

  const fetchFeaturedBarbers = async () => {
    try {
      const response = await fetch('/api/barbers?limit=6&sort=rating');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFeaturedBarbers(data.data.barbers || []);
        }
      }
    } catch (error) {
      logger.error('Failed to fetch featured barbers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-accent/5 py-24 md:py-40">
        <Container>
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-5xl font-extrabold tracking-tight text-foreground sm:text-7xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Find Your Perfect Barber
            </h1>
            <p className="mt-8 text-xl leading-relaxed text-muted-foreground max-w-2xl mx-auto">
              Discover and connect with verified, top-rated barbers in your area.
              Browse portfolios, read reviews, and find your perfect cut.
            </p>
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={ROUTES.SEARCH}>
                <Button size="lg" className="w-full sm:w-auto">Find Barbers</Button>
              </Link>
              <Link href={ROUTES.FOR_BARBERS}>
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Register as Barber
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
              Why Choose Concierge Barber Registry
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              The premier platform connecting clients with professional barbers
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
            {/* Feature 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <svg
                  className="h-8 w-8 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="mt-6 text-xl font-semibold">Verified Professionals</h3>
              <p className="mt-2 text-muted-foreground">
                All barbers are verified and licensed professionals with proven expertise
              </p>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10">
                <svg
                  className="h-8 w-8 text-secondary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              </div>
              <h3 className="mt-6 text-xl font-semibold">Authentic Reviews</h3>
              <p className="mt-2 text-muted-foreground">
                Read genuine reviews from real clients to make informed decisions
              </p>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
                <svg
                  className="h-8 w-8 text-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h3 className="mt-6 text-xl font-semibold">Easy Discovery</h3>
              <p className="mt-2 text-muted-foreground">
                Search by location, specialty, and reviews to find the perfect match
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-muted/30" aria-labelledby="how-it-works-heading">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2
              id="how-it-works-heading"
              className="text-3xl font-bold tracking-tight text-primary sm:text-4xl"
            >
              How It Works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Three simple steps to your next great haircut
            </p>
          </div>

          <ol className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
            <li className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                1
              </div>
              <h3 className="mt-6 text-xl font-semibold">Search</h3>
              <p className="mt-2 text-muted-foreground">
                Filter by city, specialty, rating, or availability to find verified barbers
                who match what you&apos;re looking for.
              </p>
            </li>
            <li className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                2
              </div>
              <h3 className="mt-6 text-xl font-semibold">Compare</h3>
              <p className="mt-2 text-muted-foreground">
                Browse portfolios, review services and pricing, and read authentic reviews
                from past clients before you commit.
              </p>
            </li>
            <li className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                3
              </div>
              <h3 className="mt-6 text-xl font-semibold">Book</h3>
              <p className="mt-2 text-muted-foreground">
                Contact the barber directly through their profile with your preferred time —
                no middleman, no booking fees.
              </p>
            </li>
          </ol>

          <div className="mx-auto mt-12 max-w-3xl text-center text-muted-foreground">
            <p>
              Every barber listed on Concierge Barber Registry is license-verified before
              approval. Reviews come from real client interactions, and portfolio images
              are curated by the barber to represent their current work. Whether you&apos;re
              looking for a precise fade, a beard sculpt, a hot towel shave, or a scissor
              cut, you&apos;ll find specialists in your area who take their craft seriously.
            </p>
          </div>
        </Container>
      </section>

      {/* Featured Barbers OR Explore Specialties — swap based on availability */}
      {isLoading ? (
        <section className="py-20">
          <Container>
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </Container>
        </section>
      ) : featuredBarbers.length > 0 ? (
        <section className="py-20">
          <Container>
            <div className="mx-auto max-w-2xl text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                Top-Rated Barbers
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Discover our featured professional barbers
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredBarbers.map((barber) => (
                <Link key={barber.id} href={`/barbers/${barber.slug}`}>
                  <Card className="card-hover h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl">{barber.displayName}</CardTitle>
                          <CardDescription>
                            {barber.city}, {barber.state}
                          </CardDescription>
                        </div>
                        {barber.averageRating > 0 && (
                          <div className="flex items-center gap-1">
                            <svg className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                            </svg>
                            <span className="font-semibold">{Number(barber.averageRating).toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {barber.tagline && (
                        <p className="text-sm text-muted-foreground mb-3 italic">{barber.tagline}</p>
                      )}
                      <div className="flex gap-2 flex-wrap">
                        {barber.specialties?.slice(0, 3).map((item) => (
                          <Badge key={item.specialty.id} variant="secondary">
                            {item.specialty.name}
                          </Badge>
                        ))}
                      </div>
                      {barber.yearsExperience && (
                        <p className="text-xs text-muted-foreground mt-3">
                          {barber.yearsExperience}+ years experience
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            <div className="text-center mt-12">
              <Link href={ROUTES.SEARCH}>
                <Button size="lg">View All Barbers</Button>
              </Link>
            </div>
          </Container>
        </section>
      ) : (
        <section className="py-20" aria-labelledby="explore-specialties-heading">
          <Container>
            <div className="mx-auto max-w-2xl text-center mb-12">
              <h2
                id="explore-specialties-heading"
                className="text-3xl font-bold tracking-tight text-primary sm:text-4xl"
              >
                Explore by Specialty
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Find barbers who specialize in the exact style you want
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {FEATURED_SPECIALTIES.map((specialty) => (
                <Link
                  key={specialty}
                  href={`${ROUTES.SPECIALTIES}/${slugify(specialty)}`}
                  className="group block rounded-lg border bg-background p-6 text-center hover:border-primary hover:shadow-md transition-all"
                >
                  <span className="text-lg font-semibold text-primary group-hover:text-secondary transition-colors">
                    {specialty}
                  </span>
                </Link>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link href={ROUTES.SPECIALTIES}>
                <Button size="lg" variant="outline">
                  View All Specialties
                </Button>
              </Link>
            </div>
          </Container>
        </section>
      )}

      {/* CTA Section */}
      <section className="bg-primary py-16 text-primary-foreground">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold">Are You a Barber?</h2>
            <p className="mt-4 text-lg opacity-90">
              Join our community and showcase your skills to potential clients.
              Registration is free and takes just a few minutes.
            </p>
            <div className="mt-8">
              <Link href={ROUTES.FOR_BARBERS}>
                <Button size="lg" variant="secondary">
                  Create Your Profile
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
