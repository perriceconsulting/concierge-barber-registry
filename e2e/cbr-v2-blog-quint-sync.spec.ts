import { test, expect } from '@playwright/test';

/**
 * Quint-Sync audit for /blog and /blog/[slug].
 *
 * Verifies the 5-pillar optimization checklist (AIO / AEO / SEO / NLP / SGE +
 * semantic intent). Each pillar maps to specific assertions:
 *
 *   SEO   — meta title, description, canonical, Open Graph
 *   AIO   — structured headings, semantic <article>, entity-rich copy
 *   AEO   — answerable headings, JSON-LD Article/Blog, BreadcrumbList
 *   NLP   — inLanguage declared, named entities in JSON-LD
 *   SGE   — SpeakableSpecification regions, articleBody in JSON-LD
 *
 * Reads JSON-LD payloads by parsing <script type="application/ld+json">.
 */

async function readJsonLdBlocks(page: import('@playwright/test').Page) {
  return await page.$$eval('script[type="application/ld+json"]', (els) =>
    els.map((el) => {
      try {
        return JSON.parse(el.textContent || '{}');
      } catch {
        return { __invalid: el.textContent };
      }
    }),
  );
}

test.describe('/blog (listing) — Quint-Sync audit', () => {
  test('SEO: meta title + description + canonical present', async ({ page }) => {
    await page.goto('/blog');
    await expect(page).toHaveTitle(/concierge barber registry blog|expert guides/i);
    const desc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(desc).toBeTruthy();
    expect(desc!.length).toBeGreaterThan(50);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toContain('/blog');
  });

  test('SEO: per-category canonical updates with ?category= filter', async ({ page }) => {
    await page.goto('/blog?category=for_clients');
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toContain('category=for_clients');
  });

  test('SGE: Blog JSON-LD present with blogPost entries', async ({ page }) => {
    await page.goto('/blog');
    const blocks = await readJsonLdBlocks(page);
    const blog = blocks.find((b) => b['@type'] === 'Blog');
    expect(blog, 'a Blog JSON-LD block must be emitted').toBeTruthy();
    expect(blog.inLanguage).toBe('en-US');
    expect(blog.publisher?.['@type']).toBe('Organization');
    expect(Array.isArray(blog.blogPost)).toBe(true);
  });

  test('AEO: BreadcrumbList JSON-LD present on listing', async ({ page }) => {
    await page.goto('/blog');
    const blocks = await readJsonLdBlocks(page);
    const crumbs = blocks.find((b) => b['@type'] === 'BreadcrumbList');
    expect(crumbs).toBeTruthy();
    expect(crumbs.itemListElement.length).toBeGreaterThanOrEqual(2);
  });

  test('AIO/NLP: H1 is entity-rich (names topic + brand), one H1 only', async ({ page }) => {
    await page.goto('/blog');
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);
    const h1 = await page.locator('h1').textContent();
    expect(h1).toMatch(/concierge barber registry|barber|grooming/i);
  });

  test('a11y: filter pills have aria-current/aria-selected when active', async ({ page }) => {
    await page.goto('/blog?category=for_barbers');
    // The active filter pill should carry aria-current="page"
    const active = page.locator('[aria-current="page"]');
    await expect(active.first()).toBeVisible();
    await expect(active.first()).toContainText(/for barbers/i);
  });
});

test.describe('/blog/[slug] (article) — Quint-Sync audit', () => {
  test('an article slug exists to test against', async ({ page }) => {
    // Pull the first post link from the listing and use its slug for the
    // remaining tests. Avoids hardcoding a slug that might rotate.
    await page.goto('/blog');
    const firstLink = await page.locator('a[href^="/blog/"]').first().getAttribute('href');
    test.skip(!firstLink || firstLink === '/blog', 'no published blog posts to audit against');
  });

  test('SEO + AEO: article page emits BlogPosting + Breadcrumb + Speakable JSON-LD', async ({ page }) => {
    await page.goto('/blog');
    const firstLink = await page.locator('a[href^="/blog/"]').first().getAttribute('href');
    test.skip(!firstLink || firstLink === '/blog', 'no published blog posts');
    await page.goto(firstLink!);

    const blocks = await readJsonLdBlocks(page);
    const article = blocks.find((b) => b['@type'] === 'BlogPosting' || b['@type'] === 'Article');
    const crumbs = blocks.find((b) => b['@type'] === 'BreadcrumbList');
    const speakable = blocks.find((b) => b['@type'] === 'WebPage' && b.speakable);

    expect(article, 'BlogPosting JSON-LD required').toBeTruthy();
    expect(crumbs, 'BreadcrumbList JSON-LD required').toBeTruthy();
    expect(speakable, 'SpeakableSpecification required for SGE/voice readout').toBeTruthy();
  });

  test('NLP: article JSON-LD declares language + author + publisher', async ({ page }) => {
    await page.goto('/blog');
    const firstLink = await page.locator('a[href^="/blog/"]').first().getAttribute('href');
    test.skip(!firstLink || firstLink === '/blog', 'no published blog posts');
    await page.goto(firstLink!);

    const blocks = await readJsonLdBlocks(page);
    const article = blocks.find((b) => b['@type'] === 'BlogPosting' || b['@type'] === 'Article');
    expect(article.inLanguage).toBe('en-US');
    expect(article.author).toBeTruthy();
    expect(article.publisher?.name).toBeTruthy();
    expect(article.mainEntityOfPage?.url).toContain('/blog/');
  });

  test('SGE: articleBody present in JSON-LD for AI extraction', async ({ page }) => {
    await page.goto('/blog');
    const firstLink = await page.locator('a[href^="/blog/"]').first().getAttribute('href');
    test.skip(!firstLink || firstLink === '/blog', 'no published blog posts');
    await page.goto(firstLink!);

    const blocks = await readJsonLdBlocks(page);
    const article = blocks.find((b) => b['@type'] === 'BlogPosting' || b['@type'] === 'Article');
    expect(article.articleBody, 'articleBody is a documented Google ranking signal').toBeTruthy();
    expect(article.articleBody.length).toBeGreaterThan(200);
  });

  test('AEO: article has <article> wrapper + <time dateTime> + <header>', async ({ page }) => {
    await page.goto('/blog');
    const firstLink = await page.locator('a[href^="/blog/"]').first().getAttribute('href');
    test.skip(!firstLink || firstLink === '/blog', 'no published blog posts');
    await page.goto(firstLink!);

    await expect(page.locator('article')).toBeVisible();
    await expect(page.locator('article header')).toBeVisible();
    const timeEl = page.locator('article time[datetime]').first();
    await expect(timeEl).toBeVisible();
  });

  test('AIO: article has exactly one H1', async ({ page }) => {
    await page.goto('/blog');
    const firstLink = await page.locator('a[href^="/blog/"]').first().getAttribute('href');
    test.skip(!firstLink || firstLink === '/blog', 'no published blog posts');
    await page.goto(firstLink!);

    const h1Count = await page.locator('article h1').count();
    expect(h1Count).toBe(1);
  });
});
