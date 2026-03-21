import { PrismaClient } from '@prisma/client';
import { blogPosts } from '../src/content/blog/index';

const prisma = new PrismaClient();

const categoryMap: Record<string, 'for_clients' | 'for_barbers' | 'industry'> = {
  'for-clients': 'for_clients',
  'for-barbers': 'for_barbers',
  'industry': 'industry',
};

async function main() {
  console.log(`Seeding ${blogPosts.length} blog posts...`);

  let created = 0;
  let skipped = 0;

  for (const post of blogPosts) {
    const existing = await prisma.blogPost.findUnique({
      where: { slug: post.slug },
    });

    if (existing) {
      console.log(`  SKIP: ${post.slug} (already exists)`);
      skipped++;
      continue;
    }

    await prisma.blogPost.create({
      data: {
        slug: post.slug,
        title: post.title,
        description: post.description,
        content: post.content,
        keywords: post.keywords,
        category: categoryMap[post.category],
        status: 'published',
        readingTime: post.readingTime,
        author: post.author,
        publishedAt: new Date(post.publishedAt),
      },
    });

    console.log(`  CREATE: ${post.slug}`);
    created++;
  }

  console.log(`\nDone: ${created} created, ${skipped} skipped`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
