import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/layout/container';
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

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Create Your Profile',
    body: 'Sign up free in under 5 minutes. Add your services, pricing, specialties, and a portfolio of your best work.',
  },
  {
    step: '2',
    title: 'Get Verified',
    body: "Upload your license. Our team reviews and approves within 24\u201348 hours so clients know you're the real deal.",
  },
  {
    step: '3',
    title: 'Get Booked',
    body: 'Clients find you by location, specialty, and reviews. They contact you directly — no middleman, no booking fees.',
  },
];

const WHY_BARBERS_CHOOSE = [
  {
    title: 'License-Verified Badge',
    body: 'Clients trust credentialed pros. The verified badge on your profile is the trust signal you can\u2019t get from Instagram.',
  },
  {
    title: 'Zero Booking Fees, Ever',
    body: 'Clients contact you directly. We never process payments or take a cut. You own the client relationship.',
  },
  {
    title: 'Built for Independent Pros',
    body: "No chair rent, no shop drama, no Instagram algorithm. Just a searchable profile that brings clients to you.",
  },
];

export default function HomeContent() {
  return (
    <div className="flex flex-col">
      {/* HERO (barber-first) */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-accent/5 py-24 md:py-40">
        <Container>
          <div className="mx-auto max-w-4xl text-center">
            <span className="inline-block px-3 py-1 mb-6 text-xs font-semibold rounded-full bg-secondary/10 text-secondary uppercase tracking-wide">
              For Barbers &amp; Stylists
            </span>
            <h1 className="text-5xl font-extrabold tracking-tight text-foreground sm:text-7xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Keep 100% of Your Cut. 0% of the Shop Drama.
            </h1>
            <p className="mt-8 text-xl leading-relaxed text-muted-foreground max-w-2xl mx-auto">
              Join a license-verified barber directory built for independent pros. No
              chair rent. No booking fees. No middleman. Just premium clients and the
              profile you deserve.
            </p>
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={ROUTES.FOR_BARBERS}>
                <Button size="lg" className="w-full sm:w-auto">
                  Claim Your Professional Profile
                </Button>
              </Link>
              <Link href={ROUTES.FOR_BARBERS}>
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  See How It Works
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              Looking for a barber instead?{' '}
              <Link
                href={ROUTES.FOR_CLIENTS}
                className="underline underline-offset-2 font-medium text-primary hover:text-secondary transition-colors"
              >
                Find verified pros near you →
              </Link>
            </p>
          </div>
        </Container>
      </section>

      {/* STATS BAR */}
      <section className="py-12 border-y bg-background" aria-label="Key benefits">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
            <div>
              <div className="text-3xl font-bold text-primary">License-Verified</div>
              <p className="mt-2 text-sm text-muted-foreground">
                Every barber is credentialed before approval
              </p>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">Zero Booking Fees</div>
              <p className="mt-2 text-sm text-muted-foreground">
                Clients contact you directly — we never take a cut
              </p>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">Free to Start</div>
              <p className="mt-2 text-sm text-muted-foreground">
                Starter tier is free forever, no credit card required
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* WHY BARBERS CHOOSE */}
      <section className="py-20" aria-labelledby="why-barbers-heading">
        <Container>
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2
              id="why-barbers-heading"
              className="text-3xl font-bold tracking-tight text-primary sm:text-4xl"
            >
              Why Independent Barbers Choose the Registry
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Built for pros who want control over their business and their brand
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
            {WHY_BARBERS_CHOOSE.map((item) => (
              <div key={item.title} className="text-center">
                <h3 className="text-xl font-semibold text-primary">{item.title}</h3>
                <p className="mt-3 text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href={ROUTES.FOR_BARBERS}>
              <Button variant="outline">See full comparison vs the old way →</Button>
            </Link>
          </div>
        </Container>
      </section>

      {/* HOW IT WORKS (for barbers) */}
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
              Three steps from signup to your first client
            </p>
          </div>

          <ol className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
            {HOW_IT_WORKS.map((step) => (
              <li key={step.step} className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                  {step.step}
                </div>
                <h3 className="mt-6 text-xl font-semibold">{step.title}</h3>
                <p className="mt-2 text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>

          <div className="mx-auto mt-12 max-w-3xl text-center text-muted-foreground">
            <p>
              Every barber is license-verified before approval. Clients discover you by
              location, specialty, and reviews — not by who paid for the top ad slot.
              Whether you&apos;re a fade specialist, a beard sculptor, a hot-towel shave
              pro, or a scissor-cut master, the registry is built to surface your craft.
            </p>
          </div>
        </Container>
      </section>

      {/* EXPLORE BY SPECIALTY (dual-audience) */}
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
              Every craft has its own page. Specialists rank for their expertise.
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

      {/* FINAL CTA (barber) */}
      <section
        className="bg-primary py-20 text-primary-foreground"
        aria-labelledby="final-cta-heading"
      >
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 id="final-cta-heading" className="text-3xl font-bold sm:text-4xl">
              Ready to Own Your Chair?
            </h2>
            <p className="mt-4 text-lg opacity-90">
              Join the directory built for independent, license-verified professionals.
              Free to register, 14-day trial on paid plans.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href={ROUTES.FOR_BARBERS}>
                <Button size="lg" variant="secondary">
                  Claim Your Professional Profile
                </Button>
              </Link>
              <Link
                href={ROUTES.FOR_CLIENTS}
                className="text-sm underline underline-offset-4 opacity-80 hover:opacity-100"
              >
                I&apos;m a client — take me to search →
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
