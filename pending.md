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

- Meet the remaining mobile LCP targets: `/` 2.2 s, `/dashboard` 2.0 s
  and product detail 2.2 s. Profile the remaining shared hydration and mobile
  rendering cost while preserving request-scoped dashboard snapshots and the
  Saved collection's initial-read and mutation ordering.

## Launch — Owner Decisions

- Review and approve the implemented privacy, terms and content-policy pages.
  The footer's
  "About" and "Quality standards" point at `/design-system`, "Support" at
  `/account`.
- Seeded listings cannot be acquired (no approved release). Launch empty, with
  curated real listings, or with the demo seed (`SEED_DEMO=true`) knowing the
  acquire and review loop is unavailable on those items.

## Marketplace — P0 Discovery and Community

- Complete reporting controls for unsafe, misleading, abandoned, or malicious
  items: connect the listing report and private staff case interfaces to the
  intake/triage API; add case-linked scoped restrictions, appeals and
  reinstatement checks/audit events from ADR 0004. Extend reporting to releases,
  placements and creator profiles; review reporting remains in the ratings queue.

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
