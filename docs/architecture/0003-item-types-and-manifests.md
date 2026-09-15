# ADR 0003: Marketplace Item Types and Manifest Contract

- Status: Accepted
- Date: 2026-09-15
- Decision owners: TermSpace product and engineering

## Context

Marketplace item types are currently stored as uncontrolled display strings.
Seed data and frontend code use `Skill`, `Agent`, `Workflow`, `Prompt`,
`Prompt pack`, `MCP server`, `AI tool`, and `Developer utility`. This causes API,
filter, localization, and creator-input drift and does not capture the metadata
needed to evaluate or safely install different kinds of agentic coding tools.

The artifact source decision in ADR 0001 also requires a clear boundary between
mutable listing information and immutable release information.

## Decision

TermSpace will launch with nine controlled item types. APIs and persistence use
stable lowercase snake-case keys; English and Persian display labels are
localized at the presentation boundary.

| Key | English label | Definition |
| --- | --- | --- |
| `skill` | Skill | A packaged capability or instruction set installed into an agent or coding environment. |
| `agent` | Agent | An autonomous or delegated agent definition, including primary agents and subagents. |
| `mcp_server` | MCP server | A Model Context Protocol server exposing tools, resources, or prompts. |
| `integration` | Integration | A connector, plugin, or extension that joins an agentic platform to another system. |
| `rule` | Rule | Persistent project or user guidance applied by an agentic coding environment. |
| `prompt` | Prompt | A single prompt or a versioned prompt bundle with declared inputs and intended use. |
| `hook` | Hook | Event-triggered behavior executed around supported agent or development lifecycle events. |
| `template` | Template | Reusable project, configuration, or artifact scaffolding used as a starting point. |
| `workflow` | Workflow | An ordered multi-step process coordinating prompts, agents, tools, or human checkpoints. |

Subagent is an `agent` scope, not a separate top-level type. A prompt pack is a
`prompt` with bundle contents, not a separate type. `AI tool`, `Developer
utility`, and any future generic `Other` value are not accepted because they do
not communicate installation or risk characteristics. Existing generic listings
must be manually reclassified before migration; TermSpace must not guess their
type.

A listing has exactly one item type. Changing type after first publication is a
moderated material change because it changes validation, permissions, and
installation expectations.

## Manifest contract

Creator submissions use a versioned manifest contract. In phase one, the
dashboard and API produce and validate the manifest; creators are not required
to commit a `termspace.json` file to their source repository. Importing a
repository manifest may be added later, but imported data remains untrusted and
must pass the same server-side validation.

The manifest is not stored as an opaque source of truth. Validated fields are
normalized into relational columns and typed records so they can be queried,
moderated, localized, and migrated. The submission retains an immutable snapshot
of the validated manifest for audit.

Every manifest declares a positive integer `manifestVersion`. Version 1 has this
conceptual shape:

```json
{
  "manifestVersion": 1,
  "type": "skill",
  "listing": {},
  "release": {},
  "typeDetails": {}
}
```

Unknown manifest versions, item types, fields that are required for the selected
type, and invalid enum values are rejected before moderation. Additive optional
fields may be introduced within a manifest version. Removing, renaming, or
changing the meaning of a field requires a new manifest version and an explicit
migration path.

## Listing metadata

Listing metadata describes the durable public identity and can change through
the moderated listing-edit lifecycle. Every listing requires:

- creator ownership and a unique canonical slug;
- item type key;
- localized name, short outcome statement, and full description;
- primary category and moderated community placement requests;
- normalized tags;
- controlled screenshots or visual assets with localized alt text;
- support, documentation, and issue-reporting URLs when available;
- publication and moderation state.

Pricing, featured status, verification, ratings, review counts, usage counts,
purchase counts, moderation decisions, and ownership claims are server-managed.
Creators cannot submit aggregate reputation or staff-controlled fields through a
manifest.

## Release metadata

Release metadata defines exactly what a user evaluates and installs. A published
release is immutable and every release requires:

- a creator-supplied version label unique within the listing;
- one supported immutable external source from ADR 0001;
- source resolution and ownership-verification results;
- provider integrity digest when available;
- release notes;
- at least one normalized platform compatibility declaration;
- installation method and ordered installation instructions;
- runtime, account, operating-system, and dependency requirements;
- a structured permissions and capabilities declaration;
- license identifier or explicit custom-license reference;
- documentation and support compatibility for that release;
- release and publication timestamps.

Version labels are bounded opaque identifiers. Semantic versioning is encouraged
but not required because some ecosystems use dates, commit identifiers, or other
schemes. The immutable provider identity, not the creator's version label, is the
artifact identity.

Secrets, access tokens, private environment values, and user data must never
appear in manifest fields. Environment-variable declarations contain names,
purpose, and whether each value is required or sensitive, but never values.

## Structured permissions

A free-form `permissions` string is insufficient for trust decisions. Each
release declares applicable capabilities using controlled keys plus an optional
creator explanation:

- filesystem read and write scope;
- command or process execution;
- network destinations and purpose;
- environment-variable access;
- credential or secret access;
- browser or UI automation;
- external account scopes;
- database or persistent-storage access;
- background, scheduled, or event-triggered execution;
- code generation or modification behavior;
- telemetry and data retention.

Declaring a capability does not verify safety. Source review, automated checks,
creator verification, and staff review remain separate trust signals.

## Type-specific metadata

### `skill`

- skill format or specification and definition entry path;
- invocation or activation behavior;
- bundled scripts or executable helpers;
- expected inputs and produced outputs.

### `agent`

- scope: primary agent or subagent;
- definition entry path and invocation/delegation method;
- available tools and delegated capabilities;
- model requirements and expected inputs/outputs.

### `mcp_server`

- supported transport and launch or connection method;
- package, binary, container, or hosted endpoint identity;
- exposed tools, resources, and prompts;
- authentication method and required environment-variable names;
- external network destinations and data-handling behavior.

### `integration`

- integration kind, such as connector, plugin, or extension;
- host platform and installation identifier;
- connected service and requested scopes;
- authentication, callback, and data-flow summary.

### `rule`

- rule format, destination scope, and definition entry path;
- activation behavior and applicable file or project scope;
- expected effect on agent behavior.

### `prompt`

- single or bundle format and prompt entry paths;
- declared variables, required inputs, and output contract;
- intended models or model-agnostic declaration;
- examples that contain no private or production data.

### `hook`

- supported events and host platform;
- command or handler entry points and required runtime;
- synchronous or asynchronous behavior;
- failure policy and filesystem, process, and network effects.

### `template`

- template kind and included paths or assets;
- output format and initialization method;
- required replacement variables;
- generators or scripts that can execute during setup.

### `workflow`

- ordered stages and human approval checkpoints;
- referenced tools or dependencies;
- orchestration or execution method;
- expected initial inputs, intermediate state, and final outputs;
- retry, rollback, and partial-failure behavior where applicable.

## Validation and extension

The API owns the canonical type keys and manifest schema. Database constraints,
request validation, source reconciliation, filters, localized labels, creator
forms, public cards, and tests must use the same registry rather than duplicating
independent string lists.

Adding a type requires all of the following in one reviewed change:

1. a stable key and product definition;
2. required type-specific fields and validation;
3. permission and installation semantics;
4. English and Persian labels and form copy;
5. API serialization, filtering, and migration support;
6. creator-dashboard and public-detail rendering;
7. fixtures and regression tests.

Staff may extend the controlled taxonomy through code and migrations. Creators
cannot create item types.

## Migration consequences

Existing display strings must be migrated to stable keys. `Skill`, `Agent`,
`Workflow`, `Prompt`, and `MCP server` have direct mappings. `Prompt pack` maps
to `prompt` with bundle details. `AI tool` and `Developer utility` require manual
classification before a database constraint is enforced.

The current `platforms`, `models`, `installationSteps`, `requirements`, and
`permissions` fields are transitional. Their normalized replacements should be
introduced forward-only, backfilled, verified, and then read by the application
before legacy fields are retired in a later migration.

## Consequences

The controlled taxonomy improves filtering, localization, safety disclosure,
and creator guidance. It also makes creator submission forms conditional and
requires more structured persistence than the current flat product model. The
extra structure is intentional: different agentic artifacts have materially
different installation and permission risks.
