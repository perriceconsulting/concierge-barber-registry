# Concierge Barber Registry

Next.js 16 (App Router) · React 19 · TypeScript · Prisma 6 · Neon PostgreSQL · Tailwind v4 · Vercel

---

## DOSI — the code standard

> **Canonical origin: `~/.claude/CLAUDE.md`**, which applies DOSI and PHAST to every project
> by default. The pillar-and-caveat text below is a deliberate *reconciled copy* so this
> repo stays self-contained — a collaborator, a CI job, or a cloud agent reads the repo, not
> Percy's home directory. Edit the standard there first, then sync here. Everything *below*
> the pillars — the tables, the ledger, the landmines — is this project's own instantiation
> and has no copy anywhere.

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
| Blog post content | [src/content/blog/index.ts](src/content/blog/index.ts) → `blog_posts` table (see below) |
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

### The test suite

`npm test` runs **two jest projects**, defined in [jest.config.js](jest.config.js):

| Project | Environment | Scope |
|---|---|---|
| `unit` | jsdom | `src/__tests__/unit/**` |
| `integration` | **node** | `src/__tests__/integration/**` |

The environment split is not cosmetic. Route handlers and middleware need real Web Fetch globals
(`Request`/`Response`/`Headers`); jsdom doesn't provide them, and that alone made every API suite
fail to load with `ReferenceError: Request is not defined`.

**212 tests across 13 suites.** Keep it there. Until 2026-08-03 the config matched only
`__tests__/unit`, so the integration suites — `api-security`, `license-verification`,
`role-based-access`, `login`, both `auth-protection` — had *never executed*. `npm run
test:integration` matched 0 tests and exited clean, which is worse than failing.

Real E2E is the Playwright suite in top-level [e2e/](e2e/), run **locally** via
`npm run test:e2e` against a live server — it is deliberately not part of CI.
[.github/workflows/test.yml](.github/workflows/test.yml) has no Postgres service
and can't start the HTTPS dev server (`/certificates` is gitignored, correctly),
so the e2e step failed on every run for months. A permanently red build is worse
than a smaller green one: nobody reads it. CI runs lint + jest; e2e is a local
gate until someone adds a service container and a seed. One of those specs,
[effect-refetch-loops.spec.ts](e2e/effect-refetch-loops.spec.ts), exists because a broken effect
dependency is invisible to tsc, eslint *and* jest — the types check, the lint rule is satisfied,
and nothing asserts. It only shows up as a browser hammering an endpoint, so that's where it's
caught. There is no jest "e2e" directory anymore; the one that
existed mocked the database, email, and filesystem, so nothing about it was end-to-end.

Coverage is scoped to `src/lib` and `src/hooks` — the code these suites actually exercise —
because measuring all of `src` counted API routes and React pages that only Playwright touches,
which made the 80% threshold unreachable and `npm run test:ci` fail at the gate regardless of test
state. Thresholds are a **ratchet** set just under measured coverage. Raise them as coverage
grows; never lower them to make a build pass.

**Lesson worth keeping:** a test that has never run is not a safety net, it's an unvalidated
claim. Reviving these found four product defects (see the ledger) — and three tests whose
assertions were simply wrong, including one that would have pressured the login route into leaking
an account-enumeration oracle. When a never-run test disagrees with shipped behavior, the test does
not automatically win.

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

### PHAST — Playwright Headless Assertion Stress Testing

**A platform tool.** Pronounced *"fast."* Write it PHAST or FAST — never "P-H-A-S-T."

```
npm run phast           # headless, 8 parallel contexts
npm run phast:headed    # visible browser, 1 worker
```

The generic PHAST shape targets multi-tenant state isolation and realtime DOM reactivity
under load. **Two of its five pillars don't apply here** and were deliberately not built:
this is a single-tenant directory with no websockets, so tenant-leak and reactivity specs
would assert against features the product doesn't have. That's the I caveat — don't invent
domain vocabulary the product doesn't use.

What [e2e/phast-isolation.spec.ts](e2e/phast-isolation.spec.ts) does assert, across
`CONCURRENCY = 8` contexts, because one thread cannot surface a cache or isolation fault:

1. Protected routes never render content to an anonymous context.
2. Parallel anonymous API reads never return another account's data.
3. `/search` doesn't refetch while idle in any context.

Two things learned building it, both of which read as product failures and aren't:

- **`browserContext.close: Test ended` is a timeout, not a leak.** Eight contexts loading
  and then idling twice blows Playwright's 30s default. The suite sets
  `test.describe.configure({ timeout: 180_000 })`.
- **Measure stability only after the first fetch lands.** A fixed sleep reported `0 -> 1`
  as "kept refetching" when it was really the first load arriving late under parallel
  load. Gate on `expect.poll` before sampling.

`phast:headed` pins `--workers=1` on purpose: headed mode still opens 8 contexts, and at
the default worker count that's ~16 windows fighting for focus. Anything after `--` on
`npm run phast` passes through to Playwright (`npm run phast -- --debug`).

**The stress idea also lives outside the browser.** The founding-seat race is asserted in
[src/\_\_tests\_\_/integration/billing/founding-seat-race.test.ts](src/__tests__/integration/billing/founding-seat-race.test.ts)
— deterministic, milliseconds, tests the invariant rather than a rendering of it. Put a
PHAST concern in jest when the risk is a data invariant; put it in Playwright when the risk
only exists in a browser.

### The founding-seat race (fixed 2026-08-04)

`resolveSetupFeeAmountCents` counted seats at **checkout creation**, but `setupFeePaidAt`
is only written by the **webhook**. The count therefore stayed stale for as long as an
applicant spent on Stripe's payment page — fifteen concurrent applicants would all be told
they were Founding Members. Under the current model each extra one is $50 under-charged
*plus* a 365-day free year, so eleven concurrent claims could give away ~$1,745 with nobody
doing anything wrong.

`claimSetupFeeSeat` ([src/lib/subscription.ts](src/lib/subscription.ts)) replaces it:
counts paid-**or**-reserved seats and writes the reservation inside the *same*
`isolationLevel: 'Serializable'` transaction, so two claims on the last seat can't both
win. Retries once — a serialization conflict here is the desired outcome, and the loser
re-reads and quotes standard.

- `setupFeeReservedAt` holds a seat for `SEAT_RESERVATION_MINUTES` (30), so an abandoned
  checkout releases it. If that's ever raised to something large, ten abandoned
  applications exhaust the founding tier permanently.
- The count excludes self, or re-entering checkout bumps you to the standard rate.
- `resolveSetupFeeAmountCents` survives as a **read-only preview for display**. Don't call
  it to start a checkout.

---

### ⚠ Blog content lives in two places

The site renders posts from the **`blog_posts` table**, not from
[src/content/blog/index.ts](src/content/blog/index.ts). That file is the seed source, and
[scripts/seed-blog.ts](scripts/seed-blog.ts) **skips any slug that already has a row**.

So editing the TS file changes nothing on the site once a post exists. That skip is the right
default — the admin UI edits rows directly, and a blanket re-seed would clobber that work — but it
means the two copies drift silently and the file looks authoritative when it isn't.

To publish a source-file edit, name the post explicitly:

```
npx tsx scripts/sync-blog-post.ts <slug>
```

It overwrites only that post's content fields, and deliberately leaves `status` and `publishedAt`
alone so a sync can never publish a draft or move a publication date. Check for drift before
running it if the post may have been edited in the admin UI — the sync is last-write-wins.

### Stripe webhook events — six, not five

The endpoint must listen to all of these. Registering fewer fails silently: Stripe
simply never sends the event and nothing errors.

| Event | Without it |
|---|---|
| `checkout.session.completed` | payment recorded nowhere; barber charged with no access |
| `customer.subscription.updated` | local status drifts from Stripe permanently |
| `customer.subscription.deleted` | cancelled barbers keep their benefits |
| `invoice.payment_failed` | failed payments look healthy; dunning never starts |
| `invoice.paid` | a barber who fixes their card stays stuck in `past_due` |
| `payment_method.attached` | **card funding is never recorded** — see below |

### Prepaid cards: stated, instrumented, not blocked

`PAYMENT_POLICY` ([src/lib/copy/v2.ts](src/lib/copy/v2.ts)) is the single origin for
"prepaid cards are not accepted", consumed by Checkout's `custom_text` on both
sessions and the pricing block on `/pro`.

**Nothing in this codebase can refuse a prepaid card.** The card is entered on
Stripe-hosted Checkout or the Billing Portal, so `card.funding` is only visible
after the fact. What backs the policy up is instrumentation: `payment_method.attached`
writes funding, brand, last4 and country to the audit log and flags prepaid ones as
`payment_method.prepaid_flagged`.

No auto-detach, no auto-refund — measure before enforcing, per the Optimize caveat.
Escalate to a Radar rule (`:card_funding: = 'prepaid'`, needs Radar for Fraud Teams)
once the audit log shows it is a real problem.

**If that flagging is ever removed, remove the copy too.** Stating a rule the
platform does not act on is the product claiming something it does not do.

Also note the setup-fee checkout sets `setup_future_usage: 'off_session'`. Without
it the barber pays the fee and leaves **no payment method on the customer**, so the
30-day trial created at approval has nothing to bill when it ends — the renewal
invoice fails and the subscription sits in `past_due` having never collected a cent.

### Stripe env vars are a copy — reconcile them

**Stripe owns price and product identity.** The `STRIPE_PRICE_*` env vars are a
*cache* of it, which is exactly the case the Single Source caveat covers: a copy is
fine, but it has to reconcile back to the origin. Nothing reconciled these, so they
drifted three ways at once and none of it surfaced as an error — Development held
live-mode ids a test key can't resolve, Production held ids from a retired account,
and neither had the `VERIFIED_*` ids the approval flow needs.

```
npm run verify:stripe                       # checks .env.local
npx tsx scripts/verify-stripe-env.ts <file> # checks a pulled env file
```

It resolves the account from the key, then asks Stripe whether every configured
price id actually exists there. Run it after touching any Stripe env var. Exits
non-zero, so it can gate a release.

Two structural facts worth keeping in mind:

- **Test and live are separate accounts**, not two modes of one (sandbox
  `acct_1U0S7fGvFqeZpzQR`, live `acct_1U0S7M2dW3lY8so1`). An id minted in one never
  resolves in the other. Stripe embeds the account in every id, so
  `price_…GvFqeZpzQR…` is visibly sandbox.
- **Amounts do not all live in Stripe.** The subscription price does; the setup fee
  does not — it is built inline from `VETTING_FEE_PRICING`
  ([src/lib/copy/v2.ts](src/lib/copy/v2.ts)), and the $49-vs-$99 cutover is decided
  by counting paid rows in the database. `STRIPE_PRICE_SETUP_*` exist but no code
  reads them.

### Blog images: masters in, stamped copies out

Blog photos are watermarked with the brand mark for IP. The pipeline is
one-directional and that's what keeps it safe to re-run:

```
assets/blog-sources/   raw full-res photos (gitignored, local only)
        ↓ crop to 1376x768, quality 82
assets/blog-masters/   normalized, UNstamped — committed
        ↓ npx tsx scripts/watermark-blog-images.ts
public/blog/           stamped, what the site serves — committed
```

**Add new photos to `assets/blog-masters/`, never to `public/blog/`.** The script
reads masters and writes public, so it never reads its own output — re-running it
after a logo change restamps from clean originals instead of layering a second
watermark on the first. Anything dropped only into `public/blog/` gets
overwritten silently.

The mark itself is `assets/brand-mark.png`, a circular badge built from
`public/brandlogo.jpeg`. Circular was chosen deliberately: the logo is a JPEG with
no alpha, and a round crop makes the dark background read as part of the badge
instead of a rectangle pasted onto the photo.

### Two brand marks, on purpose

`APP_CONFIG.logo` (`/brandlogo.jpeg`) drives the on-page logo and the blog
watermark. The favicon, PWA icons and OG image are generated from a *different*
file, `public/brand-logo.jpeg`, by `scripts/generate-icons.mjs`, and are
intentionally still on the older mark. This is not drift — don't "fix" it by
pointing both at one file without asking.

One trap if you ever do swap a logo's contents while keeping its filename: Next's
image optimizer caches derivatives per source URL and holds them in memory.
Clearing `.next/cache/images` is not enough; the dev server needs a restart, and
in production the optimizer can serve the old mark until its cache turns over.
Changing the *path* avoids this entirely.

### Product defects the revived suites found

- **`lib/upload-filename.ts`** — the sanitizer replaced path separators but left `..` intact, so
  `../../../etc/passwd.jpg` became `.._.._.._etc_passwd.jpg`. Not exploitable against Vercel Blob
  (keys aren't filesystem paths), but the function shouldn't depend on the storage backend to be
  safe, and this path *was* filesystem-backed. Now its own module so a pure string function no
  longer drags the Blob SDK into every importer.
- **`lib/api/rate-limit.ts`** — the cleanup `setInterval` wasn't `unref`'d and held the event loop
  open, hanging any Node process that imported it.
- **`lib/api/middleware.ts`** — `Bearer` was matched case-sensitively; RFC 7235 makes the scheme
  case-insensitive, so `bearer <token>` was rejected outright.
- **`jest.setup.js`** — the Prisma mock hand-listed 4 of the schema's 26 models. Replaced with a
  Proxy that vivifies on access, so `schema.prisma` stays the only source and there's no mirror to
  drift.

## Working agreements

- Run the test suite before any commit or push (`npm test`). This is now a meaningful check.
- **The pre-commit hook works — don't reach for `--no-verify`.** It used to SIGKILL on Windows
  because [.lintstagedrc.js](.lintstagedrc.js) declared three overlapping globs over the same
  `.ts` files, and lint-staged runs *matchers* concurrently — a full `tsc --noEmit` and a jest
  worker pool starting together. Collapsed to one matcher per language (commands within a matcher
  run in sequence), plus `--concurrent false` in the hook.
- `schema.prisma` is ahead of migration history — `prisma migrate dev` will try to reset. Use the
  diff workaround for new schema changes.
- Route handlers wrapped in `withAuth()` need an optional context param:
  `context?: { params: Promise<...> }` (Next.js 16 Promise-based params).
- Toast variants are `'default' | 'error' | 'success' | 'warning'` — there is no `'destructive'`.
- `RateLimitError` is an instance, not a class: `throw RateLimitError`.
- Prisma `Bytes` fields want `new Uint8Array(buf)`, not a raw `Buffer`.
- Prisma JSON fields type as `Prisma.InputJsonValue`, not `Record<string, any>`.
