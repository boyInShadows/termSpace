---
version: 1
slug: "app-creators"
primary_target: "app/creators/[handle]/page.tsx"
related_targets: ["features/creators", "components/marketplace/product-card", "features/product/title-block"]
---

# Public creator profiles

Visitor mode: Operate. This extends public catalog discovery using the existing
Datasheet identity and catalog cards; it introduces no new visual system.

## Direction contract

THESIS: identify who publishes a listing and inspect that creator's public work.
OWN-WORLD: existing Geist/Estedad, ground/ink tokens, ruled sections, square
controls and the standard identity badge; identity verification is not safety review.
STORY: arrive from a listing, read the creator's name/handle/bio, browse published
work, then inspect a listing. Private creators and unavailable handles return 404.
FIRST VIEWPORT: the shared header, an Explore link, avatar/name/handle and bio,
followed by the published-listings heading, total and first catalog row.
FORM: existing catalog composition extended with a creator header and URL pager.
No concept tournament or visual-system replacement; every card remains standard.
FINISH: inspect EN/FA, both themes, 320/768/1280, keyboard navigation, pagination,
404 and retry states; unreviewed and undocumented is unfinished.

Only public fields and listings may reach this route, including counts. No follow
control or follower metric is added without its actual underlying behavior.
