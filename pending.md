# Pending Improvements

This file tracks known improvement work that has not been completed yet. When an item is finished, remove it from this file and add a dated entry to `changelog.md`.

## Deployment Safety

- Before applying migration `202609240001_remove_duplicate_creator_ownership`
  to any database that served the retired `/api/community` publishing routes,
  audit `MarketplaceCreator.userId`. If any row is non-null, reconcile it into
  the canonical `ownerUserId` profile and create any required audited creator
  role grant before migrating. The migration intentionally aborts instead of
  discarding ownership data.

## Web — Homepage Follow-ups

- `/dashboard` tells an unverified creator "your creator workspace isn't set
  up yet" and offers "Create creator profile". The creator API answers
  `403 EMAIL_VERIFICATION_REQUIRED` (and `403 MARKETPLACE_ROLE_REQUIRED` for a
  profile owner without the role), but `lib/dashboard.ts` treats every 403 as
  "no creator workspace". Distinguish the error codes and show "verify your
  email" instead. Found in the 2026-09-24 P0 browser pass.
- Meet the plan's performance budgets, then tighten the ratchet gates in
  `lighthouserc.cjs` and `apps/web/e2e/budget.spec.ts` to them. Still
  missing as of 2026-10-16: mobile LCP (`/` 3.2 s simulated vs 2.2 s,
  `/dashboard` 3.62 s vs 2.0 s), `/dashboard` performance (89 vs 92) and `/`
  first-load JS (181 KiB vs 170). The datasheet hero removed the WebGL field,
  the manifest card and the ticker (home JS down 6 KiB, TBT 20 to 30 ms) but did
  not move the simulated LCP: Lighthouse reports the hero paragraph with about
  2.8 s of render delay against a 1.1 s FCP, so look at what the simulation
  charges before the paint (hydration JS and font requests), not at the hero.
- The "How it works" panel (`components/sections/process.tsx`, the terminal
  card under each step below `lg`) is 23 px wider than the viewport at 320 px
  (page scroll width 343). It is below the hero and predates it; the landing
  e2e only checks 375 px. Found 2026-10-16.
- The root layout still preloads the Newsreader face, which no longer sets any
  text above the fold (the hero headline is Geist now). Dropping the preload
  needs `e2e/performance.spec.ts` ("exactly two fonts") updated with it.
- `/explore` intermittently has two identical `<link rel="next">` tags in
  `<head>`, so `e2e/catalog.spec.ts:107` fails in strict mode about 35-55% of
  runs (both on Next 16.3.6 and 16.3.8, measured 2026-10-16). The tags are
  hoisted from `app/explore/page.tsx:29-30`. Separately, the landing pause test
  and the card-morph test fail under default parallelism and pass with 2
  workers. Make the suite pass with default workers.
- The `lhci` job in "Web e2e and performance" has failed on every push to
  `main` since at least 2026-10-05: `total-blocking-time` (budget 150 ms) and
  `max-potential-fid` (130 ms) exceed on GitHub's runners while the same
  budgets pass locally. Decide between a CI-specific throttling profile and
  real TBT work; the ratchet rule forbids just raising the budgets.
- A missing, suspended or archived product renders the branded not-found page
  with `noindex` but HTTP 200: `app/products/[slug]/loading.tsx` makes the route
  stream, so `notFound()` arrives after the status is sent. Unknown routes are
  real 404s.
- On a failed catalogue load the homepage falls back to `lib/mock-home.ts`
  (with a notice), so its cards link to listings that do not exist. Decide
  whether production should show an error state instead.

## Launch — Owner Decisions

- Privacy policy, terms and content policy pages: none exist. The footer's
  "About" and "Quality standards" point at `/design-system`, "Support" at
  `/account`.
- Seeded listings cannot be acquired (no approved release). Launch empty, with
  curated real listings, or with the demo seed (`SEED_DEMO=true`) knowing the
  acquire and review loop is unavailable on those items.

## Marketplace — P0 Discovery and Community

- Add creator profile pages and listing collections while excluding drafts and
  suspended items from public responses.
- Add reporting controls for unsafe, misleading, abandoned, or malicious items,
  including case severity, scoped restrictions, appeals, and audit events from
  ADR 0004.

## Marketplace — P0 Ratings and Reviews

Reviews are live (2026-10-08, see `changelog.md`): linked to a verified account
with a completed acquisition, one per reader and listing, editable and
withdrawable, aggregates calculated transactionally, moderators can hide and
restore. Still open, per ADR 0004:

- Reader reports on reviews, which move a published review into a held state
  while it is investigated, and the case workflow they feed.
- Creator responses: one labelled response per review, same content rules, no
  effect on the rating.
- Automated holds beyond the per-hour rate limit: duplicate and coordinated
  content signals, account and acquisition age, repeated edits, and
  creator-team conflicts of interest.
- Preserve the original and edited text of a review for audit. Edits currently
  overwrite the row.
- Recalculate a listing's rating when a reader's account is deleted (the
  review is removed by cascade; no account deletion exists yet).

## Marketplace — Search

- Escape `%` and `_` in catalogue search terms. Prisma's `contains` does not,
  so a search for `_` matches every listing. It only widens results, but it is
  wrong. Found while benchmarking search on 2026-10-08.
- If a deployment sits behind a CDN, add `Cache-Control: public, s-maxage=30`
  to the public catalogue routes. The API already sends ETags and answers
  conditional requests with 304; nothing is added without knowing the CDN.

## Marketplace — P1 Operations and Growth

- Add creator notifications for moderation decisions, reviews, reports, and
  listing health issues.
- Add user notifications for updates to acquired or followed items.
- Add privacy-conscious creator analytics for listing views, acquisition/install
  conversions, version adoption, and rating trends.
- Add dependency, compatibility, deprecation, and abandoned-project indicators.
- Add curated and community collections without conflating them with Blog
  editorial content.

## Blog — Staff-Managed Editorial

- Plan and publish the vibe-coding checklist series with a repeatable article
  structure and links to relevant marketplace items where editorially useful.
- Add newsletter subscriber export, unsubscribe links, campaign creation,
  article-to-email publishing, and delivery analytics.
- Add threaded replies to comments, including moderation and clear parent-comment context.
- Add immersive article formats such as visual timelines, annotated case studies, interviews, data stories, and side-by-side arguments.
- Add living topic dossiers that collect key ideas, timelines, people, resources, and new coverage around an evolving subject.
- Add a concise editorial Signals format for notable product changes, statistics, patterns, quotations, and tools between major articles.
- Add curated reader perspectives with focused prompts and editor-selected responses presented as article margin notes.

## Bug Audit — 2026-08-27

### Lower Priority


## Bug Audit — 2026-09-02

### Lower Priority
