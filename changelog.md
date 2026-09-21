# Changelog

Project changes completed from `pending.md` should be recorded here with the date, a short summary, and any verification performed.

## 2026-09-21

- Normalized marketplace discovery taxonomy end to end: controlled platform
  keys now back relational platform, product-compatibility, release-
  compatibility, and community records; manifests reject creator-defined
  platforms; item-type, category, and platform filters accept stable keys only;
  and English/Persian labels remain at the presentation boundary. Added a
  forward-only legacy backfill that fails safely on ambiguous platform alias
  collisions instead of discarding compatibility metadata. Verification:
  Prisma generation and schema validation; all workspace type-checks; 176
  tests; web lint; API and web production builds; Blog webpack production
  build; and `git diff --check`. Runtime migration deployment remains pending
  because the local PostgreSQL service is stopped and Docker access requires
  elevated host privileges.

- Completed ADR 0002 community discovery and moderated placement lifecycle.
  Immutable per-snapshot creator requests now feed canonical, versioned
  many-to-many placements; moderator approval, rejection, and removal decisions
  append actor-attributed audit events and independently block self-moderation.
  Public APIs expose active communities and only approved placements attached
  to published listings, with explicit archived-community responses and
  combinable community, platform, category, item-type, rating, and search
  filters. Added bilingual community browse pages, discovery controls,
  canonical listing links, community badges, and placement decisions in the
  moderation preview. Verification: Prisma validation and client generation;
  all workspace type-checks; 174 tests; web lint; API and web production builds;
  Blog webpack production build; and `git diff --check`. Runtime migration
  deployment was not exercised because local PostgreSQL was stopped and this
  host requires an interactive sudo password to start Docker.
- Completed the Marketplace creator and submission lifecycle authorization test
  pass. Route-level Supertest coverage now verifies cross-owner draft reads,
  writes, release access, and lifecycle transitions; creator-only and
  moderator-only role boundaries; self-moderation rejection; unpublished
  listing and draft-artifact isolation; and bidirectional separation between
  marketplace authority and Blog administration. Verification: API tests,
  workspace type-checks, and `git diff --check`.

## 2026-09-18

- Completed the free-resource acquisition and installation flow. Public product
  responses and pages no longer expose actionable installation instructions;
  authenticated readers can add a resource idempotently, retain the exact
  approved release in their account library, and reveal only that release's
  verified package URL, immutable reference, source status, requirements, and
  installation steps. Installation now fails closed for unpublished products,
  restricted or mismatched releases, missing legacy release pins, and package
  URLs outside the approved GitHub/npm hosts. Acquisition responses omit user
  and idempotency data, private library/install responses disable caching, and
  the English/Persian account and product interfaces cover existing and new
  acquisitions. Verification: all workspace type-checks; 165 tests; web lint;
  API and web production builds; Blog webpack production build; and
  `git diff --check`.
- Implemented authenticated GitHub and npm source ingestion from ADR 0001.
  Creators can connect encrypted provider credentials from the bilingual release
  workspace, verify ownership through repository maintain/admin or package write
  access, and queue exact commit, release-asset, or package-version checks.
  Append-only check records preserve provider status, immutable references,
  canonical installation URLs, integrity digests, artifact sizes, latency, and
  correlation IDs without logging tokens or response bodies. A bounded worker
  applies timeouts, one provider-call retry, job-level exponential backoff,
  GitHub/npm rate-limit handling, stale availability for transient published
  failures, and acquisition restrictions for confirmed ownership or provenance
  failures; Docker now runs periodic reconciliation. Submission/publication
  requires a verified current check, while existing acquisitions remain pinned
  to their immutable release. Verification: Prisma generation; migration
  deployment against local PostgreSQL; source-worker database smoke test;
  Compose validation; all workspace type-checks; 155 tests; web lint; API and web
  production builds; Blog webpack production build; and `git diff --check`. The
  Blog's default Turbopack build remains unavailable because this host blocks its
  internal port binding.
- Added creator-controlled release/version management without replacing
  artifacts already acquired by users. Creator dashboards now link to an
  English/Persian release workspace that shows immutable source provenance,
  draft/public status, and the number of acquisitions pinned to every release;
  preparing an update continues through the moderated listing-draft lifecycle.
  New acquisitions persist the exact approved release manifest, fail safely
  when no modern approved release exists, and retain that reference when newer
  versions are published. Forward-only migrations add the acquisition-release
  relationship and database triggers that enforce same-listing published
  releases and prevent direct or indirect mutation of published release data.
  Verification: Prisma generation; all workspace type-checks; 141 tests,
  including owner-scoped history, exact release pinning, unavailable-release,
  dashboard navigation, and release-provenance UI coverage; web lint; migration
  deployment against local PostgreSQL; API, web, and Blog webpack production
  builds; and `git diff --check`.
- Completed the cross-project reliability and validation pass. API requests now
  receive validated correlation IDs that are returned on every error and carried
  through redacted structured request logs; malformed JSON, oversized bodies,
  unknown routes, invalid path identifiers, upload failures, database conflicts,
  and unexpected production failures use stable public error codes without
  exposing parser details, request URLs, stack traces, credentials, or submitted
  content. All dynamic route parameters are now schema-validated before database
  access, complementing the existing authoritative body, query, upload, lifecycle,
  stale-write, and source validation. Marketplace and Blog API clients now apply
  12-second deadlines, retry transient read failures once, never retry mutations,
  and expose structured validation details and correlation IDs. Added localized,
  accessible route and global recovery screens to both frontends, and structured
  correlation-aware terminal outcomes to scheduled publishing. Verification: all
  workspace type-checks; 136 tests, including new malformed-input, unsafe-ID,
  correlation, retry cleanup, and non-retried-mutation coverage; web lint; API,
  web, and Blog webpack production builds; and `git diff --check`. Bugbot's two
  retry-response cleanup findings were resolved before commit; Security Review
  reported no actionable findings.
- Repositioned the main application as a free community library for agentic
  coding resources. Replaced marketplace, seller, buyer, checkout, purchase,
  and price language across English/Persian navigation, discovery, resource
  cards, item actions, moderation copy, accessibility labels, the design-system
  prototype, README, product direction, and architecture guidance. Removed
  pricing filters, price sorting, and price displays; changed the primary flow
  to sharing and adding resources to a library; and relabeled usage eligibility
  as verified use. Added a forward-only migration and database constraint that
  normalize every existing listing to free and prevent future non-free product
  rows while preserving legacy internal identifiers. Development fixtures and
  seed data now contain free resources only. Verification: Prisma generation;
  all workspace type-checks; 130 tests; web lint; API and web production builds;
  Blog webpack production build; `git diff --check`; and all 19 migrations,
  including the free-resource normalization and constraint, applied successfully
  to the local PostgreSQL database, where all 12 existing resources now report
  zero non-free records. Rebuilt and recreated the local API and web containers;
  the API health endpoint and the home and explore pages returned HTTP 200.

## 2026-09-17

- Simplified creator-facing names and descriptions from the browser-feedback
  review. Creator public names and listing names now accept English characters
  only, the Persian listing-name field has been removed, and creators may write
  a listing description in English, Persian, or both while at least one remains
  required. Existing Persian descriptions continue to project correctly on
  public listings. Added matching English/Persian guidance, authoritative API
  validation, accessible browser validation, regression coverage, and updated
  manifest documentation. Verification: all workspace type-checks; 128 tests;
  API and web production builds plus the Blog webpack production build; web
  lint; and `git diff --check`. The Blog's default Turbopack build remains
  unavailable because this host blocks its internal port binding.
- Added an explicit local-only email-verification bypass for browser testing
  without an external mail provider. New local password registrations are
  verified without creating outbox work, and older unverified accounts are
  verified after a successful password login. The bypass fails closed unless
  `WEB_PUBLIC_URL` uses an exact loopback host and remains disabled by default.
  Documented the flag and enabled it only in the ignored local environment.
  Verification: API type-check; 98 API tests; Docker API production build; a
  registration through the marketplace `/backend` proxy returned a verified
  session with zero email jobs; and the temporary test account was removed.
- Updated the project README to reflect the current marketplace, creator,
  moderation, community, and Blog boundaries; distinguish implemented features
  from pending roadmap work; document Node/Docker prerequisites and migration
  startup behavior; and provide verified persistent and clean-reset Compose
  workflows with explicit data-loss and configurable-port guidance.
- Fixed clean PostgreSQL provisioning for the marketplace moderation schema by
  committing the new lifecycle enum value before adding the internal-note
  constraint that references it. Verification: reset both Compose-managed
  volumes; rebuilt the affected images without cache; applied all 18 migrations
  to an empty PostgreSQL 16 database; confirmed every container is running; and
  received HTTP 200 responses from the web, Blog, and API health endpoints.
- Added the role-gated marketplace moderation workspace with an oldest-first,
  searchable state queue; source and ownership readiness; immutable text-only
  submission previews; approved-baseline context; community requests; listing
  approval, publication, change requests, rejection, suspension, archival, and
  restoration controls; creator-safe public reasons; and private staff notes.
  Decisions and standalone notes share the append-only lifecycle audit trail,
  use listing-scoped locking and optimistic concurrency, and preserve unique
  correlation IDs. Staff-owned listings are excluded from that staff member's
  queue, while preview, note, and decision APIs independently reject
  self-moderation so private review context cannot leak to a creator who also
  holds a staff role. External screenshots and artifacts are never fetched or
  executed by the preview, private notes are absent from creator/public APIs,
  and marketplace roles remain isolated from Blog administration. Verification:
  Prisma generation and schema validation; all workspace type-checks; 118 tests;
  API and web production builds plus the Blog webpack production build; web
  lint; `git diff --check`; all 17 migrations applied to an isolated PostgreSQL
  17 database; and direct checks of private-note validation and append-only
  audit enforcement.

## 2026-09-16

- Added the complete creator draft workspace for all nine marketplace item
  types, with English/Persian metadata, external HTTPS screenshots, category
  and community placement requests, exact GitHub/npm source references,
  compatibility, installation, requirements, permissions, licensing, and
  type-specific fields. Draft APIs are authenticated and owner-scoped, use
  optimistic concurrency, create immutable manifest/listing/release revisions,
  and append `DRAFT_SAVED` audit events. Published listings retain their
  approved public snapshot while replacements are drafted, and public product
  pages exclude draft-only versions. Added the initial staff-defined community
  registry and append-only, same-listing placement requests without prematurely
  exposing unmoderated community browse results. Verification: Prisma client
  generation and schema validation; all workspace type-checks; 109 tests; API
  and web production builds plus the Blog webpack production build; web lint;
  `git diff --check`; all 16 migrations applied to an isolated PostgreSQL 17
  database; and direct checks of the placement-request append-only and
  same-listing constraints. The Blog's default Turbopack build remained
  unavailable because this host blocks its internal port binding; its webpack
  build passed.
- Added an authenticated, owner-scoped creator dashboard with bounded listing
  pagination, lifecycle status, public moderation feedback, release history,
  ratings, completed-acquisition counts, and recent lifecycle activity. The
  `/creator` workspace now includes responsive summary and listing views,
  accessible loading/error/empty states, public-listing links, profile editing,
  English/Persian copy, RTL-aware navigation, and locale-correct numbers and
  dates. Dashboard authorization fails closed for accounts without an active
  creator grant, and acquisition metrics are calculated from completed orders
  rather than trusting mutable product counters. Verification: all workspace
  type-checks; 103 tests; API, web, and Blog webpack production builds; web
  lint; and `git diff --check`.
- Resolved the Bugbot and Security Review findings against the marketplace
  listing lifecycle. Publication now atomically timestamps and freezes the exact
  approved release manifest; new products default to unpublished drafts at both
  Prisma and database levels; grandfathered legacy publications can return from
  suspension or creator archival without fabricated modern verification; and
  creators cannot reverse staff archival. Enforcement audit events now identify
  the approved public snapshot when a separate edit is pending. Verification:
  Prisma generation and schema validation; all workspace type-checks; 97 tests;
  API and web production builds plus the Blog webpack production build; web
  lint; `git diff --check`; all 15 migrations applied to an isolated PostgreSQL
  17 database; and direct confirmation that the migrated `published` default is
  `false`. The Blog's default Turbopack build remained unavailable because this
  host blocks its internal port binding; its established webpack build passed.

## 2026-09-15

- Established the TermSpace product direction: the main application is a
  community and creator marketplace for agentic coding tools, while the Blog is
  a separate staff-managed editorial service with no public publishing access.
- Adopted an external-source-first artifact model for the initial marketplace
  lifecycle. GitHub repository content, GitHub release assets, and npm packages
  must resolve to immutable public releases with explicit ownership checks,
  provenance, availability handling, reconciliation, and auditable takedowns.
  TermSpace-hosted uploads require a later architecture decision and threat
  model. Verification: documentation links reviewed and `git diff --check`
  passes.
- Defined communities as staff-created, platform-oriented publishing spaces
  where any authenticated user can request placement for a canonical listing.
  Community placement is moderated, supports cross-community sharing without
  duplicate listings or reputation data, and remains independent from platform
  compatibility and Blog permissions. Verification: ADR and documentation links
  reviewed and `git diff --check` passes.
- Defined nine stable marketplace item types and a versioned submission manifest
  separating mutable listing metadata from immutable release metadata. The
  contract includes structured permissions and type-specific installation and
  compatibility requirements, with explicit handling for existing uncontrolled
  type strings. Verification: existing API, seed, filter, and frontend type usage
  audited; ADR and documentation links reviewed; `git diff --check` passes.
- Defined the marketplace trust and moderation baseline: separate verification
  signals, risk-based submission review, acquisition-backed user reviews,
  case-based reporting, scoped reversible enforcement, appeals, ownership
  transfers, and append-only audit requirements. The policy explicitly isolates
  marketplace authority from Blog editorial access. Verification: current auth,
  publication, review, and moderation behavior audited; ADR and documentation
  links reviewed; `git diff --check` passes.
- Added verified-email state and explicit, revocable creator, moderator, and
  marketplace-administrator grants without coupling them to Blog administrator
  accounts. Reader sessions now expose verification and active roles; privileged
  marketplace middleware fails closed; and an operator command grants or revokes
  roles with append-only events. Verified Google claims of matching unverified
  password accounts now clear the old password and sessions atomically to prevent
  account pre-hijacking. Verification: Prisma client generation and schema
  validation; migration applied successfully to an isolated PostgreSQL schema
  and rolled back; all workspace type-checks; 43 tests; API, web, and Blog
  production builds (frontends via webpack); web lint; and `git diff --check`.
- Added first-party verification for password accounts using 30-minute,
  single-use HMAC-signed links carried in URL fragments, atomic consumption,
  account-serialized resend limits, generic resend responses, and bounded
  verification attempts. Registration now writes a transactional outbox job;
  a PostgreSQL-safe worker delivers redacted HTML/text messages through
  Cloudflare Email Service with timeouts, retry classification, stale-job
  recovery, correlation IDs, and a five-attempt ceiling. Added localized
  English/Persian verification UI, deployment configuration, provider and DNS
  onboarding guidance, and disabled Next's experimental TypeScript CLI path to
  avoid its empty-output build failure while retaining compiler-API checks.
  Verification: Prisma generation and schema validation; all workspace
  type-checks; 58 tests; API, web, and Blog production builds (frontends via
  webpack); web lint; Compose configuration validation; and `git diff --check`.
  Live migration execution was unavailable because local PostgreSQL was stopped
  and this host denied Docker daemon access.
- Added verified-user creator onboarding and authenticated creator-profile
  ownership. User-owned creator records now have a unique, deletion-restricting
  reader relationship while existing seeded creators remain explicitly
  system-owned through a null owner. Self-service onboarding serializes requests
  per account and atomically creates the profile, active creator grant, and
  append-only role event; revoked grants cannot be self-restored. Owner-derived
  APIs expose and update only the signed-in creator, stable handles become
  immutable after creation, and revoked roles immediately block profile edits.
  Added a responsive English/Persian `/creator` onboarding and profile screen,
  replaced the dead header creator anchor, and documented ownership and future
  transfer constraints. Verification: Prisma generation and schema validation;
  all workspace type-checks; 65 tests; API, web, and Blog production builds
  (frontends via webpack); web lint; Compose validation; and `git diff --check`.
  Live migration execution remained unavailable because this host cannot access
  the stopped PostgreSQL container. Seed reruns now fail loudly instead of
  overwriting a user-owned profile whose handle conflicts with seeded data.
- Implemented ADR 0003's controlled nine-type marketplace registry and strict,
  versioned manifest validator with canonical SHA-256 audit snapshots,
  type-specific requirements, structured permissions, safe relative paths, and
  exact GitHub/npm source identities. Added normalized release persistence and
  database-enforced immutability after publication, while preserving the legacy
  public `type` field and adding stable `typeKey` responses and filters. The
  migration directly classifies known legacy values and flags `AI tool`,
  `Developer utility`, and unknown values for manual review without guessing.
  Verification: Prisma client generation and schema validation; all workspace
  type-checks; 81 tests; API, web, and Blog production builds (frontends via
  webpack); web lint; Compose validation; and `git diff --check`. Live migration
  execution was unavailable because PostgreSQL is stopped and this host cannot
  access the Docker daemon.
- Added the ADR 0004 listing lifecycle with draft, submitted, changes-requested,
  approved, published, rejected, suspended, and archived states while keeping
  review state separate from public availability. Immutable proposed and
  approved snapshots bind each modern submission to its exact validated
  manifest and verified release; publication promotes the reviewed snapshot
  without replacing the last approved public listing during review. Creator and
  staff transition endpoints enforce ownership, self-moderation separation,
  source rechecks, public-safe adverse-decision reasons, optimistic concurrency,
  advisory locking, and atomic append-only audit events. Existing listings are
  backfilled with legacy approved/proposed snapshots, and fresh seed products
  now publish through system lifecycle events while reruns preserve managed
  state. Verification: Prisma client generation and schema validation; all
  workspace type-checks; 93 tests; API, web, and Blog production builds
  (frontends via webpack); web lint; Compose validation; `git diff --check`; all
  14 migrations applied to a clean isolated PostgreSQL 17 database; two
  successful seed runs; and direct confirmation that append-only and
  cross-listing snapshot triggers reject invalid mutations.

## 2026-09-08

- Restored a localized creator entry point in the desktop and mobile header, linking to the existing creator section while seller onboarding is still in development. Verification: web typecheck and tests pass.
- Updated the marketplace locale switcher to preserve the current pathname and query string when changing between English and Persian. Verification: web typecheck and tests pass.
- Replaced the no-op homepage creator-guide button with a real localized link to the design system/quality guide. Verification: web typecheck and tests pass.
- Localized footer headings, link labels, and permission text; replaced placeholder destinations with marketplace, collection, creator, standards, account, and configured editorial-journal routes. Verification: web typecheck and tests pass.
- Localized the discovery feature’s headings, search, filters, sorting, status labels, retry actions, and error copy through the shared English/Persian dictionary. Verification: web typecheck and tests pass.
- Discovery errors now preserve API failure messages such as rate limiting, distinguish them from connection failures, and expose an in-place Retry control. Verification: web typecheck and tests pass.
- Made seed reruns non-destructive for administrator passwords, taxonomy metadata and article relationships, and edition ordering; `SEED_RESET=true` is now required for intentional seeded relationship/order resets. Verification: API typecheck and seed completed successfully.
- Series metadata and page rendering now treat only API 404s as missing content; network and server failures propagate as retryable errors, matching article behavior. Verification: blog typecheck and tests pass.
- The blog frontend proxy now validates admin cookies against the API, redirects confirmed stale sessions to login, clears them, and allows requests through during transient backend failures. Verification: blog typecheck and tests pass.
- Public edition, current-edition, and archive responses now exclude unpublished nested articles while admin edition responses retain drafts for editorial management. Verification: API typecheck and tests pass.
- Revision restores now snapshot the article state being replaced inside the same transaction before applying the selected revision, making restores reversible. Verification: API typecheck and tests pass.
- Normalized article publication state so published articles always clear `scheduledAt`; new published articles cannot retain a future schedule, and updates repair existing conflicting state. Verification: API typecheck and tests pass.
- Made article optimistic concurrency and revision creation atomic: updates now lock the article row, validate the expected timestamp, create the prior snapshot, and apply the update in one transaction. Verification: API typecheck and tests pass.
- Separated rejected Google credentials from database/session failures: credential verification still returns a safe 401, while persistence errors are logged and reach the centralized 500 handler. Verification: API typecheck and tests pass.
- Fixed the homepage article split so the newest article is not discarded as an invisible `featured` item; all fetched articles now render in the latest-writing rail, including when only one exists. Verification: blog typecheck and tests pass.
- Fixed the three high-priority marketplace and deployment issues: both Next frontends now proxy `/backend` through runtime route handlers using the live `API_URL`, preserve host-only session cookies while forwarding requests to the shared API, and return bounded 502/504 errors for backend failures; the marketplace seed now explicitly publishes the catalog and updates existing creators, categories, and products on rerun. Verification: all workspace type-checks, API tests (20), and blog tests (14) pass; production build remains blocked by the sandbox denying Next’s worker port binding.

## 2026-09-02

- Fixed the containerized `/backend` proxy for both frontends. Next evaluates `rewrites()` at build time and bakes the destination into `.next/routes-manifest.json`, so the runtime `API_URL` that compose set on the `web` and `blog` services was never applied and both images shipped the `http://localhost:4001` fallback; inside the container that is the container itself, so every browser request through `/backend` returned 500 with `ECONNREFUSED` and `/explore` showed "Products could not be loaded. Please retry." `API_URL` is now supplied as a Docker build argument. Verification: rebuilt both images and confirmed the baked destination is `http://api:4001/:path*`; `/backend/api/health` and `/backend/api/marketplace/products` return 200 on web and blog where all three previously returned 500; no `ECONNREFUSED` in either container log; `/explore` renders the empty state with a clean browser console instead of the error banner.
- Removed the hero stat rail, which advertised 2,847 listings, 190k installs and 100% declared permissions. None of those figures are backed by data, so presenting them to early visitors was misleading. Also dropped the `STATS` constant and the orphaned `CountUp` import.
- Removed the seller entry points that had no product behind them: the `For creators` nav item, the `Start selling` button in both the desktop header and the mobile drawer, the dead `Start selling` footer link, and the now-unused `creators` and `startSelling` keys in both locales. There is no seller onboarding, no `/sell` route and no `/creators` route; all four pointed at the `#creators` anchor, which does not exist outside the homepage.
- Ignored the `maintenance/` scratch directory along with local tooling and build artifacts so screenshots and agent state stay out of the repository.

Verification for the three changes above: `typecheck` clean, 8 web tests passing, and a production `next build` for `@termspace/web`; header, footer and Persian homepage checked in the browser. The pre-existing `apps/web` lint error and five warnings are unrelated to these files and are recorded in `pending.md`.

## 2026-09-01

- Disabled unverified password registration and password setup for Google-only sessions, preventing reader-account pre-hijacking, address enumeration, and persistent takeover from a stolen session; new readers onboard through verified Google sign-in.
- Restricted article previews to authenticated administrators and limited server-side cookie forwarding to the admin session cookie.
- Reworked media deletion into a retryable tombstone lifecycle, added revision-aware reference checks and database guards against reusing unavailable media, and retained failed deletions for safe retries.
- Removed raw visitor-query collection and public exposure, purged legacy search telemetry, bounded full-text input, added a Persian-compatible index, stabilized article pagination, and stopped pre-filter search caps from hiding valid results.
- Hardened Docker deployment with required database credentials, loopback-only PostgreSQL publishing, trusted-proxy configuration, R2 propagation, build-time frontend configuration, scheduled publishing, and non-root runtime users.
- Verification: all workspace type-checks, 42 tests, and production builds pass; Compose configuration validates; all nine migrations apply successfully to a clean temporary PostgreSQL 17 database. Docker image assembly could not be executed because this host denies access to the Docker daemon.

## 2026-08-31

- Consolidated the main TermSpace site, editorial frontend, and shared API into an npm-workspace monorepo under `apps/web`, `apps/blog`, and `apps/api`; added root commands and three-app CI coverage. Verification: root type-check, 40 tests, and production builds for all workspaces.
- Added the missing initial Prisma content migration, allowing a clean database to create authors, categories, and articles before later editorial migrations alter them.
- Added shared marketplace persistence and API routes for catalog discovery, product detail, creators, categories, versions, reviews, account favorites, and idempotent acquisition; connected the main TermSpace frontend and newsletter form to those APIs.
- Corrected both frontend API clients to prefer private `API_URL` during server rendering and browser-safe `NEXT_PUBLIC_API_URL` in client code.
- Made `/api/health` execute a database readiness query and return `503 DATABASE_UNAVAILABLE` when the shared backend loses its database.
- Added configurable `SESSION_COOKIE_DOMAIN` support and documented the sibling-subdomain deployment contract so reader login can be shared between the main site and Blog while remaining host-only in local development. Verification: all workspace type-checks and 40 tests pass.

## 2026-08-24

- Fixed markdown HTML escaping so article body rendering converts `&`, `<`, and `>` to entities before using `dangerouslySetInnerHTML`. Verification: `npm run typecheck` in `frontend/`.
- Added token-based admin authentication for the `/admin` UI, protected backend article/category write routes, and required admin authorization for draft article listing. Verification: `npm run prisma:generate` and `npm run typecheck` in `backend/`; `npm run typecheck` in `frontend/`.
- Hid unpublished article detail pages from public requests while still allowing authenticated admin edit fetches. Verification: `npm run typecheck` in `backend/` and `frontend/`.
- Set `publishedAt` automatically when creating or first publishing an article, while preserving existing publish dates when articles are unpublished. Verification: `npm run typecheck` in `backend/`.
- Added persistent newsletter signup with a Prisma subscriber model, backend subscription endpoint, and frontend form submission. Verification: `npm run prisma:generate` and `npm run typecheck` in `backend/`; `npm run typecheck` in `frontend/`.
- Added rendered markdown preview support to the article editor. Verification: `npm run typecheck` in `frontend/`.
- Added admin article search, status/category filters, sorting, and pagination backed by the existing article list API. Verification: `npm run typecheck` in `frontend/`.

## 2026-08-25

- Added a self-hosted English editorial type system using Manrope for interface/body text and Newsreader for headings and long-form prose; both are SIL OFL 1.1 licensed.
- Replaced the partial Persian pathname checks with a centralized `next-intl` message provider, persistent locale-aware public links, complete RTL document/prose rules, and localized public error, topic, tag, series, card, newsletter, and hero UI. Verification: frontend type-check, 8 tests, and production build.
- Replaced the Persian system-font fallback with the self-hosted Estedad variable family, an OFL-licensed geometric Persian typeface, across RTL body, display, and label typography.
- Added Persian as a public locale under `/fa`, including RTL document layout, localized navigation, editions, journal controls, resources, reader accounts, library, newsletter, comments, current-edition metadata, featured article metadata, language switching, and explicit English article-body fallbacks.
- Added numbered editorial editions with admin composition, ordered article selections, cover imagery, editor notes, per-edition accent palettes, a public archive, and a redesigned current-edition homepage experience.
- Replaced code-managed Markdown downloads with an admin resource manager supporting validated `.md` uploads, metadata editing, previews, draft/published status, downloads, and deletion; migrated the public catalog to database-backed resources.
- Added optional reader accounts with email/password and Google sign-in, secure independent sessions, cross-device bookmark/history/progress syncing, and anonymous local-library migration. All published content remains public without authentication.
- Added a public Markdown resource library with rendered previews, direct downloads, curated project templates, and navigation links. Verification: frontend type-check, tests, and production build.
- Replaced raw article and author image tags with Next.js `Image` components and configured remote image patterns. Verification: `npm run typecheck` in `frontend/`.
- Strengthened the homepage hero with a first-viewport editorial background image and readable overlay treatment. Verification: `npm run typecheck` in `frontend/`.
- Improved mobile admin table rendering with horizontal overflow and stable minimum table widths for article and category management. Verification: `npm run typecheck` in `frontend/`.
- Fixed the article card border token to use the configured `border-line` Tailwind color. Verification: `npm run typecheck` in `frontend/`.
- Added backend-computed article reading minutes from full content for list responses and updated article cards to display that value. Verification: `npm run typecheck` in `backend/` and `frontend/`.
- Debounced public blog search requests and synchronized search, category, and page state to URL query parameters. Verification: `npm run typecheck` in `frontend/`.
- Added public blog sort controls for newest, oldest, and title ordering. Verification: `npm run typecheck` in `frontend/`.
- Replaced destructive admin `window.confirm` prompts with an accessible in-app confirmation dialog for article and category deletion. Verification: `npm run typecheck` in `frontend/`.
- Added dirty-form protection for article create/edit flows with browser unload prevention and an in-app discard confirmation. Verification: `npm run typecheck` in `frontend/`.
- Added dynamic article and category page metadata with descriptions, canonical URLs, and Open Graph fields. Verification: `npm run typecheck` in `frontend/`.
- Replaced shared admin tokens with bcrypt-backed administrator accounts and expiring database sessions stored in `HttpOnly` cookies, including login/logout flows and rate limiting.
- Added local image fallbacks, runtime image failure recovery, HTTPS/host validation, and restricted Next.js remote image configuration.
- Added Helmet headers, structured/redacted request logging, request-size limits, global/auth/newsletter rate limits, trusted-proxy configuration, and bounded graceful shutdown.
- Added Vitest/Supertest/Testing Library coverage and a GitHub Actions matrix that type-checks, tests, and builds both packages.
- Updated vulnerable dependencies to audited releases and added production Prisma migration support. Verification: both packages pass type-check, tests, and production builds; npm reports zero vulnerabilities.
- Updated article, category, admin-edit, blog-filter, and login routes for Next.js 16 asynchronous `params`/`searchParams`, fixing seeded article detail pages that incorrectly returned 404. Verification: frontend type-check, tests, build, and live HTTP 200 checks for seeded article and category routes.
- Added an admin media library with local development storage and Cloudflare R2 production storage, server-side type/size validation, Sharp rotation/cropping/WebP compression, required alt text, reusable URLs, and safe deletion.
- Added article autosave, optimistic edit-conflict detection, snapshot revision history with restore, unlisted preview links, series ordering, and scheduled publishing with an explicit cron command.
- Added tag and series management, public topic/tag/series pages, seeded relationships, and tag-aware related-content recommendations.
- Replaced substring search with a PostgreSQL GIN-indexed full-text query, added highlighted matches and popular-query tracking, and exposed popular searches in the blog explorer.
- Added browser-private bookmarks, reading history/progress, share controls, RSS, moderated comments, and admin comment approval/deletion.
- Verification: applied `202608250002_content_platform_features`; seeded 7 tags and 2 series; passed backend/frontend type-checks, tests, builds, and live API smoke tests including upload/delete and full-text search.

## 2026-08-27

- Replaced the planned administrator-management expansion with reader profiles that show account details, bookmarks, reading history, and progress; added password setting/changing with current-password verification and invalidation of other reader sessions. Verification: backend type-check, 16 tests, and production build; frontend type-check, 12 tests, and production build.
# 2026-09-08

- Added the missing reader registration endpoint used by the marketplace account form and covered duplicate-email handling.
- Made the blog admin route guard fail closed when the authentication API is unavailable.
- Included both frontend Next.js runtime configs in their production images so image and runtime settings are preserved after deployment.
- Fixed web navigation/lint issues and made CI run lint on both main and development pushes.
- Made reader logout idempotent so stale sessions can still be cleared.
- Pointed the blog homepage subject-browsing CTA to the topics index.
- Localized public article dates using the active English or Persian locale.
- Fetched one extra related article so excluding the current article still leaves three recommendations when available.
- Skipped the redundant first-mount marketplace fetch when server-rendered discovery data is already available.
- Paginated sitemap article retrieval so all published articles can be indexed.
- Added pagination controls to category archives.
- Added pagination controls to tag archives.
- Restored local bookmark storage as well as React state when a signed-in bookmark mutation fails.
- Added a direct authenticated article-by-ID endpoint for admin editing instead of scanning the first 200 articles.
- Paginated article loading for edition selection so older articles are available to editors.
- Removed the unused web `CountUp` component and its orphaned tests.
- Pinned all web package dependencies to the versions already resolved in the lockfile.
