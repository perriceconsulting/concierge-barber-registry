import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Container } from '@/components/layout/container';
import { ArticleStructuredData } from '@/components/seo/article-structured-data';
import { BreadcrumbStructuredData } from '@/components/seo/breadcrumb-structured-data';
import { SpeakableSchema } from '@/components/seo/speakable-schema';
import { Breadcrumb } from '@/components/breadcrumb';
import { prisma } from '@/lib/db';
import { autoLinkBlogContent } from '@/lib/blog/auto-link-content';

const CATEGORY_LABELS: Record<string, string> = {
  for_clients: 'For Clients',
  for_barbers: 'For Barbers',
  industry: 'Industry',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug, status: 'published' },
    select: { title: true, description: true, keywords: true, category: true, publishedAt: true, updatedAt: true, author: true },
  });
  if (!post) return { title: 'Article Not Found' };

  const keywords = Array.isArray(post.keywords) ? post.keywords as string[] : [];

  return {
    title: post.title,
    description: post.description,
    keywords,
    openGraph: {
      title: `${post.title} | Concierge Barber Registry`,
      description: post.description,
      url: `/blog/${slug}`,
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [post.author],
      section: CATEGORY_LABELS[post.category] || post.category,
      tags: keywords,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
    },
    alternates: {
      canonical: `/blog/${slug}`,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug, status: 'published' },
  });
  if (!post) notFound();

  const categoryLabel = CATEGORY_LABELS[post.category] || post.category;
  const keywords = Array.isArray(post.keywords) ? post.keywords as string[] : [];

  // Get related posts in same category
  const related = await prisma.blogPost.findMany({
    where: {
      category: post.category,
      status: 'published',
      slug: { not: slug },
    },
    take: 3,
    orderBy: { publishedAt: 'desc' },
    select: { slug: true, title: true, description: true },
  });

  return (
    <div className="min-h-[calc(100vh-16rem)] py-16">
      <ArticleStructuredData
        post={{
          slug: post.slug,
          title: post.title,
          description: post.description,
          keywords,
          category: post.category.replace('_', '-') as 'for-clients' | 'for-barbers' | 'industry',
          categoryLabel,
          publishedAt: post.publishedAt?.toISOString() || post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString(),
          readingTime: post.readingTime,
          author: post.author,
          image: post.imageUrl || undefined,
          imageAlt: post.imageAlt || undefined,
        }}
        content={post.content}
      />
      <BreadcrumbStructuredData
        items={[
          { name: 'Home', path: '/' },
          { name: 'Blog', path: '/blog' },
          { name: categoryLabel, path: `/blog?category=${post.category}` },
          { name: post.title, path: `/blog/${post.slug}` },
        ]}
      />
      {/* Voice/SGE readout: title + lede are the natural "headline +
          summary" pair search assistants quote. */}
      <SpeakableSchema cssSelectors={['article header h1', 'article header > p.text-lg']} />
      <Container>
        <article className="max-w-3xl mx-auto">
          <Breadcrumb
            items={[
              { name: 'Home', path: '/' },
              { name: 'Blog', path: '/blog' },
              { name: categoryLabel, path: `/blog?category=${post.category}` },
              { name: post.title, path: `/blog/${post.slug}` },
            ]}
            className="mb-6"
          />

          {/* Header */}
          <header className="mb-8">
            <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-secondary/10 text-secondary mb-4">
              {categoryLabel}
            </span>
            <h1 className="text-4xl font-bold text-primary mb-4">{post.title}</h1>
            <p className="text-lg text-muted-foreground mb-4">{post.description}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground border-b border-gray-200 pb-6">
              <span>{post.author}</span>
              <span>·</span>
              <time dateTime={post.publishedAt?.toISOString()}>
                {post.publishedAt
                  ? new Date(post.publishedAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Draft'}
              </time>
              <span>·</span>
              <span>{post.readingTime} min read</span>
            </div>
          </header>

          {/* Content */}
          <div
            className="prose prose-lg max-w-none
              prose-headings:text-primary prose-headings:font-bold
              prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
              prose-p:text-muted-foreground prose-p:leading-relaxed
              prose-li:text-muted-foreground
              prose-strong:text-primary
              prose-a:text-secondary prose-a:font-medium prose-a:underline prose-a:underline-offset-2 prose-a:decoration-secondary/40 hover:prose-a:decoration-secondary"
            dangerouslySetInnerHTML={{ __html: autoLinkBlogContent(post.content) }}
          />

          {/* CTA */}
          <div className="mt-12 p-8 bg-primary/5 rounded-lg text-center">
            <h3 className="text-xl font-bold text-primary mb-2">
              Find Your Perfect Barber
            </h3>
            <p className="text-muted-foreground mb-4">
              Browse verified, licensed barbers in your area on Concierge Barber Registry.
            </p>
            <Link
              href="/search"
              className="inline-block px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              Search Barbers
            </Link>
          </div>
        </article>

        {/* Related posts */}
        {related.length > 0 && (
          <div className="max-w-3xl mx-auto mt-16">
            <h2 className="text-2xl font-bold text-primary mb-6">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map(r => (
                <Link
                  key={r.slug}
                  href={`/blog/${r.slug}`}
                  className="group block border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                >
                  <h3 className="font-bold text-primary group-hover:text-secondary transition-colors mb-2 text-sm">
                    {r.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {r.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
