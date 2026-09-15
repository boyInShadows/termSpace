# ADR 0004: Marketplace Trust, Moderation, and Ownership Policy

- Status: Accepted
- Date: 2026-09-15
- Decision owners: TermSpace product and engineering

## Context

The current application has reader and editorial administrator sessions, but no
marketplace roles. Marketplace creators are seed-managed, reviews are seeded
with arbitrary author strings, and there are no creator submission, report,
suspension, appeal, or ownership-transfer workflows.

Community-submitted agentic tools can execute commands, access files and
credentials, or send data to external services. TermSpace therefore needs clear
trust signals and reversible, auditable enforcement before public submissions
are enabled. Marketplace authority must also remain separate from Blog editorial
authority.

## Decision

TermSpace will use layered trust signals, risk-based pre-publication moderation,
authenticated review eligibility, case-based reporting, scoped suspension,
auditable appeals, and controlled ownership transfer.

Marketplace actions use explicit marketplace roles. No creator, moderator, or
marketplace verification state grants Blog publishing or editorial
administration access.

## Trust signals

The public product must present these as separate claims:

1. **Authenticated account**: the user controls a valid TermSpace session.
2. **Verified email**: the user completed an email-provider or first-party email
   verification flow. Password registration alone is not sufficient.
3. **Creator profile**: the user accepted creator terms and has an active creator
   profile.
4. **Source ownership verified**: provider authentication confirmed control of
   the repository or package according to ADR 0001.
5. **Identity or organization verified**: staff verified the claimed person or
   organization using a documented process.
6. **Release reviewed**: the specific immutable release passed the applicable
   automated checks and moderation review.
7. **Community reputation**: rating and usage information calculated from
   eligible user activity.

Signals are entity- and time-specific. A verified creator does not make every
release safe; a reviewed release does not verify the creator's legal identity;
high ratings do not imply staff approval. UI labels must name the actual signal
instead of using one ambiguous `verified` badge.

Any authenticated user with a verified email may create a creator profile.
Identity verification is optional unless required by a later paid-product or
risk policy. Source ownership verification is required before a listing can be
submitted for moderation.

## Roles and separation of duties

- **Reader**: browse, acquire, favorite, report, and submit eligible reviews.
- **Creator**: manage only creator profiles and listings they own, request
  community placement, submit releases, respond to reviews, and appeal decisions.
- **Marketplace moderator**: review submissions, placements, reviews, and
  reports; request changes; apply scoped restrictions; and decide appeals when
  authorized.
- **Marketplace administrator**: manage moderator access, communities, policy,
  escalated enforcement, and ownership transfers.
- **Editorial administrator**: manage Blog content through separate
  authorization. This role has no marketplace authority unless explicitly and
  independently assigned a marketplace role.

All privileged actions require a current session and server-side authorization.
The client never decides ownership or role eligibility. A moderator cannot
approve their own listing, review, creator-verification request, or ownership
transfer.

## Listing and release moderation

Creators edit private drafts and submit immutable review snapshots. Public
listing data continues serving the last approved snapshot while a proposed edit
is under review. Rejection of an edit must not silently unpublish the last
approved version.

Staff approval is required before:

- a listing and its first release are published;
- an item type changes;
- the source provider, repository, package, or source owner changes;
- permissions, external scopes, data retention, or executable behavior increase;
- installation commands or entry points materially change;
- a previously restricted listing or release is reinstated;
- listing ownership is transferred.

Every release must still pass source resolution, immutable-reference validation,
ownership verification, and applicable automated checks. A later release from a
creator and source in good standing may use an expedited path only when its
source identity, item type, permissions, installation behavior, and external
scopes are unchanged. Expedited publication remains audited and subject to
retrospective review. Until that classifier and audit path exist, all releases
require staff approval.

Minor edits may publish without full staff review when they are limited to
spelling, localization, screenshots, examples, or documentation and do not alter
security, compatibility, source, installation, pricing, identity, or ownership
claims. The server classifies protected fields; clients cannot label their own
change as minor.

Moderation outcomes are:

- approved;
- changes requested;
- rejected;
- restricted pending investigation.

Creators receive a public-safe reason and actionable change request. Internal
notes, reporter identities, detection rules, and sensitive evidence remain
private.

## Review eligibility and moderation

A marketplace review requires an authenticated account with a verified email and
a completed acquisition for the listing. A user may have one active review per
listing and may edit or withdraw it. Creators, creator-team members, and accounts
with a direct conflict of interest cannot review their own listings.

Eligible reviews publish after server-side validation unless automated abuse
controls hold them for moderation. Controls include rate limits, duplicate and
coordinated-content signals, account and acquisition age, repeated edits, and
conflict-of-interest checks. Reports can move a published review into a held
state while preserving it for investigation.

Moderators may approve, hold, or remove a review, but cannot rewrite its text or
rating. Review edits pass the same validation and abuse controls. Published
rating aggregates are calculated transactionally from active published reviews;
creator-supplied aggregates and held or removed reviews never contribute.

Creator responses are clearly labeled, limited to one active response per
review, subject to the same content rules, and cannot change the review or
rating. Moderators preserve the original and edited history for audit.

## Reporting and cases

Authenticated users can report a listing, release, community placement, review,
creator response, or creator profile. Supported reason categories include:

- malicious behavior or undisclosed permissions;
- source compromise or changed artifact;
- impersonation, ownership, trademark, or copyright concern;
- misleading claims or incompatible installation instructions;
- broken, unavailable, or abandoned item;
- spam, harassment, review manipulation, or conflict of interest;
- another policy concern with a bounded explanation.

Reports create deduplicated, rate-limited moderation cases. A report is evidence,
not an automatic finding. Case states are new, triaged, investigating, actioned,
and dismissed. Staff records severity, linked evidence, actions, and a public-safe
resolution without exposing reporter identity.

Internal response targets are:

- critical security or active compromise: disable new acquisition or
  installation immediately when evidence is reliable and begin staff triage
  within 24 hours;
- high-risk impersonation, malicious behavior, or widespread breakage: triage
  within two business days;
- standard content, relevance, or review reports: triage within five business
  days.

These targets guide operations and are not a public service-level guarantee.
Repeated reports alone do not trigger punishment. High-confidence automated
security findings may apply an emergency restriction, but always create a case
requiring staff review.

## Suspension and other enforcement

Enforcement is scoped to the smallest entity that controls the risk:

- hold or remove a review or creator response;
- reject or remove a community placement;
- restrict one release and disable its install action;
- suspend a listing from discovery and new acquisition;
- suspend creator publishing privileges;
- suspend the user account for severe or repeated abuse.

Every enforcement event records the actor, target, reason code, public-safe
reason, private evidence reference, timestamp, and correlation ID. Restrictions
must be reversible. Historical releases, acquisition records, reviews, ownership
history, and audit events are retained rather than rewritten or hard-deleted.

Emergency restrictions may occur without prior creator notice when continued
availability presents a credible security, fraud, legal, or user-harm risk. The
creator is notified as soon as doing so no longer compromises the investigation.
Restricting a creator's marketplace access does not alter Blog content or grant
access to editorial systems.

## Appeals and reinstatement

A creator or reviewer can appeal a moderation or enforcement decision by
submitting a bounded explanation and new supporting evidence. Appeals do not
automatically restore content or privileges.

Appeals are linked to the original case and decision. A different authorized
moderator reviews the appeal where staffing permits; when that is impossible,
the exception and rationale are recorded. Appeal outcomes are upheld, modified,
or reversed. Staff records a public-safe explanation and any reinstatement
conditions.

One appeal is allowed per decision unless materially new evidence becomes
available. The internal target is an initial appeal decision within ten business
days. Reinstatement reruns required source, ownership, and release checks and
creates a new audit event; it never deletes the original decision.

## Ownership transfer

Marketplace listing ownership can be transferred only through a dedicated
workflow. Editing a creator ID, changing source metadata, or moving a listing
between communities is not an ownership transfer.

A transfer requires:

1. recent authentication from both the current and receiving owners;
2. explicit acceptance by the receiving creator account;
3. renewed source-ownership verification for the receiving owner;
4. staff approval and conflict review;
5. an immutable transfer event with the effective timestamp.

Transfers preserve listing URLs, releases, reviews, ratings, acquisitions, and
public release provenance. Historical creator attribution remains available in
the audit record and is not rewritten. Private account information is never
exposed publicly.

Pending disputes, active security cases, or account restrictions freeze
transfers. Staff-controlled recovery for an unavailable owner requires separate
documented evidence and cannot bypass source verification. Identity-verification
badges do not transfer and must be re-evaluated for the recipient.

## Audit and data handling

Moderation, verification, publication, restriction, appeal, and transfer actions
produce append-only audit events. Each event records actor type and identifier,
action, entity type and identifier, previous and resulting states, reason code,
timestamp, and correlation ID. Sensitive evidence is referenced through
restricted storage and is not copied into ordinary request logs.

Logs and audit events must not contain credentials, session tokens, source
provider tokens, private artifact contents, reporter identity in public fields,
or unnecessary personal data. Retention and deletion periods require a separate
privacy policy before public launch.

## Implementation consequences

The current single `verified` booleans on creators and products cannot represent
these trust claims and must be replaced or treated as transitional. Reader
accounts need verified-email state. Creator ownership must link to authenticated
users. Listings need approved and proposed snapshots, releases need review state,
and moderation requires cases, decisions, reports, appeals, restrictions, and
append-only audit events.

Review authors must become authenticated user relations with acquisition
eligibility. Public API queries must fail closed for restricted marketplace
entities while leaving unrelated Blog authorization and content unchanged.
