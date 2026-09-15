# Pending Improvements

This file tracks known improvement work that has not been completed yet. When an item is finished, remove it from this file and add a dated entry to `changelog.md`.

## Marketplace — P0 Creator and Submission Lifecycle

- Add creator onboarding and profiles linked to authenticated user accounts;
  replace seed-only creator ownership.
- Build a creator dashboard showing owned listings, draft/review/published status,
  moderation feedback, versions, ratings, acquisition counts, and recent updates.
- Build draft creation and editing for listing metadata, documentation,
  screenshots, platform compatibility, community membership, category, item
  type, requirements, permissions, license, and installation instructions.
- Implement the versioned common manifest, controlled item-type registry, and
  type-specific validation defined in ADR 0003. Migrate direct legacy types and
  require manual classification for `AI tool` and `Developer utility` records.
- Add submission states and an auditable lifecycle: draft, submitted, changes
  requested, approved, published, rejected, suspended, and archived, including
  approved and proposed snapshots as required by ADR 0004.
- Build the staff moderation queue with preview, approval, rejection, change
  requests, internal notes, and an audit trail.
- Add creator-controlled release/version management without silently replacing
  artifacts already acquired by users.
- Implement GitHub and npm source ingestion with authenticated ownership checks,
  immutable release references, provider integrity metadata, bounded background
  reconciliation, and safe failure states as defined in ADR 0001.
- Complete the free-item acquisition/install flow and expose the correct package
  or external installation instructions only to eligible users.
- Add API and end-to-end authorization tests covering cross-user listing access,
  creator ownership, moderation, unpublished artifacts, and Blog isolation.

## Marketplace — P0 Discovery and Community

- Add normalized communities and moderated many-to-many listing placements, then
  expose community browse pages and combinable community/platform filters as
  defined in ADR 0002.
- Normalize platform, compatibility, item type, and category values so filters
  cannot fragment through inconsistent creator input.
- Expand marketplace search across listing metadata, creators, communities, and
  compatibility with stable pagination and useful empty/error states.
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
- Design paid checkout, creator payouts, refunds, tax handling, fraud controls,
  and financial reconciliation only after the free lifecycle is proven.

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
