import { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/layout/container';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { buildPageMetadata } from '@/lib/seo/metadata';
import {
  HERO,
  WHY_PRO_BLOCKS,
  HOW_IT_WORKS_PRO,
  VETTING_FEE_NOTICE,
  VETTING_FEE_PRICING,
  PAYMENT_POLICY,
} from '@/lib/copy/v2';
import { FAQS } from '@/lib/copy/faqs';
import { FaqSection } from '@/components/seo/faq-section';

export const metadata: Metadata = buildPageMetadata({
  title: 'For Master Barbers — The Industry Standard for Verified Grooming',
  description:
    'A license-verified registry for elite, independent barbers. Manual vetting, zero middleman fees, 10% travel royalties, and a digital Founding Member credential.',
  path: '/pro',
  keywords: [
    'verified barber registry',
    'master barber',
    'concierge barber',
    'elite barber platform',
    'license-verified barber',
    'founding member barber',
  ],
});

export default function ProPage() {
  return (
    <>
      {/* HERO */}
      <section className="spotlight relative py-24 sm:py-32">
        <Container>
          <div className="mx-auto max-w-4xl text-center">
            <span className="inline-block px-3 py-1 mb-6 text-xs font-semibold rounded-full bg-secondary/10 text-secondary uppercase tracking-widest">
              {HERO.pro.eyebrow}
            </span>
            <h1 className="font-serif text-5xl font-extrabold tracking-tight sm:text-7xl bg-gradient-to-r from-cbr-gold via-cbr-platinum to-cbr-gold bg-clip-text text-transparent">
              {HERO.pro.headline}
            </h1>
            <p className="mt-6 font-serif text-2xl text-cbr-gold/90 italic">
              {HERO.pro.subhead}
            </p>
            <p className="mt-8 text-lg leading-relaxed text-muted-foreground max-w-2xl mx-auto">
              {HERO.pro.body}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href={HERO.pro.primaryCta.href}>
                <Button size="lg">{HERO.pro.primaryCta.label}</Button>
              </Link>
              <Link href={HERO.pro.secondaryCta.href}>
                <Button size="lg" variant="outline">
                  {HERO.pro.secondaryCta.label}
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
              <div className="font-serif text-3xl font-bold text-primary">Manual Vetting</div>
              <p className="mt-2 text-sm text-muted-foreground">
                Every license reviewed by hand. No automated approvals.
              </p>
            </div>
            <div>
              <div className="font-serif text-3xl font-bold text-primary">10% Royalty</div>
              <p className="mt-2 text-sm text-muted-foreground">
                Travel referrals to verified CBR partners pay you.
              </p>
            </div>
            <div>
              <div className="font-serif text-3xl font-bold text-primary">Founding Status</div>
              <p className="mt-2 text-sm text-muted-foreground">
                First {VETTING_FEE_PRICING.intro_limit} approved barbers earn perpetual recognition.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* WHY PRO */}
      <section className="py-20">
        <Container>
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="font-serif text-3xl font-bold tracking-tight text-heading sm:text-4xl">
              Why Master Barbers Join the Registry
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Built for craft — not for clicks.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {WHY_PRO_BLOCKS.map((item) => (
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

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="bg-card border-y border-border py-20">
        <Container>
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="font-serif text-3xl font-bold tracking-tight text-heading sm:text-4xl">
              How Verification Works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Three steps from application to active member.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            {HOW_IT_WORKS_PRO.map((step) => (
              <div key={step.step} className="text-center">
                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xl">
                  {step.step}
                </div>
                <h3 className="font-serif text-xl font-semibold text-foreground">{step.title}</h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-12 mx-auto max-w-2xl text-center text-sm text-muted-foreground italic">
            {VETTING_FEE_NOTICE}
          </p>
        </Container>
      </section>

      {/* PRICING */}
      <section className="py-20">
        <Container>
          <div className="mx-auto max-w-3xl text-center mb-12">
            <h2 className="font-serif text-3xl font-bold tracking-tight text-heading sm:text-4xl">
              Application Pricing
            </h2>
          </div>
          <div className="mx-auto max-w-3xl grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card className="premium-card relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-secondary text-secondary-foreground text-xs font-semibold rounded-full uppercase tracking-wider">
                Founding Members
              </div>
              <CardContent className="p-8 text-center">
                <p className="text-sm uppercase tracking-widest text-muted-foreground">Intro</p>
                <p className="mt-2 font-serif text-5xl font-bold text-primary">
                  ${VETTING_FEE_PRICING.intro}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  First {VETTING_FEE_PRICING.intro_limit} approved barbers. Perpetual Founding Member status. One-time fee.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-sm uppercase tracking-widest text-muted-foreground">Standard</p>
                <p className="mt-2 font-serif text-5xl font-bold text-foreground">
                  ${VETTING_FEE_PRICING.standard}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  One-time application fee. 30-day Verified Member trial included on approval.
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  +${VETTING_FEE_PRICING.expedited_addon} for 24-hour expedited vetting
                </p>
              </CardContent>
            </Card>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            {PAYMENT_POLICY.prepaidNotAcceptedLong}
          </p>
        </Container>
      </section>

      {/* FAQs — AEO/SGE answers for Verified Member applicants */}
      <FaqSection
        items={FAQS.pro}
        background="transparent"
        lede="What master barbers ask about Verified Member status, the 30-day trial, and the verification process."
      />

      {/* FINAL CTA */}
      <section className="bg-card border-y border-border py-20 spotlight-soft">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-3xl font-bold sm:text-4xl text-heading">
              Apply for Verification
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join the registry built for licensed master barbers.
            </p>
            <div className="mt-8">
              <Link href={HERO.pro.primaryCta.href}>
                <Button size="lg">{HERO.pro.primaryCta.label}</Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
