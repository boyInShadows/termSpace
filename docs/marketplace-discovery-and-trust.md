# Marketplace discovery and trust

The discovery/community batch was completed on 2026-10-01. The earlier
`pending-audit-2026-10-01.md` records the state before this implementation.

## Public pages

- `/communities` and `/communities/[slug]`: active sharing spaces, localized
  rules, submission guidance, archived states, and approved listings.
- `/creators/[handle]`: public creator information and published collections.
- `/creators/[handle]/collections/[slug]`: one collection's visible listings.
- `/explore`: independent community, platform, model, category, item-type,
  rating, and verification filters. Search includes community names and
  compatibility labels. Every paginated sort has a stable identifier tie-breaker.

Community placement is explicit. Compatibility never grants placement. A
moderator approves a snapshot-scoped request; the approved placement appears
only after that snapshot is published. A new request preserves the placement
for the last approved snapshot until publication. Explicit removal takes effect
immediately. Archived communities and suspended listings disappear from
community discovery without deleting acquisitions or releases.

## Dashboard

- `/dashboard/creator/placements`: owner requests and public-safe decisions.
- `/dashboard/creator/collections`: creator-owned collection selection,
  publication, and unpublication. A collection contains at most 50 owned
  listings; creators can maintain up to 100 collections. Draft and restricted
  items never appear in the public collection.
- `/dashboard/cases`: affected account decisions and appeals, including when
  marketplace access is restricted.
- `/dashboard/moderation/placements`: independent placement decisions.
- `/dashboard/moderation/cases`: reports, severity, investigation, enforcement,
  private notes, and appeals. Administrators can open account cases.
- `/dashboard/moderation/communities`: administrator-only community management.

Product pages accept authenticated reports of listings, releases, placements,
creator profiles, and existing reviews. Reports are bounded, deduplicated per
open target and reporter, and limited to eight per account per hour. Placement
submissions share a twelve-per-hour creator submission limit. Reports do not
automatically restrict content.

Listing restrictions hide only that listing. Release restrictions disable its
acquisition/installation while preserving listing discovery and the library
record. Placement restrictions hide only that placement. Review restrictions
hide that review and recalculate published rating aggregates transactionally.
Creator restrictions suspend publishing privileges; account restrictions suspend
marketplace actions and hide that account's listings. Neither changes Blog
authentication or publishing authority.

Staff cannot decide cases they own or reported. Account decisions require an
administrator. Appeals link to the original decision and retain submitted
evidence. A different moderator reviews them; an administrator reviewing their
own decision must record an explicit private exception rationale. Reversal
requires source and ownership checks performed after the restriction for any
release that would become available again. Audit events, reports, restriction
history, and appeal evidence are preserved by database constraints/triggers.

Review authors remain legacy display strings until the ratings/reviews batch;
those reviews can be reported and restricted, but do not have an authenticated
reviewer who can submit an appeal yet. Creator-response reporting follows the
future creator-response model.

## Compatibility and migration

`/api/marketplace/discovery-options` is the public catalog of supported platform
and model keys. Submission validation accepts known display-name aliases and
stores canonical keys. Claude and Claude Code, and Gemini and Gemini CLI, remain
distinct platforms. New compatibility entries reject unknown or duplicate keys.

Migration `202610010001_marketplace_discovery_and_trust` normalizes mutable
product projections and unpublished release compatibility. Historical published
release contents and snapshots stay immutable. Existing current community
requests enter the moderation queue without inferred approval. Known legacy
item labels align to canonical types; ambiguous types retain the existing
classification flag and stay out of discovery until explicitly reclassified.
Category foreign keys and stable slugs remain the source of truth.

Unknown legacy compatibility values make the migration stop rather than discard
claims. Review those values against the catalog before applying it to another
database. Adding supported keys requires updating validation and the database
constraint in a new migration.

The migration also fixes an older trigger that prevented the source worker from
refreshing published verification status. Published contents, source identity,
installation instructions, and provenance remain immutable.

## Verification

Run root `npm run typecheck`, `npm test`, and `npm run build`, plus web lint.
Run `npm run test:discovery --workspace @termspace/api` against a local PostgreSQL
administrator connection. It creates a uniquely named disposable database,
applies the complete migration chain, exercises real authenticated requests and
database immutability, and drops only that test database afterward.
`MARKETPLACE_TEST_ADMIN_URL` can override `DATABASE_URL` for that command;
non-loopback connections are rejected. The integration scenario is skipped by
the ordinary unit-test command and is executed by this dedicated command.

The batch was verified using isolated PostgreSQL 18 because the configured
Docker service was unavailable. The project's Docker database remains PostgreSQL
16; no existing database or local environment file was changed.
