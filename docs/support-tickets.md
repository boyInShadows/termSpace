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

## Private screenshots

Creation and reply endpoints still accept JSON when there are no screenshots.
With files, send `multipart/form-data`: one `payload` field containing the same
JSON object and up to three `screenshots` file parts. Let the browser set the
multipart boundary. PNG/JPEG/WebP content is decoded, checked against its MIME
type, limited to 16 million pixels and a single frame, resized within 2048 pixels,
then re-encoded as WebP without original metadata or filenames. Limits are 5 MiB
per source file and 10 MiB combined. Creation/reply writes are limited to ten per
authenticated member per fifteen minutes before uploads are buffered.

Files live in `apps/api/private/support`, outside public media. The database and
thread payload contain attachment IDs and dimensions; storage keys are internal.
Member downloads use `/api/support/attachments/:id`; staff use the corresponding
`/api/support/admin/attachments/:id` path. Every read checks current ownership or
administrator access and returns private/no-store with nosniff. The web app uses
the same-origin backend proxy and bypasses the public image optimizer.

Failed writes/stale replies remove prepared files. The hourly `support-cleanup`
service removes only recognized image files older than 24 hours that have no
attachment row. The grace period protects in-flight uploads; database failures
stop cleanup. `npm run support:cleanup -w apps/api` runs the same job manually.
Always use the API's database and matching private directory; never pair a
scratch database with another environment's stored images.
Existing referenced images, fresh files, unrelated files and symlinks are retained.

Before deploying, apply `202611090006_support_attachments`, rebuild the API image
and start `support-cleanup` alongside the API. Both mount the private `api_support`
volume as the existing node user. Back up that volume together with the database;
do not publish it through media storage or an object-storage public bucket.
The Docker build context excludes private files, local environment variants and
generated evidence. Local application builds and scratch-database checks do not
constitute a production deployment.

## Private notifications

Ticket creation, replies and resolution save their alerts in the same database
transaction as the change. Member actions notify current verified marketplace
administrators; staff actions notify the ticket owner. The actor is never notified
about their own action. No support email is sent in this version.

The existing dashboard bell combines support alerts with moderation decisions.
`GET /api/marketplace/notifications` returns at most twelve newest visible alerts
and a total unread count. Existing moderation fields remain unchanged; support
types are `support_created`, `support_message`, `support_reply`, `support_resolved`,
with an opaque `ticketId` and `staff` route flag. Subjects, messages, screenshots,
storage keys and participant identities are absent from support previews.

The existing `/api/marketplace/notifications/read` endpoint marks supplied IDs or
all visible alerts read, scoped to the recipient. Support visibility also checks
current ticket ownership or verified administrator access on each read/update;
revoked staff cannot see or acknowledge former staff alerts. Unverified members
can receive updates to their own tickets. Feed responses are private/no-store.
Apply `202611090007_support_notifications` before starting this API revision.
