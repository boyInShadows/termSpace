---
target: explore page
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:C:\\Users\\shayan\\Documents\\ChatGPT\\termSpace\\apps\\web\\app\\explore\\page.tsx"
target_fingerprint: "sha256:de4537a4e19924002f0c801e30cc6083468b9dd710f1290a409e6b032c23d61f"
target_path: "C:\\Users\\shayan\\Documents\\ChatGPT\\termSpace\\apps\\web\\app\\explore\\page.tsx"
timestamp: 2026-10-17T17-18-14Z
slug: app-explore-page-tsx
closed: true
---
Method: dual-agent (A: general-purpose design review · B: general-purpose detector + browser)

# Critique: /explore (apps/web/app/explore/page.tsx)

Score 21/40 (Acceptable). Heuristics: 1=3, 2=2, 3=2, 4=2, 5=3, 6=2, 7=2, 8=2, 9=2, 10=1.

Specificity verdict: interchangeable apart from the card trust strip (product-parts.tsx:97-137). Explore is the Signal & Void migration debt named in DESIGN.md line 210 (Newsreader H1/card titles, 14px-radius cards, hover lift/shadow, pill badges, blurred sticky bar).
Detector: CLI scan 0 findings; in-page 2 findings (blinking-cursor span.ts-caret; hero-eyebrow-chip "Community library").

Priority issues
- [P1] Trust info weakest where the decision is made: "Safety reviewed" beside "Permissions not declared" under one green shield; no pinned release on the card. Fix: ruled 13px rows (Reviewed, Reads/Writes/Network, Pinned release), red not-declared mark. Commands: layout, clarify.
- [P1] Flat hidden facet model: 4 selects + switch, no counts, platform third as "Compatibility", all behind a drawer on mobile. Fix: visible platform/type toggles with counts, permissions facet. Commands: layout, adapt.
- [P2] Still Signal & Void: rebuild as the datasheet (square, rules not cards, Geist/Geist Mono, 11px labels); needs a direction decision (ruled table vs card grid). Commands: shape, typeset.
- [P2] Dead ends: empty state only "Clear all", inert filter chips, "Verified" hardcoded English, generic error. Commands: harden, clarify.
- [P3] First screen spent before any result (first card y=562 desktop, y=726 mobile). Command: distill.

Measured (B): 3 font families, 7 sizes, no real box-shadows, 4 gradients, no page overflow at 375, 11 targets under 24px on desktop (3 checkboxes 16x16, 8 footer links 18px high), 50 targets under 44px at 375.

Personas: trust-evaluating developer (cannot compare permissions; no version/source; fixtures unlabelled), Casey (first card y=726, filters hidden, 50 small targets), Sam (role=tab without tabpanel/arrows, inert chips, duplicate links, unmeasured muted contrast).

Minor: unlabelled date, resource vs listing, grid/list not persisted, sort lacks transparency, Latin digits in Persian count, 24 articles in DOM after client nav.

Questions: why is permissions fourth-loudest on the card; should explore be a ruled results table; should "reviewed but declares nothing" get a green shield.
