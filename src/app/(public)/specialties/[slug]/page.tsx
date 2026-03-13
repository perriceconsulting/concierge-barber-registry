import { Container } from '@/components/layout/container';
import { SPECIALTIES } from '@/config';
import { notFound } from 'next/navigation';

export default async function SpecialtyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Convert slug back to specialty name
  const specialtyName = SPECIALTIES.find(
    (s) => s.toLowerCase().replace(/[\/\s]/g, '-') === slug
  );

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
