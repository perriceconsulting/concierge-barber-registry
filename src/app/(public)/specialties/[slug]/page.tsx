import { Metadata } from 'next';
import { Container } from '@/components/layout/container';
import { SPECIALTIES } from '@/config';
import { notFound } from 'next/navigation';

function getSpecialtyName(slug: string): string | undefined {
  return SPECIALTIES.find(
    (s) => s.toLowerCase().replace(/[\/\s]/g, '-') === slug
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const name = getSpecialtyName(slug);
  if (!name) return { title: 'Specialty Not Found' };

  return {
    title: `${name} Barbers - Find Specialists Near You`,
    description: `Find verified barbers specializing in ${name.toLowerCase()}. Browse portfolios, read reviews, and book with ${name.toLowerCase()} experts on Concierge Barber Registry.`,
    keywords: [name.toLowerCase(), `${name.toLowerCase()} barber`, `${name.toLowerCase()} near me`, `best ${name.toLowerCase()} barber`, 'barber specialist'],
    openGraph: {
      title: `${name} Barbers | Concierge Barber Registry`,
      description: `Find verified barbers specializing in ${name.toLowerCase()}.`,
      url: `/specialties/${slug}`,
    },
  };
}

export default async function SpecialtyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const specialtyName = getSpecialtyName(slug);

  if (!specialtyName) {
    notFound();
  }

  return (
    <div className="min-h-[calc(100vh-16rem)] py-12">
      <Container>
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl">
              {specialtyName}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Find expert barbers specializing in {specialtyName.toLowerCase()}
            </p>
          </div>

          <div className="rounded-lg border bg-card p-8 text-center">
            <p className="text-muted-foreground">
              No barbers found for this specialty yet. Check back soon!
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}
