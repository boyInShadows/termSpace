# ADR 0002: Platform-Oriented Community Publishing Spaces

- Status: Accepted
- Date: 2026-09-15
- Decision owners: TermSpace product and engineering

## Context

TermSpace needs a place where anyone can contribute useful agentic coding tools
for other users. A submitted item can be relevant to one or more communities and
can support one or more platforms. Treating community as a free-form tag would
make names inconsistent, permit impersonation, and leave ownership, moderation,
and cross-posting behavior undefined.

Community and platform answer different questions:

- Community: where and for whom was this item shared?
- Platform compatibility: where does this item run or integrate?
- Category: what problem does this item solve?
- Item type: what kind of artifact is it?

## Decision

A TermSpace community is a public, moderated publishing space organized around
an agentic coding platform or its surrounding ecosystem. Any authenticated user
may become a creator and submit an item to a relevant community. Joining a
community or receiving an invitation is not required to submit.

Communities are first-class records with stable identities. Staff creates,
renames, moderates, archives, and defines the rules for communities during the
initial product phase. Delegated community moderators may be added later, but
community creation is not open to users in phase one.

A listing is canonical and creator-owned. It can be placed in multiple
communities through explicit relations; cross-posting must never duplicate the
listing, releases, ratings, reviews, favorites, or acquisition counts.

## Community and platform relationship

Every community identifies a primary platform or ecosystem. A listing submitted
to that community must declare a relevant compatibility relationship or explain
an ecosystem-level relationship that moderators can validate.

Platform compatibility remains normalized and independent:

- A listing can support platforms beyond a community's primary platform.
- A listing can appear in more than one relevant community.
- Filtering by community selects approved community placement.
- Filtering by platform selects declared and moderated compatibility.
- Community and platform filters can be combined.

TermSpace must not infer community placement solely from compatibility. A
creator requests placement, and moderation decides whether the item is relevant
to that community.

## Data model requirements

Implementation should introduce normalized community and placement records.
Names are illustrative; the migration determines final Prisma names.

### Community

- stable identifier and unique slug;
- localized name and description;
- primary platform or ecosystem reference;
- public rules and submission guidance;
- visual identity fields that use controlled media;
- lifecycle state: active or archived;
- created and updated timestamps.

Slugs remain stable after publication. Renaming display text must not silently
break links. Reserved or misleading names require staff review.

### Listing placement

- listing and community identifiers with a unique pair constraint;
- status: requested, approved, rejected, or removed;
- submitting user and submission timestamp;
- moderation actor, decision timestamp, and public-safe reason when applicable;
- internal moderation notes stored separately from public responses.

The number of requested communities per listing must be bounded and rate-limited
to prevent spam. The exact limit remains configuration, not a database invariant.

## Submission and moderation

Submitting an item to a community is a request for placement, not immediate
publication. A creator may request communities while drafting or updating a
listing. Community placement becomes publicly visible only when both conditions
are true:

1. the listing or relevant release is published; and
2. the placement is approved.

Moderators evaluate relevance, compatibility claims, duplication, misleading
branding, and compliance with the community's public rules. Decisions and
reversals are auditable. A rejected placement does not reject the canonical
listing from every other community. A suspended listing is hidden from all
communities regardless of placement state.

Creators cannot edit community records, approve their own placement, present a
listing as official without separate verification, or transfer listing ownership
through community placement.

## Discovery behavior

Each active community has a public page with its description, rules, supported
context, approved listings, and available filters. Public API responses include
only approved placements attached to published, non-suspended listings.

Search and discovery support:

- direct community pages and stable community URLs;
- community filters independent from platform filters;
- combined community, platform, category, item-type, and rating filters;
- canonical listing URLs regardless of how many communities contain the item;
- community badges or context on listing cards without implying official
  platform endorsement.

Empty, archived, and unavailable communities have explicit states. Archiving a
community removes its placements from discovery but does not delete or unpublish
the canonical listings, reviews, releases, or acquisition history.

## Trust, abuse, and audit requirements

- Community names and branding must not imply platform ownership or endorsement
  unless staff has verified that claim.
- Submission and placement actions are authenticated, authorized, rate-limited,
  and logged with internal correlation IDs.
- Users can report a placement or listing for irrelevance, impersonation,
  malicious behavior, or policy violations.
- Removal records preserve the actor, reason, and timestamp.
- Public APIs never expose internal moderation notes or reporter identities.
- Community moderation does not grant Blog editorial access.

## Consequences

This model lets contributors share one item across relevant audiences while
preserving one source of truth for releases and reputation. It adds a moderated
many-to-many placement lifecycle instead of a simple tag array. It also requires
normalized platform records, staff community administration, placement-aware
queries, and careful authorization before community browsing can ship.
