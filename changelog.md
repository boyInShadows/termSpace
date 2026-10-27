# Changelog

Project changes completed from `pending.md` should be recorded here with the date, a short summary, and any verification performed.

## 2026-10-25

- **Complete the safe browser-side acceptance pass for the Ramtin queue.** Ran
  the targeted desktop and mobile Chromium matrix for editor recovery,
  contextual help, creator profiles, reporting, landing widths, Persian RTL,
  keyboard focus, landscape layout and touch-target geometry.
  - Verification: 151 passed, 31 intentional skips. The remaining queue item
    stays open because real iOS Safari/Android Chrome hardware checks and
    Persian-speaking maintainer copy approval still require human/device
    validation; no application files were changed.
  - Shared `changelog.md` edit announced before writing.

- **Reject deferred product review-composer split.** A five-line `next/dynamic`
  experiment reduced the product first-load bundle from the prior 164.9 kB
  measurement to 153.5 kB and passed catalog, performance and budget checks,
  but the fresh three-sample Lighthouse comparison regressed the modeled LCP
  medians: home 2277→2514 ms, dashboard 2783→2791 ms and product detail
  2267→2639 ms. The import was restored; no application change remains.
  - Verification: typecheck, web tests (398 passed), production build, lint
    (two existing warnings), focused E2E (83 passed, 7 expected skips), and
    Lighthouse (9/9 reports). The local review-composer stash remains
    preserved for reference; the strict LCP phase remains open.
  - Shared `changelog.md` edit announced before writing. No queue item was
    completed or removed.

- **Restore the redesign landing lost during branch merge.** Compared merge
  `fc766ea` with its redesign parent `9326134`; the merge selected the
  Datasheet versions of the landing page, search, process, footer, global
  design primitives and logo/header presentation. Restored those redesign
  surfaces, including the serif editorial type, typed command search, rounded
  cards, reveal motion, nebula trust section, gradient CTA, footer treatment
  and caret logo. Preserved the current root-owned header, `main#content`
  skip-link target, server-rendered footer, header measurement, route-close
  behavior and dashboard focus scrolling. Reconciled the landing E2E contract
  with the redesign's scroll-reveal behavior.
  - Verification: root typecheck, root tests (685 passed, 12 expected
    database/Redis skips), web lint (two existing warnings), production build,
    full web E2E (437 passed, 46 expected skips), Lighthouse (9/9 reports),
    rendered desktop screenshot, and Impeccable detector. Detector
    reports the intentional existing Geist/Newsreader and radius deviations
    from the current Datasheet DESIGN.md; those are required by this requested
    redesign restoration.
  - Shared `changelog.md` edit announced before writing. The local
    `ramtin-pending.md` queue remains untouched; the unrelated review-composer
    experiment remains stashed.

- **Test and reject startup chunk/font changes that do not meet acceptance.**
  Production client-only webpack size hints of 160000 and 400000 bytes both
  build, but each fails three unchanged bundle tests. Dashboard grows from
  167.9 to 173.7/170.6 kB and Persian detail from 164.9 to 170.7/167.5 kB.
  Restoring the original configuration returns all six tests to green.
  - An earlier monospace font hint initially suggests a homepage LCP gain,
    while the global version's product median worsens. A homepage-only hint
    and repeat baseline produce home 2483 to 2476 ms, dashboard 2790 to 2789 ms
    and detail 2473 to 2478 ms. The homepage's apparent gain does not reproduce
    beyond sample variation. Its FCP improves, but the requested LCP acceptance
    remains unmet; both font patches are removed. All 36 retained reports use
    the original profile and have accessibility 100; the slow baseline sample
    is retained. No framework, dependency, content, style or budget change.
  - Verification: root typecheck, all 685 runnable unit tests (12 database/Redis
    skips), web lint (two existing warnings), normal root production build and
    six restored bundle gates pass. Final application/configuration diff against
    the published base is empty; the normal production build is restored and
    its identity checked. Full E2E is not repeated for identical restored code.
    A PowerShell warning-handling interruption is retained separately from the
    successful restored checks. Evidence and trial details are recorded in
    `docs/startup-performance.md`; generated artifacts stay under ignored
    `docs/artifacts/`. The local queue retains all unfinished acceptance and
    contains no new completed-trial narrative.
  - Shared `changelog.md` edits were announced in local planning commits.
    Manual Ponytail/code-quality second pass; no harness review command or
    usage meter is available. No provider, database or deployment actions.

## 2026-10-24

- **Reconcile Ramtin's local queue and continue startup profiling.** Removed
  completed-trial narrative and replaced its duplicated shared backlog with a
  reference to the authoritative `pending.md`; no unfinished shared task was
  marked complete. Strict LCP, comparable hosted input delay, physical-device
  checks, native Persian approval and owner-deferred provider work remain open.
  The local queue stays ignored and is not part of the commit.
  - Confirmed all six hosted checks pass at `d5ac348`, including API integration,
    437 Playwright passes (46 existing skips, no reported flaky tests) and nine
    Lighthouse reports. Hosted median LCP is 2409/2278/2164 ms and input delay
    90/74/83 ms; faster CPU indices still prevent closing the original timing
    risk. Retained failures and the strict targets are unchanged.
  - Recomputed eighteen current/prior critical paths and reproduced all nine
    current baselines. Offline transfer-size sensitivity still estimates a
    2128 ms dashboard median with every script except the two shared framework
    scripts reduced to zero transfer bytes. This is a
    diagnostic, not a shipped gain. No unproven runtime optimization was added;
    details and evidence paths are in `docs/startup-performance.md`.
  - Verification: model baseline assertions, hosted check/head verification,
    queue ownership/deferred-work review and `git diff --check`. Application,
    tests and configuration are unchanged; reuse the preceding phase's root
    typecheck, unit tests, lint, production build, full E2E and LHCI results.
    Manual second-pass review used Ponytail and the code-review workflow;
    no harness review command or usage meter is available. Shared-surface
    `changelog.md` was announced in a local planning commit before editing.

- **Reduce public startup transfer with negotiated Brotli assets.** The web build
  precompresses its JavaScript/CSS and verifies every decoded variant against the
  original. The proxy and a small Route Handler serve only files in the build's
  generated allowlist. Missing variants, refused encodings, development and
  range requests retain normal delivery. Compressed responses keep the original
  MIME type, immutable public caching, `Vary: Accept-Encoding` and strong ETags
  with body-free conditional 304s. Private API data, session snapshots, Saved
  ordering, content and styling are unchanged.
  - Median local mobile LCP improves home 2816 to 2500 ms, dashboard 2951 to
    2803 ms and detail 2803 to 2484 ms. Median page transfer drops by
    28350/30597/29512 bytes respectively. All nine stock Lighthouse reports pass
    unchanged gates with accessibility 100; performance is 97/96/97 and median
    max-potential-FID 70/77/68 ms. All six gzip JavaScript budgets pass. The
    strict 2200/2000/2200 ms targets, comparable hosted timing and physical/native
    acceptance remain open; no budget or throttling setting was changed.
  - Verification: root typecheck, normal root production build and 685 runnable
    unit tests pass (12 database/Redis skips); web lint has no errors and the same
    two existing warnings.
    Full serial Playwright validation passes 437 scenarios with 46 existing
    skips. The earlier two-worker run's one Chrome `ERR_NO_BUFFER_SPACE` failure
    is retained with its trace: a chunk request failed before an HTTP response.
    Serial validation uses browser temporary files on D:. No test was removed,
    weakened or given retries. Thirty-six render checks cover English/Persian
    RTL, light/dark and 320/768/1280 widths, first keyboard focus and one main,
    with no overflow or page error. Impeccable detection has no findings.
  - Manual second-pass review tightened artifact allowlisting and negative-cache
    behavior, and caught the missing revalidation metadata before completion.
    The raw transport regression verifies actual encoded bytes and HTTP behavior,
    beyond mocked headers. Next strips encoding headers from proxy responses;
    the discarded direct rewrite is retained for evidence. A Turbopack pilot was
    rejected at 165.3 kB on both product locales; webpack remains in use. No
    dependency, API/schema, migration, provider or deployment changes.
  - Owner folder conventions apply to this new work: tests are under
    `apps/web/tests/`, generated evidence under ignored
    `docs/artifacts/startup-delivery-20261024/`, and the transport project's
    failure artifacts under `docs/artifacts/playwright-transport/`. Existing
    test directories remain supported; CI uploads the new failure location.
    Config/shared files were announced before editing: `changelog.md`,
    `.gitignore`, web test configs and the web workflow artifact path. No harness
    review command or usage meter is available. Further measurements and
    self-hosted packaging notes are in `docs/startup-performance.md`.

- **Restore the product startup JavaScript budget after reporting integration.**
  Fast-forwarded `ramtin` onto `main` (`3490d23`), retaining the owner's published
  reporting UI (`a4935f8`). The baseline Persian detail bundle measured 165.2 kB
  against its existing 165 kB gate. Reporting-only extraction saved 152 gzip
  bytes but still failed at 165.1 kB; moving the adjacent listing-moderation
  helpers into their feature module completes the fix. The eleven endpoint
  bodies are unchanged and share the existing request transport.
  - Each of six measured startup routes saves 336 gzip bytes: home EN/FA
    163.2 to 162.8 kB, dashboard EN/FA 168.2 to 167.9 kB, product EN 153.8 to
    153.5 kB and product FA 165.2 to 164.9 kB. Private case endpoint paths no
    longer occur in those initial assets. All six existing browser bundle
    assertions pass. No budget, timing profile, dependency or UI copy changed.
  - Verification: root typecheck, normal root production build and 664 runnable
    unit tests pass (12 database/Redis skips). New transport checks preserve credentialed uncached reads,
    caller cancellation and non-retrying mutations; existing reporting and
    moderation tests retain role gates, failure recovery and form state. Web
    lint has no errors and two existing warnings in `context-help.tsx` and
    `e2e/mock-reports.mjs`. The full browser suite passes 436 scenarios with
    46 intentional skips and no retries. Twenty-four render checks cover report
    forms, cases and moderation in both themes, English/Persian RTL and
    320/1280 widths: no overflow, duplicate main or page error; keyboard-opened
    disclosure retains visible focus. Impeccable detection has no findings.
    All nine Lighthouse reports pass unchanged gates, with accessibility 100.
    Representative home/dashboard/detail LCP is 2816/2951/2803 ms,
    performance 96/95/96 and max-potential-FID 107/88/97 ms; strict timing
    acceptance remains unfinished.
  - Shared surfaces `apps/web/lib/api.ts` and `changelog.md` were announced in
    the plan commit before editing. A manual second-pass review checked every
    caller, mock, transport contract and all eleven moved bodies against the
    published baseline; no harness review command or usage meter is available.
    No API/schema, migration, seed, provider or deployment changes. The ignored
    local queue retains strict LCP, comparable hosted timing, physical-device
    and native Persian wording acceptance, including reporting screens.
    Measurements and verification evidence: ignored
    `maintenance/reporting-performance-20261024/`; interpretation and remaining
    headroom are documented in `docs/startup-performance.md`.

- **Merge `redesign` into `ramtin` at the owner's request.** Integrates
  `fc766ea` with `703f831`, retaining both histories and the seventeen later
  Ramtin commits alongside eight incoming redesign commits. The merged result
  includes the shared Redis rate-limit support, auth/search/startup hardening,
  legal pages/security headers, dashboard moderation and revised trust rows.
  Creator profiles, reporting API/cases, contextual help and request-scoped
  dashboard behavior remain available.
  - Six text conflicts resolved: reporting gets its own `report-write` Redis
    namespace alongside review limits; routes keep creator discovery and search
    protection; creator identities retain their public links and localized badge
    names; the API keeps creator reads and forwarded search headers; both dated
    changelog histories are preserved. Detail-header/sidebar badges use the same
    localized labels. Regression coverage protects report/review budget separation
    and the Persian creator-link/badge combination. Reconciled `pending.md` and
    the ignored local snapshot with the delivered policy pages, retaining owner
    approval and unresolved footer destinations.
  - Owner-authorized cross-app integration includes the API controllers, routes,
    security, validation, startup helpers and seed changes, blog proxy/footer/
    configuration, dependency lock and deployment definitions from redesign.
    Shared surfaces were named in the merge-message draft before editing:
    `apps/web/lib/api.ts`, `apps/web/lib/types.ts`, affected `lib/i18n/` files,
    `changelog.md`, then `pending.md` before its handoff correction. No database
    migration, seed, deployment, credential or live-provider operation was run.
  - Verification: root typecheck, 646 runnable unit tests (12 database/Redis
    skips), web lint and normal root production build pass. Unit tests use
    `NODE_OPTIONS=--no-experimental-webstorage` on local Node 24.11. The full web
    browser suite passes 408 scenarios with 46 intentional skips and no retries.
    All six JavaScript budgets and nine Lighthouse reports pass unchanged gates;
    representative LCP/performance/FID is home 2785 ms/96/78 ms, dashboard
    2946 ms/95/83 ms and detail 2791 ms/96/86 ms; accessibility is 100. Strict
    LCP/hosted timing targets and physical-device/native-wording acceptance stay
    open. Eighty-four final render captures plus twelve staff-ready checks cover
    both themes/locales and 320/768/1280 widths, with no horizontal overflow,
    duplicate main or page error. Impeccable detection has no findings.
  - Manual second-pass review covered conflict semantics, authorization boundaries,
    route compatibility and Datasheet consistency; no harness review command or
    usage meter is available. Stale generated Next route types were backed up and
    regenerated. Required dependencies were installed without lifecycle scripts;
    npm's unrelated lock metadata rewrites were discarded, retaining the incoming
    lockfile and versions. Manual API integration edits in
    `apps/api/src/middleware/security.ts`, its test and
    `apps/api/src/routes/marketplaceRoutes.ts` retain the reporting and incoming
    shared-limit/search contracts. Pre-existing reporting UI work was protected
    in a separate 17-file backup and named stash, then restored without including
    it in this merge commit. Its replay conflict keeps the legacy moderation
    redirect and places its report-case navigation in the dashboard moderation
    page as an uncommitted edit. All ten originally untracked files match the
    backup apart from line endings; the combined working tree passes typecheck,
    the reporting module's 16 unit tests and all 28 focused browser scenarios.
    The backup and stash are retained. Evidence: ignored
    `maintenance/merge-redesign-20261024/`.

- **Measure and reject CSS inlining for the remaining mobile LCP work (local
  queue).** A clean `e2cefde` checkout and an isolated Next `inlineCss` trial
  each received three samples on home, dashboard and product detail, using fresh
  Chrome profiles and the same fixtures. Assertions confirm the existing network,
  CPU, screen and form-factor profile. Median LCP regressed by 227/150/157 ms;
  page transfers grew by about 25–28 kB. CPU benchmark medians stayed within
  roughly 5%, and accessibility was 100 across the eighteen reports.
  - The fresh dashboard critical path retains the React DOM transfer, its CPU
    task and root layout/error-script requests. Inlining delays that same modeled
    tail by about 150 ms. Cold/warm reload probes also show the caching cost:
    the normal home document is 21,414 encoded body bytes with a separately cached
    stylesheet, versus 61,332 document bytes on each inline load. Home-to-Explore
    client navigation remains approximately 5 kB in both cases. Full results,
    model limits and the official Next reference are in
    `docs/startup-performance.md`; raw evidence and the rejected patch are under
    ignored `maintenance/startup-performance-20261024/`.
  - The single trial flag was reverted, the isolated build restored and its
    application-source diff checked empty. No runtime, dependency, deployment,
    credential, schema or environment change is retained. Pre-existing reporting
    edits remain untouched. Verification: root typecheck, all 609 runnable unit
    tests (11 database skips), web lint and the normal root production build pass.
    No full browser or Lighthouse CI rerun is claimed for this documentation-only
    result; the eighteen Lighthouse probes and reload/navigation assertions are
    separate evidence. Manual second-pass review checked restored source, profile
    equivalence, raw medians and the limits of modeled causality. No harness
    review command or usage meter is available.
  - Strict 2200/2000/2200 ms LCP and comparable hosted input-delay acceptance
    remain open in the local queue, along with real devices and native Persian
    wording. Shared surface: `changelog.md`, announced in the phase plan commit
    before editing.

- **Add contextual help to the dashboard, studio and five-step listing editor
  (local queue).** One shared 44px question-mark control explains source/release
  versions, compatibility, permissions, environment variables, licences,
  communities, type declarations, progress, review and save actions. Twenty-seven
  concise EN/FA topics include isolated Latin examples. Dashboard collections,
  publication states, creator handles and provider/release verification use the
  same control. Required formats and public-secret warnings remain visible.
  - Hover, keyboard focus and tap open help; Escape, Tab and outside interaction
    dismiss it. Bubbles remain hoverable, fit the viewport and anchor outside the
    associated field or complete sticky action bar. Touch-generated focus waits
    for the click so it cannot intercept the first tap. Help copy loads on demand
    with loading/failure recovery and a polite screen-reader announcement.
    Browser-local Save for later, account Save draft and later submission remain
    distinct. No dependency, API, schema, credential or environment change.
  - Verification: root typecheck, 609 runnable unit tests (11 database skips),
    web lint and the normal root production build pass. The isolated help commit
    passes all 408 browser scenarios with 46 intentional skips and no retries.
    All six first-load JS budgets pass: representative home/dashboard/detail
    sizes are 162.5/167.6/164.3 kB gzip. All nine Lighthouse reports pass unchanged
    budgets, with representative LCP/performance/FID of 2632 ms/97/75 ms,
    2787 ms/96/75 ms and 2641 ms/97/86 ms; accessibility is 100 throughout.
    Strict LCP targets and comparable hosted input-delay acceptance stay open.
  - Render checks cover EN/FA, both themes, 320/768/1280 widths, all editor steps,
    short landscape, focus, touch, long help text, viewport bounds and sticky
    action hit tests. Save-help captures have text contrast at least 7.3:1, no
    overflow, duplicate main or page error. Impeccable detection has no findings;
    a manual second-pass review covered dismissal, async copy loading, form
    preservation and Datasheet consistency. No harness review command or usage
    meter is available. The dashboard surface brief documents the shared pattern.
  - Original failures are retained: a missing test fixture, Windows text-pipe
    encoding damage, eager-copy bundle growth, a substring save selector, a real
    first-tap interception and sticky-help overlap. An isolated browser run also
    hit Chromium ERR_NO_BUFFER_SPACE on Explore; the final full run passes.
    An isolated unit assertion and dependency/junction build limitations are
    retained; final root gates pass in the canonical checkout. Browser and
    Lighthouse checks used a separate checkout so pre-existing uncommitted
    reporting work was neither changed nor included in this phase. Its combined
    checkout's product bundle failure is retained, not attributed to this commit.
  - Evidence and native wording choices: ignored
    `maintenance/context-help-20261024/`; the verification checkout is on D:.
    Removed the implemented help block from the local queue and retained real
    iOS/Android and Persian-speaking maintainer acceptance. Shared surface:
    `changelog.md`, announced before editing in the local plan commit.

- **Add authenticated listing reports and private staff case triage (sequential
  queue, reporting stage 1).** Reader reports use bounded reasons/explanations,
  opaque receipts, one original report per account/open case, a transactionally
  serialized ten-new-report account quota and a separate IP request limit.
  Staff can page cases, original evidence and audit history, set severity,
  investigate or dismiss. Current verified roles, owner/reporter conflicts and
  optimistic versions protect every staff action. Reports never impose a
  restriction automatically; original reports and audit events are append-only
  in PostgreSQL. API contract and deployment notes: `docs/marketplace-reporting.md`.
  - Owner-assigned API lane: report controller, routes, validation, security
    limiter, tests and Prisma models. Shared surfaces announced in the phase
    commit body: `apps/api/prisma/schema.prisma`, additive migration
    `202610240001_marketplace_report_cases`, `pending.md` and `changelog.md`.
    No existing data rewrite, dependency, credential or environment change.
  - Verification: root typecheck, all 588 runnable unit tests (11 database
    skips), web lint and normal root production build pass. Six additional
    real-Postgres checks pass in a separately migrated disposable schema:
    concurrent deduplication/quota, staff conflicts and role revocation,
    version races, immutable evidence/history, and post-dismissal reports.
    The schema was dropped after success; the working database was not migrated
    or reset. Preserved failures caught invalid classification/publication
    fixtures and a real transaction-admission timeout under concurrent load.
    Reporting now bounds admission at ten seconds and returns retryable 503
    rather than an internal error on transaction timeouts.
  - A running local API held the Windows Prisma DLL open. An initial temporary
    schema workaround triggered Prisma autoinstall; its package-file changes
    were restored, original dependencies reconciled, and validation/builds
    rerun. Client generation succeeded from the API directory into ignored
    temporary output, copying generated client files while retaining the locked
    engine. No package change is retained. Manual second-pass review covered
    privacy, lock ordering, atomic audit writes and closed-case retention; no
    harness review command is available. No UI changed, so browser/Lighthouse
    suites were not rerun for this stage.
  - The unfinished queue now names report/staff interfaces, case-linked scoped
    enforcement and appeals, reinstatement checks, and additional ADR targets.
    The parent reporting item remains open. Deploy the additive migration before
    using these endpoints; privacy-policy retention/anonymization decisions and
    real-device/native-Persian acceptance remain unresolved.

- **Add public creator profiles and published listing collections (sequential
  queue).** `/creators/[handle]` and its Persian route show the creator's public
  identity and biography, a published-listing total and a paginated catalog grid.
  Creator names in catalog cards and product details link to the profile. Unknown
  creators and creators with no public work return genuine 404s. Recovery text
  distinguishes unavailable, timed-out, unreachable and rate-limited requests;
  failures are not indexed. Maximum-length names and biographies wrap on phones.
  - Owner-assigned API-lane files: `marketplaceController.ts`,
    `routes/marketplaceRoutes.ts`, `validation/schemas.ts` and their regression
    coverage add the anonymous, validated creator endpoint. Public fields are
    selected explicitly; the collection and counts exclude unpublished,
    suspended and archived listings. Existing published projections survive
    private draft edits; snapshot/lifecycle identifiers remain hidden. Embedded
    creator counts in public catalog responses now use the same public filter.
    No schema, migration, dependency, credential or environment change.
  - Verification: root typecheck, 569 unit tests (5 database-dependent skips),
    web lint and the final normal root production build pass. The full browser
    suite passes 386 scenarios, with 44 intentional skips and no retries. New
    checks cover anonymous discovery, locale links, pagination/reload, true 404,
    localized failure/rate-limit recovery, canonical/noindex metadata and 320px
    long-text bounds. Initial failures are retained: alert assertions were
    scoped to page content, and an existing ordinary-reader fixture now supplies
    the same reader role to server and client instead of racing a creator-to-
    reader identity change. Runtime authorization was not weakened.
  - All nine local Lighthouse reports pass unchanged budgets: representative
    LCP/performance/FID is home 2641 ms/97/85 ms, dashboard 2797 ms/96/87 ms,
    detail 2637 ms/97/83 ms, with accessibility 100. Additional EN/FA profile
    audits also score accessibility 100. Strict LCP and hosted timing acceptance
    remain open. Ninety-six captures cover both themes, both locales and
    320/768/1280 widths, including long text and focused links; 84 geometry
    checks report no overflow, duplicate main or page error. Impeccable detection
    has no findings. A fresh finish review matched the inherited design and
    bounded API privacy; its sole documentation fix was scored resolved. The
    documenter confirmed the existing system applies without a DESIGN.md change;
    unrelated pre-existing context metadata/brand-history drift was not repaired.
  - Removed the completed item from both `pending.md` and the ignored local
    queue; physical-device and native Persian wording acceptance remain there.
    Product context, the creator surface brief and onboarding/API documentation
    describe the delivered feature. Evidence: ignored
    `maintenance/creator-profiles-20261024/`. Shared surfaces: `apps/web/lib/api.ts`,
    `apps/web/lib/types.ts`, `pending.md`, `changelog.md`. No usage meter is exposed.

- **Retain LCP diagnostic results and manual acceptance handoff (sequential
  local queue).** Continued the next active performance item without closing
  its 2200/2000/2200 ms targets. The retained dashboard summary is server-rendered;
  its modeled critical path ends at the shared React chunk's download. Added
  the measured limits and trial results to `docs/startup-performance.md`.
  - A locale-correct font response-header trial did not establish a useful
    gain (dashboard 2821 → 2791 ms; detail 2628 → 2630 ms), and its application
    and test changes were reverted. A separate Brotli sizing/transfer model
    is diagnostic, not deployed compression or target acceptance. The existing
    contract prohibiting private dashboard reads before identity verification
    is preserved; no speculative parallelization or caching was added.
  - Verification: the restored normal root production build passes. Application
    source matches the phase-1 source that passed root typecheck, 557 unit tests
    (5 database-dependent skips) and lint. No browser rerun is claimed for the
    reverted trial. Original reports, patches and measurements remain under
    ignored `maintenance/queue-20261023/`; budgets and throttle settings are
    unchanged. A manual second-pass review confirms no trial code remains.
  - The ignored local queue retains strict LCP and hosted input-delay acceptance.
    Its device/wording items remain open, with 21 additional EN/FA editor choices
    in `maintenance/queue-20261023/owner-review.json` for a Persian-speaking
    maintainer. Physical iOS/Android results and native wording approval were
    requested, not inferred. Owner-deferred email/domain/Google work remains
    paused; the copied shared backlog remains subject to its ownership notes.
    Shared surface: `changelog.md`. No runtime, schema, dependency, credential
    or environment changes. No usage meter is exposed by this harness.

## 2026-10-23

- **Identify the hosted dashboard startup bottleneck (sequential local queue).**
  Inspected original reports and the retained traces from `400c2dd` and
  `1554e45`. The unchanged shared Next App Router/Flight chunk evaluates in
  36–43 ms tasks on the formatter runner, accounting for its 109/118/134 ms
  simulated FID samples. The latest runner executes it faster and has higher
  CPU indices; its passing result is not treated as a runtime fix. Original
  failure, downloaded artifacts and two local CPU profiles are retained.
  - `docs/startup-performance.md` records source runs, per-sample indices,
    task attribution and measurement limits. Removed the completed investigation
    from the ignored local queue; hosted stability stays open with the remaining
    LCP work. No runtime, network, throttle or assertion changes were made.
  - Verification: root typecheck, 557 unit tests (5 database-dependent skips),
    web lint and root production build. Existing `1554e45` hosted CI/browser/
    Lighthouse checks pass. No browser suite was repeated for documentation.
    Manual second-pass review checked task durations against original traces;
    no usage meter is exposed. Shared surface: `changelog.md`.

- **Complete listing drafts in five resumable steps (Ramtin).** The creator
  editor now shows Basics, Release, Access & license, Type details and Review
  one at a time, with a completion percentage and freely selectable steps.
  Required fields determine completion; previewing or saving the complete draft
  completes Review. Editing clears its review checkpoint. Inactive steps retain
  their fields, and validation opens and focuses the first invalid step.
  - Save for later stores partial work and its current step on this browser,
    scoped to the signed-in account and listing. It does not call the draft API.
    Restoring rejects malformed data and does not apply a browser copy based on
    an older account version. Storage failures retain dirty work and its exit
    guard. A successful account save clears the browser copy and uses the new
    record as the editor baseline. Complete draft validation, optimistic
    concurrency, release verification and moderation remain authoritative.
  - Verification: root typecheck, 557 unit tests (5 database-dependent skips),
    web lint and the normal root production build pass. The full browser suite
    passes 362 scenarios with 44 intentional skips, including bilingual resume,
    accurate progress, hidden-field validation and keyboard navigation. Final
    editor checks cover both browser projects after the mobile refinement and
    account-save cleanup assertion. An unrelated product-dialog timeout in the
    first loaded unit run passes in isolation and in both subsequent full runs;
    its original failure is retained without changing that code or test.
  - All nine local Lighthouse reports pass unchanged budgets and settings:
    representative LCP/performance/FID is home 2631 ms/97/76 ms, dashboard
    2792 ms/96/80 ms and detail 2629 ms/97/75 ms; accessibility is 100 throughout.
    Existing stricter LCP targets and hosted timing follow-ups remain open.
    Sixty EN/FA, light/dark, 320/768/1280 captures cover all five steps with no
    overflow or page errors. Representative renders, keyboard/short-landscape
    checks, Impeccable detection and a manual second-pass diff review pass.
    Physical iOS/Android and native Persian wording approval remain in the
    ignored local queue. Evidence is under `maintenance/draft-steps-20261023/`.
    No usage/cost meter is exposed by this harness.
  - Shared surface: `changelog.md`. The dashboard surface brief documents the
    new flow. No API, schema, dependency, credential or environment changes;
    no other maintainer's `pending.md` item was taken or marked complete.

## 2026-10-22

- **Reuse relative-time formatters and retain original CI traces (local queue
  follow-up).** The shared listing/activity helper reuses one formatter per
  locale, while recomputing every date/current-time difference. No reader
  values or private responses are cached. CI now retains the original
  Lighthouse traces and request logs alongside its existing reports, with
  the same seven-day retention. Assertions, network settings, local 4x and
  calibrated hosted 3x CPU profiles are unchanged.
  - The original [hosted product-dialog run](https://github.com/boyInShadows/termSpace/actions/runs/39752758665)
    passes browser checks but fails dashboard max-potential-FID: samples
    238/135/126 ms, median 135 versus 130. Warm dashboard CPU indices are
    2418.5–2461; the cold home sample has index 1506.5/FID 321 ms. Original
    reports are preserved without rerunning that build. Hosted variability
    is retained as unfinished work in the ignored local queue; formatter
    reuse is not claimed to establish stable hosted timing.
  - Verification: the corrected cache regression fails before the fix (five
    constructions for two locales) and passes after it, covering advancing
    time, future dates and Persian digits. Root typecheck, 543 unit tests
    (5 database-dependent skips), web lint and the normal production build
    pass. The full browser suite passes 358 scenarios with 44 intentional
    skips and no retries. New EN/FA desktop/mobile checks block framework
    JavaScript and confirm that the server summary and totals remain visible;
    existing request-scope, expiry and Saved ordering checks still pass.
  - All nine local Lighthouse reports pass: median LCP/performance/FID is
    home 2646 ms/97/92 ms, dashboard 2839 ms/96/97 ms and detail
    2649 ms/97/94 ms, with accessibility 100. Nine trace/request-log pairs
    were generated and preserved, confirming the CI retention settings.
    Twelve responsive EN/FA/theme dashboard captures have no overflow,
    duplicate shells or page errors; representative renders, Impeccable
    detection and a manual second-pass diff review pass. No usage meter is
    exposed. The stricter LCP targets remain open.
  - Separate diagnostic: nine applied-throttling runs (default network
    parameters, 4x CPU, `throttlingMethod: devtools`) give median LCP
    1828/1727/1858 ms. In the first home sample, content paints at 1845 ms
    before the largest framework downloads finish at 2216/2240 ms. This is
    evidence about that diagnostic profile, not acceptance under the
    existing simulated gates or on physical phones.
  - Rejected trials: an extra hydration boundary, a transition, reusing a
    server readout, and native default number formatting did not establish
    a useful gain; the server-readout trial regressed dashboard LCP. None is
    retained. Source snapshots, CPU profiles, original failures, diagnostics
    and final reports are under ignored `maintenance/queue-20261022/`.
  - Shared surface: `changelog.md`; `.github/workflows/web.yml` changes only
    artifact retention. No API, schema, dependency, authentication, provider
    or environment change. Physical-device/native wording acceptance and
    the owner-deferred domain/email/Google sequence remain open.

- **Defer the complete product dialog runtime (Ramtin local performance queue).**
  Preview and installation now load their Radix roots with their existing lazy
  content. Product actions retain ordinary buttons and explicitly restore focus
  when a dialog closes. Protected focus, Escape, close controls, acquisition
  errors and release selection are preserved; signed-out acquisition still
  redirects to sign-in without advertising a dialog.
  - Product first-load JavaScript falls from 181,388 to 168,458 gzip bytes
    (7.1%, 177.1 to 164.5 KiB). The bilingual browser gate ratchets from 180
    to 165 KiB. Home/dashboard bundles differ only by 25 runtime-map bytes;
    no public or dashboard timing improvement is claimed for those routes.
  - Verification: root typecheck, 542 unit tests (5 database-dependent skips),
    web lint and the normal root production build pass. The full browser suite
    passes 354 scenarios with 44 intentional skips and no retries; the final
    signed-out accessibility refinement additionally passes its unit check and
    35 product/bundle browser scenarios (7 intentional skips). Both locales
    exercise modal focus containment, Escape, reopening, close buttons and
    return focus. All nine local Lighthouse reports pass unchanged assertions
    and 4x CPU/network settings: median LCP/performance/FID is home
    2649 ms/97/91 ms, dashboard 2644 ms/97/83 ms and detail 2646 ms/97/92 ms;
    accessibility is 100 throughout. The stricter 2200/2000/2200 ms LCP targets
    remain unfinished and stay in both queues.
  - Rendered checks: 84 EN/FA, light/dark, 320/768/1280 captures cover public
    pages, dashboard and both dialogs, including keyboard focus. No overflow,
    duplicate shells or page errors; representative dialog renders and a manual
    second-pass diff review were inspected. Impeccable reports no findings.
    Existing follow-up: the English sample in the Persian preview inherits
    RTL; `features/product/preview-dialog.tsx` needs a separate bidi-content
    review. This phase preserves its existing presentation.
  - A CSS-inlining trial did not establish a useful gain and was reverted;
    no experimental configuration is retained. The original failing test
    assertions, corrected checks, before/after profiles, captures and reports
    are preserved under ignored `maintenance/queue-20261022/`. No usage/cost
    meter is exposed by this harness.
  - Shared surface: `changelog.md`. No API, schema, dependency, provider or
    environment changes. Physical iOS/Android acceptance, native Persian wording
    approval and the owner-deferred domain/email/Google sequence remain open.

## 2026-10-21

- **Reduce dashboard startup formatting and forced layout (sequential queue).**
  The existing number helper now reuses formatters by resolved locale/options;
  overview summaries, totals, ratings and listing rows use it. Only formatter
  objects are cached, never reader values or private responses. The shared
  header uses ResizeObserver's measured border box, retaining the bounds-read
  fallback, and schedules initial scroll measurement through its existing
  animation-frame path. Session snapshots, Saved ordering, wording and styling
  are unchanged.
  - Preserved the first queue commit's hosted failure: dashboard FID samples
    147/135/110 ms, median 135 versus the unchanged 130 ms gate, at benchmark
    indices 2477-2499 and the existing calibrated 3x profile. Original failed
    reports and older failures remain intact. A separate diagnostic 6x CPU
    sample had a 176 ms longest task before these edits; two after samples
    measured 144/152 ms. This is a small diagnostic comparison, not proof that
    hosted scheduling variability has disappeared.
  - Verification: cache regression fails before the fix and passes after it;
    tests preserve Persian/data digits, rating precision, compact overrides,
    observer offsets and fallback. Root typecheck, 541 unit tests (5 database
    skips), web lint, root production build, 350 browser passes (44 intentional
    skips, no retries), nine local Lighthouse reports and 60 responsive
    EN/FA/theme captures pass. Representative renders and the manual second
    diff review pass; Impeccable reports no findings. No usage meter is exposed.
  - Final local 4x CPU median LCP/performance/FID: home 2631 ms/97/76 ms,
    dashboard 2782 ms/96/74 ms, detail 2782 ms/96/78 ms. Existing assertions,
    network settings and CPU calibration are unchanged; stricter LCP targets
    remain open. [Hosted application/database CI](https://github.com/boyInShadows/termSpace/actions/runs/39651240026)
    and [browser/Lighthouse checks](https://github.com/boyInShadows/termSpace/actions/runs/39651240051)
    pass on `2a1a03e` without rerunning or altering the calibration. Dashboard
    FID samples are 134/128/104 ms, median 128 versus the prior 135. Individual
    outliers remain (home reached 272 ms); no guarantee of stable hosted timing
    is claimed. The investigation/startup-reduction item is removed from the
    ignored local queue, while strict LCP acceptance stays open. Evidence and
    original failures are preserved in `maintenance/queue-20261021/`.
    An additional font-preload priority experiment did not improve LCP and was
    reverted; its reports are retained there too.
  - Shared surface: `changelog.md`. No API, schema, dependency, provider or
    environment changes; physical-device/native wording acceptance and the
    owner-deferred domain/email/Google sequence remain open.

- **Remove Studio code from the dashboard overview (sequential local queue,
  first LCP improvement).** Moved the three existing lifecycle helpers into
  `lib/dashboard.ts` and updated Studio, overview tables and activity imports.
  Labels, editability, reader snapshots and Saved ordering are unchanged.
  Dashboard initial JavaScript falls from 175,544 to 162,878 gzip bytes (7.2%);
  the bilingual browser budget now ratchets from 200 to 170 kB.
  - Verification: root typecheck, 538 unit tests (5 database-dependent skips),
    web lint, root production build, 350 browser passes (44 intentional skips,
    no retries), and all nine Lighthouse assertions pass. Lifecycle helper
    checks cover both locales, editability and unknown-value fallbacks. Sixty
    EN/FA, light/dark, 320/768/1280 captures have no overflow, duplicate shells
    or page errors; representative dashboard renders were inspected and the
    Impeccable detector reports no findings. Manual second-pass diff review
    found no issue; this harness exposes no usage/cost meter.
  - Local 4x CPU median LCP/performance: home 2631 ms/97, dashboard 2799 ms/96,
    detail 2777 ms/96; median max-potential-FID 76/80/72 ms. These pass existing
    gates but miss the stricter 2200/2000/2200 ms targets. Public bundles did
    not change; timing differences are not claimed as public improvements.
    The LCP task remains open in both queues. Original reports and CPU-profile
    evidence are preserved under ignored `maintenance/queue-20261021/`.
  - Shared surface: `changelog.md`. No API, schema, provider or environment
    change. Hosted variability, physical phones and native Persian acceptance
    remain open; the owner-deferred live-provider sequence remains paused.

- **Scope editor labels and trim homepage hydration data (owner-requested next
  performance step).** Root locale messages no longer serialize the draft
  editor's labels on every page. New/edit server pages supply the active
  locale's labels directly to the editor and its declaration rows. The shared
  creator dashboard retains its conflict message. The homepage process section
  receives only its three consumed fields. Wording, layout, session handling,
  API requests and caching are unchanged.
  - In the English fixture comparison, document transfer fell from 24,033 to
    22,029 bytes on home (8.3%), 16,718 to 15,490 on dashboard (7.3%) and 24,320
    to 23,141 on detail (4.8%). First-load JavaScript is unchanged. LCP did not
    materially improve: final local 4x CPU medians are 2,407 / 2,936 / 2,404 ms,
    with performance 98 / 95 / 98 and accessibility 100 throughout. All nine
    LHCI reports pass the existing assertions. The stricter LCP targets remain
    open; neither budgets nor throttling were changed.
  - Rejected experiments: the default Turbopack build was slower on all three
    routes; limiting webpack's initial requests did not help. Neither change
    is retained. Ignored profiles, critical-path analysis and before/after
    evidence are under `maintenance/lcp-20261021/`.
  - Verification: three baseline HTML checks failed before the fix. The new
    checks cover both locales and retain editor labels on editor routes;
    scoped draft-options fixtures also open the localized form. Root typecheck,
    535 unit tests (5 database-dependent skips), web lint, production build,
    350 browser passes (44 intentional skips, no retries), and Impeccable
    detection pass. Reviewed 60 public/dashboard and 24 normal editor captures
    across EN/FA, both themes and 320/768/1280 widths: no overflow, duplicate
    shells or page errors. Editor outage layouts were checked separately.
    Physical-device and native Persian acceptance remain outstanding.
  - Shared surfaces: `apps/web/lib/i18n/index.ts` and `changelog.md`. The ignored
    local queue retains the unfinished LCP and owner-dependent acceptance work.

- **Explore streaming assertion repair (owner-requested next step).** The latest
  hosted browser run exposed a strict-selector failure: React temporarily kept
  a hidden `S:0` result tree beside the visible Explore page. The two result-count
  assertions now query the exposed status role, while retaining exact totals,
  filtering, reload persistence and clear-filter checks. Application rendering,
  timeouts, retries and performance/accessibility gates are unchanged.
  - Evidence: hosted run `39497147842` and its downloaded trace confirm the hidden
    duplicate. A focused local reproduction preserves a hidden stale count and
    confirms that the old CSS selector matches both trees while the role query
    matches only the current count. Both affected scenarios pass 60 repeated
    desktop/mobile cases. The full browser suite passes 334 cases with 44
    intentional skips and no retries. Root typecheck, 535 unit tests (5
    database-dependent skips), web lint and production build pass.
  - Scope: `apps/web/e2e/catalog.spec.ts` and shared `changelog.md`. Ignored
    evidence is under `maintenance/ci-streaming-20261021/`. Local Lighthouse and
    visual captures were not repeated for this test-only change; the existing
    strict LCP targets, physical-device checks and native Persian acceptance
    remain open. This repair restores the browser gate needed by hosted LHCI.

- **Remaining local follow-ups reconciled (owner-requested).** Documented the
  existing installation-output matrix and corrected the stale platform-registry
  blocker: compatibility keys already exist, but client-specific configuration
  and remote transports still need structured fields and a selected target.
  Additional source providers retain ADR 0001's decision requirement. No new
  configuration, commands, providers or registry entries are implemented.
  - Reviewed the assistant-authored Persian account, Profile, hero and listing
    trust/licence/permission text in source and the current rendered layouts.
    Recorded concrete terminology/wording choices in ignored
    `maintenance/performance-20261020/persian-review.json`; a Persian-speaking
    maintainer's acceptance remains open. No copy change or native approval is
    claimed. Consolidated duplicate local review entries, retained physical-phone
    acceptance and the owner's email/Google pause, and moved backup retention
    into operating notes after confirming the recovery dump still exists.
  - Scope: `docs/marketplace-manifests.md`, shared `changelog.md` and ignored
    `ramtin-pending.md`. Existing command builders, manifest validation and the
    platform registry were checked directly after graph freshness warnings.
    All four documentation links and the review JSON validate. Root typecheck,
    535 unit tests (5 database-dependent skips), web lint and production build
    pass; browser/Lighthouse checks were not repeated for documentation changes.

- **Cold dashboard summary and performance ratchet (owner-requested local queue).**
  The dashboard can now render its verified reader's summary and totals in the
  initial HTML. Request-scoped server reads forward the current cookie without
  caching private responses; each lookup has a 1.5-second deadline and falls
  back to the existing browser reads. Public pages retain their client identity
  lookup. The browser still revalidates identity and dashboard data, and Saved
  still waits for the complete favorites read before showing removal controls.
  Cold loads therefore add server reads alongside browser revalidation; this
  reduces the client dependency chain rather than the total request count.
  - Older refresh results cannot overwrite a newer identity. Account changes
    remount dashboard content. A fresh review caught a server/browser timezone
    mismatch, reproduced in both browser projects; the initial clock-dependent
    content is now deterministic and switches to browser-local time after data
    loads. Pending panels keep their accessible loading status.
  - Root typecheck, 535 unit tests (5 database-dependent skips), web lint,
    334 browser tests (44 intentional skips, no retries), normal production
    build and 60 EN/FA/theme/320/768/1280 captures pass. The captures check
    overflow, page errors, locale/theme and one global header/main; representative
    renders were reviewed. The Impeccable detector returned no findings.
  - All nine local Lighthouse reports pass at the unchanged 4x CPU/network
    profile. Median LCP/performance: home 2408 ms/98, dashboard 2955 ms/95,
    detail 2404 ms/98; accessibility is 100 throughout. Dashboard performance
    meets its 92 target, so its gate is tightened from 85 to 92 and all reports
    pass again. LCP gates remain unchanged: the tighter 2.2/2.0/2.2-second
    targets are still unfinished in both queues. Public-page timing variation
    is not claimed as a public rendering improvement.
    All six hosted checks also passed on `09b9ebc`: [browser/performance](https://github.com/boyInShadows/termSpace/actions/runs/39495640293)
    and [application/database](https://github.com/boyInShadows/termSpace/actions/runs/39495640296).
  - CSS inlining and below-fold containment experiments were not retained;
    their samples did not establish a useful public LCP improvement. Evidence,
    traces, RED/GREEN regressions and rejected experiments are preserved in
    ignored `maintenance/performance-20261020/`. Graph metadata/partial-parse
    warnings were checked against current source. Fresh review findings were
    addressed; no external-model review was authorized or run.
  - Shared surfaces: `apps/web/lib/api.ts`, `pending.md` and `changelog.md` for
    this assigned performance phase. No API-server, schema, provider, secret,
    environment or live user-data change; the local email pause is preserved.
    Physical devices, native Persian review and live providers remain open.
    No usage/cost meter is exposed by this harness.

## 2026-10-20

- **Merge `ramtin` into `redesign`.** Combines `ea26053` and `9326134` with
  both histories retained. Resolutions preserve the risk-first moderation flow,
  legacy redirects, trust rows, legal footer links and production showroom
  restriction alongside the shared root navigation, server-rendered footer,
  Profile/Saved dashboard and performance improvements. The obsolete dashboard
  topbar stays removed; role-aware moderation remains in dashboard navigation.
  Shared surfaces merged: `AGENTS.md`, `pending.md`, `changelog.md` and
  `apps/web/lib/api.ts`. No pending queue item was implemented in this phase.
  Integration fixes also adapt the two moderation test providers to explicit
  messages, remove the legal pages' duplicate header and make their skip target
  focusable. Footer tests retain legal destinations in both languages; shared
  navigation browser checks cover legal skip targets and the moderation route.
  - Verified: root typecheck; root unit suite (571 passed, 6 database/Redis
    dependent skips, with `NODE_OPTIONS=--no-experimental-webstorage`); web lint;
    root production build (all three apps); full web e2e with local Chrome
    (324 passed, 44 intentional skips, no retries); Lighthouse (all budgets
    across 9 runs at the unchanged local settings); design detector (no findings).
    Twelve desktop/mobile captures cover English/Persian and both themes;
    visual review, geometry, single-header/main and page-error checks pass.
    Logs and captures are under `/tmp/termspace-merge-*`; generated reports
    remain ignored. Manual integration diff/security review found no remaining
    issue. Graph metadata was stale, so relevant source was inspected directly.
    Impeccable's existing stale design sidecar remains unchanged; `DESIGN.md`
    remains authoritative. Usage/cost meter unavailable in this harness.

- **README refresh (owner-requested).** Updated the shipped feature summary for
  community browsing, dashboard/Saved/library/Studio and acquisition-backed
  reviews. Documented root/app environment setup, mismatched example database
  passwords, Prisma generation, optional demo-seed limitations, local routes,
  worker execution, verification commands and production metadata settings.
  Linked the existing deployment ownership audit and remaining roadmap.
  - Scope: `README.md` and shared `changelog.md`; no application, dependency,
    environment, schema or pending-task changes. Current `origin/main` is
    already included in `ramtin`; no history rewrite or merge was needed.
  - Verification: root typecheck, 519 unit tests (5 database-dependent skips),
    web lint and root production build passed. All 14 local README links,
    18 npm script references and code fences passed documentation checks;
    `git diff --check` passed. Manual second-pass diff review found no issue.
    Logs: ignored `maintenance/readme-20261020/`. Browser/Lighthouse, fresh
    installs, Docker startup and live providers were not rerun for this
    documentation-only change. No usage/cost meter is exposed by this harness.

## 2026-10-19

- **Dashboard data no longer waits for favorites.** The shell now uses identity
  readiness to mount verified workspace content, allowing overview and Profile
  requests to overlap the initial favorites read. The session's existing full
  `loading` contract is retained for its other consumers. Saved waits for that
  complete snapshot before fetching its own collection or exposing removal
  controls, including during refresh. A favorites 401 still clears identity
  and redirects out; API authorization and email verification remain intact.
  - A three-run controlled mobile-viewport experiment with a 1000 ms favorites
    delay reduced median navigation-to-table time from 1462 ms to 230 ms.
    With immediate favorites it measured 205 ms before / 225 ms after, within
    noise. This is request overlap under delay, not an LCP claim. Raw events,
    captures and verification logs: `maintenance/dashboard-loading-20261019/`.
  - Root typecheck, 519 unit tests (5 database-dependent skips), web lint and
    the full browser suite pass: 324 cases, 44 intentional skips, no retries.
    Twelve new browser cases cover delayed favorites, blocked Saved mutation,
    persistent removal and session expiry in EN/FA on desktop/mobile. Thirty-six
    captures cover both themes and 320/768/1280 widths, including Saved loading
    and empty states; geometry/page-error checks and representative visual
    review pass. Impeccable's detector reports no findings.
  - All 21 existing Lighthouse assertions pass across nine local mobile reports
    at unchanged 4x CPU/network settings. Median LCP/performance: home
    2643 ms/97, dashboard 3766 ms/89, detail 2785 ms/96; accessibility is 100.
    Dashboard LCP is effectively unchanged from the prior 3767 ms/89, so the
    tighter targets remain open. The normal root production build also passes.
  - Shared `pending.md` and `changelog.md` are updated for the owner's assigned
    performance phase; the completed waterfall investigation is removed from
    both queues, retaining hydration/rendering targets and owner acceptance.
    CodebaseMemory coverage flagged changed metadata; relevant source and
    callers were read directly. Manual diff review found no remaining issue.
    No agent cost/usage meter is exposed by this harness.

- **First-request sitemap recovery after offline builds.** Hosted checks on
  `7c8f5db` all passed, but sitemap acceptance needed a retry: CI builds before
  the fixture API starts, caches the three-route fallback, then serves that
  stale response while regenerating. The old build manifest confirms a static
  sitemap with a 30-second output lifetime inherited from its data requests.
  - `app/sitemap.ts` now uses route `revalidate = 0`, preventing build-time
    fallback output from becoming the live sitemap. The public API requests
    retain their explicit 30-second cache; this follows Next's [documented
    route/data-cache separation](https://nextjs.org/docs/app/guides/caching-without-cache-components#route-segment-config-revalidate).
    Existing fallback behavior, pagination bounds, alternates and private-data
    boundaries remain intact. The SEO check also asserts HTTP 200 before XML.
  - Regression acceptance: built the fixture with API_URL pointing at an
    unused loopback port and no API process. The manifest contains no cached
    sitemap; after starting the runtime fixture, all 29 SEO checks pass without
    retries (5 intentional mobile skips). Root verification and normal build
    are recorded in `maintenance/performance-20261019/sitemap-*.log`.
  - Closed the completed Lighthouse CI item in both queues after all six
    hosted jobs passed on `7c8f5db`: [web/performance run](https://github.com/boyInShadows/termSpace/actions/runs/39313319877)
    and [application/database run](https://github.com/boyInShadows/termSpace/actions/runs/39313319899).
    Every downloaded report confirms CPU factor 3, RTT 150 ms and throughput
    1638.4 Kbps. Hosted FID medians are 115/99/115 ms (limit 130), with all
    other gates passing. The local default remains 4x; cold CPU benchmark
    outliers are recorded separately from the steady calibration range.
    Shared `pending.md`, `changelog.md` and the ignored local queue retain the
    tighter LCP targets and owner-dependent acceptance; workflow comments now
    distinguish steady CPU values from warm-up noise. No threshold was raised.

- **Comparable hosted Lighthouse CPU profile.** Run 39311691198 passes the
  browser suite after the full-Chromium fix, but reproduces max-potential-FID
  failures at 149/135/157 ms with the default 4x CPU factor. Long tasks point
  to the shared React runtime, and the runner's steady CPU benchmark is only
  about 2400-2509 versus the local reference around 4500 (the older main run
  measured 3020). Applying 4x to both hosts does not emulate the same CPU.
  - Following Lighthouse's [CPU calibration guidance](https://github.com/GoogleChrome/lighthouse/blob/main/docs/throttling.md#calibrating-the-cpu-slowdown),
    only the hosted workflow now uses 3x: effective index 800-1007 across the
    observed runner range, still slower than the local 4500/4 = 1125 reference.
    The local default remains 4x. Network throttling, three-run aggregation and
    every assertion/ratchet limit remain unchanged. Recalibrate when the hosted
    CPU range changes; every report retains its benchmark and throttle values.
  - This phase owns `.github/workflows/web.yml` for the owner's requested CI
    reliability work. No application, browser assertion or dependency changed.
    Reports and failure logs are in `maintenance/performance-20261019/ci-after/`.

- **Hosted zoom-harness compatibility.** Draft PR #10's first hosted run
  (39310542406) exposed twelve genuine zoom-test failures: the default
  Playwright headless shell ignored Chrome profile preferences, so DPR stayed
  1 instead of doubling. The helper now defaults to the full `chromium`
  channel, while preserving the local `PW_CHANNEL=chrome` override. This uses
  Playwright's [documented full-browser headless mode](https://playwright.dev/docs/browsers#chromium-new-headless-mode).
  The workflow already installs both browser variants. No zoom assertion,
  viewport, retry, application code or performance budget was weakened.
  Root typecheck, 516 unit tests, web lint, the normal build and all twelve
  focused local Chrome zoom cases pass; the full Chromium fallback is checked
  by the hosted rerun. Failed-run logs are retained with the phase evidence.

- **Web initial-load budgets (owner-assigned performance phase).** The root
  server layout now supplies only the active language's messages to the locale
  provider, removing the two-language dictionary module from client JavaScript.
  The static shared footer now renders on the server; all eleven callers remain
  unchanged. Tests and Storybook supply their dictionary explicitly. The
  Storybook render check also exposed missing App Router context; its preview
  now enables the [documented App Router parameter](https://storybook.js.org/docs/get-started/frameworks/nextjs-vite#nextjs-navigation)
  and serves the existing public fonts.
  - Initial gzip JS, identical in EN/FA: home 175.9 to 162.5 KiB, dashboard
    191.3 to 178.6 KiB, detail 190.4 to 176.9 KiB. Active messages move into
    HTML/RSC, so total-transfer savings are smaller than JS savings; this is
    measured lab evidence, not a claim about real-device Core Web Vitals.
  - Tightened home/detail JS gates to their 170/180 KiB targets and added FA
    budget cases. Home's performance-score gate now enforces its existing 90
    target. No budget or throttle was relaxed. Mobile LCP medians are home
    2.64 s, dashboard 3.77 s and detail 2.80 s; dashboard performance is 89.
    The stricter LCP and dashboard-score targets remain unfinished.
  - Kept the existing session/favorites loading contract after reviewing the
    private-read/mutation ordering. Dashboard waterfall work must preserve it.
  - Verification: root typecheck, 516 unit tests (5 existing DB-dependent
    skips), clean web lint, 312 browser tests (44 intentional skips), root
    production build, Storybook build and all 21 Lighthouse budget assertions
    across nine reports passed. Sixty surface captures plus eight footer
    captures cover EN/FA, both themes and responsive widths; no overflow,
    duplicate shells, locale/theme mismatch or page errors. Impeccable reports
    no findings in the changed production UI. Graph coverage marked stale
    metadata/new tests; direct source and caller checks supplied verification.
    A manual second pass included isolated tests and the Storybook consumer;
    two compiled stories rendered with their fonts and no console/page errors.
  - Shared files `pending.md` and `changelog.md`: the owner accepted the
    performance item from the shared backlog for this phase. Removed completed
    budget work from the queues, promoted remaining performance work to the top
    of the ignored local queue, and retained owner/device-dependent acceptance.
    Latest main CI (38893763199) failed max-potential-FID at 150/131 ms; hosted
    acceptance of the current branch follows through a draft PR. Evidence:
    `maintenance/performance-20261019/`. No API, permission or dependency change.

- **Real 200% dashboard zoom and keyboard clearance (next local queue item).**
  Replaced the inconclusive keyboard-shortcut check with actual Chrome browser
  zoom in disposable profiles on D:. DPR doubles and the CSS viewport halves
  relative to a matching 100% window; visual-viewport scale and CSS zoom stay 1.
  The profile dictionary follows [Chromium's zoom preferences implementation](https://chromium.googlesource.com/chromium/src/+/lkgr/chrome/browser/ui/zoom/chrome_zoom_level_prefs.cc).
  No user Chrome profile, global setting or installed tool was modified.
  - The baseline exposed 20 obscured keyboard targets: provider actions and
    Saved listing links/buttons scrolled beneath fixed dashboard tabs. The
    shared `.dashboard-operate` control rule now supplies the same 6rem plus
    safe-area focus-scroll clearance already used by account security/library.
    One CSS declaration fixes current and future dashboard controls together.
  - Added `e2e/browser-zoom.spec.ts`: 12 desktop cases cover EN/FA, light/dark
    and 1280/1920/2560 physical window widths. Each verifies actual zoom geometry,
    overflow, search focus and keyboard traversal across overview, Studio,
    Profile, acquired library and Saved listings. Device-scale emulation is
    explicitly cleared. Mobile test projects skip these desktop browser cases;
    physical-device acceptance remains separate.
  - Local before/after matrix: 60 captures and 168 keyboard-focus checks; the
    repeated matrix has zero obscured controls, horizontal overflow or page
    errors. Physical iOS/Android, native Persian review and owner-deferred live
    service checks remain open. Evidence: `maintenance/zoom-acceptance-20261019/`.
  - Verification: root typecheck, 513 unit tests (5 existing DB-dependent skips),
    clean web lint, full browser suite 309 passed (29 existing skips plus 12
    desktop-only zoom cases skipped in the mobile project), root production
    build and all Lighthouse assertions across nine runs passed. Representative
    performance: home 96, dashboard 90, detail 96; accessibility 100 throughout.
    Performance budgets remain unchanged and their tighter targets remain open.
    Impeccable reported only the two previously documented spring/focus-corner
    advisories in globals.css; the new declaration adds no detector finding.
    Manual second-pass review checked selector scope, native focus scrolling,
    disposable-profile cleanup and actual zoom assertions. Graph coverage marked
    changed metadata/new test source; the relevant source was read directly.
    Removed the completed zoom item from the ignored local queue. No API,
    permission, dependency or user-data changes.


- **Dashboard Profile, saved listings, provider access and hydration repair (owner-requested).**
  Removed the redundant dashboard breadcrumb/toolbar frame; workspace search
  remains a content control with its Ctrl/Cmd+K shortcut. The shared desktop
  dropdown and phone menu no longer contain Profile. Dashboard navigation and
  quick actions now label the existing Settings/account-security destination
  Profile, preserving its identity, password and creator-profile controls.
  `AGENTS.md` allows explicitly authorized sequential queue work and documents
  the root header's hydration ownership. No permission prompt or global config
  change was needed during this task.
  - DC05: added `/dashboard/library/saved`, library collection links and a quick
    action. It resolves at most 12 public details per page, cancels stale reads,
    isolates unavailable listings and per-item failures, retries, removes saved
    items and clamps pagination after removals or a shrinking refreshed list.
    Successful removals update existing hearts; failed removals preserve state.
    Shared `apps/web/lib/api.ts` only adds optional AbortSignal parameters.
  - Authorized API scope: `apps/api/src/controllers/marketplaceController.ts`
    now deletes the current reader's saved relation by slug even when the listing
    is unavailable. The previous published-only lookup silently retained those
    records. No product details are returned; no schema or permission change.
    Regression coverage asserts reader scoping and idempotent 204 behavior.
  - DC07: extracted existing GitHub/npm controls into `ProviderConnections`, used
    by Profile for eligible creators and by listing releases. Creators need no
    listings to connect. Provider failures and retries are independent of release
    history; permissions/revocation guidance remains. Submission clears token
    fields after success or failure. Tests use synthetic credentials exclusively.
    Corrected the inherited phone grid/input overflow and long identity wrapping.
    Long saved titles wrap at 320px; listing prose detects its own text direction
    inside Persian pages. Eight additional EN/FA long-content captures fit at
    320/1280px, including 80-character titles and provider identities.
  - HQ01: reproduced the intermittent hydration warning in a route-logged
    production capture, then obtained its exact development HTML diff. A fast
    session response changed the separately suspended Header from a Sign-in
    anchor to AccountMenu before hydration. Removed that unnecessary root
    Suspense boundary; the root already awaits request headers. The isolated
    development reproduction then passed 72 navigations, and the production
    112-capture EN/FA, light/dark, 320/768/1280 plus landscape matrix had no page
    errors or horizontal overflow. Added fast-session browser regressions covering
    72 additional navigations. No warning suppression or authentication bypass.
  - Removed DC05, DC07, HQ01 and their completed execution block from ignored
    `ramtin-pending.md`; retained unfinished browser-zoom, physical-device,
    Persian, live-provider/domain and owner/deployment acceptance, plus the
    explicitly other-maintainer-owned shared backlog snapshot.
  - Verification: root typecheck, all 513 unit tests (5 existing DB-dependent
    skips), clean web lint, full browser suite 297 passed/29 existing skips,
    root production build and all Lighthouse assertions across nine runs passed.
    Representative performance: home 96, dashboard 91, detail 96; accessibility
    100 throughout. LCP 2.79/3.47/2.79 s, TBT 32/18/37 ms. Budgets are unchanged;
    tighter LCP/performance targets and CI-runner work remain in the shared queue.
    The final normal production build also passed eight long-content captures.
    Actual browser zoom remains open: the headless shortcut did not change DPR
    or the viewport, so it was not counted as 200% acceptance. Impeccable's
    initial and follow-up detectors returned no findings. Evidence is local in
    `maintenance/dashboard-queue-20261019/` (including the preserved failing
    hydration capture and development diff).
    Manual second-pass review covered callers, cancellation, reader scoping,
    token clearing, role gates and state recovery. Graph coverage flagged changed
    metadata and partial test mock syntax; relevant source was read directly.
    No dependencies, migrations, real-provider actions or user data changes.

- **One global main-site/dashboard navigation and layout (owner-requested).**
  The root `apps/web/app/layout.tsx` now renders the existing shared header
  once for public and dashboard routes. Removed its 11 page/loading callers.
  The nested dashboard layout retains the reader gate, sidebar/mobile tabs,
  breadcrumb and search; account, theme, locale and global links have one owner.
  Uses native Next.js layout nesting; no route overlay, new dependency or API.
  - The root localized skip link is the first keyboard stop, targeting a
    focusable `main#content` on each route. Browser verification caught and
    repaired the initial product skip-link ordering regression. Sticky sidebar
    and focus offsets use the measured header height. Persistent mobile menus
    close on route changes and history, scroll in landscape, and layer above
    fixed dashboard tabs. Search shortcuts and unsaved-draft guards remain.
  - The inherited header closes DC06: moderators/administrators can reach
    moderation from the dashboard, in EN/FA and desktop/mobile; readers and
    ordinary creators see no staff link. Existing API role enforcement remains
    authoritative. Removed DC06 from the local queue after role-aware browser
    checks; DC05 and DC07 remain open.
  - Inspected the owner's local AgentSkills, Task Observer, CodeBaseMemory,
    Graphify and Ponytail references. `AGENTS.md` documents when to use each,
    prioritizes installed/shared skills over stale mirror instructions, and
    assigns global versus nested-layout ownership. No tool installation or
    global configuration change. Graphify builds and Task Observer reviews
    were not requested by this documentation task and were not run.
  - `ramtin-pending.md` now contains unfinished work and necessary operating
    notes: removed the completed UI01–UI03 section, DC01–DC04 completion notes,
    historical completion/review blocks, checked tasks, this navigation plan,
    DC06 and empty audit headings. Outcomes remain in this changelog and local
    evidence. Preserved owner-deferred email/provider work, physical-device,
    language and deployment acceptance, and the shared backlog snapshot.
    `AGENTS.md` now requires removing verified-complete local task sections
    rather than retaining a second changelog. The local queue remains ignored.
  - Verification: root typecheck, 501 unit tests (5 database-dependent skips),
    web lint, regular root production build, 277 Chrome tests (29 conditional
    skips, four workers) and all nine Lighthouse runs passed existing gates.
    Representative home/dashboard/detail scores: 96/93/95, accessibility 100.
    One hundred EN/FA/light/dark captures cover eight routes at 320/768/1280px
    plus landscape menus; an explicit four-case landscape repeat passed too.
    Eighty additional route-logged navigations passed. Verified one global
    header, content focus, no overflow, measured offsets and sidebar/menu hits.
    Impeccable returned six advisory findings, no blocking findings; the
    established font, compact metadata, focus-corner and feedback-easing
    exceptions remain intentional. Reviewed representative renders and the
    connected source/diff; graph freshness flags were checked through source.
  - Known follow-up: the initial capture emitted one React hydration warning
    (#418) without route context. It did not recur in the final matrix or
    targeted repetitions; no cause or fix is claimed. HQ01 in the local queue
    retains this observation and its evidence. No real accounts, credentials,
    listings, provider connections or email changed. Real devices, actual 200%
    browser zoom, native Persian wording, live providers and CI were not tested.
  - Shared surfaces: owner-requested `AGENTS.md` workflow/layout rules and this
    `changelog.md` entry. Evidence: `maintenance/shared-navigation-20261019/`
    (ignored), with the earlier failed checks preserved. Public footer placement
    and the separately deployed Blog remain independent of the global web nav.

- **Main-site/dashboard design consistency (owner-requested highest priority).**
  Added the P0 plan to ignored `ramtin-pending.md` and completed UI01–UI03 as
  this session's implementation phase. `AGENTS.md` now requires the installed
  Impeccable skill for design planning, creation, changes and review throughout
  the project, with rendered theme/locale/responsive verification.
  - Extended the established Datasheet identity through shared web foundations:
    Geist/Estedad headings, square radius tokens, ink-filled primary actions,
    plain outlined badges and ruled listing frames. Shared fields use readable
    16px text. Header/footer, homepage sections, search suggestions, menus,
    dialogs, moderation labels and loading placeholders now use that vocabulary.
    Retained familiar avatar/switch geometry, state labels, focus and role gates.
  - Removed decorative gradients, blur, shadows, lift, scroll entrances,
    Newsreader requests and typed-placeholder timers. Search submission, scope,
    suggestions and recent history remain. Removed unused effect definitions
    and reconciled DESIGN.md, the landing surface brief and design-system
    showroom with the actual shipped composition. Blog remains its separate
    editorial app; the project-wide design workflow requirement applies to it.
  - Added browser regressions across public/account/dashboard/community routes
    in EN/FA and both themes. Updated the retired reveal and different-English-
    weight assertions to require immediately visible sections and shared heading
    weight with Persian's looser leading. The first run caught an English font
    fallback mismatch; fixed the shared heading declaration and reran the suite.
  - Verification: root typecheck, 500 unit tests (5 database-dependent skips),
    web lint, regular root production build, 247 Chrome tests (29 conditional
    skips, four workers), and all nine Lighthouse runs passed unchanged gates.
    Representative home/dashboard/detail performance scores: 96/91/95;
    accessibility 100 throughout. Existing tighter LCP/JS/CI targets stay open.
    Sixty before and sixty after captures at 320/768/1280px cover home,
    dashboard, explore, detail and account in both themes/locales, with no
    horizontal overflow or page errors. Reviewed representative renders at
    desktop/tablet/phone sizes. The Impeccable detector had 13 advisory findings,
    no blocking findings; intentional typography/focus/feedback dispositions
    are documented. Manual connected-source/diff review found no unresolved
    functional issue; graph freshness warnings were checked through source.
  - Shared surfaces: owner-authorized `AGENTS.md` design policy and this
    `changelog.md` entry. No API/schema/authentication/provider/email change.
    Local evidence: `maintenance/design-consistency-20261019/` (ignored).
    DC05–DC07 and the remaining backlog are still open under the one-phase
    rule. Physical devices, actual 200% browser zoom, native Persian wording,
    live providers and CI acceptance were not performed.

- **Shared rate-limit store, non-revealing signup, Google wording (phase 4;
  `readiness.md` S2 and S10).** Shared surfaces and outside the web lane:
  `docker-compose.yml`, `apps/web/lib/api.ts`, `apps/web/lib/i18n/common.ts`,
  `apps/api` and its dependencies.
  - Redis: new `redis` compose service (no persistence, 64 MB, internal only);
    every API limiter counts there through `limiter()` in
    `middleware/security.ts`, so limits hold across replicas and restarts. New
    dependencies `rate-limit-redis` (the store express-rate-limit documents for
    Redis) and `ioredis` (its client). The API refuses to start in production
    without `REDIS_URL`; if Redis goes down requests pass uncounted. Unset
    `REDIS_URL` keeps in-memory counters for local work and tests.
  - Signup: `POST /api/readers/register` returns `202 {accepted:true}` for a new
    and a taken email and sets no cookie; the web form then shows "check your
    inbox" and switches to sign-in. The `EMAIL_ALREADY_REGISTERED` string and
    branch are gone. A taken email gets no email.
  - Google: sign-up already worked on both apps (an unknown verified Google
    email creates the account). The register tab's button now says "Sign up with
    Google" (`text` prop, remounted per tab).
  - Verified: typecheck, `npm test` (web with
    `NODE_OPTIONS=--no-experimental-webstorage`), web lint, build, e2e (237
    passed; the two signup specs were rewritten for the new flow), compose
    config; the Redis store against a live `redis-server` and with Redis
    unreachable. Not run: the two API integration test files (no database
    here); their register helpers were updated and CI runs them. Run
    `TEST_REDIS_URL=redis://127.0.0.1:6379 npx vitest run security.redis` in
    `apps/api` for the shared-store test.

- **Security hardening, phase 3: `readiness.md` S1-S12.** Outside the web lane:
  `apps/api`, `docker-compose.yml`, the `/backend` handlers, and the explore and
  community pages' search calls (`lib/api.ts` is a shared surface).
  - Rate limits: separate per-IP limiters for reader login, admin login,
    register, Google sign-in and password change; a 30/min search limiter on
    products, community pages and articles; the web search pages forward the
    visitor's `X-Forwarded-For` (searches only, so the 30 s catalogue cache is
    untouched) via `lib/clientIp.ts`.
  - Login timing: a real bcrypt compare runs for unknown users (`lib/passwordCompare.ts`).
  - Boot: `assertProductionConfig()` (database placeholder, `CORS_ORIGINS`, email
    secret, provider token key, no `LOCAL_AUTO_VERIFY_EMAIL`); the bypass is also
    off in production in code; crash handlers for unhandled rejections;
    compose requires `MARKETPLACE_PROVIDER_TOKEN_KEY` for the API.
  - Load: relevance ranking capped at 2000 matches; article page size max 50
    (the blog pages by 50); Prisma `connection_limit` per compose service.
  - Proxy: `/backend` strips stale encoding headers and rejects bodies over
    12 MB with a 413.
  - Not changed, with reasons in `readiness.md`: S2 (no shared store yet), S6
    (those lists are admin-curated or per-user), S10 enumeration on register
    (product decision), S11 and S12 (not exploitable in the current builds).
  - Verified: typecheck, `npm test` (web with
    `NODE_OPTIONS=--no-experimental-webstorage`), web lint, build, e2e (237
    passed), `docker compose config`. Not run: the two API integration test files
    (need a database), lhci (no page changed visually). New tests:
    `passwordCompare`, `productionConfig`, extended `security` and
    `emailVerification`.

- **Pre-deploy blockers, phase 2 of 2: policies, headers, footer (B4, B5, B8 in
  `readiness.md`).** Touches `apps/web` and `apps/blog` presentation plus a shared
  surface: `apps/web/lib/i18n/common.ts` (footer labels).
  - Pages: `/privacy`, `/terms`, `/content-policy` in English and Persian, from
    `lib/legal.ts` through `components/legal/legal-page.tsx`; in the sitemap; the
    web footer has a Legal column; the blog footer links to them on the main
    site (`NEXT_PUBLIC_WEB_URL`, build arg in `Dockerfile.blog`). The text is a
    draft written from what the code does and has had no legal review. Contact
    and entity come from runtime `LEGAL_CONTACT_EMAIL` (required by compose)
    and `LEGAL_ENTITY_NAME`.
  - Headers (web and blog `next.config`): HSTS, nosniff, Referrer-Policy,
    Permissions-Policy, X-Frame-Options and an enforced CSP of frame-ancestors,
    base-uri, object-src and form-action. `script-src` is report-only until
    nonces are in place. `poweredByHeader` is off.
  - Footer: the Creator guide, Quality standards and About links (all pointing
    at `/design-system`) and their "Create" column are removed; the home page's
    quality-standard link goes to `/content-policy`; `/design-system` is a 404
    in production and `noindex`.
  - Verified: typecheck, `npm test` (web with
    `NODE_OPTIONS=--no-experimental-webstorage`), web lint, build,
    `npm run e2e -w apps/web` (237 passed, 29 skipped; run with `WEB_PORT=3110
    MOCK_API_PORT=4110` because something else holds 3100), `npm run lhci -w
    apps/web` (assertions pass), `docker compose config`. New test:
    `lib/legal.test.ts`.
  - Follow-ups: legal review of the text; a consent line on sign-up; enforce
    `script-src`; "Support" in the web footer still links to `/account`.

- **Pre-deploy blockers, phase 1 of 2: API and compose (B1, B2, B3, B6, B7 in
  `readiness.md`).** Work outside the web-presentation lane: `apps/api`,
  `docker/`, `docker-compose.yml` and the `/backend` handlers in `apps/web` and
  `apps/blog`.
  - Rate limit: server-rendered API calls (no `X-Forwarded-For`) no longer count
    against the shared global bucket when `TRUST_PROXY` is on; both `/backend`
    handlers always send the header so browser traffic stays counted.
  - Shutdown and migrations: new one-shot `migrate` compose service; `api` runs
    `node dist/index.js` as PID 1 and waits for it; the three worker loops use
    `init: true`.
  - 500 responses show `err.message` only when `NODE_ENV=development`.
  - `Dockerfile.blog` takes `NEXT_PUBLIC_SITE_URL`; compose requires
    `WEB_PUBLIC_URL`, `BLOG_SITE_URL` and `MEDIA_PUBLIC_URL` instead of
    defaulting them to localhost.
  - Seed rejects `change-this*` admin passwords; the API refuses to start in
    production with a placeholder in `DATABASE_URL`.
  - Verified: `npm run typecheck`, `npm test` (web run with
    `NODE_OPTIONS=--no-experimental-webstorage`: Node 26 breaks jsdom's
    `localStorage`, 19 web tests fail without it, unrelated to this change),
    `npm run lint -w apps/web`, `npm run build`, `docker compose config`. New
    tests: `errorHandler.test.ts`, `security.test.ts`. Not run: e2e, lhci (no UI
    change).
  - Follow-up for the edge proxy (not code): set or append `X-Forwarded-For`
    with the real client address. Phase 2 (B4, B5, B8) is separate.

- **Moderation moves into the dashboard and leads with risk (owner-requested,
  `/impeccable critique` of the moderator page, 16/40).**
  - Routes: `/dashboard/moderation` and `/dashboard/moderation/listings/[id]`
    inside the dashboard shell (sidebar and tab bar entry for moderators, the
    top bar names it, titles per page). `/moderation` and
    `/moderation/listings/[id]` now `permanentRedirect` to them, keeping `/fa`.
    The site header link points at the new route. The marketing banner and
    footer no longer wrap a staff tool.
  - Queue: ruled dashboard rows, one link per listing (its name), filters, search
    and page in the URL (reload, back and shared links keep them; the preview's
    Back returns to them through a whitelisted `from` parameter). Each row shows
    the declared capabilities with a "Needs a closer look" marker for secret
    access, process execution, file writes and network access. That list is a
    heuristic that steers attention and blocks nothing (`capabilities.ts`). The
    green "Passed / Passed" is replaced by plain Source and Ownership facts;
    pending ones are marked. The three summary tiles are a compact strip on
    phones.
  - Preview: opens with "What it touches" (each capability with scope, purpose,
    destinations, required or optional, flagged, and marked New or Changed
    against the approved version), then source and checks (source and
    ownership are now separate results, plus integrity and snapshot digests),
    install steps and requirements as readable text, screenshots as text (never
    links), communities, and the raw JSON folded away. A listing with nothing
    pending shows its live approved version instead of empty fields. The
    Quiet-Notes-style overflow at 390px is gone.
  - Decision: no preselected action; radio choices each state their effect; the
    button names the action and is red for reject, suspend and archive; a
    confirm step restates the listing, release and (for approve and publish)
    the declared access before anything is recorded; Enter in a field can no
    longer commit; the result appears inside the decision panel and names what
    was recorded; the public reason enforces the server's 10-character minimum
    in the browser; the review Hide minimum is stated. The audit trail uses
    plain action, actor and state words.
  - Persian: state, audit, placement, source and install labels, digits and
    dates, left-to-right handles and the install steps' direction.
  - **Site-wide, announced:** `globals.css` now defines `@custom-variant dark`
    so `dark:` follows the theme switch, not the OS. It had followed
    `prefers-color-scheme`, which put dark colours on the wrong ground whenever
    the two disagreed (measured 2.46:1 and 3.48:1 on the moderation status
    colours; 1.5:1 the other way). Seven files use `dark:`.
  - **Cross-lane, announced:** the API's moderation queue now returns each
    listing's declared `capabilities` (read from the stored manifest, malformed
    entries skipped), with a test. Read-only; no schema or migration change.
    Shared surfaces touched: `lib/types.ts`, `lib/i18n/` (moderation) and
    `changelog.md`.
  - Code review before push (`/code-review high`, 10 findings), all handled:
    fixed — the queue showed "Declares no permissions" for published and
    suspended listings because only the pending revision was read (it now
    falls back to the approved version, fetched only for rows without a
    pending one); a failed refresh after saving left a stale decision form
    beside "Recorded" (decisions are disabled with a retry until it
    refreshes); the reason code was rewritten on commit but not shown in the
    confirmation (normalised up front and shown); an unknown `?state=` got a
    retry that could never work and the real error was hidden (whitelisted,
    API message shown); a failed review hide said the list could not load;
    the legacy redirects dropped the query string; destinations order no
    longer reads as a change; one shared `isRecord`; the Publish slot of the
    phone tab bar is a fixed 52px so "Moderation" no longer spills into its
    neighbours. Dismissed — the queue reads each row's manifest JSON for its
    permissions (bounded by the manifest limits, 24 rows a page, and the
    approved manifest is fetched only when nothing is pending; a stored
    column is the upgrade if manifests grow); the capability parsing exists
    once in the API and once in the web app (the apps share no code today;
    each side has a test); key order in section diffs (JSONB stores a
    canonical key order for both snapshots).
  - Not done: reason codes stay free text. There is no policy list in the repo
    and inventing one is the maintainers' call. No moderation e2e exists (the
    mock API has no moderator persona); coverage is unit tests plus a browser
    pass against local data. A second-moderator or attestation rule for
    high-risk capabilities is a product decision, left open.
  - Verification: root typecheck, web lint, 287 web tests (new
    `moderation-preview.test.tsx`, rewritten queue test), 213 API tests (5
    database-dependent skips), web build, 237 browser tests (29 conditional
    skips) and all nine Lighthouse runs pass. Browser checks on local fixtures
    at 1440 and 390 in English and `/fa`, dark and light, with the
    confirmation step opened and cancelled (no decision recorded). Local
    fixtures remain in the dev database: four `critique-*-c1226@example.com`
    accounts, two submitted listings and one published listing with a review.
- **Landing hero fits the first screen (owner-requested).** From tablet width
  (`md`) and 600px viewport height up, the hero is at least
  `100svh` minus the header (`--header-chrome`, which tracks the dismissible
  announcement strip through `:has([data-announcement])`). Free height is
  shared by flex spacers: gaps grow to 48px / 80px caps, the rest centres the
  block. Under 720px of height the headline, card padding and card copy
  tighten (`fit` / `fit-short` custom variants in `globals.css`). Phones keep
  natural flow. A min-height, so content that still cannot fit (Persian at
  800×600) moves the fold instead of overlapping.
- **Product card critique fixes (owner-requested, `/impeccable critique`, 20/36).**
  - The trust strip on `ProductCard` is now a labelled `dl`: Review,
    Permissions, Licence at full weight; values wrap instead of truncating;
    undeclared permissions are a red bordered "Not declared" mark. The
    landing's `CompactProductCard` keeps its one-line compact strip.
  - One link per card: the title is stretched over the card and "View details"
    is gone (3 tab stops to 2). The article is named by its title; no lift or
    shadow on hover; "Trending" is neutral so amber only means "not reviewed".
  - RTL: the date is no longer forced `dir="ltr"` (it rendered reversed),
    rating and review count follow the locale's digits, "+N" keeps its plus in
    front, the creator badge label is localized and has `role="img"`.
  - **Copy, owner decision:** "Safety reviewed" is now "Reviewed" site-wide
    (EN and FA, filter chip, title block, OG image, landing copy). "Verified"
    stays reserved for creator identity.
  - Not done: the card stays in the live serif/rounded look (owner decision;
    `DESIGN.md` still describes the removed datasheet hero and is stale).
- **Follow-ups (not fixed here):** the seed's `license: "1 user · commercial
  use"` and `refundPolicy` (`apps/api/prisma/seed.ts:660`) break the
  free-only rule. API lane. `DESIGN.md` needs re-documenting for the current
  hero.
  - Shared surfaces: `apps/web/lib/i18n/` (catalog, home-sections,
    product-page) and `changelog.md`.
  - Verification: root typecheck, web lint, web build, 270 web unit tests,
    237 browser tests (29 conditional skips) and all nine Lighthouse runs pass.
    Browser checks at 1280×600 to 2560×1300, 390×844 and `/fa`. Environment
    notes: on Node 26 the unit tests need
    `NODE_OPTIONS=--no-experimental-webstorage` (Node's built-in
    `localStorage` shadows jsdom's; 19 failures otherwise). E2E needed
    `WEB_PORT=3200` (the Docker web container holds 3100) and
    `PW_CHANNEL=chrome` (the bumped Playwright's browser is not downloaded).
    The Persian `account-security` tab-bar test failed once and passed on
    rerun.

## 2026-10-18

- **Dashboard acquired library (DC04, owner-requested).**
  Added `/dashboard/library`, reachable through the sidebar, mobile tabs and
  overview quick actions, with a localized breadcrumb and page title. Readers
  do not need a creator role. The five-slot mobile bar reuses the existing
  accessible icon-only Publish control and keeps all navigation targets usable.
  - Extracted `SignedInAccount`'s library into shared
    `features/library/acquired-library.tsx`; `/account` retains its account,
    sign-out and authentication behavior and renders the same library as an
    embedded section. The shared view uses the dashboard's ruled, square
    vocabulary and workspace-local EN/FA copy, without global locale growth.
  - Pagination now lives in the URL, preserves unrelated parameters and works
    through history/reload. A past-end page returns to the last real page;
    stale requests are aborted/ignored. Loading, empty and error/Retry states
    remain distinct, and changing pages hides the previous page's rows.
    Pinned version labels and unavailable/legacy installation states remain
    intact. The existing installation endpoint already resolves the acquired
    release; browser checks prove the retained product link opens v1.0.0
    without an acquisition POST. No backend, schema, role or email change.
  - A 320px capture exposed an unbroken-name overflow. Explicit flex-item width
    limits and wrapping now constrain names/versions; both locales have a
    browser regression. Keyboard pagination clears the fixed tab bar.
  - Shared surface: `changelog.md` records this owner-assigned web refactor.
    Removed DC04 from the ignored local `ramtin-pending.md`; three dashboard
    capability tasks remain. The localhost email pause is still enabled.
  - Verification: root typecheck, 500 unit tests (5 database-dependent skips),
    web lint, regular production build, 237 browser tests (29 conditional
    skips; 4 Chrome workers) and all nine Lighthouse runs passed existing gates.
    Twenty-four EN/FA/theme/viewport captures at 320/768/1280px, 12 native
    keyboard/navigation hit-test journeys and four error/Retry/empty/loading
    journeys passed without overflow or page errors. The design detector found
    no issue. Manual connected-source/diff review found no unresolved issue.
    Evidence: `maintenance/dashboard-library-20261018/` (ignored), including the
    initial overflow capture. No real acquisition changed. Physical devices,
    live acquisition/provider checks, CI and native Persian wording review
    remain untested; existing tighter performance targets remain open.

- **Studio archive and restore controls (DC03, owner-requested).**
  Creators can archive eligible owned listings and restore recoverable creator
  archives through the existing lifecycle endpoint. EN/FA confirmations explain
  visibility and review-queue changes, preserve saved work/releases/acquisitions,
  and describe the exact prior state before restoration. Suspended listings have
  no archive control; staff archives and missing restore points have no creator
  restore control. Cancellation sends nothing and returns keyboard focus.
  - `apps/api/src/controllers/marketplaceCreatorController.ts` now selects the
    saved resume fields and queries the latest archive actor for archived items
    on the owner-scoped page. It exposes only a nullable restore target; actor
    identities and raw lifecycle fields remain private. The lookup is separate
    from the recent-activity window, so later non-archive events cannot hide it.
    `marketplaceLifecycleController.ts` uses the same deterministic timestamp/id
    ordering for the authoritative archive-actor check. Both backend touches are
    needed for this owner-assigned dashboard capability; no migration or role,
    moderation, source-verification or legacy-source exception was changed.
  - Shared surface: `apps/web/lib/types.ts` gains the additive owner-only restore
    target. Studio reuses one lifecycle transport/checkpoint, consumes returned
    visibility/version, refreshes listings/counts, blocks duplicate mutations and
    requires a successful refresh after conflicts. Source blockers explain the
    approved-release restriction and link to release status/staff assistance.
    Copy remains workspace-only; fixtures match the full lifecycle response.
    No deletion or publication/moderation override was added.
  - Removed DC03 from the ignored local `ramtin-pending.md`; four dashboard
    capability tasks remain. Shared `changelog.md` records the cross-lane scope.
    Restarted the owned local API to load the additive response; API/database
    health and Studio return 200. The localhost email pause remains enabled.
  - Verification: root typecheck, 488 unit tests (5 database-dependent skips),
    web lint, regular production build, 213 browser tests (29 conditional skips;
    4 local Chrome workers) and all nine Lighthouse runs passed existing gates.
    Both locales/themes at 320/768/1280px passed 44 captures, 24 native-keyboard
    hit-test/cancel journeys and four source/conflict/retry recoveries, with no
    overflow or page errors. The design detector found no issue. An initial
    English browser assertion matched both the Published badge and history;
    scoped it to the badge and reran the full suite. Failure evidence remains
    under `maintenance/dashboard-archive-20261018/` (ignored). Manual connected
    source/diff review found no unresolved issue. No real listing changed;
    live mutations/provider checks, physical devices, CI and native Persian
    wording review were not tested. Tighter performance targets remain open.

- **Studio withdrawal from review (DC02, owner-requested).**
  Connected the existing creator `WITHDRAW` lifecycle action to submitted
  listing controls. Inline EN/FA confirmation explains the return to Draft,
  preservation of saved work and continued visibility of any existing public
  version. Cancellation sends no request. Success uses the returned lifecycle
  version and refreshes listing/summary data; errors keep the saved listing,
  while stale-version/invalid-transition responses require a successful refresh.
  Duplicate actions and pagination during mutation are disabled. The disclosure
  keeps its keyboard-focused trigger, and controls clear fixed navigation.
  - Reused the Studio lifecycle transport and review checkpoint. Copy stays in
    workspace-only `workspace-copy.ts`; no new dependency or API runtime change.
    Added an API lifecycle regression test for snapshot/publication preservation
    and invalid source states; ownership, moderation, source checks and the
    localhost email-verification pause remain intact.
  - Shared surface: `changelog.md` records this owner-assigned web capability;
    the API test is touched only to pin the existing withdrawal contract.
    Removed DC02 from the ignored local `ramtin-pending.md`; five capability
    tasks remain. That local file and verification artifacts are not committed.
  - Verification: root typecheck, 464 unit tests (5 database-dependent skips),
    web lint, regular production build, 199 Chrome browser tests (29 conditional
    skips; 4 local workers) and all nine Lighthouse runs passed existing gates.
    Both locales/themes at 320/768/1280px passed 32 visual captures, 12 keyboard
    hit-test/cancellation journeys and four failure/conflict/refresh recoveries,
    with no overflow or page errors. The design detector returned no findings.
    Manual connected-source/diff review found no unresolved issue. Artifacts:
    `maintenance/dashboard-withdraw-20261018/` (ignored). Physical devices,
    live database mutations, CI and native Persian copy review were not tested;
    no real listing changed. Existing tighter performance targets remain open.

- **Dashboard capability audit and Settings account security (owner-requested).**
  Compared marketplace/reader routes with dashboard, creator, account and
  moderation callers. Recorded seven confirmed dashboard gaps in the ignored
  `ramtin-pending.md`: security, withdrawal, archive/restore, library access,
  saved listings, staff moderation access and account-wide provider controls.
  The existing `/account` library and creator/release features were explicitly
  distinguished from missing functionality. Completed DC01 and removed that
  task; the other six remain, with backend evidence and acceptance criteria.
  - Settings now reads the authenticated reader profile and supports the
    existing current-password change endpoint. It shows membership date and
    sign-in method, validates confirmation, bounds inputs, disables duplicate
    submissions, handles failure/retry and clears fields after success.
    Google-only/no-password accounts keep their backend reauthentication
    restriction; no password-setup or email-verification bypass was added.
  - Added the reader-profile type and API helpers in shared `lib/types.ts` and
    `lib/api.ts` for this owner-assigned backend-to-dashboard connection.
    Security copy is local to Settings, keeping it out of public-page chunks.
    Backend auth, roles, schemas, providers and database records are unchanged.
  - Production hit tests caught the fixed tab bar covering a keyboard-focused
    password action. New controls reserve scroll margin, and the dashboard
    temporarily uses immediate focus scrolling, restoring the prior document
    scroll preference on exit. Native-keyboard regressions cover EN/FA at the
    tablet breakpoint; the cleanup behavior has its own unit check.
  - Verification: root typecheck, 449 unit tests (5 database-dependent skips),
    web lint, regular production build and all nine Lighthouse runs passed
    existing gates. Full Chrome suite: 195 passed / 29 conditional skips with
    4 local workers and no retries. A default 10-worker attempt exhausted
    browser/server memory; concurrency was reduced only for this invocation,
    with configuration, assertions and budgets unchanged. An earlier inherited
    pagination timeout passed ten focused repetitions and the final full run.
  - Eight before captures and 20 final EN/FA, light/dark, phone/tablet/desktop
    captures were reviewed/sampled. Final checks included 12 keyboard/button
    hit-test journeys, four profile Retry journeys, no document overflow or
    page errors, and no mechanical design-detector findings. Real anonymous
    GET/PUT calls through the web proxy to the new UI's endpoints returned
    401; authenticated password flows used fixtures and no real credentials
    changed. Physical devices, real account changes and CI execution remain
    unverified. Local email pause is preserved. No push. Evidence and logs:
    `maintenance/dashboard-capabilities-20261018/`.

- **Homepage catalogue failures show Retry, without sample listings.**
  Completed the next owner-assigned shared/local pending item after reconciling
  both redesign pulls. `apps/web/app/page.tsx` now represents an unavailable
  catalogue as null: the featured shelf shows the existing localized Retry
  notice, the total link disappears, and type shortcuts omit counts. Search
  and static page content stay available. Healthy empty catalogues retain their
  separate empty state; explicit mock preview mode is preserved. Updated the
  shared EN/FA notice in `apps/web/lib/i18n/home.ts` to describe the outage.
  Removed the completed entry from `pending.md` and the ignored local checklist.
  - Five server-render regression tests cover EN/FA failure responses, healthy,
    empty and explicit mock states. Before the fix, both failure cases exposed
    three sample cards. Existing notice tests retain the Retry action check.
  - Final verification: root typecheck, 436 unit tests (5 database-dependent
    skips), web lint, regular production build, full Chrome suite at default
    10 workers (179 passed / 29 conditional skips) and all nine Lighthouse
    runs passed without budget changes. Eight runtime journeys on a non-mock
    production web build simulated a failing API and recovered through Retry;
    32 captures covered home, Explore and product in EN/FA, light/dark and
    320/1280px, with no horizontal overflow or page errors. The mechanical
    design detector returned no findings on the changed page surfaces.
  - Reviewed the final changes manually. No dependencies, database records,
    migrations or provider settings changed. Temporary test servers/Chrome
    were stopped; the real local API/web stay available and the localhost email
    pause is preserved. CI performance, physical devices and maintainer Persian
    wording review remain pending. Evidence: `maintenance/redesign-merge-20261018/`.

- **Fresh redesign pull reconciled (owner-requested second pull, `b04c5f1`).**
  Imported the newer Persian product-direction changes. Its only conflict was
  in this log; both branches' entries are preserved. No unresolved index
  conflicts remain. The combined working tree passed root typecheck, 436 unit
  tests (5 database-dependent skips), web lint, the regular production build,
  179 browser tests (29 conditional skips) and all nine final Lighthouse runs
  at existing budgets. Thirty-two EN/FA, light/dark, 320/1280px captures had no
  document overflow or page errors. The local API was restarted to load the
  new release endpoint; health returned 200 and that endpoint returned its
  expected release-specific 404 for an absent version. The local email pause
  is preserved. No push. Logs: `maintenance/redesign-merge-20261018/`.

- **Reconcile the first redesign merge (owner-requested integration).**
  Preserved redesign's product-release selection, simplified homepage and
  Explore controls, plus ramtin's declared-access filter, real pagination links,
  product HTTP status checks and temporary localhost email pause. Resolved all
  five conflicted files by combining their behavior and tests; restored the
  locale lookup needed by redesigned Explore redirects and included declared
  access in removable chips and the mobile drawer count. Both branches' prior
  changelog entries are retained. Shared API/types/i18n changes belong to the
  requested incoming redesign merge. Updated inherited browser checks to follow
  the renamed drawer action, the card reveal wrapper and the static hero
  heading now that cards sit inside the hero. Root typecheck, 431 unit tests
  (5 database-dependent skips), web lint and all workspace builds passed.
  Full Chrome suite: 179 passed / 29 conditional skips at default 10 workers.
  All nine Lighthouse runs passed existing gates. Recovery snapshot and logs:
  `maintenance/redesign-merge-20261018/`.

- **Product HTTP status correction (owner-assigned next local checklist step).**
  - Removed `apps/web/app/products/[slug]/loading.tsx`, whose early response
    committed HTTP 200 before the product lookup could report an unavailable
    listing. The page now resolves that lookup before response streaming; the
    existing localized branded not-found UI and noindex metadata still render.
    This follows [Next.js status behavior](https://nextjs.org/docs/app/api-reference/file-conventions/not-found).
    Product navigation retains the prior page while the lookup is pending.
  - Added suspended/archived unpublished entries to the isolated browser fixture
    catalogue and asserted public API exclusion, real HTML 404 status, branded
    heading, noindex, EN/FA language/direction, and absence of private fixture
    content. Successful product responses stay 200; upstream failures return
    500 with the existing Retry UI. Backend visibility and auth were not changed.
  - Verification: reproduced the prior 200 status in desktop/mobile;
    20 targeted browser checks passed; full suite at the default 10 workers
    passed 166 / 28 conditional skips, including product morph, layout and JS
    budgets. Root typecheck, 404 unit tests / 5 database-dependent skips and
    web lint and the regular production build passed. All nine Lighthouse runs
    passed existing gates. Actual localhost responses were 404/noindex in EN/FA
    and 200 for a published product; API health was 200. Eight visual captures
    across EN/FA, light/dark and 320/1280px had no overflow or page errors.
    Reviewed the final diff manually; no budget changes or new dependencies.
  - Removed the completed HTTP-status task from both pending files.
  - Shared `pending.md` and this log are in scope because the owner requested
    continuation of the mirrored local task. Earlier uncommitted work and the
    temporary localhost email pause are preserved. No commit/push. Local
    evidence: `maintenance/product-status-20261018/`.

- **Default-worker browser stability (owner-assigned next local checklist step).**
  - Removed redundant hoisted pagination head hints from
    `apps/web/app/explore/page.tsx`, which duplicated during hydration. The
    existing server-rendered Previous/Next anchors retain their `href` and
    `rel` attributes, locale, filters and client navigation. This follows
    [Google's pagination guidance](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading):
    discovery uses real anchor URLs and Google no longer uses head next/prev hints.
  - Browser regressions check first/last/back navigation, absence of stale head
    hints, and actual crawler HTML with Persian paths and permission filters.
    Current hero motion and card morphing passed ten repetitions at default
    concurrency; no production animation code or worker/retry settings changed.
  - `apps/web/e2e/dashboard-repairs.spec.ts` waits for intercepted route handlers
    before teardown; the reproduced background refresh no longer throws
    `route.fetch: Test ended`. Web ESLint ignores only generated Playwright and
    Lighthouse output directories, preventing a reproduced artifact-deletion race
    during simultaneous lint/browser runs; source rules remain enforced.
  - Removed the completed entry from both `ramtin-pending.md` and `pending.md`.
    These shared checklist/log edits are authorized by the owner's continuation
    request. Preserved the prior uncommitted work and temporary local email pause.
  - Verification: focused stress run 90 passed / 10 conditional skips across ten
    repetitions; complete suite twice, 308 passed / 56 conditional skips with
    the default 10 workers and zero retries. Root typecheck, 404 unit tests
    passed / 5 database-dependent skips, web lint and the root production build
    passed. Actual localhost Explore navigation passed with zero pagination head
    hints; API health returned 200. Only the regular API/web processes remain.
    Lighthouse was not rerun: production changes are confined to Explore
    metadata, with no home/dashboard/product render or style changes.
    No usage meter available;
    manual second-pass review. No commit/push while the inherited dirty work
    remains uncommitted. Evidence: `maintenance/browser-stability-20261018/`.

- **Owner follow-up: pause local email verification and continue the pending repairs.**
  - Enabled the existing loopback-only `LOCAL_AUTO_VERIFY_EMAIL` switch in the
    ignored API configuration until a sending domain is ready. Existing sessions
    skip the gate without changing their stored verification timestamps; new
    local signup keeps the existing auto-verification behavior. Password/session
    authentication and creator/moderator role checks still apply. Restore the
    flag to false and restart the API before real-email acceptance.
  - Signup redirects from the API verification result. Accepted sessions visiting
    the verification page go to the dashboard without displaying the inbox box.
    Token verification and resend behavior remain covered when the switch is off.
  - Added the deferred Explore declared-access filter for all 12 manifest
    capabilities, with EN/FA labels, URL persistence, pagination/reset handling
    and mobile controls. The API validates canonical keys and matches only the
    approved listing snapshot's release permissions, including optional access.
    Legacy listings without declarations are excluded from capability matches.
  - Fixed the process step list's minimum width (343px document at a 320px
    viewport before the fix); added 320px EN/FA browser coverage. English first
    paint now preloads Geist only; the Newsreader face remains available in CSS.
    Catalogue text matching escapes SQL wildcard and escape characters across
    public metadata while relevance ranking retains the literal search terms.
  - Removed each verified task from `ramtin-pending.md`; reconciled the three
    shared bug entries in `pending.md`. These API/search edits and shared
    `apps/web/lib/api.ts`, `apps/web/lib/types.ts`, `pending.md`, and this log
    are explicitly assigned by the owner's request to continue the local list.
  - Verification: root typecheck, 404 unit tests passed / 5 database-dependent
    skips, web lint, root production build, and Chrome e2e 152 passed / 28
    conditional skips with 2 workers, including unchanged JS budgets. Real
    PostgreSQL checks confirmed literal %, underscore and backslash matching
    for browse/relevance, exclusion of undeclared legacy releases, and local
    session/signup behavior without email delivery. Synthetic fixtures were
    removed; snapshot audit protection was checked enabled after cleanup.
    All nine Lighthouse runs passed existing gates (home/dashboard/detail
    performance 93/91/92, accessibility 100 throughout; dashboard CLS 0.0206).
    Eight Explore theme/locale/viewport captures and four 320px homepage captures
    have no document overflow or uncaught page errors; visual inspection passed.
    Rebuilt the regular bundle with the real API, restarted the API and web dev
    server, and verified an actual unverified local browser session leaves the
    inbox page for the dashboard without changing its stored timestamp. Home,
    API health and all 19 referenced JS assets return 200. Fixture/Chrome
    processes were stopped; only the regular local stack remains.
  - Existing uncommitted work is preserved. No commit or push; real email,
    Google, physical devices, maintainer wording review and other open backlog
    items remain pending. Local evidence: `maintenance/email-pause-20261018/`.

- **Dashboard repair phase (D00?D23, `ramtin`, owner-assigned local checklist).**
  - Continued the existing creator submission edits: review checkpoint, current
    lifecycle version, source/conflict recovery and in-review feedback; creators
    only submit for moderation. New-listing copy no longer promises publication.
  - Editor actions clear mobile tabs and safe areas. Internal links and Cancel
    prompt before discarding dirty input; full-page exits retain the unload guard.
    Load failures have context, Retry and Back. Labelled declaration rows replace
    pipe syntax, retain literal punctuation and serialize the existing manifest.
    Section links, required-field hints and a declarations preview aid review.
  - Settings separates loading, absent profile and failure, offers retry and a
    profile-editor link that waits for listing layout to settle. Latin identity
    and rating fractions are isolated in Persian. Verification identifies the
    account and offers sign-out; authentication requirements remain intact.
  - Mobile search, shorter breadcrumbs, larger account targets, compact studio
    metrics, readable listing names, shared lifecycle styles, KPI context and
    content-sized overview panels address the remaining dashboard review items.
    Provider token help links official GitHub/npm docs; source failures give
    correction/retry instructions with diagnostic codes kept secondary.
  - Recorded the dashboard Operate brief before migrating its surfaces to the
    existing Datasheet language. Kept workspace-only translation payloads out of
    public catalog bundles; all original creator keys are retained in EN/FA.
    No dependencies, database schema, provider credentials or auth bypass added.
  - Verification: root typecheck; 396 unit tests passed / 5 database-dependent
    skips; web lint; root production build and final fixture web build; full
    Chrome e2e 147 passed / 27 conditional skips with 2 workers, including JS
    budgets. Thirty fresh EN/FA, theme and viewport captures have no document
    overflow or uncaught page errors. Editor hit tests also cover 375x350 and
    landscape, and browser tests exercise all nine listing-type field groups.
    Final dashboard/budget checks passed 38 / 18 skips. All nine Lighthouse
    runs passed existing gates; dashboard CLS 0.0206, performance 90 and
    accessibility 100. The first run exposed metric-placeholder height drift
    (CLS 0.072); reserved matching label/context space and verified the repair.
    No budgets were raised. Detector findings are confined to
    existing global font/token rules; the pinned fonts were retained.
  - Shared surfaces: `apps/web/lib/i18n/creator.ts`,
    `apps/web/lib/i18n/dashboard.ts`, `changelog.md`; retained the pre-existing
    `apps/web/lib/api.ts` request export used by the submission helper. Other
    initial dirty/untracked files were preserved. Manual second-pass diff review;
    no usage meter available. Changes remain uncommitted because the initial
    submission/helper edits were already uncommitted and their ownership has not
    been confirmed; no other agent's changes were staged or pushed.
  - Removed completed local checklist entries as verified. Commented out the
    owner's deferred signup/login verification-code and live-email phase until
    an email service is available. Real providers/devices, browser 200% zoom,
    assistive technology and maintainer review of Persian copy remain open.
    Rebuilt the regular local web bundle after fixture testing; main page and
    all 19 referenced JS assets returned 200, as did `/api/health` and the type
    registry. Temporary fixture servers and the disposable Chrome were stopped.
    Local evidence: `maintenance/dashboard-repairs-20261018/` (ignored).

## 2026-10-17

- Recorded a dashboard visual/usability review in the ignored local
  `ramtin-pending.md`, with prioritized tasks, reproduction steps and local
  screenshots. Covered English/Persian, light/dark and desktop/tablet/mobile
  layouts using the existing Chrome/Playwright fixture setup. Deferred live
  email/Google verification until the owner resumes after acquiring a domain.
  No application code changed; local checklist/evidence were not committed
  or pushed.

- Created the owner's local-only `ramtin-pending.md` checklist, with live email
  and Google verification first, current session follow-ups, and a complete
  snapshot of the open shared backlog. Added its root path to `.gitignore`;
  verified it is ignored and untracked. No runtime code changed or tests needed.
  These checklist/ignore changes were not committed or pushed, at owner request.

- **Google sign-in wiring and final auth verification (`ramtin`, requested by owner).**
  - The main site's account page previously had no Google client despite the
    shared API supporting it. Added the official GIS button, credential POST,
    the existing session refresh and safe local return path, and visible SDK/API
    failures. Google signup uses the verified Google identity directly.
  - Both Next.js builds accept the API's `GOOGLE_CLIENT_ID` and expose only that
    public ID to the browser. Kept the existing `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
    frontend fallback. Passed the public ID into the web Docker build, matching
    the existing blog setup. Added no dependency or secret to tracked files.
  - Blog Google initialization now uses Next Script `onReady`, which runs again
    on remount with a cached SDK; added SDK failure feedback, localized button
    rendering and a width bounded by the account form. Its new Persian error
    text was written by the assistant and awaits maintainer review.
  - Added main account/API/SDK and blog handoff regression tests. Verified root
    typecheck, 384 unit tests, web lint, root production build, Docker Compose
    config, web e2e 122 passed / 16 conditional skips with 2 workers and budgets.
    No API/database logic changed in this phase; the previous 5 real PostgreSQL
    journeys remain the database evidence.
  - The Windows Lighthouse cleanup issue is avoided by first launching a
    dedicated headless Chrome with a disposable profile under ignored
    `maintenance/lhci-chrome` and loopback debugging port 9223, then running
    `npm run lhci -w apps/web -- --collect.settings.port=9223`. This reuses the
    already-running test browser instead of Chrome Launcher's failing temporary
    profile cleanup. All 9 runs and the existing assertions passed, and passed
    again against the final rebuilt app; no budgets or security settings were
    weakened. The owner explicitly requested pushing all accumulated `ramtin`
    changes while the account setup requirements were being checked.
  - Live provider verification remains blocked: no process/user/machine
    Cloudflare credentials, usable sender configuration, or Google client ID;
    no connected browser session for account setup; no authorized test mailbox
    supplied. Asked the owner for the sending domain, Google project and mailbox.
    Do not treat the mocked SDK/provider tests as real inbox or Google sign-in
    proof. The email guide documents the exact configuration and live checks.
  - Shared surface: `apps/web/lib/api.ts`, `changelog.md`. Cross-lane blog auth
    files changed because the owner's request explicitly covers Google login.
    Reviewed the final diff manually; no usage meter available.

- **Authentication and email verification review (`ramtin`, API and account UI).**
  - Fetched the remote references: local `ramtin` contains `origin/main` and
    `origin/v.2` (22 and 31 commits ahead respectively); no additional merge needed.
  - Existing Cloudflare verification/reset delivery retained. Fixed the Windows
    email-worker entry point, verification resend after the 60-second cooldown,
    password loss when a verified password account links Google, off-site login
    return URLs, and favorites failures incorrectly clearing a successful session.
  - Returning unverified readers can open verification from their account;
    the dashboard shows verification before mounting creator pages. Removed the
    corresponding pending dashboard item. Reused existing copy/components.
  - Added database-backed reader lifecycle tests to the existing CI integration
    job, browser signup/verification/reset tests, and regressions for Google,
    worker startup, delivery errors/retry exhaustion, return URLs and session state.
    Isolated the API tests' login rate-limit keys between cases.
  - Verification: root typecheck; 376 unit tests; 5 real PostgreSQL integration
    tests; web lint; root production build; web e2e 122 passed / 16 conditional
    skips with 2 workers, including JS budgets. Default-worker e2e reproduced
    the already-recorded duplicate catalogue `rel=next` failure; the new browser
    fixture's missing favorites response was fixed before the passing rerun.
    Lighthouse attempted but failed before assertions with the existing Windows
    Chrome temporary-profile EPERM. No performance budgets changed.
  - Synced installed dependencies to the pulled lockfile and regenerated Prisma;
    no dependency or lockfile change shipped. Restarted the local API/web servers.
  - Local `blog_db` had an unresolved failed `202609240001` migration and two
    pending migrations. Backed it up to
    `D:\coding\Projects\TermSpace\backups\termspace-before-auth-20261017.dump`,
    restored to a fresh disposable database, preserved the single legacy creator
    owner in `ownerUserId`, cleared the redundant `userId`, marked the failed
    migration rolled back and deployed all three migrations. Verified account
    credentials/verification state, creator owners and content/order/review/role
    counts against the original before repeating on the local database. No email
    verification state or role grants changed. The legacy owner must verify their
    email before an operator grants their creator role; do not bypass that gate.
    The one-off assert-guarded script is in ignored
    `maintenance/auth-database-recovery.mjs`; backup restoration is the down path.
  - Remaining setup: Cloudflare account/token and Google client ID are absent;
    real inbox delivery and live Google OAuth are unverified. Use a real signing
    secret shared by API and worker in Windows user env; see the updated email
    guide. No email provider credentials or secrets were written by this change.
  - Shared surfaces: `changelog.md`, `pending.md` (authorized auth follow-up from
    the other lane). Reviewed the final diff manually; no usage meter available.
- **Product page polished (branch `redesign`, `apps/web` presentation lane).** Final pass over the product-page sequence of 2026-10-17/18 (harden, layout, clarify, distill, adapt), made by reading the finished page in English and Persian at 1440 and 375 px and with an earlier version selected. Three defects found and fixed, all in right-to-left rendering: in the key-facts list an English value (platforms, permissions, licence) jumped to the far side of its row, away from its label, because the whole value resolved its own alignment (values are now isolated with `<bdi>` and stay at the start edge); the "Models" line under Platforms inherited the English direction (models are now their own "Models" row); and a version's release note written in English ended up with its full stop at the start (the note now resolves its own direction). English at both sizes and the earlier-version state needed no change. **Critique `2026-10-17T19-24-46Z__app-products-slug-page-tsx.md` is not closed:** its P0 (version picker), both P1s (platform on the first screen, the no-release state) and the first P2 (trust stated four times at the smallest type) are done; the second P2, moving the page to the Datasheet skin, was replaced at the maintainer's request by a simpler layout, so the Datasheet question stays open (see the layout entry). Verified: root typecheck; web lint; web unit tests 177/177; e2e catalog, targets, persian, landing, seo and budget 97 passed, 13 skipped, 0 failed; screenshots read for English desktop, an earlier version, Persian desktop and English phone; not run: `npm run lhci -w apps/web`, and the `apps/api` suite's one existing failure (`registers a password account with an atomic verification outbox record`) is unchanged.

- **Product page adapted: skip link, phone targets, Persian direction, strings moved (branch `redesign`, `apps/web` presentation lane; touches `lib/i18n/`).** From the 2026-10-17 critique of `/products/[slug]` (P2, adapt; step 6 of the product-page sequence). A skip link ("Skip to content" / "رفتن به محتوا", new `components/layout/skip-link.tsx`) is now the first stop on the page and lands on `<main id="content">`; other pages can adopt it. On a phone the tappable controls are 44 px tall: the logo link (`components/layout/logo.tsx`, every page), the version select, the provenance Copy button (`components/patterns/copy-block.tsx`) and the breadcrumb link. Creator-written text (facts values, benefits, use cases, included files, example output, creator bio, review text) now carries `ts-bidi`, so English text in a Persian page, or a value that starts with a digit such as "1 user · commercial use", resolves its own direction instead of inheriting the page's. The page's own string table moved out of `page.tsx` into `lib/i18n/product-page.ts` (server-only, outside the client dictionary, so no JavaScript cost); the strings themselves are unchanged. The 24 px target test (`e2e/targets.spec.ts`) now skips visually hidden (`sr-only`) controls, which grow to full size on focus. **Shared surfaces touched:** `lib/i18n/` (new file only), `changelog.md`. **Not changed, recorded:** the announcement bar's link (32 px) and dismiss button (24 px) and the header's "Explore" link on a phone are below 44 px; the bar's height is animated, so it needs its own pass. The related-listing card titles in Persian measure 43 px (shared `ProductCard`). Footer links are 44 px tall but about 38 px wide. Verified: root typecheck; web lint; web unit tests 177/177 (new: creator values keep their direction); e2e catalog, targets, persian, landing, seo and budget 97 passed, 13 skipped, 0 failed (new: skip link is the first stop, phone controls at least 44 px tall); Persian page read in the browser (rtl, skip link, content anchor, plaintext bidi on the facts); not run: `npm run lhci -w apps/web`.

- **Product page distilled: each fact stated once (branch `redesign`, `apps/web` presentation lane).** From the 2026-10-17 critique of `/products/[slug]` (P2, typeset and distill; step 5 of the product-page sequence). The key-facts list is now the one place a listing's platform, review state, permissions, licence, release, pinned ref and digest appear. The "Manifest" table, which repeated all of them, is now "Details" and lists only what the facts do not say (requirements, updated, package size, update policy); "Source & provenance" no longer repeats the release, ref, digest and licence and keeps the source link, the last source check (now "Check passed" rather than a second "Verified"), the per-permission purpose, scope and destinations, environment variables and the fetch commands; the "Works with" section, which repeated the platform row, is gone. The rounded-card styling of the details, provenance permissions and creator block gives way to hairline rows. The old trust chips (9 and 11 px text) were already unused and are deleted with the manifest table (`components/catalog/trust-chip.tsx`, `manifest-table.tsx`). Header meta uses tabular numerals and the description keeps a 42rem measure; nothing in the product page's own content is under 12 px. **Not changed, recorded:** the related-listing cards (shared `ProductCard`, also used by explore) still set a few labels under 12 px ("Editor’s pick", platform names, the date). The anchors `#manifest`, `#provenance`, `#reviews` became `#details`, `#provenance`, `#reviews`. New Persian strings (details labels, "Check passed") await review. Verified: root typecheck; web lint; web unit tests 176/176 (new: release facts for an earlier release, current-release summaries, undeclared rows, Persian); e2e catalog, targets, persian, landing, seo and budget 93 passed, 13 skipped, 0 failed; section list and font sizes read in the browser on the dev server; not run: `npm run lhci -w apps/web`.

- **Product page copy clarified (branch `redesign`, `apps/web` presentation lane).** From the 2026-10-17 critique of `/products/[slug]` (P1/P2, clarify; step 4 of the product-page sequence). A listing with no approved release no longer shows a disabled purple button reading "No approved release is available yet."; it shows a status note ("No release to add yet. The creator hasn’t published an approved release. You can still preview this listing and save it.") above the working Preview and Save buttons. A failed add now names its reason instead of one generic retry line: the release is no longer available, it is already in the library, the session ended (sign in again), too many requests, or a connection problem. A signed-out visitor is told what signing in is for ("Sign in to add or save this listing.") before they click. The review row says "Safety reviewed" (Persian "ایمنی بررسی‌شده"), the term the explore cards use, instead of "Verified", which the creator badge also uses for a different claim. "1 resources" is singular, the reviews heading carries the review count ("Reviews (184)") instead of a bare rating, the preview excerpt label no longer claims "SKILL.md" for every listing type, and the footnote that repeated the licence under the buttons is gone. **Not changed, recorded:** the related-listing cards' trust strip (shared with explore, `product-parts.tsx` `TrustStrip`) still reads "Licence: Licence not stated" and "Permissions: Permissions not declared" to a screen reader; the seeded dev listing `research-brief-generator` is "Safety reviewed" while having no approved release, which is data, not copy. New Persian strings await review. Verified: root typecheck; web lint; web unit tests 172/172 (new: no-release note, five failure reasons, signed-out note); e2e catalog, targets, persian, landing, seo and budget 93 passed, 13 skipped, 0 failed; the no-release state read in the browser on the dev server; not run: `npm run lhci -w apps/web`.

- **Product page laid out around its facts (branch `redesign`, `apps/web` presentation lane).** From the 2026-10-17 critique of `/products/[slug]` (P1, layout; step 3 of the product-page sequence). The first screen now answers "does it work on my platform and can I trust it" before the long page: a plain header (name, outcome, type, creator, rating, uses), then one quiet list of key facts (platforms, safety review, permissions, licence, release, pinned ref, digest) with hairlines only; whatever a listing leaves undeclared is printed in red ("Not declared", "Not provided by the source"). The release rows (permissions, licence, release, ref, digest) follow the version picked in the rail, so they describe exactly what "Add" will pin; any other release loads on demand, so the page stays inside its first-load budget. The add controls are a bare column (version, Add, Preview, Save) that is sticky from lg, and below lg they follow the header directly so Add sits inside the first screen at 375 px (about y 635 of 812). Sections lose their numbers, frames and shaded bands; related listings lose the "Keep building" kicker, the white example-output card and the coloured left-border use-case cells. A first attempt in the boxed Datasheet treatment (framed title block, numbered sections, ruled bands) was built and then dropped at the maintainer's request in favour of this simpler layout; `DESIGN.md` is unchanged, so the product page does not follow the Datasheet frame and that choice is open. **Still to do (steps 4 to 7):** the Manifest and Source & provenance sections still repeat the facts list and keep their older rounded-card style; copy ("Verified" versus the creator badge, "1 resources", the hard-coded "Excerpt · SKILL.md"), type sizes under 12 px, Persian bidi and the 18 px footer links are untouched. New Persian strings (title-block and release-facts labels) await review. Verified: root typecheck; web lint; web unit tests 167/167; e2e catalog, targets, persian, landing, seo and budget 93 passed, 13 skipped, 0 failed; screenshots read at 1440 and 375; not run: `npm run lhci -w apps/web`.

## 2026-10-17

- **Product page hardened: the version picker now controls what "Add" installs (branch `redesign`; touches `apps/api` and shared surfaces).** From the 2026-10-17 critique of `/products/[slug]` (P0, harden). Before, the picker only swapped the "What changed" text and `acquireProduct` sent no release, so a reader who inspected v2.3.0 and pressed Add received whatever the API treated as current. Now: `GET /api/marketplace/products/:slug/releases/:version` returns the public facts of one published release (source, ref, digest, permissions, licence, `current`; never the creator's installation steps); `POST .../acquire` takes an optional `{ version }`, validated by `marketplaceAcquireSchema`, and pins that release only if it is published, source-verified or stale, and on a trusted host (the same gates as the approved one). Naming a different release than the one a reader already holds answers 409 `ALREADY_IN_LIBRARY`; replaying a key with another version is 409 `IDEMPOTENCY_CONFLICT`; no body keeps the old behaviour. The page keeps the selected version in one context shared by the picker, the "Add vX to library" button and the provenance section, so the facts a reader reads and the release the button sends are the same one; the page's own release is used as rendered, any other loads its facts and the button stays disabled until they arrive or says it could not load them. The Preview and installation dialogs and the other-release view are now loaded on demand, which keeps the page inside its 195 kB first-load budget. **Shared surfaces touched:** `apps/api/src/validation/schemas.ts`, `apps/web/lib/api.ts`, `apps/web/lib/types.ts` (`ProductRelease.current`); no schema change and no migration. **Not changed, recorded for the other maintainer:** a published release can still be added after the fact; there is no per-release withdrawal (a security-pulled old version stays addable while its source checks pass), and the page's current release (newest published) and acquire's default (the approved snapshot's) are still chosen by different rules. The page now always sends the version it shows, so a reader is not affected, but old clients still use the default. Verified: root typecheck; web lint; web unit tests 167/167; API tests 188 pass (new: pinning the named release, refusing unpublished or untrusted versions, held-release conflict, replayed key, malformed bodies, the release endpoint and its 404s) and the same single failure as before this change (`registers a password account with an atomic verification outbox record`); e2e catalog, targets, persian, landing, seo and budget 93 passed, 13 skipped, 0 failed, product page within the 195 kB gate; not run: `npm run lhci -w apps/web`.

- **Explore polished (branch `redesign`, `apps/web` presentation lane).** Final pass over the explore work of this session, from the 2026-10-17 critique. The phone results bar stays on one row when the Filters badge appears (the platform select shrinks instead of the row wrapping). An empty result shows each active filter once, in the empty state, instead of repeating the chip row above it. The type strip is a group of toggle buttons with `aria-pressed`, not `role=tab` without a panel or arrow-key behaviour (the catalog e2e follows). The result count uses Persian digits on the Persian page ("۱۲ منبع"). Checked by eye on desktop, 768px and 375px, in English and Persian, with a filtered result and an empty one; no console errors. The critique snapshot is left open: its P1 card trust block, P2 datasheet migration and P3 first-screen items are not done, and the facet-count work was reverted at the owner's request. Verified: root typecheck (web), web lint, 163 web tests, e2e catalog + targets + persian + landing + budget (74 passed, 8 skipped). Not run: lhci and the `apps/api` suite (no API change).

- **Explore copy clarified (branch `redesign`, `apps/web` presentation lane).** From the 2026-10-17 critique (P2, clarify). The filter that keeps only reviewed listings is now "Safety reviewed only" (Persian "فقط ایمنی بررسی‌شده"), the name the cards use, instead of "Verified only", which read like the creator-identity badge; PRODUCT.md says those are different claims. The facet previously called "Compatibility" is "Platform" ("پلتفرم"), matching PRODUCT.md; the i18n key stays `compatibility`. One result reads "1 resource" (new `discovery.product`), and the drawer button reads "Show results ({count})" so it is right for one. Card dates are labelled "Updated Oct 17" (new `productCard.updated`). The search placeholder is "Search resources or creators…" (Persian "جست‌وجوی منابع یا سازندگان…"), which no longer truncates at 375px. i18n is a shared surface. Not changed, and why: no document defines what a safety review covers, so there is no help text explaining it (needs the owner to say what it asserts); "resources" versus the PRODUCT.md term "listing" is a voice decision for the owner, so the UI still says resources; the repeated title and "View details" links on each card are unchanged. Verified: root typecheck (web), web lint, 163 web tests (1 new), e2e catalog + targets + persian + landing + budget (74 passed, 8 skipped). Not run: lhci and the `apps/api` suite (no API change).

- **Explore hardened: removable filters, honest errors, safe empty state (branch `redesign`, `apps/web` presentation lane).** From the 2026-10-17 critique (P2, harden). Active-filter chips are buttons that remove only their own filter (accessible name "Remove filter: X"), the "Verified" chip is localised (it reuses "Verified only"), and the empty state offers the same per-filter removal; "Clear all" shows only when there is a search or a filter to clear. The empty-state search text is built without `String.replace`, so a query like `## 2026-10-17

` prints literally, and it sits in `<bdi>` so Latin text keeps its direction on the Persian page and a long query wraps. The server page now tells failures apart: a 400 (a link with a filter the API rejects, such as an unknown `?type=`) redirects to the same search without the other params instead of claiming the library is unreachable, a 429 shows the existing rate-limit message, and a `?page=` past the end redirects to the last page. Retry is disabled while it reloads. The grid/list choice is remembered per device (`localStorage` through `useStoredString`). i18n is a shared surface: added `discovery.removeFilter`, removed the unused `heroIntro` and `datasheet.findLabel` strings, which also keeps the product page inside its 195 kB first-load budget (it measured 195.05 kB before this change). Not done: the "drop this filter, get N results" counts (needs API facet counts, which were reverted) and the submit-a-tool link. Community pages share the component but not the page-range redirect. Verified: root typecheck (web), web lint, 162 web tests (4 new), e2e catalog + targets + persian + landing + budget (72 passed, 8 skipped), with the mock API now returning 400 for an unknown type like the real one. Not run: lhci and the `apps/api` suite (no API change).

- **Explore on phones: platform in the bar, first card at y=463, 44px targets (branch `redesign`, `apps/web` presentation lane).** From the 2026-10-17 critique (P1, mobile). Below `lg` the results bar now holds a "Compatibility" select (the platform facet) next to Filters, so platform no longer hides behind the drawer; the sidebar copy stays for `lg`, and the drawer drops it. Below `sm` the grid/list toggle is hidden (both render one column there) and Sort moves into the drawer, which makes the bar one 69px row instead of two. The generic marketplace intro is hidden on phones (community pages keep their own description), and the hero, search, tabs and bar spacing tighten. Filters badge now counts only what the drawer holds. Targets: type tabs, Filters, card title, "View details", drawer radios and the verified switch reach 44px on phones; footer links go from 18px to 44px (still inline text from `md`). On a 375px viewport the first card moved from y=726 to y=463 and targets under 44px fell from 50 to 5 (the header announcement and logo links, the footer logo, and the 38px-wide "About" link; the header is shared and was left alone). No new i18n strings: two added keys pushed the product page 0.1 kB over its 195 kB budget, so the select reuses the existing label. Verified: root typecheck, web lint, 158 web tests (one new for the bar/drawer split), e2e catalog + targets + persian + landing + budget (66 passed, 8 skipped). Not run: lhci, and the `apps/api` suite (no API change; one API test was already failing at the previous push). A tablet (768px) and desktop screenshot check showed no regression.

- **Home: hero title matches the other pages' titles (same branch).** The h1
  drops its own scale (bold sans, clamp up to 3.2rem) for the shared `editorial`
  title style: `text-4xl sm:text-5xl`, regular-weight serif, the same as the
  explore, communities and dashboard titles. The `.ts-hero-title` Persian rule
  is removed (the shared `.editorial` Persian rule covers it); the Persian
  display-type e2e drops its English-vs-Persian size comparison, which was only
  true of the old hero title.
- **Explore: header centered (same branch).** In
  `features/discovery/discovery-experience.tsx` the eyebrow, title, intro, search
  field and type tabs are centered (the tab strip is `w-fit max-w-full`, so it
  centers when it fits and still scrolls from its first tab when it does not).
  Community pages share this component and are centered too. The catalog e2e's
  featured-card locator now uses the labelled region, which my hero change had
  made ambiguous (two nested `section`s matched).
- **Home: hero intro paragraph removed, minimal search (same branch,
  follow-up).** The headline stays; the paragraph under it ("Prompts, skills,
  agents and MCP servers built by...") is gone to free vertical space. The hero
  search is a plain pill: no "Find a listing" label cell, a hairline border, a
  round icon-only submit (still labelled "Search" for assistive tech). The
  `label` prop on `ConsoleSearch` is removed. `heroIntro` and `findLabel`
  are now unused i18n strings (shared surface, left for a cleanup pass). A
  headline-removed variant was built and reverted in the same session.
  Verified: typecheck, lint, 157 web tests, e2e landing + persian + budget.
- **Home: landing content centered (same branch, follow-up).** Hero headline,
  intro, search (max-w-3xl), type chips and featured title center; "View all"
  moves under the cards. Process title, trust section (now stacked: centered
  copy and quote above three cards) and the newsletter CTA (stacked, centered)
  follow. Card text and the pinned process steps stay start-aligned.
  `console-search.tsx` chips row centers in the hero variant. Verified: root
  typecheck, lint, 157 web tests, e2e landing + persian + budget (27 passed);
  checked by geometry in the browser at 1440x800 (hero ends at 796).
- **Home: featured shelf moves into the first screen; datasheet, "Browse the
  library" and "Featured creators" removed (branch `redesign`, `apps/web`
  presentation lane).**
  - `app/page.tsx`, `components/hero/hero.tsx`: the hero is now headline,
    search, and the three featured listings directly under it (`Hero` takes
    `children`). Verified at 1440x800: cards end at y=736 (en) / 756 (fa, RTL),
    so search and shelf share the first screen. The removed sections took their
    dead code with them: `components/hero/datasheet.tsx` (also the title block
    beside the headline, which described the example listing), and
    `components/sections/browse.tsx` with its test.
  - `components/marketplace/compact-product-card.tsx` (new): a hero-scale
    card (type, name, promise, safety line, creator, rating). Permissions,
    compatibility, communities and usage stay on the full card and the detail
    page. It is its own file because adding a variant to `ProductCard` pushed
    the product page to 195.1 kB against its 195 kB budget. `TrustStrip` gained
    an optional `compact` prop; `ProductGridSkeleton` a matching `compact`.
  - `footer.tsx`: "Collections" and "Creator guide" pointed at the removed
    `/#collections` and `/#creators` anchors. They now go to `/communities`
    and `/design-system` (where the old tile's Creator guide button went).
  - e2e: removed the datasheet test and the datasheet half of the Persian-digits
    test; added a first-screen test (shelf bottom < 800 at 1440x800); the
    featured locator is now the labelled region.
  - Verified: root typecheck, `npm run lint -w apps/web`, 157 web tests, e2e
    landing + persian + budget (27 passed, 7 skipped; `PW_CHANNEL=chrome`
    because the Playwright browser is not installed here). `lhci` not run.
  - Left in place: the now-unused i18n strings (`homePage.browse*`, shelves,
    `creatorsEyebrow`/`featuredCreators`, datasheet body copy) and
    `CategoryGridSkeleton`/`CreatorGridSkeleton`, in the shared i18n surface.
    Worth a cleanup pass.

- **Navbar: account menu, icon-only language switch, centered links (branch
  `redesign`, `apps/web` presentation lane).**
  - `components/layout/account-menu.tsx` (new) and `header.tsx`: a signed-in
    reader no longer sees their email as the profile button. It is a round user
    icon beside the theme and language buttons; it opens a panel with the email
    as a muted label, then Profile (`/account`), Dashboard (`/dashboard`) and
    Sign out. Dashboard is gone from the nav links. A signed-out visitor still
    sees "Sign in". The panel is a disclosure (button with `aria-expanded`),
    closed by Escape, an outside click or focus leaving it; Escape returns focus
    to the button. The mobile menu lists the same three items.
  - The language switch is icon-only; the language name is its accessible name
    and `title`. The mobile menu keeps the text label.
  - Explore, Share your work and Moderation are centered in the bar with a
    three-column grid, so they stay centered whatever the logo and actions
    measure.
  - New i18n key `profile` in `lib/i18n/common.ts` (en, fa). **The Persian
    "پروفایل" was written by the assistant and awaits review.**
  - A Radix dropdown-menu was tried first and removed: it added about 25 kB gz
    to every page and broke the first-load JS budget (`/` 209.6 kB against 184,
    product page 211.7 against 195). The disclosure costs 0.2 kB or less.
  - Tests: `header.test.tsx` covers the visitor and signed-in states, no
    Dashboard in the nav, the three menu items, sign out, Escape with focus
    return, outside click, and the icon-only language link. `e2e/dashboard.spec.ts`
    now expects 2 nav links for a signed-in creator, not 3.
  - Verified: root `typecheck`, `npm test -w apps/web` (160), `npm run lint -w
    apps/web`, root `build`, `npm run e2e -w apps/web` (118 passed, 16
    skipped, including the first-load JS budgets), and by eye in the browser in
    English, Persian (RTL) and at 375px. **Not verified:** `npm run lhci -w
    apps/web` could not complete on this Windows machine (Lighthouse fails with
    EPERM deleting its temporary Chrome profile, before any assertion runs; same
    result with the temp directory moved). Run it in CI.
  - Follow-ups: under load, e2e catalog tests that click before hydration
    (`a filter changes the URL`, `clicking a featured card morphs`, `pages are
    real links`) failed intermittently with other dev servers running; they pass
    on a quiet run.

## 2026-10-16

- **Landing hero rebuilt as a component datasheet (branch `redesign`,
  `apps/web` presentation lane at the maintainer's request).** Direction chosen
  by the maintainer from the decision round: The Datasheet, with the site's
  existing Geist, Geist Mono and Estedad (no new font files). Contract in
  `.impeccable/surfaces/app-page-tsx.md`.
  - `components/hero/hero.tsx` (now a server component) and new
    `components/hero/datasheet.tsx`: headline and subcopy, a title block (from
    `lg`), the search with a "Find a listing" cell and a quiet "Browse by type"
    line, and one synthetic example listing set as a part: features, an Absolute
    Maximum Ratings table (undeclared rows marked in red, not omitted), a plain
    SVG pin diagram, ordering information with the pinned release and install
    command, and a footer. Labelled "Example listing" in three places. Static
    markup, no animation, readable without JavaScript.
  - Removed: the nebula, the WebGL plasma field, the typed manifest card, the
    platform ticker, the 3D stage, the scroll-progress hook, the pointer store
    and their CSS, tests and copy keys (`components/hero/*` old files,
    `components/motion/marquee.tsx`, `lib/pointer.ts`,
    `lib/hooks/use-scroll-progress.ts`). "Share your work" left the hero
    (it stays in the header). `docs/motion.md` rewritten to match.
  - Copy: the sheet's text is in `lib/i18n/home-sections.ts` (server-only, so it
    costs the page no JavaScript), English and Persian. **The Persian text was
    written by the assistant and awaits the maintainer's review.**
  - `components/sections/console-search.tsx`: the hero variant is a ruled,
    square field with a visible label cell and underlined type shortcuts (counts
    now use the locale's digits); search behaviour is unchanged, including the
    placeholder that types through example intents (the hero's own visuals do
    not animate, the placeholder is search behaviour; say if you want it
    static).
  - Accent: the sketch's blue became the site's existing primary violet (Search
    and the table header rule) until the system-wide recolour; red marks "not
    declared"; green stays reserved for review state (the hero prints "Reviewed"
    in ink, so it uses none).
  - Finish review (fresh reviewer): disposition fix, seven items, all applied:
    Persian part-header alignment, an "example" mark on the title block, one
    block per headline sentence, square search grammar, Persian digits for
    counts, light-theme capture, and a corrected seed line in the brief (the
    roll printed no reference; the owner's pick overrode it).
  - Measured: home first-load JS 181.0 KiB (was 186.9), gate lowered from 190 to
    184; Lighthouse mobile (mock) perf 0.93, a11y 1.0, CLS 0, TBT 20 to 30 ms
    (was 40); simulated LCP unchanged at 3.2 s (see `pending.md`).
  - Verification: typecheck, lint, 157 unit tests, full e2e 118 passed and 16
    skipped (landing and Persian specs rewritten for the new hero; new checks for
    the labelled example, an undeclared row marked, search above the fold on a
    phone, no canvas and no running animation), root build. Not done: a real
    phone. `DESIGN.md` and `.impeccable/design.json` were regenerated from the
    built hero (the rest of the site still ships Signal & Void and the document
    says so).
- **Design context and hero direction (branch `redesign`, no behaviour change).**
  - New `apps/web/PRODUCT.md`: users, purpose, positioning (declared permissions
    and provenance), constraints (free, external sources, untrusted
    submissions, Persian and English as equals), evidence (all current
    listings are fixtures) and principles. Written from `docs/product-direction.md`
    plus three answers from the maintainer.
  - New `apps/web/DESIGN.md` and `.impeccable/design.json`: the current
    "Signal & Void" system recorded as a **pre-redesign baseline**; it is
    replaced when the hero redesign ships.
  - `apps/web/.impeccable/`: `config.json` (`buildPath: code`), the 2026-10-16
    critique snapshots for `/`, `/dashboard` and `/explore`, and the decision
    sketches from the hero direction round. **Direction chosen by the
    maintainer: The Datasheet** (`model-pick.html`): the hero as a component
    datasheet, white page, hairline rules, spec blue only on Search. The decision
    page had first recorded "The Card Catalogue", which was not their choice; they
    had asked for a minimal hero with little graphics and few colours.
    `minimal.html` is a plainer reference. The other sketches are references only.
    Nothing is built.
    `hook.cache.json`, `live/` and `questions/` are generated and not committed.
- **Listing cards state what the listing declares (critique-driven `layout`,
  branch `redesign`).**
  - `components/marketplace/product-card.tsx` and `product-parts.tsx`: a
    two-part strip under the outcome on every card (home, explore, related
    listings): a green shield and "Safety reviewed", or an amber one and "Not
    yet reviewed", then the licence in mono; below it the declared permissions
    line, which wraps to two lines before it clips because "no network access"
    is the part that matters. A listing that declares nothing says so
    ("Permissions not declared", "Licence not stated") instead of leaving a
    gap. The strip is data the API already returned (`permissions`, `license`
    are product columns the list query spreads); `Product` now types them as
    optional and a new API test pins that the list query keeps them.
  - The creator-identity tick is no longer the cyan check, which looked like
    the safety mark and spent Signal on a trust claim DESIGN.md reserves
    green for: it is a scalloped badge in the brand colour, the shield is
    green. Two marks, two shapes, two colours, two labels.
  - `/explore` and community pages: an `sr-only` "Results" `h2` before the
    cards, so the outline goes h1, h2, h3 instead of skipping a level.
  - New copy keys in `productCard` and `discovery` (`lib/i18n/catalog.ts`,
    both locales) and `moderationNav` (`common.ts`); fixtures in
    `lib/mock-home.ts` carry permissions and licence (one listing is unreviewed
    with no licence, to exercise the empty states).
  - **Bundle offset, no gate change.** The additions pushed the product page's
    first-load JS over its 195 kB ratchet (196.2 KiB). The moderation
    dictionary (2.6 kB gz, used only on the moderation screens) was shipping to
    every page inside `copy`. It is now read through
    `features/moderation/copy.ts` (`useModerationCopy`) by the two moderation
    screens only, and `lib/i18n/index.ts` no longer spreads it. Product page
    194.6 KiB (gate 195), home 186.9 (190), dashboard 185.9 (200). The margin on
    the product page is 0.4 KiB: the next addition there needs another offset.
  - Verification: typecheck, lint, 169 web unit tests (four new card tests,
    the queue test now mocks the copy hook), API 177 passed (one new) with
    `LOCAL_AUTO_VERIFY_EMAIL=false`, full e2e 125 passed (new: every card
    states its review state, licence and permissions; heading levels never
    skip). Measured at 390, 768 and 1440 px in English and Persian, dark and
    light: cards in a row stay level and nothing clips. Not done: the
    permissions *filter* on `/explore` from the critique (separate item).
- **Dashboard on a phone (critique-driven `adapt`, branch `redesign`).** From
  the 2026-10-16 critique of `/`, `/dashboard` and `/explore`.
  - `features/dashboard/listings-table.tsx`: at 390 px the listing names
    rendered at 0 px, so each row showed only its type badge (`max-w-0` on the
    name cell with nothing telling it to take the leftover width, then the badge
    and a no-wrap status pill taking the rest). The name cell is now
    `w-full max-w-0` below `sm`, the type badge sits under the name, the status
    pill may wrap, and the acquisitions header drops its tracking. Names are
    71 px at 320, 82 to 139 px at 390 (full text, ellipsis only for the longest
    at 320 and 360), and the page never scrolls sideways.
  - A listing whose state needs the creator (changes requested, rejected,
    suspended) gets a second line with the reviewer's message and, where the
    listing is editable, an "Edit draft" link. Before, the row said "Changes
    requested" with no reason and linked to releases. `isEditable` is now
    exported from `features/creator/creator-dashboard.tsx`.
  - The 10 px type badge and the Ctrl K hint are 11 px (the floor in DESIGN.md).
  - `features/dashboard/dashboard-nav.tsx`: below `lg` Publish is the last slot
    of the bottom tab bar instead of a floating button, which sat over the
    right-aligned acquisitions column of whatever row was scrolled beneath it.
    Bottom padding of the shell is 24 (was 32) to match.
  - Verification: typecheck, lint, 165 unit tests (one new: reason and edit link
    appear for the listing with feedback only), full e2e 123 passed (new phone
    case: names wider than 60 px, reason and Edit draft visible; the
    signed-out-then-dashboard case now counts name cells, not table rows).
    Measured at 320, 390, 768 and 1440 px. Not run: a real phone.
- **Web audit fixes (branch `redesign`, `apps/web` presentation lane at the
  maintainer's request).** From a Playwright pass at 735, 768 and 1440 px over
  the main routes, signed out and as a creator. One bullet per fixed item.
  - Language switch (`components/layout/header.tsx`): the switch was a client
    `<Link>`, so `/fa` showed an English, left-to-right page until a reload
    (the root layout keeps `lang`/`dir` across a soft navigation). It is now a
    plain anchor. Verification: new `e2e/persian.spec.ts` case round-trips
    en to fa to en and asserts `lang` and `dir` without a reload.
  - Persian home page (`app/page.tsx`, `components/sections/process.tsx`,
    `lib/i18n/home.ts`): the process steps, the trust section, the collection
    shelves and the newsletter blurb were hard-coded English, so everything
    below the hero was English inside an RTL page and its full stops landed on
    the wrong side. All of it now comes from `lib/i18n/home-sections.ts` in
    both locales (new file in the shared `lib/i18n/`). That file is **not**
    spread into `copy`: `copy` is imported by client components, so putting
    about 4 KB of home-only text in it pushed the product page's first-load JS
    to 196.9 kB gz against its 195 kB ratchet gate. `app/page.tsx` reads it on
    the server and passes the three process steps to the one client component
    that needs them as a prop. The process panel's terminal lines are an
    explicit `dir="ltr"` island and creator bios use `.ts-bidi`.
    Verification: unit test renders `Process` in `fa`; e2e asserts every
    `main h2` on `/fa` contains Persian; checked by eye at 768 px.
  - One creator surface, `/dashboard` (items 5, 6, 7 and 8 of the audit).
    **Decision (maintainer, 2026-10-16): the creator workspace lives under
    `/dashboard` only.** This reverses the plan to retire studio in favour of
    `/creator` and settles the three open questions about that redirect.
    `/creator` and `/creator/listings/**` moved to
    `/dashboard/studio` and `/dashboard/studio/listings/**` (new, edit,
    releases), now inside the dashboard shell; the old addresses 308 to the new
    ones in both locales (`next.config.ts`). Every link, the header's
    "Share your work", quick actions and the docs point at the new routes; the
    transitional `StudioNotice` is gone. The measured layout shift on
    `/creator` (CLS 0.65 to 1.06, from the marketing footer jumping into
    place) is gone with the page: 0 on `/dashboard/studio` at 735, 768 and
    1440. "New listing" no longer wraps. "Design system" is out of the primary
    nav (the page stays, footer links unchanged).
    Verification: typecheck, 163 unit tests, lint, e2e `dashboard.spec.ts`
    (new case: `/creator`, `/creator/listings/new` and `/fa/creator` redirect,
    and the editor renders without the site footer).
  - Product page (`app/products/[slug]/page.tsx` and its `loading.tsx`): below
    `lg` the acquire panel followed every section, about 3,500 px down at 735
    and 768. The header, the panel and the body are now three grid children, so
    the panel comes right after the header (y 634 at 768 px). From `lg` the
    aside spans both rows as before, still sticky. Verification: new e2e case
    asserts "Add to library" is within 1,800 px of the top at 375, 735, 768 and
    1440. `e2e/catalog.spec.ts` "renders the listing header" also had a latent
    flake on a cold server (about 1 run in 4): a streamed page is revealed
    inside a view transition and React keeps a hidden copy beside the visible
    one, so strict text locators matched twice. The test now waits for the copy
    to go; 0 failures in 20 cold starts.
  - Signed-in header at 735 and 768 px (`components/layout/header.tsx`): with
    four nav items and the full email, "Design system" wrapped to two lines
    and "Share your work" to three. Removing Design system (above) leaves
    three; the nav is also `whitespace-nowrap` with a tighter gap below `lg`,
    and the account link truncates a long address (full address in `title`).
    Verification: e2e at 768 px, English and Persian, asserts one-line links
    and no horizontal scroll; checked by eye at 735 and 768.
  - Mobile menu (`components/layout/header.tsx`, `components/ui/button.tsx`):
    Escape now closes it and returns focus to the toggle. `Button` accepts
    `ref` (typed from `ComponentProps<"button">`). Verification: unit test
    opens the menu, presses Escape, asserts `aria-expanded` and focus.
  - Page titles: `/account`, the sign-in redirect and the creator pages had the
    homepage title; a missing listing was "Resource"; Persian pages said
    "Explore" and "Skill for Claude" in English. Titles are now built from the
    dictionaries (new `lib/i18n/titles.ts` for the three strings that had no
    home, spread in `lib/i18n/index.ts`; everything else reuses existing
    keys), for explore, communities, product, account, dashboard overview,
    studio, settings, new listing, edit and releases. A missing listing is
    "Listing not found" (its HTTP 200 is still open in `pending.md`).
    Verification: three new e2e cases in `e2e/seo.spec.ts`.
  - `/explore` search field (`features/discovery/discovery-experience.tsx`) had
    only a placeholder, so it had no accessible name. It now carries the same
    text as `aria-label`. Verification: e2e finds it by role and name in both
    locales.
  - Category tabs (`styles/globals.css` `.ts-scroll-fade`, used by
    `features/discovery/discovery-experience.tsx`): the strip scrolls sideways
    at narrow widths with nothing to say so ("Workflow" was cut off at 735 and
    768 on the live stack). A CSS-only edge shade now appears on whichever
    side still has tabs past it; both ends are drawn, so RTL needs nothing
    extra. Verification: checked by eye at 300 px, English and Persian, at the
    start and midway; no shade when everything fits (1000 px).
  - Small click targets (item 14): the announcement link (60x16), card titles
    (20 px), the trust-section link, "View all N listings", "Previous/Next
    page", "Browse all communities", "Clear all", the breadcrumb link, the
    sign-in screen's "Forgot password?" and "Register" buttons, and the
    dashboard's "View all" and listing links were under 24 px tall. Each now
    has at least a 24 px target (most 28 to 32) by padding, with negative
    margins where the layout would otherwise grow. New `e2e/targets.spec.ts`
    asserts WCAG 2.2 target size on `/`, `/explore`, a product, `/account` and
    `/dashboard`; a native radio or checkbox counts through its wrapping
    label. Verified that it fails when the threshold is raised.
  - Hero terminal card "empty" at 735 and 768 (item 15): not a bug. At those
    widths the card sits below the fold (top about 810 px of 900), and the
    sequence deliberately plays only while at least half of it is on screen;
    scrolled into view it types normally (`--typed` 0 to 53 in about 2 s). The
    empty frame in the audit was a full-page screenshot. No change.
  - Hero LCP and the WebGL console note (item 16): no code change. On desktop
    the LCP candidate moves from the hero paragraph (about 100 ms) to the
    manifest card's typed text (about 700 ms) because that text first paints
    when the sequence starts, 600 ms after load; with reduced motion, where the
    finished frame paints at once, LCP stays at about 150 ms. It is a metric
    effect of a deliberate decorative animation, well inside the good range.
    The mobile Lighthouse LCP (3.2 s simulated, Render Delay 86%, FCP 1.1 s)
    is a different, known problem and stays in `pending.md`. The "GPU stall due
    to ReadPixels" message is Chrome's software-GL note from headless runs; the
    app calls `readPixels` nowhere.
  - Console noise (item 17): every signed-out page view logged a failed request
    because `GET /api/readers/session` answered 401 for an anonymous caller.
    It now answers `200 { data: { authenticated: false } }` through a new
    `optionalReader` middleware (`apps/api`: `middleware/auth.ts`,
    `routes/readerRoutes.ts`, `controllers/readerController.ts`); protected
    routes still 401. The web client (`lib/api.ts`, `marketplace-session.tsx`)
    handles both shapes. The blog's `getReaderSession` is defined but unused,
    so nothing there changes. The "unexplained" 404 from the audit was
    `/favicon.ico`: the app had no icon at all (blank tab icon too). Added
    `app/icon.svg` (a prompt chevron and caret in the brand colours).
    Verification: new API test (anonymous 200, expired cookie 200, `/profile`
    still 401); new `e2e/console.spec.ts` asserts no console error or failed
    request on six signed-out pages (both projects) and that an icon is
    declared and served; full web e2e 122 passed, 16 skipped; API 176 passed
    with `LOCAL_AUTO_VERIFY_EMAIL=false`; root typecheck and build pass.
    **Deploy note:** a web build that handles `authenticated: false` works
    against the old API (it still sees 401), and the new API works with the old
    web build only if it tolerates a 200 without `user`: it does not (it would
    read `session.data.user.email`), so deploy the web build before or with
    the API.

- CI `verify` now runs `prisma:generate` after `npm ci`. Without it the API
  typecheck saw an empty Prisma client and failed, and the fail-fast matrix
  cancelled the blog and web jobs, so CI on `main` had been red since at least
  2026-09-23 with blog and web never verified. Found when the launch-readiness
  push's new `api-integration` job (which already generated) passed while
  `verify (apps/api)` failed. Verification: YAML parses; the generate step is
  the one `api-integration` ran successfully on GitHub.

- Launch readiness (v.2 side), from a walk of the real flows on a throwaway
  Postgres 17: register, verify, creator profile, draft, submit, moderate,
  publish, acquire, review, hide/restore.
- **Fixed: creating any listing draft returned 500.** The shared
  `marketplaceProductProjectionFromManifest` carries `compatibility.deleteMany`,
  which Prisma accepts on update but rejects inside a nested create. The create
  path in `marketplaceDraftController.ts` now passes only `create`. Broken since
  `7e76115` (2026-09-21); the unit suite mocks Prisma, so nothing failed.
- New `apps/api/src/marketplaceFlow.integration.test.ts`: the whole journey on a
  real database. Skipped unless `INTEGRATION_DATABASE_URL` is set; the new CI job
  `api-integration` runs it against a Postgres 16 service. Fails with the
  draft bug reintroduced (`expected 500 to be 201`). Source verification is
  simulated in the test, since it needs a real GitHub repository.
- Email worker checks `EMAIL_VERIFICATION_SECRET` and the Cloudflare sender
  before claiming any outbox row. Previously an unconfigured provider marked
  every queued email `FAILED` (terminal), so fixing the config later delivered
  nothing. The verification secret also rejects the `.env.example` placeholder,
  which was long enough to pass the 32-byte check.
- `docker-compose.yml`: web build and runtime get `NEXT_PUBLIC_SITE_URL` from
  `WEB_PUBLIC_URL` (canonicals, sitemap and OG cards pointed at localhost);
  `CORS_ORIGINS` and `EMAIL_VERIFICATION_SECRET` are required instead of
  defaulting (the CSRF check rejected every write from a real domain); the
  email worker runs by default and its loop exits on failure, so a misconfigured
  worker restarts visibly. `docker/Dockerfile.web` accepts the new build arg.
  **Existing local stacks:** `docker compose up` now refuses to start until
  `EMAIL_VERIFICATION_SECRET` is set in the root `.env`.
- Seed: with `NODE_ENV=production` it creates only the administrator and the
  marketplace platforms and categories (creators cannot draft without
  categories, which no migration inserts). Demo listings, ratings, reviews and
  follower counts need `SEED_DEMO=true`. Development is unchanged. The seed
  refuses the placeholder `ADMIN_PASSWORD`.
- Product page: "Add to library" is disabled and says "No approved release is
  available yet" when the listing has no release, instead of failing with a
  generic retry message after the click. All 12 seeded listings are in this
  state (legacy v0 snapshots), so none can be acquired or reviewed.
- Dependencies: `next` and `eslint-config-next` 16.3.6 → 16.3.8 (pinned in both
  frontends; outside the advisory range 16.0.0–16.3.7, and chosen over the
  day-old 16.4.2), plus `npm audit fix`: `proxy-addr` 2.0.8, `multer` 2.4.0,
  `sharp` 0.35.5. `npm audit --omit=dev` reports no advisories.
- CI no longer triggers on the non-existent `development` branch. e2e and lhci
  accept `WEB_PORT` (default 3100) so they can run beside a local stack.
- Lane note for Ramtin: removed "Concept prototype · Local mock data only" from
  `apps/web/components/layout/footer.tsx` (line 75). Reason: it would ship to
  production. Nothing else in the footer changed.
- Verification: root typecheck; `npm run lint -w apps/web`; 351 tests passing,
  1 skipped (175 API, 15 blog, 161 web) with `LOCAL_AUTO_VERIFY_EMAIL=false` and
  `NODE_OPTIONS=--no-experimental-webstorage`; the integration test passing on
  Postgres 17; all builds; production and development seeds against fresh
  databases; `docker compose config` with `.env.example`. e2e (`WEB_PORT=3200
  PW_CHANNEL=chrome`, 2 workers) 74 passed, 14 skipped; with default workers two
  timing tests fail intermittently (see `pending.md`). lhci all assertions
  passed: home 93, dashboard 90, product 93, accessibility 100.

- `AGENTS.md`: removed the second shared-surfaces list (it still named the old
  `apps/web/lib/i18n.ts`); "Announce shared-surface changes" now points to the
  single list in Repository facts. The verification gate now names
  `npm run lint -w apps/web`, since no root or other-app lint script exists.
- Verification: docs only; checked that `apps/web/lib/i18n/` is a directory and
  that only `apps/web/package.json` defines `lint`.
- Over-engineering audit cleanup (v.2 side). Removed eight unused or demo-only
  web dependencies: `geist` (fonts are self-hosted from `public/fonts`),
  `prettier` (no config or script), and the Radix `select`, `tooltip`,
  `dropdown-menu`, `tabs`, `checkbox` and `radio-group` packages. Removed the
  dead `formatCount` (web `lib/utils.ts`) and `listingSnapshotFromManifest`
  (API `marketplaceListingLifecycle.ts`). Added `intlLocale()` to
  `apps/web/lib/format.ts` and routed the 20 hand-written
  `"fa-IR" : "en-US"` ternaries in 13 files through it, unchanged in output.
  Collapsed the six one-line method handlers in both `/backend` proxy routes
  into one re-export.
- Lane note for Ramtin: this touched `apps/web/app/design-system/showroom.tsx`
  (checkbox and radios are now native inputs with `accent-primary`, the tooltip
  is a `title`, the dropdown is a `<details>` disclosure, the tabs demo is gone
  because no product surface uses tabs and `Rating` is shown again below) and
  `components/marketplace/product-card.tsx` / `components/catalog/version-picker.tsx`
  (locale tag only). Reason: those demos were the only users of five packages.
- Verification: root typecheck; `npm run lint -w apps/web`; 266 tests passing
  (153 API, 15 blog, 98 web) with `LOCAL_AUTO_VERIFY_EMAIL=false` and
  `NODE_OPTIONS=--no-experimental-webstorage`; all three production builds.
  `prisma:generate` was needed after merging main's password-reset model.
  Not yet run: e2e and LHCI. Port 3100 was held by a process outside this
  session and `playwright.config.ts` hard-codes it.

- Phase D, search and caching (from the improvement review). Measured first, on
  a throwaway Postgres 17 with 20,004 listings and 51,677 compatibility rows:
  a plain listing, `sort=newest`, home and product detail take 7-12 ms, an
  unindexed `sort=rating` 20 ms, page 500 15 ms; only text search is slow, at
  98-138 ms. So no new indexes were added, and `pg_trgm`/`tsvector` was not
  adopted. Search had no relevance ordering, which mattered more than its speed.
- Search: new `sort=relevance` on `GET /api/marketplace/products` and the
  community list. It evaluates the text match once over ids (the length is the
  total, so the second `count` is gone), ranks those ids in one SQL statement
  (name exact 20, name contains 10, word start 5, tag 6, outcome 4, creator 3,
  category 2, description 1, per term), then loads only that page's rows. The
  web app makes relevance the default sort whenever there is search text and
  offers "Best match" in the sort control only then; choosing Featured while
  searching is kept in the URL. At 20k listings it costs +4% to +40% over the
  old query (e.g. `review` 94 to 113 ms, `codex`, 6,668 matches, 102 to 143 ms),
  and the right listing comes first: `review` returns "Financial Model Reviewer"
  and `pull request` returns "Pull Request Guardian" ahead of description-only
  matches. Ceiling, marked `ponytail:` in code: every match id is held and
  ranked; past tens of thousands of matches use `pg_trgm`/`tsvector`. Hostile
  input (quotes, `%`, `_`, `\`, Persian, a `DROP TABLE` string) was run against
  the real database and is parameterised; a search for `_` matches everything
  because Prisma's `contains` does not escape wildcards (existing behaviour,
  logged in `pending.md`).
- Caching, following the `AGENTS.md` rule that lib/api.ts previously ignored:
  server-side public reads (home, item types, communities, community pages,
  catalogue pages, listing detail) now use `next: { revalidate: 30 }`. Search
  terms, anything session-scoped, and every browser request stay `no-store`.
  Verified with a request-counting proxy in front of the mock API and a
  production build: 5 loads of a product page made 1 upstream call, English and
  Persian share it, a cold load makes 1 call (so `generateMetadata` and the page
  were already deduplicated, and a React `cache()` wrapper is not needed), 3
  searches made 3 calls, and the entry refetched once after 32 s. The
  `AbortSignal` on every request does not defeat the cache. Effect on Lighthouse
  LCP is nil (home still ~3.2 s) because the cost saved is the API round trip,
  not rendering; the real LCP work remains the `[locale]` route segment, not
  done here. Staleness bound: a suspended listing can show on the web pages for
  up to 30 s, while the API and the installation endpoint still fail closed at
  once.
- Also: `app/explore/loading.tsx`, so a search or filter navigation shows the
  page frame at once. Deliberately not added for `/communities`, since a loading
  boundary there would wrap `/communities/[slug]` and make its 404 a streamed 200.
  `lib/i18n/catalog.ts` (shared surface) gains `bestMatch`. API schema: `sort`
  accepts `relevance`; the default stays `featured`, so existing callers are
  unchanged.
- Checked and not changed: the API already sends weak ETags and answers
  conditional requests with 304 (verified), so the review's "no ETag" was wrong;
  `Cache-Control` and compression were left out because no CDN is known
  (`pending.md`).
- Verification for Phase D: root typecheck; `npm run lint -w apps/web`; 346
  tests (172 API, 15 blog, 159 web) with the usual env flags; all builds; e2e 74
  passed and 14 skipped; `lhci` all assertions passed (home 93, dashboard 90,
  product 93, accessibility 100). Same spare-port workaround as Phase B.
- Phase C, reviews (from the improvement review; completes the core of the
  `pending.md` P0 "Ratings and Reviews" block). A reader with a verified email
  and a completed acquisition can post one review per listing, edit it, and
  withdraw it, from a form in the product page's Reviews section (rating radios,
  a display name they choose, since reader accounts have no name and the email
  must not be shown, and text). Creators cannot review their own listing.
  `rating` and `reviewCount` on the listing are recalculated from published
  reviews inside the same transaction as every change, under a per-listing
  advisory lock, and are never read from a request (the schema is `.strict()`).
  Moderators get a Reviews panel on the moderation preview with Hide (reason
  required, shown to the author) and Restore; a hidden review leaves the
  aggregate, and its author can neither edit nor delete it, so a hide cannot be
  undone by deleting and reposting. Staff cannot moderate reviews on their own
  listings. The public product response now selects only `id, author, rating,
  body, verifiedPurchase, createdAt` for at most 50 reviews; before, it returned
  raw rows. Rate limit: 20 review writes per hour per IP.
- Shared surfaces for Phase C: migration `202610080001_marketplace_user_reviews`
  and `schema.prisma` (`MarketplaceReview` gains `userId`, `updatedAt`, hide
  fields, a unique `(userId, productId)`, CHECKs for rating 1..5 and "hidden
  implies unpublished"; seeded rows keep a NULL `userId`), plus `lib/types.ts`
  and `lib/api.ts` in web. Routes: `GET/PUT/DELETE /products/:slug/reviews[/mine]`,
  `GET /moderation/products/:id/reviews`, `POST /moderation/reviews/:id/visibility`.
  After the first real review on a seeded listing, its rating and count become
  those of its published review rows; the seed's static numbers are replaced.
- Verification for Phase C: all of it also ran against a real Postgres 17, since
  the API suite mocks Prisma. A throwaway cluster in the session scratchpad took
  all 30 migrations, `prisma migrate diff` reported no drift, and a temporary
  script (deleted) drove the real routes with real sessions: eligibility gates,
  6 parallel edits by one reader leaving exactly 1 row, stored rating and count
  equal to an independent SQL aggregate after create, edit, hide, restore and
  delete, no leaked fields on the public response, and the CHECK and UNIQUE
  constraints rejecting direct SQL. Suite: root typecheck; `npm run lint -w
  apps/web`; 328 tests (167 API, 15 blog, 146 web); all builds; e2e 74 passed and
  14 skipped; `lhci` all assertions passed (home 93, dashboard 89, product 94,
  accessibility 100). Same spare-port workaround and flags as Phase B.
- Not done, and recorded in `pending.md`: reader reports on reviews, creator
  responses, automated holds beyond the rate limit, edit history, and rating
  recalculation on account deletion. The Persian review strings need a native read.
- Phase B, install and provenance (from the improvement review). Product pages
  now show a "Source & provenance" section to everyone, signed in or not: the
  source (npm package, GitHub repository or release, linked), the pinned
  version or commit, the integrity digest, last source check with an overdue
  warning, declared permissions with purpose and destinations, required
  environment variables, and licence, with a note that this is origin and
  declared scope, not a safety guarantee. Under it, a copyable command fetches
  the exact pinned artifact (`npm install pkg@x.y.z`, `git clone` plus
  `git checkout <sha>`, or `curl` plus `sha256sum -c` when a sha256 digest is
  declared), and stdio MCP servers published on npm also get an `mcpServers`
  snippet with placeholders for required env vars. Both are built in
  `apps/web/lib/install.ts`, which validates every creator-supplied value
  against a strict pattern and returns nothing rather than guess. Creator-
  written installation steps stay behind "Add to library".
- API (shared surface `marketplaceController.ts`, no schema change):
  `GET /api/marketplace/products/:slug` gains `release`, the newest published
  release whose source check is verified or stale and whose install URL is on
  github.com or registry.npmjs.org, else `null`. The source fields now come
  from one `serializeReleaseSource` shared with the installation endpoint, so
  the two cannot drift. Web type `ProductRelease` added to `lib/types.ts`
  (shared surface).
- Clipboard: the install dialog's "Copy link" used to announce "Link copied"
  even when the copy failed, and showed that message in the page rail behind
  the overlay; the preview "Copy excerpt" had no error handling. Both now go
  through `copyToClipboard`, report success or failure inside the dialog, and
  the new `CopyBlock` selects the text when the clipboard is unavailable.
- Decisions taken with the product owner: trust details and the fetch command
  are public (the sources are public GitHub and npm); MCP config only for
  stdio plus npm, because `connectionMethod` and `distributionIdentity` are
  free text in the manifest. Not done: config for other transports or sources,
  per-platform install commands (needs the platform registry decision), and
  moving the new strings into `lib/i18n/` (they sit in the component, like
  `product-actions.tsx`). The Persian copy should be read by a Persian speaker.
- Verification: root typecheck; `npm run lint -w apps/web`; 297 tests passing
  (155 API, 15 blog, 127 web) with `LOCAL_AUTO_VERIFY_EMAIL=false` and
  `NODE_OPTIONS=--no-experimental-webstorage`; all three production builds;
  e2e 72 passed and 14 skipped with 2 workers (a first run with default
  workers failed two timing-sensitive tests, view-transition morph and hero
  pause, that pass 4 of 4 in isolation); `lhci` all assertions passed, medians
  home 93, dashboard 91, product 95, accessibility 100. e2e and lhci ran on
  spare ports (3199, 3198) through a temporary wrapper config and a scratch
  copy of `lighthouserc.cjs`, with `PW_CHANNEL=chrome`, because port 3100 is
  held outside this session and both configs hard-code it.
- Phase A, repair (from the improvement review). CI: `npm run lint` now runs
  with `--if-present`, because `apps/api` and `apps/blog` have no lint script
  and their matrix jobs failed at that step. Canonicals: the root layout no
  longer sets `alternates`, which every title-only page (`/explore`,
  `/communities*`) inherited as `canonical: "/"`; new `lib/alternates.ts`
  `pageAlternates()` gives home, explore, communities, community and product
  pages a self-canonical in their own locale plus `en`/`fa`/`x-default`
  hreflang (the `/fa/products/*` canonical used to point at the English page).
  Locale links: the product card (listing and community links), communities
  page, explore's "all communities" link, and the sign-in redirects in
  `marketplace-session.tsx` and `product-actions.tsx` now use `localePath`, so
  Persian readers stay on `/fa`. The Persian product-card test had the old
  unprefixed community link written into it and now expects `/fa/...`.
- Reviewed and not changed: the email worker stays behind the `email` compose
  profile (README documents it, and it fails without Cloudflare credentials);
  rate limiting already honours `TRUST_PROXY` (compose defaults it to 1). The
  open question there is whether server-side renders from the web container
  share one rate-limit bucket, which needs deployment knowledge.
- Verification: root typecheck; `npm run lint -w apps/web`; 268 tests passing
  (153 API, 15 blog, 100 web) with `LOCAL_AUTO_VERIFY_EMAIL=false` and
  `NODE_OPTIONS=--no-experimental-webstorage`; all three production builds;
  canonical and hreflang output checked by curl against `next start` on a
  spare port. The e2e canonical assertion added in `e2e/seo.spec.ts` was not
  run when this phase was committed; it passed in the Phase B e2e run above.

## 2026-10-04

- Added email OTP password recovery for reader accounts. Reset requests return the same accepted
  response for missing, Google-only, throttled, and eligible accounts; six-digit codes are derived
  from signed database state rather than stored as plaintext, expire after 10 minutes, allow five
  attempts, are single-use, and invalidate all reader sessions after a successful password change.
- Reused the existing transactional email outbox and Cloudflare Email Service worker for reset
  messages, including the documented named-sender format. Added migration
  `202610040001_password_reset_otp` with an exactly-one-target constraint so verification and reset
  jobs share the queue without ambiguous records.
- Added the English and Persian forgot-password UI to `/account`, translated known auth errors,
  and added registration password confirmation. Shared surfaces changed: `apps/web/lib/api.ts`,
  `apps/web/lib/i18n/common.ts`, `apps/api/prisma/schema.prisma`, and the new migration.
- Configured the installed `$ponytail:ponytail` workflow in `AGENTS.md` without pinning its stale
  cache path. Its smallest-change rule is explicitly subordinate to the repository's security,
  validation, accessibility, migration, and verification gates. Shared process surfaces changed:
  `AGENTS.md` and this changelog.
- Restored placeholder admin credentials in tracked `.env.example`; the local ignored `.env` was
  not changed. The exposed password must still be rotated because it appeared in a tracked-file
  diff.
- Verification: Prisma client generation, schema validation, and deployment of all 29 migrations
  to isolated schema `codex_preview`; root typecheck; 266 tests passing (153 API, 15 Blog, 98 web);
  web lint; all production builds; `git diff --check`; a live API/database lifecycle covering
  register, reset request, reset confirmation, old-password rejection, new-password login, replay
  rejection, missing-account non-enumeration, and cleanup; plus a browser pass of the account and
  OTP-entry screens against the running API and PostgreSQL. Cloudflare delivery was verified with
  mocked provider responses because this machine does not have the Cloudflare account ID or Email
  API token configured.

## 2026-09-25

- Removed the duplicate `/api/community` creator and product mutation surface
  after review found that it allowed any authenticated reader to publish a
  `DRAFT` listing directly into the public catalog, bypassing verified-email,
  creator-role, source-check, release, moderation, and lifecycle controls. The
  duplicate hard-delete path is gone as well, so creators cannot erase reviews,
  favourites, or trust history outside the established archival lifecycle.
- Consolidated creator ownership on `MarketplaceCreator.ownerUserId`. The
  dashboard Studio now renders the existing role-aware `CreatorHub`, and
  dashboard Settings reads the same owned creator profile as Overview and
  `/creator`; the duplicate dashboard forms, API client methods, DTOs,
  validation schemas, controller, routes, and tests were removed.
- Added forward migration `202609240001_remove_duplicate_creator_ownership`.
  It deliberately aborts if the retired `MarketplaceCreator.userId` contains
  data, preventing a deployment from silently orphaning creator profiles or
  listings; affected databases require the reconciliation recorded in
  `pending.md` before migration.
- Verification: Prisma generation and schema validation; all workspace
  type-checks; 231 tests passing (144 API, 15 Blog, 72 web); all three
  production builds; and `git diff --check`. Tests ran with
  `LOCAL_AUTO_VERIFY_EMAIL=false` and Node's experimental global web storage
  disabled so API registration used the documented default and jsdom owned
  `localStorage`.
## 2026-09-24

- Plan v2, phase P7 (process). This completes plan v2; the plan file is
  removed.
  - Shared surface: `apps/web/lib/i18n.ts` is now `lib/i18n/` with
    `common`, `home`, `dashboard`, `catalog`, `creator` and `moderation`
    files. `index.ts` spreads them back into `copy`, so all 27
    `@/lib/i18n` imports are unchanged. The split was mechanical, moved by
    line range, and the old and new `copy` were checked deep-equal (107 keys
    per locale) before the old file was removed. Add strings to the file for
    their surface.
  - English left on Persian pages is now translated (new `homePage` keys):
    the hero search's typed examples and type shortcuts, the hero chips'
    captions (the version stays Latin data), and the creator tiles'
    products/followers line.
  - `/dashboard/studio` keeps working, with the plan's fallback notice:
    "Studio is being replaced by Creator. New listings should start there."
    The redirect to `/creator` waits for the other maintainer to answer:
    1. Does `/creator` cover every action studio has today: create, edit,
       unpublish, delete, and editing items originally published through
       `/api/community`?
    2. Is there live data only reachable through `/api/community` that needs
       migrating into the marketplace tables first?
    3. Can `/dashboard/studio/*` get a 308 to `/creator/*` on an agreed date,
       with `/api/community` marked deprecated in the API changelog and
       removed one release later?
  - Shared surface: `AGENTS.md` is rewritten from the plan's Part C, with the
    existing rules kept below it, unchanged in substance.
    - The new top section covers repository facts, ownership (`pending.md`
      is the other maintainer's queue), shared surfaces, how a phase runs,
      context hygiene, Claude Code session commands, and other harnesses.
    - The Part C placeholders are filled from the repo: the other branch is
      `v.2`, and the shared-surface list is merged with the old one.
    - The build section adds the e2e and Lighthouse commands and the
      budget ratchet rule.
  - Code comments that cited the plan now point at `docs/motion.md`, the
    gate files and this changelog.
- Verification: root `typecheck` clean; 262 tests passing (150 API, 15 Blog,
  97 web); `apps/web` lint clean; all production builds; e2e 69 passed,
  13 skipped by design.

- Plan v2, phase P6 (Persian beyond mirroring).
  - Persian type scale in `styles/globals.css`: body leading 1.8; display
    type at weight 600 and leading 1.35; the hero headline smaller
    (`clamp(2.6rem, 6.5vw, 4.4rem)`).
  - One rule removes letter-spacing and capitals from all Persian text.
    Latin data islands (`dir="ltr"`: commands, versions) keep their styling.
  - Numerals policy in `lib/format.ts` (`formatNumber(n, locale,
    { context })`, unit-tested). Prose uses the reader's digits, so Persian
    gets Persian digits; data stays Latin. Applied to the card usage count,
    the "view all" count, creator followers, and the detail page counts.
    Dashboard, creator and moderation formatting is unchanged (outside this
    phase's files).
  - Direction on the homepage and catalogue components:
    - arrows mirror (`rtl:rotate-180`, `rtl:-scale-x-100`), and hover nudges
      reverse;
    - the hero's wide-screen scrim moves to the start side;
    - the rail, list borders, search icons and the filter sheet use logical
      properties.
  - Tailwind `rtl:` variants stand in for the plan's `--dir` variable. The
    ticker already ran mirrored since P2.
  - Creator-supplied text (listing names, outcomes, descriptions) gets
    `.ts-bidi` (`unicode-bidi: plaintext`), so an English sentence on a
    Persian page ends with its full stop instead of starting with it.
- Left for P7: English copy still inside Persian pages (the hero search's
  typing examples, the home creator tiles' "followers", the trust chip
  captions). That is the i18n split.
- Verification: `e2e/persian.spec.ts` now checks for no tracked or
  capitalised Persian text on `/fa`, `/fa/explore` and a Persian listing;
  a smaller, looser, 600-weight Persian display; the mirrored ticker; and
  Persian digits in prose with Latin ones in the terminal card. `/fa` was
  checked at 375 and 1280. e2e 69 passed, 13 skipped by design. Root
  `typecheck` clean; 262 tests passing (150 API, 15 Blog, 97 web);
  `apps/web` lint clean; all production builds.

- Plan v2, phase P5 (error, empty and 404 pages, SEO, social cards).
  - Branded 404 pages: `app/not-found.tsx` ("404 · not on the shelf") and
    `app/products/[slug]/not-found.tsx` ("unpublished, or never existed").
    Each has a mono eyebrow, a serif headline, a search box styled like the
    hero's, and links to Explore, Publish and Home. `/nope` answers a real
    404. Error boundaries (`app/error.tsx`, `app/dashboard/error.tsx` inside
    the dashboard frame, and `app/global-error.tsx`) share one calm
    `ErrorView`: a retry button and the digest in small mono, no red banner.
  - The 404 view is server-only, with plain anchors, an inline icon and a
    GET search form, for a measured reason. The root not-found boundary
    hangs off every route, and Next ships its client components' chunks in
    every first load, even behind `next/dynamic`. Using the hero search and
    the header there put the homepage chunk on `/dashboard` (+24 kB), and
    even `next/link` and a lucide icon did. The JS budget spec caught it.
  - `app/sitemap.ts` covers the static pages, communities and every live
    listing (walked 48 per page), with `en`/`fa` alternates and a change
    frequency derived from `updatedAt`. `app/robots.ts` keeps the dashboard,
    account, creator, moderation, backend and design system out, in both
    locales.
  - Social cards (`next/og`, 1200×630): a root card and a per-listing card.
    Each has a dark canvas, the name in Newsreader, a type pill, the trust
    chips in the hero's order, and the wordmark. Satori needs static WOFF,
    not the site's variable WOFF2, so `lib/og/fonts` holds static cuts of the
    same faces (OFL). A listing card renders in 268 ms cold and 60 ms warm.
  - Metadata: `metadataBase` from the new `NEXT_PUBLIC_SITE_URL` (added to
    `apps/web/.env.example`), `openGraph.siteName`, `summary_large_image`
    Twitter cards, and per-listing canonical plus `en`/`fa` alternates.
    Detail pages carry `SoftwareApplication` JSON-LD: free offer, version,
    author, and an aggregate rating when there are reviews. `<` is escaped,
    since listing text is creator-supplied.
  - Not done: a true 404 status for unknown listings, which still stream as
    200 with `noindex` (P4). It needs an existence check in `proxy.ts` on
    every listing request, which is too costly without a cheap API
    endpoint. There is also no author link from the listing 404, as there
    are no author pages.
- Verification: new `e2e/seo.spec.ts` covers the branded 404 with a real
  status, the listing 404, the error boundary (the mock API fails a slug on
  purpose), the sitemap listing all 15 fixture listings, robots, the social
  card's size and type, large-image metadata, and JSON-LD. The build lists
  `/products/[slug]/opengraph-image` as `ƒ`. e2e 57 passed, 13 skipped by
  design, with JS budgets unchanged. Root `typecheck` clean; 259 tests
  passing; `apps/web` lint clean; all production builds.

- Plan v2, phase P4 (product detail, Explore, view transitions). Catalog
  presentation only; no API or lifecycle changes.
  - Detail page (`app/products/[slug]`, route unchanged). The header is the
    listing card grown: type, version, author, rating, and the three trust
    claims (verified, permission scope, licence). They use a `TrustChip`
    now shared with the hero's corner chips, so the promise and the product
    look the same. The manifest is a definition table with mono labels
    (`components/catalog/manifest-table.tsx`), no longer a list of prose
    rows. The sticky rail keeps acquire and install (instructions are pinned
    to the acquired release, so there is no public install command) and
    adds a version picker with each release's notes
    (`components/catalog/version-picker.tsx`). Below: what it does, manifest,
    use cases, included files, examples, read-only reviews, works with,
    creator, related. Added `loading.tsx` at the page's real dimensions, and
    the title is now "{name} — {type} for {platform}".
  - Left out, on purpose: a report link (reporting is the other
    maintainer's work) and the plan's `/[type]/[slug]` route (moving URLs is
    out of scope).
  - Card → detail morph: the listing title travels from its card into the
    detail header in Chrome (320ms, expo). Under reduced motion it
    cross-fades in place, and browsers without the API just navigate.
  - Why not React's `<ViewTransition>`: on this dynamic page the destination
    commits after the transition has captured the old page, so React never
    pairs the two halves. That held in the webpack build and in Turbopack
    dev, with and without `loading.tsx`, and with full prefetch.
    `components/catalog/listing-link.tsx` drives `document.startViewTransition`
    itself and waits, at most 1.5s, for the detail header. There is no root
    `<ViewTransition>` either: Explore now changes the URL on every filter,
    and a root transition would cross-fade the whole page each time.
  - Explore is URL state (`lib/discovery-url.ts`, unit-tested): type,
    category, platform, verified, rating, sort, query (debounced) and
    `?page=` are read by the server page and written by the controls, so
    views survive reload and can be linked. The results are no longer copied
    into client state. A skeleton grid shows while the next URL renders. The
    bar is sticky, with the count in mono. "Load more" is replaced by
    previous/next page links, plus `<link rel="prev"/"next">` in the head.
    The community pages share the same reading, including `?page=`. The
    plan's `?license=` filter is not there, because the API has no licence
    filter.
  - The e2e mock API now serves the public catalogue: the homepage fixture
    (imported from `lib/mock-home.ts` via Node's type stripping) plus
    generated listings, with filtering, pagination and detail.
- Findings:
  - An unknown listing streams as 200 with `noindex` once `loading.tsx`
    exists, which is documented Next behaviour. A true 404 status needs an
    existence check in `proxy.ts`; left for P5, which owns not-found pages.
  - Separately, the site header is not actually sticky. Its sticky bar sits
    inside a `<header>` exactly as tall as its content, so it scrolls away.
    The Explore bar therefore sticks at the top of the viewport. Not changed
    here.
- P4 measurements, local mobile median of 3: the detail page scores
  performance 93 and accessibility 100, with CLS 0, TBT 17 ms and simulated
  LCP 3.24 s. Its first-load JS is 188.7 kB. It is added to `lighthouserc.cjs`
  (LCP gate 3.5 s, target 2.2 s) and the JS budget (gate 195 kB, target
  180 kB). `/` is 184.7 kB.
- Verification: new `e2e/catalog.spec.ts` covers the detail page rendering
  from the mock, the version picker, noindex for an unknown listing, the
  card-to-header morph (a paired `::view-transition-group` observed), a
  filter changing the URL and results and surviving reload, pagination
  links with `rel`, and "no results" clearing filters. e2e 47 passed,
  9 skipped by design; `lhci assert` passes on all three URLs. Root
  `typecheck` clean; 259 tests passing (150 API, 15 Blog, 94 web);
  `apps/web` lint clean; all production builds.

- Plan v2, phase P3 (fonts, WebGL gating, CSS reveals).
  - Fonts are self-hosted from `apps/web/public/fonts`, with OFL licences
    beside them. The files are the ones `@fontsource-variable` served: Latin
    `wght` subsets of Newsreader, Geist and Geist Mono, plus Estedad's
    Arabic-script subset only. Version-named files get immutable caching.
    The root layout preloads what each locale's first paint needs:
    Newsreader and Geist on English pages (exactly two preloads), Estedad and
    Geist on Persian ones. The `@font-face` rules include the metric-matched
    Times New Roman and Arial fallbacks that `next/font` generates, so the
    swap does not move text. `@fontsource-variable/*` is gone from
    `apps/web` (the Blog still uses it).
  - Why not `next/font` as the plan said: under the webpack production
    build, Next 16 writes an empty font manifest for this app, so it emits no
    preload at all. Turbopack records them, but switching the production
    bundler was out of scope. `next/font` also preloads per layout, not per
    locale.
  - WebGL gating: `components/hero/use-plasma-tier.ts` picks `static`
    (reduced motion, Save-Data, reduced data), `css` (under 1024px, coarse
    pointer, fewer than 4 cores or under 4 GB) or `webgl`. The pure rule is
    unit-tested. `hero-atmosphere.tsx` always renders a CSS nebula. Only the
    `webgl` tier imports the shader field, as its own chunk after idle,
    fading it in over the nebula; it unmounts, losing its GL context, while
    the hero is off screen. Phones never request the chunk. Deviation: the
    nebula drifts by rotating a conic layer on the compositor, not by
    animating `@property --hue`, which would repaint the gradients on the
    main thread every frame.
  - Reveals are now CSS scroll-driven animations (`.ts-reveal` on a
    `view()` timeline, inside `@supports`), with no fallback: without support
    the content is simply visible. `components/motion/reveal.tsx`,
    `lib/hooks/use-in-view.ts` and the `<noscript>` reveal override are
    deleted. Scrolling triggers no React state updates, apart from the two
    hero observers flipping when the hero crosses the viewport edge.
- P3 measurements, local mobile median of 3:
  - `/`: performance 93 (was 92), TBT 21 ms (was 35), CLS 0.023, LCP 3.22 s.
  - LCP did not reach the plan's 2.0 s. On localhost every script finishes
    before the first paint, so Lighthouse's simulated throttling counts all
    first-load JS against LCP: observed LCP equals observed FCP, at 123 ms.
    Under real DevTools throttling `/` LCP is 2.13 s. `/dashboard` is 5.8 s
    there, because its LCP text only exists after client-side session and
    data fetches.
  - The CI gates keep simulated throttling and are unchanged.
- Verification: new `e2e/performance.spec.ts` checks the two font preloads on
  `/` and Estedad's on `/fa`, the CSS tier on phones with no canvas, the
  WebGL tier offered on desktop, the static tier under reduced motion, and
  reveals complete in view and absent under reduced motion. e2e 33 passed,
  7 skipped by design; `lhci assert` passes on the P3 runs. Root `typecheck`
  clean; 251 tests passing (150 API, 15 Blog, 86 web); `apps/web` lint
  clean; all production builds.

- Plan v2, phase P2 (motion diet and the signature moment). The homepage
  hero's manifest card now performs the search → inspect → install journey
  once, after load. Everything else got calmer or cheaper. Spec and rules
  are in the new `docs/motion.md`; tokens are in `styles/tokens.css`.
  - The sequence: `components/hero/manifest-timeline.ts` maps elapsed time
    to a frame (pure, unit-tested); `manifest-sequence.tsx` runs one
    `requestAnimationFrame` clock. It starts 600ms after `load`, plays once,
    and holds on hover, while under half the scene is on screen, and while
    the tab is hidden. The pause toggle and Replay are real buttons outside
    the `aria-hidden` scene. Lines are laid out at final size and only
    revealed, so the card and its chips never move. The three corner chips
    now land with the manifest line each one restates. Reduced motion gets
    the finished frame from CSS on first paint, with no controls. In Persian
    the card stays `dir="ltr"` and only the title bar is translated (Estedad,
    since the mono face has no Persian glyphs).
  - Deleted `TiltCard`, `Magnetic` and `DecodeText`, and their CSS. Cards take
    a CSS `.ts-lift` hover (2px lift and shadow); buttons lift 1px on hover
    and settle on press. The h1 paints its final text at once, with no
    scramble. Above-the-fold content enters with a CSS-only stagger
    (`.ts-enter`). The h1 and intro rise without fading: a fade from 0 on the
    LCP paragraph measured +430ms mobile LCP, which the Lighthouse ratchet
    caught.
  - The how-it-works panel cross-fades instead of sliding, and its dots
    move to the spec timing. Reveals travel 16px over 560ms.
  - Fixed the platform marquee, broken before P2: its unlayered
    `.animate-marquee` rule overrode the Tailwind utilities meant to pause it
    on hover, stop it under reduced motion, and flip it in RTL. In Persian a
    growing gap opened at the right edge. All marquee states are now plain
    CSS, and RTL uses mirrored keyframes, because running the LTR ones in
    reverse would still open the gap. The component is no longer a client
    component.
  - Shared surface: `lib/i18n.ts` gains `homePage.manifestTitle`,
    `manifestPause` and `manifestReplay` in both locales.
  - Deviations from the plan: no focus-within pause (the card has nothing
    focusable; the toggle is the keyboard control); browse tab cross-fade
    not done (outside the phase's file list).
- P2 measurements, local mobile median of 3 against the P1 baseline:
  - `/`: LCP 3.16 s (unchanged), TBT 35 ms, CLS 0.014 (was 0.026),
    performance 92. `/dashboard` unchanged.
  - First-load JS on `/`: 185.8 kB, not the plan's 15 kB drop. Removing the
    three primitives saved about what the sequence costs. The remaining weight
    is framework chunks and the WebGL field, which is plan P3's lazy gating.
    Ratchet gates unchanged.
- Verification: `lhci assert` passes on those runs. e2e 21 passed, 5 skipped
  by design. New specs cover the sequence playing once, landing every chip,
  and replaying; the pause button and scrolling away holding it; and reduced
  motion showing the finished frame with no controls. Marquee direction and
  hover pause were checked in `/` and `/fa`. Root `typecheck` clean;
  246 tests passing (150 API, 15 Blog, 81 web including seven timeline
  tests); `apps/web` lint clean; all production builds.

- Plan v2, phase P1 (safety net). `apps/web` now has a Playwright e2e suite
  and a Lighthouse CI performance gate, both run by a new
  `.github/workflows/web.yml` on pushes to `main` and every PR. The workflow
  builds once with `NEXT_PUBLIC_USE_MOCK=1`, runs e2e on that build, then
  hands the same `.next` to Lighthouse.
  - No API or database needed: `apps/web/e2e/mock-api.mjs` is a small
    dependency-free stand-in for `apps/api` (session, sign-in/out, favourites,
    library, creator profile and dashboard). A cookie picks the persona:
    `creator@e2e.test` gets three listings, `empty@e2e.test` gets none.
    Unhandled routes log `[mock-api] unhandled …` and answer 404.
  - `playwright.config.ts`: `desktop-chromium` (1280×800) and
    `mobile-chromium` (Pixel 7), with the web server on port 3100 so it never
    collides with `npm run dev:web`. Specs: `landing` (hero, search, featured
    from the fixture; hero chips; how-it-works panel discover → inspect →
    install and back; no running animations under reduced motion; no
    sideways scroll at 375px on `/` and `/fa`), `dashboard` (signed-out
    redirect to `/account?next=%2Fdashboard` and back after sign-in; empty
    state for a creator with no listings; Ctrl/⌘K focuses the top-bar
    search), `persian` (`/fa` is `dir=rtl` `lang=fa`, body in Estedad, no
    tracked `.eyebrow`), and `budget` (first-load JS).
  - Where the plan didn't match the code, the tests follow the code: sign-in
    is `/account`, not `/sign-in`; there is no ⌘K palette to close with Esc;
    there is no `/` shortcut to focus the hero search; and the how-it-works
    panel is read through its existing `data-testid="pinned-panel"`, not a
    new `data-panel-state` attribute. No product code changed.
  - First-load JS comes from the served HTML's `<script src>` tags, gzipped
    from `.next/static`, skipping `nomodule` polyfills. The Next 16 webpack
    build no longer writes `app-build-manifest.json`.
  - Budgets are a ratchet (agreed with Ramtin). Gates fail at today's
    baseline plus headroom, and the plan's budgets are written beside them as
    targets. Local mobile median: `/` LCP 3.16 s, perf 92, JS 185 kB;
    `/dashboard` LCP 3.62 s, perf 89, JS 182 kB. TBT, CLS, max-potential-FID
    and accessibility (100) already meet the plan and are gated at it. The
    plan's "warn at 90%" level is not implemented: LHCI allows one level per
    audit.
  - New scripts: `npm run e2e -w apps/web` (builds with the fixture first;
    `E2E_SKIP_BUILD=1` reuses a mock build; `PW_CHANNEL=chrome` uses the
    installed Chrome) and `npm run lhci -w apps/web` (config at root
    `lighthouserc.cjs`). Vitest now excludes `e2e/`. Playwright and LHCI
    output is gitignored.
- Local caveats: the Playwright browser CDN returns 403 from this network,
  hence `PW_CHANNEL=chrome`. `lhci autorun` on Windows fails on Chrome
  temp-profile cleanup (`EPERM`) after collecting. The baseline was measured
  with the Lighthouse Node API using the same settings, and `lhci assert`
  was run against those results. Neither problem affects the Linux runners.
- Verification: e2e 16 passed, 6 skipped by design (desktop-only or
  mobile-only), from a fresh mock build. `lhci assert` passes on the
  baseline runs and fails both URLs when LCP is tightened to the plan's
  2.2 s. Removing the dashboard's signed-out redirect fails the dashboard
  spec (reverted). Root `typecheck` clean; 239 tests passing (150 API,
  15 Blog, 74 web); `apps/web` lint clean; all production builds.

- Plan v2, phase P0 (housekeeping and browser passes). Product cards no longer
  render English in Persian: "Editor's pick", "Trending", "uses", the type
  badge, the favourites button label and the communities group label come
  from a new `productCard` group in `lib/i18n.ts` (both locales), and
  community badges show `nameFa` with an `nameEn` fallback.
  `ProductTypeBadge` takes an optional localized `label`; its server callers
  are unchanged. Added a root `CLAUDE.md` that imports `AGENTS.md`.
- `AGENTS.md` (shared surface): corrected stale branch facts only. `main` is
  the integration branch and GitHub default, CI runs on pushes to `main` and
  on every PR, and there is no `development` branch on the remote. The rest
  of the plan's `AGENTS.md` rewrite is P7.
- Browser passes, run with Playwright driving local Chrome at a real
  375×812 mobile viewport (DevTools device emulation was not reachable, and
  the app correctly refuses to be framed) against the dev server and the API
  run from source:
  1. 375px — pass. `/`, `/fa`, `/dashboard`, `/fa/dashboard`: no horizontal
     scroll or overflowing element; hero search usable; hero corner chips
     hidden (`hidden md:block`) and shown at 1280; marquee clipped by its
     parent; dashboard bottom tab bar and floating Publish present.
  2. Keyboard walk on `/` — pass. 49 stops from the announcement through the
     header, hero search, popular searches, type chips, featured cards,
     browse tab, collections, creators, newsletter and footer, each with a
     visible ring. ⌘K / Ctrl K on the dashboard focuses the top-bar search;
     there is no palette dialog, so "Esc closes ⌘K" does not apply.
  3. How-it-works — pass. Panel shows discover → inspect → install once each
     scrolling down, and the reverse scrolling up.
  4. Creator dashboard with 3 real listings — pass (desktop en/fa, mobile
     en): 3 table rows, 3 activity items, no errors. Signed-out `/dashboard`
     redirects to `/account?next=%2Fdashboard`. Fixture: a local reader
     `p0-creator@example.com` made owner of the seeded `ellisnorth` creator,
     email-verified and granted CREATOR directly in the local database.
     This found the unverified-creator message bug now in `pending.md`.
- Note for local runs: the Docker `api` image built on 2026-09-22 predates
  the community placements work, so its product payloads have no
  `communities` and every `ProductCard` crashes (`communities.length`). Run
  the API from source or rebuild the image (`docker compose up -d --build api`).
- Verification: root `typecheck` clean; 239 tests passing (150 API, 15 Blog,
  74 web including two new Persian `ProductCard` tests); `apps/web` lint
  clean; all production builds.

## 2026-09-23

- Finished the dashboard plan and deleted `dashboardPlan.md`. The creator
  dashboard API summary now also returns `acquisitionsLast7Days`,
  `acquisitionsPrevious7Days` (completed orders by `createdAt`), and
  `averageRating` / `ratedReviewCount`: a review-weighted average across all
  of the creator's rated listings, `null` rather than 0 until anything is
  reviewed. The overview tiles now follow the plan: Acquisitions · 7d with a
  ▲/▼ change against the previous seven days (colour and arrow for sight, a
  sentence for screen readers), Listings live, Avg rating, and In review. The
  plan's "pending reviews" tile and "reply to reviews" action remain out, as
  the review-response workflow does not exist yet; it is tracked under
  Ratings and Reviews.
- Merged `origin/main` into `ramtin` (search expansion, normalized taxonomy,
  community placements, lifecycle authorization tests). The homepage type
  counts are now grouped on `itemType` and returned as stable keys, because
  main's `?type=` filter accepts only keys; the search chips submit keys, and
  "Developer tools" became "Rules" since `Developer utility` has no key.
- Verification: root `typecheck` clean; 237 tests passing (150 API including
  two new dashboard summary tests, 15 Blog, 72 web); `apps/web` lint clean;
  all production builds. The 375px dashboard pass is still not done in a
  browser (the browser window could not be resized from this environment)
  and remains in `pending.md`.

- Rebuilt `/dashboard` as a creator workbench (from `dashboardPlan.md`,
  gitignored scratch). The dashboard now has its own frame in place of the site
  header and footer: a top bar (wordmark, `~/path` crumb, catalog search with a
  working ⌘K / Ctrl K shortcut, theme, language, avatar), a sidebar with the one
  primary Publish action and a user card, and below `lg` a bottom tab bar and a
  floating Publish button. A signed-out visitor is now redirected to
  `/account?next=<path>` instead of seeing an inline card.
- The overview moved off the legacy `/api/community` endpoints onto the
  owner-scoped marketplace creator API, via a new `lib/dashboard.ts`
  (`getDashboardHome`, where a 403/404 means "no creator workspace", not an
  error). It shows a time-of-day greeting, four stat tiles, an eight-row
  listings table with lifecycle status, an activity feed merged from each
  listing's lifecycle events, and quick actions. Every data card has loading,
  empty, no-profile and inline-error-with-Retry states, and the route skeleton
  is the same layout held in its loading state, so dimensions cannot drift.
- Deliberate departures from the plan, all because the data does not exist:
  no "installs · 7d" or trend deltas (the API reports totals, not a time
  series), no "pending reviews" tile or "reply to reviews" action (there is no
  review-response workflow), and no Listings / Reviews / Analytics nav items
  (no such routes; the nav only links real pages). The tiles are
  Acquisitions, Listings live, In review and Total listings. Components live
  in `features/dashboard/`, matching the repo, not the plan's
  `components/dashboard/`.
- Fixed Persian eyebrow labels site-wide: `.eyebrow`'s tracking and mono face
  pulled Persian letters apart, so `html[dir="rtl"] .eyebrow` now uses Estedad
  with no tracking. `listingStateLabel` and `lifecycleActionLabel` are now
  exported from `features/creator/creator-dashboard.tsx` for reuse.
- Verification: root `typecheck` clean, 220 tests passing (19 new: data
  layer, overview states, shell gate/nav/Publish routing), `apps/web` lint
  clean, all production builds. Checked in a real browser against the running
  API with a signed-in reader without a creator profile: desktop dark and
  light, and Persian RTL (which found and fixed the eyebrow and greeting-bidi
  bugs). Not checked in a browser: the 375px layout and a creator account
  with listings (covered by unit tests only).

- Closed out the homepage plan (`plan.md`, gitignored scratch, now deleted).
  Audited every item against the code; the only unfinished ones were the
  Next.js upgrade and the Lighthouse/axe targets. Upgraded `next` and
  `eslint-config-next` in `apps/web` from 16.3.3 to 16.3.6 (exact pins kept).
- First Lighthouse run against a production build with the API down: desktop
  Performance 97 / Accessibility 100, but mobile Performance 83, below the
  plan's 90. The LCP element was the hero intro paragraph, with 86% of its time
  spent in render delay behind 380 ms of blocking time; the synchronous WebGL
  shader compile in `PlasmaField` was running during hydration. The field now
  waits for `requestIdleCallback` (1.5 s timeout, 300 ms `setTimeout` fallback
  where it is missing) before building its GL program. The canvas shows its
  `bg-background` until then, as it already did before its first frame.
- Verification: Lighthouse mobile Performance 92 / 92 / 91 over three runs
  (TBT 380 ms → ~95 ms) with Accessibility 100; desktop Performance 100,
  Accessibility 100, Best Practices 96. Lighthouse's accessibility category is
  axe-core, so no axe failures were reported. Root `typecheck` clean, 201 tests
  passing, `apps/web` lint clean, all production builds pass. The manual
  browser walkthroughs from the plan (keyboard-only pass, 375px, how-it-works
  panel on scroll) were not run and are tracked in `pending.md`.

## 2026-09-22

- Completed the homepage design and UX pass, landed as fourteen commits on
  `ramtin`. Resilience first: the page no longer needs the API to render. One
  cached loader feeds every section, a failed fetch degrades to a new
  `apps/web/lib/mock-home.ts` fixture instead of throwing, each data-driven
  section streams behind a skeleton sized to the real component, empty states
  are distinct from the "could not load" notice, the page-wide red banner
  became an inline notice with a working Retry, and "View all 0 listings" is
  never rendered. `NEXT_PUBLIC_USE_MOCK=1` serves the same fixture for
  front-end work with no database. A session refresh that 401s, times out or
  cannot reach the API now leaves the visitor anonymous silently.
- Reworked the hero and information architecture. Search moved into the hero
  as the primary action and the standalone search band was removed; the copy
  grid drops to `min-h-[66vh]`, landing near 80vh with the header and ticker.
  The floating chips went from five to three (price and rating removed — "$38
  one-time" contradicted the freely-shared positioning) and are now anchored
  to the card's corners. Curated collections and Browse by practice merged
  into one tabbed Browse section whose active tab lives in `?browse=`;
  Featured creators absorbed the creator CTA as its fourth tile; Trust became
  the page's one inverted full-bleed section; and a new `--section-y` scale
  replaced nine per-section padding decisions.
- Measured rather than assumed on contrast. The gradient headline already
  cleared AA at rest (6.35:1 dark, 5.12:1 light across the sampled sweep); the
  real failure was the decode animation holding it at 86% opacity, which put
  the light theme at 3.98:1. New `--plasma-text-*` stops now clear 9.11:1 and
  6.59:1, and the decode holds AA. `--muted-foreground` also passes
  comfortably, so the eyebrow labels were a type-size problem, not a colour
  one — every reduced-alpha use of that token (`/70`, `/75`, `/80`) did fail
  and was removed. The plan's own suggested light stop `#c026d3` measures
  4.39:1 and was not used.
- Search shortcuts became scoped filters in the body sans with real listing
  counts. `/api/marketplace/home` now returns `types`, grouped on the public
  `type` label so a count can never disagree with the page it links to. The
  field gained a stable `aria-label`, an icon-only submit on narrow screens,
  and a suggestions listbox offering this browser's recent searches or popular
  queries. A new `useStoredString` hook wraps `localStorage` in
  `useSyncExternalStore` with an empty server snapshot.
- Rebuilt the header's controls: a proper language button with a globe and
  `lang`, a visible and `aria-current` active route, a dismissible
  announcement persisted against an announcement id, a theme toggle named by
  its destination, Sign in and the language switch added to the mobile menu,
  and a blinking terminal caret in the logo. `buttonVariants` carried
  `focus-visible:outline-none` with no replacement, leaving every button with
  no visible focus; it now draws a ring. One `<header>` landmark now wraps the
  strip, the bar and the menu.
- Newsletter success and failure are separate states with distinct roles;
  failure keeps the typed address and names the cause. The form still never
  reports "already subscribed", preserving the API's non-enumerable 202.
- Fixed two bugs found while working rather than reported: the how-it-works
  panel decided from `entries` alone, so a step still inside the observer band
  that had not re-fired could never win and the panel could lag behind the
  reader; and Tailwind's display utilities out-specify the user-agent rule for
  `[hidden]`, which would have rendered both browse tab panels in a browser
  (jsdom applies no stylesheet, so no DOM test could see it).
- Phone widths: per-step panels below `lg`, snap-scrolling collection cards
  below `md`, hero chips hidden below `md`. Performance: the hero halo's
  `blur-3xl` conic gradient became three radial gradients, removing the last
  full-surface raster pass from an element that rotates with the cursor.
- Also repaired cp1252 mojibake in four files and added `plan.md` to
  `.gitignore` as session scratch.
- Verification: root `typecheck` clean across all three workspaces; 201 tests
  passing (136 API, 15 Blog, 50 web — 27 of the web tests are new, covering
  the retry notice, browse tabs and their URL round-trip, search scoping and
  suggestions, newsletter states, header route/announcement/theme behaviour,
  and the process panels); `apps/web` lint clean; API, web and Blog production
  builds; `git diff --check` clean. Contrast was computed in oklch→sRGB and
  sampled across the full gradient in both themes at rest and mid-decode.
  Still outstanding and not runnable in this environment: Lighthouse and axe,
  so the plan's numeric Performance ≥ 90 / Accessibility ≥ 95 targets and the
  375px browser walkthrough remain unverified. Preloading the display serif on
  the LCP element would need the fonts moved to `next/font/local` and was left
  for a deliberate change.

## 2026-09-21

- Expanded public marketplace search across multi-term listing metadata, tags,
  creator profiles, categories, approved active communities, platform labels,
  and model compatibility. All discovery sort modes now use a unique product-ID
  tie-breaker for deterministic offset pagination. The bilingual discovery UI
  distinguishes unavailable search, loading, filtered-empty, query-empty, and
  catalog-empty states instead of silently converting initial API failures into
  zero results. Verification: all workspace type-checks; 181 tests; web lint;
  API and web production builds; and the Blog webpack production build.

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

- Integrated `origin/main` into `ramtin` and resolved overlapping marketplace creator, listing lifecycle, dashboard navigation, API client, Prisma ownership, and localization changes while preserving both feature sets. Verification: Prisma client generation, root type-check, 102 tests, and production builds for all three workspaces.

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
