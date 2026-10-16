---
name: TermSpace
description: A marketplace for agentic coding tools, dressed as a terminal for the AI era.
colors:
  void: "oklch(14.5% 0.022 286)"
  void-deep: "oklch(10.5% 0.020 286)"
  void-surface: "oklch(18.5% 0.026 286)"
  void-surface-raised: "oklch(23% 0.03 288)"
  void-muted: "oklch(26% 0.026 286)"
  void-border: "oklch(30% 0.028 286)"
  void-border-strong: "oklch(54% 0.036 288)"
  void-input: "oklch(52% 0.032 286)"
  starlight: "oklch(96% 0.01 286)"
  starlight-muted: "oklch(73% 0.024 286)"
  plasma: "oklch(68% 0.195 292)"
  plasma-hover: "oklch(74% 0.185 292)"
  plasma-soft: "oklch(30% 0.085 292)"
  plasma-ink: "oklch(13% 0.03 292)"
  signal: "oklch(80% 0.135 196)"
  signal-soft: "oklch(30% 0.06 200)"
  signal-ink: "oklch(15% 0.04 220)"
  ion: "oklch(72% 0.215 340)"
  verified: "oklch(82% 0.175 152)"
  caution: "oklch(83% 0.15 85)"
  alert: "oklch(66% 0.205 22)"
  plasma-text-1: "oklch(80% 0.150 292)"
  plasma-text-2: "oklch(78% 0.170 340)"
  plasma-text-3: "oklch(84% 0.120 200)"
  daylight: "oklch(97.6% 0.006 286)"
  daylight-deep: "oklch(94.5% 0.012 286)"
  daylight-surface: "oklch(99.3% 0.003 286)"
  daylight-border: "oklch(89.5% 0.012 286)"
  daylight-ink: "oklch(19% 0.028 286)"
  daylight-ink-muted: "oklch(45% 0.026 286)"
  daylight-plasma: "oklch(50% 0.225 292)"
  daylight-signal: "oklch(50% 0.115 210)"
  daylight-ion: "oklch(55% 0.235 340)"
  daylight-verified: "oklch(48% 0.135 152)"
typography:
  display:
    fontFamily: "Newsreader Variable, Newsreader Fallback, Georgia, serif"
    fontSize: "clamp(2.6rem, 1.2rem + 5.6vw, 4.9rem)"
    fontWeight: 500
    lineHeight: 0.98
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Newsreader Variable, Newsreader Fallback, Georgia, serif"
    fontSize: "1.875rem"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Newsreader Variable, Newsreader Fallback, Georgia, serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.375
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Geist Variable, Geist Fallback, ui-sans-serif, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5rem
  label:
    fontFamily: "Geist Mono Variable, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.1rem
    letterSpacing: "0.16em"
  meta:
    fontFamily: "Geist Variable, Geist Fallback, ui-sans-serif, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1
  persian:
    fontFamily: "Estedad Variable, Geist Variable, sans-serif"
    fontWeight: 400
    lineHeight: 1.8
    letterSpacing: "normal"
rounded:
  sm: "0.35rem"
  md: "0.6rem"
  lg: "0.9rem"
  xl: "1.25rem"
  full: "9999px"
spacing:
  gutter: "1rem"
  card: "20px"
  section-y: "clamp(4rem, 3rem + 4vw, 7rem)"
  container-content: "76rem"
  container-copy: "44rem"
  grid-cell: "56px"
components:
  button-primary:
    backgroundColor: "{colors.plasma}"
    textColor: "{colors.plasma-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.plasma-hover}"
  button-secondary:
    backgroundColor: "{colors.void-surface}"
    textColor: "{colors.starlight}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "44px"
  button-secondary-hover:
    backgroundColor: "{colors.void-muted}"
  button-ghost:
    textColor: "{colors.starlight}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "44px"
  button-ghost-hover:
    backgroundColor: "{colors.void-muted}"
  button-outline:
    textColor: "{colors.plasma}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "44px"
  button-outline-hover:
    backgroundColor: "{colors.plasma}"
    textColor: "{colors.plasma-ink}"
  button-sm:
    padding: "0 12px"
    height: "36px"
  input:
    backgroundColor: "{colors.void-surface}"
    textColor: "{colors.starlight}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "44px"
  badge:
    backgroundColor: "{colors.void-muted}"
    textColor: "{colors.starlight}"
    typography: "{typography.meta}"
    rounded: "{rounded.sm}"
    padding: "4px 8px"
  listing-card:
    backgroundColor: "{colors.void-surface}"
    textColor: "{colors.starlight}"
    rounded: "{rounded.lg}"
    padding: "{spacing.card}"
  trust-chip:
    textColor: "{colors.starlight}"
    rounded: "{rounded.xl}"
    padding: "8px 10px"
---

<!-- BASELINE (2026-10-16, branch `redesign`): this documents the incumbent
     "Signal & Void" system as built, before the redesign. Treat it as evidence
     and anti-reference for the new world, not as the target. Replace this file
     when the redesign's world is committed. Source of truth for values:
     styles/tokens.css and styles/globals.css; motion spec: docs/motion.md. -->

# Design System: TermSpace

## Overview

**Creative North Star: "Signal & Void"**

A terminal for the AI era: signal separated from noise. The page is a deep, violet-cast void, never grey and never cream. Light shows up in it as emission rather than paint. A single plasma violet carries the brand. A cyan signal marks the technical metadata (versions, commands, live state), the way a cursor marks the active line. The editorial serif headline set against mono labels says the catalog is curated, but the goods are developer tools.

Density is moderate. Catalog grids are calm cards on a flat surface, and the atmosphere (CSS nebula, optional WebGL plasma field, faint 56px grid, grain) lives only behind the hero. Motion is short and purposeful. Nothing except the hero manifest sequence and the marquee runs longer than 640 ms, and every effect has a reduced-motion end state that renders without script.

Persian (RTL) is first-class. Estedad replaces both faces, tracking and capitals are removed from joined script everywhere, and creator-supplied English inside a Persian page keeps its own direction.

**Key Characteristics:**
- Violet-cast dark void as the default theme; a hand-tuned "Daylight Void" light theme, not an inversion.
- One brand hue (Plasma 292) covering large areas; cyan Signal (196) only on small technical elements.
- Plasma → Ion → Signal sweep as the one signature gradient, for display text and hairline rules.
- Newsreader editorial serif for headings, Geist for UI, Geist Mono for uppercase eyebrows.
- Terminal motifs: blinking caret in the logo, typed manifest in the hero, mono metadata.
- Flat tonal surfaces with a hover lift; glow reserved for rare brand moments.

## Colors

A violet-tinted night with one emissive brand hue, one technical accent, and a green that is legally a trust claim.

### Primary
- **Plasma** (`plasma`): the brand. Primary buttons, current nav item, favourite heart, focus ring (`plasma-hover`), selected states, `primary-soft` washes. It's the only hue allowed to cover large areas. In light mode it deepens to `daylight-plasma` so it stays legible on paper.

### Secondary
- **Signal** (`signal`): technical precision. Live-status dots, the typed-manifest caret, info states, metadata accents, `glow-signal`. Always small. On paper it becomes `daylight-signal`.

### Tertiary
- **Ion** (`ion`): the gradient partner. It exists only inside the Plasma → Ion → Signal sweep, the nebula and `rule-plasma` hairlines. It's never a flat fill.
- **Plasma text stops** (`plasma-text-1..3`): dedicated stops for the headline gradient, pushed for contrast. Every point clears 9:1 on the void (6.5:1 on daylight), and still clears AA at 90% opacity mid-decode.

### Semantic
- **Verified** (`verified`, also `--success`): trust, safety and verification. Nothing else.
- **Caution** (`caution`) and **Alert** (`alert`): warning badges and destructive actions respectively.

### Neutral
- **Void** (`void`): page background. `void-deep` sits behind it for recessed bands.
- **Void Surface** (`void-surface`): cards, inputs, secondary buttons. `void-surface-raised` is for popovers and stacked panels.
- **Void Muted** (`void-muted`): hover fills, badge backgrounds, disabled inputs.
- **Void Border** (`void-border`): every default hairline (applied globally to `*`). `void-border-strong` is for card hover, secondary-button outlines and focused containers. `void-input` is for field strokes.
- **Starlight** (`starlight`): body text. `starlight-muted` is for secondary copy and eyebrows (8.25:1 on the void, 6.98:1 on daylight).
- **Daylight set** (`daylight-*`): the light theme keeps the same 286 violet cast so the brand survives the switch.

### Named Rules
**The Plasma Coverage Rule.** Plasma is the only colour allowed to cover large areas. Every other hue is a detail.

**The Signal Stays Small Rule.** Signal lives on dots, carets, version chips and info text. If a Signal shape is bigger than a button, it's wrong.

**The Ion Never Fills Rule.** Ion appears only inside gradients. A flat Ion fill breaks the system.

**The Verified Lock Rule.** If it's green, it's a trust claim. Green never decorates.

## Typography

**Display Font:** Newsreader Variable (with a metric-matched Times New Roman fallback, then Georgia)
**Body Font:** Geist Variable (with a metric-matched Arial fallback)
**Label/Mono Font:** Geist Mono Variable
**Persian:** Estedad Variable replaces both the serif and the sans under `dir="rtl"`

**Character:** a literary serif with tight negative tracking over an engineered grotesk and a mono label voice. It's a curated publication about command-line tools.

### Hierarchy
- **Display** (500, `clamp(2.6rem, 1.2rem + 5.6vw, 4.9rem)`, 0.98): the hero headline only, usually wrapped in `.text-plasma`. Persian caps it at `clamp(2.6rem, 6.5vw, 4.4rem)`.
- **Headline** (400, 1.875–2.25rem, -0.025em): section and page `h2`s, always with the `.editorial` class.
- **Title** (600, 1.25rem, 1.375): listing card names and panel titles. The serif stays.
- **Body** (400, 0.875rem / 1.5rem): almost all UI copy. Long-form copy is capped at `container-copy` (44rem).
- **Label** (600, 0.75rem, 0.16em, uppercase, mono): `.eyebrow` above headings and on metadata. In Persian it switches to Estedad with no tracking and no capitals.
- **Meta** (11px): card footers, badges, ratings, dates. Dates and versions are wrapped `dir="ltr"`.

### Named Rules
**The Joined Script Rule.** No tracking and no capitals on Persian text, anywhere. Eyebrows are told apart by colour and size alone. Latin data islands (`dir="ltr"`) keep their styling.

**The Bidi Plaintext Rule.** Creator-supplied text (`.ts-bidi`) takes its direction from its first strong character, so English in a Persian page keeps its full stop at the end.

**The Metric Fallback Rule.** Every web font has a size-adjusted local fallback, so the swap never moves text.

## Layout

The layout is one centred column, `min(100% - 2rem, 76rem)` (`.container-page`). That gives a 1rem gutter on phones and caps at 76rem. Prose caps at 44rem. Every page section uses the same vertical rhythm, `--section-y` (`clamp(4rem, 3rem + 4vw, 7rem)`). That replaced per-section padding pairs, which left ~250 px of dead space at wide widths.

The header is sticky: 64 px, condensing to 56 px on scroll. It sits on `void` at 80% opacity with a heavy backdrop blur. A plasma hairline along its bottom edge doubles as the reading-progress bar. Primary nav shows from `md` up. Below that, the menu is a sticky sheet under the header. There's an extra `xs` breakpoint at 30rem. Cards sit in responsive grids with a list variant that becomes a row from `sm`, its footer moving to a 16rem inline-end column. Card internals use a floor height on the clamped outcome line so every card in a row reaches its divider at the same y.

All direction-sensitive spacing uses logical properties (`ms-`, `pe-`, `border-s`). Directional icons flip under `rtl:`.

### Named Rules
**The One Rhythm Rule.** Sections never set their own block padding. They use `.section-y`.

## Elevation & Depth

Surfaces are flat and tonal at rest. Depth comes from the void → surface → surface-raised lightness steps and hairline borders. Lift appears as a response to state: a 2 px rise plus `shadow-lift` on hover (`.ts-lift`, cards). Glow is light being emitted, used on a few brand moments (the browse section, the home page, the process panel) and never as structure. Translucent blurred `.panel`s are kept for elements floating over the hero atmosphere, such as trust chips.

### Shadow Vocabulary
- **Soft** (`--shadow-soft`): resting separation for floating elements. It's barely visible on the void.
- **Lift** (`--shadow-lift`): hover and active elevation for cards and trust chips.
- **Plasma glow** (`--glow-plasma`, utility `shadow-plasma`): a 1 px plasma ring plus a 34 px plasma bloom, for brand moments only.
- **Signal glow** (`--glow-signal`, utility `shadow-signal`): a 28 px cyan bloom on live and technical highlights.

Exact values for both themes are in the sidecar and in `styles/tokens.css`.

### Named Rules
**The Emission Rule.** Glow means something is emitting signal. If nothing is live or branded, there's no glow.

**The Atmosphere Stays Behind the Hero Rule.** The nebula, plasma field, grid field and grain belong to the hero. Catalog and dashboard surfaces stay quiet.

## Shapes

Corners are gentle and step up with the element's size: small for badges (0.35rem), medium for buttons and inputs (0.6rem), large for cards (0.9rem), extra-large for trust chips and hero panels (1.25rem). Pills (`full`) are for community tags, status dots and avatars. Borders are 1 px hairlines. The logo is a lowercase serif wordmark followed by a 2 px plasma caret that blinks with `steps(2)`, like a real cursor, not a fade.

**Known drift (baseline).** Tailwind's default `rounded-2xl` (1rem) is used on moderation and dashboard panels and is *smaller* than this system's `rounded-xl` (1.25rem), so the scale inverts there. `rounded-[var(--radius-card)]` duplicates `rounded-lg`.

## Components

### Buttons
Confident, tactile and quick. A 1 px rise on hover, settling in 80 ms on press.
- **Shape:** gently rounded (`rounded.md`), 44 px minimum height (36 px `sm`, 48 px `lg`, 44 px square `icon`).
- **Primary:** Plasma fill, plasma-ink text, semibold 0.875rem, and a small shadow. On hover it changes to `plasma-hover`.
- **Secondary:** Void Surface with a strong border and Starlight text, changing to Void Muted on hover. It's the "View details" button on cards, and it turns plasma as the card is hovered.
- **Ghost:** text only, with a Void Muted fill on hover. Used for header actions, the language switch and icon buttons.
- **Outline:** a Plasma border and text that fill solid on hover.
- **Destructive:** an Alert fill.
- **Focus:** a 2 px Plasma ring with a 2 px void offset. Disabled is 45% opacity with no pointer events.

### Badges / Chips
- **Style:** small radius, 1 px border, 11 px semibold, with tinted variants at 10% fill / 20–25% border: Plasma ("Editor's pick"), Caution ("Trending"), Verified, Signal (info), and Outline for community tags.
- **Trust chip:** a signature chip. It's a blurred `.panel` with `rounded.xl` and lift shadow, a 24 px icon tile, an 11 px label and a 9 px mono uppercase sub-line. The same component states one claim on the hero and on the detail header.

### Cards / Containers
- **Listing card:** `rounded.lg`, Void Surface, hairline border, 20 px padding. On hover it lifts by 2 px, its border strengthens and it picks up `shadow-lift`. With focus inside, its border turns Plasma. The layout is type badges and a favourite heart, then the serif title (which shares a view-transition name with the detail header and morphs into it), a two-line clamped outcome, the creator, community pills, a divided footer with compatibility, meta, and the action.
- **Panels:** Void Surface with a hairline border and 20–28 px padding, holding dashboard and moderation sections.

### Inputs / Fields
- **Style:** 44 px, `rounded.md`, a Void Input stroke on Void Surface, muted placeholder. The stroke strengthens on hover.
- **Focus:** the border turns Plasma, plus a 2 px ring at 20% Plasma.
- **Disabled:** Void Muted fill at 60% opacity.

### Navigation
- **Header nav:** 0.875rem with 32 px gaps. Hover turns the link Plasma and grows a `rule-plasma` underline from the inline start. The current route is semibold Plasma and keeps its underline.
- **Announcement bar:** a 36 px strip above the header with a Signal dot, muted text and a Plasma link.
- **Mobile:** stacked links in a blurred sheet under the header, separated by hairlines.

### Hero manifest sequence (signature)
A terminal card that types a manifest one monospace character at a time (`clip-path` stepping by `1ch`). It has a Signal block caret, rows that fade up 4–6 px, and chips that spring in. Lines are laid out from the start and only revealed, so the card never changes size. Under reduced motion the finished frame renders from first paint with no script. The stage carries a resting 3D tilt (−3° X, −9° Y) that the pointer and scroll add to.

## Do's and Don'ts

### Do:
- **Do** reference colours through the theme tokens (`bg-primary`, `text-muted-foreground`), never raw OKLCH in components, so both themes work.
- **Do** keep Plasma as the only large-area colour, and keep Signal on elements no bigger than a button.
- **Do** use `.editorial` for every heading and `.eyebrow` for every label above one.
- **Do** use `.section-y` and `.container-page` for every section.
- **Do** give every effect a reduced-motion end state that renders without script. Use durations from the token set (80–640 ms) and `--ease-out-expo` for entrances.
- **Do** use `data-enter="nudge"` (rise, no fade) on the LCP text. A fade on it costs ~430 ms of mobile LCP.
- **Do** use logical properties and `rtl:` icon flips, and wrap versions, commands and dates in `dir="ltr"`.

### Don't:
- **Don't** use Ion as a flat fill, or green for anything that isn't a trust claim.
- **Don't** put tracking or uppercase on Persian text.
- **Don't** put the nebula, grid field or glow on catalog or dashboard surfaces.
- **Don't** cancel the focus ring with `outline-none` unless a ring replaces it.
- **Don't** set type below 11 px. The trust chip's 9 px sub-line and the stray 10 px labels are baseline drift, not precedent.
- **Don't** invent tracking values. The baseline already scatters 0.12em, 0.14em and 0.16em; the eyebrow's 0.16em is the token.
- **Don't** reach for `rounded-2xl`. It sits below `rounded-xl` in this scale.
