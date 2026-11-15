# Dashboard follow-ups

Captured 2026-11-15 from the owner's four requests. Planning only; these features
are not implemented by this update. Ramtin's checklist stays in the Git-ignored
`ramtin-pending.md`; this file preserves the requirements in Git.

## 1. Ticket notifications in the global header

- Add one notification bell to the existing global top navigation. Ticket answers
  and staff-initiated messages give the recipient an unread notification.
- Show the requested **#0755B2** dot at the bell's top right when unread events
  exist. Preserve the separate #0864D1 submit/action color. Include an accessible
  unread label; color alone must not convey state.
- Link each event to its private conversation. Persist per-user read state;
  opening the bell should not silently mark every conversation read. Support
  mark as read/all as read, failure/retry and account-switch isolation.
- Investigate existing marketplace notifications first; reuse their delivery,
  permissions and read state where suitable. Keep private content out of public
  responses, analytics and logs.

Suggested content (proposal, not additional approved features):

- Start with ticket replies, new staff messages and resolution/reopening.
- Each row: event label, ticket subject/reference, safe short preview, sender role,
  timestamp and unread state; its action opens the relevant conversation.
- Consider existing listing moderation decisions, changes requested and actionable
  release/source-check failures next. Keep promotions out of this operational inbox.

Acceptance: recipient isolation, no duplicate/self-reply alerts, unread state
survives reload and clears correctly, plus empty/loading/error/retry states and
keyboard dismissal on desktop/mobile.

## 2. Staff-initiated member messaging and ticket attachments

- For verified marketplace moderators/administrators, replace personal My tickets/
  New ticket emphasis with a staff inbox and **Send member message**. Ordinary
  members retain ticket creation and their private inbox/conversations.
- Staff can select a member and initiate a private ticket-style conversation.
  The member receives it in their inbox and the same bell, can reply and use
  normal ticket lifecycle actions. Preserve history, status, resolve/reopen,
  pagination, version conflicts and failed-draft recovery.
- Include in-app notifications/messages and transactional email delivery. Confirm
  delivery triggers and existing preferences before implementation; reuse the
  email worker with failure/retry handling. Email contains a safe summary and
  authenticated conversation link. Replies by email and bulk campaigns are
  outside this request.
- Add attachments to ticket creation and replies for members/staff. Inspect
  existing support-image/storage and account-lifecycle paths first. Define allowed
  types, count/size limits, server content validation, private authorized downloads,
  removal before sending, upload-error recovery, orphan cleanup and account
  export/erasure/retention behavior. Never execute or publicly expose uploads.
- Enforce current marketplace staff grants on every staff action; editorial roles
  alone grant no access. Prevent cross-member conversation/file access.

Acceptance: staff-to-member and member-to-staff flows, email retries without
duplicate sends, bell/read state, attachment validation/access/cleanup, revoked
roles and private account export/deletion have regression coverage.

## 3. Profile image upload and editable studio identity

- **Investigate first:** inspect member/creator identity fields, profile endpoints,
  validation, media storage, Prisma schema and migrations. Record what exists and
  whether backend/database changes are necessary before implementing the upload.
  This intake makes no schema finding.
- Add an actual profile image file input, replacing the URL workflow where
  appropriate. Support preview, validated upload, replace/remove, pending/error
  recovery and ownership-scoped storage/serving. Reuse existing upload primitives.
- Show the saved studio name in Creator studio after onboarding and provide an
  edit/save path with validation and failure recovery. The studio image must use
  the same profile image, without an independently editable duplicate.
- Distinguish display/studio name from the creator URL handle; name edits must
  not silently break public links or listing attribution.
- Retain the earlier member public-name requirement: truthful first/last initials,
  including Persian and single-word names, never initials derived from email.
- Refresh header, Profile, studio and public creator identity after successful
  edits; prevent stale identity after sign-out/account switching.

Acceptance: member/creator, initial setup/revisit, name editing, upload/replace/
remove and failed saves work across reloads; studio/profile images stay equal.
Avoid unnecessary schema changes or dependencies.

## 4. Public creator listing search and filters

- On `/creators/[handle]` (the owner's `/creators/[studio name]` URL), remove the
  visible number beside Published listings and add search/filter controls there.
  Retain any internal total required for correct server pagination.
- Search only that creator's published listings. Reuse applicable catalog filters
  such as item type/platform if supported; confirm the smallest useful filter set
  during source investigation without inventing metadata.
- Store search/filter/page in the URL, reset pagination on filter changes, and
  preserve state through locale changes and browser back/forward navigation.
- Preserve public/private boundaries, safe 404 behavior, stable pagination and
  standard catalog cards. Distinguish no published work, no matches and failures;
  offer clear filters and retry where appropriate.

Acceptance: no other creator's/unpublished work appears; search, filter combinations,
clear, pagination and navigation work in both locales.

## Implementation order, ownership and verification

Work one reviewable phase at a time: investigate existing contracts, notification
behavior, staff messaging/attachments, profile/studio identity, then creator search.
These are queued requirements, not authorization to start application work or deploy
in this documentation phase.

Before each implementation phase, name exact files/callers/tests and announce
shared/backend changes and ownership reasons. Reuse Paper & Signal, existing
controls/tokens, Geist/Estedad and rem sizing. The creator surface brief still
references retired Datasheet styling; follow current DESIGN.md and reconcile
that brief during its phase rather than restoring old styling.

Check both themes, EN/FA RTL, responsive/short widths, zoom, keyboard focus and
loading/empty/error states. Run root typecheck/tests/build, web lint/E2E and
applicable Lighthouse gates before shipping UI changes. Preserve existing release
failures, migration provenance and owner/device acceptance separately; this intake
does not certify the current release.
