import { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/layout/container';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { SUBSCRIPTION } from '@/config';

export const metadata: Metadata = buildPageMetadata({
  title: 'For Barbers — Keep 100% of Your Cut',
  description:
    'Join a license-verified barber directory. No chair rent, no booking fees, no middleman. Build your business, own your clients, and stand out with a verified professional profile.',
  path: '/for-barbers',
  keywords: [
    'barber directory',
    'join barber platform',
    'mobile barber',
    'concierge barber',
    'barber registration',
    'barber marketing platform',
    'verified barber',
    'independent barber',
  ],
});

const REGISTER_HREF = '/register?role=barber';

const COMPARISON_ROWS = [
  {
    label: 'Weekly Overhead',
    oldWay: '$200–$500 chair rent',
    registry: 'Free to register',
  },
  {
    label: 'Client Trust Signal',
    oldWay: '"DM for prices"',
    registry: 'License-verified badge',
  },
  {
    label: 'Discovery',
    oldWay: 'Buried in the Instagram feed',
    registry: 'Searchable by ZIP + specialty',
  },
  {
    label: 'Client Ownership',
    oldWay: 'Shop keeps the relationship',
    registry: 'You own every client',
  },
  {
    label: 'Booking Fees',
    oldWay: 'Platforms take 5–30%',
    registry: 'Zero booking fees',
  },
  {
    label: 'Portfolio',
    oldWay: 'Scattered across social',
    registry: 'Curated gallery on your profile',
  },
];

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Create Your Profile',
    body: 'Sign up free in under 5 minutes. Add your services, pricing, specialties, and a portfolio of your best work.',
  },
  {
    step: '2',
    title: 'Get Verified',
    body: "Upload your license. Our team reviews and approves within 24–48 hours so clients know you're the real deal.",
  },
  {
    step: '3',
    title: 'Get Booked',
    body: 'Clients find you by location, specialty, and reviews. They contact you directly — no middleman, no booking fees.',
  },
];

const FAQS = [
  {
    q: 'How much does it cost to join?',
    a: 'Registration is free and our Starter tier is free forever. Professional is $29/mo and Elite is $59/mo — both come with a 14-day free trial.',
  },
  {
    q: 'Do you take a cut of my bookings?',
    a: "No. We don't process payments or take commission on bookings. Clients contact you directly and you keep 100% of every cut.",
  },
  {
    q: 'What does "license-verified" mean?',
    a: "Every barber on the registry uploads their professional license during onboarding. We verify it's active and valid before approving the profile. This signals to clients that you're the real deal.",
  },
  {
    q: 'Can I offer mobile services?',
    a: 'Yes. You can mark your profile as accepting walk-ins, by appointment, or offering mobile service with a service radius. Perfect for independent and concierge-style barbers.',
  },
  {
    q: 'How do clients contact me?',
    a: "Every profile has a contact form. Clients fill it out with their preferred date, time, and service — you see the request in your dashboard and respond directly. No intermediary, no platform fees.",
  },
  {
    q: 'What if I already have a website or Instagram?',
    a: "Link them from your profile. The registry complements your existing presence with a verified badge, searchable listing, and centralized reviews — things social media can't give you.",
  },
];

const PROFESSIONAL_PRICE = SUBSCRIPTION.PRICES.PROFESSIONAL_MONTHLY_CENTS / 100;
const ELITE_PRICE = SUBSCRIPTION.PRICES.ELITE_MONTHLY_CENTS / 100;

const PRICING_TIERS = [
  {
    name: 'Starter',
    price: 'Free',
    cadence: 'forever',
    features: [
      'Verified professional profile',
      'Up to 5 portfolio images',
      'Basic service listings',
      'Client contact requests',
      'Appear in search results',
    ],
    highlight: false,
  },
  {
    name: 'Professional',
    price: `$${PROFESSIONAL_PRICE}`,
    cadence: 'per month',
    features: [
      'Everything in Starter',
      'Up to 20 portfolio images',
      'Unlimited services + pricing',
      'Priority search placement',
      'Review collection + analytics',
      '14-day free trial',
    ],
    highlight: true,
  },
  {
    name: 'Elite',
    price: `$${ELITE_PRICE}`,
    cadence: 'per month',
    features: [
      'Everything in Professional',
      'Respond to every review',
      'Featured in Top-Rated carousel',
      'Mobile service radius tools',
      'Travel date announcements',
      '14-day free trial',
    ],
    highlight: false,
  },
];

export default function ForBarbersPage() {
  return (
    <>
      {/* HERO */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-accent/5 py-24 md:py-32">
        <Container>
          <div className="mx-auto max-w-4xl text-center">
            <span className="inline-block px-3 py-1 mb-6 text-xs font-semibold rounded-full bg-secondary/10 text-secondary uppercase tracking-wide">
              For Barbers &amp; Stylists
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Keep 100% of Your Cut. 0% of the Shop Drama.
            </h1>
            <p className="mt-8 text-xl leading-relaxed text-muted-foreground max-w-2xl mx-auto">
              Join a license-verified barber directory built for independent pros. No chair
              rent. No booking fees. No middleman. Just premium clients and the profile you
              deserve.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={REGISTER_HREF}>
                <Button size="lg" className="w-full sm:w-auto">
                  Claim Your Professional Profile
                </Button>
              </Link>
              <Link href="#pricing">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  See Pricing
                </Button>
              </Link>
            </div>
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

      {/* COMPARISON TABLE */}
      <section className="py-20 bg-muted/30" aria-labelledby="comparison-heading">
        <Container>
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2
              id="comparison-heading"
              className="text-3xl font-bold tracking-tight text-primary sm:text-4xl"
            >
              The Old Way vs Concierge Barber Registry
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Every way the traditional shop/social model costs you — and how we fix it
            </p>
          </div>

          <div className="max-w-4xl mx-auto overflow-hidden rounded-lg border bg-background shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-6 py-4 font-semibold"></th>
                  <th className="text-left px-6 py-4 font-semibold text-muted-foreground">
                    The Old Way
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-primary">
                    Concierge Barber Registry
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, i) => (
                  <tr key={row.label} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                    <td className="px-6 py-4 font-medium">{row.label}</td>
                    <td className="px-6 py-4 text-muted-foreground">{row.oldWay}</td>
                    <td className="px-6 py-4 font-medium text-primary">{row.registry}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20" aria-labelledby="how-it-works-heading">
        <Container>
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2
              id="how-it-works-heading"
              className="text-3xl font-bold tracking-tight text-primary sm:text-4xl"
            >
              How It Works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Three steps from signup to your first booking
            </p>
          </div>

          <ol className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
            {HOW_IT_WORKS.map((step) => (
              <li
                key={step.step}
                className="flex flex-col items-center text-center"
              >
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

      {/* WHY VERIFIED MATTERS */}
      <section className="py-20 bg-primary/5" aria-labelledby="verification-heading">
        <Container>
          <div className="mx-auto max-w-3xl">
            <div className="text-center mb-10">
              <h2
                id="verification-heading"
                className="text-3xl font-bold tracking-tight text-primary sm:text-4xl"
              >
                Why License Verification Matters
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Your competitive edge against &ldquo;kitchen cutters&rdquo; and unlicensed operators
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-primary mb-2">
                    Clients Pay More for Proof
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Premium clients are willing to pay a premium price — but they need a
                    trust signal first. A verified badge tells them you&apos;re a
                    professional before they even see your fade.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-primary mb-2">
                    Search Rewards Verification
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Verified profiles rank higher in our search results. The more complete
                    your verification, the more often you appear when clients search your
                    city and specialty.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-primary mb-2">
                    Filter Out Tire-Kickers
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Clients who browse a verified directory are further down the funnel.
                    They&apos;re ready to book — not just looking.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-primary mb-2">
                    Stand Out in Your City
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Most local &ldquo;barber directories&rdquo; list anyone who claims to be a barber.
                    Our verified-only model means clients trust the listings more — and
                    you get the benefit of that trust.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </Container>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-20" aria-labelledby="pricing-heading">
        <Container>
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2
              id="pricing-heading"
              className="text-3xl font-bold tracking-tight text-primary sm:text-4xl"
            >
              Simple, Transparent Pricing
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Start free. Upgrade when you&apos;re ready for more visibility and features.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PRICING_TIERS.map((tier) => (
              <Card
                key={tier.name}
                className={
                  tier.highlight
                    ? 'border-2 border-primary shadow-lg relative'
                    : ''
                }
              >
                {tier.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                    Most Popular
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-primary">{tier.name}</h3>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold">{tier.price}</span>
                    <span className="text-sm text-muted-foreground">{tier.cadence}</span>
                  </div>
                  <ul className="mt-6 space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <svg
                          className="h-5 w-5 text-primary shrink-0 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={REGISTER_HREF} className="block mt-6">
                    <Button
                      variant={tier.highlight ? 'default' : 'outline'}
                      className="w-full"
                    >
                      Start with {tier.name}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-muted/30" aria-labelledby="faq-heading">
        <Container>
          <div className="mx-auto max-w-3xl">
            <div className="text-center mb-12">
              <h2
                id="faq-heading"
                className="text-3xl font-bold tracking-tight text-primary sm:text-4xl"
              >
                Questions Barbers Ask
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Everything you need to know before you sign up
              </p>
            </div>

            <div className="space-y-4">
              {FAQS.map((faq) => (
                <Card key={faq.q}>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-primary mb-2">{faq.q}</h3>
                    <p className="text-muted-foreground">{faq.a}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* FINAL CTA */}
      <section className="bg-primary py-20 text-primary-foreground">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Ready to Own Your Chair?
            </h2>
            <p className="mt-4 text-lg opacity-90">
              Join the directory built for independent, license-verified professionals.
              Free to register, 14-day trial on paid plans.
            </p>
            <div className="mt-8">
              <Link href={REGISTER_HREF}>
                <Button size="lg" variant="secondary">
                  Claim Your Professional Profile
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
