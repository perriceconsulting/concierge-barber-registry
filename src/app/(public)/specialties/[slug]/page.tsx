import { Metadata } from 'next';
import { Container } from '@/components/layout/container';
import { SPECIALTIES } from '@/config';
import { notFound } from 'next/navigation';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { Breadcrumb } from '@/components/breadcrumb';

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

  const lower = name.toLowerCase();
  return buildPageMetadata({
    title: `${name} Barbers - Find Specialists Near You`,
    description: `Find verified barbers specializing in ${lower}. Browse portfolios, read reviews, and book with ${lower} experts on Concierge Barber Registry.`,
    path: `/specialties/${slug}`,
    keywords: [
      lower,
      `${lower} barber`,
      `${lower} near me`,
      `best ${lower} barber`,
      'barber specialist',
    ],
  });
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

  const breadcrumbItems = [
    { name: 'Home', path: '/' },
    { name: 'Specialties', path: '/specialties' },
    { name: specialtyName, path: `/specialties/${slug}` },
  ];

  return (
    <div className="min-h-[calc(100vh-16rem)] py-12">
      <Container>
        <div className="mx-auto max-w-4xl">
          <Breadcrumb items={breadcrumbItems} className="mb-6" />
          <header className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl">
              {specialtyName}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Find expert barbers specializing in {specialtyName.toLowerCase()}
            </p>
          </header>

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
