# UI remediation — 2026-11-03

Owner authorized sequential execution of the complete 42-group audit. Preserve
Paper & Signal in web and the blog's warm editorial identity. Editorial admin
remains explicitly English-only; Persian public pages remain supported (owner
confirmed). No new dependency, auth permission, data migration or product feature
is planned. `main` was fetched and integrated before implementation; the newer
listing editor/auth/release-review behavior takes precedence over stale audit
locations. Preserve pre-existing icon/brand edits.

Audit evidence is local under `docs/artifacts/ui-audit-2026-11-03/`. This plan is
the durable checklist; mark findings complete only with current-source and
appropriate automated/rendered evidence. Source risks require verification.

Current state: all 42 original audit groups plus the additional B23 field-boundary
finding have implementation repairs. Phase checkmarks below track source work;
the final acceptance checklist separately tracks verification. Root typecheck,
844 unit/component tests (44 integration tests intentionally skipped), web lint
(zero errors, two existing warnings) and production builds have passed. Final
web E2E passed (527 tests, 46 intentional skips). Lighthouse passed all unchanged
budgets across nine runs: performance 96/94/96 and accessibility 100/100/100 for
home/dashboard/product. Its Windows Chrome cleanup EPERM required an ignored,
task-scoped deferred-cleanup preload; audit/measurement failures still fail.
Editorial native-modal
focus and authenticated phone rendering remain pending: automatic approval review
rejected the loopback fixture server launch with only "blocked by policy".
The owner's approval question remains open; no alternate launch was attempted.
Final cleanup was also automatically rejected. Read-only inventory confirms
Chrome profiles are gone; the D: task Node cache and disposable API on 4100 remain.
Keep the API isolated to loopback; close it after the preview/acceptance decision.

## Finding dispositions

These are source dispositions, not a claim that every route/state combination
was manually viewed. Tests, source review and rendered evidence are separate.

| ID | Repair / evidence scope |
| --- | --- |
| W01 | Discovery toolbar uses the measured header offset; browser hit-test regression. |
| W02 | Distinct drawer/sidebar switch IDs and associated labels; component/browser checks. |
| W03 | Stronger light input token and blue hover; calculated boundary contrast 3.04–3.23:1. |
| W04 | RTL checked thumb translation; 320px EN/FA browser containment checks. |
| W05 | Stable theme hydration snapshot and accurate destination; unit/browser regression. |
| W06 | Shared Button vocabulary for search, recovery and dashboard actions. Owner update on 2026-11-06: #0864D1 with white text replaces the prior action fill in both themes; the current DESIGN contract takes precedence. |
| W07 | Shared sans/600 editorial and product heading defaults; six-route theme/locale checks. |
| W08 | Restrained sans labels replace terminal-style decorative eyebrows. |
| W09 | Overview and peer-section heading ramps and spacing aligned. |
| W10 | Decorative reveals/lifts/carets/typed search removed; stable-content assertions. |
| W11 | Current simplified creator/moderation frames use existing panel geometry. |
| W12 | Report/newsletter fields use 12px controls and existing surfaces. |
| W13 | Discovery/version/review/dashboard field text uses 16px. |
| W14 | Review, publication and profile feedback use semantic roles. |
| W15 | Review eligibility retry; failed-load/retry component coverage. |
| W16 | Small shared/card/search controls expand on phones. |
| W17 | Product rating receives locale; Persian browser sample uses localized numerals. |
| W18 | Authority/brief metadata and stale motion/weight assertions reconciled. |
| W19 | Search active descendant, arrows, Enter and Escape; keyboard regression. |
| W20 | Community fetch failures reach recoverable error boundary; regression. |
| B01 | Preformatted code resets inline-code background/padding/font inheritance. |
| B02 | Amber hover darkened; white contrast 7.09:1 (normal amber 5.02:1). |
| B03 | Faint text darkened; warm-paper contrast 4.73:1. |
| B04 | Native modal, Cancel focus, busy Escape guard and inline failure; component tests pass, native browser lifecycle pending. |
| B05 | Visible/associated admin field labels and named media selector; accessibility component tests. |
| B06 | Media/taxonomy fields shrink/wrap; authenticated phone rendering pending. |
| B07 | Article/edition actions wrap; authenticated phone rendering pending. |
| B08 | Root skip link and one focusable main; nested main wrappers removed. |
| B09 | Header/filter/admin current state, including edit/new article distinction; navigation tests. |
| B10 | Language navigation preserves query context; navigation regression. |
| B11 | Persian tracking/caps neutralized, logical cover border and mirrored navigation; reduced motion preserves arrow rotation. |
| B12 | Persian prose/headings use Estedad, retaining explicit LTR exceptions. |
| B13 | Shared admin pending lock/feedback, comment duplicate guard and recoverable logout; failure/retry tests. |
| B14 | Bookmark rollback/pressed state, share/copy feedback and cancellation handling; component regressions. |
| B15 | Login omits authenticated workspace chrome; navigation regression. |
| B16 | English-only admin canonicalization preserves destination auth; proxy guard regressions. |
| B17 | Reader navigation says Account in both catalogs. |
| B18 | Native buttons/menu/language targets expanded. |
| B19 | Reduced-motion scroll/pulse/scale/translation handling in CSS and programmatic scrolling. |
| B20 | Invalid article fields reference errors and focus first invalid control; regression. |
| B21 | Edition accent remains decorative; foreground/action contrast uses stable roles. |
| B22 | Localized empty edition/topic/tag/series explanation and browse action. |
| B23 | Added field-only warm neutral border token across 13 blog form files/52 control sites. Normal boundaries are 3.29–3.71:1; invalid article borders are 4.29–4.83:1. Panel/table/decorative borders remain unchanged. |
| R01 | Compact product rail clears measured header by 16px; expanded report flows and scrolls into view so tall forms remain usable. |

Independent Impeccable A/B source reviews found two remaining P2 gaps (admin
article-edit current state and RTL arrows); both were repaired with focused
follow-up. Current detector: 13 web + 2 blog contextual exclusions, not an
accessibility certification. Historical audit count was 14 before the additional
Newsreader Fallback declaration. Existing OG palette, showroom annotations,
font aliases, limited feedback easing and prose blockquote borders are intentional.

## Phase 1 — Shared readable foundations

- [x] W03, W07–W10, W12–W14, W16–W18: web tokens/type/spacing, shared controls,
  retired decoration, public fields/statuses, locale rating and stale assertions.
- [x] B01–B03, B11–B12, B18–B19, B21, B23: blog contrast, code cascade, Persian type,
  reduced motion, targets and safe edition accents.

Files: web `styles/`, UI/hero/sections/product/creator/moderation controls and
related tests; blog `app/globals.css`, `tailwind.config.ts`, edition components
and pages. Acceptance: contrast-safe enabled controls/copy, consistent existing
type/geometry, preserved editorial identity and release-review semantics.
Verification: focused tests/checks, app typechecks, rendered theme/RTL samples.

## Phase 2 — Discovery and account controls

- [x] W01–W02, W04–W05, W19: sticky toolbar, unique accessible mobile filters,
  RTL thumb, hydration-safe theme name and keyboard suggestions.
- [x] W15, W20: recoverable review loading and community request errors.

Files: web discovery, ConsoleSearch, ThemeToggle, review composer and communities
route plus tests. Acceptance: pointer and keyboard paths work at phone/desktop;
failures remain distinct from empty data. Verification: regression tests and
browser interactions; preserve the new account/auth workflow.

## Phase 3 — Editorial dialog and field accessibility

- [x] B04–B07, B20: modal focus lifecycle, associated admin field labels,
  wrapping editor/media/taxonomy actions, connected validation/focus recovery.

Files: blog ConfirmDialog and five callers, ArticleForm, EditionManager,
ResourceManager, TaxonomyManager, MediaManager and focused tests. Acceptance:
named fields, focus containment/restoration, no phone form overflow, usable
validation. Verification: component tests and authenticated fixture rendering.

## Phase 4 — Editorial navigation and locale context

- [x] B08–B10, B15–B17: one main/skip target, current state, preserved locale
  query context, standalone login chrome, explicit English admin, truthful
  reader account navigation.

Files: blog root/admin layouts, header, proxy, login/logout, affected resource/
error wrappers, message catalogs and tests. Acceptance: public EN/FA navigation
preserves context; admin scope is honest without weakening authentication.
Verification: routing/component tests and browser login/menu/skip paths.

## Phase 5 — Editorial mutation and browse feedback

- [x] B13–B14, B22: pending/error/success feedback, reliable bookmark/copy/share
  state, reader logout handling and explained empty collections.

Files: blog Comments, ArticleEngagement, ReaderAccount, admin managers/revisions,
browse pages and tests. Acceptance: prevent duplicate pending writes, retain
entered data on error, announce relevant outcomes and expose recovery.
Verification: focused success/failure tests and fixture-driven browser states.

## Phase 6 — Reconcile current workflow geometry

- [x] W11 and remaining W09/W12/W14: current creator/editor/moderation frames
  and peer-section spacing; preserve the newly simplified editor.
- [x] R01: measure product rail/header offsets; fix only if current geometry
  demonstrates overlap or an unsafe fixed offset.

Files: existing workflow primitives and product rail; browser fixtures as needed.
Acceptance: current ready/error states fit and clear global/mobile chrome.
Verification: long content, focus, phone/tablet/desktop and scroll hit tests.

## Final acceptance and handoff

- [x] Every W01–W20 and B01–B23 finding has a recorded disposition/evidence.
- [x] Root typecheck, all tests, web lint and all production builds pass.
- [x] Full web E2E and Lighthouse pass with unchanged budgets; repair stale
  selectors/assertions without suppressing genuine behavior or visual failures.
- [ ] Render relevant screens/states in EN/FA, web light/dark and 320/768/1280px.
  Blog retains its established light/editorial system.
- [x] Run Impeccable detector and independent review; assess findings in context.
- [x] Update DESIGN implementation-gap summary and changelog to match evidence;
  do not claim physical-device, real-provider or real-screen-reader testing.
- [ ] Commit explicit owned paths only, retaining pre-existing brand edits;
  push completed reviewable phases on `ramtin`, never merge into `main`.
