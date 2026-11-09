# Private support tickets

Approved by Ramtin on 2026-11-06. This is private staff support, available to
every signed-in marketplace member, including members awaiting email verification.
Only existing marketplace administrators may read other members' tickets or reply
as staff. Editorial administrators and marketplace moderators receive no access.

## Flow

`/support` lists the member's tickets and offers a new-ticket form. Categories
are Technical problem, Listing/submission help and General question. Subject and
message are required. Creation and member replies set Waiting for support.
Administrator replies set Waiting for you for members and Waiting for member
for staff. Either participant may resolve a
ticket; a member reply reopens it. `/support/admin` is the shared staff inbox.
No assignment, public discussion, internal notes, live chat or email delivery in v1.

Screenshots accept PNG/JPEG/WebP: three per message, 5 MiB each, 10 MiB combined.
The API decodes and re-encodes images, stores them outside public media and checks
ticket access on every download. Notifications have individual read state and
omit private message content. Existing moderation notifications must keep working.

## Ordered implementation

1. Private creation and viewing: additive schema/migration, strict API validation,
   owner-scoped reads, English/Persian pages, account/dashboard/footer links.
2. Shared administrator inbox, private replies, resolve/reopen transitions and
   optimistic concurrency. Failed submissions preserve the draft.
3. Private screenshot storage, previews, validation and failure cleanup.
4. In-app notifications, unread counts and existing bell integration.
5. Account export/deletion, authorization/privacy regression tests, responsive
   accessibility/recovery checks and release documentation.

Each increment is verified before advancing. Root typecheck/tests/build, web lint
and browser E2E gate publication; applicable Lighthouse budgets remain unchanged.
New migrations are additive and never replace existing migrations. Deployment
must apply ticket migrations; unrelated deferred migration work remains separate.

## Ownership and shared surfaces

The approved support flow requires Ramtin's agent to work in API routes,
controllers, validation and Prisma, beyond the usual presentation lane. Shared
surfaces are `apps/api/src/app.ts`, `apps/api/prisma/schema.prisma`, new migration
directories and `changelog.md`. Feature API/types and copy stay in dedicated
support modules. Authentication/provider flows and blog permissions stay separate.
