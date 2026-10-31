---
name: TermSpace
description: One soft navy-and-paper identity for public discovery, account flows and the creator dashboard.
colors:
  ground-dark: "oklch(14.5% 0.018 262)"
  ink-dark: "oklch(96% 0.008 262)"
  ground-light: "oklch(97.89% 0.0029 264.5)"
  surface-light: "oklch(100% 0 0)"
  ink-light: "oklch(23.53% 0.0707 262.7)"
  signal: "oklch(54.61% 0.2152 262.9)"
  ink-muted-light: "oklch(52% 0.04 257.4)"
  hairline-light: "oklch(92.88% 0.0126 255.5)"
  sage: "oklch(96.27% 0.0107 158.8)"
  paper: "oklch(97.65% 0.0098 87.5)"
  mist: "oklch(96.16% 0.0114 252.1)"
  lavender: "oklch(96.91% 0.0161 293.8)"
typography:
  heading:
    fontFamily: "Geist Variable, Geist Fallback, sans-serif"
    fontWeight: 600
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Geist Variable, Geist Fallback, sans-serif"
    fontSize: "1rem"
    lineHeight: 1.75
  label:
    fontSize: "12px"
  badge:
    fontSize: "11px"
  data:
    fontSize: "13px"
    fontFamily: "Geist Mono Variable, ui-monospace, monospace"
  og-display:
    fontFamily: "Newsreader Variable, Georgia, serif"
    fontWeight: 500
  persian:
    fontFamily: "Estedad Variable, Geist Variable, sans-serif"
rounded:
  nav: "8px"
  control: "12px"
  card: "16px"
  chip: "9999px"
spacing:
  cell: "16px"
  control-height: "44px"
---

# Design System: TermSpace

Creative North Star: **Paper & Signal**. Updated 2026-10-31. One identity for
public discovery, account flows and the creator dashboard: a cool paper ground,
white panels, navy ink and a single blue signal, softened with rounded controls,
light panel shadows and pastel tints.

The direction is inspired by the calm, card-led feel of anicards.ir. It is
inspired by, not copied: no logo, wordmark, copy, imagery, illustration or
component is taken from that site. Only generic qualities — cool grey palette,
navy/blue pairing, 8/12/16 radii, pill chips, soft shadows, pastel cards — carry
across.

This retires the previous "Datasheet" rules. Square controls, ruled-only
structure, the ban on shadows and the zero-radius dashboard override are no
longer the house style. What survives from the Datasheet is its discipline:
Geist and Estedad, dense but legible type, explicit trust metadata, visible
state labels and restrained motion. Do not revive the older "Signal & Void"
serif, gradients, glass panels, glow or scroll entrances either.

## Surface modes and hierarchy

- Landing: Persuade. A centered outcome headline, search and featured shelf share
  the first desktop viewport. Follow with discover/inspect/install, explicit
  trust information and newsletter signup. Preserve the actual product copy.
- Discovery, product, account, moderation and dashboard: Operate. Prioritize the
  task, readable state, scanability and recovery. The root web layout owns the
  same global navigation for public pages and dashboard routes. The nested
  dashboard layout adds workspace search, desktop sidebar, phone tabs and the
  session gate, without duplicating account, theme or language controls.
- Blog: Read. It remains a separate editorial app with its own reading hierarchy;
  project-wide design changes still require Impeccable and cross-surface review.

## Foundations

### Colour

Use `styles/tokens.css` and the `@theme` block in `styles/globals.css`. There is
one palette, and both themes share its hues: the light theme is a cool paper
ground (`#f7f8fa` converted to OKLCH) with white surfaces and navy ink; the dark
theme is a blue-black ground derived from the same hue.

| Role | Light | Dark |
| --- | --- | --- |
| background | `--background` cool paper | blue-black |
| surface / card | `--surface` white | raised blue-black |
| ink | `--foreground` navy | near-white |
| muted text | `--muted-foreground` slate | light slate |
| border | `--border` hairline | low-contrast blue |
| field border | `--input` | low-contrast blue |
| signal (links, focus, current) | `--primary` blue | brighter blue |
| action fill | `bg-foreground` navy | near-white ink |
| success / warning / danger | `--success` / `--warning` / `--destructive` | same roles, lifted for dark |

Rules:

- Buttons that perform the page's main action use **ink** (`bg-foreground` +
  `text-background`), not the blue. Blue is the signal: links, focus rings,
  current route, selected filters and the thin progress bar.
- Pastel tints (`--tint-sage`, `--tint-paper`, `--tint-mist`, `--tint-lavender`)
  are grounds for feature or summary cards, never for state. State stays
  success/warning/danger with a visible text label.
- Never colour alone. Every state carries words.
- Use `border-border` for rows and hairlines, `border-border-strong` for card
  frames and field boundaries. Structure still comes from alignment and rules;
  elevation is a light second signal, not the primary one.

### Shape

| Token | Value | Use |
| --- | --- | --- |
| `rounded-nav` | 8px | header/menu rows, small tabs |
| `rounded-control` | 12px | buttons, inputs, selects, textareas |
| `rounded-card` | 16px | panels, cards, dialogs, popovers |
| `rounded-chip` | pill | badges, tags, filter chips |

`rounded-lg`, `rounded-xl` and `rounded-2xl` all resolve to the 16px panel step
so older call sites match without a rewrite. Avatars, switch tracks and status
dots stay circular because the shape communicates the function. Nothing on the
app surfaces should render a hard square corner any more; the dashboard's
control-radius fallback uses `:where()` so an explicit utility always wins.

### Elevation

One shadow family, navy-tinted in light and black in dark, defined in
`tokens.css` and exposed as `shadow-panel` / `shadow-promo`:

- `shadow-panel`: `0 2px 8px` at 7% navy (light) — cards, menus, popovers.
- `shadow-promo`: `0 3px 12px` — the one promoted/summary surface.
- Buttons may use `shadow-sm`. Nothing else.

Shadows are offset and blurred. A zero-offset coloured halo, a glow, or a shadow
on body text is not part of this system.

### Type

Geist carries words and headings; Estedad carries Persian. `.editorial` is a
compatibility class for the shared sans heading style, not a second font family.
Newsreader survives only as the display face inside generated Open Graph cards
(`lib/og/card.tsx`); it is not an app heading face. Geist Mono is reserved for
commands, versions, identifiers and comparable data.

Labels use sans, 12px and restrained tracking. Persian has no tracking or forced
capitals. Latin identifiers use `bdi`/`dir="ltr"`; creator prose keeps `.ts-bidi`.
Body text and form input remain readable on phones, with fields normally 16px.
Compact 11px metadata and 13px mono data are an intentional ramp, not body copy.

Headings stay weight-led: 600 in Geist, no gradient text. A page may introduce a
short blue label above a section heading (the eyebrow pattern); it is optional,
and the heading must still read on its own without it.

## Shared components and states

Use `Button`/`buttonVariants`, `Input`, `Badge`, `Avatar` and the existing status
patterns.

- `Button`: `rounded-control`, 44px minimum height. Primary is navy ink with
  background text and `shadow-sm`; secondary and outline use a bordered white
  surface with `shadow-sm`; ghost stays quiet; destructive is red.
- `Input` / `Textarea` / `Select`: `rounded-control`, `bg-surface`,
  `border-input`, blue focus ring. Never a square field.
- `Badge`: pill, 11px/600, 1px border. Neutral by default; blue for editorial
  selection; success/warning/info tints for their named states.
- `ProductCard` and `CompactProductCard`: `rounded-card`, `border-border`,
  `bg-surface`, `shadow-panel`, a 1px border that darkens on hover, and an
  optional pastel `tint`. Titles are sans headings; trust metadata, creator
  identity and action placement stay stable across cards.
- Menus, popovers and the account panel: `rounded-card` + `shadow-panel`,
  `rounded-nav` rows for the items inside.

Cards and compact cards share explicit trust metadata, creator identity and
stable action placement. Type badges are neutral; editor selection uses the blue
signal. Green denotes reviewed/successful states, amber caution, red
absence/errors/destructive actions. Keep visible state labels so colour never
carries meaning alone. An unreviewed or undeclared field must remain explicit.
Synthetic fixtures are test evidence, never real claims.

Keep all loading, empty, failure, retry, disabled and success states. Never hide
failed catalogue requests with fabricated cards/counts or change role permissions
to make the UI appear complete. Account security and provider token clearing
remain authoritative behavior, independent of presentation.

## Layout and motion

Public pages use `container-page` (76rem, 1rem phone gutters). Use existing space
increments and section rhythm; dashboard density follows the task. Alternating
section bands (background / surface / muted) are welcome on marketing pages; the
dashboard stays on one ground. At phone widths, stack sections and keep
filters/menus reachable. Sticky surfaces remain opaque enough to read. Long
content wraps, tables scroll within their region, and fixed actions clear phone
navigation and safe areas.

The shared header measures its actual height for sticky-sidebar and focus-scroll
offsets, including announcement dismissal, condensation and mobile disclosure.
Dashboard controls share focus-scroll clearance above the fixed bottom tabs,
including safe-area insets. Menus close on route changes because the layout
persists. A single localized skip link precedes navigation and targets each
route's focusable `main#content`. Keep the header in the root hydration tree: a
separate Suspense boundary can race a fast session response and mismatch its
anonymous server HTML. Pages and loading boundaries render content, not a second
global header. Use nested Next.js layouts for persistent structure rather than a
route overlay.

Content is visible immediately: no card lift, no scroll reveals, no blinking
decorative carets, no typed placeholders, no glow. A card may change its border
colour on hover; it does not travel or grow its shadow. Short feedback
transitions, theme feedback and listing navigation transitions may remain when
they communicate a change. Honor reduced motion. The discovery scroll-edge fade
is a functional overflow cue.

## Required verification

Use Impeccable for design planning, implementation and review. Inspect rendered
home, dashboard, explore, product and account paths in EN/FA, light/dark and
320/768/1280px widths. Check keyboard focus (the ring follows each element's own
radius), minimum 24px targets (normally 44px controls), contrast, navigation,
long content and relevant recovery states. Keep local before/after evidence.
Run required root checks, browser regressions, Lighthouse and the requested
design detector. A clean detector alone is not visual acceptance. Real phones,
provider credentials and native Persian wording review must be recorded
separately when unavailable.

Detector review (2026-10-31): advisory-only findings were checked against the
rendered pages. Geist is the established product face, not a font-selection
proposal. Compact 11px metadata/badges, 12px labels and 13px mono data are the
existing intentional ramp; the showroom's 9px palette values are reference
annotations, not body copy or controls. The 2px focus outline follows the
element's control/card radius instead of forcing a shared corner. Short spring
easing is limited to theme/step feedback and respects reduced motion; there is
still no entrance, card lift or bouncing page content.
