import { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/layout/container';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { HERO, BLACK_LABEL_INCLUSIONS } from '@/lib/copy/v2';
import { FAQS } from '@/lib/copy/faqs';
import { FaqSection } from '@/components/seo/faq-section';

export const metadata: Metadata = buildPageMetadata({
  title: 'Black Label — Managed Concierge Grooming for Executives',
  description:
    'Invitation-only managed grooming for executives, public figures, and family offices. Standing appointments, NDA-protected sessions, travel-ready profiles, 4-hour rapid response.',
  path: '/black-label',
  keywords: [
    'executive grooming',
    'managed barber service',
    'private concierge barber',
    'celebrity barber',
    'family office grooming',
    'concierge image management',
  ],
  noindex: true,
});

export default function BlackLabelPage() {
  return (
    <>
      {/* HERO */}
      <section className="spotlight relative py-24 sm:py-36">
        <Container>
          <div className="mx-auto max-w-4xl text-center">
            <span className="inline-block px-4 py-1.5 mb-8 text-xs font-semibold rounded-full border border-cbr-gold text-cbr-gold uppercase tracking-[0.3em]">
              {HERO.blackLabel.eyebrow}
            </span>
            <h1 className="font-serif text-5xl font-extrabold tracking-tight sm:text-7xl bg-gradient-to-r from-cbr-gold via-cbr-platinum to-cbr-gold bg-clip-text text-transparent">
              {HERO.blackLabel.headline}
            </h1>
            <p className="mt-6 font-serif text-2xl text-cbr-gold/90 italic">
              {HERO.blackLabel.subhead}
            </p>
            <p className="mt-8 text-lg leading-relaxed text-muted-foreground max-w-2xl mx-auto">
              {HERO.blackLabel.body}
            </p>
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href={HERO.blackLabel.primaryCta.href}>
                <Button size="lg">{HERO.blackLabel.primaryCta.label}</Button>
              </Link>
              <Link href={HERO.blackLabel.secondaryCta.href}>
                <Button size="lg" variant="outline">
                  {HERO.blackLabel.secondaryCta.label}
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* INCLUSIONS */}
      <section id="included" className="bg-card border-y border-border py-20">
        <Container>
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="font-serif text-3xl font-bold tracking-tight text-primary sm:text-4xl">
              What&rsquo;s Included
            </h2>
            <p className="mt-4 text-lg text-muted-foreground italic">
              The platform isn&rsquo;t selling a haircut. It&rsquo;s selling 30 minutes of reclaimed headspace every two weeks.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {BLACK_LABEL_INCLUSIONS.map((item) => (
              <Card key={item.title} className="premium-card glass">
                <CardContent className="p-8">
                  <h3 className="font-serif text-xl font-semibold text-primary">{item.title}</h3>
                  <p className="mt-3 text-muted-foreground leading-relaxed text-sm">{item.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* CORE VALUE SHIFT */}
      <section className="py-24">
        <Container>
          <div className="mx-auto max-w-3xl">
            <div className="text-center mb-16">
              <h2 className="font-serif text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                The Core Value Shift
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="border-l-2 border-border pl-6">
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
                  From
                </p>
                <p className="font-serif text-xl text-foreground italic">
                  &ldquo;Who is a licensed barber near me?&rdquo;
                </p>
              </div>
              <div className="border-l-2 border-cbr-gold pl-6">
                <p className="text-xs uppercase tracking-widest text-cbr-gold mb-3">To</p>
                <p className="font-serif text-xl text-cbr-gold italic">
                  &ldquo;Ensure my image is maintained globally, securely, and without my intervention.&rdquo;
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* FAQs — AEO/SGE answers for Black Label inquiries */}
      <FaqSection
        items={FAQS.blackLabel}
        background="transparent"
        lede="The most common questions about access, scope, and how Black Label differs from the public Verified Member tier."
      />

      {/* FINAL CTA */}
      <section className="bg-card border-y border-border py-20 spotlight-soft">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-3xl font-bold sm:text-4xl text-primary">
              Request Membership
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Membership is by invitation. Submit a request and a team member will be in touch within 48 hours.
            </p>
            <div className="mt-8">
              <Link href={HERO.blackLabel.primaryCta.href}>
                <Button size="lg">{HERO.blackLabel.primaryCta.label}</Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
