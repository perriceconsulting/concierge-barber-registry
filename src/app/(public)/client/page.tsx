import { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/layout/container';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { HERO, WHY_CLIENT_BLOCKS, HOW_IT_WORKS_CLIENT } from '@/lib/copy/v2';
import { FAQS } from '@/lib/copy/faqs';
import { FaqSection } from '@/components/seo/faq-section';

export const metadata: Metadata = buildPageMetadata({
  title: 'For Clients — Find a Verified Master Barber',
  description:
    'Manually license-verified barbers. Build a Grooming Passport that follows you globally. Discreet, encrypted, and on your terms.',
  path: '/client',
  keywords: [
    'find master barber',
    'verified barber',
    'concierge grooming',
    'private barber',
    'grooming passport',
    'discreet barber service',
  ],
});

export default function ClientPage() {
  return (
    <>
      {/* HERO */}
      <section className="spotlight relative py-24 sm:py-32">
        <Container>
          <div className="mx-auto max-w-4xl text-center">
            <span className="inline-block px-3 py-1 mb-6 text-xs font-semibold rounded-full bg-secondary/10 text-secondary uppercase tracking-widest">
              {HERO.client.eyebrow}
            </span>
            <h1 className="font-serif text-5xl font-extrabold tracking-tight sm:text-7xl bg-gradient-to-r from-cbr-gold via-cbr-platinum to-cbr-gold bg-clip-text text-transparent">
              {HERO.client.headline}
            </h1>
            <p className="mt-6 font-serif text-2xl text-cbr-gold/90 italic">
              {HERO.client.subhead}
            </p>
            <p className="mt-8 text-lg leading-relaxed text-muted-foreground max-w-2xl mx-auto">
              {HERO.client.body}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href={HERO.client.primaryCta.href}>
                <Button size="lg">{HERO.client.primaryCta.label}</Button>
              </Link>
              <Link href={HERO.client.secondaryCta.href}>
                <Button size="lg" variant="outline">
                  {HERO.client.secondaryCta.label}
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* STAT BAR */}
      <section className="border-y border-border bg-card py-12">
        <Container>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 text-center">
            <div>
              <div className="font-serif text-3xl font-bold text-primary">License-Verified</div>
              <p className="mt-2 text-sm text-muted-foreground">
                Every barber manually reviewed before approval.
              </p>
            </div>
            <div>
              <div className="font-serif text-3xl font-bold text-primary">Zero Booking Fees</div>
              <p className="mt-2 text-sm text-muted-foreground">
                You contact the barber directly. We never take a cut.
              </p>
            </div>
            <div>
              <div className="font-serif text-3xl font-bold text-primary">Encrypted Passport</div>
              <p className="mt-2 text-sm text-muted-foreground">
                Your specs travel with you, securely.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* WHY */}
      <section className="py-20">
        <Container>
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="font-serif text-3xl font-bold tracking-tight text-heading sm:text-4xl">
              The Concierge Standard
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              What separates the Registry from a booking app.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {WHY_CLIENT_BLOCKS.map((item) => (
              <Card key={item.title} className="premium-card">
                <CardContent className="p-8">
                  <h3 className="font-serif text-xl font-semibold text-heading">{item.title}</h3>
                  <p className="mt-3 text-muted-foreground leading-relaxed">{item.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* PASSPORT FEATURE */}
      <section id="passport" className="bg-card border-y border-border py-20">
        <Container>
          <div className="mx-auto max-w-3xl text-center mb-12">
            <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold rounded-full bg-secondary/10 text-secondary uppercase tracking-widest">
              Featured
            </span>
            <h2 className="font-serif text-3xl font-bold tracking-tight text-heading sm:text-4xl">
              The Grooming Passport
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              An encrypted technical profile of your hair — guards, density, growth patterns, allergies, product preferences. Your barber documents it once. After that, any verified CBR professional in any city can scan your QR and reproduce the cut exactly.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            {HOW_IT_WORKS_CLIENT.map((step) => (
              <div key={step.step} className="text-center">
                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xl">
                  {step.step}
                </div>
                <h3 className="font-serif text-xl font-semibold text-foreground">{step.title}</h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* DISCRETION */}
      <section className="py-20">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-serif text-3xl font-bold tracking-tight text-heading sm:text-4xl">
              Discretion by Default
            </h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              CBR professionals operate under the Concierge Privacy Protocol — a standardized agreement covering location confidentiality, photography consent, and data handling. For high-profile clients, our barbers can present a pre-signed NDA at the start of every session.
            </p>
            <p className="mt-4 text-sm text-muted-foreground italic">
              Looking for managed concierge service?{' '}
              <Link href="/black-label" className="text-secondary underline underline-offset-4 hover:text-primary transition-colors">
                Learn about Black Label →
              </Link>
            </p>
          </div>
        </Container>
      </section>

      {/* FAQs — AEO/SGE answers for client onboarding */}
      <FaqSection
        items={FAQS.client}
        background="transparent"
        lede="The Grooming Passport, the Privacy Protocol, and how to choose a verified master barber."
      />

      {/* FINAL CTA */}
      <section className="bg-card border-y border-border py-20 spotlight-soft">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-3xl font-bold sm:text-4xl text-heading">
              Find Your Master
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Browse verified professionals by city or specialty.
            </p>
            <div className="mt-8">
              <Link href={HERO.client.primaryCta.href}>
                <Button size="lg">{HERO.client.primaryCta.label}</Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
