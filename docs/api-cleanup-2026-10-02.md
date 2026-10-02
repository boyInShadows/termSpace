# API necessity and cleanup audit — 2026-10-02

The shared backend had 137 explicitly registered method-and-path endpoints
across 114 URL patterns. Most support existing marketplace, reader, or Blog
features. One unused tag-edit operation was removed, leaving **136 endpoints**
across the same 114 patterns. Counting HTTP methods separately explains part
of the total: listing, creating, and deleting a resource are different operations.

## Retained API surface

| Route group | Endpoints | Purpose |
| --- | ---: | --- |
| Marketplace | 66 | Discovery, acquisitions, creators, releases, moderation, reviews, communities, collections, notifications, analytics |
| Readers | 14 | Authentication, profiles, email verification, Blog reading library |
| Articles | 11 | Public content, staff editing, preview, revisions, comment submission |
| Editions | 7 | Public editions and staff management |
| Resources | 7 | Public Markdown previews/downloads and staff management |
| Newsletter | 6 | Subscribe/unsubscribe, export, staff campaigns |
| Comments | 5 | Public comments and staff moderation/curation |
| Series | 5 | Public series/dossiers and staff management |
| Categories | 4 | Public taxonomy and staff management |
| Tags | 3 | List, create, delete |
| Admin | 3 | Blog staff login, logout, session check |
| Media | 3 | Staff media listing, uploads, deletion |
| Authors | 1 | Article editor author selection |
| Health | 1 | Database-aware service health |
| **Total** | **136** | **64 GET, 39 POST, 19 PUT, 13 DELETE, 1 PATCH** |

Counts come from `apps/api/src/app.ts` and every mounted module in
`apps/api/src/routes`. Frontend `/backend` proxies forward to this API;
the Blog RSS and marketplace redirect routes are not additional backend APIs.
Automatic HEAD/OPTIONS handling and static media serving are excluded.

## Findings and changes

- **delete:** `PUT /api/tags/:id` and `updateTag`. Repository-wide searches found
  no app, script, test, or documented caller of the update operation.
  `apps/blog/components/admin/TaxonomyManager.tsx` only creates/deletes tags;
  `apps/blog/lib/api.ts` has no tag-update method. The removed operation now
  returns `404 ROUTE_NOT_FOUND`. Tag listing, creation, and deletion remain.
- **shrink:** Five controller-specific request error classes and their repeated
  response branches now use `MarketplaceRequestError` and the existing central
  middleware. Draft, lifecycle, source-check, moderation-note, and creator
  onboarding status codes/messages remain the same. Transaction-specific
  conflict handling stays in the controllers.
- **delete:** Removed an unused community-controller import and marked the
  intentionally unused not-found request parameter with the existing `_req`
  convention. Production source is **48 lines shorter**; the route regression
  adds six test lines. No dependency, schema, or environment changes.

## Why similar endpoints remain

Public/staff content reads have different visibility rules. Creator and staff
actions enforce different roles, ownership, and conflict-of-interest checks.
Acquiring a release and viewing its installation details are separate steps.
Combining those routes solely to reduce the count would obscure these boundaries.

Direct API-client searches alone miss callers: the Blog proxy checks
`/api/admin/session`, newsletter CSV export and resource downloads use links,
and dashboard screens construct notification, review, placement, and trust-case
paths dynamically. Those operations have current consumers.

One required route has **no frontend caller**: creator listing lifecycle
transitions. The draft editor saves a draft and the release manager requests
source verification, but neither submits it for moderation. Keep
`POST /api/marketplace/creator/products/:id/lifecycle`: it implements the product's
creator publishing journey, is documented in `marketplace-listing-lifecycle.md`,
and has authorization/state tests. Record the missing UI integration in
`pending.md` instead of deleting the publishing capability.

The codebase-memory transport was unavailable. This audit used source reads,
repository-wide searches, route/client inspection, and TypeScript unused-symbol
checks; it does not infer deployed request frequency from source references.

## Verification

- Root `npm run typecheck`, `npm test`, and `npm run build` passed.
- 203 tests passed; the two database integration tests were skipped.
- TypeScript unused-local/parameter checks passed in all three workspaces.
- Existing request tests cover owner isolation, revoked creator roles, stale
  writes, self-moderation, successful draft/source/lifecycle/note operations,
  and stable error codes. Added a request test for the removed tag-edit route.
- `git diff --check` passed. No deployed traffic or database was inspected.
