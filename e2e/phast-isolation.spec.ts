import { test, expect, type Browser } from '@playwright/test';

/**
 * PHAST — Playwright Headless Assertion Stress Testing, adapted.
 *
 * The original shape targets multi-tenant state isolation and realtime DOM
 * reactivity under load. Neither exists here: this is a single-tenant directory
 * with no websockets, so tenant-leak and reactivity tests would be testing
 * features the product does not have.
 *
 * What DOES need concurrent assertion here:
 *
 *   1. Auth isolation — protected surfaces must never serve content to an
 *      unauthenticated context, and must not start doing so just because a
 *      cached render exists from someone else's request.
 *   2. Render stability — the useCallback work means effect dependencies decide
 *      whether a page refetches forever. That failure is invisible to tsc,
 *      eslint and jest; it only appears as a browser hammering an endpoint.
 *
 * Both are asserted across many parallel contexts, because a single-threaded
 * pass cannot surface a cache or isolation problem.
 */

/** Parallel browser contexts. Enough to surface a shared-cache leak, small
 *  enough to stay CI-friendly. */
const CONCURRENCY = 8;

/**
 * Stress tests are inherently slower than the default per-test budget: eight
 * contexts each load a page and then sit idle twice to prove stability. Running
 * on the default 30s produced `browserContext.close: Test ended`, which reads
 * like a product failure but is only the harness running out of time.
 */
test.describe.configure({ timeout: 180_000 });

/** Surfaces that must never render content without a session. */
const PROTECTED = ['/dashboard/profile', '/dashboard/subscription', '/admin/barbers'];

/** Long enough for several render cycles and any retry to fire. */
const SETTLE_MS = 3500;

async function inParallelContexts<T>(
  browser: Browser,
  count: number,
  fn: (index: number, page: import('@playwright/test').Page) => Promise<T>,
): Promise<T[]> {
  const contexts = await Promise.all(
    Array.from({ length: count }, () => browser.newContext({ ignoreHTTPSErrors: true })),
  );
  try {
    return await Promise.all(
      contexts.map(async (context, index) => {
        const page = await context.newPage();
        return fn(index, page);
      }),
    );
  } finally {
    await Promise.all(contexts.map((c) => c.close()));
  }
}

test.describe('PHAST — auth isolation under parallel contexts', () => {
  test('protected routes never render content to an anonymous context', async ({ browser }) => {
    const results = await inParallelContexts(browser, CONCURRENCY, async (index, page) => {
      const target = PROTECTED[index % PROTECTED.length];
      const response = await page.goto(target, { waitUntil: 'domcontentloaded' });
      const status = response?.status() ?? 0;
      const url = page.url();
      const body = await page.locator('body').innerText().catch(() => '');
      return { target, status, url, body };
    });

    for (const r of results) {
      // Either bounced to an auth surface, or served an empty shell — never a
      // populated dashboard. A leak here means one session's render reached a
      // context that never authenticated.
      const landedOnAuth = /\/(login|register)/.test(r.url);
      const leaked = /Manage Billing|Setup Fee|Verification Queue|Grant Founding/i.test(r.body);

      expect(leaked, `${r.target} leaked authenticated content to an anonymous context`).toBe(false);
      expect(
        landedOnAuth || r.body.trim().length < 2000,
        `${r.target} rendered a substantial page without a session (status ${r.status})`,
      ).toBe(true);
    }
  });

  test('parallel anonymous API reads never return another account\'s data', async ({ browser }) => {
    const results = await inParallelContexts(browser, CONCURRENCY, async (_i, page) => {
      const res = await page.request.get('/api/barbers/profile');
      return { status: res.status(), body: (await res.text()).slice(0, 400) };
    });

    for (const r of results) {
      expect(r.status, 'anonymous profile read should be rejected').toBeGreaterThanOrEqual(400);
      expect(r.body).not.toContain('setupFeePaidAt');
      expect(r.body).not.toContain('stripeCustomerId');
    }
  });
});

test.describe('PHAST — render stability under parallel contexts', () => {
  test('/search does not refetch while idle in any context', async ({ browser }) => {
    const results = await inParallelContexts(browser, CONCURRENCY, async (_i, page) => {
      const calls: string[] = [];
      page.on('request', (req) => {
        if (req.url().includes('/api/barbers')) calls.push(req.url());
      });

      await page.goto('/search', { waitUntil: 'domcontentloaded' });

      // Wait for the page to actually fetch before measuring stability. A fixed
      // sleep is not enough here: under parallel contexts the server is slower,
      // and measuring too early reports 0 -> 1 as "kept refetching" when it is
      // really just the first load arriving late.
      await expect
        .poll(() => calls.length, { timeout: 20_000, message: 'page never fetched barbers' })
        .toBeGreaterThan(0);

      await page.waitForTimeout(SETTLE_MS);
      const afterMount = calls.length;
      await page.waitForTimeout(SETTLE_MS);
      return { afterMount, afterIdle: calls.length };
    });

    for (const [i, r] of results.entries()) {
      expect(
        r.afterIdle,
        `context ${i} kept refetching while idle: ${r.afterMount} -> ${r.afterIdle}`,
      ).toBe(r.afterMount);
      // Dev StrictMode double-invokes effects, so allow a small mount burst —
      // what must not happen is unbounded growth.
      expect(r.afterMount, `context ${i} issued ${r.afterMount} fetches on mount`).toBeLessThanOrEqual(6);
    }
  });
});
