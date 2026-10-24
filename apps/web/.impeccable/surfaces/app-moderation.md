---
version: 1
slug: "app-moderation"
primary_target: "app/moderation/page.tsx"
related_targets: ["features/moderation", "app/moderation/cases", "features/reporting", "app/products/[slug]/page.tsx"]
---

# Marketplace reporting and moderation

Visitor mode: Operate. Extend the existing product inspection and staff
moderation workflow with listing reports and private case triage. Inherit the
Datasheet world and existing moderation composition; this is a functional
extension, without a new identity, concept tournament or decision comp.

The product sidebar keeps acquisition first. A native disclosure opens the
report form in place; form code/copy load only on first opening. Closing the
disclosure preserves its entered text. The form explains staff visibility and
returns an opaque receipt; failed writes retain text. Signed-out readers have
a locale-preserving sign-in path. Changing accounts clears private form state.

Staff move between submission and reported-listing queues. The first viewport
shows the case purpose, state filter and actual evidence-led rows; the case
view starts with listing, reason, state, severity and report count. Reports,
decisions and audit events are separate ruled sections. The interaction is
supported by labelled section jumps that move keyboard focus to each section,
so long evidence does not require scrolling through every report to act.
The active queue is labelled and visibly selected. The interaction is
version-checked triage: a stale decision requires explicit reload/review.
Evidence and history have separate URL-backed pagers. Roles gate private reads;
denial, loading, empty, failure, resolved and retry states remain visible.

Use existing tokens, square controls, Geist/Estedad, readable phone fields,
44px controls and visible keyboard focus. Mono is reserved for receipts and
reason codes. Private evidence and untrusted long prose wrap and render as
plain text, never HTML or fetched URLs; Latin references are isolated in RTL.
There is no ornamental motion; native disclosure and existing hover/focus
transitions carry the interaction and respect reduced motion.

Verification covers EN/FA, both themes, phone/tablet/desktop widths, long
evidence, keyboard/focus, disclosure retention, role denial, retry, rate limits,
URL pagination/reload, stale-write recovery and resolved cases. Real devices
and a Persian-speaking maintainer's wording approval remain owner acceptance.
Case-linked restrictions and appeals remain a separate implementation stage.
