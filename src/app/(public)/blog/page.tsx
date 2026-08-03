import { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/layout/container';
import { Breadcrumb } from '@/components/breadcrumb';
import { BreadcrumbStructuredData } from '@/components/seo/breadcrumb-structured-data';
import { BlogListStructuredData } from '@/components/seo/blog-list-structured-data';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { prisma } from '@/lib/db';
import type { BlogCategory } from '@prisma/client';

const CATEGORY_FILTERS = [
  { value: '', label: 'All' },
  { value: 'for_clients', label: 'For Clients' },
  { value: 'for_barbers', label: 'For Barbers' },
  { value: 'industry', label: 'Industry' },
];

const CATEGORY_LABELS: Record<string, string> = {
  for_clients: 'For Clients',
  for_barbers: 'For Barbers',
  industry: 'Industry',
};

// Per-category copy keeps title/description/canonical aligned with the
// filter state — otherwise every ?category= variant inherits the same
// generic metadata, which is a duplicate-content liability.
const CATEGORY_META: Record<string, { title: string; description: string }> = {
  '': {
    title: 'Blog — Expert Guides on Grooming, Barbering & the Industry',
    description:
      'Expert tips, guides, and industry insights on barbering, mens grooming, beard care, and finding licensed master barbers. Written for clients and verified professionals.',
  },
  for_clients: {
    title: 'For Clients — Grooming & Barber Guides',
    description:
      'How-to guides and recommendations for discerning clients: finding a licensed master barber, choosing a cut, beard care, hot-towel shave etiquette, and travel grooming.',
  },
  for_barbers: {
    title: 'For Barbers — Professional Practice & Industry Resources',
    description:
      'Career guides for independent barbers and master stylists: license verification, building an elite clientele, referral royalties, pricing, and the credentialing process.',
  },
  industry: {
    title: 'Industry — News, Trends & Standards in Professional Barbering',
    description:
      'Reporting and analysis on the licensed barbering industry: state licensing, certification trends, the rise of concierge grooming, and standards for verified professionals.',
  },
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}): Promise<Metadata> {
  const { category = '' } = await searchParams;
  const meta = CATEGORY_META[category] ?? CATEGORY_META[''];
  return buildPageMetadata({
    title: meta.title,
    description: meta.description,
    // Per-category canonical so search engines don't see the filter
    // variants as duplicates of /blog.
    path: category ? `/blog?category=${category}` : '/blog',
    keywords: [
      'barber blog',
      'grooming guides',
      'barbering industry',
      'mens grooming',
      'licensed barber',
      'concierge barber',
      ...(category === 'for_clients' ? ['how to find a barber', 'mens grooming tips'] : []),
      ...(category === 'for_barbers' ? ['barber career', 'barber licensing'] : []),
      ...(category === 'industry' ? ['barbering trends', 'barber licensing news'] : []),
    ],
  });
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const category = params.category || '';
  const activeFilterLabel = CATEGORY_LABELS[category];

  const where: Record<string, unknown> = { status: 'published' };
  if (category) where.category = category as BlogCategory;

  const posts = await prisma.blogPost.findMany({
    where,
    orderBy: { publishedAt: 'desc' },
    select: {
      slug: true,
      title: true,
      description: true,
      category: true,
      readingTime: true,
      publishedAt: true,
    },
  });

  const breadcrumbItems = category
    ? [
        { name: 'Home', path: '/' },
        { name: 'Blog', path: '/blog' },
        { name: activeFilterLabel ?? 'Blog', path: `/blog?category=${category}` },
      ]
    : [
        { name: 'Home', path: '/' },
        { name: 'Blog', path: '/blog' },
      ];

  const headline = activeFilterLabel
    ? `${activeFilterLabel} — Barber & Grooming Guides`
    : 'Concierge Barber Registry Blog';
  const lede = activeFilterLabel
    ? `Articles tagged ${activeFilterLabel.toLowerCase()} from our library of guides on barbering, grooming, and the licensed-barber industry.`
    : 'Expert guides on professional barbering, mens grooming, beard care, hot-towel shaves, and finding a licensed master barber near you.';

  return (
    <div className="min-h-[calc(100vh-16rem)] py-16">
      {/* JSON-LD: Blog (publication) + the listed posts */}
      <BlogListStructuredData
        posts={posts.map((p) => ({
          slug: p.slug,
          title: p.title,
          description: p.description,
          publishedAt: p.publishedAt?.toISOString() ?? null,
        }))}
        sectionLabel={activeFilterLabel}
      />
      <BreadcrumbStructuredData items={breadcrumbItems} />

      <Container>
        <div className="max-w-5xl mx-auto">
          <Breadcrumb items={breadcrumbItems} className="mb-6" />

          <h1 className="font-serif text-4xl font-bold text-heading mb-2">{headline}</h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-3xl">{lede}</p>

          {/* Category filters */}
          <div className="flex flex-wrap gap-2 mb-10" role="tablist" aria-label="Filter blog by category">
            {CATEGORY_FILTERS.map((filter) => {
              const isActive = category === filter.value;
              return (
                <Link
                  key={filter.value}
                  href={filter.value ? `/blog?category=${filter.value}` : '/blog'}
                  role="tab"
                  aria-selected={isActive}
                  aria-current={isActive ? 'page' : undefined}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-muted-foreground border border-border hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {filter.label}
                </Link>
              );
            })}
          </div>

          {/* Post grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group block rounded-lg border border-border bg-card overflow-hidden hover:shadow-md hover:border-primary/40 transition-all"
              >
                <article className="p-6">
                  <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-secondary/10 text-secondary mb-3">
                    {CATEGORY_LABELS[post.category] || post.category}
                  </span>
                  <h2 className="font-serif text-lg font-bold text-heading group-hover:text-secondary transition-colors mb-2">
                    {post.title}
                  </h2>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {post.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    {post.publishedAt ? (
                      <time dateTime={post.publishedAt.toISOString()}>
                        {new Date(post.publishedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </time>
                    ) : (
                      <span>Draft</span>
                    )}
                    <span>{post.readingTime} min read</span>
                  </div>
                </article>
              </Link>
            ))}
          </div>

          {posts.length === 0 && (
            <div className="text-center py-12 space-y-3">
              <p className="text-muted-foreground">
                No articles {activeFilterLabel ? `in "${activeFilterLabel}"` : ''} yet.
              </p>
              {category && (
                <Link
                  href="/blog"
                  className="text-sm text-secondary underline underline-offset-2 hover:no-underline"
                >
                  Browse all articles →
                </Link>
              )}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
