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
  action: "#0864D1"
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
    fontFamily: "Geist Variable, Geist Fallback, sans-serif"
    fontWeight: 600
    letterSpacing: "normal"
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
  field-label-gap: "8px"
  related-content-gap: "12px"
  section-gap: "32px"
  marketing-section: "clamp(4rem, 3rem + 4vw, 7rem)"
---

# Design System: TermSpace

## Overview

Creative North Star: **Paper & Signal**. Updated 2026-11-03. One identity for
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

### Scope, authority and implementation status

This is the shared visual contract for `apps/web`, including public pages,
account/onboarding, dashboard, creator and moderation workflows. It records
existing foundations and the rules for applying them consistently; it is not a
claim that every current component already complies. CSS token values come from
[`styles/tokens.css`](styles/tokens.css) and the `@theme` block in
[`styles/globals.css`](styles/globals.css). Prefer existing components over raw
route-specific copies. Ownership, authorization and verification rules in the
repository's [`AGENTS.md`](../../AGENTS.md) still apply.

The dashboard [surface brief](.impeccable/surfaces/app-dashboard.md) describes
its workflows and density within this identity. The
[Impeccable metadata](.impeccable/design.json) is a companion to this file, not a
separate design direction. Refresh both when the established system changes.
Retired screenshots, comments and regression assertions do not establish a new
visual rule; reconcile them with this contract rather than reviving Datasheet.

**Blog decision confirmed by the owner, 2026-11-03:** `apps/blog` retains its
warm paper/amber palette and Manrope/Newsreader editorial typography, with
Estedad for Persian. Its light-only implementation is not a broken version of
the marketplace's dark theme. Both apps share accessibility, form behavior,
keyboard/focus, state feedback, responsive and RTL requirements. Do not import
marketplace theme/provider code or grant editorial permissions to achieve visual
consistency. Blog colors/fonts remain defined in its own CSS/Tailwind config.
Editorial administration is explicitly English-only. Persian public reading and
browse pages remain supported; Persian admin URLs canonicalize to English before
the existing authentication gate. Reader access never grants publishing access.

### Surface modes and hierarchy

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

## Colors

Use `styles/tokens.css` and the `@theme` block in `styles/globals.css`. There is
one palette, and both themes share its hues: the light theme is a cool paper
ground (`#f7f8fa` converted to OKLCH) with white surfaces and navy ink; the dark
theme is a blue-black ground derived from the same hue.

| Role                           | Light                                       | Dark                        |
| ------------------------------ | ------------------------------------------- | --------------------------- |
| background                     | `--background` cool paper                   | blue-black                  |
| surface / card                 | `--surface` white                           | raised blue-black           |
| ink                            | `--foreground` navy                         | near-white                  |
| muted text                     | `--muted-foreground` slate                  | light slate                 |
| border                         | `--border` hairline                         | low-contrast blue           |
| field border                   | `--input`                                   | low-contrast blue           |
| signal (links, focus, current) | `--primary` blue                            | brighter blue               |
| action fill                    | `--action` #0864D1                        | same #0864D1 / white text              |
| success / warning / danger     | `--success` / `--warning` / `--destructive` | same roles, lifted for dark |

Rules:

- Primary and submit buttons use **#0864D1** with **white text** in
  both themes (`bg-action text-action-foreground`). Hover uses #0755B2 through
  `hover:bg-action-hover`. Links, focus, selection and progress keep their
  existing theme-aware signal tokens; text and page backgrounds retain ink/paper.
- Destructive form submits use the same action fill. Keep explicit warnings,
  validation and confirmation steps; separate destructive confirmation controls
  retain their danger styling.
- Pastel tints (`--tint-sage`, `--tint-paper`, `--tint-mist`, `--tint-lavender`)
  are grounds for feature or summary cards, never for state. State stays
  success/warning/danger with a visible text label.
- Never colour alone. Every state carries words.
- Use `border-border` for rows/hairlines, `border-border-strong` for stronger
  framing, and `border-input` for fields. Do not repair a faint input by making
  every decorative divider heavier. Structure comes from alignment and rules;
  elevation is a light second signal.
- Text needs at least 4.5:1 contrast, or 3:1 for qualifying large text. Field
  boundaries and meaningful state/focus indicators need 3:1 against adjacent
  colors where they identify the control or state. Check actual normal, hover,
  focus and error combinations in each theme; a token name is not a contrast
  guarantee. Disabled controls are a separate state, not a reason to weaken
  enabled controls.

### State vocabulary

| Meaning                                                 | Visual role                         | Required distinction                          |
| ------------------------------------------------------- | ----------------------------------- | --------------------------------------------- |
| Main action                                             | action blue / white text          | same fill in both themes            |
| Current route, selected filter, focus                   | blue signal                         | current/pressed/focus semantics as applicable |
| Listing safety reviewed                                 | reviewed/success accent             | visible reviewed label                        |
| Not yet safety reviewed                                 | warning/caution accent              | explicit unreviewed label, not a rejection    |
| Missing required declaration, error, destructive confirmation | danger accent                       | precise missing/error/action wording          |
| Creator identity or source ownership verified           | its named identity/source indicator | never imply listing safety approval           |

Avoid hardcoded emerald/amber variants when an existing semantic role fits.
In the blog, preserve amber for editorial accents. Submit buttons share
the #0864D1 action fill, white text and #0755B2 hover through its action palette.
An editor-selected edition accent must not become arbitrary small-text color
or button fill with an unchecked foreground across light and dark cover areas.

## Typography

Geist carries marketplace words and headings; Estedad carries Persian. The
`.editorial` compatibility class must use that shared sans heading treatment.
Newsreader is reserved for generated marketplace Open Graph cards
(`lib/og/card.tsx`) and the separate blog's editorial content. Geist Mono is for
commands, versions, identifiers and comparable data, not general section labels.

| Role                         | Existing scale / convention                                | Application                                                                     |
| ---------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Public display               | responsive 36/48px utilities and existing fluid hero sizes | keep the hero's viewport-aware fit; do not make every heading a display heading |
| Dashboard page title         | 24px phone / 30px from `sm`, weight 600                    | follow the Profile page's ramp; the overview's reversed ramp is drift           |
| Peer dashboard section title | normally 20px, weight 600                                  | align peer sections; reserve smaller subgroup headings for actual subgroups     |
| Body                         | 16px; longer explanations commonly use 1.75 leading        | preserve readable line length and context-specific leading                      |
| Forms                        | 16px input/select/textarea text                            | same convention on public pages and in the dashboard                            |
| Supporting copy              | 14px with readable leading                                 | instructions and secondary descriptions                                         |
| Label / eyebrow              | 12px sans, weight 600, restrained tracking                 | no terminal-style wide-tracked mono labels                                      |
| Badge / compact metadata     | 11px                                                       | intentional compact ramp, not body copy                                         |
| Command / comparable data    | 13px mono where appropriate                                | isolate Latin identifiers inside Persian layouts                                |

Headings use weight 600 as the shared default, without gradient text. Keep
genuine display-size differences; do not preserve accidental 400/600/700
differences between otherwise equivalent headings. The legacy `.editorial`
compatibility class uses the shared sans face at weight 600, with Estedad for
Persian. Newsreader remains reserved for the separate blog and static OG artwork.

Persian prose uses the existing 1.8 body leading and 1.35 editorial-heading
leading. Do not add tracking or forced capitals to joined Persian text. Latin
identifiers use `bdi`/`dir="ltr"`; creator prose keeps `.ts-bidi`. Prose numbers
and ratings follow the locale; versions/hashes/commands retain their exact
Latin representation. These rules also apply to Persian blog prose while
preserving explicitly English article content.

## Layout

### Spacing and density

Use the existing Tailwind spacing scale. Public `container-page` is 76rem
maximum with 1rem gutters on each phone edge; use `.section-y` for marketing
section padding (`--section-y` in `tokens.css`). Common existing steps are
8px between a label and its field, 12px between related elements, 16px inside
compact cards, 20/24px inside task panels, and 32px between dashboard sections.
These are existing patterns, not new spacing tokens to implement in CSS.

Choose density by relationship: keep a label, help control, field, hint and
error together; give separate tasks more space. Peer sections on one page
share padding, heading level and spacing. Compact cards and spacious account
panels may differ deliberately. Keep one spacing convention per repeated
pattern instead of fixing gaps with negative margins or empty wrappers.

At phone widths, stack sections, wrap action rows and let controls shrink with
`min-w-0`. Wide tables/commands scroll within their own region. Do not make
ordinary forms scroll horizontally. Preserve long listing names, creator prose,
translated labels and error messages without clipping or forced truncation.
Alternating background/surface/muted section bands are welcome on marketing
pages; the dashboard stays on one ground.

### Persistent navigation and sticky surfaces

The root web layout owns global navigation once. The nested dashboard owns its
session gate, workspace search, sidebar and phone tabs; it reuses the global
account, language and theme controls. Pages/loading boundaries must not add a
second header. Keep the header in the root hydration tree to avoid session races.

Use the measured `--site-header-height` for content that sticks beneath the
header, including discovery controls; account for announcement dismissal,
condensation and mobile disclosure. Fixed dashboard actions and native focus
scrolling clear phone tabs and safe-area insets. Sticky surfaces remain opaque
enough to read. Verify hit-testing as well as bounding boxes after scrolling.

A localized skip link is the first keyboard stop and targets the route's single
focusable `main#content`. Use nested layouts for persistent sections. Temporary
menus/dialogs support dismissal and close when appropriate on navigation;
do not replace persistent section structure with an overlay.

### Motion

The intended behavior remains immediately visible content: no decorative scroll
reveals, card lift, blinking caret, typed placeholder or glow. A card may change
its border color on hover; it does not travel or grow its shadow. Short state,
theme and listing-navigation feedback may use the existing motion tokens when
it communicates a change. Honor reduced motion for scroll, transforms, loading
and transitions without hiding useful state feedback. The discovery scroll-edge
fade is a functional overflow cue.

## Elevation & Depth

One shadow family, navy-tinted in light and black in dark, lives in
`tokens.css` and is exposed as `shadow-panel` / `shadow-promo`:

- `shadow-panel`: offset 0 2px, blur 8px — cards, menus, popovers.
- `shadow-promo`: offset 0 3px, blur 12px — a promoted/summary surface.
- Buttons may use the existing `shadow-sm`; do not invent another shadow family.

Shadows are offset and blurred. A zero-offset colored halo, a glow, or a shadow
on body text is not part of this system. Existing header translucency is a
navigation treatment, not permission to introduce glass panels elsewhere.

## Shapes

| Token             | Value | Use                                 |
| ----------------- | ----- | ----------------------------------- |
| `rounded-nav`     | 8px   | header/menu rows, small tabs        |
| `rounded-control` | 12px  | buttons, inputs, selects, textareas |
| `rounded-card`    | 16px  | panels, cards, dialogs, popovers    |
| `rounded-chip`    | pill  | badges, tags, filter chips          |

`rounded-lg`, `rounded-xl` and `rounded-2xl` all resolve to the 16px panel step
so older call sites match without a rewrite. Avatars, switch tracks and status
dots stay circular because the shape communicates the function. Nothing on the
app surfaces should acquire a hard square control/panel as a new style.
Set shape on the existing component itself; do not restore dashboard-wide
geometry/color overrides. Unlayered fallbacks can beat layered utility classes
even when they use `:where()`. Check computed radii rather than assuming the class wins.

The existing hero search has a pill-shaped group around its input, while
ordinary fields use the control radius. The inner search input need not carry
its own rounding. This intentional composite shape is different from the
unrounded report fields identified in the audit.

## Components

Use `Button`/`buttonVariants`, `Input`, `Badge`, `Avatar` and the existing status
patterns.

- `Button`: `rounded-control`, weight 600. Existing sizes are `sm` 36px/12px
  text, `md` 44px/14px, `lg` 48px/16px, and `icon` 44px square. The default and
  normal phone hit area is 44px; compact exceptions must remain usable and meet
  target-size/spacing requirements. Primary uses `bg-action text-action-foreground` and
  `hover:bg-action-hover`, with `shadow-sm`; secondary is a bordered surface, outline is transparent with a
  stronger border, ghost stays quiet, destructive confirmation uses the danger role. Links
  styled as actions reuse `buttonVariants`. This size table describes the helper;
  verify computed styles where global CSS currently overrides it.
- `Input` / `Textarea` / `Select`: `rounded-control`, `bg-surface`,
  `border-input`, blue focus indication, 16px text. Keep labels, formats, hints,
  validation and disabled states. Input is an existing component; select and
  textarea share its conventions without implying separate shared components
  already exist. Use unique field IDs for simultaneous desktop/mobile forms.
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
signal. An unreviewed or undeclared field remains explicit. Synthetic fixtures
are test evidence, never real claims.

### Interaction and recovery shared with the blog

- Every field has an associated accessible label. Validation text is connected
  to its field; a failed long-form submit guides focus to the first invalid
  field or an error summary without discarding entered values.
- Modal dialogs move focus inside, contain it while open, support cancellation,
  make background controls unavailable, and restore focus on close. A dark
  overlay and `aria-modal` alone are insufficient.
- A combobox exposes usable keyboard behavior, including option navigation and
  Escape dismissal; otherwise use simpler semantics matching the real controls.
- Current links, selected filters, bookmarks and switches expose their state
  with the appropriate `aria-current`, pressed or checked semantics. Labels and
  switch-thumb movement follow RTL. Do not duplicate IDs in hidden layouts.
- Submissions show pending state and prevent accidental repeat requests.
  Success, copy/save failure and recoverable errors are visible and announced
  appropriately. Distinguish failed loading from an empty collection; offer
  retry where another request can recover. A canceled share is not an error.
- Locale changes retain meaningful search/filter/page context. Theme controls
  announce the correct action without server/client hydration mismatches.
- For the blog, keep one main landmark and a first-stop skip link, shared
  keyboard/state requirements, and readable code blocks. Inline-code styling
  must not leak into fenced-code text/background combinations. These are repair
  requirements, not assertions that the blog already implements them.

Keep all loading, empty, failure, retry, disabled and success states. Never hide
failed catalogue requests with fabricated cards/counts or change role permissions
to make the UI appear complete. Account security and provider token clearing
remain authoritative behavior, independent of presentation.

## Do's and Don'ts

- **Do** use the existing tokens and components, consistent peer-section spacing,
  explicit trust labels, readable fields and both marketplace themes.
- **Do** preserve the blog's confirmed editorial palette/type while sharing
  accessibility, interaction, responsive and RTL requirements.
- **Do** record observed defects separately from the intended rule and verify
  the actual rendered result after a repair.
- **Don't** restore square Datasheet panels, Signal & Void effects or another
  competing visual system from stale comments, previews or tests.
- **Don't** make every button blue, turn every status green, or use arbitrary
  color choices as unchecked text/action foregrounds.
- **Don't** hide failed requests behind empty messages or synthetic content,
  weaken authorization, discard form state, or count a clean detector as proof
  that every screen is accessible.

### Audit remediation and remaining acceptance — 2026-11-03

The local [audit report](../../docs/artifacts/ui-audit-2026-11-03/report.md)
contains 42 issue groups and evidence. It is generated local evidence and may
not exist in a fresh checkout. The durable
[remediation checklist](../../docs/ui-remediation-plan.md) records implementation,
verification and remaining acceptance separately. All 42 original groups and the
additional blog field-boundary finding (B23) have source repairs.

| Area                 | Repair and verification scope                                                                                                                                                                                                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discovery            | Measured sticky offset, unique named drawer filters, contained RTL thumb and keyboard suggestions.                                                                                                                                                                                                            |
| Typography / spacing | Shared sans/600 headings, consistent overview/peer ramps, Persian Estedad and restrained labels.                                                                                                                                                                                                              |
| Controls / colors    | Blue primary actions, 12px fields, 16px panels and field text, semantic states, larger phone controls.                                                                                                                                                                                                         |
| Contrast             | Web input boundaries measure 3.04–3.23:1 in light and 3.08:1 on dark surface. Blog fields use `line.input` (#8a847b), 3.29–3.71:1; invalid article fields use red-600. Blog faint text on warm paper is 4.73:1; amber/hover on white is 5.02/7.09:1. Nested code and arbitrary edition accents are corrected. |
| Motion / state       | Decorative reveals/lifts/carets/typing removed; stable theme hydration, retries and write/empty feedback added.                                                                                                                                                                                               |
| Blog                 | Native modal, labeled fields, connected validation, wrapping actions, one main, current navigation and preserved locale query context. English admin scope is explicit. Non-auth editorial/native-modal rendering is verified with disposable fixtures at 320/768/1280px; physical-device/authentication acceptance remains separate.                                                                 |

Regression assertions now require stable search prompts and 600-weight headings.
Browser-dependent editorial acceptance, physical devices, real providers and
native Persian copy review remain distinct from source and automated acceptance.

### Required verification

Use Impeccable for design planning, implementation and review. Inspect rendered
home, dashboard, explore, product and account paths in EN/FA, light/dark and
320/768/1280px widths. Check keyboard focus (the ring follows each element's own
radius), minimum 24px targets (normally 44px controls), contrast, navigation,
long content and relevant recovery states. Keep local before/after evidence.
Run required root checks, browser regressions, Lighthouse and the requested
design detector. A clean detector alone is not visual acceptance. Real phones,
provider credentials and native Persian wording review must be recorded
separately when unavailable.

The original audit's 14 detector flags and final review's 15 flags (13 web,
2 blog; an additional Newsreader Fallback declaration) were reviewed in context:
established font declarations, static OG aliases/palette, 9px showroom annotations,
limited feedback easing tokens and semantic blog blockquote borders. These are
documented exceptions, not proof that all screens are accessible.
Normal 11px badges/12px labels/13px mono data
remain intentional. Focus follows each element's own radius; record browser,
theme, locale, width and state instead of treating source classes as visual proof.
