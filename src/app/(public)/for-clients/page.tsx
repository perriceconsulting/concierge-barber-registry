import { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/layout/container';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { ROUTES, SPECIALTIES } from '@/config';
import { slugify } from '@/lib/slug';

const FEATURED_SPECIALTIES = [
  'Fades',
  'Beard Trim',
  'Hot Towel Shave',
  'Lineups',
  'Scissor Cut',
  'Kids Cuts',
] as const satisfies ReadonlyArray<(typeof SPECIALTIES)[number]>;

export const metadata: Metadata = buildPageMetadata({
  title: 'Find Your Perfect Barber',
  description:
    'Discover verified, top-rated barbers in your area. Browse portfolios, read real client reviews, compare services and pricing, and book with barbers you can trust.',
  path: '/for-clients',
  keywords: [
    'find barber near me',
    'best barber near me',
    'barber directory',
    'verified barbers',
    'book a barber',
    'barber reviews',
    'local barber',
    'mens haircut near me',
  ],
});

const WHY_CHOOSE = [
  {
    title: 'Verified Professionals',
    body: 'Every barber on the platform is license-verified and credentialed before approval — no guessing about trust.',
  },
  {
    title: 'Authentic Reviews',
    body: 'Read genuine reviews from real clients. No paid placements, no fake ratings — just real feedback from real cuts.',
  },
  {
    title: 'Easy Discovery',
    body: 'Search by location, specialty, and rating. Find a barber who specializes in exactly the look you want.',
  },
];

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Search',
    body: 'Filter by city, specialty, rating, or availability to find verified barbers near you.',
  },
  {
    step: '2',
    title: 'Compare',
    body: 'Browse portfolios, review services and pricing, and read authentic reviews before you commit.',
  },
  {
    step: '3',
    title: 'Book',
    body: 'Contact the barber directly through their profile with your preferred time — no middleman, no booking fees.',
  },
];

export default function ForClientsPage() {
  return (
    <>
      {/* HERO */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-accent/5 py-24 md:py-32">
        <Container>
          <div className="mx-auto max-w-4xl text-center">
            <span className="inline-block px-3 py-1 mb-6 text-xs font-semibold rounded-full bg-secondary/10 text-secondary uppercase tracking-wide">
              For Clients
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Find Your Perfect Barber
            </h1>
            <p className="mt-8 text-xl leading-relaxed text-muted-foreground max-w-2xl mx-auto">
              Discover and connect with verified, top-rated barbers in your area. Browse
              portfolios, read real reviews, and find your perfect cut.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={ROUTES.SEARCH}>
                <Button size="lg" className="w-full sm:w-auto">
                  Find Barbers
                </Button>
              </Link>
              <Link href={ROUTES.SPECIALTIES}>
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Browse by Specialty
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* WHY CHOOSE */}
      <section className="py-20" aria-labelledby="why-choose-heading">
        <Container>
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2
              id="why-choose-heading"
              className="text-3xl font-bold tracking-tight text-primary sm:text-4xl"
            >
              Why Choose Concierge Barber Registry
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              The premier platform connecting clients with professional barbers
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
            {WHY_CHOOSE.map((item) => (
              <div key={item.title} className="text-center">
                <h3 className="text-xl font-semibold text-primary">{item.title}</h3>
                <p className="mt-3 text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 bg-muted/30" aria-labelledby="how-it-works-heading">
        <Container>
          <div className="mx-auto max-w-2xl text-center mb-12">
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

          <ol className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
            {HOW_IT_WORKS.map((step) => (
              <li key={step.step} className="flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xl">
                  {step.step}
                </div>
                <h3 className="mt-6 text-xl font-semibold">{step.title}</h3>
                <p className="mt-2 text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* EXPLORE SPECIALTIES */}
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

      {/* TRUST SIGNAL */}
      <section className="py-20 bg-primary/5">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
              Every Barber is License-Verified
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              We verify professional credentials before approving any barber to appear
              in the directory. When you book through Concierge Barber Registry, you
              know you&apos;re getting a credentialed pro — not a kitchen cutter.
            </p>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto text-left">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-primary mb-2">License-Verified</h3>
                  <p className="text-sm text-muted-foreground">
                    Every profile is credentialed before approval
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-primary mb-2">Zero Booking Fees</h3>
                  <p className="text-sm text-muted-foreground">
                    Contact barbers directly — you&apos;re not charged to book
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-primary mb-2">Authentic Reviews</h3>
                  <p className="text-sm text-muted-foreground">
                    Real feedback from real client interactions, no paid placements
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </Container>
      </section>

      {/* FINAL CTA */}
      <section className="bg-primary py-16 text-primary-foreground">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Ready for a Great Cut?</h2>
            <p className="mt-4 text-lg opacity-90">
              Browse verified barbers in your area. Book directly. No booking fees.
            </p>
            <div className="mt-8">
              <Link href={ROUTES.SEARCH}>
                <Button size="lg" variant="secondary">
                  Find Barbers Near You
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
