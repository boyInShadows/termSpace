---
version: 1
slug: "app-dashboard"
primary_target: "app/dashboard/page.tsx"
related_targets: ["features/dashboard", "features/creator", "app/dashboard/settings", "app/dashboard/studio"]
---

# Creator dashboard

Visitor mode: Operate. Creators review saved declarations, verify an external
source and submit a draft to moderators. The interface must keep those states
distinct from publication and preserve draft work on failed requests or cancelled
navigation. Account verification remains required outside the temporary localhost
email-service bypass.

## Direction contract

Use the existing Datasheet language: Geist/Estedad for words, mono and tabular
figures for references and measurements, square controls, ruled sections and
aligned values. Use existing theme tokens only. Primary actions use ink on ground;
the accent marks selection and focus. Lifecycle colors are shared between studio
and overview, with visible labels. No serif display, ornamental badges, elevated
cards, decorative motion or colored panel washes.

Overview, studio, listing editor, releases, library collections and Profile share
this vocabulary. Saved listings and acquisitions stay distinct; public
availability and per-item recovery remain explicit.
The root layout supplies the main site's global header on every dashboard route.
Workspace search is a content control, without a second toolbar or repeated
breadcrumb. Profile lives in the dashboard, not the shared account dropdown.
Account, theme, locale and role-aware global navigation have one implementation.
The root header hydrates with the session provider, without a separate boundary
that could race sign-in. Provider connections work without a listing and fail
independently of release history. The root skip link
targets the workspace content. Sticky sidebar offsets follow the measured global
header height, and mobile disclosures fit landscape and close on navigation.
Phone navigation stays fixed; editor actions clear its height and safe area.
Search is available at every width. Long identifiers yield to readable route
labels, and Latin identifiers are isolated in Persian. The listing editor has
five freely navigable steps, a completion percentage, labelled declaration rows
and a review checkpoint. Inactive steps retain their fields and validation opens
the first invalid step. Save for later keeps account-scoped partial work on this
browser; Save draft stores a complete, validated account draft without publishing.
Loading, storage failure, empty and ready states remain explicit.

Context help uses the shared square, 44px question-mark control at the logical
end of relevant field or section labels. Its bordered, opaque bubble opens on
hover, focus or tap, supports Escape, Tab and outside dismissal, and keeps concise
EN/FA examples with Latin text isolated. Formats, errors and public-secret warnings
remain visible beside fields. Help distinguishes browser saves, account drafts,
source verification, moderation and publication without promising a sandbox.

Verification: both locales and themes at phone, tablet and desktop widths,
keyboard focus/search, sticky-action hit tests, retry and dirty navigation tests,
and local before/after captures. Real device keyboards and safe areas, provider
credentials and maintainer review of Persian wording remain separate acceptance.
