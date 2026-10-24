# Marketplace listing reports

The reporting policy is [ADR 0004](architecture/0004-marketplace-trust-and-moderation.md).
Authenticated listing-report intake and private staff triage have API and web
interfaces. Enforcement, appeals and additional report targets remain in the
implementation queue. A report never changes
publication, acquisition, installation or a trust badge automatically.

## Reader intake

`POST /api/marketplace/products/:slug/reports` requires an active reader session
and the normal same-origin CSRF checks. Verified email is not required to send
safety evidence. The target must currently be publicly available. A private,
suspended, archived or nonexistent listing returns the same 404.

The strict body contains `reason` and `explanation` (20–4000 trimmed characters).
Reasons are `MALICIOUS`, `UNDISCLOSED_PERMISSIONS`, `SOURCE_COMPROMISE`,
`IMPERSONATION`, `MISLEADING`, `BROKEN_OR_ABANDONED`, `SPAM_OR_ABUSE` and `OTHER`.
Staff severity and decision fields cannot be submitted by readers.

The 202 response contains only `{ data: { accepted: true, receiptId } }`.
It exposes neither the case identifier nor other reporters or evidence.
Repeating a report for the same open listing/reason case returns the original
receipt and preserves the original explanation. Distinct reporters feed that
case without increasing its severity. A dismissed case keeps its history;
later evidence can create a new case.

An account can submit ten new reports per rolling hour. PostgreSQL transaction
locks serialize that quota across API instances and serialize open-case
deduplication. An independent IP limit allows twenty report requests per hour,
including retries. Database transaction admission has a bounded ten-second
wait; transaction timeout/admission errors return 503 `REPORT_SERVICE_BUSY`
with `Retry-After: 1`. A retry does not overwrite evidence or double-charge the
account quota. There are no provider calls inside these transactions.

On a product page, **Report listing** opens an inline disclosure beside the
acquisition controls. Form code loads on first opening; closing the disclosure
retains text. Successful submission shows the receipt; failed requests preserve
the explanation and distinguish session expiry, unavailable targets, limits,
network failures, timeout and a busy service. Signing in retains the locale and
return listing; switching accounts clears the form's private state. Reports are
not saved in browser storage.

## Private staff endpoints

Every endpoint below rechecks a verified moderator or administrator role from
the current session. Staff cannot access or act on a case about their own
listing or one they reported; missing and conflicting cases both return 404.

| Endpoint under `/api/marketplace/moderation` | Behavior |
| --- | --- |
| `GET /cases` | Severity first, then oldest case first; optional `state` filter |
| `GET /cases/:id` | Case summary and latest fifty audit events |
| `GET /cases/:id/reports` | Original report explanations, oldest first |
| `GET /cases/:id/events` | Full paginated audit history, newest first |
| `POST /cases/:id/triage` | Version-checked triage, investigation or dismissal |

Lists accept `page` (1–1,000,000) and `limit` (1–48, default 24), with total and
page metadata. Reads use `Cache-Control: private, no-store`. Evidence and event
responses omit reporter account identifiers and emails; raw evidence remains
staff-only and may itself contain information a reporter supplied.

Staff reach `/moderation/cases` from the submission queue. Filters and case,
report and event pages use the URL and survive reload. Case pages have section
jumps to evidence, the decision form and history. A stale write disables further
submission until explicit reload/review; failed writes keep entered reasons.
Resolved cases remain readable. Account changes and access-denied responses
clear loaded private evidence. Case routes use noindex metadata. The same
workflow supports English/Persian, RTL and both themes.

Triage requires `expectedVersion`, `action` (`TRIAGE`, `INVESTIGATE`, `DISMISS`),
`severity` (`STANDARD`, `HIGH`, `CRITICAL`), a bounded uppercase `reasonCode`, and
a public-safe `publicReason` (10–1000 characters). An optional
`evidenceReference` (2–200 characters) refers to restricted evidence storage;
it must not contain credentials or private artifact contents. Staff must keep
reporter identity out of public-safe text. No evidence URL is fetched.

State/severity changes and their audit events commit in one transaction.
Concurrent stale decisions return 409; resolved decisions cannot be overwritten.
This delivery cannot mark a case `ACTIONED`, impose a restriction or reinstate
content. Critical-case triage alone therefore does not implement the ADR's
emergency response procedure; staff must use existing authorized lifecycle
controls until case-linked enforcement is delivered.

## Storage and deployment

Apply additive migration `202610240001_marketplace_report_cases` before using
the new endpoints. It adds cases, reports and case events without rewriting
existing marketplace or Blog data. PostgreSQL enforces one open case per
listing/reason and one original report per account/case. Triggers reject
updates/deletes to original reports and audit events.

Audit events retain the authenticated actor/type, action, case and linked
listing, previous/resulting state and severity, reason, evidence reference,
timestamp and correlation ID. Referenced accounts, listings, cases and evidence
are retained with restricted foreign keys. Public-launch retention, deletion
and account anonymization procedures still require the privacy policy from
ADR 0004; ordinary account deletion must not silently discard this history.
Private explanations are not added to request logs by this feature.

`INTEGRATION_DATABASE_URL` enables the real-database reporting suite. Use a
disposable migrated database/schema: the suite creates isolated fixtures and
intentionally preserves append-only evidence. The local verification harness
creates a random schema on the existing local PostgreSQL service and drops only
that schema after a passing run. It never migrates or resets the working schema.
