import Link from 'next/link';
import { Container } from '@/components/layout/container';
import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';

const CATEGORY_LABELS: Record<string, string> = {
  for_clients: 'For Clients',
  for_barbers: 'For Barbers',
  industry: 'Industry',
};

interface Props {
  barberSlug: string;
}

async function fetchSpecialtyNames(barberSlug: string): Promise<string[]> {
  const profile = await prisma.barberProfile.findUnique({
    where: { slug: barberSlug },
    include: { specialties: { include: { specialty: true } } },
  });
  if (!profile) return [];
  return profile.specialties.map((s) => s.specialty.name);
}

async function fetchRelatedPosts(specialtyNames: string[]) {
  const lowered = specialtyNames.map((n) => n.toLowerCase());

  if (lowered.length > 0) {
    const all = await prisma.blogPost.findMany({
      where: { status: 'published' },
      orderBy: { publishedAt: 'desc' },
      take: 50,
      select: {
        slug: true,
        title: true,
        description: true,
        category: true,
        readingTime: true,
        keywords: true,
      },
    });

    const matches = all.filter((post) => {
      const keywords = (post.keywords as Prisma.JsonArray | null) ?? [];
      const flat = keywords
        .map((k) => (typeof k === 'string' ? k.toLowerCase() : ''))
        .join(' ');
      const haystack = `${post.title.toLowerCase()} ${flat}`;
      return lowered.some((s) => haystack.includes(s));
    });

    if (matches.length > 0) return matches.slice(0, 3);
  }

  return prisma.blogPost.findMany({
    where: { status: 'published', category: 'for_clients' },
    orderBy: { publishedAt: 'desc' },
    take: 3,
    select: {
      slug: true,
      title: true,
      description: true,
      category: true,
      readingTime: true,
    },
  });
}

export async function RelatedArticlesForBarber({ barberSlug }: Props) {
  const specialtyNames = await fetchSpecialtyNames(barberSlug);
  const posts = await fetchRelatedPosts(specialtyNames);

  if (posts.length === 0) return null;

  return (
    <section
      className="py-16 bg-muted/30 border-t"
      aria-labelledby="helpful-guides-heading"
    >
      <Container>
        <div className="mx-auto max-w-2xl text-center mb-10">
          <h2
            id="helpful-guides-heading"
            className="text-2xl font-bold tracking-tight text-primary sm:text-3xl"
          >
            Helpful Guides
          </h2>
          <p className="mt-3 text-muted-foreground">
            Articles to help you get the most out of your next visit
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="group block border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-background"
            >
              <Link href={`/blog/${post.slug}`} className="block p-6 h-full">
                <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-secondary/10 text-secondary mb-3">
                  {CATEGORY_LABELS[post.category] || post.category}
                </span>
                <h3 className="text-base font-bold text-primary group-hover:text-secondary transition-colors mb-2">
                  {post.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {post.description}
                </p>
                <div className="text-xs text-muted-foreground">
                  {post.readingTime} min read
                </div>
              </Link>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
