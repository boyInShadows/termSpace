# Changelog

Project changes completed from `pending.md` should be recorded here with the date, a short summary, and any verification performed.

## 2026-11-06 - Refresh main and use the requested submit blue

- **Goal / files / shared surface.** Fetch and integrate current main, then
  replace the previous action blue with the owner-requested exact #0864D1. Change
  web action tokens and blog Tailwind action colors, including account deletion
  and the moderation decision form. Synchronize DESIGN, preview
  metadata, dashboard brief, remediation handoff and existing browser assertions.
  Shared surface: `changelog.md`. Blog `tailwind.config.ts` is included by the
  all-submit-buttons instruction; editorial accents remain unchanged.
- **Integration.** Fetch succeeded; origin/main is 1b432be and already an
  ancestor of ramtin. Merge reports already up to date, with no conflicts.
  Preserve main inbox-driven signup/reset and release-review changes.
  Preserve pre-existing DESIGN formatting, brand assets and the in-progress
  wording-review entry; none belongs to this phase.
- **Acceptance / verification.** #0864D1 fill, white labels, #0755B2 hover
  through existing action tokens in both web themes and blog forms. Keep
  validation, pending/disabled behavior, keyboard focus, warnings and the separate
  destructive moderation confirmation. All form submits use the action palette.
  Run root typecheck/tests/build, web lint/E2E, Lighthouse and Impeccable review.
- **Results.** Root typecheck, all 844 unit/component tests (44 existing API
  integration skips), all production builds and web lint pass; lint retains
  its two existing warnings. Full E2E: 527 passed / 46 intentional skips.
  After the last two submit overrides, rebuilt all apps and passed all 62
  affected browser checks, including Settings in both themes/locales.
  Twenty rendered account checks cover web light/dark and blog light, EN/FA
  and 320/1280px; exact colors, keyboard focus and blog hover pass. Inspected
  screenshots, including enabled deletion submits. White-text contrast is
  5.59:1 normal / 7.12:1 hover. No runtime dependency or form logic changed.
- **Review / limits.** Manual diff review finds no new issue. Impeccable
  reports only the existing feedback-easing advisory. Blog account rendering
  uses mocked signed-out API responses; broader editorial/admin acceptance,
  physical devices and real-provider checks remain outside this color phase.
  Evidence is local under `docs/artifacts/submit-blue-2026-11-06/`.
- **Lighthouse.** All nine runs pass every unchanged budget. Reused the existing
  local Windows temporary-profile cleanup preload; no audit or assertion changed.

## 2026-11-04 — Sequential local queue: public wording corrections (in progress)

- **Goal / files / shared surfaces.** Complete the public Persian wording
  review. Fix six confirmed copy/navigation groups in shared web
  `lib/i18n/catalog.ts` and `common.ts`, blog `messages/fa.json`, `Hero.tsx`,
  `ReaderAuthForm.tsx`, `ReaderAccount.tsx` and `Comments.tsx`; add focused
  regression coverage using existing test files/patterns. Shared surfaces:
  `apps/web/lib/i18n/` and `changelog.md`. Blog presentation is in scope under
  the owner-requested queue. Preserve brand assets and existing DESIGN formatting.
- **Acceptance / verification.** Remove the additional trust assurance only
  from the FA intro; use the actual blog brand; align navigation labels/hrefs;
  localize explicit fallback and known comment-success messages without changing
  authentication, moderation or API contracts. Run focused regressions, root
  typecheck/tests/build, web lint and E2E; retain established performance gates.
- **Owner decisions.** Keep the blog fixture preview/cleanup pending. Skip
  physical-phone and real-Google acceptance, including Google setup, for this
  queue run. Retain these unfinished items as deferred, rather than marking
  them verified. No blocked launch or cleanup action is retried.

## 2026-11-04 — Sequential local queue: onboarding wording review

- **Scope / shared surface.** Owner requested `ramtin-pending.md` execution in
  order. Resolve actionable work while retaining owner-dependent acceptance.
  Shared surface: `changelog.md`; the ignored local queue is never staged.
  No application code or copy changed. Existing DESIGN formatting and brand
  assets remain untouched; the other maintainer's `pending.md` is not claimed.
- **Completed.** Reviewed English/Persian onboarding headings, all 19 answer
  choices, starting preferences, help and state messages against current API
  choices and the Profile location. Privacy wording matches caller-scoped
  access, export inclusion and clearing on account deletion. No wording change
  was needed. Remove that completed wording-review item from the local queue;
  retain broader Persian/device, Google and deployment acceptance.
- **Verification.** Eleven focused web onboarding/legal tests and thirteen API
  onboarding tests pass. Reviewed current source after graph coverage checks;
  API tests use mocks. No real account, Google identity, database or permission
  was changed. Evidence: `docs/artifacts/ramtin-queue-2026-11-04/copy-review.md`
  and its test logs. Application source is unchanged since the previous fully
  verified phase, so builds/full suites were not repeated for this review log.
- **Remaining inputs.** Explicit local-preview/cleanup approval and a phone/
  test-Google sign-in decision were requested. An Android device is connected;
  the web/API dev servers are running. Earlier automatic approval rejections
  remain respected until resolved. The deployment migration is a conditional
  operating note, not authorization to deploy or mutate a database.
- **Prerequisite findings.** No Google web/API client ID is configured in the
  app env files or Windows user environment. Requested an existing public
  client ID; no secret was requested or exposed. Read-only Prisma status shows
  the local onboarding migration is applied, with external-link source and
  release-review state migrations still pending. No migration was applied;
  retain the deployment condition and record the local prerequisites in the queue.

## 2026-11-03 — Owner-selected blue action buttons

- **Goal / files / shared surface.** Apply the owner's exact #2563EB to normal
  submit actions and existing Ink Light/Ground Dark filled buttons. Use the
  existing web Button/QuickAction and action tokens, blog submit control classes
  and Tailwind palette. Update DESIGN, its preview metadata and dashboard brief.
  Shared surface: `changelog.md`; blog form presentation is explicitly included
  by the owner's submit-button instruction. Preserve unrelated brand assets and
  the owner's uncommitted DESIGN table formatting.
- **Acceptance / verification.** Blue fill/white text in both web themes and
  both locales, darker blue hover, existing keyboard focus/disabled behavior.
  Check generated blog styles and all normal form submits. Run root typecheck,
  tests, production builds, web lint/E2E and unchanged Lighthouse budgets.
- **Base.** Fetch failed because github.com could not resolve. The locally
  recorded origin/main is already the parent of the existing repair commit;
  continue locally without changing integration history or other queue items.
- **Result.** Dedicated action tokens keep #2563EB/white consistent in both
  themes, with #1D4ED8 hover. Update the shared Button, custom dashboard action,
  keyboard skip control and three previously secondary normal submit actions.
  All 12 blog submit buttons across 11 files use the matching action palette;
  their submit logic is unchanged. Normal/hover white-text contrast is
  5.17:1/6.70:1. The guide, dashboard brief, primary preview and W06 handoff now
  reflect the owner's explicit replacement of ink-filled actions.
- **Verification.** Root typecheck, all production builds and 844 unit/component
  tests pass (44 existing integration skips); web lint has zero errors and two
  existing warnings. Full E2E: 527 passed, 46 intentional skips. Browser checks
  verify exact computed fill/label colors in EN/FA and light/dark, keyboard skip
  navigation, and hover on hover-capable devices. Touch devices retain normal
  fill. Nine Lighthouse runs pass all unchanged budgets; the existing local
  Windows Chrome cleanup preload is used without altering audits/assertions.
  Impeccable reports the same 13 web/2 blog contextual exclusions. Manual web
  desktop/phone samples and generated blog CSS confirm the new colors.
- **Limits / delivery.** Editorial live preview remains pending its earlier
  automatic approval rejection ("blocked by policy"); no blocked launch/cleanup
  was retried. Blog component tests, build and generated style checks pass.
  Existing source-only editorial/real-device/provider acceptance stays in the
  local queue. Preserve the owner's DESIGN table formatting and brand changes
  outside this commit. No push while GitHub resolution is unavailable.

## 2026-11-03 — UI repairs; editorial rendered acceptance pending

- **Owner scope / shared surfaces.** Execute all 42 audited issue groups using
  `docs/ui-remediation-plan.md`; preserve the blog's editorial identity and keep
  its admin explicitly English-only (owner confirmed). Shared surfaces announced
  before edits: `changelog.md`, `apps/web/lib/i18n/` only if existing copy needs
  repair, and the previously refreshed `AGENTS.md`. No API/schema/permission
  change is planned. All other-maintainer queue items remain unclaimed.
- **Editorial presentation ownership.** The owner explicitly authorized repairs
  in `apps/blog/app/globals.css`, `tailwind.config.ts`, `app/layout.tsx`,
  `app/error.tsx`, `app/editions/`, `app/topics/`, `app/resources/`, `app/blog/`,
  `app/admin/layout.tsx`, `app/admin/login/page.tsx`, `proxy.ts`,
  `components/EditionCover.tsx`, `CategoryCard.tsx`, `SiteHeader.tsx`,
  `BlogExplorer.tsx`, `ArticleEngagement.tsx`, `Comments.tsx`, `ReaderAccount.tsx`
  and admin `ConfirmDialog.tsx`, `AdminLogoutButton.tsx`, `AdminLoginForm.tsx`,
  `ArticleForm.tsx`, `AdminArticleList.tsx`, `EditionManager.tsx`,
  `ResourceManager.tsx`, `TaxonomyManager.tsx`, `MediaManager.tsx`,
  `CommentManager.tsx`, `RevisionHistory.tsx`, plus focused tests/message copy.
  Reason: contrast, focus/labels, responsive layout, truthful navigation and
  complete pending/error/empty feedback from the audit.
- **Additional contrast finding (B23).** Final source review confirmed faint
  editable boundaries on white blog forms. Extend the authorized control-only
  repair to `components/ReaderAuthForm.tsx` and `components/Newsletter.tsx`,
  plus existing public/admin form files named above; add `line.input` in the
  blog Tailwind palette. Preserve decorative/table/panel borders and focus/error
  colors. This was an omission from the original 42-group report.
- **Base / safety.** Fetched and fast-forwarded `ramtin` to current `main`,
  retaining the other maintainer's simpler editor, release review and inbox-auth
  changes. Resolved the autostash changelog conflict by preserving both entries;
  preflight patch remains local. Brand assets remain unstaged and untouched.
- **Web repairs.** Align sans/600 heading ramps, ink actions, 12px controls,
  16px panels/field text and semantic statuses. Strengthen field boundaries;
  remove decorative reveals/lifts/carets/typed prompts. Repair sticky discovery
  offsets, unique named mobile filters/RTL switch movement, theme hydration,
  keyboard suggestions, review retries, community errors and locale ratings.
  Keep the newer simplified editor and per-release review workflow intact.
- **Editorial repairs.** Preserve warm paper/amber and Manrope/Newsreader/
  Estedad. Correct code/accent/faint-text contrast, safe edition foregrounds,
  Persian directions/type, reduced motion, field labels/validation, one main/
  skip target, current navigation/query context and explicit English admin.
  Use native modal behavior, wrapped phone actions, pending duplicate guards,
  error/success feedback, bookmark rollback, copy/share/logout recovery and
  explained empty collections. B23 adds a control-only border token across 13
  files/52 sites (3.29–3.71:1); invalid article borders are 4.29–4.83:1.
- **Rendered web follow-up.** The compact product rail clears the measured
  header by 16px. Once reporting starts it stays in page flow through collapse/
  retry, with instant nearest scrolling on open; this fixes a reproducible
  click-instability loop. Existing review translations now pass from the server
  for only the current locale; initial product JS is 164.4kB gz in EN/FA against
  the unchanged 165kB gate. No dependency, schema or permission change.
- **Automated verification.** Root typecheck, all production builds and tests
  pass: API 304, blog 34, web 506 (844 total; 44 existing integration skips).
  Full web E2E: 527 passed, 46 intentional skips. Web lint: zero errors, two
  existing warnings. Root builds were repeated after final code; the last blog
  field-tone adjustment also passed its tests/production build. Regenerated the
  Prisma client for integrated-main types; no database migration was run.
- **Lighthouse.** Nine runs, all original gates pass. Representative home/
  dashboard/product performance: 96/94/96, accessibility: 100/100/100;
  LCP 2730/2994/2816ms, TBT 14/22/18ms, CLS 0.0002/0.0154/0.
  Windows Chrome-launcher cleanup raised EPERM after completed audits. A local
  ignored preload defers only EPERM removal of named task Lighthouse temporary
  directories; audit failures, settings, reports and assertions are unchanged.
  Temporary files were redirected to D:. Chrome profiles are gone; automatic
  approval review also rejected final cleanup (only "blocked by policy"). A
  task-local Node compile cache remains on D: and the disposable fixture API
  still listens on 127.0.0.1:4100 pending the preview decision. No global config
  or installed dependency was modified for the workaround.
- **Design review / evidence.** Independent Impeccable A/B reviews plus focused
  follow-ups resolved article-edit active state, RTL arrows and B23 boundaries.
  Detector: 13 web + 2 blog contextual exclusions (fonts/OG/showroom/limited
  feedback easing/prose borders); the historical audit count remains 14.
  Current source dispositions for W01–W20, B01–B23 and R01 are in
  `docs/ui-remediation-plan.md`. Local reports/screenshots/logs are under
  `docs/artifacts/ui-fixes-2026-11-03/`. Chrome samples covered web EN/FA,
  light/dark and 320/768/1280px; checked switch containment, stable disclosure,
  keyboard suggestions, typography and no overflow in those samples. Production
  blog CSS contains the intended normal/error field tokens.
- **Remaining acceptance / delivery.** Native editorial modal focus lifecycle
  and authenticated phone/ready-state rendering await the owner's pending
  fixture question. Automatic approval review rejected starting blog on
  127.0.0.1:3001 against the disposable fixture API (4100), with only "blocked
  by policy"; no alternate launch bypass was attempted. Code is retained in
  local reviewable commits; push waits for rendered acceptance or an explicit
  source/tests-only decision. Physical phones, real providers and native Persian
  copy review remain owner acceptance, recorded in the ignored local queue.
  Other-maintainer pending items and pre-existing brand edits are untouched.
  No real account/content mutation occurred; harness usage counters unavailable.

## 2026-11-03 — Refresh the shared design contract

- **Scope / shared surfaces.** Owner-requested documentation refresh updates
  `apps/web/DESIGN.md`, its `.impeccable/design.json` companion and dashboard
  surface brief. Shared surfaces: `AGENTS.md` (retired identity reference only)
  and `changelog.md`. No application code, queue items or existing brand assets
  were changed.
- **Contract.** Preserve Paper & Signal and the existing palette/components;
  document spacing, heading hierarchy, control sizes, semantic colors, contrast,
  focus, modal/combobox behavior, state feedback, responsive layout and Persian
  treatment. Distinguish observed implementation gaps from intended rules;
  the audit's 42 issue groups remain open. Correct the false claim that an
  unlayered `:where()` fallback always loses to explicit utility classes.
- **Owner decision.** The blog keeps its warm paper/amber palette and
  Manrope/Newsreader editorial typography, with Estedad for Persian. It shares
  accessibility and interaction rules with the marketplace; no blog redesign
  or dark-mode implementation was authorized by this documentation decision.
- **Agent alignment.** Replace retired Datasheet guidance in the dashboard
  brief and AGENTS reference. Refresh stale purple/square Impeccable metadata
  to the existing navy/paper palette and nine shared primitive previews.
- **Verification.** YAML/JSON parsing, existing color/spacing/radius/shadow
  checks against CSS, metadata and narrative consistency, canonical heading
  order, relative links and scoped diff whitespace checks. Application builds,
  tests and rendered checks were not repeated for documentation-only edits;
  no implementation fix or browser acceptance is claimed. No commit or push.

## 2026-11-03 — UI consistency and accessibility audit (report only)

- **Scope / shared-surface notice.** Owner-requested audit of web and editorial
  presentation; `changelog.md` is the only tracked file edited. No application
  fixes or other-maintainer queue items were taken. Existing uncommitted icon
  and brand assets were preserved.
- **Findings.** Inventoried 52 page routes and 177 UI TSX files. Two independent
  Impeccable assessments plus browser/source verification produced 42 grouped
  findings: nine major, 32 usability/consistency issues and one polish item.
  The local report is `docs/artifacts/ui-audit-2026-11-03/report.md`; adjacent
  files contain independent assessments, screenshots, DOM/geometry observations
  and detector evidence. One unconfirmed product-rail offset risk is separate.
- **Root causes.** The current Paper & Signal design conflicts with retired
  Datasheet guidance and several regression assertions. Raw route-specific
  controls, unsafe color roles and inconsistent interaction/state semantics
  account for much of the remaining drift. The blog's intentional editorial
  fonts/palette and absence of a dark-theme provider were not blanket defects.
- **Verification / limits.** Source scans and current-source fallback for graph
  freshness gaps; Chrome checks across EN/FA, light/dark and phone/tablet/desktop
  samples, including fixture-only sign-in, keyboard focus, RTL switch geometry,
  mobile labels and sticky-toolbar hit tests. All 14 detector flags were reviewed
  and excluded as intentional or false positives. Successful blog content/admin
  and some editor/moderation states lack runnable fixtures; physical devices,
  screen-reader applications and real providers remain unverified. No new build,
  typecheck, unit/E2E suite or Lighthouse run was needed for this report-only
  phase. No commit or push; implementation and its gates follow report review.

## 2026-11-03 — Signup, verification and password reset follow the inbox

- **Scope / ownership notice.** Shared surfaces: `apps/api/src/controllers/readerController.ts`,
  `apps/api/src/validation/schemas.ts`, `apps/api/src/routes/readerRoutes.ts`,
  `apps/web/lib/api.ts`, `apps/web/lib/i18n/`, `docs/email-verification.md` and
  `changelog.md`. One additive behaviour change in the auth flow; no schema
  migration, no new dependency, no provider change.
- **Signup.** Registering now replaces the card with a confirmation panel —
  heading, the address, "we sent a verification link", "you can safely close
  this window". No inputs, Google button or mode links remain. Registration
  still starts no session.
- **Verification.** Confirming a link now starts a session and sends the reader
  straight to `/onboarding` when `onboardingRequired`, otherwise `/account`.
  If another account is signed in, the API returns `409
  SIGNED_IN_AS_OTHER_ACCOUNT` **without consuming the token**; the page offers
  "Log out and continue", which signs out and retries the same in-memory token.
  Reused and expired links still return `INVALID_OR_EXPIRED_VERIFICATION`.
- **Password reset.** The six-digit code is gone. The request shows the same
  inbox panel; the email carries a link to
  `/account/reset-password#token=...`. The page asks for the new password and
  its confirmation only, then signs the browser in and opens
  `/dashboard/settings`. Tokens are HMAC-signed over the reset row, expire in
  10 minutes, are single-use, and a successful reset revokes every existing
  session before issuing the new one. A different signed-in account is refused
  the same way as verification.
- **Copy.** User-facing "Sign in" is now "Log in" and "Register/Sign up" is
  "Create account" across the account, dashboard, creator, review, reporting,
  preferences, onboarding and email-change surfaces; Persian already used
  «ورود» / «ساخت حساب» and only the secondary lines changed.
- **Security notes.** The verification link now signs the reader in; it remains
  single-use and expires after 30 minutes, the same capability the reset link
  already had. `SIGNED_IN_AS_OTHER_ACCOUNT` never consumes the token. The reset
  confirmation panel keeps the neutral "if an account exists" wording because
  the request endpoint is unauthenticated.
- **Verification.** Root typecheck; API 304 passed / 44 integration skips; web
  500 passed; web lint zero errors (two pre-existing warnings); all production
  builds. Full Playwright suite at CI's two workers: 519 passed, 46 intentional
  skips, no failures. The new account spec covers the signup panel, the
  verification link landing on onboarding, and the reset link opening the
  new-password form and landing in settings.

## 2026-11-02 — Review is a recorded moderation decision, not a dead flag

- **Scope / ownership notice.** Shared surfaces: `apps/api/prisma/schema.prisma`,
  `apps/api/prisma/migrations/` and `changelog.md`. Adds
  `MarketplaceReleaseManifest.reviewedAt`/`reviewedByUserId` in
  `202611020001_release_review_state`. No permission, route or creator-flow
  change: the existing moderator **approve** action now records the review.
- **Problem.** `MarketplaceProduct.verified` defaulted to false and no API path
  ever wrote it, so every creator-submitted listing said "Not yet reviewed"
  forever, including after approval and publication. The only writer was the
  seed script.
- **Behaviour.** Approval (`APPROVE`, SUBMITTED → APPROVED) stamps the exact
  immutable release the submitted snapshot pins, with the reviewer's user id and
  timestamp; the first review is kept, so re-approving the same release cannot
  make it look fresh. Publication copies the fact into the listing's public
  `verified` projection and never invents one: a release with no recorded
  review stays unreviewed. The public review row now belongs to the release
  block, so it follows the version selected in the reader's release picker and
  shows the review date; the card keeps reading the projection.
- **Data.** The migration backfills releases behind published listings from the
  newest staff `APPROVED`/`PUBLISHED` lifecycle event and re-aligns
  `verified` from the release. System bootstrap publications are excluded, so
  seeded fixtures stay unreviewed rather than borrowing an approval. The
  published-release immutability trigger is disabled only for that backfill
  statement and re-enabled in the same transaction.
- **Docs / copy.** `docs/marketplace-listing-lifecycle.md` gains a "Release
  review" section. No new English or Persian label: the existing
  "Review / Reviewed / Not yet reviewed" vocabulary now describes the release.
- **Verification.** Root typecheck; API 301 passed / 44 integration skips; web
  494 passed (the local Node 26 runtime defines a `localStorage` global that
  shadows jsdom's, so the suite must run with
  `NODE_OPTIONS=--no-experimental-webstorage`; without it three unrelated files
  fail identically on the pre-change tree). Web lint: zero errors, two
  pre-existing warnings. All production builds. Migration applied to the local
  Postgres and its backfill exercised on a real moderator-approved listing.
  Full Playwright suite at CI's two workers: 519 passed, 46 intentional skips,
  no failures. Unthrottled local parallelism produced six failures in
  `reporting.spec.ts` and `shared-navigation.spec.ts`; both pass in isolation
  and the reporting spec passes on the pre-change tree, so they are
  timing-sensitive rather than regressions. Lighthouse: home, dashboard and
  product detail, nine mobile runs; every assertion passed on the unchanged
  budgets.

## 2026-11-01 — Account onboarding and editable profile details

- **Scope / ownership notice.** Owner-requested signup onboarding crosses into
  `apps/api/src/controllers/readerController.ts`, `readerOnboardingController.ts`,
  `readerAccountController.ts`, `routes/readerRoutes.ts` and
  `validation/schemas.ts` because private answers must persist per account,
  export with account data and be erased on deletion. Shared surfaces:
  `apps/api/prisma/schema.prisma`, `apps/api/prisma/migrations/`,
  `apps/web/lib/api.ts` and `changelog.md`. The work is tracked in the ignored
  `ramtin-pending.md`; no other maintainer queue item is being claimed.
- **Behavior.** Four questions collect role, goal, coding tools (multiple) and
  starting preference. New password/Google accounts enter `/onboarding` after
  sign-in; a successful save routes explorers to `/explore` and creators to
  `/dashboard/studio`. Profile has the same editable details and both links for
  all members. The existing public creator profile and permission checks remain.
- **Storage.** Additive migration `202611010003_reader_onboarding` preserves
  existing members' voluntary setup and defaults new accounts to onboarding.
  Strict input validation, authenticated account scoping, CSRF protection and
  the existing preference write limiter protect the private endpoints.
- **API / privacy.** `GET` and `PUT /api/readers/onboarding` return the caller's
  four private answers and whether onboarding is required. Password and Google
  sign-in responses add `user.onboardingRequired`. Survey answers do not grant
  marketplace roles. Account export includes `profileDetails`; account deletion
  clears all four fields. `apps/web/lib/legal.ts` documents collection, editing,
  export and deletion in both languages.
- **Local database.** Client generated and migration applied locally; the API
  was briefly restarted to release its Windows Prisma engine lock, and its
  health endpoint returned `ok` afterwards. The local deployment also applied
  five already-pending migrations: marketplace report cases, account deletion,
  email change, listing views and moderation notifications. No production
  database was changed. Apply `202611010003_reader_onboarding` before deploying
  this API/client: reader queries need the new columns.
- **Verification.** Root typecheck; all tests (API 298 passed / 43 integration
  skips, blog 17 passed, web 487 passed); web lint (zero errors, two pre-existing
  warnings); all production builds, with the final web build repeated by E2E.
  Two additional real-database tests passed: password/Google onboarding flags,
  persistence, account isolation, no automatic role grant, export and erasure.
  Google token verification was stubbed; no real Google credential was used.
- **Browser gates.** The full suite ran: 514 passed, 46 intentional skips and
  four failures in two pre-existing tests on desktop/phone. The new personal
  save button made the public-creator save selector ambiguous; it now matches
  exactly. The deletion geometry assertion raced navigation; it now retries
  until the page can be measured. After those test fixes and phone focus-margin
  styling, the final build's onboarding, account data, dashboard repair and JS
  budget specs passed: 60 passed, 18 intentional skips. The remaining suite was
  not repeated after those final changes. All ten onboarding browser scenarios
  passed, including EN/FA destinations, persisted Profile edits, completed-flow
  redirects, password sign-in entry, themes, RTL, 320/768/1280 widths, the skip
  link and keyboard focus above the phone tabs.
- **Rendered review / performance.** Inspected onboarding and Profile captures
  in EN/FA and light/dark at desktop and phone widths; no page errors. Impeccable
  detector: no findings. Lighthouse passed every unchanged assertion for home,
  dashboard and product detail (nine runs). The first Lighthouse launch hit a
  Windows temporary-profile cleanup `EPERM`; collection succeeded against a
  separate task-owned Chrome profile on D:, using the same budgets. Evidence
  and local launch helpers stay under ignored `docs/artifacts/`. Manual second
  diff review used in place of a separate harness review command; no remaining
  code findings. Harness token/cost usage was not available.
- **Remaining acceptance.** Real Google browser sign-in, physical phones and
  maintainer review of Persian onboarding/privacy wording remain in the ignored
  local queue. Completed implementation tasks were removed from that queue.

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
- **Verified.** Root typecheck, all workspace tests, web lint, build, and the real-database
  journey for a link listing (draft, submit, approve, publish, acquire, install). Playwright:
  491 passed, 18 failed on the full run; on rerun 13 passed, 4 were a stale spec (fixed, slug
  field moved in the simplified form) and 1 reporting spec passed 12 of 12 repeats.
  Not verified: Lighthouse crashed on the Windows machine. No Playwright spec covers the link
  fields in the editor yet, and the rendered UI was not reviewed in both themes or in RTL.

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
