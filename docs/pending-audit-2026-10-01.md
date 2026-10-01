# Pending audit — 2026-10-01

Repository source was checked before migrating the marketplace workspace into
`/dashboard`. All 23 backlog items still have unfinished scope; none can be removed
as fully complete. Several already have foundations, so `pending.md` now describes
the remainder instead of asking for those foundations again.

This is a source audit, not a claim about production data. In particular, a
published vibe-coding series could exist in a remote editorial database; it was
not found in repository seed content and its publication remains unverified.
Graph coverage was checked, but its metadata had changed; conclusions below use
current route inventories, schema definitions, literal searches, and source reads.

## Marketplace discovery and community

| Pending item | Existing implementation | Remaining work |
| --- | --- | --- |
| Communities and placements | `MarketplaceCommunity` and snapshot-scoped `MarketplaceCommunityPlacementRequest`; creator draft selection and moderator preview | Final moderated placement model, public browse pages/API, combined community/platform filters |
| Normalized filters | Item-type enum/registry, category table and slug validation; structured compatibility records | Canonical platform/model registry and legacy alignment; discovery uses display strings while manifests accept arbitrary platform keys |
| Expanded search | Name, outcome, description, creator-name search; pagination and retry/empty UI | Community/compatibility search and stable sort tie-breakers |
| Creator pages and collections | Owner profile onboarding/editing; public creator cards | Public creator route, persisted collections and safe published-only contents |
| Reports and trust enforcement | Moderator queue, listing suspension/reinstatement, lifecycle events and internal notes | Reader reporting, case severity, scoped enforcement, appeals |

Evidence: [`schema.prisma`](../apps/api/prisma/schema.prisma),
[`marketplaceRoutes.ts`](../apps/api/src/routes/marketplaceRoutes.ts),
[`marketplaceController.ts`](../apps/api/src/controllers/marketplaceController.ts),
[`marketplaceDraftController.ts`](../apps/api/src/controllers/marketplaceDraftController.ts),
[`marketplaceManifest.ts`](../apps/api/src/lib/marketplaceManifest.ts),
[`discovery-experience.tsx`](../apps/web/features/discovery/discovery-experience.tsx).

## Ratings and reviews

| Pending item | Existing implementation | Remaining work |
| --- | --- | --- |
| Authenticated authors and edits | Reviews have an arbitrary `author` string | Reader foreign key, one active review per reader/listing, editing |
| Acquisition eligibility | Acquisition records exist; review has `verifiedPurchase` boolean | Enforced review eligibility and trustworthy verified-use labels |
| Transactional aggregates | Product stores rating/count; strict creator manifests reject aggregate fields | Derive aggregates transactionally from published reviews |
| Submission, moderation, responses and bilingual inputs | Public product pages display published reviews and stars | Review write/moderation/report endpoints, creator responses and accessible bilingual inputs |
| Abuse controls | General rate limits and listing moderation | Review-specific spam/manipulation checks, creator conflicts and eligibility holds |

Evidence: `MarketplaceReview` in [`schema.prisma`](../apps/api/prisma/schema.prisma),
marketplace route inventory, product detail response/page and strict manifest
validation. There are no review write routes in the current marketplace router.

## Operations and growth

| Pending item | Existing implementation | Remaining work |
| --- | --- | --- |
| Step-by-step listing flow | A single form with sections, server validation, saved drafts and unload warning | Step progression, per-step validation, retained progress and final review |
| Creator notifications | Per-listing feedback and recent lifecycle events | Inbox/delivery for decisions, reviews, reports and health changes |
| User notifications | Acquisition library and favorites | Notifications for acquired/followed item updates |
| Creator analytics | Listing/public/review/acquisition totals and acquisitions pinned per release | Views, conversion tracking, time series, adoption and rating trends |
| Dependency/compatibility/health indicators | Structured release requirements and compatibility; gated installation requirements and source status | Complete public indicators, deprecation and abandonment |
| Curated/community collections | Static homepage cards with hardcoded counts linking to the general discovery page | Collection records, community curation and creator management |

Evidence: creator draft, dashboard and release components;
[`marketplaceCreatorController.ts`](../apps/api/src/controllers/marketplaceCreatorController.ts);
release requirements in the schema and installation response. Transactional email
currently supports email verification, not marketplace activity notifications.

## Blog editorial

| Pending item | Existing implementation | Remaining work |
| --- | --- | --- |
| Vibe-coding checklist series | General series publishing; a code-review resource in seed data | Specific series plan/template/content and marketplace links; actual publication unverified |
| Newsletter operations | Subscribe endpoint and subscriber records | Export, unsubscribe, campaigns, article emails and delivery analytics |
| Threaded comments | Flat comments with approval/deletion | Parent relationships, reply UI and parent context during moderation |
| Immersive article formats | Safe basic Markdown renderer | Specialized timelines, annotations, interviews, data stories and comparison formats |
| Living topic dossiers | Category/tag/series browse page | Dedicated dossier structure, maintenance and ongoing coverage |
| Signals | General articles | A concise editorial format and its publishing/display workflow |
| Curated reader perspectives | Moderated comments | Focused prompts, selected responses and article margin presentation |

Evidence: [`newsletterRoutes.ts`](../apps/api/src/routes/newsletterRoutes.ts),
[`newsletterController.ts`](../apps/api/src/controllers/newsletterController.ts),
[`commentController.ts`](../apps/api/src/controllers/commentController.ts),
[`markdown.ts`](../apps/blog/lib/markdown.ts), Blog route inventory, schema and seed.
Blog staff publishing remains separate from marketplace dashboard permissions.

## Dashboard migration

| Existing feature | New route |
| --- | --- |
| Account, verification status, sign out and acquired library | `/dashboard` |
| Creator onboarding/profile, listing summary, metrics and feedback | `/dashboard/creator` |
| New listing | `/dashboard/creator/listings/new` |
| Draft editing | `/dashboard/creator/listings/[id]/edit` |
| Release history and source checks | `/dashboard/creator/listings/[id]/releases` |
| GitHub/npm provider connections | `/dashboard/connections` |
| Moderator queue | `/dashboard/moderation` |
| Moderator preview, decisions, notes and audit trail | `/dashboard/moderation/listings/[id]` |

The old creator/moderation URLs redirect with their nested paths and query values.
Persian routes receive equivalent redirects. `/account` remains the sign-in and
registration entry, and signed-in readers continue into the dashboard. Email
verification keeps its existing public token landing page, with a dashboard return
link. API ownership and role checks stay in force. Dashboard links and direct page
access are additionally gated by the reader session and marketplace roles.
