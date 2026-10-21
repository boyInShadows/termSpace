# TermSpace pre-deployment readiness review

## Deployment follow-up — 2026-10-21

Web/API is deployed as a private HTTPS preview at
`https://termspace.localhost:8443` through an operator SSH tunnel. The VPS has
2 CPUs, about 4 GB RAM and an expanded 40 GB disk. Existing INSIGHT remains
active on its original ports, database and Nginx site. TermSpace publishes only
loopback web 3300/private TLS 8443; external checks reject those ports, API 4001,
PostgreSQL 5432 and Redis 6379. Blog/email workers and the editorial scheduler
are deferred; no demo, administrator or bypass account is present.

Hosted run 39424662557 passed all three images for `41a818d`. The preview passed
6 disposable database/Redis integration tests and live HTTPS session/CSRF and
unverified-creator checks. Encrypted backups match their off-server copies;
restore recovered all 30 migrations, 8 categories, 9 platforms, empty readers and
catalog, and the exact upload marker bytes in disposable resources. Previous
web image compatibility, stopped-worker detection and API/web restart recovery
passed. Nightly encrypted backups and five-minute local health checks are active.
See [changelog.md](changelog.md) and [deploy/README.md](deploy/README.md) for
evidence, image digests and operation.

Repository status: `codex/vps-preview` is in
[draft PR #11](https://github.com/boyInShadows/termSpace/pull/11), not yet merged
into `main`. Live application images remain pinned to `41a818d`; VPS deployment
scripts are at `f780314`. All PR checks passed at `f780314`, including browser,
integration and image checks. Lighthouse passed after one failed-job retry at
unchanged budgets. Later image builds are not automatically deployed.

The original summary/checklist below describe the 2026-10-19 review and contain
stale unchecked entries. B1–B8 and S1–S10 have later fixes/corrections in their
detailed sections; web CSP is now nonce-enforced. S13–S19 below distinguish the
current web/API preview from the deferred blog and remaining CI/alerting work.
Public DNS/TLS, sending domain/provider, legal/contact review and signup consent,
Google OAuth, administrator identity, real inbox verification/reset and verified
creator/moderator acceptance remain owner-dependent launch gates. No verification
bypass is used to satisfy preview acceptance. Private readiness does not approve
public launch.

## Original assessment — 2026-10-19 (historical)

Date: 2026-10-19 · Branch: `ramtin` · Scope: `apps/web`, `apps/blog`, `apps/api`, `docker/`, `docker-compose.yml`, `.github/`

**How this was produced.** Source files were not modified. Findings come from three read-only code explorations (API; web+blog; infra/secrets/CI), plus the commands listed under "Commands run". Line numbers come from those explorations and were not all re-checked by hand, so confirm a line before you edit it. Nothing was run against a live deployment. Items marked *verify* depend on your production topology, which I could not see.

### Original summary — superseded by the deployment follow-up above

**Verdict: don't ship yet.** The application code is in good shape: typecheck, lint and build pass, production dependencies have 0 known vulnerabilities, and the API is careful (Zod everywhere, owner-scoped queries, parameterized SQL, no SSRF or open redirects, hashed tokens, Origin-checked CSRF, git history free of secrets). The blockers are almost all deployment configuration and launch hygiene. The rate limiter probably buckets every user together behind your proxy chain. The API container will not shut down gracefully. A mistyped `NODE_ENV` leaks error messages. The blog can bake `localhost` into canonicals and the sitemap. A copied `.env.example` yields a live default admin. Neither site has a privacy policy, terms or content policy, and the footer links to a dev showroom. Security headers are limited to `frame-ancestors`. Each is a small fix; I'd expect a day's work to clear all eight.

## BLOCKERS

**B1. ~~Rate limiting may collapse to one bucket~~ — FIXED in phase 1 (corrected diagnosis).** My first reading (browser traffic all sharing one IP) was wrong: `/backend` forwards the edge's `X-Forwarded-For`, and with `TRUST_PROXY=1` the API reads its rightmost entry, which is the real client. The actual defects were (a) server-rendered pages call the API directly from the frontend containers with no `X-Forwarded-For`, so every SSR read shared one IP and one 300/15 min bucket (the blog sends every request to the API, see S21); and (b) if the edge sets no `X-Forwarded-For`, a client-supplied one is trusted. Fixed: `apiRateLimit` no longer counts header-less calls when a proxy is trusted (`middleware/security.ts`), and both `/backend` handlers always send the header (`127.0.0.1` fallback, so a missing edge header lands in one shared bucket instead of bypassing). **Still on you:** the edge proxy must set or append `X-Forwarded-For` with the real client address, and `TRUST_PROXY=1` stays correct for edge → Next → API.

**B2. ~~API never shuts down gracefully, and migrates on every start.~~ FIXED in phase 1** (one-shot `migrate` service; API runs `node dist/index.js` as PID 1; workers get `init: true`). Original finding: `docker-compose.yml:~53-62` runs `sh -c "prisma:deploy && start"`. `sh` is PID 1 and does not forward SIGTERM, so the handler in `apps/api/src/index.ts:17-39` never runs and Docker SIGKILLs. Migrating at start also races with more than one replica, and `prisma` is a devDependency (`apps/api/package.json:46`), which blocks pruning dev deps from the image.
Fix: `exec` the node process (or `init: true`); move `prisma migrate deploy` to a one-shot `migrate` service that the API depends on; move `prisma` to `dependencies` or run it from the migrate image.

**B3. ~~500 responses leak internal messages unless `NODE_ENV` is exactly `production`.~~ FIXED in phase 1** (details only when `NODE_ENV=development`; compose already pinned `production` for `api`). Original finding: `apps/api/src/middleware/errorHandler.ts:97-101`. `apps/api/.env.example:65` ships `NODE_ENV=development`; in that mode cookies also lose `Secure` (`adminController.ts:9-17`, `readerController.ts:25-31`).
Fix: invert to show details only when `NODE_ENV === "development"`; pin `NODE_ENV=production` in compose for `api`; throw at boot if it is unset.

**B4. ~~No legal or policy pages, in either app.~~ DONE in phase 2, draft text needs your review.** `/privacy`, `/terms`, `/content-policy` (EN + FA) live in `apps/web` (`lib/legal.ts`), linked from the web footer; the blog footer links to them on the main site (`NEXT_PUBLIC_WEB_URL`). Written from what the code does; no governing law or legal entity is invented. Contact comes from `LEGAL_CONTACT_EMAIL`, which compose requires. Not done: a consent line on the sign-up forms. Original finding: Neither footer links to a privacy policy, terms, cookie notice, content policy or DMCA/takedown route (`apps/web/components/layout/footer.tsx`, `apps/blog/components/SiteFooter.tsx`). The product has accounts (email+password, Google), comments, a newsletter and community-submitted content.
Fix: add `/privacy`, `/terms`, `/content-policy` (with a takedown contact) to both apps, link them from the footers and the sign-up form. Add consent handling before adding any analytics. Needs legal text from you.

**B5. Security headers — web script CSP enforced (2026-10-20).** The web proxy replaces client-supplied nonce/CSP headers with a fresh request nonce and sends the full enforced policy. Next bootstrap scripts, the theme bootstrap, product JSON-LD and the Google loader receive nonce values; production permits neither inline script exceptions nor eval. Inline styles remain allowed for the current UI. English/Persian browser checks verify fresh nonces, hydration and blocking an unauthorized inline script. Both apps retain HSTS (without `includeSubDomains`), nosniff, Referrer-Policy, Permissions-Policy, X-Frame-Options and disabled `poweredByHeader`. The deferred blog still uses its partial enforced/report-only policy. Real Google authentication awaits owner configuration and acceptance. See the deployment phase entry in `changelog.md` for final verification.

**B6. ~~Production URLs silently fall back to localhost.~~ FIXED in phase 1** (blog build arg added; compose now requires `WEB_PUBLIC_URL`, `BLOG_SITE_URL`, `MEDIA_PUBLIC_URL`). The in-code localhost fallbacks in `next.config`/`lib` remain, deliberately: a throw there would break CI and e2e builds. Original finding:
- `docker/Dockerfile.blog` has no `NEXT_PUBLIC_SITE_URL` build arg; compose only sets it at runtime (`docker-compose.yml:~102`). It is inlined at build time, so `metadataBase`, `robots.ts`, the sitemap and RSS get the localhost default (`apps/blog/lib/siteMetadata.ts:11-26`, `apps/blog/app/rss.xml/route.ts:3`).
- Same fallback pattern: `apps/web/lib/site.ts:5`, `apps/web/components/layout/footer.tsx:11` (broken "Journal" link), `apps/web/lib/api.ts:22`, `apps/blog/lib/api.ts:35`.
- Compose defaults `WEB_PUBLIC_URL`, `BLOG_SITE_URL`, `MEDIA_PUBLIC_URL`, `WEB_BUILD_API_URL` to `http://localhost:*`.
Fix: add the `ARG`/`ENV` to `Dockerfile.blog` and a compose build arg; in `next.config`, throw when `NODE_ENV=production` and these are unset; change the compose defaults to `${VAR:?}`.

**B7. ~~A copied `.env.example` produces a live default admin.~~ FIXED in phase 1** (seed rejects `change-this*`; the API refuses to start in production with a placeholder in `DATABASE_URL`). Original finding: `apps/api/prisma/seed.ts:484` rejects only passwords starting `replace-with`; the root `.env.example` uses `change-this-admin-password` (25 chars, passes the length check). `POSTGRES_PASSWORD=change-this-database-password` (`.env.example:3`) is not checked anywhere; compose only requires non-empty.
Fix: reject `change-this*` in the seed, or rename all placeholders to `replace-with-…`; add the same check to API startup for DB and secret placeholders.

**B8. ~~Footer links point at a dev showroom.~~ DONE in phase 2.** The three dead links and the empty "Create" column are gone, the home-page quality-standard link now goes to `/content-policy`, and `/design-system` returns 404 in production builds (and is `noindex`). "Support" still points at `/account`; that was not in scope. Original finding: `apps/web/components/layout/footer.tsx:15-22`: "Creator guide", "Quality standards" and "About" all go to `/design-system`, which robots.txt disallows (`apps/web/app/robots.ts:5`) but still serves in production; "Support" goes to `/account`.
Fix: write the real pages or remove the links; remove or gate `/design-system` in production.

## SHOULD-FIX

### Security / API
- **S1. ~~One shared `loginRateLimit`~~ DONE (phase 3): five separate per-IP limiters (reader login, admin login, register, Google, password change). Still per IP only; no per-account lockout.** Original: one shared `loginRateLimit` (10/15 min)** covers admin login, reader login, register, Google sign-in and password change (`apps/api/src/middleware/security.ts:51`, `readerRoutes.ts:10-20`, `adminRoutes.ts:10`). Users behind one NAT lock each other out; no per-account lockout. Give each its own limiter keyed by IP and account.
- **S2. ~~Rate-limit store is in memory~~ DONE (phase 4): every limiter now counts in Redis (`lib/redis.ts`, `rate-limit-redis` + `ioredis`, a `redis` service in compose, `REDIS_URL` required in production). Redis down means requests pass uncounted and one error is logged per outage; verified against a live Redis and with Redis unreachable. Unset `REDIS_URL` (local dev, tests) keeps the old in-memory counters.** Original: rate-limit store is in memory (per process, resets on restart). Fine for one replica; use a shared store before scaling out.
- **S3. ~~Expensive unauthenticated search~~ DONE (phase 3): 30 searches/min per client on `/products`, `/communities/:slug` and `/articles`; relevance ranking capped at 2000 matches; the web explore and community pages now forward the visitor's `X-Forwarded-For` (searches only) so server-rendered searches are counted too. Blog SSR article search is not forwarded and stays uncounted; it uses the cheaper indexed full-text path.** Original: expensive unauthenticated search is limited only by the global limit.** `apps/api/src/controllers/marketplaceController.ts:63-122,266-276` runs up to 8 ILIKE terms over ~15 columns and loads all matching ids (acknowledged in a `ponytail:` comment). Add a dedicated limiter and a result cap. Acquire, favorites, bookmarks, draft saves, source-check enqueue, provider connect and media upload have no specific limit either.
- **S4. ~~`LOCAL_AUTO_VERIFY_EMAIL` is gated~~ DONE (phase 3): always off when `NODE_ENV=production`, and the API refuses to boot if it is `true` there.** Original: `LOCAL_AUTO_VERIFY_EMAIL` is gated only on a loopback `WEB_PUBLIC_URL`**, not on `NODE_ENV` (`emailVerification.ts:15-35`, `middleware/auth.ts:78`). It marks every account verified, which also satisfies the creator/moderator checks. Add `NODE_ENV !== "production"`.
- **S5. ~~No startup env validation.~~ DONE (phase 3): `assertProductionConfig()` checks `DATABASE_URL` placeholders, `CORS_ORIGINS`, the email secret and the provider token key at boot; compose now requires `MARKETPLACE_PROVIDER_TOKEN_KEY` for the API.** Original: no startup env validation. `EMAIL_VERIFICATION_SECRET` (`emailVerification.ts:~24-33`) and `MARKETPLACE_PROVIDER_TOKEN_KEY` (`marketplaceProviderToken.ts:~8-12`) fail on first use with a 500. `docker-compose.yml:38` defaults the provider key to empty (the worker requires it at `:147`). Validate all env with Zod in `index.ts` and make compose use `${VAR:?}`.
- **S6. ~~Public list endpoints are unbounded.~~ PARTLY DONE / CORRECTED (phase 3): on re-reading, the tag, series, category, author, edition and resource lists are admin-curated, comments are admin-approved, and favourites/library are per-user, so none can be grown by an attacker; left alone. Fixed the real amplifier: the article list page size is now max 50 (was 200, each row with its full body), and the blog's `listAllArticles` pages by 50.** Original: public list endpoints are unbounded. No `take` in `commentController.ts:5`, `taxonomyController.ts:4,27`, `categoryController.ts`, `authorController.ts:4`, `editionController.ts:25`, `resourceController.ts:6`, `marketplaceController.ts:270,361`, `readerController.ts:~410`, product `versions` (`marketplaceController.ts:~326`). The public article list selects full `content` with `limit` up to 200 (`articleController.ts:31-34,121`, `schemas.ts:72`).
- **S7. ~~Prisma pool is unconfigured~~ DONE (phase 3): `connection_limit` in compose is 10 for the API, 2 per worker, 1 for migrate. Workers still respawn node every 30-60 s.** Original: Prisma pool is unconfigured (`apps/api/src/lib/prisma.ts:7`) while four services each open one and the worker loops respawn node every 30-60 s (`docker-compose.yml:115,137,152`). Set `connection_limit` per service in `DATABASE_URL`; consider long-running workers.
- **S8. ~~`/backend` proxy handlers~~ DONE (phase 3): `content-encoding`/`transfer-encoding`/`connection` are stripped from responses, and request bodies over 12 MB get a 413 before buffering.** Original: `/backend` proxy handlers (`apps/web/app/backend/[...path]/route.ts`, same in blog) copy upstream headers back, including `content-encoding`, although Node `fetch` already decompressed the body (lines 30-37). Uploads are fully buffered via `arrayBuffer()` with no size cap (line 20). Strip `content-encoding` and hop-by-hop headers; cap request size.
- **S9. ~~No `unhandledRejection`~~ DONE (phase 3): both handlers log and exit 1 so the container restarts. Startup messages still use `console.log` (stdout is captured).** Original: no `unhandledRejection`/`uncaughtException` handlers** in `apps/api/src/index.ts`. Startup logs use `console.log` (`index.ts:12-34`); use the pino logger.
- **S10. ~~Account enumeration and timing.~~ DONE (phases 3 and 4): login does a real bcrypt compare for unknown users, and `POST /api/readers/register` now answers `202 {accepted:true}` for new and taken emails alike and starts no session. The reader then signs in with their password (an unverified account can still sign in and resend the verification link). A taken email gets no email, so someone who forgot they had an account uses sign-in or password reset. Google sign-in/sign-up is unchanged and still reveals nothing.** Original: account enumeration and timing. Register returns 409 `EMAIL_ALREADY_REGISTERED` (`readerController.ts:101`); login skips `bcrypt.compare` for unknown users (`adminController.ts:22`, `readerController.ts:72`).
- **S11. ~~Creator-supplied URLs.~~ NOT EXPLOITABLE TODAY, NO CHANGE (phase 3): the web app renders screenshots as text and loads no creator image URLs (no `<img>`/`next/image` anywhere). Revisit before screenshots are rendered; an allowlist at that point should not default to the article `IMAGE_HOSTS`.** Original: creator-supplied URLs. Screenshots/doc/support URLs accept any `https://` host (`marketplaceManifest.ts:56-59,92`), so visitors' browsers load third-party images (tracking). Allowlist hosts or proxy images.
- **S12. ~~`NEXT_PUBLIC_USE_MOCK=1` serves fixtures~~ LOWER RISK THAN REPORTED, NO CHANGE (phase 3): the Docker builds cannot receive the flag (`Dockerfile.web` has no ARG for it, compose passes none, `.dockerignore` excludes `.env`); only a hand-run host build with it set would. e2e and Lighthouse rely on it in a production build, so a `NODE_ENV` guard would break them.** Original: `NEXT_PUBLIC_USE_MOCK=1` serves fixtures (`apps/web/app/page.tsx:48`), and `lib/mock-home.ts` is bundled. It is build-time inlined, so a wrong build arg ships mock data. Guard on `NODE_ENV !== "production"`.

### Docker / CI / ops
- **S13. DONE for the web/API preview.** Node, PostgreSQL and Redis use verified immutable digests; web/API/operations releases are digest-only. Blog and legacy development-stack tags remain outside this deployment.
- **S14. DONE for web/API runtime.** Standalone web and production-only API dependencies pass hosted image checks; optional Prisma compiler/CLI peers are explicitly excluded from the API runtime. The separate operations image intentionally includes migration/seed/test tools. Blog runtime remains deferred.
- **S15. DONE.** The Docker build context excludes `.env*`, agent/browser directories, `.impeccable`, maintenance and generated test/report output.
- **S16. DONE for the preview.** Database/API/web/Redis/worker health checks, worker failure exits, CPU/memory caps, bounded logs and dedicated database/uploads volumes are deployed. Startup caught unquoted comma-separated tmpfs options; quoted strings and an actual Compose-parsing regression test now prevent that defect. No blog or scheduler is deployed.
- **S17. PARTIAL.** The preview workflow builds/smoke-tests all three images, audits API production dependencies, pins actions and defines permissions/timeouts/concurrency. Six database/Redis cases were verified on disposable VPS containers. Broader legacy CI, Dependabot and secret-scanning coverage remain follow-ups; they are not implied by a passing image workflow.
- **S18. DONE for private operations; external alerting pending.** Matching encrypted off-server backups, isolated database/uploads restore, previous-web-image compatibility, stopped-worker detection and API/web restart recovery passed. Nightly backup and five-minute health timers are active; local failures reach the journal. External notification destination and long-term off-server automation remain owner decisions. See `deploy/README.md` for protected backup/migration/rollback procedures. No INSIGHT database was used for testing.
- **S19. PARTIAL / packaging addressed.** `.codex/` and `.playwright-mcp/` are ignored; Docker excludes all agent/design sidecars. Existing tracked design notes and local development `.env` cleanup were not removed as part of deployment. No secret or generated report is staged.
- **S20. Migration naming.** `20260923202550_new_migration` breaks the `<YYYYMMDD><NNNN>_snake_case` rule. Renaming breaks `_prisma_migrations` if it was ever applied anywhere; rename only if it hasn't been.

### Performance
- **S21. Blog never caches public reads.** `apps/blog/lib/api.ts:71` defaults to `cache: "no-store"`, so the `revalidate` exports (`app/page.tsx:13`, `blog/[slug]`, category/tag/series/topics) are ineffective and every request hits the API. Pass `next: { revalidate }` on public reads, as `apps/web/lib/api.ts:36-40` does. `sitemap.ts:7` is `force-dynamic` and walks every collection per crawl.
- **S22. Web `force-dynamic` pages** (`app/page.tsx:32`, `communities/page.tsx:16`, `communities/[slug]`). Every anonymous visit also calls `/api/readers/session` (`providers.tsx`).

### SEO
- **S23. No `llms.txt`** in either app.
- **S24. Thin metadata on web pages.** `explore`, `communities`, `communities/[slug]`, `account` and home set no `description`/OpenGraph. The product page overrides `openGraph` (`products/[slug]/page.tsx:47`) without `siteName`/`locale`, replacing the layout's object, and has no Twitter override.
- **S25. Structured data is sparse.** JSON-LD exists only on the product page (its `offers.price` is hard-coded `"0"` and the `url` isn't locale-aware, lines 60, 66). Blog has none; add `BlogPosting`/`BreadcrumbList`; add `WebSite`/`Organization` on web home.
- **S26. Blog heading hierarchy.** Markdown `#` renders `<h1>` (`lib/markdown.ts:99-103`) inside a page that already has one (`blog/[slug]/page.tsx:105`); home has `Hero` and `EditionCover` H1s (`app/page.tsx:30,34`, `EditionCover.tsx:24`). Map markdown `#` to `h2`.
- **S27. `/fa` article duplicates English body** (`blog/[slug]/page.tsx:147-151`) while declaring an `fa` alternate. Canonicalise to English or `noindex` until translated.

### Accessibility / RTL (code-read, not tested)
- **S28. Blog has no skip link**; web has one only on the product page (`products/[slug]/page.tsx:116`). Move it and `id="content"` into the layouts.
- **S29. Nested `<main>` in blog** (`app/layout.tsx:69` plus `editions/page.tsx:23`, `editions/[slug]/page.tsx:50`, `resources/page.tsx:21`, `resources/[slug]/page.tsx:37`, `error.tsx:10`).
- **S30. Blog header** (`components/SiteHeader.tsx:53`): the close icon path `M6 6l12 12M6 12l12-6` is not an X (second stroke should be `M6 18L18 6`); the button is ~36 px and the language pill ~28 px (below 44 px); the mobile menu lacks Escape handling and focus return (web's header has them, `web/components/layout/header.tsx:76-85`).
- **S31. Blog dialogs and forms.** `components/admin/ConfirmDialog.tsx` has no focus trap, initial focus or restore. `components/Comments.tsx:26` uses placeholders as labels and its status has no `aria-live`.
- **S32. Contrast.** Blog `text-ink-faint` `#8a8a8a` on `#faf9f7` is ~3.3:1 (AA needs 4.5:1), used for placeholders, helper text and the empty-state icon.
- **S33. Physical CSS in blog RTL.** `app/globals.css:62-75,162-179` (`padding-left`, `border-left`, `text-align:right` with overrides), `EditionCover.tsx:14,17` (`left-[…]`, `pr-5`, `pr-8`), `ArticleEngagement.tsx:59` (`left-0`); literal `←`/`→` arrows in `blog/[slug]/page.tsx` and `resources/[slug]/page.tsx` point the wrong way in Persian.
- **S34. Blog has no `loading.tsx`**; every route blocks on API calls. Web `error.tsx`-family pages exist; `web/app/global-error.tsx:11` reads `window` during render (hydration risk); `blog/app/error.tsx:10` renders its own `<main>`.

## NICE-TO-HAVE
- Markdown external links get no `rel="nofollow noopener ugc"` (`blog/lib/markdown.ts:45`); href is escaped twice (safe but mangles quotes).
- `web/features/product/install-dialog.tsx:58` puts `release.installation.url` straight into `href`; confirm the API enforces https-only, or add a client check.
- Dashboard/account pages rely on robots.txt only; add `robots: noindex` metadata. Blog `not-found`/`error` pages have no noindex.
- `blog/proxy.ts:60` matcher skips any path containing a dot; the API still enforces auth. Its login redirect drops query strings and `/fa` admin users always land on `/admin`.
- Unbounded list pages in blog (`editions`, `resources`, `topics`) and web `communities`; `blog/lib/api.ts:138` `listAllArticles` can loop 1000 pages.
- Blog loads three full `@fontsource-variable` packages and names "JetBrains Mono", which is never loaded. `ArticleCard` alt equals the visible title (use `alt=""`).
- Redundant `Article` indexes (`@@index([slug])`, `@@index([published])`); run `EXPLAIN` on article search to confirm the GIN index is used with a bound `regconfig`; no trigram index for marketplace `ILIKE` fields.
- `GET /marketplace/draft-options` is public (confirm intent); bcrypt ignores input past 72 bytes while schemas allow 128; preview token appears in the logged path (`/articles/preview/:token`); `publishScheduled.ts:21-25` runs at import with no entrypoint guard; `editionController.ts` uses `as never`; helmet's `Cross-Origin-Resource-Policy: same-origin` may break cross-origin images from local `/media`.
- Version drift: `@types/node` 26.3.0 in web vs `^22` elsewhere (runtime is Node 22); `tailwindcss` 4.3.3 (web) vs `^3.4.17` (blog); `jsdom` 26 vs 30; web pins exact versions, blog/api use `^`. Only the root declares `engines`.
- `apps/api/.env.example`: stale cookie-domain comment (`:27-28`); `apps/web/.env.example` lacks `NEXT_PUBLIC_GOOGLE_CLIENT_ID`; blog's lacks `NEXT_PUBLIC_BLOG_URL`; `ADMIN_SESSION_HOURS`, `SEED_DEMO`, `SEED_RESET` are undocumented at root and not passed by compose.
- README: says `/backend` is a rewrite (it is a route handler) and `API_URL` is build-time only (compose passes both). `pending.md`, `summary.md`, `changelog.md` (190 KB) sit at the repo root; decide whether they ship in the image context.
- `© 2026 termspace` is hard-coded in the web footer. Session cookies have no `__Host-` prefix, rotation or idle timeout.

## Not applicable
Redis/BullMQ (none; background work is a Postgres outbox + `FOR UPDATE SKIP LOCKED` jobs). Webhook signature verification and payments (none; acquisition is free-only, `marketplaceController.ts:552-555`, with a unique idempotency key on `MarketplaceOrder`). Server actions (none). Unoptimized images in web (no images used).

## Verified OK (no action)
- Secrets: git history contains only `.env.example` files; no private keys or tokens found; real `.env` files are untracked and gitignored.
- No open redirects, SSRF paths (outbound hosts hard-coded; user repo URLs restricted to github.com/npmjs.org), path traversal, or SQL injection (all raw SQL parameterized).
- Markdown renderer escapes first and filters hrefs through `safeHref`; JSON-LD escapes `<`.
- Owner scoping on creator, draft, source, lifecycle, favorites, library, orders and reviews; moderation forbids self-moderation; trust fields (`verified`, `featured`, `rating`, `price`, counts) are never read from request bodies.
- Cookies `httpOnly` + `SameSite=Lax`; CORS allowlist with credentials; Origin/Referer check on non-GET; tokens stored hashed; bcrypt cost 12; reset OTP has expiry, attempt and request limits; Google token audience-pinned.
- pino-http redacts `authorization`/`cookie`/`set-cookie`, strips query strings, doesn't log bodies. Error boundaries (`error.tsx`, `global-error.tsx`, `not-found.tsx`) exist in both frontends. `lang`/`dir` are set from the locale; reduced-motion handled; web uses logical Tailwind classes. Sitemaps (with hreflang), robots, canonicals and OG images exist. Dockerfiles are multi-stage with `USER node`; DB port bound to `127.0.0.1`; no secrets baked into images. No TODO/FIXME/`debugger` in app code.

## Commands run

| Command | Result |
|---|---|
| `npm run typecheck` (root, all workspaces) | exit 0, no errors |
| `npm run lint -w apps/web` (`eslint .`) | exit 0, no output. `apps/api` and `apps/blog` have no lint script |
| `npm run build` (root, all workspaces) | exit 0 |
| `npm audit` | exit 1: 26 vulnerabilities (2 low, 6 moderate, 18 high, 0 critical) |
| `npm audit --omit=dev` | **found 0 vulnerabilities** |

`npm audit` detail: every advisory sits in dev tooling. The direct ones are `@lhci/cli` 0.15.1 (apps/web; pulls in lighthouse, puppeteer-core, proxy-agent, basic-ftp, tmp, uuid, inquirer, js-yaml and others), `eslint-config-next` 16.3.8 (apps/web; `@next/eslint-plugin-next`) and `tailwindcss` ^3.4.17 (apps/blog; braces, micromatch, fast-glob, chokidar, postcss-nested). npm's suggested "fixes" are major-version changes and, for `@lhci/cli` and `eslint-config-next`, downgrades (`@lhci/cli@0.1.0`, `eslint-config-next@14.2.35`); don't apply them blindly. The only clean fix is moving blog to Tailwind 4, as web already is. Dev tooling is not in the runtime image path today, but see S14: the images currently copy dev dependencies.

Not run: `npm run test`, `npm run e2e -w apps/web`, `npm run lhci -w apps/web` (outside the scope of this review; run them before the release commit per AGENTS.md).

## Production env checklist (names only)
Required by compose/API: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `DB_HOST_PORT` (local), `DATABASE_URL`, `CORS_ORIGINS`, `NODE_ENV=production`, `TRUST_PROXY` (see B1), `EMAIL_VERIFICATION_SECRET` (one value; see S19), `MARKETPLACE_PROVIDER_TOKEN_KEY`, `GOOGLE_CLIENT_ID`/`NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `ADMIN_EMAIL`/`ADMIN_PASSWORD` (seed only), Cloudflare email and R2 variables if used, `MEDIA_PUBLIC_URL`, `IMAGE_HOSTS`/`NEXT_PUBLIC_IMAGE_HOSTS`. Public URLs (must be real, see B6): `WEB_PUBLIC_URL`, `BLOG_SITE_URL`, `NEXT_PUBLIC_SITE_URL` (web and blog), `NEXT_PUBLIC_BLOG_URL`, `API_URL`, `WEB_BUILD_API_URL`. Must be unset: `NEXT_PUBLIC_USE_MOCK`, `LOCAL_AUTO_VERIFY_EMAIL`, `SEED_DEMO`.

**Order:** back up DB → run `migrate deploy` as a one-shot (pre-flight query for `202609240001` first) → seed admin once with `NODE_ENV=production` (no demo data) → start API → start workers → build/start web and blog with real URLs → smoke-test login, registration/verification email, an upload, `/sitemap.xml`, `/robots.txt` and a canonical tag on each app. **Rollback:** migrations are forward-only; rollback means restoring the pre-migration dump and redeploying the previous images, so tag images per release.

## Prioritized fix checklist

**Before deploy (blockers)**
- [x] B1 (phase 1) — you still need to confirm the edge sets `X-Forwarded-For`
- [x] B2 (phase 1) — `prisma` is still a devDependency; fix with S14
- [x] B3 (phase 1)
- [x] B6 (phase 1)
- [x] B7 (phase 1)
- [x] B5 (phase 2) — enforce `script-src` after reviewing report-only violations
- [x] B4 (phase 2) — have the text reviewed; add a consent line to sign-up
- [x] B8 (phase 2)

**Right after / if time allows**
- [ ] S18 Take and test a `pg_dump`; write rollback + pre-deploy steps in README; add error tracking and an uptime check
- [ ] S1 Separate rate limiters per auth endpoint (IP + account keys)
- [ ] S5 Zod-validate env at API boot; make `MARKETPLACE_PROVIDER_TOKEN_KEY` required in compose
- [ ] S4, S12 Gate `LOCAL_AUTO_VERIFY_EMAIL` and `NEXT_PUBLIC_USE_MOCK` on `NODE_ENV`
- [ ] S21 Add `next: { revalidate }` to blog public reads; cache the sitemap
- [ ] S6 Add `take`/pagination to unbounded public lists; drop `content` from the article list select
- [ ] S3 Dedicated limiter and result cap for marketplace search
- [ ] S7 Set Prisma `connection_limit` per service
- [ ] S8 Strip `content-encoding`/hop-by-hop headers in `/backend` handlers; cap upload size
- [ ] S13–S17 Pin base images, prune dev deps, tighten `.dockerignore`, add HEALTHCHECKs/limits, add CI Docker build + audit + `permissions:`
- [ ] S19 Update `.gitignore`, untrack `.impeccable` files if not shipping, remove duplicate `EMAIL_VERIFICATION_SECRET`
- [ ] S23–S27 `llms.txt`, page metadata, JSON-LD, blog heading levels, `/fa` canonical
- [ ] S28–S34 Skip links, single `<main>`, header close icon and touch targets, dialog focus, contrast, logical CSS and mirrored arrows, blog `loading.tsx`
- [ ] Re-run `npm test`, `npm run e2e -w apps/web`, `npm run lhci -w apps/web` after the fixes
- [ ] NICE-TO-HAVE items above
