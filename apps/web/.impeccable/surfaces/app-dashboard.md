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

Overview, studio, listing editor, releases and Settings share this vocabulary.
Phone navigation stays fixed; editor actions clear its height and safe area.
Search is available at every width. Long identifiers yield to readable route
labels, and Latin identifiers are isolated in Persian. The long form has section
links, labelled declaration rows and a review checkpoint; no fields are hidden
from validation. Loading, failure, empty and ready states remain explicit.

Verification: both locales and themes at phone, tablet and desktop widths,
keyboard focus/search, sticky-action hit tests, retry and dirty navigation tests,
and local before/after captures. Real device keyboards and safe areas, provider
credentials and maintainer review of Persian wording remain separate acceptance.
