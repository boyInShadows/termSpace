# TermSpace ticketing implementation plan

Updated 2026-11-12 · CLI handoff · ticketing only

## Goal and scope

Build a polished private support experience: members create a ticket, follow the conversation, reply and resolve it; support staff work from a shared inbox. Improve the earlier draft's visual detail and implementation acceptance while preserving TermSpace's existing Paper & Signal identity.

The owner selected Pinterest model #3 for the ticketing direction: spacious, separated ticket rows with clear hierarchy. Use that layout idea with TermSpace's own typography, colors and controls. The subsequently generated combined concept was rejected and is not a design reference.

**Do not redesign the sidebar, change its geometry, positioning or animation, or reorganize mobile navigation.** Keep the global header and dashboard layout. Owner follow-up on 2026-11-12 authorizes one localized Support tickets entry with the existing Lucide Ticket icon in the desktop sidebar; mobile tabs stay unchanged. Do not resume the separate member identity/avatar-upload queue.

This document replaces the previous draft in this file. It is a plan, not a claim that ticketing already works. The Desktop copy remains an older input.

## 1. Baseline and implementation boundaries

Work in the sole checkout: `D:\coding\Projects\TermSpace\termSpace`.

Before implementation:

- Read project AGENTS.md, relevant pending items, changelog.md, apps/web/DESIGN.md and the dashboard surface brief. Use the installed Impeccable skill for design implementation and rendered review.
- Check current branch, HEAD and dirty files. At planning time the checkout was ramtin at a348db5 with existing local dashboard/header work. Preserve all unrelated edits; do not reset or restore old application snapshots.
- Inspect the current ticket-related routes, schema, migration ledger, permissions and account export/deletion code before deciding what to reuse. Old implementation 390c0ac is reference material, especially its privacy tests; do not cherry-pick the whole feature blindly.
- Use existing components, icon library, API/session patterns and validation. Avoid new dependencies, duplicate header controls or a separate ticketing design system.
- Announce shared/backend files and ownership reasons in the phase record/changelog before editing those surfaces. No publishing, production migrations or destructive database reset follows from this plan.

Current-source review found that the dashboard verification gate needs a narrow exception for member support access. Authenticated live-browser review was blocked by the browser bridge; the owner screenshot and inspected source informed this plan. The implementer must verify the real signed-in flow.

## 2. Product contract

| Area | First-release behavior |
| --- | --- |
| Member access | Any signed-in member, including an unverified member, can create and read their own tickets. |
| Staff access | Verified marketplace administrators and moderators can use the support inbox. Blog editorial roles alone grant no support access. |
| Member flow | My tickets → New ticket → Conversation. |
| Staff flow | Support inbox → Conversation → Reply or Resolve. Staff retain a separate My tickets view. |
| Categories | Technical problem; Listing or submission help; General question. |
| Form | Category, subject and message. No priority, assignee or attachment fields. |
| Conversation | Private text messages, visible authorship, timestamps, explicit status and resolve/reopen actions. |
| Existing chat | Leave Chatwoot unchanged. Do not imply chat messages and tickets synchronize. |

Exclude attachments, email/bell alerts, assignment, internal notes, SLAs, AI responses, live updates and analytics from this release. Do not show nonfunctional controls for them.

Suggested routes, adapted to the repository's existing locale routing:

- `/dashboard/tickets` — My tickets.
- `/dashboard/tickets/new` — New ticket.
- `/dashboard/tickets/[ticketId]` — Member conversation.
- `/dashboard/tickets/inbox` — Staff inbox.
- `/dashboard/tickets/inbox/[ticketId]` — Staff conversation.

Use the existing locale mechanism for Persian, not a second route implementation. Reserve static new/inbox routes so they cannot be treated as ticket IDs.

For discovery, use **Support tickets** in dashboard Quick actions and, per the owner's follow-up, the desktop sidebar. Ticket pages have their own Back to tickets/New ticket controls. Preserve sidebar styling and phone tabs. Unverified members must also have a working support link from their verification screen.

Staff see a local **My tickets / Support inbox** switch within ticket pages. It must not appear to ordinary members. Hiding the switch is not authorization.

## 3. Visual specification

### Shared visual language

Use existing paper/background, surface, border, muted text and action tokens in both themes. Preserve the current blue primary action and navy identity. Reuse Geist/Estedad and the project's type scale. Do not recolor the application from the Pinterest reference.

Use rem for new fixed interface dimensions. Start with existing card/control radii, approximately 1rem panels and 0.75rem controls where those match the established components. Keep borders subtle and shadows restrained.

Ticket pages need a clear title, a short supporting sentence and one primary action. Avoid a large empty hero, decorative charts, fake response-time promises or a row of invented KPI cards. The overview screenshot's loading error is not a spacing reference.

### My tickets

- Heading: **Support tickets**. Supporting text: “Track your requests and continue conversations with our team.” Primary action: **New ticket**.
- Under the heading: status filters **All**, **Waiting for support**, **Waiting for you**, **Resolved**. Show counts only when returned from correctly scoped server data; never treat an API failure as zero.
- Provide ticket search by subject or ticket reference, plus a category filter. Put shareable filters/search/pagination in the URL. Reset pagination when filters change.
- Render a vertical list of separated surface cards, not a dense spreadsheet. Each row shows subject as the strongest text, ticket reference, a short last-message preview, category, status and last activity.
- Initial spacing target: 0.75rem between rows and 1–1.25rem internal padding. Let height grow for content; do not force a clipped single-line subject. Allow two subject lines before truncating the preview.
- Use one semantic link per row. No nested interactive buttons inside the row link. Hover uses the existing subtle border/surface treatment; keyboard focus remains obvious.
- Status is always readable text, optionally with a dot/icon. Color alone must never encode the state.
- Use server pagination and stable ordering, newest activity first. Do not fetch every message just to show a list preview.
- On narrow screens, stack status/time below the subject. Controls wrap or use a clearly scrollable local filter strip; the entire page must not scroll horizontally.

### New ticket

Use a dedicated page with **Back to tickets**, a concise heading and one readable form panel. Keep the form comfortably narrow, around 42rem maximum where the shell allows.

Field order: category, subject, message. Labels stay visible. Helper copy explains what information is useful without requesting passwords, tokens or other secrets.

Proposed shared limits: subject 1–120 characters after trimming; message 1–5,000 characters after trimming. Use matching server/client validation and meaningful localized errors. Reconcile with any retained contract before introducing a conflicting limit.

Primary action: **Create ticket**. Secondary: **Cancel**. On success, open the saved conversation and announce success. On failure, preserve all entered text, show the actual recoverable error and offer retry. Prevent duplicate in-flight submits. Warn before intentionally leaving a dirty form.

### Conversation

Use a focused conversation page, not a tiny modal or an overloaded support console.

- Header: Back to tickets, subject, reference, category and status. Keep metadata visually secondary. Resolve is a secondary action, separate from sending.
- Messages appear chronologically in restrained panels with author, Member/Support role label and localized timestamp. Visually separate the participants through placement or surface treatment that remains readable in dark mode.
- Preserve line breaks, wrap long links/identifiers and render user content safely as text. Do not interpret arbitrary HTML.
- Show resolution/reopening as a small system event in the timeline.
- Composer: a clearly labeled multiline field and **Send reply**. Enter inserts a newline. Do not turn ordinary typing into accidental submission.
- A resolved thread shows a clear banner. The owner sees **Reply and reopen** with an explanation. Staff cannot accidentally reopen it through a normal reply.
- Keep failed drafts in component memory; do not clear them on error, conflict or retry. Clear on successful submission or account change. No persistent storage of private conversations/drafts is required for this release.
- Long conversations must remain usable without loading an unbounded message history. Use the existing pagination pattern; provide Load earlier messages if needed and preserve scroll position.
- On phones, the composer and buttons must clear existing fixed navigation and safe areas, including when the keyboard is visible.

### Support inbox

Reuse ticket-row components at a slightly denser spacing, without creating a second style system. Show requester display name where already available, with a safe “Member” fallback; do not expose email addresses in the list.

Default order: Waiting for support first, oldest unanswered activity first within that group. Other states follow with a documented stable order. Provide the same status/category/search controls, scoped to authorized staff. No assignment, priority or invented unread indicators.

Staff conversations clearly identify the requester and expose staff reply/resolve actions. A staff member opening their own ticket uses owner behavior; prevent self-replies being mislabeled as a support response.

### Required interface states and motion

Implement loading skeletons, no tickets, no matching results, failed list/detail load, sending, failed send, resolved and access-lost states. Distinguish empty data from unavailable data. Error messages should explain the failure safely and preserve a usable retry path.

Use existing motion tokens for short hover/focus/transitions, approximately 120–180ms where no token exists. No bouncing rows, staggered entrances or looping decoration. Honor reduced motion. Announce send/errors/status changes accessibly without stealing focus.

## 4. Conversation state machine

| Event | Actor | Result |
| --- | --- | --- |
| Create with initial message | Signed-in member | WAITING_FOR_SUPPORT |
| Reply to active ticket | Owner | WAITING_FOR_SUPPORT |
| Reply to active ticket | Authorized staff other than owner | WAITING_FOR_MEMBER |
| Resolve active ticket | Owner or authorized staff | RESOLVED |
| Reply and reopen resolved ticket | Owner | WAITING_FOR_SUPPORT |
| Ordinary reply to resolved ticket | Staff | Reject; explain that it is resolved |

Member-facing WAITING_FOR_MEMBER text is **Waiting for you**. Staff-facing text is **Waiting for member**.

Derive owner/staff identity server-side. Do not accept author IDs, ownership or privileged state changes from untrusted request fields. Repeated resolution can safely return the already-resolved result; it must not add duplicate system events.

Save each message and its resulting ticket state atomically. Use a version or equivalent conditional update to detect concurrent writes. A stale request receives a conflict response; the UI refreshes the thread, preserves the draft and asks the person to retry against the current state. Do not silently overwrite another reply/resolution or auto-send preserved text.

## 5. Backend, privacy and lifecycle requirements

Keep the model small: ticket owner, subject, category, status, activity timestamps and concurrency version; ordered messages with author identity/role and text; resolution/reopening events sufficient for the visible history. Reuse existing equivalent schema where valid.

- Owner-scoped authorization applies to list, counts, search, detail and every mutation. Another member's ticket and a nonexistent ticket must be indistinguishable.
- Recheck staff role and verification on every staff request. Revocation takes effect on subsequent requests even if the inbox remains open.
- Permit support access for unverified members through an exact normalized route boundary. Do not relax verification for studio, publishing, moderation or the rest of the dashboard. Signed-out users still authenticate with a safe return URL.
- Preserve session protections, CSRF/origin checks, rate limiting and request/body limits from the API's established patterns. Validate bodies and query params at the boundary; reject unknown privileged fields.
- Private responses remain no-store. Do not log message bodies or include ticket content in public telemetry.
- Include tickets and messages in account export and deletion handling before first-release acceptance. Cover a departing member's own tickets and staff-authored replies on other members' threads.
- Reuse the established erasure/retention policy. Preserve other members' conversations while removing or anonymizing the departing user's personal data as that policy requires. If no policy exists, settle this specific decision before shipping deletion behavior.
- Serialize deletion against ticket writes so a delayed reply cannot recreate erased data.
- Inspect existing applied migrations before adding an additive migration. Test on a disposable database; never reset the normal database or rewrite applied migrations to make tests pass.

## 6. Ordered implementation checklist

The checklist below is the task list for this handoff; keep it here under docs rather than creating duplicate plans.

### Task 1 — Confirm the current contract

**Dependencies:** none.

Likely files: this plan; existing session/verification policy, support-related source and Prisma migration metadata for inspection.

- [x] Map actual reusable components, routes, role helpers, API client and export/deletion paths; record exact implementation targets.
- [x] Confirm retained schema/ledger state, authorization rules and erasure behavior.
- [x] Establish current test/build baseline separately from ticketing regressions.

**Verify:** document the decisions and existing failures. No migration or code restoration during this inspection.

### Task 2 — Build create → list → conversation

**Dependencies:** Task 1.

Likely areas: apps/web/app/dashboard/tickets, a focused apps/web/features/support module, existing dashboard Quick actions/verification entry, API support route/controller/validation, Prisma schema/migration if required. Use actual existing paths when equivalents exist.

- [x] Implement the member screens with the row-based design, real scoped data, pagination and explicit empty/error states.
- [x] Wire create/list/read end to end, with the narrow unverified-member exception and safe sign-in return.
- [x] Add export/deletion coverage for the new persisted member data.

**Verify:** separate verified and unverified owners can create/reopen their saved conversation; unrelated members cannot read/search/count it; invalid and failed submissions preserve drafts. Test navigation and existing verification gates.

### Task 3 — Complete the support response loop

**Dependencies:** Task 2.

Likely areas: the same support feature/API modules, role checks and account lifecycle handlers; focused API and browser tests.

- [x] Implement the staff inbox, member/staff replies and exact resolve/reopen state machine.
- [x] Implement atomic writes, conflict recovery and duplicate-submit protection.
- [x] Cover staff-authored data erasure, revoked access and deletion/write races.

**Verify:** use separate member/admin/moderator sessions plus an editorial-only account. Test simultaneous replies/resolution, failed sends and staff acting on their own ticket. Tasks 2 and 3 together are the complete first release.

### Task 4 — Finish visual and release acceptance

**Dependencies:** Tasks 2–3.

Likely files: support UI/styles, EN/FA dictionaries, relevant tests, dashboard design brief for support-access wording, changelog.md and docs/artifacts ticketing evidence.

- [x] Review all four screens and required states in English/Persian RTL and light/dark themes.
- [x] Test keyboard access, visible focus, labels, status announcements, 320/768/1280-width layouts, wide desktop, short windows and 200% zoom. Use logical spacing properties and isolate Latin ticket references in RTL.
- [x] Run required checks and record precise outcomes; supply screenshots and a short handoff explaining remaining limitations.

**Verify:** root npm run typecheck, npm test and npm run build; npm run lint -w apps/web; npm run e2e -w apps/web; npm run lhci -w apps/web when required by changed dashboard routes. Run focused privacy/state tests during earlier tasks, then the required full gates once integrated. Do not weaken budgets or assertions.

The current changelog records pre-existing reset/search/browser-budget failures and Windows Lighthouse cleanup EPERM. These are historical baseline evidence, not a waiver and not results of this plan. Recheck and distinguish new regressions from existing failures.

## 7. Done means

A real member can submit a ticket, a permitted staff member can find and answer it, the owner can reply, either can resolve, and the owner can reopen. Every step works with error recovery and privacy checks. The visual result follows model #3's spacious ticket rows using TermSpace's existing design, including complete mobile, RTL and dark states.

No production page ships synthetic tickets, fabricated counts or dead controls. The current navigation remains visually unchanged. Existing dashboard errors must be reported honestly; do not hide them or invent data to make a screenshot look complete.

Deliver the local implementation, exact changed-file list, screenshots, test results and any blocked acceptance. Deployment, publishing and migration rollout remain separate owner decisions.

## 8. Execution record — Task 1, 2026-11-12

Owner first aborted the icon-rail experiment. `dashboard-nav.tsx` again matches
`origin/v.3`; the shell uses the original nominal width as `15rem`. Rail-only
code/tests and navigation experiments were removed; separate header-avatar work,
the global rem preference and unrelated local files are preserved. Ticket entry
will use Quick actions and the verification screen, not new sidebar/mobile tabs.

### Verified retained state and contract

- Current source has no active ticket models/routes/controllers. The local DB
  retains SupportTicket, SupportMessage, SupportAttachment and SupportNotification,
  all currently empty, and four finished support migration records. Do not reset
  or drop them. Three archived SQL files exactly match the recorded checksums;
  `202611060001_support_tickets` does not match the inspected Git/artifact copies.
  Preserve that ledger row and record reconciliation before a later rollout;
  never silently rewrite its checksum or blindly restore the archived feature.
- Stored categories/statuses already match this plan. The legacy staff author
  tag is ADMINISTRATOR; public UI must label authorized staff as Support and still
  check current administrator/moderator grants. Storage naming is not authority.
- Reuse `requireReader` for owner routes and
  `requireMarketplaceRole("administrator", "moderator")` for the inbox.
  The latter re-reads active grants and requires verified identity. Editorial
  ADMIN_SESSION_COOKIE alone is insufficient. Recheck live accounts on writes
  under the same transaction lock used by account deletion.
- Current DashboardShell blocks all unverified users. Add only an exact localized
  `/dashboard/tickets` boundary exception; studio/moderation remain gated.
- Adopt this plan's 1–120 trimmed subject and 1–5,000 trimmed message limits for
  new writes. Archived limits were 5–160 and 20–10,000. Preserve historical reads
  and exports without truncation or retroactive validation.
- Current export/deletion omit retained support data. Reuse the archived privacy
  policy: export owned conversations plus only the caller's authored replies
  elsewhere; delete owned tickets; redact authored replies on other owners'
  threads; clean retained private attachments/notifications. Serialize erasure
  with writes so delayed requests cannot resurrect erased personal data.

### Concrete implementation targets

| Responsibility | Targets |
| --- | --- |
| Retained models / additive reconciliation | `apps/api/prisma/schema.prisma`, a new uniquely dated migration; never edit applied rows/files |
| Private API / validation | new `apps/api/src/controllers/supportController.ts`, `routes/supportRoutes.ts`, `lib/supportAccess.ts`; existing `app.ts`, `validation/schemas.ts`, `middleware/security.ts` |
| Account lifecycle | `apps/api/src/controllers/readerAccountController.ts`; focused support/privacy tests in `apps/api/src/tests/` |
| Thin localized pages | `apps/web/app/dashboard/tickets/` with static `new` and `inbox` boundaries and both conversation routes |
| Feature views / copy / request types | focused modules in `apps/web/features/support/`, new `apps/web/lib/support-api.ts` reusing existing `request` |
| Access / discovery | `dashboard-shell.tsx`, `quick-actions.tsx`, `features/account/email-verification.tsx`; no sidebar changes |
| Existing UI primitives | `components/ui/button.tsx`, `input.tsx`, dashboard-card/error conventions, locale helpers and theme/motion tokens |
| Regression coverage | API authorization/state/privacy tests; web form/guard tests and fixture-backed E2E in established test directories |

### Rechecked baseline before ticket implementation

Root typecheck/build and 900 unit tests pass (44 skipped); lint has zero errors
and two existing warnings. Full browser run: 527 passed, 46 skipped, nine failures
in reset/search/budgets/empty-filter behavior. Lighthouse again stops on Windows
profile cleanup EPERM. Original sidebar visually checked at localhost:3000 with
existing fixtures in both locales/themes; nominal width is 15rem. Evidence:
`docs/artifacts/ticketing-task1-2026-11-12/`.

Task 1 changed no API code, schema, migration ledger or database data. The owner
then requested continuation. Current phase: the text-only member/staff support
release (Tasks 2–3), followed by the integrated acceptance in Task 4. Use a
disposable test database for schema/privacy verification; back up and guard any
necessary local additive schema work. No production operation, commit or push.

## 9. Local delivery — Tasks 2–4, 2026-11-12

Member and staff flows are implemented under the five routes above. The API at
`/api/support` exposes owner list/create/detail/replies/resolve and equivalent
`/inbox` staff reads/mutations. Every request authenticates; inbox authority is
verified marketplace administrator/moderator membership, never an editorial
cookie. Owner paths include unverified members. The dashboard exception matches
only the exact normalized tickets boundary; ordinary member verification and
staff API checks remain enforced elsewhere.

Lists use 20-row server pages, scoped counts/search/category/status and stable
ordering. Inbox enum order is waiting for support, waiting for member, resolved;
each group sorts oldest activity first, then ID. Conversation pages fetch the
latest 20 timeline entries and explicitly load earlier entries. A cursor must
belong to the same visible ticket. New writes use 1–120/1–5,000 trimmed limits;
historical reads/exports retain their full text.

Message/state writes share an atomic transaction and version check. Repeated
resolution adds no duplicate event. Owner replies reopen; ordinary staff replies
cannot reopen; staff-owned requests retain owner behavior. The UI preserves
failed/conflicting drafts, refreshes conflicts without auto-sending, warns on
dirty link/unload navigation and supports cancellable Chrome history traversal.
Browser Back cancellation was tested in Chrome; older/non-cancellable traversal
and physical device keyboards/safe areas are not claimed as verified.

Export includes owned timelines, only self-authored content on other threads,
and scoped retained notification metadata. Erasure deletes owned tickets,
redacts authored content elsewhere and removes retained private files after
commit. Writes and erasure share the retained advisory transaction lock.
Failed file removal is logged without private content and can be retried with
`npx tsx src/jobs/cleanupSupportImages.ts` from `apps/api`; the job removes only
unreferenced UUID.webp files older than an hour in the private support directory.
No upload, attachment-download or alert feature was restored.

### Database work and operating limits

- Tested the complete current migration chain and support/privacy behavior on a
  guarded disposable localhost PostgreSQL database, never by resetting the normal
  database.
- Added `202611120001_support_text_release`: creates the retained table baseline
  when absent and adds timeline kinds without rewriting old records/checksums.
- Backed up the normal local database to
  `docs/artifacts/database-backups/before-support-1794472796074.dump`, then applied
  the already-pending homepage featured-field migration and this support migration.
  Existing user/creator/product/ticket/message counts and prior ledger checksums
  remained unchanged. The real local home API now returns 200. No environment file
  or production database was changed.
- The first legacy support migration checksum discrepancy from Task 1 remains
  unresolved. Reconcile historical migration provenance before rollout; never
  reset the normal DB or rewrite its ledger to make migrate-dev accept it.

### Verification and acceptance

- Root typecheck/build pass; 921 unit tests pass, 54 database-gated tests skip.
  Separately ran 10 support and eight existing account/onboarding tests on real
  disposable PostgreSQL; all 18 pass. Lint has zero errors/two existing warnings.
- Final focused browser suite: 22 pass, two duplicate mobile zoom cases skip.
  Covers both locales/themes, ordinary/staff flows, draft recovery, keyboard
  navigation/Back cancellation and real 200% zoom in a short desktop window.
- Full browser suite: 550 pass, 48 skip, eight failures in existing reset/search
  and four JS-budget checks. Dashboard EN/FA is 172.7/170 kB (baseline 172.6);
  product EN/FA is 169/165 kB (same baseline). Budgets/tests were not weakened.
- Final Lighthouse: nine runs across three URLs pass unchanged assertions, using
  externally managed Playwright Chrome to avoid Windows profile-cleanup EPERM.
- Forty-eight localhost:3000 screenshots cover list/form/thread at 320, 390, 768
  and 1440 widths, EN/FA and both themes using established fixtures. No horizontal
  overflow or browser exceptions; composer reachable. Staff inbox/recovery states
  additionally exercised in browser tests. Impeccable detector returned no findings.
- Independent finish review found two typography deviations; both corrected and
  scored resolved. Its final `ship` disposition covers those two fixes, not owner
  approval or release-gate acceptance.

Checks are performed, but release acceptance remains open for the eight browser
failures, migration-history reconciliation and physical-device/owner review.
Everything stays local and uncommitted. Exact changed files, screenshots and
logs: [local handoff](artifacts/ticketing-release-2026-11-12/report.md).

### Owner follow-up: desktop sidebar entry

The owner subsequently requested Support tickets in the side navigation too.
Added the existing localized title and Lucide Ticket icon to the desktop list,
pointing to `/dashboard/tickets` and retaining its active state on nested ticket
routes. Staff access the inbox through the existing local switch. The shared
navigation hook explicitly keeps this entry out of phone tabs. No sidebar
geometry, colors, spacing, other destinations or permissions changed.
See [follow-up evidence](artifacts/ticketing-sidebar-2026-11-12/report.md).
