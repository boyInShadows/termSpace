# Pending Improvements

This file tracks known improvement work that has not been completed yet. When an item is finished, remove it from this file and add a dated entry to `changelog.md`.

Last checked against repository code on 2026-10-01. See
[`docs/pending-audit-2026-10-01.md`](docs/pending-audit-2026-10-01.md) for existing
foundations and the remaining scope of every item. Published editorial content
was not verified against a running database.
The Discovery and Community batch is complete; see
[`docs/marketplace-discovery-and-trust.md`](docs/marketplace-discovery-and-trust.md).

## Marketplace — P0 Ratings and Reviews

- Link each review to an authenticated user instead of storing an arbitrary
  author string, enforce one active review per user and item, and support edits.
- Permit ratings only after a meaningful acquisition or other defined
  eligibility event, and label verified use consistently.
- Calculate rating and review counts transactionally from published reviews.
  Creator manifest validation already excludes client-supplied aggregate fields.
- Add eligible review submission, moderation, creator responses, and accessible
  rating inputs in both English and Persian. Public display and reporting of
  existing reviews now exist; reviewer appeals await authenticated review authors.
- Add abuse controls for review spam, coordinated manipulation, and creator
  conflicts of interest, following ADR 0004 review eligibility and hold rules.

## Marketplace — P1 Operations and Growth

- Replace the creator add-listing form's long single-page field list with an
  accessible step-by-step flow that preserves progress, validates each step,
  and provides a final review before submission.
- Add creator notifications for moderation decisions, reviews, reports, and
  listing health issues in the dashboard. Existing listing feedback/history is
  not a notification inbox.
- Add user notifications for updates to acquired or followed items.
- Add privacy-conscious creator analytics for listing views, acquisition/install
  conversions, version adoption, and rating trends in the dashboard. Listing
  totals, acquisition/review counts, and per-release acquisition counts exist.
- Add deprecation and abandoned-project indicators and improve public dependency
  and compatibility indicators. Release manifests and gated installation already
  contain requirements and compatibility data.
- Add persisted staff-curated/community collections without conflating them with
  Blog editorial content. Creator collections and their dashboard management now
  exist; homepage editorial collection cards still link to general discovery.

## Blog — Staff-Managed Editorial

- Plan and publish the vibe-coding checklist series with a repeatable article
  structure and links to relevant marketplace items where editorially useful.
- Extend newsletter subscription with subscriber export, unsubscribe links,
  campaign creation, article-to-email publishing, and delivery analytics.
- Add threaded replies and parent-comment context to the existing moderated comments.
- Add immersive article formats such as visual timelines, annotated case studies, interviews, data stories, and side-by-side arguments.
- Add living topic dossiers that collect key ideas, timelines, people, resources, and new coverage around an evolving subject.
- Add a concise editorial Signals format for notable product changes, statistics, patterns, quotations, and tools between major articles.
- Add curated reader perspectives with focused prompts and editor-selected responses presented as article margin notes.
