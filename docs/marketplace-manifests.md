# Marketplace Item Types and Manifests

The API owns the controlled item-type registry and version 1 manifest validator
in `apps/api/src/lib/marketplaceManifest.ts`. Do not add a separate list of type
keys in a route, form, seed, or migration without updating the registry and its
tests. The public registry is available at `GET /api/marketplace/item-types`.

## Controlled types

The stable API keys are `skill`, `agent`, `mcp_server`, `integration`, `rule`,
`prompt`, `hook`, `template`, and `workflow`. PostgreSQL stores their uppercase
enum equivalents. Public product responses retain the old localized/display
`type` field for compatibility and add `typeKey` as the stable identifier.
Product filtering accepts both forms during the transition; new clients should
send the stable key.

Legacy `Skill`, `Agent`, `Workflow`, `Prompt`, `Prompt pack`, and `MCP server`
records are migrated directly. `AI tool`, `Developer utility`, and unknown
values are deliberately not guessed. They retain their public display value,
have a null `itemType`, and are marked `classificationRequired` for staff review.
Operators can inspect that queue with:

```sql
SELECT "id", "slug", "type"
FROM "MarketplaceProduct"
WHERE "classificationRequired" = true
ORDER BY "updatedAt" DESC;
```

Classification must set `itemType` and clear `classificationRequired` in the
same transaction. A database check constraint prevents partially classified
states.

## Manifest boundary

`validateMarketplaceManifest` accepts untrusted input, validates it with strict
Zod schemas, creates a recursively key-sorted snapshot, and returns its SHA-256
digest. Version 1 has three sections:

- `listing`: mutable, moderated public identity and presentation metadata;
- `release`: immutable source, compatibility, installation, requirements,
  permissions, license, and support metadata;
- `typeDetails`: required fields selected by the controlled item type.

Unknown fields, unknown versions or types, non-HTTPS URLs, unpinned GitHub
repository references, inexact npm versions, and environment-variable values
are rejected. The accepted source identities are a GitHub repository commit, a
GitHub release, or an exact npm package version with provider integrity.

Validated data is normalized into `MarketplaceReleaseManifest` and its child
tables. `MarketplaceManifestSnapshot` keeps the audit copy and digest. Database
triggers reject snapshot updates/deletes and reject inserts, updates, or deletes
to a release and its normalized children after `publishedAt` is set. Corrections
therefore require a new product version rather than silently changing what users
previously evaluated or acquired.

The flat product fields `platforms`, `models`, `installationSteps`,
`requirements`, and `permissions` remain transitional so existing public pages
continue to work. They must only be retired after reads have moved to normalized
release data and production backfills have been verified.

## Adding a type

Follow the complete checklist in [ADR 0003](architecture/0003-item-types-and-manifests.md):
update the canonical registry, database enum and migration, type-specific schema,
permission and installation behavior, English/Persian presentation, API
serialization/filtering, creator and public UI, fixtures, and regression tests in
one reviewed change.
