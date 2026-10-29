# Changelog

Project changes completed from `pending.md` should be recorded here with the date, a short summary, and any verification performed.

## 2026-10-30 — GitHub presentation review

- Condense the public README into purpose, status, real fixture captures, implemented
  journeys, contribution limits and setup navigation. Preserve the operational
  material in `docs/development.md` and correct its relative links.
- Reconcile the stale README follow-ups with the current queue: public creator
  profiles are implemented; notifications, Studio feedback, real email delivery,
  Redis limiter startup reliability and final signed-in acceptance remain open.
- Bounded API review: `apps/api/src/controllers/marketplaceController.ts` is named
  by Astra's GitHub plan. Derive the serializer payload from its shared Prisma
  include shape and infer nested mappings. All six serializer sites receive that
  include; remove the unreachable creator `products` field fallback while retaining
  the selected `_count`, zero and null-creator handling. Authentication,
  authorization, query filters and owner boundaries are unchanged. This records
  the reason for entering the API maintainer's lane.
- Final checks: root typecheck, 779 tests, web lint (two existing warnings) and all
  three builds passed. All migrations and database cases ran on a fresh disposable
  PostgreSQL 16 database; one Redis case remains skipped. Focused production-fixture
  browser pass: 90 passed, six intentional device-specific skips. Real provider,
  deployment and device acceptance remain separate. Ramtin confirmed his contribution
  as web presentation, landing page and dashboard shell; README credits that scope.
- Shared `changelog.md` edit announced in the prior local commit body before editing.
  Original `ramtin` checkout and its unpublished work remain separate. Final review
  completed manually across correctness, readability, architecture, security and
  performance; source fallback covered graph-excluded tests and callback references.
  Hosted checks are recorded with the PR, not inferred from workflow-file presence.

## 2026-10-28

- **Library depth (launch-readiness item).** `GET /api/marketplace/library`
  now takes `q` (name search, 80 characters, `%` and `_` treated literally),
  `type` (item type key) and `sort` (`newest` default, `oldest`, `name`); totals
  and pages count only the matches and other readers' acquisitions never
  appear. `GET /api/marketplace/products` takes `slugs` (1 to 48 valid slugs)
  so a page of Saved listings is one request instead of up to 12; listings
  that are not published come back missing and show as unavailable. The
  library page gets a search box, a type filter and a sort control kept in the
  URL (changing one returns to page 1 and keeps other parameters), a "no
  resources match" state with Clear filters that is distinct from an empty
  library, and a Rate or review link to each installable item's `#reviews`
  section. The controls use `id`-linked labels so each field has a short
  accessible name. The library and batch calls moved to `lib/account-api.ts`
  (the old `getMarketplaceLibrary` left `lib/api.ts`), which keeps the public
  bundle unchanged. The per-item Saved error and its copy (`itemError`) went:
  a failed batch is one retryable error. English and Persian copy added to
  `library-copy.ts` (Persian needs maintainer approval).
  - Verification: root typecheck; 11 new API integration tests on the scratch
    database (sorts, type filter, wildcard escaping, pagination with filters,
    validation, owner scoping, slug lookup); library unit tests 27 (11 new, the
    Saved tests rewritten for one batch request); E2E dashboard-library and
    dashboard-capabilities 44 passed (new filter test, Saved test now asserts
    one 12-slug request) and budget passes. Shared surfaces: `pending.md`,
    `changelog.md`. Removed the item from `pending.md` and renumbered.
  - Full gate: root typecheck, API 306 and web 456 tests, lint (two existing
    warnings), production build, and the full web E2E with three workers: 474
    passed, 46 skipped, 3 failed (`reporting`, `context-help`, `catalog`; all
    load-sensitive, 101 passed on rerun).

- **Full gate for sign out other devices and change email.** Full web E2E
  (with the Docker stack running, so slow): 437 passed, 46 skipped, 36 failed.
  Rerun of the failing specs with two workers left 5: `reporting` and
  `context-help` (known load-sensitive, pass alone earlier) and two real
  failures in `budget.spec.ts`: the product page's first-load JS was 165.1 kB
  against the 165 kB budget (164.9 kB before this batch). The three new
  account calls added to the shared `lib/api.ts` caused it, so they moved to
  `lib/account-api.ts`, which only the dashboard components import; the budget
  is unchanged (it ratchets down, never up). After that, budget, email-change,
  account-security and account-data E2E: 58 passed. Root typecheck, 294 API
  tests, 446 web tests, lint (two existing warnings) and build pass.

- **Change email (launch-readiness item 1 after sign out other devices).**
  A signed-in password account asks to change its address with
  `POST /api/readers/profile/email` (new address plus current password,
  rate limited, one request a minute and five an hour per account). A signed
  confirmation link goes to the new address; nothing changes until it is
  opened. `POST /api/readers/profile/email/confirm` (token only, so it works
  from any browser) makes the new address the verified sign-in email, ends
  every session and mails the old address a notice. The token signature covers
  the new address; a newer request or a used link invalidates older ones; an
  address taken in the meantime returns `EMAIL_UNAVAILABLE`; an address that is
  already taken at request time looks identical to an accepted one and sends
  nothing. Google-only accounts are refused (`EMAIL_CHANGE_REQUIRES_PASSWORD`)
  because Google vouches for their address. New migration
  `202610280002_reader_email_change` (table, outbox columns, widened
  `exactly_one_target` check); the mail worker and Cloudflare sender gained the
  confirmation and notice emails. Web: an "Email address" section in Settings
  (shares the one profile request), a `/account/confirm-email` page that reads
  the token from the URL fragment and strips it, English and Persian copy in
  `features/account/email-change-copy.ts` (Persian needs maintainer approval).
  Shared surfaces: `schema.prisma`, the migration, `lib/api.ts`, `pending.md`,
  `changelog.md`.
  - Verification: root typecheck; 6 new API integration tests on the scratch
    database (rejections, no enumeration, full flow with worker-sent mail and
    notice, tampered/used/superseded links, taken-in-the-meantime, cooldown)
    and a mailer test; 36 new web unit tests and 20 new E2E tests. The
    migration was diffed against `schema.prisma` with no drift. Not run: the
    full suites, lint and build for this item; no real mail was sent (the
    worker was exercised against a mocked provider). Local dev note: there is
    no local-verification bypass for email change, so it needs a configured
    mail provider to confirm. Removed from `pending.md` and renumbered.
  - Also set `fileParallelism: false` in `apps/api/vitest.config.ts`: the new
    tests send mail through the worker, which drains one global outbox, and
    that made `readerFlow.integration.test.ts` fail intermittently when the
    files ran side by side. Whole API suite with integration tests, run twice:
    294 passed, about 39 s. Web: 446 tests, lint (two existing warnings) and
    production build pass.

- **Sign out other devices (launch-readiness item 1 after the account
  deletion phase).** Added `POST /api/readers/sessions/revoke-others`
  (authenticated, rate limited), which deletes every other session of the
  caller and keeps the current one; it returns the number revoked. Account
  security gets a "Sign out other devices" button for every account type, with
  a help line that this device stays signed in, a result message (signed out,
  or none were signed in) and a specific message per failure (unreachable,
  rate limit, server, other); English and Persian copy added to
  `account-security-copy.ts` (Persian needs maintainer approval). Checked that
  password change and password reset already end other sessions, so no change
  was needed there. Removed the deferred blog-data item and this item from
  `pending.md` at the owner's request and renumbered the rest.
  - Verification: root typecheck; API integration suite 6 of 6 on the scratch
    database (new test: other sessions end, the caller's and another
    account's survive, second call revokes 0); 8 new web unit tests; E2E for
    account-security and account-data 32 passed. Not run: full web tests, lint,
    build and the full E2E for this item. Shared surfaces: `lib/api.ts`,
    `pending.md`, `changelog.md`.

- **Reader account export and deletion (launch-readiness item 1, approved plan
  in `plan.md`).** Added `GET /api/readers/profile/export` (owner-scoped JSON
  download, no secrets) and `DELETE /api/readers/profile`, which anonymizes
  the account in one transaction: the `ReaderUser` row stays as a tombstone
  (`deletedAt`, email `deleted-<id>@deleted.invalid`, credentials cleared)
  because eleven relations are `onDelete: Restrict`. Sessions, favourites,
  bookmarks, progress, verification and reset codes, role grants and reviews
  are deleted; each affected listing's rating is recomputed under the
  per-listing lock; creator provider credentials are scrubbed and the creator
  profile anonymized. Orders, reports and audit events are retained against
  the tombstone. A creator with submitted, approved, published, suspended or
  changes-requested listings is blocked with `CREATOR_LISTINGS_ACTIVE`.
  Password accounts confirm with the password, Google-only accounts with a
  fresh Google credential for the same subject. Settings gains "Your data" and
  "Delete account" sections (typed-email confirmation, real error per cause,
  English and Persian); the privacy policy and its date were updated.
  Account security now shares its single profile request with the new section.
  Shared surfaces: `schema.prisma`, migration `202610280001_reader_account_deletion`,
  `lib/api.ts`, `pending.md`, `changelog.md`. Review-controller helpers
  `recomputeRating` and `lockProductReviews` are now exported.
  - Verification: root typecheck; 286 API tests including 5 new integration
    tests (anonymization, rating recalculation, creator block, credential
    scrubbing, Google subject) against a scratch database with all migrations
    applied; 418 of 419 web tests (one load-sensitive shell test passed three
    times alone); lint (two existing warnings); production build. Full web
    E2E: 439 passed, 46 skipped, 10 load-sensitive failures that all pass with
    limited workers (108 passed on rerun); the new spec passes. The E2E found two real problems, fixed
    here: duplicate "Current password" labels, and a second profile request
    that broke the retry test. Not covered: the Google button on a real
    client, an Impeccable review, Persian copy approval (all in `pending.md`).
    Blog comments and the newsletter list are deliberately untouched.

- **Full gate for the first launch-readiness items (noindex, one library home,
  Settings link, specific sign-out errors).** Root typecheck, tests (270 API +
  17 blog + 403 web), web lint (two existing warnings) and production build
  pass. Full web E2E: 420 passed, 46 skipped, 17 failed under default
  parallelism; the failing specs pass with limited workers (125 passed, one
  reporting case) and `reporting` passes alone (28 passed), so they are
  load-sensitive. The two `/account` library cases were a real failure from
  this change and were rewritten to assert the link. Lighthouse not run (`/`,
  `/dashboard` and product pages were not changed).

- **Name the cause of a failed sign-out (launch-readiness item 2).**
  `account-settings.tsx` showed one generic message for every failure and also
  hid failures after a successful logout. The logout call is now classified:
  unreachable server or timeout, rate limit (429), server failure (5xx) and any
  other rejection each show their own message, and the session is kept until
  logout succeeds. Reused existing copy (`rateLimited`, `serviceError`,
  `signOutError`) and added one key, `signOutOffline`, to the Settings-only
  `account-security-copy.ts` (English and Persian; the Persian wording needs
  maintainer approval). A retry clears the previous message.
  - Verification: root typecheck, 36 dashboard tests (five new: four failure
    classes and retry), web lint pass. Not run: full tests, build, E2E (no E2E
    spec asserts the sign-out message). Also corrected the sign-out-everywhere
    item: a password change already signs out other sessions. Removed the item
    from `pending.md` and renumbered. Shared surfaces `pending.md` and
    `changelog.md`.

- **Link the release manager to Settings for provider connections
  (launch-readiness item 1, part 2).** At the owner's decision, replaced the
  three `ProviderConnections` renders in `creator-release-manager.tsx`
  (loading, history-failed and normal states) with a short section that reuses
  `connectionsTitle`/`connectionsIntro` and links to `/dashboard/settings`,
  which stays the single home for the GitHub and npm token forms. Rewrote the
  two release-manager tests that asserted embedded token controls and removed
  the unused provider mock. With part 1 this completes item 1; the creator
  profile summary in Settings is unchanged.
  - Verification: root typecheck, 63 creator tests, web lint pass. Not run:
    full tests, build, E2E (no E2E spec covers the release page token forms;
    `dashboard-capabilities.spec.ts` connects from Settings). Removed the item
    from `pending.md` and renumbered. Shared surfaces `pending.md` and
    `changelog.md`.

- **Give the acquired library one home (launch-readiness item 1, part 1).**
  `/account` no longer embeds `AcquiredLibrary`; the signed-in view shows the
  existing library title and intro with a link to `/dashboard/library`
  (reusing `libraryCopy`, no new keys). Removed the now-unused `embedded` prop,
  so the library heading is always the page `h1`. Replaced the account-form
  library tests with a link test and updated the library test.
  - Verification: root typecheck, 46 account and library tests, web lint
    pass. Not run: full tests, build, E2E. The provider-connections half of the
    item is left open in `pending.md` pending an owner decision. Shared
    surfaces `pending.md` and `changelog.md`.

- **Noindex the dashboard (launch-readiness item 1).** Added
  `export const metadata = { robots: { index: false, follow: false } }` to
  `apps/web/app/dashboard/layout.tsx`, matching the moderation pages, so every
  dashboard route (studio, library, settings, moderation) renders
  `noindex, nofollow` and is not indexable even when linked. Added
  `layout.test.ts` for the metadata. `/account` is private in `robots.ts` but
  still has no `noindex` tag; left out of scope and not yet queued.
  - Verification: root typecheck, new test, web lint (two existing warnings)
    pass; live dev server returns `<meta name="robots" content="noindex,
    nofollow">` for `/dashboard/settings` and `/fa/dashboard/library`. Not
    yet run: full web tests, production build and E2E (build would clobber the
    running dev server); run them before squashing. Removed from `pending.md`
    and renumbered the rest. Shared surfaces `pending.md` and `changelog.md`.

- **Replace `pending.md` with the dashboard launch-readiness queue.** At the
  owner's request, cleared the previous queue and added 12 ordered items from
  the review of `/dashboard/studio`, `/dashboard/library` and
  `/dashboard/settings` (noindex, duplicate surfaces, account deletion and
  export, sign-out everywhere, change email, preferences, library depth, studio
  onboarding, creator notifications, copy consolidation, signed-in verification
  pass). Kept the migration `202609240001` deployment-safety warning because it
  guards against data loss. The removed items (LCP targets, launch owner
  decisions, reporting, reviews, search, P1 growth, Blog) are preserved in git
  at `db6e095`; the relevant ones (account-deletion rating recalculation,
  analytics, creator notifications) were carried into the new items.
  - Verification: documentation only; nothing run. Shared surfaces
    `pending.md` and `changelog.md` edited; announce in the commit body.
