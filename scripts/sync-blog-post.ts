/**
 * Push one post from src/content/blog into the database, by slug.
 *
 *   npx tsx scripts/sync-blog-post.ts hot-towel-shave-experience-guide
 *
 * Why this exists: seed-blog.ts skips any slug that already has a row, so once
 * a post is in the database, editing src/content/blog/index.ts changes nothing
 * on the site. That's the right default — the admin UI edits rows directly and
 * a blanket re-seed would clobber that work — but it leaves no way to publish a
 * source-file edit at all.
 *
 * This is the deliberate, one-at-a-time reconciliation: you name the post you
 * mean to overwrite, and only that post's content fields are replaced. Status
 * and publishedAt are left alone so syncing can't silently publish a draft or
 * move a publication date.
 */
import { PrismaClient } from '@prisma/client';
import { blogPosts } from '../src/content/blog/index';

const prisma = new PrismaClient();

const categoryMap: Record<string, 'for_clients' | 'for_barbers' | 'industry'> = {
  'for-clients': 'for_clients',
  'for-barbers': 'for_barbers',
  industry: 'industry',
};

async function main() {
  const slug = process.argv[2];

  if (!slug) {
    console.error('Usage: npx tsx scripts/sync-blog-post.ts <slug>');
    process.exit(1);
  }

  const source = blogPosts.find((post) => post.slug === slug);
  if (!source) {
    console.error(`No post with slug "${slug}" in src/content/blog/index.ts`);
    process.exit(1);
  }

  const existing = await prisma.blogPost.findUnique({ where: { slug } });
  if (!existing) {
    console.error(
      `No database row for "${slug}". Use scripts/seed-blog.ts to create it first.`
    );
    process.exit(1);
  }

  const updated = await prisma.blogPost.update({
    where: { slug },
    data: {
      title: source.title,
      description: source.description,
      content: source.content,
      keywords: source.keywords,
      category: categoryMap[source.category],
      readingTime: source.readingTime,
      author: source.author,
    },
  });

  const delta = updated.content.length - existing.content.length;
  console.log(`Synced ${slug}`);
  console.log(`  content: ${existing.content.length} -> ${updated.content.length} chars (${delta >= 0 ? '+' : ''}${delta})`);
  console.log(`  status left as: ${updated.status}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
