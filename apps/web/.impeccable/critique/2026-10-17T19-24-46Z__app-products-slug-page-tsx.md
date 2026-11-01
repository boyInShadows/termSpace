---
target: product detail page
total_score: 23
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:C:\\Users\\shayan\\Documents\\ChatGPT\\termSpace\\apps\\web\\app\\products\\[slug]\\page.tsx"
target_fingerprint: "sha256:87d5356b8110ea5afed0539989052fbe7311a33b3894e300ada5c9c9cfd608f7"
target_path: "C:\\Users\\shayan\\Documents\\ChatGPT\\termSpace\\apps\\web\\app\\products\\[slug]\\page.tsx"
timestamp: 2026-10-17T19-24-46Z
slug: app-products-slug-page-tsx
---
Method: dual-agent (A: design review - B: detector and browser evidence)

# Critique: /products/[slug] (single listing page)

Score 23/40 (Acceptable). Heuristics: 1=2, 2=3, 3=2, 4=2, 5=2, 6=3, 7=2, 8=2, 9=2, 10=3.
Note: the dev server's mock listing has no release or versions; provenance, picker and install dialog were judged from source.

## Design specificity
Content is product-specific (manifest, not-declared states, provenance); the skin is the generic Signal & Void dark SaaS look (rounded-xl cards, serif headings, pill chips, violet panel), which DESIGN.md calls migration debt. Detector: 1 CLI advisory (design-system-font-size, page.tsx:107, text-[15px]); overlay: blinking caret, 3x 9px labels, 2x 11px text, cramped padding on disabled CTA, kicker above heading. No false positives.

## Priority issues
- [P0] The version picker does not control what gets added. VersionPicker only swaps the notes text; acquireProduct(slug, key) in lib/api.ts:120 sends no release. Fix: send the release and label "Add vX", or make the picker a read-only changelog; show pinned ref and digest by the button. Commands: harden, clarify (touches API and lib/api.ts, shared surfaces).
- [P1] The first screen doesn't answer "will it work with my platform". Platform only in <title> and "Works with" near the bottom; at 375px the CTA is at y~780 of 812, no sticky acquire bar, page 6,672px. Command: layout.
- [P1] The no-release state is an unreadable disabled button (~2.0:1 contrast, wraps at 375px, no reason or next step, hides the sign-in requirement). Fix: status note with reason and next step; keep Save. Commands: clarify, harden.
- [P2] Trust is stated four times at the smallest type (9-11px mono chips, truncated permissions chip, duplicate licence/review in chips, manifest, provenance, panel footnote). Commands: typeset, distill.
- [P2] Whole page is still Signal & Void. Commands: shape, adapt.

## Persona red flags
- Developer on a phone: platform only at the bottom, truncated permissions chip, Add below the fold and disabled, 9px sub-labels.
- Keyboard/screen reader: no skip link; chip group aria-label on a role-less div; "Reviews . 4.9" h2 shows rating not count; Save changes label and aria-pressed (double announce); "Sign in" 46x18px under the 24px floor.
- Persian: "1 user . commercial use" bidi-scrambled (page.tsx:193, product-actions.tsx:187); English creator text right-aligned without ts-bidi/bdi; labels(fa) in page.tsx:75 is a second i18n system; mixed digit separators.

## Minor observations
Footer links 18px tall; header links and Dismiss announcement 24-32px; "Excerpt . SKILL.md" hard-coded; "Licence: Licence not stated" doubled words; "1 resources"; window.confirm for review delete; dev-only hidden duplicate main/h1 from streaming.

## Questions
Why does a creator card get the same weight as the provenance evidence? What if the page were the datasheet, with Add as the ordering row? If the picker can't change what you install, is it a tool, a changelog, or a misleading control?
