# TermSpace Product Direction

## Purpose

TermSpace is a discovery, publishing, and community platform for agentic coding
tools. Its catalog may include skills, agents, subagents, MCP servers,
integrations, rules, prompts, hooks, templates, workflows, and related developer
tools.

The product should help people answer three questions:

1. What tool solves my problem?
2. Will it work with my platform and workflow?
3. Can I trust it enough to install or use it?

## Product surfaces

### Marketplace and community (`apps/web`)

The main TermSpace application is the public catalog and creator platform.

- Visitors can browse, search, and filter published items.
- Filtering treats platform and community as distinct first-class facets, in
  addition to item type, category, pricing, compatibility, and rating.
- Signed-in users can favorite, acquire or install, rate, and review items.
- Creators can submit items and manage their listings, releases, documentation,
  compatibility, and publication state from a dashboard.
- TermSpace staff moderate submissions, revisions, reports, and reviews before
  or after publication according to the applicable moderation policy.

Communities are staff-created, platform-oriented publishing spaces where any
authenticated user can submit relevant items. One canonical listing may be
placed in multiple communities without duplicating its releases, reviews, or
acquisition history. Community placement and platform compatibility remain
independent, combinable discovery facets. See
[ADR 0002](architecture/0002-community-model.md) for the community lifecycle and
moderation model.

Marketplace listings use a controlled taxonomy of skills, agents, MCP servers,
integrations, rules, prompts, hooks, templates, and workflows. Each creator
submission follows a versioned common manifest plus type-specific installation,
compatibility, and permission metadata. See
[ADR 0003](architecture/0003-item-types-and-manifests.md) for the canonical type
keys and manifest boundary.

Marketplace trust is layered: account authentication, verified email, creator
status, source ownership, identity verification, release review, and community
reputation are separate signals. Submissions and enforcement use scoped,
auditable moderation with appeals and controlled ownership transfer. See
[ADR 0004](architecture/0004-marketplace-trust-and-moderation.md) for the policy
baseline.

The core consumer journey is:

`discover -> evaluate -> acquire/install -> use -> rate/review`

The core creator journey is:

`create profile -> submit item -> moderation -> publish -> release updates -> learn from feedback`

### Editorial publication (`apps/blog`)

The TermSpace Blog is a separate, staff-managed editorial service about agentic
coding. Public users and marketplace creators cannot upload or publish blog
content. Blog authorship and administration remain restricted to TermSpace
staff.

Editorial work includes guides, analysis, comparisons, curated resources, and
recurring series such as the planned vibe-coding checklist series. The Blog may
link to relevant marketplace items, but marketplace submission never grants
editorial publishing access.

### Shared API (`apps/api`)

The API serves both applications, but marketplace and editorial authorization,
routes, controllers, and data lifecycles must remain separate. Sharing reader
identity does not imply sharing creator, moderator, or editorial permissions.

## Trust and safety

Community-submitted agentic tools may contain executable code or instructions
that cause coding agents to execute commands. Treat every submission as
untrusted content.

- Keep listing ownership and staff moderation explicit and auditable.
- Validate archives, metadata, file types, and size limits server-side.
- Prevent external artifacts from being rendered or executed in TermSpace
  infrastructure.
- Record immutable release provenance and provider integrity digests when
  available.
- Require authenticated, rate-limited reviews and calculate ratings from stored
  review records.
- Provide reporting, takedown, suspension, and review-appeal workflows.
- Never expose private submission artifacts through public media paths before
  approval.

## Current scope boundary

The first complete milestone should support a trustworthy free-item lifecycle.
Paid checkout, payouts, subscriptions, and refunds should follow only after
submission, moderation, versioning, acquisition, and review flows work end to
end.

The first marketplace lifecycle uses external artifact sources rather than
TermSpace-hosted uploads. Creators submit metadata pointing to supported GitHub
or npm sources, and every published release resolves to an immutable source
identity. See
[ADR 0001](architecture/0001-external-artifact-sources.md) for ownership,
provenance, availability, failure, and takedown requirements. Hosted artifacts
remain a possible later phase and require a separate threat model and
architecture decision.
