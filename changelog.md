# Changelog

Project changes completed from `pending.md` should be recorded here with the date, a short summary, and any verification performed.

## 2026-11-12 — Correct owner-rejected overview spacing

- Earlier spacing acceptance/completion claim was too broad. Removed stacked
  metric bottom padding/blank helper reservations, tightened label/value and
  section gaps, and matched skeleton spacing. Existing column width now22.5rem.
  No new tokens or unrelated panel redesign.
- Owner screenshot matched before captures: visible metric-to-panel gap4rem;
  after1.625rem across24 EN/FA/theme/viewport/empty/populated cases, no overflow
  or page exceptions. Eight error/Retry/loading contexts also inspected.
- Added rendered gap/baseline regression (failed before;16 full-suite passes,
  plus48 repeated passes). Full run exposed an error-focus race from earlier
  polish: focus could run before its hidden step committed. Reproduced in a
  repeated run; moved error focus after commit and avoided heading-focus conflict.
- Root typecheck/build/943 tests pass/54 existing skips. Final affected web checks
  pass/573 tests; lint retains two warnings. Final production focused browser96
  pass/14 duplicate skips. Full suite before focus correction603 pass/52 skip/
  11 fail: reset2/search2/budgets4/reporting2/focus1. Reporting failures recur in
  repeats; no test/budget weakening. Nine Lighthouse runs pass; detector[].
  The error-focus case also passes20 concurrent repetitions after correction.
- Fresh independent review accepts only the overview spacing correction for
  local owner review, not all polish/release. Surface brief/backlog preserve the
  correction; old release failures, physical-device/other-engine and owner visual
  acceptance remain open. All work local; concurrent changes and normal dev
  services preserved. [Before/after screenshots, changed files and exact limits](docs/artifacts/overview-spacing-2026-11-12/report.md).

## 2026-11-12 — Implement reviewed UI polish P01–P07 locally

- Unified applicable field/step completion and Next/final-save checks, normalized
  optional blank scalars, and added adjacent localized feedback/first-error focus
  with native disclosure opening and server-path mapping. Server field errors
  also mark the step Needs attention and block unchecked Next until correction.
- Kept four freely navigable steps and partial Save for later. Required essentials
  are visible; optional groups retain native details/summary. Completed number
  badges use existing blue, current/error states stay separate, and phone labels
  remain visible. Review shows its summary/edit links directly. Saving still
  creates an account draft; submission remains a separate action.
- Aligned narrow creator setup/editor framing, simplified empty-studio guidance,
  removed static metric hover and redundant Quick-action boxes. Existing tokens,
  rem sizing, sidebar/mobile tabs, auth, ticketing and concurrent header/global
  edits are preserved. No API/schema/dependency change.
- Root typecheck/build and943 unit tests pass/54 existing API skips. Final affected
  web checks pass/573 tests; lint has two existing warnings. Final production
  browser run:54 functional checks pass/14 duplicate cases skip; with budgets,
  58 pass/20 skip/two dashboard budget failures at172.9/170kB. Four focused server
  error cases pass after reproducing/fixing the stale completed-step state.
- Full suite before that final editor-state fix:584 pass/52 skip/10 fail (reset2,
  hero search2, budgets4, staff queue2). Staff cases pass isolated; product budgets
  pass the final fixture rebuild. Full suite remains red; no weakened assertions,
  skips or budgets. All nine Lighthouse runs pass; scoped detector returns[].
- Independent visual review accepts the scoped refinement; system comparison
  needs no new tokens. EN/FA, both themes, phone/tablet/desktop/short/200% zoom,
  drafts and errors checked using isolated established fixtures. Physical devices,
  other engines and owner visual acceptance remain open. PRODUCT.md baseline
  drift is reported without unrequested repair.
- Shared changelog/brief changes were planned before edits. Temporary fixture
  stopped; owner's web/API services untouched. No stage/commit/push/deploy or
  extra checkout. [Changed files, screenshots and precise checks/limits](docs/artifacts/ui-ux-polish-2026-11-12/report.md).

## 2026-11-12 — Stop header/sidebar scroll-anchoring feedback

- Reproduced raw scrollY crossing80 during the header's own height animation:
  one scroll to81 produced33 reversals in2.5 seconds, with sidebar offsets following.
  Header scroll state now excludes measured header-height deltas from scroll
  distance. Condensation, expansion, animation and native sticky behavior remain.
  Initial height fallback reuses existing header-chrome dimensions, avoiding the
  initial100/101 mismatch. No dashboard content/layout redesign or scroll reset.
- Changed header.tsx/globals.css plus focused header unit/browser regression.
  Dev rAF/CDP traces:33 transitions before, one intentional transition after;
  final header/sidebar58 and no remaining height oscillation. Public production
  header also exhibited the original loop. Initial exact recording state unknown.
- Root typecheck/build and926 tests pass/54 skip; header16 pass. Production-browser
  regression10 pass/two duplicate cases skip: five routes, hard refresh, client
  navigation, delayed hydration, EN/FA, both themes, phone/tablet/desktop. All nine
  Lighthouse runs pass unchanged assertions. Lint retains two existing warnings;
  detector reports existing global typography/pattern flags, no new ignores.
- Physical devices/other engines and existing full-suite failures remain open;
  full suite was not rerun. No commit/push/deployment or unrelated edits.
  [Evidence and precise limits](docs/artifacts/navigation-stability-2026-11-12/report.md).

## 2026-11-12 — Review UI/UX polish backlog before implementation

- Owner requested reviewing `docs/ui-ux-polish-backlog.md` and recommending a
  better approach first. Updated that existing document with verified findings
  and the suggested order; no application changes in this review.
- Two isolated design/contract assessments plus a fixture browser confirmed
  metric hover at zero inset, unchecked Next, required fields inside additional
  details, optional serialization and completion-policy differences. Disclosure
  toggling alone did not change completion. Current editor has four steps.
- Recommend validation/normalization and inline errors first, native disclosures,
  blue completed-number badges with visible labels, then existing-container and
  review-summary refinements. Preserve draft semantics, tokens/rem, navigation,
  ticketing and unrelated concurrent header edits.
- Scoped detector clean; controlled English/light desktop pass had no browser
  exceptions. Other locale/theme/device states and full gates await implementation.
  Temporary fixture stopped; owner dev servers untouched. [Review evidence](docs/artifacts/ui-ux-polish-review-2026-11-12/report.md).

## 2026-11-12 — Add owner-requested desktop support navigation

- Added localized Support tickets with Lucide Ticket to the existing desktop
  sidebar. Links to My tickets, marks nested ticket routes active, and retains
  the in-page staff inbox switch. Sidebar styling and mobile tabs are unchanged.
  Updated the plan/brief to record the owner's explicit scope change.
- New navigation regression covers EN/FA, member/staff, nested routes and
  unchanged mobile items. Scoped the verification-screen assertion to main now
  that its support link also exists in the sidebar.
- Root typecheck/build pass; 925 tests pass/54 skip; lint has two existing
  warnings. Focused browser30 pass/two native-zoom duplicates skip. Nine
  Lighthouse runs pass unchanged assertions; Impeccable has no findings. Four
  locale/theme/member/staff captures inspected. Prior full-suite reset/search/
  budget failures remain unresolved; the full suite was not repeated here.
- All changes local. Did not restart the owner's dev servers; independently
  started web/API processes were left untouched. [Evidence and files](docs/artifacts/ticketing-sidebar-2026-11-12/report.md).

## 2026-11-12 — Local text support release; original v.3 sidebar retained

- Implemented `docs/support-tickets-plan.md` Tasks 2–3: member list/create/thread,
  verified marketplace staff inbox, replies, resolve/reopen, bounded history,
  scoped filters/counts, atomic version conflicts and draft recovery in EN/FA.
  Ticket discovery uses Quick actions/verification; original v.3 sidebar and
  mobile tabs stay intact. Shared/backend surfaces were announced below before
  editing; the owner explicitly authorized this ticketing phase.
- Included account export/erasure, staff-content redaction, retained private-file
  cleanup/retry and the deletion/write lock. Strict validation, CSRF, rate limits,
  current staff grants and no-store responses remain enforced. Private API errors
  do not log Prisma query arguments/message text. No new uploads or notifications.
- Verified a new additive migration on a disposable DB; backed up normal local
  data before applying the existing featured-field prerequisite and support
  migration. Prior ledger checksums/counts unchanged; real home API now 200.
  The first archived support migration checksum mismatch still needs provenance
  reconciliation before rollout. No normal reset or production work.
- Root typecheck/build pass; 921 tests pass/54 skip. Separately: 18 real PostgreSQL
  support/account checks pass. Lint: zero errors/two existing warnings. Focused
  browser: 22 pass/two mobile zoom duplicates skip. Full browser: 550 pass/48 skip/
  eight existing reset/search/budget failures. Final JS: dashboard172.7/170 kB,
  product169/165 kB, both locales; no weakened gates. Nine final Lighthouse runs
  pass unchanged assertions via externally managed Chrome (Windows cleanup workaround).
- Task 4 review/evidence captured: 48 localhost fixture screenshots, both themes/
  locales at 320/390/768/1440, keyboard/conflicts and native200% zoom. Impeccable
  scan has no findings; independent review's two typography fixes are resolved.
  Manual second-pass code review covered API scoping/state/privacy and UI drafts.
  Physical keyboards/safe areas, owner acceptance and red release gates remain
  open. [Files, screenshots, commands and limits](docs/artifacts/ticketing-release-2026-11-12/report.md).
- No staging, commit, push, deploy or additional checkout. Preserved independent
  header/avatar/rem work, unrelated lockfile changes and the UI-polish intake.

## 2026-11-12 — Restore v.3 sidebar; start the ticketing plan

- Owner aborted the icon rail. Restored the exact v.3 navigation source and
  original nominal desktop width as 15rem; removed rail-only tests/styles and
  reversed its navigation changes. Separate header avatar work, rem preference,
  unrelated lockfile edits and the ticketing plan are preserved. Four local
  locale/theme captures match the original sidebar.
- Completed Task 1's contract/retained-state audit in `docs/support-tickets-plan.md`.
  All four old support tables and migration records remain locally, with zero
  rows. Three SQL checksums match the archive; the first legacy migration needs
  explicit reconciliation before later rollout. No ledger/data changes in Task 1.
  Root typecheck/build and 900 tests pass (44 skips); lint has two existing
  warnings. Browser baseline: 527 passed/46 skipped/nine known-area failures;
  Lighthouse again hits Windows EPERM. Evidence: `docs/artifacts/ticketing-task1-2026-11-12/`.
- **Owner-authorized next phase / shared surfaces announced before editing:**
  build the plan's text-only support loop in web/API. Backend work is outside
  Ramtin's presentation lane because the owner explicitly requests ticketing:
  `apps/api/src/app.ts`, `validation/schemas.ts`, `middleware/security.ts`, new
  support route/controller/access modules, readerAccountController privacy,
  Prisma schema and a new additive migration. Web touches only ticket pages,
  support modules and narrow shell/verification/Quick actions access. No sidebar
  redesign, attachment/alert feature, avatar uploading, production work or push.

## 2026-11-12 — Read-only local/production service comparison

- Live public HTTP/source checks confirm Google and Chatwoot exist in local code
  but are disabled by missing local configuration; production serves both.
  Published catalogs differ: production 47, local 13. Local homepage API returns
  500 (unknown `featuredAt`), while production returns 200. Read-only DB metadata
  confirms the local featured migration is unapplied and its column absent;
  the API process predates the merge and still has a stale Prisma runtime.
- Extension discovers both signed-in tabs but inspection fails; private Network
  panels/identities, exact production SHA and end-to-end OAuth/email/chat were not
  verified. No app/config/data/service changes, migrations, restarts, seeds or
  deployments. Existing work and paused feature queues remain intact.
- Evidence and possible next steps, not executed:
  `docs/artifacts/environment-parity-2026-11-12/report.md`. Research only; no
  application verification suite needed or claimed for this documentation capture.

## 2026-11-12 — Center the desktop rail and use owner-selected navy

- **Owner correction.** Center the complete curved rail vertically in the viewport
  below the measured global header; use scoped `#0B1C3F` in both themes. Flex auto
  margins center it when it fits; non-shrinking content stays scrollable in short
  windows. Existing rem sizing, routes, account control and mobile tabs are kept.
- **Verified.** Root typecheck/build and lint pass (two existing warnings).
  Twenty focused browser cases pass, including all twelve real 200% zoom cases;
  twenty project-specific skips. EN/FA × light/dark localhost captures measure
  zero centering offset and exact RGB(11,28,63). Short-window keyboard access,
  reduced motion, tooltips, rem scaling and contrast pass (inactive icons at least
  3.05:1, focus at least 3.24:1). Impeccable CSS scan has only its static-scan
  limitation; rendered checks are separate. Lighthouse again stops on Windows
  profile-cleanup EPERM. The full unit/browser suites were not repeated for this
  CSS-only correction; prior results and unresolved failures remain in earlier entries.
- **Handoff.** Local evidence: `docs/artifacts/dashboard-sidebar-centered-2026-11-12/`.
  Only scoped CSS, geometry regression and surface brief changed beyond this
  shared log. No staging, commit, push, deployment, account/upload implementation
  or change to unrelated work. The member identity/upload queue stays for next session.

## 2026-11-12 — Sidebar correction, rem preference and header identity

- **Owner correction / local only.** The first rail was not visually accepted.
  Fit the S-shouldered silhouette to the menu, using existing blue selection and
  surface tokens without changing their values. Remove both desktop Profile icon
  and bottom avatar; Profile remains reachable in the shared header dropdown and
  unchanged phone tabs. No commit, push, deployment, checkout or migration.
- **Header identity.** `account-menu.tsx` reuses Avatar and the existing owned
  public-profile endpoint: existing image URL, otherwise first/last public-name
  initials, with Persian and single-word support and stale-account protection.
  ReaderUser has no public-name/image fields: missing public profiles show `?`,
  not email initials. Actual uploads, ordinary-member names and update refresh
  are queued in ignored `ramtin-pending.md` for the next session, not implemented.
- **Units / documented agreement.** After explaining the existing mixed
  documentation, saved the owner's rem preference in Codex's global instructions
  and `apps/web/DESIGN.md`. Rail width is `5.25rem`, icons `1.375rem`; tooltip
  geometry is converted to rem. Relative layout units and unitless SVG coordinates
  remain appropriate. The dashboard surface brief records the moved Profile
  access. Shared changelog records the handoff; Claude configuration is untouched.
- **Checks.** Root typecheck/build, 906 unit tests (44 skips), lint (two existing
  warnings), all 12 real 200% zoom scenarios pass. Full browser run: 534 passed,
  54 skipped, ten failures. Two were test selectors matching both header/content
  Profile links; scoped to the header and rerun successfully with all 14 focused
  browser cases. Eight other failures remain in password reset, hero suggestions
  and JS budgets: dashboard 173.2/170 kB, product 169/165 kB (previous rail baseline
  172.9 and 168.6). Lighthouse again stops on Windows profile-cleanup EPERM.
  No tests/budgets/ignores weakened. Impeccable: no changed-source flags; 20
  unchanged header/content cramped-padding flags in rendered snapshots.
- **Evidence / next session.** EN/FA, both themes, desktop/short/phone, focus,
  tooltip, existing-image rendering, rem scaling and account-switch evidence:
  `docs/artifacts/dashboard-sidebar-followup-2026-11-12/review.md`. Manual diff
  review; unrelated lockfile edits and the ticketing draft are preserved. Owner
  visual and real-account/device acceptance remain open. Next: member identity
  and image uploads from the local queue; Tickets remain deferred.

## 2026-11-12 — Local dashboard icon rail

- **Scope / shared surface.** Owner requested a focused desktop sidebar redesign
  on `ramtin`, with no commit/push/deployment. Application changes stay in
  `dashboard-nav.tsx`, new `dashboard-rail.module.css` and the shell's 84px desktop
  grid column. This shared changelog records verification only; the navigation
  data, permissions, mobile tabs, Publish helper, global header, search,
  notifications, authentication, public pages and token values remain unchanged.
  Existing local lockfile edits and the untracked ticketing plan are preserved.
- **Result.** Existing surface colors form a mirrored S-shouldered SVG rail, with
  22px Lucide icons, 44px targets, 12px active tiles, distinct Publish and compact
  profile shortcut. One hoverable portal tooltip supplies localized labels,
  keyboard focus and Escape dismissal without scroll clipping. Header-relative
  stickiness, short-window scrolling and immediate reduced-motion feedback remain
  usable. No dependencies or Tickets work added.
- **Verified.** Root typecheck/build, 900 unit tests (44 skips), lint (two existing
  warnings), six focused browser checks and all 12 real 200% zoom scenarios pass.
  Full Playwright: 534 passed, 52 skipped, eight pre-existing failures (password
  reset, hero suggestions, four JS budgets). Dashboard JS is 172.9/170 kB versus
  172.2 baseline; product stays 168.6/165 kB. Lighthouse again stops on Windows
  profile cleanup `EPERM`; budgets/tests are unchanged. Impeccable finds no changed
  source anti-patterns; two captured pages retain 20 unchanged header/content
  cramped-padding findings. Local fixture captures cover EN/FA, both themes,
  desktop/400px-height/phone, focus and tooltips; icon/focus/text contrast passes.
- **Evidence / acceptance.** Local report and screenshots:
  `docs/artifacts/dashboard-sidebar-2026-11-12/review.md`. Real accounts/devices,
  assistive technology and owner visual acceptance remain open. Manual diff
  review; no additional checkout, staging, commit, push or deployment in this task.

## 2026-11-12 — Merge v.3 into ramtin

- **Owner request.** Complete the existing pull from `v.3` (`ab28807`) into
  `ramtin`. Accept the incoming versions of `apps/web/styles/globals.css` and
  this changelog for both conflicts, then add this verification record. Preserve
  the automatically merged local search-focus regression. No application edits
  beyond the requested merge; local `package-lock.json` edits and the untracked
  `docs/support-tickets-plan.md` are excluded from the commit.
- **Shared surfaces.** The incoming merge includes Prisma schema/migration,
  web types/translations, `pending.md` and this changelog. These are named in
  the merge commit body. No pending-queue item was implemented in this task.
- **Verification.** Root typecheck, root production build and all 894 unit tests
  pass (44 skipped); web lint passes with two existing warnings. Prisma client
  types refreshed; generation reported a Windows engine-DLL replacement lock
  from the running API. No database migration was applied. Manual merge review
  confirms zero unmerged paths, incoming CSS unchanged, and only the local
  search-focus test plus this record differ from the incoming tree.
- **Open push gates.** Playwright: 527 passed, 46 skipped, 9 failed. Failures:
  password-reset navigation (desktop/mobile), empty catalog filter recovery,
  search-suggestion expectations (desktop/mobile), and four JS budgets:
  dashboard 172.2/170 kB and product 168.6/165 kB in EN/FA. Lighthouse stops on
  Windows temporary-profile cleanup `EPERM`. Budgets and tests remain unchanged.
  Evidence: local `docs/artifacts/merge-v3-*.log` (not committed). Push requires
  passing gates or an explicit owner exception; no exception assumed.

## 2026-11-11 — Installation is public: anyone can install a release without an account

- **Owner decision.** Installing no longer requires an account or a library entry. This reverses "Public catalog
  responses omit actionable installation instructions" in `docs/marketplace-listing-lifecycle.md`; that doc and
  `docs/product-direction.md` are updated.
- **Shared surfaces (announce in commit body):** `apps/web/lib/types.ts` (`ProductRelease.installation` now carries
  `instructions` and optional `commands`), `apps/web/lib/i18n/product-page.ts` (`installNote`), `changelog.md`. No
  schema or migration change.
- **API.** `findPublicRelease`, used by `GET /products/:slug` and `GET /products/:slug/releases/:version`, now
  returns the moderated installation steps and commands with the method and resolved URL. The fail-closed gates are
  unchanged: published listing, published release, available source status, trusted GitHub/npm URL; otherwise the
  release is `null` or 404. `GET /products/:slug/installation` (pinned acquisition, private/no-store) is unchanged.
  Stored commands are re-checked against the manifest's `installCommand` schema on the way out of both endpoints,
  and malformed entries are dropped.
- **Product page.**
  - A primary *Install vX* button works for everyone and opens the install dialog for the release being inspected,
    including an older version chosen in the picker.
  - *Add vX to library* is now a separate secondary button. Signed-out visitors are sent to log in, as before. For a
    reader who already has it, the button becomes a link to the library: *In your library · vX*.
  - Library entries stay pinned. A reader opening a listing they hold sees the picker switch to their library
    version, so the page's facts and *Install* agree, and installs it as *Install acquired release*. Picking another
    version installs that version's public release. When the listing has no public release left, the pinned one
    still installs.
  - Library state is keyed by account, so a sign-out or account switch never shows another reader's entry. After
    *Add* or `ALREADY_IN_LIBRARY`, the pinned entry is refetched. Lookup failures other than not-held or restricted
    are logged.
  - Adding to the library no longer opens the dialog automatically.
  - The dialog takes a release, so the public and pinned views share one component. It hides the steps heading when
    a release declares no steps.
- **Verified.** Root typecheck. Lint: 0 errors. Unit tests: API 318, web 531, blog 45. Playwright (mock build,
  desktop + mobile): catalog (including a new signed-out install test covering an older version),
  dashboard-library (pinned install), persian, dashboard-capabilities and reporting. The only failure was the
  existing reporting case-ordering test. Rendered EN light at 1280 and FA dark at 375: no page overflow, and Latin
  commands and steps stay left-to-right.
- **Review.** `/code-review` (medium): 9 findings fixed (pinning vs picker, cross-account state, pinned release
  hidden when the newest release is withheld, pinned release not refetched after add/already-held, silenced lookup
  errors, unchecked public JSON commands, the lost fail-closed leak assertion, loose library state). 1 dismissed:
  the extra signed-in `/installation` request per view existed before this change.
- **Existing budget overage, not from this change.** `/products/conversion-copywriter` first-load JS is 168.3 kB gz
  at `a8e25cb` and 168.4 kB with this change, against a 165 kB gate. An earlier pass at `a8e25cb` measured the page
  before it was ready. The gate stays at 165 (ratchet); the overage needs its own fix.
- **Not done.** Anonymous installs are not counted (acquisitions still are). Native Persian review of the new strings.

## 2026-11-11 — Profile settings: one section at a time, settings as summary rows

- **Scope / shared surfaces (announce in commit body).** `changelog.md` only. No API, schema or `lib/i18n/` change. The
  route stays `/dashboard/settings`; it is now wrapped in `Suspense` because it reads `?section=`.
- **Sections.** The 4,589 px scroll (desktop, creator persona) becomes five sections shown one at a time: Profile,
  Account & security, Notifications, Connections (creator role only) and Data & privacy. The section is URL state
  (`?section=account|notifications|connections|privacy`; Profile has no parameter, and unknown values fall back to it).
  `SettingsNav` is a sticky icon rail from `lg` and a sideways-scrolling chip row on phones. Links carry
  `aria-current="page"`, and the active chip is scrolled into the row without moving the page. Inactive sections stay
  mounted but `hidden`, so typed input and the single reader-profile request survive switching. Each section now fits
  in roughly one viewport (900–990 px at 1280×900).
- **Summary rows.** New `SettingRow`/`SettingRows` in `settings-panel.tsx`, in two forms: label + current value, or
  label + description for action rows. Forms open on demand under their row, start with focus in the first field,
  have Cancel, and return focus to their trigger on close or save.
  - Creator profile: a summary, opened with *Edit*. `#creator-profile` (the studio link) opens it straight into edit.
  - Email, password, sign-in method and member date share one *Sign-in* panel; *Change* opens each form.
  - Sessions: *This device* and *Other devices* rows.
  - GitHub and npm: rows showing status, with *Connect* opening the token form (help text inside the form).
  - Data & privacy: *Download your data* row, and a *Danger zone* panel with the delete row. The retention and creator
    notes moved into the opened delete form.
- **Onboarding answers removed from Profile (owner decision).** The *About you* panel is gone, and Settings no
  longer requests `/api/readers/onboarding`. The answers are collected once, by first-run `/onboarding`, and can no
  longer be edited anywhere. API and stored data are unchanged.
  - `AccountOnboarding` is now first-run only: its unused Profile edit mode, the `setup` prop and the unused copy
    keys (`profileTitle`, `save`, `saved`) are deleted.
  - The first-run privacy line no longer promises "update them anytime in Dashboard → Profile". It now says the
    answers are private and only used to suggest a starting point, in both languages.
- **Deep links updated** to land on their section: the release-manager and studio "connect source" links go to
  `?section=connections`; the email-change confirmation link and the post-reset redirect go to `?section=account`.
- **Implementation note.** The unlayered `* { border-color }` reset in `globals.css` outranks Tailwind border-colour
  utilities. The nav therefore drops border *width* at `lg` instead of recolouring it.
- **Verified.** Root typecheck. Lint: 0 errors (2 existing warnings). Production build. Unit tests: 889/889 with
  `NODE_OPTIONS=--no-experimental-webstorage`; without it, the same three untouched files fail on the known Node 26
  `localStorage` quirk. Playwright (mock build, local Chrome, desktop + mobile): all account-security, -data,
  -preferences, email-change, dashboard-capabilities, dashboard-repairs, context-help, browser-zoom (incl. FA 200%),
  shared-navigation and transport onboarding specs pass (178 + 10). In a wider run, the only failure was the existing
  hero-search suggestion test (homepage, untouched). Rendered by hand in EN/FA, light/dark, at 375/640/1280.
  Keyboard: every chip and opened form keeps its focused control in view, with no horizontal page overflow.
- **Not done.** `lhci` (`/`, `/dashboard` and product pages are unchanged). Native Persian review of the new strings
  (حساب و امنیت، اعلان‌ها، منطقهٔ خطر، …).
- **Review and deploy.** `/code-review` (medium) ran before push; its findings and their dispositions are listed in the
  commit body. Fixed:
  - `#creator-profile` reopened the form after every save; it now opens once per page load.
  - Focus now returns to the row's action after Cancel, Connect or Disconnect (provider connections) and after Cancel
    on delete account.
  - The deletion keeps/creator notes are visible again before the form opens.
  - A sign-out error no longer sits in the non-shrinking action box.
  - The duplicated focus-return code is now one `useReturnFocus` hook.
  - Provider connections uses `SettingsPanel` instead of a hand-built header.
  - Persian "رمز عبور" is used consistently.
  Regression tests cover the first three. Deployed to the termspace box with `/root/DEPLOY-NOTES.md`'s procedure. No API or migration change
  since the server's `44d542e`.

## 2026-11-10 — Profile (`/dashboard/settings`) regrouped, with a section index and one panel frame

- **Scope / shared surfaces (announce in commit body).** `changelog.md` only. No API, route, schema or `lib/i18n/`
  change; new settings strings live in `features/dashboard/account-settings-copy.ts` like the other `account-*-copy.ts`.
- **Structure.** The ten unordered panels are now five groups (`h2`, anchors `#profile`, `#account`, `#preferences`,
  `#connections`, `#data`): Profile (creator profile, profile details), Account (email, account security, sessions),
  Preferences, Connections (creator role only) and Data and privacy (export, then delete). A section index
  (`settings-panel.tsx`) is a sticky column from `lg` and a wrapping row on phones; it marks the current group with
  `aria-current="location"` and uses the global `scroll-padding-top`. The header shows the creator avatar/name/handle.
  `#creator-profile` and `#account-preferences` deep links are unchanged.
- **Panels.** One frame (`rounded-card`, `p-5 sm:p-6`, `h3` + description) replaces the mix of square and rounded
  boxes. Save/error status sits beside its button. Email shows the current address; its change form opens from
  *Change email address* and closes after the link is sent. Delete account keeps its explanation visible and opens the
  confirmation from *Delete this account…*; confirmation and re-auth logic are untouched. Sign out moved into a Sessions
  panel next to *Sign out other devices*. Creator profile: name and handle side by side from `sm`, live avatar preview
  (same GitHub-host pattern as the server). Password fields stay open. Preference switches no longer wrap below their
  label. Provider connections use the shared `Input`.
- **Removed.** The Explore / Open Studio link row under Profile details in Settings: the dashboard sidebar and tab bar
  already carry both. The `/onboarding` setup flow is unchanged.
- **Verified.** Root typecheck (after `prisma:generate`), lint (0 errors), production build. Web tests: all settings,
  account, dashboard and onboarding suites pass. Failing files are outside this change: `header`, `console-search` and
  `creator-draft-editor-ui` (the known Node 26 `localStorage` quirk). Playwright (desktop + mobile, mock build, local
  Chrome): 503 passed. Every settings, account, email-change, security, preferences, browser-zoom and studio deep-link
  spec passes. Failures outside this change: the hero-search suggestion test; `reporting` case ordering; and the
  `/dashboard` 170 kB first-load budget at 172.2 kB. Settings code is in none of `/dashboard`'s seven first-load
  scripts, so that overage comes from the `main` merge. Rendered by hand: EN/FA, light/dark, 375/768/1280. No
  horizontal overflow; every index link lands under the header and is marked current; opening *Change email* focuses
  the new-address field.
- **Not done.** `lhci`; native Persian review of the new group labels (پروفایل، حساب، تنظیمات، اتصال‌ها، داده‌ها و حریم
  خصوصی، نشست‌ها); `/code-review` before push.

## 2026-11-09 — Homepage featured shelf, controlled from moderation

- **Scope / shared surfaces (announce in commit body).** New migration `202611090005_marketplace_homepage_featured`,
  `apps/api/prisma/schema.prisma`, `lib/types.ts`, `lib/i18n/moderation.ts`, `changelog.md`, `pending.md`.
- **What.** The homepage shelf was always empty because nothing could set `featured`. The moderation preview now has a
  "Homepage shelf" section: *Feature on homepage* / *Remove from homepage*. `POST /moderation/products/:id/featured`
  (moderator or administrator; not on one's own listing; stale-page guard on the listing version; only a published
  listing can be featured, any featured one can be removed; repeating the current state is a no-op with no event).
- **Audit and order.** `FEATURED` / `UNFEATURED` lifecycle events are written with the change. `featuredAt` orders the
  shelf, most recently featured first, three shown. Creator dashboards do not list these events.
- **Search focus follow-up.** The first fix did not show a focus cue: the unlayered `* { border-color }` reset in
  `globals.css` beats every Tailwind border-colour utility (site-wide, left as is). Search bars now use one
  `.search-field:focus-within` rule that turns the field border primary.
- **Verified.** typecheck, lint (0 errors), API tests (318) and web tests incl. new featured tests.

## 2026-11-09 — Search bars: one quiet focus state, no invented suggestions

- **Scope / shared surfaces (announce in commit body).** `lib/i18n/home.ts` (removed `typedIntents`, `popularSearches`), `changelog.md`.
- **Focus.** The global unlayered `:focus-visible` outline beat Tailwind's layered `focus:outline-none`, so every search
  field drew a square outline inside its own ring and border. All search fields (home hero and band, 404/status page,
  dashboard, explore, library, moderation, design showroom) now use `focus-visible:outline-none!` and let the field's
  own border turn primary; the extra `ring-2` is gone. The general `Input` still has its ring (not a search bar).
- **Suggestions.** The "Popular searches" list was invented copy. Removed; only the visitor's own recent searches
  (stored in their browser) are offered, and nothing opens when there is no history.
- **Verified.** typecheck, lint (0 errors), production build (utility emitted with `!important`), web tests 517 pass
  (the one `creator-draft-editor-ui` storage failure is the known Node 26 quirk).

## 2026-11-09 — TermBuddy mascot and optional creator avatar

- **Scope / shared surfaces (announce in commit body).** New migration `202611090004_marketplace_creator_avatar`,
  `apps/api/prisma/schema.prisma`, `lib/types.ts`, `lib/api.ts`, `lib/i18n/creator.ts`, `changelog.md`.
- **Mascot.** `public/brand/termbuddy.svg` (+ 512/1024 PNG): a terminal-window face (prompt chevron and cursor-block
  eyes, antenna caret) on the signal-blue tile, built from the brand's rounded blocks. Checked at 32 px and circle-cropped.
- **Creator avatar.** `MarketplaceCreator.avatarUrl`, optional, GitHub image hosts only (same hosts as listing icons,
  enforced by zod and a DB CHECK). `PATCH /creator/profile` accepts it (omit = unchanged, `null` = remove); public creator
  payloads include it; account deletion clears it. `Avatar` lays the image over the initials, so a failed load
  leaves the initials and nothing shifts. Settings form gains a URL field (EN/FA).
- **Chat.** `deploy/chatwoot/set-avatar.rb` attaches the picture to the Termbuddy agent bot and both website inboxes.
  Separate from `bootstrap.rb` so a re-run never resets the admin password.
- **Deployed 2026-11-09.** Backup `/opt/backups/pre-avatar-20261109-135334.sql.gz`, migration `202611090004` applied,
  api/web rebuilt; `termbuddy` creator row set to the commit-pinned raw GitHub URL; `set-avatar.rb` attached the picture to
  the Termbuddy bot and both inboxes. Checked live: creator page, listing cards and the chat widget header show the mascot.
- **Verified.** typecheck, API tests (310), lint (0 errors), production build; web tests pass except
  `creator-draft-editor-ui` "browser storage fails", which spies on `Storage.prototype` and does not exercise this
  change (Node 26 localStorage quirk). e2e/lhci not run: no markup changes unless an avatar URL is set.

## 2026-11-09 — Second TermBuddy batch: 13 developer tools and skills

- **Scope.** `scripts/seed-termbuddy/listings.json` and `preview.md` only; no app code, no shared surfaces.
- **Listings (all third-party, link-only, submitted as TermBuddy, awaiting Approve + Publish):**
  impeccable, mattpocock-skills, ponytail, ui-ux-pro-max, caveman, marketingskills,
  scientific-agent-skills, planning-with-files, openspec, openai-codex, cline, claude-mem, awesome-copilot.
- **Honesty.** Descriptions state caveats from upstream READMEs (claude-mem sign-in/analytics/cloud sync,
  caveman installer behaviour, marketingskills optional account connections). Repos without tagged
  releases use a `snapshot-2026-11-09` version label.
- **Not included.** Gemini CLI (README says enterprise-only now) and Trail of Bits skills (CC-BY-SA) pending owner decision.
- **Verified.** `validate.ts`: 47 manifests valid; every `installation.commands` entry is an exact substring of the
  project's README; pilot submit then batch: 13 new listings in state SUBMITTED, 0 failures.

## 2026-11-09 — Per-OS install commands in the installation dialog

- **Scope / shared surfaces (announce in commit body).** New migration
  `202611090003_marketplace_install_commands`, `apps/api/prisma/schema.prisma`,
  `lib/types.ts`, `changelog.md`, `pending.md`. Manifest v1 gains an optional
  `release.installation.commands` (not a version bump: optional, strict, absent
  means none). Web: install dialog, creator editor field, moderation preview.
- **Dialog.** Each command is a read-only mono field with a Copy button
  (`CopyBlock`, now with a `wrap` option), grouped by macOS/Linux/Windows/Any with
  the reader's own system pre-selected. The dialog also moved off hardcoded amber
  and the inverted foreground block onto the design tokens (`rounded-card`,
  `warning` role, a plain copy field for the source link) and shows readable
  source-status labels instead of the raw enum.
- **Seed.** 37 commands on 24 listings, each checked as an exact substring of the
  project's own README before use; unverifiable ones were dropped (Figma, GitHub MCP,
  `claude-plugins-official` placeholder). Applying them needs the API deployed
  first (production's manifest schema is still strict).
- **Verification.** Migration applied to a scratch database through the full chain,
  no Prisma drift, trigger covers the new column. API 309 passed; web 515 passed
  with the Node 26 localstorage flag, 1 known environmental failure; typecheck,
  lint and build clean; e2e 515 passed. Remaining e2e failures are the pre-existing
  budget and reporting ones, a shared-navigation timeout and a creator-profiles
  canonical-link race that both pass alone. Visually checked at desktop and 375px,
  dark theme only. Usage metrics unavailable.
- **Deployment (2026-11-09).** `254dbd4` on the VPS after a gzip-verified dump
  (`/opt/backups/termspace-pre-cmds-20261109-131501.sql.gz`); `api` and `web` rebuilt,
  `202611090003` applied through the `migrate` service, all services healthy, site
  routes 200. The owner had meanwhile published all 34 listings, so the 24 seeded
  command sets are **not applied yet**: a published release is immutable and the API
  refuses edits under the same version label (`VERSION_ALREADY_PUBLISHED`). The live
  installation endpoint was not exercised (it needs a reader who added a release).
- **Commands applied (2026-11-09).** The 24 listings were resubmitted as new releases
  through `revise.mts`: the real upstream version for Context7 (4.6.0) and Todoist
  (14.0.1), a `snapshot-2026-11-09` label for projects without releases (the README
  was re-read that day; `wshobson-agents` already had that label, so it is
  `snapshot-2026-11-09+catalog.2`), and `<version>+catalog.2` with a "catalog update
  only" release note for the rest. Previous versions stay public until each new one
  is approved and published; 24 listings await review. Not covered: `github-mcp-server`
  (no verified command; unchanged).

## 2026-11-09 — Remove the permissions row from listing cards

- **Scope.** `apps/web` presentation only (`TrustStrip`, both cards, card copy, two
  tests) plus `changelog.md`. Owner-requested: seeded listings declare paragraph-long
  permission text that blew up the card. Cards now show Review and Licence; declared
  permissions stay on the detail page. The red "Not declared" card mark is gone with
  the row, so an unreviewed listing is no longer flagged for undeclared access on the card.
- **Verification.** Typecheck, lint (0 errors), card unit tests (11) and
  `e2e/catalog.spec.ts` (51 passed) green. Not yet deployed. Usage metrics unavailable.

## 2026-11-09 — Seed catalog, platform registry expansion, listing icon, Chatwoot CSP

- **Scope / shared surfaces (announce in commit body).** `apps/api/prisma/schema.prisma`,
  new migrations `202611090001_marketplace_platform_expansion` and
  `202611090002_marketplace_listing_icon`, `apps/web/lib/types.ts`, `changelog.md`,
  `pending.md`. Also `apps/web` presentation (product card, compact card, title
  block, creator editor, moderation preview) for the icon, and
  `deploy/chatwoot/bootstrap.rb`. Owner-requested; nothing here deployed yet.
- **Seed.** `scripts/seed-termbuddy/` (validate, submit, preview, 34 listings, all
  `external_link` + credited third-party author). 34 submitted to production via
  the public API as TermBuddy; 1 published by the owner, 33 await Approve/Publish.
  Resumable state file is git-ignored.
- **Platforms.** Registry gained Aider, Amp, Cline, GitHub Copilot, OpenCode,
  Windsurf, Zed, with a migration that inserts the platform rows and one community
  each (idempotent; applied cleanly through the full chain on a scratch DB).
- **Icon.** Optional `listing.icon` in manifest v1, limited to
  `avatars.githubusercontent.com` / `raw.githubusercontent.com` (Zod plus a DB
  CHECK on `MarketplaceProduct.iconUrl`). Rendered by `ProductIcon`: decorative,
  `referrerPolicy="no-referrer"`, fixed box (no layout shift), initials tile on
  absence or load failure. The moderation preview shows it; copy and docs state it
  is the one exception to "stored text only".
- **Chatwoot CSP.** `allowed_domains` was newline-separated, but Chatwoot splits on
  commas, so `www.termspace.dev` became an invalid `frame-ancestors` directive.
  Bootstrap now uses a comma list and repairs existing inboxes on rerun. Not yet
  applied to the live Chatwoot (needs the bootstrap rerun on the VPS).
- **Verification.** Root typecheck clean; API suite 308 passed / 44 DB-integration
  skipped; web 511 passed with Node 26's `--localstorage-file` flag, 1 environmental
  failure (storage-failure test spies on jsdom `Storage.prototype`); lint 0 errors;
  build OK; Lighthouse CI assertions pass; e2e 518 passed. Visually checked EN/FA
  (RTL), both themes, 360px. Bootstrap.rb not run (no Ruby locally).
  **Unresolved:** the first-load JS budget already fails at `HEAD` (dashboard 171.6
  vs 170 kB, detail 167.5 vs 165 kB); the icon adds about 0.7 kB to each. The
  reporting e2e spec fails when the desktop and mobile projects share one mock API
  and passes alone; also pre-existing. Usage metrics unavailable.
- **Deployment (2026-11-09).** Pushed `59e9a01` to `v.3`; the VPS checkout
  fast-forwarded. Pre-change dump `/opt/backups/termspace-pre-icon-20261109-112539.sql.gz`
  (gzip-verified). Built `api` and `web`, ran the `migrate` service (both migrations
  applied), restarted api, web, scheduler, email-worker and source-worker, all
  healthy. Read back 16 platforms and 13 communities; the public products API
  returns `iconUrl`; no errors in api/web logs. The widget now answers with
  `content-security-policy: frame-ancestors termspace.dev www.termspace.dev`.
  Seeded listings carry no icon yet; the 33 submitted ones still await review.

- **Seed revision (2026-11-09).** `scripts/seed-termbuddy/revise.mts` withdrew, re-saved
  and resubmitted 26 submitted listings with the new platforms and GitHub org
  avatars as icons (individual maintainers keep the initials tile). Platform
  claims come only from each project's own README or install guides (and the
  agents.md site for `agents-md`): 34 compatibility entries across 15 listings,
  plus matching community placement requests. 24 icon URLs checked as 200 images.
  `github-mcp-server` is published and its listing is unchanged: the API refuses
  `VERSION_ALREADY_PUBLISHED` metadata edits without a new version label and
  upstream is still v2.1.0.

## 2026-11-06 — Grant owner-requested production marketplace administrator access

- **Scope / shared surface.** Production role operation and `changelog.md` only;
  the owner explicitly designated the existing reader account. No pending queue
  item or application implementation changed.
- Granted `administrator` through the deployed `manageMarketplaceRole` command
  after verifying that reader `cmw4zntio000iqt01721efw22` is verified, not deleted,
  and had no active marketplace grants. The command atomically saved the role
  and its append-only `GRANTED` event under actor `ops:codex-owner-request`.
- **Verification.** Read back exactly one active `ADMINISTRATOR` grant and its
  audit event, correlation `703742c8-f9df-430e-80e1-6a9e4c69b052`. Marketplace
  middleware reloads active grants on each request; refresh the website to
  refresh client-side session identity. Separate editorial access was not granted.
  Application checks from `23dd023` still cover the unchanged implementation;
  this operation was verified against the live database. Usage metrics unavailable.

## 2026-11-06 — Finish Termbuddy AI replies and delivery recovery

- **Scope / ownership notice.** Owner-authorized Chatwoot follow-up in
  `deploy/chatwoot/`, `.github/workflows/ci.yml`, `docs/chatwoot.md` and the
  shared `changelog.md`. No corresponding item exists in the other maintainer's
  `pending.md` queue. Merged current `main` into `v.3` first, retained both
  changelog histories and used main's canonical favicon in the merge conflict.
- **AI replies.** Removed the un-awaited async history wrapper that serialized
  the Responses API input as `{}`. The owner supplied the production API key;
  the rebuilt container loads it. Short support answers use `gpt-6-luna` with
  reasoning disabled and `store: false`. OpenAI transient failures get one retry;
  permanent errors get the localized fallback. Missing webhook credentials now
  prevent startup, and signed incoming messages are validated and account-scoped.
- **Delivery recovery.** Incoming work is fsynced before acknowledgment; saved
  answers and deduplication records survive container recreation on the new
  `termbuddy_state` volume. Delivery failures retry without another generation.
  Signed outgoing events reconcile lost HTTP receipts. Health reports missing
  keys, observed upstream/storage failures and old pending jobs. Logs contain
  status, latency and correlation IDs without bodies or credentials. Delivery
  remains at least once because Chatwoot's create-message endpoint has no
  enforced idempotency key; the duplicate window is documented.
- **Backups.** Installed `termspace-chatwoot-backup.timer` on production: daily
  at 03:20 UTC plus up to 10 minutes of jitter, with 14-day local retention.
  Root-only snapshots include database, storage, queue and recovery configuration.
  Restored a fresh snapshot to a temporary database (110 public tables), checked
  the storage archive/checksums and restored queue records to a temporary
  directory. The checks remove only their own temporary restore targets.
- **Verification.** Root typecheck; root tests 858 passed, 44 skipped; web lint
  zero errors and two existing warnings; root production build with
  `IS_WEBPACK_TEST=1` (the installed Next.js webpack-selection flag). The default
  blog Turbopack build cannot bind its CSS-worker port in this environment,
  including an escalated run and user systemd scope; webpack builds all apps.
  Nine dependency-free bot regression tests pass locally and in the deployed
  Node 22 image, including SIGKILL recovery, signed-webhook reconciliation,
  EN/FA fallback, permanent/transient errors and log redaction. CI now runs them
  and checks backup shell syntax. Backup units passed `systemd-analyze verify`.
  Performed the second diff/security pass manually with Ponytail full mode;
  fixed its vendor-event logging finding and verified the regression check.
  This harness does not expose `/usage` metrics.
- **Live UI acceptance.** Real EN/FA AI answers and an English follow-up work
  through the embedded widget. Checked rendered light/dark, EN/LTR and FA/RTL,
  1280/320 px, reduced-motion preference, first-stop skip link and keyboard
  composing. Both inboxes retain conversations on mobile reload; Chatwoot's
  localized Continue conversation action restores the thread from the welcome
  screen. Automatic panel reopening was not added. Used Impeccable's existing
  project/design context for the rendered pass; no web UI implementation changed.
- **Owner-dependent follow-ups.** Choose off-host backup replication and an
  external alert destination. Help-center creation/theming and SMTP/transcript
  email remain product decisions; footer removal remains a paid Chatwoot feature.

## 2026-11-06 - Finish public copy corrections and refresh the local queue

- **Scope / shared surfaces.** Owner requested the changelog refresh and
  `ramtin-pending.md` follow-through. Complete the six confirmed public-copy
  groups from the November 4 review. Shared surfaces: `apps/web/lib/i18n/`
  (`catalog.ts`, `common.ts`) and `changelog.md`. Blog ownership exception:
  `messages/fa.json`, `Hero.tsx`, `ReaderAuthForm.tsx`, `ReaderAccount.tsx`
  and `Comments.tsx`, plus focused tests, for the queued presentation fixes.
  The local queue remains ignored and is never staged.
- **Completed source corrections.** Remove the extra Persian discovery trust
  assurance; name Termspace in the Persian blog hero; send Explore topics to
  the topics directory; name footer Communities/Account links truthfully in
  both locales. Localize four unknown-error fallbacks while retaining specific
  server errors. Announce comment moderation success in the current locale
  for both normal and message-free honeypot responses, without exposing filtering.
  Preserve API/authentication contracts, entered data and #0864D1 submits.
- **Verification.** Focused regressions reproduced the defects before repair;
  all 855 unit/component tests now pass (44 existing integration skips), root
  typecheck and all production builds pass, web lint retains two existing
  warnings. Eight rendered footer variants and four Persian discovery variants
  pass in EN/FA, web light/dark and 320/1280px; screenshots inspected. The
  discovery intro retains its existing phone-hidden behavior. Impeccable reports
  no findings for the changed targets. Full E2E: 527 passed / 46 intentional skips.
  All nine Lighthouse runs pass the unchanged budgets using the existing local
  Windows cleanup preload; no audit/assertion was changed.
- **Queue / prerequisites.** Keep editorial/admin rendered acceptance and
  scoped cache cleanup awaiting the owner choice prompted in this session;
  the queue records earlier automatic approval rejections (blocked by policy).
  No blog fixture launch or rejected cleanup was retried. Port 4100 has no
  listener; remove the stale running-API/PID instruction. Google public client
  IDs are still absent from the app env files and Windows user environment.
  Read-only Prisma status confirms external-link-source and release-review
  migrations remain pending locally; no migration was applied. Physical-phone,
  real-Google and owner Persian-copy acceptance remain open.
- **Evidence / review.** `docs/artifacts/ramtin-copy-2026-11-06/` holds local
  test logs, screenshots and read-only prerequisite evidence. Supersedes the
  unfinished November 4 copy-plan entry; no other-maintainer queue item claimed.
  Manual diff review completed by hand; no new findings.

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

## 2026-11-04 — Termbuddy live chat (self-hosted Chatwoot)

- **Scope / ownership notice.** Shared surfaces: `apps/web/app/layout.tsx`,
  `apps/web/next.config.ts`, `docker-compose.yml`, `.env.example` and
  `changelog.md`. New deployment assets in `deploy/chatwoot/` and the ops doc
  `docs/chatwoot.md`. No API, database schema, permission or auth-flow change.
- **Deployment.** Chatwoot Community Edition 4.19.1 now runs on the production
  host as its own compose project beside TermSpace:
  `chat.termspace.dev` → Caddy → `127.0.0.1:3010`. Only the Rails port is
  published; Postgres (pgvector 16), Redis and the bot are internal. DNS is the
  existing Cloudflare `A chat` record, proxied; TLS is Caddy's certificate.
  Secrets live in untracked `deploy/chatwoot/.env` and `.env.bot` (chmod 600);
  the bootstrap credentials are in `/opt/chatwoot/credentials.env` (root only).
  `SAFE_FETCH_ALLOW_PRIVATE_NETWORK` is enabled because the bot webhook target is
  an internal hostname.
- **Termbuddy instead of Captain.** Chatwoot's built-in AI (Captain) is a paid
  feature, so the bot is a webhook agent bot: a dependency-free Node service
  (`deploy/chatwoot/bot/server.mjs`) that verifies Chatwoot's HMAC signature,
  acknowledges immediately (Chatwoot fails calls at 5 s), keeps its own rolling
  context per conversation (Chatwoot blocks bots from reading conversations),
  and answers through the OpenAI Responses API with `gpt-6-luna`. The knowledge
  pack is `bot/knowledge/en.md` plus `fa.md`; replies mirror the visitor's
  language. With no API key — the case at deploy time — it posts the localized
  fallback that points to support@termspace.dev instead of going silent.
  Attached to two website inboxes (`TermSpace Website (EN)`, `(FA)`) so the
  widget welcome copy is localized; email collection and continuity mail are
  disabled. No human agents are configured.
- **Web integration.** `components/support/chat-widget.tsx` (with tests) loads
  the Chatwoot SDK after hydration with `afterInteractive`, passes the locale and
  launcher name, and renders nothing when the website tokens are absent (local
  dev and previews). The website tokens are read from runtime env
  (`CHATWOOT_TOKEN_EN`/`CHATWOOT_TOKEN_FA`, `CHATWOOT_BASE_URL`) so rotation does
  not need a rebuild. The availability banner is overridden to say Termbuddy is
  online 24/7, because Chatwoot's default presence copy assumes human agents, and
  the panel follows the site's light/dark toggle. The report-only CSP now allows
  `chat.termspace.dev` for scripts, connections and frames. The bot and both
  inboxes carry the TermSpace mark as their avatar, and `INSTALLATION_NAME` /
  `BRAND_NAME` are set to TermSpace in Chatwoot's installation config.
- **Verification.** Root typecheck; web lint 0 errors (two pre-existing
  warnings); 503 web tests (`NODE_OPTIONS=--no-experimental-webstorage`, needed
  because Node 26's global `localStorage` shadows jsdom's); production web
  build. Live stack: `/api` 200, `/packs/js/sdk.js` 200, TLS through
  Cloudflare; both inboxes exercised end-to-end (anonymous contact →
  conversation → incoming message → signed webhook → bot reply) with correct
  English and Persian fallback text.
- **Remaining acceptance.** The owner must add `OPENAI_API_KEY` to `.env.bot`
  and restart `termbuddy` for real GPT-6 Luna answers — until then every chat
  gets the fallback copy. The embedded widget was verified in Chrome at 1280 and
  320 px, EN and FA, light and dark: the launcher opens, messages send, and the
  fallback reply arrives in the conversation; the panel follows the site theme
  and the availability banner reads "online 24/7". Still open: help-center
  portal theming and a decision on SMTP/transcript email. Chatwoot's footer
  shows "Powered by TermSpace" through `BRAND_NAME`; removing the line entirely
  is the paid `disable_branding` feature and was not circumvented.


## 2026-11-04 — New navbar mark and favicon

- **Scope.** `apps/web/components/layout/logo.tsx`,
  `apps/web/components/layout/header.tsx`, `apps/web/app/icon.svg`,
  `changelog.md`. No copy, navigation or layout change.
- **Navbar.** The global header replaces the text wordmark and caret with the
  owner's `t|` mark in its rounded dark tile, 32px. Fixed brand colours
  (`#1A1823`, `#F4F3F8`, `#2051CE`) mean it reads the same on paper and on the
  dark ground. The link keeps `aria-label="termspace home"`. The footer keeps
  the text wordmark, and `Logo` gains a `mark` concept without changing `pure`,
  `cursor` or `block`.
- **Favicon.** `app/icon.svg` is the modular block mark. It is wrapped in the
  same dark rounded tile and scaled 1.4x about the centre: the supplied mark
  uses near-white shapes, which disappear on light browser tab strips. The
  owner may prefer the transparent version; it is a one-line change.
- **Verification.** Web typecheck; lint zero errors (two pre-existing warnings);
  header tests 15 passed; production build. Deployed v.3 at `55942de`. Live:
  32x32 mark in the header at 1280 and 320, light and dark, English and Persian
  RTL, no console errors; `/icon.svg` serves the committed asset byte for byte.

## 2026-11-04 — Google sign-in wears the site's button

- **Scope / ownership notice.** Shared surfaces: `apps/web/lib/i18n/common.ts` and
  `changelog.md`. Presentation only in `features/account/google-sign-in.tsx`,
  `features/account/account-form.tsx` and `features/dashboard/account-data.tsx`.
  No API, schema, permission or credential-flow change.
- **Problem.** Enabling Google exposed its own iframe button: `outline` is a white
  slab with 4px corners and Roboto; `filled_black` adds a white logo tile. Neither
  can sit in the Paper & Signal system, and the 320px cap made it narrower than
  the form.
- **Behaviour.** The visible control is now the site's secondary `Button` (12px
  radius, 44px, Geist, bordered surface, hover and focus ring) with Google's
  official multicolour G and localized copy: "Continue with Google" /
  «ادامه با گوگل». Google's iframe still opens the popup and returns the same
  credential; it is pinned invisibly over the button. It must stay at
  `opacity: 0.001`, not `0` — Chrome does not deliver clicks to an opacity-0
  iframe. Its inline width/margin are re-pinned on the next frame and on load.
- **Notes.** The register and login modes share one label; the heading already
  says which action the account takes. The blog keeps Google's own button until
  that app is deployed.
- **Verification.** Root typecheck (after `prisma:generate`, which the pulled
  schema required); web 499 tests; lint zero errors (two pre-existing warnings);
  production build. Deployed v.3 at `985f1a2`. In Chrome at 1280 and 320px,
  light and dark, EN and FA: the button matches the design tokens, no console
  errors, and the iframe covers the control so top, bottom, left, right and
  centre clicks all open Google's popup. Only the clipped 12px rounded corners
  fall outside the clickable shape, matching what is painted.
- **Remaining acceptance.** A real Google account sign-in is still the owner's
  check (verification, onboarding redirect, `emailVerified`).

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
