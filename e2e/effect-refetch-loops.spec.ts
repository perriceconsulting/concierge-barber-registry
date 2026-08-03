import { test, expect } from '@playwright/test';

/**
 * Guards the useCallback work done on 2026-08-03.
 *
 * Six pages had `useEffect(() => { fetchX(); }, [])` with `fetchX` missing from
 * the dependency array. The fix wraps each fetcher in `useCallback` and depends
 * on it — which is correct only while the callback's own dependencies are
 * stable. If someone later adds an unstable dependency (an object literal, an
 * unmemoized context value, an inline function), the callback changes identity
 * on every render and the effect refetches forever.
 *
 * That failure is invisible to tsc, eslint and jest: the types are fine, the
 * lint rule is satisfied, and there's no assertion to break. It only shows up
 * as a browser hammering an endpoint. Hence a browser test.
 */

// Long enough for several render cycles and any retry/debounce to fire.
const SETTLE_MS = 4000;

// Dev builds run effects twice under StrictMode, so a healthy page can
// legitimately issue more than one request on mount. What must not happen is
// unbounded growth while the page sits idle.
const MAX_FETCHES_ON_MOUNT = 6;

async function countMatchingRequests(
  page: import('@playwright/test').Page,
  path: string,
  urlFragment: string
) {
  const seen: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes(urlFragment)) seen.push(request.url());
  });

  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(SETTLE_MS);
  const afterMount = seen.length;

  // Second observation window: with the page idle, the count must not move.
  await page.waitForTimeout(SETTLE_MS);
  return { afterMount, afterIdle: seen.length };
}

test.describe('effect dependencies do not cause refetch loops', () => {
  test('/search does not refetch barbers while idle', async ({ page }) => {
    const { afterMount, afterIdle } = await countMatchingRequests(
      page,
      '/search',
      '/api/barbers'
    );

    expect(
      afterMount,
      `/search issued ${afterMount} barber fetches on mount`
    ).toBeGreaterThan(0);
    expect(afterMount).toBeLessThanOrEqual(MAX_FETCHES_ON_MOUNT);
    expect(
      afterIdle,
      `/search kept refetching while idle: ${afterMount} -> ${afterIdle}`
    ).toBe(afterMount);
  });

  test('a barber profile does not refetch while idle', async ({ page, request }) => {
    const response = await request.get('/api/barbers?limit=1');
    const body = await response.json();
    const slug = body?.data?.barbers?.[0]?.slug;
    test.skip(!slug, 'no barber profiles seeded to exercise the profile page');

    const { afterMount, afterIdle } = await countMatchingRequests(
      page,
      `/barbers/${slug}`,
      `/api/barbers/${slug}`
    );

    expect(afterMount).toBeLessThanOrEqual(MAX_FETCHES_ON_MOUNT);
    expect(
      afterIdle,
      `/barbers/${slug} kept refetching while idle: ${afterMount} -> ${afterIdle}`
    ).toBe(afterMount);
  });
});
