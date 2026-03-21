import Link from 'next/link';
import { Container } from '@/components/layout/container';
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

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const category = params.category || '';

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

  return (
    <div className="min-h-[calc(100vh-16rem)] py-16">
      <Container>
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold text-primary mb-2">Blog</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Expert tips, guides, and insights on barbering and grooming
          </p>

          {/* Category filters */}
          <div className="flex flex-wrap gap-2 mb-10">
            {CATEGORY_FILTERS.map(filter => (
              <Link
                key={filter.value}
                href={filter.value ? `/blog?category=${filter.value}` : '/blog'}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  category === filter.value
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </Link>
            ))}
          </div>

          {/* Post grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(post => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group block border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-secondary/10 text-secondary mb-3">
                    {CATEGORY_LABELS[post.category] || post.category}
                  </span>
                  <h2 className="text-lg font-bold text-primary group-hover:text-secondary transition-colors mb-2">
                    {post.title}
                  </h2>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {post.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Draft'}</span>
                    <span>{post.readingTime} min read</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {posts.length === 0 && (
            <p className="text-center text-muted-foreground py-12">
              No articles found in this category.
            </p>
          )}
        </div>
      </Container>
    </div>
  );
}
