import { Metadata } from 'next';
import { Container } from '@/components/layout/container';
import { SPECIALTIES } from '@/config';
import { notFound } from 'next/navigation';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { Breadcrumb } from '@/components/breadcrumb';
import { FAQStructuredData } from '@/components/seo/faq-structured-data';
import { SpeakableSchema } from '@/components/seo/speakable-schema';
import { SPECIALTY_CONTENT } from '@/data/specialty-content';

type SpecialtyName = (typeof SPECIALTIES)[number];

function getSpecialtyName(slug: string): SpecialtyName | undefined {
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
    title: `Expert ${name} Barbers Near You | License-Verified Pros`,
    description: `Looking for the best ${lower} in your area? Browse our registry of license-verified barbers specializing in ${lower}. Direct booking, no middleman fees.`,
    path: `/specialties/${slug}`,
    keywords: [
      lower,
      `${lower} barber`,
      `${lower} near me`,
      `best ${lower} barber`,
      `${lower} specialist`,
      `license-verified ${lower} barber`,
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

  const content = SPECIALTY_CONTENT[specialtyName];
  const lower = specialtyName.toLowerCase();

  const breadcrumbItems = [
    { name: 'Home', path: '/' },
    { name: 'Specialties', path: '/specialties' },
    { name: specialtyName, path: `/specialties/${slug}` },
  ];

  return (
    <>
      <FAQStructuredData items={content.faqs} />
      <SpeakableSchema cssSelectors={['.speakable-intro', '.speakable-faq']} />
      <article className="min-h-[calc(100vh-16rem)] py-12">
        <Container>
          <div className="mx-auto max-w-4xl">
            <Breadcrumb items={breadcrumbItems} className="mb-6" />

            <header className="mb-10">
              <h1 className="text-4xl font-bold tracking-tight text-heading sm:text-5xl">
                {specialtyName}
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Find license-verified barbers specializing in {lower} near you
              </p>
            </header>

            <section
              aria-labelledby="what-is-heading"
              className="mb-12"
            >
              <h2
                id="what-is-heading"
                className="text-2xl font-bold text-heading mb-4"
              >
                What is {specialtyName === 'Afro' || specialtyName === 'Mullet' || specialtyName === 'Mohawk' ? 'an' : 'a'}{' '}
                {specialtyName}?
              </h2>
              <p className="speakable-intro text-base leading-relaxed text-muted-foreground">
                {content.intro}
              </p>
            </section>

            <section
              aria-labelledby="common-questions-heading"
              className="mb-12"
            >
              <h2
                id="common-questions-heading"
                className="text-2xl font-bold text-heading mb-6"
              >
                Common Questions About {specialtyName}
              </h2>
              <div className="space-y-4">
                {content.faqs.map((faq) => (
                  <details
                    key={faq.question}
                    className="group rounded-lg border bg-background p-5 hover:border-primary/40 transition-colors"
                  >
                    <summary className="cursor-pointer font-semibold text-primary list-none flex items-center justify-between">
                      <span>{faq.question}</span>
                      <span
                        aria-hidden="true"
                        className="text-secondary transition-transform group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>
                    <p className="speakable-faq mt-3 text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </section>

            <section
              aria-labelledby="find-barbers-heading"
              className="rounded-lg border bg-card p-8 text-center"
            >
              <h2
                id="find-barbers-heading"
                className="text-xl font-bold text-heading mb-2"
              >
                Find a {specialtyName} Specialist
              </h2>
              <p className="text-muted-foreground">
                License-verified barbers specializing in {lower} will appear here as
                they join the registry. Check back soon, or search the full directory.
              </p>
            </section>
          </div>
        </Container>
      </article>
    </>
  );
}
