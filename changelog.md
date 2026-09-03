# Changelog

Project changes completed from `pending.md` should be recorded here with the date, a short summary, and any verification performed.

## 2026-09-08

- Restored a localized creator entry point in the desktop and mobile header, linking to the existing creator section while seller onboarding is still in development. Verification: web typecheck and tests pass.
- Updated the marketplace locale switcher to preserve the current pathname and query string when changing between English and Persian. Verification: web typecheck and tests pass.
- Replaced the no-op homepage creator-guide button with a real localized link to the design system/quality guide. Verification: web typecheck and tests pass.
- Localized footer headings, link labels, and permission text; replaced placeholder destinations with marketplace, collection, creator, standards, account, and configured editorial-journal routes. Verification: web typecheck and tests pass.
- Localized the discovery featureâ€™s headings, search, filters, sorting, status labels, retry actions, and error copy through the shared English/Persian dictionary. Verification: web typecheck and tests pass.
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
- Fixed the three high-priority marketplace and deployment issues: both Next frontends now proxy `/backend` through runtime route handlers using the live `API_URL`, preserve host-only session cookies while forwarding requests to the shared API, and return bounded 502/504 errors for backend failures; the marketplace seed now explicitly publishes the catalog and updates existing creators, categories, and products on rerun. Verification: all workspace type-checks, API tests (20), and blog tests (14) pass; production build remains blocked by the sandbox denying Nextâ€™s worker port binding.
## 2026-09-03

- Restructured the marketplace product card. It rendered two competing paragraphs â€” `outcome` under the title and `description` again in a quote-bordered block â€” with the creator wedged between them, so cards of differing copy length pushed their dividers and footers to different heights across a row. `outcome` is now the only prose on the card, clamped to two lines with a floor height; the creator sits directly beneath it; rating and usage are consolidated onto one meta row; and the footer is pinned to the bottom so every card in a row aligns. `description` now appears only on the detail page.
- Gave every card an explicit `View details` call to action linking to `/products/[slug]`, replacing a 15px arrow glyph that was the only affordance. It carries an accessible name including the product name, so the control is distinguishable when a screen reader lists a grid of them.
- Collapsed the card `variant` union from `compact | expanded | list` to `card | list`; `expanded` existed only to render the duplicate description and became a dead branch.
- Added community publishing. `MarketplaceCreator` gains a nullable, unique `userId` referencing `ReaderUser` (`ON DELETE SET NULL`, so closing an account never deletes listings other people depend on), letting a signed-in reader claim a username and publish under it. New `/api/community` routes cover the creator profile and the member's own listings, all behind `requireReader` and scoped by `creatorId` so a member can only ever read or mutate their own rows. Seeded editorial creators keep `userId = null` and can never be matched.
- Held trust and pricing server-side on community submissions. `verified`, `featured`, `trending`, `rating`, review and usage counts, and price are all set by the controller and never read from the request body; submissions are published free because `acquireMarketplaceProduct` rejects any priced acquisition while no payment provider is configured.
- Added the `/dashboard` creator studio: claim a username (derived handle, reserved-word list), publish a listing, and hide, republish or delete your own. Copy is localized in both `en` and `fa` rather than hard-coded.
- Stopped the product detail page asserting trust it does not have. The `Verified product` badge and the `Safety verification â€” Package scan passed آ· Aug 18` row were hardcoded and rendered for every listing; an unverified community submission was presented to buyers as reviewed and scanned. Both now follow `product.verified`, and the compatibility panel reads the record's models instead of a hardcoded `Claude 4, GPT-5`. Detail sections with no content (use cases, included files, example input/output, installation steps, version history) are hidden rather than rendered as bare headings.
- Pointed the two dead creator entry points at the studio: the hero `Sell your work` button, which linked to a `#creators` anchor, and the `#creators` section button, which was a `<button>` with no handler at all.
- Registered Testing Library cleanup in `apps/web/vitest.setup.ts`. `globals` is off, so RTL never registered its own auto-cleanup and renders accumulated across tests in a file, making any second render in a file fail single-element queries.

- Documented how the two maintainers' agents work together, in `AGENTS.md`: the branch map (`development` as integration branch, `ramtin` and `v.2` as working branches), rebase-before-you-start, never rewriting shared history, treating `AGENTS.md` / `pending.md` / `changelog.md` as the handoff channel between agents, staying inside the task to avoid drive-by conflicts, announcing edits to the shared surfaces both sides touch, and a migration naming rule so two agents cannot create colliding migration numbers on separate branches.
- Added engineering rules to `AGENTS.md` so both agents make the same call in the same situation. Caching: `lib/api.ts` currently forces `cache: "no-store"` on every request, which is right for session-scoped data and wrong for the public catalog, so the rule is per-endpoint with a hard prohibition on caching anything that varies by session cookie. State management: a table choosing between server components, URL search params, `localStorage`, cookies, React context and Zustand, with Zustand named as the client-state library to adopt when a real case appears rather than speculatively.
- Corrected two stale facts in `AGENTS.md`: the database port is `DB_HOST_PORT` from the root `.env` and is `5434` on this machine, not the `5433` in `apps/api/.env.example`; and the repository does now have a Conventional Commit history.
- Split the dashboard into a side-navigated area. `app/dashboard/layout.tsx` wraps every dashboard page in a `DashboardShell` that owns the reader-session gate, so a new dashboard route cannot ship ungated, with `DashboardNav` alongside it. Three real pages: Overview (creator identity and listing counts), Creator studio (the existing publishing surface, moved to `/dashboard/studio`), and Settings (account details and sign out). Every nav entry points at a real page rather than a placeholder.

Verification: root `typecheck` clean across all three workspaces; 49 tests passing (25 API including 7 new community-publishing tests, 14 blog, 10 web); production `next build` for both frontends. The community flow was exercised end to end against the running stack â€” register, claim a username, publish, and the listing appearing on `/explore` and its detail page â€” plus negative cases: unauthenticated access rejected with 401, a second member unable to read, edit or delete another member's listing, reserved usernames and malformed slugs, types and categories rejected, duplicate handle and slug conflicts, and a submission attempting to set `verified`, `featured`, a price and a fake rating confirmed to be written with all of those forced to their safe defaults. `apps/web` lint is one error and four warnings, all pre-existing in `marketplace-session.tsx` and `product-actions.tsx` and recorded in `pending.md`; the previously reported `app/page.tsx` warning is resolved. The dashboard split was checked in the browser across all three tabs, including active-state highlighting.

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

