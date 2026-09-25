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
  missing as of 2026-09-24: mobile LCP (`/` 3.16 s vs 2.2 s, `/dashboard`
  3.62 s vs 2.0 s), `/dashboard` performance (89 vs 92), `/` first-load JS
  (185 kB vs 170 kB). Expected from plan P2 (motion diet) and P3 (fonts,
  plasma tiers).
- `.github/workflows/ci.yml` still triggers on a `development` branch, which
  does not exist on the remote.
- Preload the display serif used on the hero headline. This needs the fonts
  moved from `@fontsource-variable` to `next/font/local`.

## Marketplace — P0 Discovery and Community

- Add creator profile pages and listing collections while excluding drafts and
  suspended items from public responses.
- Add reporting controls for unsafe, misleading, abandoned, or malicious items,
  including case severity, scoped restrictions, appeals, and audit events from
  ADR 0004.

## Marketplace — P0 Ratings and Reviews

- Link each review to an authenticated user instead of storing an arbitrary
  author string, enforce one active review per user and item, and support edits.
- Permit ratings only after a meaningful acquisition or other defined
  eligibility event, and label verified use consistently.
- Calculate rating and review counts transactionally from published reviews;
  never accept aggregate values from clients or creator edits.
- Add review submission, moderation, reporting, creator responses, and accessible
  rating UI in both English and Persian.
- Add abuse controls for review spam, coordinated manipulation, and creator
  conflicts of interest, following ADR 0004 review eligibility and hold rules.

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
