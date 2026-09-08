# Pending Improvements

This file tracks known improvement work that has not been completed yet. When an item is finished, remove it from this file and add a dated entry to `changelog.md`.

## Product Features

- Add immersive article formats such as visual timelines, annotated case studies, interviews, data stories, and side-by-side arguments.
- Add living topic dossiers that collect key ideas, timelines, people, resources, and new coverage around an evolving subject.
- Add a concise editorial Signals format for notable product changes, statistics, patterns, quotations, and tools between major articles.
- Add curated reader perspectives with focused prompts and editor-selected responses presented as article margin notes.
- Add newsletter subscriber export, unsubscribe links, campaign creation, article-to-email publishing, and delivery analytics.
- Add threaded replies to comments, including moderation and clear parent-comment context.

## Bug Audit — 2026-08-27

### Lower Priority

- Replace the 200-article admin edit lookup and edition-selection cap with direct article lookup and paginated/searchable selection.
- Paginate sitemap article retrieval so published articles after the first 200 are included.
- Add pagination to category and tag archives instead of silently truncating them at 50 articles.
- Roll back both React state and `localStorage` when a signed-in bookmark API mutation fails.
- Format article dates with the active locale instead of hard-coded `en-US` on Persian pages.
- Fetch enough related articles to retain three results after excluding the current article.
- Point the homepage subject-browsing CTA to `/topics` rather than `/blog`.
- Make logout idempotent so expired or invalid session cookies can still be cleared.

## Bug Audit — 2026-09-02

### Lower Priority

- Skip the redundant client-side product request on first mount in `features/discovery/discovery-experience.tsx`; the effect refetches data the server already rendered into `initial`.
- Fix the `react-hooks/set-state-in-effect` error and five warnings reported by `npm run lint --workspace @termspace/web` in `features/account/marketplace-session.tsx`, `features/product/product-actions.tsx` and `app/page.tsx`.
- Add a lint step to CI and run the workflow on `development`; the current workflow triggers only on pushes to `main` and never invokes the `apps/web` lint script.
- Copy each app's `next.config` into the runtime container image, or move the settings elsewhere, so `images.remotePatterns` and `reactStrictMode` apply at runtime rather than only at build time.
- Remove the `CountUp` component and its tests or adopt it somewhere real; it has no production call sites after the hero stat rail was removed.
- Pin the `apps/web` dependencies currently declared as `latest` so installs are reproducible without relying solely on `package-lock.json`.
