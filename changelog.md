# Changelog

Project changes completed from `pending.md` should be recorded here with the date, a short summary, and any verification performed.

## 2026-11-01 — Plain link listings, so creators no longer need GitHub or npm

- **What changed.** New `external_link` source: an HTTPS link plus "I made this" or
  "I'm sharing someone else's project" with the original author. Status `LINK_ONLY`
  passes the submit/publish gate with `ownershipVerifiedAt` left null. The server never
  fetches the URL. It is the editor's default source. Product page, install dialog,
  creator releases and moderation all label it as not verified. GitHub and npm flows are
  unchanged. ADR 0004 amended; content policy updated (EN/FA).
- **Shared surfaces.** `schema.prisma`, migration `202611010003_marketplace_external_link_source`
  (two enum values, `sourceOriginalAuthor`, acquisition trigger accepts `LINK_ONLY`),
  `apps/web/lib/types.ts`, `apps/web/lib/i18n/`, `changelog.md`.
- **Verified.** Root typecheck, all workspace tests, web lint, and the real-database
  journey for a link listing (draft, submit, approve, publish, acquire, install).

## 2026-11-01 — Smaller Docker images (API 3.28 GB → 685 MB, web/blog 3.1 → 1.06 GB)

- **What changed.** `docker/Dockerfile.{api,web,blog}` now install only the
  workspace they build (`npm ci --workspace …`), compile in a build stage, and
  copy a separate `npm ci --omit=dev` tree into the runtime stage. `COPY --chown`
  replaces the `RUN chown -R /app` step that duplicated every layer; npm's download
  cache is a BuildKit cache mount. `docker-compose.yml`: `migrate`, `scheduler`,
  `email-worker` and `marketplace-source-worker` reuse one `termspace-api:latest`
  image (built by `api`, `pull_policy: never`) instead of building it five times.
  Shared surface touched: `docker-compose.yml`.
- **Operational change.** The production API image no longer contains `tsx`, so
  role grants run the compiled script (`node apps/api/dist/scripts/manageMarketplaceRole.js`);
  documented in `docs/marketplace-roles.md`. Build `api` before `up`/`run` of
  the worker services.
- **Verified.** Built all three images locally; `docker compose config` valid;
  migrations applied to a fresh Postgres 16, API served `/api/health` 200 with Redis,
  scheduler job exited 0, blog 200 against the API, web `/`, `/explore`, `/fa` 200,
  `sharp` and the Prisma CLI load, role script prints its usage. Not run: the
  repo-wide typecheck/tests (no source changed), Playwright, Lighthouse.
- **Not done.** Next `output: "standalone"` would cut web/blog further but changes
  how `.next/compressed-assets.json` and `proxy.ts` are served; left for a separate phase.

## 2026-11-01 — Simpler listing editor (5 steps → 4; 39 fields → 16 visible, 20 optional hidden)

- **What changed.** The creator listing form (`creator-draft-editor.tsx`) now has
  About → Source & install → Access & details → Review. For a skill from a GitHub
  repository, 16 fields show by default (name, type, category, outcome,
  description; source kind, repository, commit, platforms, install steps, license;
  permissions and the required type details). Everything else sits in collapsed
  sections that open themselves when they hold data or contain an invalid field:
  web address (slug), translations, tags, communities, screenshots, links; version,
  release notes, install method and optional source fields; optional type details,
  runtimes/accounts/OS/dependencies and env vars. The slug follows the name until
  edited. Install method follows the source kind. A new draft starts at version
  1.0.0 with release notes "Initial release". License is one field: an `https://`
  value is saved as a custom license URL, anything else as an SPDX identifier.
  Platforms and permissions are tick-lists (`choice-rows.tsx`, plain-language
  labels in `permission-labels.ts`) that still submit the same manifest rows. The
  duplicate progress bar and help paragraph are gone; the step strip is the one
  progress indicator. Release-level docs/support URLs are no longer shown but
  existing values are preserved as hidden inputs.
- **Not done (needs API work, owner decision).** Saving a draft to the account
  before the last step: the API validates the whole manifest, so partial saves
  still go to the browser only. Resolving the commit SHA and npm integrity from a
  pasted URL, and relaxing required type-detail fields, were left out on purpose.
  Outcome and description are both still asked for; merging them would put the same
  sentence on the listing twice.
- **Verification.** `npm run typecheck -w apps/web`; `npm test -w apps/web` (new
  `choice-rows` and slug/disclosure tests); lint clean for the changed files;
  Playwright `context-help` and `dashboard-repairs` specs on desktop and mobile,
  updated for four steps and the collapsed fields (including a custom-license-URL
  save check). Rendered step screenshots were checked once in dark theme, English
  desktop and mobile, before the second round of cuts. **Not yet checked:** a fresh
  look at the final layout, light theme and Persian RTL by eye (the specs ran in
  both), `npm run lhci`, root `npm run build`.
- **Shared surfaces touched:** `changelog.md` only. Copy lives in
  `features/creator/workspace-copy.ts`; `lib/i18n` still carries now-unused step
  and license keys.

## 2026-11-01 — Creator notifications for moderation decisions

- **What the creator gets.** An approval, a change request or a rejection now
  creates one in-app notification for the listing owner and, unless they opted
  out, one email. The dashboard header gains a bell with an unread count;
  opening it refreshes the feed. Each row names the listing, the decision, the
  public reviewer note and the date, and links to the studio. "Mark all as
  read" clears the badge; using a row's link clears that row. Empty, loading,
  failure and retry states are kept, and the panel closes on Escape, outside
  click and route change.
- **What is stored and sent.** `MarketplaceNotification` copies the decision
  type and the public reason only — never the internal note. Email is a second
  `TransactionalEmailOutbox` row with a new `notificationId` target, so a failed
  delivery cannot lose the in-app record. The worker re-checks the preference
  and cancels with `NOTIFICATION_OPTED_OUT`; a missing row cancels with
  `NOTIFICATION_INACTIVE`. Creator-initiated transitions, internal notes and
  community-placement decisions create nothing. Account deletion removes the
  reader's notification rows with the rest of their personal data.
- **Preference.** `ReaderUser.notifyModerationEmail` defaults to on and sits
  beside the newsletter switch in Settings → Email preferences; in-app
  notifications are always on. The two switches save independently and the API
  accepts either field.
- **API.** `GET /api/marketplace/notifications` returns the caller's newest 12
  rows plus an unread count; `POST /api/marketplace/notifications/read` marks
  all or the supplied ids, always scoped by the session. `GET`/`PATCH
  /api/readers/preferences` add `moderation` beside `newsletter`.
- **Migration.** `202611010002_moderation_notifications` adds the reader column,
  the notification table and the outbox target, and widens
  `TransactionalEmailOutbox_exactly_one_target`. Additive; applied to the local
  database.
- **Shared surfaces touched:** `apps/api/prisma/schema.prisma`,
  `apps/api/prisma/migrations/`, `changelog.md`, `pending.md`. Files:
  `marketplaceLifecycleController.ts`, `marketplaceNotificationController.ts`
  (new), `readerPreferencesController.ts`, `readerAccountController.ts`,
  `validation/schemas.ts`,
  `routes/marketplaceRoutes.ts`, `lib/cloudflareEmail.ts`,
  `jobs/sendTransactionalEmails.ts`, `lib/account-api.ts`,
  `lib/notification-api.ts` (new),
  `features/dashboard/notification-menu.tsx` (new),
  `features/dashboard/notifications-copy.ts` (new), `dashboard-shell.tsx`,
  `dashboard-search.tsx`, `components/layout/header.tsx`,
  `account-preferences.tsx` and its copy/tests,
  `e2e/notifications.spec.ts` (new), `e2e/mock-api.mjs` and
  `e2e/account-preferences.spec.ts`. `lib/i18n/`, `lib/types.ts` and
  `lib/api.ts` were not touched.
- **Budget.** The bell's code loads after hydration (a manual `import()` in the
  dashboard shell) instead of in the dashboard's first paint. The decorative
  reading-progress line was removed from the shared header; with the new client
  module in the graph, the FA detail page had reached 0.2 kB over its 165 kB
  gate. Both changes are presentation-only.
- **Verification.** Root typecheck; all tests (API, web 478, blog 17); web lint
  (0 errors, 2 pre-existing warnings); all builds; the migration applied to the
  local database and checked by running a real staff decision (a notification
  and one single-target outbox row were created, then removed with the temporary
  demo change). The first full serialized E2E run passed 505 with 46 intentional
  skips and four first-load-JS budget failures (dashboard 1.3 kB and FA detail
  0.2 kB over). After the lazy bell and the header trim, the budget,
  notifications and shared-navigation specs passed (42 passed, 6 skips); the
  remaining full suite was not re-run after that final presentation-only change.
  The panel was inspected against the local stack in EN/FA, light/dark,
  including RTL. Not verified: real Cloudflare delivery (the provider is not
  configured locally) and real-phone testing.
- **Out of scope / follow-ups.** Suspension decisions can reuse the same model.
  Transactional email copy is English, like the other account mail; a Persian
  email needs a stored locale or a bilingual template. Real delivery remains
  blocked on the Cloudflare Email Sending item in `pending.md`.

## 2026-11-01 — Listing views and reach (launch-readiness item 1)

- **What a creator sees.** Each studio listing card gains a "Reach · last 30
  days" block: total views, view→acquisition conversion, and a 30-day bar
  sparkline. A listing with no views says so and draws no chart; acquisitions
  that outnumber recorded views show a sentence instead of an invented
  percentage. The "Last 30 days" acquisitions metric is renamed
  "Acquisitions · 30 days" so the two windows do not read as one figure.
- **How a view is counted.** A client beacon sends one `POST
  /api/marketplace/products/:slug/views` per mount of a published listing
  page. Server-side counting was rejected: the product page is cached 30 s and
  prefetched by `Link`, so it would count prefetches and repeated renders. A
  visitor sending `Do Not Track` or Global Privacy Control is not counted;
  failures are ignored and never affect the page.
- **What is stored.** New `MarketplaceListingViewDaily` with the composite key
  `(productId, day)` and a `views` counter only — no IP, user agent, cookie,
  session, account or per-visitor row. Days are UTC calendar days; the upsert
  increments atomically and retries as an `update` if two first views of the
  day race. Deleting a listing cascades its totals away. Migration
  `202611010001_marketplace_listing_views` is additive.
- **API.** The public endpoint is rate-limited per address (120/hour) and only
  resolves published listings. The creator dashboard adds `viewsLast30Days`
  and a fixed 30-entry `viewsDaily` series (oldest first, zero-filled), both
  computed only from the caller's own listings.
- **Privacy.** The policy gains a "Listing views" section in both locales
  naming the daily totals, the absence of identifiers and the DNT/GPC opt-out.
- **Shared surfaces touched:** `apps/api/prisma/schema.prisma`,
  `apps/api/prisma/migrations/`, `apps/web/lib/api.ts`,
  `apps/web/lib/types.ts`, `changelog.md`, `pending.md`. Files:
  `marketplaceController.ts`, `marketplaceCreatorController.ts`,
  `routes/marketplaceRoutes.ts`, `middleware/security.ts`, `app.test.ts`,
  `creatorDashboard.integration.test.ts`, `app/products/[slug]/page.tsx`,
  `features/product/view-tracker.tsx` (new),
  `features/creator/creator-dashboard.tsx`, `workspace-copy.ts`,
  `e2e/listing-views.spec.ts` (new), `e2e/studio-feedback.spec.ts`,
  `e2e/mock-api.mjs`, `lib/legal.ts` and the test fixtures that carry the
  dashboard listing shape.
- **Verification.** Root typecheck, lint (0 errors, 2 pre-existing warnings) and
  all three builds passed. API: 318 passed, 1 skipped (the Redis limiter case)
  against a fresh disposable PostgreSQL 16 database with every migration,
  including a unit test that asserts the written row's only keys are
  `productId`/`day`/`views`, a race-retry test, and an integration test for the
  30-day series and window boundaries. Web: 473 passed. E2E: the new
  `listing-views` spec passes 6/6 (exactly one beacon with no body, DNT and GPC
  suppress it); `studio-feedback` and `budget` pass. A first parallel run also
  had a pagination strict-mode failure and a duplicate-label failure in
  `studio-feedback` (Persian "۳۰ روز گذشته" matched both the metric and the
  reach heading); the latter is fixed with an exact matcher, and both specs
  pass serially. Focused `design-consistency`/`persian`/`dashboard-repairs`
  batch: 58 passed, 12 device skips. Visual pass of the card in EN/FA,
  light/dark at 320/768/1280; detector: no findings.
- **Not covered.** Real-traffic calibration of the view limiter, the full E2E
  suite, production email and maintainer approval of the new Persian copy.


## 2026-10-31 — Settings email preferences (launch-readiness item 1)

- **What readers can do.** `/dashboard/settings` now has an "Email preferences"
  section with a "Weekly newsletter" switch: current state as words (On/Off),
  a saving state, a live success announcement, and named recovery for a
  rate-limited (429), expired session (401), offline/service failure and a
  failed initial load (with Retry, never a guessed state). English and Persian,
  RTL-aware, keyboard operable. The section only lists channels that exist;
  creator notification mail will extend it.
- **One source of truth, no migration.** The reader's newsletter state is the
  existing `NewsletterSubscriber` row keyed by the account email, so the public
  sign-up form and Settings cannot disagree. New
  `GET`/`PATCH /api/readers/preferences` (`requireReader`, zod boolean, new
  `readerPreferencesRateLimit`) read it; unsubscribing sets `active:false`
  with `updateMany` (it never creates a row for someone who never subscribed)
  and subscribing upserts `active:true` while keeping `subscribedAt`.
- **Consistency fixes this exposed.** The public sign-up form now reactivates
  an existing inactive row (before, a duplicate returned 202 but left the
  address unsubscribed forever). Changing the account email moves the
  subscription row to the new address inside the existing transaction,
  reviving an inactive row there; deleting the account deactivates the row for
  that address. The privacy policy's "Your choices" now names Settings as the
  place to change the newsletter subscription (EN/FA).
- **Lane note.** Settings is Ramtin's presentation lane; entered because
  `pending.md` item 1 assigned this work and the owner explicitly asked for it.
  Shared surfaces touched: `changelog.md`, `pending.md`. Files:
  `apps/api/src/controllers/readerPreferencesController.ts` (new),
  `newsletterController.ts`, `readerEmailController.ts`,
  `readerAccountController.ts`, `routes/readerRoutes.ts`,
  `middleware/security.ts`, `validation/schemas.ts`, `app.test.ts`,
  `readerFlow`/`readerEmail`/`readerAccount` integration tests;
  `apps/web/features/dashboard/account-preferences.tsx` and its copy/test
  (new), `account-settings.tsx`, `account-settings.test.tsx`,
  `lib/account-api.ts`, `lib/legal.ts`, `e2e/account-preferences.spec.ts` (new),
  `e2e/mock-api.mjs`.
- **Verification.** Root typecheck, lint (0 errors, 2 pre-existing warnings) and
  all three builds passed. API: 314 passed, 1 skipped (the Redis limiter case)
  against a fresh disposable PostgreSQL 16 database with every migration
  applied, including new integration coverage for subscribe → unsubscribe →
  resubscribe via the public form, email change moving the row, and deletion
  deactivating it. Web: 470 passed. E2E `account-preferences` 12/12 (EN/FA,
  desktop and mobile, Space-key toggle, persistence across reload, failed save,
  failed load + Retry). Focused settings/design batch: 120 passed; eight
  `dashboard-repairs`/`account-data` failures under parallel load all passed on
  a serial re-run (44 passed, 12 device skips), i.e. load flakiness rather than
  regressions. Visual pass of the new section in EN/FA, light/dark at
  320/768/1280 px; fixed a dark-theme thumb that inherited the surface colour
  and an early row wrap at tablet widths. Impeccable detector: no findings.
- **Not covered.** The full E2E suite, real email delivery (the Cloudflare
  domain is still missing) and maintainer approval of the new Persian copy.


## 2026-10-31 — Soft direction: navy/paper tokens and shared components

Phase 1 of the design-direction change requested by Ramtin: soften TermSpace
toward the calm, card-led feel of anicards.ir. Inspired by, not copied — no logo,
copy, imagery or illustration was taken from that site. The "Datasheet" rules
(square controls, ruled-only structure, no shadows) are retired.

- **Tokens.** Light theme retuned to a cool paper ground, white surfaces, navy
  ink, one blue signal and the anicards state palette (success `#047857`,
  warning `#b45309`, danger `#be123c`), converted to OKLCH. Dark theme keeps its
  structure but moves from violet 286–292 to a blue 262 hue with softer borders,
  so both themes share one brand. Added pastel tints (`--tint-sage/paper/mist/
  lavender`), a navy-tinted `--panel-shadow`/`--promo-shadow`, and the
  8/12/16/pill radius scale (`rounded-nav`, `rounded-control`, `rounded-card`,
  `rounded-chip`; `lg`/`xl`/`2xl` all resolve to the 16px panel step).
- **Globals.** Wired radii, tints and shadows into `@theme`, replaced the broken
  self-referential `--shadow-soft/lift/plasma/signal` aliases, and removed the
  dashboard's blanket zero-radius override. The dashboard now applies a
  control-radius fallback through `:where()` (zero specificity) so explicit
  utilities still win. The global focus outline no longer forces a 2px corner.
- **Shared components.** `Button` (12px, navy primary, `shadow-sm`), `Input`
  (12px, white field), `Badge` (pill), `ProductCard`/`CompactProductCard`
  (16px, hairline border, panel shadow, border-only hover), skeletons,
  `EmptyState`, `ContextHelp`, the header nav pills, account menu, dashboard nav
  and the shared creator/dashboard panels. Swept all 48 `rounded-none`
  occurrences; removed the old glow/lift shadow utilities from the landing
  process and search components.
- **Docs.** Rewrote `apps/web/DESIGN.md` as "Paper & Signal" with the new colour,
  shape, elevation and component contract, an explicit inspiration credit, and
  the retained type/density/state rules. Updated the local `/design-system`
  swatches and radius/elevation samples.
- **Verification.** Root typecheck; `npm test -w apps/web` 466 passed; web lint
  (0 errors, 2 pre-existing warnings); `npm run build` passed. Full E2E under
  parallel load: 455 passed, 32 failed; every failing spec was re-run serially
  (`--workers=1`) and all 254 re-run tests passed, confirming load flakiness
  rather than regressions. `design-consistency.spec` now asserts the new
  contract (12px fields, 16px shadowed cards) instead of zero radius, and the
  768px header check allows the new 44px nav pills. `budget.spec` (first-load
  JS) passed after dropping an unused `tint` prop from `ProductCard`. LHCI could
  not complete: Lighthouse's Chrome temp directory returns `EPERM` on cleanup
  on this Windows host after three attempts (including a redirected temp path),
  so it failed before assertions could run; no audit score regressed. Visual
  pass against the production mock build inspected home, explore, product,
  dashboard and 404 in EN/FA, light/dark, 390/768/1280px; contrast was computed
  for every text/surface pair (lowest 4.86:1). Detector: 7 advisory findings
  (Geist overused, Newsreader in OG-card CSS, spring easing), all documented in
  `DESIGN.md` and unchanged by this phase. Session `/usage` is not exposed by
  this harness.

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

- **Move the creator profile form from the studio to Settings.** The studio
  keeps only the first step, creating the profile (with its permanent handle),
  and hands straight over to the studio dashboard once it exists; Settings now
  edits the public name and biography in its own "Your creator profile"
  section, with the handle read-only, a revoked-access message instead of the
  form, and a "Become a TermSpace creator" link for readers without a profile.
  The studio shows an "Edit your profile" link to `/dashboard/settings#creator-profile`
  (Settings scrolls to it once the profile has loaded). One shared
  `CreatorProfileForm` serves both places, and the form is now labelled by its
  heading. A profile edit no longer reloads the session: only creating the
  profile grants the creator role, and the reload swapped the page for its
  skeleton and erased the "saved" message (found by the new E2E). Removed the
  unused `onReady` prop from `CreatorDashboard`. No API change, no shared
  surface touched.
  - Verification: root typecheck, lint (two existing warnings), creator and
    dashboard unit tests 145 (hub tests rewritten, four new Settings tests,
    four new hub tests); E2E dashboard-repairs, capabilities, studio-feedback,
    account-security, dashboard and budget 113 passed. The `context-help`
    tooltip check now waits for the page to settle (the panel repositions on
    scroll and the Settings page now has a help button further down); 66 of 66
    over three repeats. Not run: the full suites and the full E2E for the
    studio batch.

- **Studio onboarding and listing feedback (launch-readiness item).** The
  empty studio told new creators that draft creation was "the next part of the
  workspace" although the New listing button works; it now shows a four-step
  guide (describe it, link the source, submit for review, publish and learn)
  with New listing and "Connect a source in Settings" actions. Each listing
  card gains an "acquisitions in the last 30 days" metric and up to three
  recent reader reviews (rating, author name, 280-character excerpt, date)
  with a link to all reviews for published listings. The dashboard API adds
  `acquisitionsLast30Days` (completed orders, one grouped query) and
  `recentReviews` (published, not hidden, newest first, per listing); both
  read only the listings already selected for the caller. New copy is
  feature-local in `workspace-copy.ts` (English and Persian; the Persian needs
  maintainer approval) and overrides the stale shared `noListingsIntro`; the
  shared i18n files were not touched. Listing views and trends are queued as
  their own item because nothing records views yet.
  - Verification: root typecheck; API 4 new integration tests on the scratch
    database (30-day window, pending orders excluded, newest three visible
    reviews, hidden/unpublished/other creators' reviews never shown, empty
    creator) plus the mocked dashboard tests updated (134 pass); 7 new web unit
    tests and fixtures updated (153 pass across creator and dashboard); E2E
    new `studio-feedback` spec and neighbouring dashboard, repairs and budget
    specs: 92 passed, with one `context-help` mobile case that flakes in
    parallel and passes alone (22 of 22). Not run: full suites and the full E2E
    for this item. Shared surfaces: `pending.md`, `changelog.md`.

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
