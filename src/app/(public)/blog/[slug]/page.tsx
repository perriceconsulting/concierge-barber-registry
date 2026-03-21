import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Container } from '@/components/layout/container';
import { ArticleStructuredData } from '@/components/seo/article-structured-data';
import { getPostBySlug, getRelatedPosts, getAllPosts } from '@/content/blog';

export async function generateStaticParams() {
  return getAllPosts().map(post => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: 'Article Not Found' };

  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    openGraph: {
      title: `${post.title} | Concierge Barber Registry`,
      description: post.description,
      url: `/blog/${post.slug}`,
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt || post.publishedAt,
      authors: [post.author],
      section: post.categoryLabel,
      tags: post.keywords,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
    },
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const related = getRelatedPosts(slug, 3);

  return (
    <div className="min-h-[calc(100vh-16rem)] py-16">
      <ArticleStructuredData post={post} />
      <Container>
        <article className="max-w-3xl mx-auto">
          {/* Breadcrumb */}
          <nav className="text-sm text-muted-foreground mb-6">
            <Link href="/blog" className="hover:text-primary">Blog</Link>
            <span className="mx-2">/</span>
            <Link href={`/blog?category=${post.category}`} className="hover:text-primary">
              {post.categoryLabel}
            </Link>
          </nav>

          {/* Header */}
          <header className="mb-8">
            <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-secondary/10 text-secondary mb-4">
              {post.categoryLabel}
            </span>
            <h1 className="text-4xl font-bold text-primary mb-4">{post.title}</h1>
            <p className="text-lg text-muted-foreground mb-4">{post.description}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground border-b border-gray-200 pb-6">
              <span>{post.author}</span>
              <span>·</span>
              <time dateTime={post.publishedAt}>
                {new Date(post.publishedAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
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
              prose-a:text-secondary prose-a:no-underline hover:prose-a:underline"
            dangerouslySetInnerHTML={{ __html: post.content }}
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
