import { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/layout/container';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { TIER_LIMITS } from '@/lib/subscription';
import {
  VETTING_FEE_PRICING,
  MEMBERSHIP_PRICING,
  ANNUAL_SAVING_PERCENT,
  VERIFIED_TRIAL_DAYS,
} from '@/lib/copy/v2';
import { FAQS } from '@/lib/copy/faqs';
import { FaqSection } from '@/components/seo/faq-section';

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


const VERIFIED_LIMITS = TIER_LIMITS.verified.limits;

/**
 * v2 sells one membership, not a tier ladder. This page previously advertised
 * Starter / Professional ($29) / Elite ($59) — none of which can be bought:
 * those Stripe prices no longer exist and the checkout route that served them
 * has been deleted. A barber could read it, pick Elite, and hit a dead end.
 */
const PRICING_TIERS = [
  {
    name: 'Application',
    price: `$${VETTING_FEE_PRICING.standard}`,
    cadence: 'one time',
    features: [
      'Manual three-point license verification',
      'Background check',
      'Digital credential and wallet pass',
      `$${VETTING_FEE_PRICING.intro} for the first ${VETTING_FEE_PRICING.intro_limit} Founding Members`,
      `+$${VETTING_FEE_PRICING.expedited_addon} for 24-hour expedited vetting`,
    ],
    highlight: false,
  },
  {
    name: 'Verified Member — Annual',
    price: `$${MEMBERSHIP_PRICING.annual}`,
    cadence: 'per year',
    features: [
      `Starts after your ${VERIFIED_TRIAL_DAYS}-day trial`,
      `Save ~${ANNUAL_SAVING_PERCENT}% against monthly`,
      `Up to ${VERIFIED_LIMITS.portfolioImages} portfolio images`,
      `Up to ${VERIFIED_LIMITS.services} services`,
      'Unlimited client contact requests',
      'Global Grooming Passport and Travel Royalty Network',
      'Featured placement in search results',
    ],
    highlight: true,
  },
  {
    name: 'Verified Member — Monthly',
    price: `$${MEMBERSHIP_PRICING.monthly}`,
    cadence: 'per month',
    features: [
      'Same toolkit, billed monthly',
      `Starts after your ${VERIFIED_TRIAL_DAYS}-day trial`,
      'Switch cadence anytime from your billing portal',
      'No chair rent, no booking fees, no per-cut percentage',
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
              <div className="text-3xl font-bold text-primary">
                {VERIFIED_TRIAL_DAYS}-Day Trial
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Full membership included after approval, before any dues are charged
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
              className="text-3xl font-bold tracking-tight text-heading sm:text-4xl"
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
              className="text-3xl font-bold tracking-tight text-heading sm:text-4xl"
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
                className="text-3xl font-bold tracking-tight text-heading sm:text-4xl"
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
                  <h3 className="font-semibold text-heading mb-2">
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
                  <h3 className="font-semibold text-heading mb-2">
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
                  <h3 className="font-semibold text-heading mb-2">
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
                  <h3 className="font-semibold text-heading mb-2">
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
              className="text-3xl font-bold tracking-tight text-heading sm:text-4xl"
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
                  <h3 className="text-xl font-bold text-heading">{tier.name}</h3>
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

      {/* FAQs — AEO/SGE answers for top-funnel barber-recruitment queries */}
      <FaqSection
        items={FAQS.forBarbers}
        background="card"
        heading="Questions Barbers Ask"
        lede="Everything independent barbers ask before applying for verification."
      />

      {/* FINAL CTA */}
      <section className="bg-card border-y border-border py-20 text-foreground spotlight-soft">
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
