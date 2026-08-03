import Link from 'next/link';
import { Container } from '@/components/layout/container';
import { prisma } from '@/lib/db';

const CATEGORY_LABELS: Record<string, string> = {
  for_clients: 'For Clients',
  for_barbers: 'For Barbers',
  industry: 'Industry',
};

export async function FeaturedArticles() {
  const posts = await prisma.blogPost.findMany({
    where: { status: 'published' },
    orderBy: { publishedAt: 'desc' },
    take: 3,
    select: {
      slug: true,
      title: true,
      description: true,
      category: true,
      readingTime: true,
      publishedAt: true,
    },
  });

  if (posts.length === 0) return null;

  return (
    <section className="py-20 bg-background" aria-labelledby="featured-articles-heading">
      <Container>
        <div className="mx-auto max-w-2xl text-center mb-12">
          <h2
            id="featured-articles-heading"
            className="text-3xl font-bold tracking-tight text-heading sm:text-4xl"
          >
            From the Blog
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Expert tips, guides, and insights on barbering and grooming
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="group block border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              <Link href={`/blog/${post.slug}`} className="block p-6 h-full">
                <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-secondary/10 text-secondary mb-3">
                  {CATEGORY_LABELS[post.category] || post.category}
                </span>
                <h3 className="text-lg font-bold text-heading group-hover:text-secondary transition-colors mb-2">
                  {post.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {post.description}
                </p>
                <div className="text-xs text-muted-foreground">
                  {post.readingTime} min read
                </div>
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/blog"
            className="inline-block px-6 py-3 border-2 border-primary text-primary font-medium rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            View All Articles
          </Link>
        </div>
      </Container>
    </section>
  );
}
