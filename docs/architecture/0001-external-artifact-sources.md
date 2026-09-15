# ADR 0001: External-Source-First Artifact Distribution

- Status: Accepted
- Date: 2026-09-15
- Decision owners: TermSpace product and engineering

## Context

TermSpace allows creators to publish agentic coding tools. These tools may
contain executable code or instructions that cause an agent to read files,
invoke network services, or execute commands. Accepting arbitrary archive
uploads would make TermSpace responsible for secure storage, malware scanning,
archive extraction, quarantine, artifact retention, and incident response before
the core creator and discovery workflows have been proven.

The existing marketplace models describe products and versions, but creators
cannot yet own or submit listings and version records do not identify a durable
artifact source.

## Decision

The first complete marketplace lifecycle will use external artifact sources.
Creators submit listing metadata and a supported source reference; they do not
upload installable files to TermSpace.

Phase-one sources are deliberately limited to providers for which TermSpace can
resolve a mutable creator input into an immutable public release:

- GitHub repository content pinned to a commit SHA, optionally with a repository
  subdirectory for a skill, rule, hook, template, or similar item.
- GitHub release assets pinned to a repository, release tag, asset identity, and
  the release commit SHA.
- npm packages pinned to an exact version and registry integrity digest.

Arbitrary download URLs, mutable branch-only references, URL shorteners, and
private sources are not publishable in phase one. More providers require a new
decision or an amendment to this record.

TermSpace stores catalog metadata, source metadata, verification results, and
release provenance. Installation and download traffic goes to the canonical
provider. TermSpace does not proxy or silently mirror external artifacts.

## Source ownership

Before the first listing from a source can be submitted for moderation, the
creator must prove control of that source using the provider's authenticated
API. Repository verification requires an authenticated provider identity with
administrative or maintain permission for the repository. Package verification
requires a provider-supported ownership challenge or authenticated maintainer
check.

Ownership is rechecked when the source changes, when ownership-sensitive listing
fields change, and periodically after publication. Losing verification does not
transfer ownership to another TermSpace account. It places affected listings in
a restricted state for staff review.

TermSpace creator verification, source ownership verification, staff content
review, and community reputation are separate claims and must be displayed as
separate signals. One must never imply the others.

## Release provenance and immutability

Every published marketplace release must be an immutable database record that
contains at least:

- provider and source type;
- canonical repository or package identity;
- exact package version, commit SHA, or release identifier;
- selected repository subdirectory or release asset identity, when applicable;
- provider-supplied integrity digest and archive size when available;
- a TermSpace-computed digest only if TermSpace safely fetches the artifact as
  part of a future scanning pipeline;
- resolved canonical installation or download URL;
- ownership-verification result and timestamp;
- source-resolution result and timestamp;
- creator release notes and publication timestamp.

A creator may publish a new release, but may not mutate the artifact identity of
an existing published release. Metadata corrections that would change what a
user installs create a new release and go through moderation. Acquisitions retain
the exact release identity presented to the user.

## Synchronization and failures

Source resolution is a bounded background operation with explicit timeouts,
retry policy, provider rate-limit handling, and logged correlation IDs. Logs
record provider, operation, latency, status, and internal identifiers, but not
provider tokens or private artifact data.

A provider reporting success is not sufficient. TermSpace verifies the resolved
immutable identifier and required metadata before marking a source check
successful.

Failure behavior is explicit:

- A new submission cannot enter moderation until its source resolves and
  ownership is verified.
- A transient provider failure leaves an existing published release available
  with a visible stale-check state; it does not overwrite the last known-good
  provenance.
- A confirmed missing, replaced, or inaccessible source disables new
  acquisitions and sends the listing to staff review.
- Repeated checks use backoff and must not create duplicate releases or silently
  advance a listing to a newer external version.
- Provider webhooks are hints. A scheduled reconciliation job remains the source
  of truth because webhooks can be delayed, duplicated, or lost.

## Availability and installation

TermSpace can guarantee the integrity of its stored provenance record, not the
continued availability of a third-party provider. Product pages must identify
the provider and last successful source check. Installation actions must fail
clearly when the pinned source is unavailable; they must never fall back to a
different version or mutable branch.

The initial lifecycle supports public, free items. Paid access is deferred
because an externally accessible public artifact cannot be treated as protected
paid inventory.

## Takedowns and source compromise

Staff can suspend a listing or individual release immediately. Suspension:

- removes the item from discovery and disables new acquisition/install actions;
- preserves ownership, moderation, acquisition, and provenance records for audit
  and support;
- records the actor, reason code, timestamp, and any internal notes;
- does not delete or rewrite historical releases;
- provides a controlled reinstatement path after review.

Confirmed malicious content, provider compromise, ownership disputes, and legal
requests use the same auditable restriction mechanism with distinct reason
codes. Public responses reveal only safe status information, not internal notes
or reporter identity.

## Consequences

This decision reduces the initial security and operational burden and gives
users provider-verifiable provenance. It also means TermSpace depends on provider
availability, cannot guarantee permanent downloads, cannot safely sell access to
otherwise public artifacts, and must integrate provider authentication and
reconciliation.

## Future hosted artifacts

TermSpace-hosted uploads require a separate architecture decision and threat
model. At minimum, that design must cover private quarantine storage,
decompression-bomb and path-traversal defenses, malware and secret scanning,
file allowlists and size limits, sandboxed inspection, immutable object versions,
checksums, signed delivery, retention, deletion, incident response, and the rule
that unapproved artifacts are never reachable through public media paths.
