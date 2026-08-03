# Concierge Barber Registry

Next.js 16 (App Router) · React 19 · TypeScript · Prisma 6 · Neon PostgreSQL · Tailwind v4 · Vercel

---

## DOSI — the code standard

Four pillars, and the caveats are the fifth thing — not decoration on the pillars but the part
that decides cases. A pillar tells you what to want; its caveat tells you when wanting it harder
makes the code worse. When DOSI and a shortcut disagree, DOSI wins. When two pillars disagree,
the caveats decide. A change that satisfies a pillar while violating its caveat is not compliant.

### D — DRY

Centralize domain logic and validation into shared utilities and hooks. Compose UI shells out of
`cn()` ([src/lib/utils.ts](src/lib/utils.ts)) and the primitives in [src/components/ui/](src/components/ui/)
instead of copy-pasting markup. Validation belongs in [src/lib/validations/](src/lib/validations/),
not inline in a route handler or a form component.

**Caveat (rule-of-three):** tolerate duplication over a premature or wrong abstraction. Extract on
the *third* repeat, not the second. Two similar-looking blocks that are drifting apart are two
blocks, not a missing helper.

### O — Optimize

The main Next.js lever is React Server Components: fetch on the server, ship less client JS. Do not
add `"use client"` to a component that has no hooks, no event handlers, and no browser APIs — push
the directive down to the smallest interactive leaf instead of hoisting it to the page. Keep state
and context scoped as narrowly as it will go. Watch for N+1 queries: prefer one Prisma query with
`include`/`select` over a loop of `findUnique`.

**Caveat:** optimize where instrumented, never by guess. A profile, a query log, or a bundle-size
delta justifies the change; a hunch does not.

*Current baseline: 56 of 120 `.tsx` files carry `"use client"` (was 60). That number is the metric —
it should go down over time, and any PR that raises it should say why. The audit that produced it
looks for files with the directive but no hook call, no `on*` handler, no browser API, no context
provider, no timer, and no `fetch` — those are client components by accident, which is a semantic
error before it's a performance one.*

### S — Single Source

One canonical origin for schemas, contracts, config, and constants. Everything downstream derives
from it.

| Concern | Canonical origin |
|---|---|
| Persisted data | Neon via Prisma — [prisma/schema.prisma](prisma/schema.prisma), client in [src/lib/db.ts](src/lib/db.ts) |
| Request/response shapes | Zod schemas in [src/lib/validations/](src/lib/validations/) |
| Plan tiers & feature limits | `TIER_LIMITS` in [src/lib/subscription.ts](src/lib/subscription.ts) |
| Pricing & marketing copy | [src/lib/copy/v2.ts](src/lib/copy/v2.ts), [src/lib/copy/faqs.ts](src/lib/copy/faqs.ts) |
| Specialty / niche content | [src/data/specialty-content.ts](src/data/specialty-content.ts) |
| SEO metadata & canonicals | [src/lib/seo/](src/lib/seo/) |
| API errors & rate limits | [src/lib/api/](src/lib/api/) |
| Design tokens | `@theme` block in [src/app/globals.css](src/app/globals.css) |

**Color rule — three tiers.** All tokens live in the `@theme` block of
[src/app/globals.css](src/app/globals.css). Components only ever type tier 2 or tier 3.

1. **Palette** — `--color-cbr-gold`, `--color-cbr-obsidian`, raw hex. Never typed in a component;
   exists so tiers 2 and 3 have something to point at.
2. **Surface pairs** — the contrast contract: `bg-background`/`text-foreground`,
   `bg-card`/`text-card-foreground`, `bg-muted`/`text-muted-foreground`, `border-border`.
   Reach here by default.
3. **Roles** — added only where a role is genuinely distinct from its surface pair.
   Today that is exactly one: `text-heading` (headings) vs `text-primary` (links, chips, CTA
   fills). Both are gold right now; they are separate tokens so either can move without a sweep.

Never raw palette classes — `text-slate-400`, `text-gray-300`, `bg-gray-200`. **This is enforced**
by a `no-restricted-syntax` rule in [eslint.config.mjs](eslint.config.mjs), which also blocks
`text-muted`. Brand colors that carry meaning are the legitimate exception: disable inline with a
comment naming the brand, as the outreach console does.

**Do not add `text-body`** — `text-foreground` already means that, and renaming it would be the
"better word that matches nothing" case pillar I warns about. **Do not add `text-muted`** —
`--color-muted` is a *surface* (#1a1a1a, 75 uses as `bg-muted`), so Tailwind v4 already generates
`text-muted` as near-black text. If you need a third text weight, call it `text-subtle`.

**Caveat:** optimistic and local copies are fine — an optimistic UI update, a cached derived value,
a form's draft state — but they must reconcile back to the canonical origin. A local copy that never
reconciles is a second source of truth.

### I — Semantic Intent

File, folder, and function names mirror the domain, not the mechanism: `suspendBarber`, not
`handleUpdate2`. Types are explicit at module boundaries — exported functions declare their
parameter and return types rather than leaning on inference. Prefer self-documenting code over
dense or clever abstractions; a reader who knows barbering but not this codebase should be able to
follow the happy path.

**Caveat:** semantic naming describes the domain as it is, not as we wish it were. Don't invent
domain vocabulary the product doesn't use, and don't rename an established concept mid-refactor
just because a better word exists — a name that matches the UI, the DB column, and how the team
actually talks beats a more elegant one that matches nothing. The corollary that bites most often:
a name that no longer matches the domain is a deletion candidate, not a rename candidate. If the
product stopped selling tiered plans, a `PricingTable` describing tiers doesn't need better
names — it needs to be gone.

---

## DOSI ledger

### Resolved 2026-08-03

- **S — `text-primary` was doing double duty** across 91 headings and 25 interactive elements.
  Split into `text-heading` (109 sites migrated) and `text-primary` (110 remaining, interactive
  only). One deliberate exception: the card title at
  [src/app/(public)/specialties/page.tsx:45](<src/app/(public)/specialties/page.tsx#L45>) keeps
  `group-hover:text-primary` — that hover *is* the interactive brand color, not a heading color.
- **D — star renderer duplicated three times.** Rule-of-three tripped, so it was extracted to
  [src/components/ui/star-rating.tsx](src/components/ui/star-rating.tsx) and the three local
  `renderStars` helpers deleted. The shared version also fixed things the copies got wrong: it
  clamps out-of-range ratings, rounds fractional ones itself (callers no longer pass
  `Math.round(...)`), and exposes one labelled `role="img"` instead of five loose glyphs to a
  screen reader.
- **S — channel identity defined twice** in the outreach console: once in `STATUS_BADGE_CLASS`,
  once inline across four near-identical `<a>` elements. Now one `OUTREACH_CHANNELS` map that both
  derive from, iterated via `CHANNEL_ORDER`.

- **O — four components were client-side by accident.** `"use client"` removed from
  [src/app/(public)/layout.tsx](<src/app/(public)/layout.tsx>) (renders `ToastProvider`, which is
  its own client boundary — the layout never needed to be one),
  [password-requirements.tsx](src/components/ui/password-requirements.tsx), and
  [upgrade-banner.tsx](src/components/subscription/upgrade-banner.tsx). All three are pure
  props-to-JSX with no hooks, handlers, or browser APIs. 60 → 56.
- **I — `PricingTable` deleted.** It rendered a Starter/Professional/Elite ladder at $29/$59, a
  pricing model CBR v2.0 replaced with the flat Verified Member tier (FEAT-001). It was also
  imported by nothing. Wiring its hand-copied `TIERS` array to the canonical `TIER_LIMITS` would
  have been the wrong fix — making a component that describes a product you no longer sell
  accurate about a product you no longer sell.
- **Enforcement added** so the color work can't silently regress: see the ESLint rule above.
  Repo-wide lint baseline is 253 pre-existing problems, unrelated to this work; the DOSI rule
  adds zero on top of it.

### Standing note: brand color ≠ theme token

The outreach console's `bg-purple-100` (IG), `bg-blue-100` (FB), `bg-pink-100` (TikTok) are **not**
palette-rule violations to be purged. The color *is* the meaning — that's pillar I, semantic intent
— so they correctly live outside the `@theme` palette. What the rule forbids is raw palette classes
standing in for *theme* roles (`text-gray-300` as body text). Two intentional raw classes remain in
that file, both channel-scoped.

Left alone deliberately: the light-on-dark look of the outreach badge palette
(`bg-amber-100 text-amber-800` and friends) is a design decision for a dark-themed admin surface,
not a DOSI question. Flag it if you want it restyled.

### ⚠ The integration and e2e suites do not run

[jest.config.js](jest.config.js) sets `testMatch: ['**/__tests__/unit/**/*.(test|spec).[jt]s?(x)']`.
Only the 6 unit suites execute. Everything under `src/__tests__/integration/` and
`src/__tests__/e2e/` — including `file-upload`, `api-security`, and `license-verification` — is
never run by `npm test`. `npm run test:integration` resolves to 0 matches, so it reports success
without executing anything.

So a green 95/95 says nothing about the security tests. Two independent things must change before
it does: point `testMatch` at those directories, then fix what breaks (they've never run, so
assume they fail).

At least one is vacuous on its own terms: `createMockFile(name, type, size)` in
[file-upload.test.ts](src/__tests__/integration/security/file-upload.test.ts) ignores its `size`
argument entirely — every mock file is 12 bytes of `'test content'`. The whole "File Size
Validation" block asserts on a limit it never approaches. ESLint didn't flag that `size` because
it's followed by a used parameter, and the default `args: after-used` only reports trailing ones.

This is a Single Source failure with teeth: the test names are the only place claiming this
behavior is covered, and they're wrong.

### Lint debt: 253 → 13

The 193 `no-explicit-any` were all `as any` mock casts in files tsconfig already excludes, so the
fix was scoping ESLint to match tsconfig (derived from `tsconfig.exclude`, not a second list) —
not typing them. The `_`-prefix convention the repo already used is now configured rather than
re-litigated at each site. Mechanical work cleared the rest: 18 JSX entity escapes, dead imports,
unused catch bindings via optional catch (`} catch {`), one stale `eslint-disable`.

The final 13 were then closed individually:

- **The refs error.** [useVisibilityRefetch.ts](src/hooks/useVisibilityRefetch.ts) wrote
  `callbackRef.current` during render. That breaks under StrictMode's double-invoke and under
  concurrent rendering, where a render can be discarded before commit. The write moved into its
  own effect; the listener effect still depends only on `throttleMs`/`enabled`, so an inline
  `onVisible` doesn't re-attach listeners.
- **6 `exhaustive-deps`**, all the same shape, all fixed with `useCallback` + the callback in the
  dep array. One trap worth knowing: in every one of these files the `useEffect` sat *above* the
  `fetchX` definition, so naming `fetchX` in the dep array would hit the temporal dead zone and
  throw at render — dep arrays evaluate during render, unlike the effect body. The definitions
  had to move above their effects. `showToast` is safe to depend on: it's `useCallback(…, [])`
  in the toast provider.
- **6 `<img>`.** Only one was a real conversion: [header.tsx](src/components/layout/header.tsx)
  rendered the *same* 32px avatar with `<Image>` on desktop and `<img>` on mobile — a copy that
  drifted. The other five are cases where `<img>` is correct, and now say so inline: html-to-image
  rasterization needs a plain tag with `crossOrigin` (canvas tainting), blob/data URLs from the
  file picker have nothing for the optimizer to fetch, and the admin license viewer has no known
  intrinsic dimensions. Per the O caveat, the admin photo grids were left alone rather than
  converted on a guess — they're already lazy-loaded and unmeasured.

**Lint is at zero.** Treat that as the floor: a warning now means something new, so fix it or
record why it's correct with a disable comment that names the reason.
- **S:** no multi-tenant scoping module exists (the app is single-tenant today). If tenancy lands,
  it gets exactly one accessor module and all queries route through it.

---

## Working agreements

- Run the test suite before any commit or push (`npm test`).
- `schema.prisma` is ahead of migration history — `prisma migrate dev` will try to reset. Use the
  diff workaround for new schema changes.
- Route handlers wrapped in `withAuth()` need an optional context param:
  `context?: { params: Promise<...> }` (Next.js 16 Promise-based params).
- Toast variants are `'default' | 'error' | 'success' | 'warning'` — there is no `'destructive'`.
- `RateLimitError` is an instance, not a class: `throw RateLimitError`.
- Prisma `Bytes` fields want `new Uint8Array(buf)`, not a raw `Buffer`.
- Prisma JSON fields type as `Prisma.InputJsonValue`, not `Record<string, any>`.
