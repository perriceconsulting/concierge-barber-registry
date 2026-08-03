import { Metadata } from 'next';
import { Container } from '@/components/layout/container';
import { Card, CardContent } from '@/components/ui/card';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { RequestAccessForm } from './request-access-form';

export const metadata: Metadata = buildPageMetadata({
  title: 'Request Black Label Membership',
  description:
    'Apply for invitation to Concierge Barber Registry Black Label — managed grooming for executives, public figures, and family offices.',
  path: '/black-label/request-access',
  noindex: true,
});

export default function RequestAccessPage() {
  return (
    <section className="spotlight-soft py-20 sm:py-28 min-h-[80vh]">
      <Container>
        <div className="mx-auto max-w-2xl">
          {/* Hero */}
          <div className="text-center mb-10">
            <span className="inline-block px-4 py-1.5 mb-6 text-xs font-semibold rounded-full border border-cbr-gold text-cbr-gold uppercase tracking-[0.3em]">
              Black Label
            </span>
            <h1 className="font-serif text-4xl font-extrabold tracking-tight sm:text-5xl text-heading">
              Request Membership
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Membership is by invitation. Tell us a bit about your needs and a team member will be in touch within 48 hours.
            </p>
          </div>

          {/* What's included — gives the page real topical density + section
              landmarks for screen readers + AI engines */}
          <section aria-labelledby="bl-included-heading" className="mb-10">
            <h2
              id="bl-included-heading"
              className="font-serif text-2xl font-bold text-heading mb-4 text-center"
            >
              What Black Label Includes
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-cbr-gold shrink-0">◆</span>
                <span>Standing appointments locked for the year</span>
              </li>
              <li className="flex gap-2">
                <span className="text-cbr-gold shrink-0">◆</span>
                <span>4-hour rapid response across major hubs</span>
              </li>
              <li className="flex gap-2">
                <span className="text-cbr-gold shrink-0">◆</span>
                <span>Pre-signed NDA on file for every assigned barber</span>
              </li>
              <li className="flex gap-2">
                <span className="text-cbr-gold shrink-0">◆</span>
                <span>Travel-ready Grooming Passport hand-off</span>
              </li>
            </ul>
          </section>

          {/* Form */}
          <section aria-labelledby="bl-form-heading">
            <h2
              id="bl-form-heading"
              className="font-serif text-2xl font-bold text-heading mb-4 text-center"
            >
              Submit Your Request
            </h2>
            <Card className="premium-card glass">
              <CardContent className="p-8 sm:p-10">
                <RequestAccessForm />
              </CardContent>
            </Card>
          </section>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            All submissions are confidential. We will never sell or share your information.
          </p>
        </div>
      </Container>
    </section>
  );
}
