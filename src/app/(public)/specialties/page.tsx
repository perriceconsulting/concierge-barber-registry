import { Metadata } from 'next';
import { Container } from '@/components/layout/container';
import { SPECIALTIES } from '@/config';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Barber Specialties',
  description:
    'Browse barber specialties including fades, tapers, beard trims, lineups, and more. Find barbers who specialize in the exact style you want.',
  path: '/specialties',
  keywords: [
    'barber specialties',
    'fade specialist',
    'beard trim',
    'taper fade',
    'lineup',
    'barber services',
    'hair cut styles',
  ],
});

export default function SpecialtiesPage() {
  return (
    <div className="min-h-[calc(100vh-16rem)] py-12">
      <Container>
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight text-heading sm:text-5xl">
              Barber Specialties
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Browse barbers by their specialized skills and services
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {SPECIALTIES.map((specialty) => (
              <Link
                key={specialty}
                href={`/specialties/${specialty.toLowerCase().replace(/[\/\s]/g, '-')}`}
                className="group relative overflow-hidden rounded-lg border bg-background p-6 hover:border-primary transition-colors"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                    {specialty}
                  </h3>
                  <svg
                    className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
}
