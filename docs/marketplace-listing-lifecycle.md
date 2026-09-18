# Marketplace Listing Lifecycle

Marketplace review state and public availability are intentionally separate. A
listing can be `submitted`, `changes_requested`, or `rejected` while `published`
remains true because the last approved snapshot must stay public until a new
proposal is approved and published.

## States and snapshots

The controlled states are `draft`, `submitted`, `changes_requested`, `approved`,
`published`, `rejected`, `suspended`, and `archived` at the API boundary. The
database stores their uppercase enum equivalents and an integer
`lifecycleVersion` for optimistic concurrency.

`MarketplaceListingSnapshot` is an immutable review unit. A version 1 snapshot
must link the exact validated manifest snapshot and normalized release manifest
for the same product. That binding prevents a creator from satisfying source
verification with one release and submitting another. Existing rows receive a
version 0 legacy snapshot during migration so the current public catalog has an
explicit approved baseline without inventing a modern manifest.

`approvedSnapshotId` identifies the public baseline. `proposedSnapshotId`
identifies the creator's current draft or review candidate. Approval locks the
candidate in the `approved` state; publication atomically promotes that exact
candidate to the approved pointer and clears the proposal. Draft editing must
create a new immutable snapshot instead of updating an old one.
The publication transaction revalidates that candidate and projects its
approved listing, category, compatibility, installation, permission, and
license fields into the current public product record.

Creators create and revise drafts through these owner-scoped endpoints:

- `POST /api/marketplace/creator/products`
- `GET /api/marketplace/creator/products/:id/draft`
- `PUT /api/marketplace/creator/products/:id/draft`
- `GET /api/marketplace/creator/products/:id/releases`
- `POST /api/marketplace/creator/products/:id/source-check`
- `GET /api/marketplace/creator/provider-connections`
- `PUT /api/marketplace/creator/provider-connections/:provider`
- `DELETE /api/marketplace/creator/provider-connections/:provider`

The update payload includes `expectedVersion`; stale saves fail with
`409 LISTING_VERSION_CONFLICT` before a snapshot is written. Each successful
save creates new manifest, normalized release, listing snapshot, community
placement request, and `DRAFT_SAVED` audit records. Published listings keep
their approved snapshot and public projection while the replacement draft is
edited. Public version responses include only versions linked to a release
whose `publishedAt` timestamp is set, so draft release metadata is not exposed.
The creator release workspace at `/creator/listings/:id/releases` shows the
immutable source identity, moderation status, and acquisition count for each
release. Preparing a new release starts from the listing's controlled draft
editor and requires a new version label whenever published release metadata
changes.

Completed acquisitions store the exact approved release-manifest identifier
selected at acquisition time. Publishing a newer version updates the listing's
public approved snapshot but never advances existing acquisition records.
Database triggers require acquisition releases to be published releases of the
same listing and prevent mutation of published version identity, release source,
installation data, compatibility, permissions, requirements, and type-specific
details. Legacy acquisition rows may remain without a release identifier; new
acquisitions fail safely when a listing has no modern approved release.

Suspension and archival set `published` false and retain both the previous state
and previous public-availability value. Reinstatement or restoration returns to
that exact state. Suspension is a staff action; voluntary archival does not
erase approved data, events, acquisitions, or review history.

## Transitions

Creators can submit, withdraw, archive, and restore only their own listings.
Submission requires a proposed snapshot whose linked release has both source
resolution and ownership verification timestamps and a current `verified`
source-check state. The source worker resolves immutable GitHub commits/release
assets or exact npm versions, records append-only check results, retries
transient failures with bounded backoff, and periodically reconciles published
releases. A transient failure marks an existing publication `stale`; confirmed
ownership loss or identity mismatch marks it `restricted` and blocks new
acquisitions without rewriting its stored provenance.

Marketplace moderators and administrators can request changes, approve,
publish, reject, suspend, reinstate, archive, and restore. Staff cannot moderate
a listing owned by their own reader account. Change requests, rejection, and
suspension require a bounded public-safe reason. Publication and reinstatement
recheck the exact release's source and ownership state.

The transition endpoints are:

- `POST /api/marketplace/creator/products/:id/lifecycle`
- `POST /api/marketplace/moderation/products/:id/lifecycle`

Every request includes `action` and `expectedVersion`. A stale version returns
`409 LISTING_VERSION_CONFLICT`; clients must reload rather than retrying against
unknown state. Successful responses return the incremented version and a unique
correlation ID.

All state changes and their audit event are written in one transaction under a
listing-scoped PostgreSQL advisory lock. `MarketplaceListingLifecycleEvent`
records actor type and user, previous/resulting states, action, reason code,
public-safe reason, optional private staff note, snapshot, timestamp, and
correlation ID. Standalone private notes use the `INTERNAL_NOTE_ADDED` action
without changing listing state or lifecycle version. Database constraints bound
private notes, while triggers make snapshots and events append-only and enforce
same-listing snapshot, manifest, and release references.

The staff workspace is available at `/moderation`. Its queue defaults to
submitted and approved listings, supports bounded search and state filters, and
shows source and ownership readiness without fetching external artifacts. The
snapshot preview renders stored text only, provides listing decisions and
standalone internal notes, and includes the append-only audit trail. The APIs
are restricted to marketplace moderators and administrators:

- `GET /api/marketplace/moderation/queue`
- `GET /api/marketplace/moderation/products/:id`
- `POST /api/marketplace/moderation/products/:id/notes`

Listings owned by the acting staff account are excluded from its queue. Preview,
notes, and decisions also reject self-moderation on the server. Private notes
are selected only by the staff preview and are never returned by creator or
public product APIs. Marketplace roles still grant no Blog editorial access.

The creator form uses the same strict manifest validator as the API before
setting a proposal. Source resolution and ownership verification are performed
as a separate authenticated ingestion step and remain required before
submission.

## Seed behavior

On a fresh database, seed products are created privately and then published
through a system-owned legacy snapshot and lifecycle event. Seed reruns no longer
overwrite lifecycle-managed listing fields. Updating seeded catalog content now
requires an explicit proposal/approval workflow or a deliberate reset process,
not a silent seed upsert.
