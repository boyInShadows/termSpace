---
name: TermSpace
description: A marketplace for agentic coding tools, set as a component datasheet. Only the landing hero is built in this direction so far.
colors:
  ground: "oklch(14.5% 0.022 286)"
  ink: "oklch(96% 0.01 286)"
  ink-muted: "oklch(73% 0.024 286)"
  hairline: "oklch(30% 0.028 286)"
  header-cell: "oklch(26% 0.026 286)"
  accent: "oklch(68% 0.195 292)"
  accent-hover: "oklch(74% 0.185 292)"
  accent-ink: "oklch(13% 0.03 292)"
  not-declared: "oklch(66% 0.205 22)"
  reviewed: "oklch(82% 0.175 152)"
  ground-light: "oklch(97.6% 0.006 286)"
  ink-light: "oklch(19% 0.028 286)"
typography:
  headline:
    fontFamily: "Geist Variable, Geist Fallback, sans-serif"
    fontSize: "clamp(2.1rem, 1rem + 3.6vw, 3.6rem)"
    fontWeight: 700
    lineHeight: 1.04
    letterSpacing: "-0.025em"
  sheet-title:
    fontFamily: "Geist Variable, Geist Fallback, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Geist Variable, Geist Fallback, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: "1.75rem"
  data:
    fontFamily: "Geist Mono Variable, ui-monospace, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Geist Variable, Geist Fallback, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    letterSpacing: "0.08em"
rounded:
  none: "0px"
spacing:
  cell-x: "16px"
  cell-y: "10px"
  hero-y: "56px"
  col-gap: "56px"
components:
  search-field:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    height: "56px"
  search-button:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.none}"
    height: "44px"
    padding: "0 16px"
  search-button-hover:
    backgroundColor: "{colors.accent-hover}"
  tag-cell:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    typography: "{typography.label}"
    padding: "0 16px"
  table-header-cell:
    textColor: "{colors.accent}"
    typography: "{typography.label}"
    padding: "6px 8px"
  ordering-command:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    typography: "{typography.data}"
    padding: "10px 16px"
---

# Design System: TermSpace

## Overview

**Creative North Star: "The Datasheet"**

A listing is a part, and the page shows it the way a component manufacturer would: a title block with a revision table, thin and double rules, numbered sections, tabular values, one header cell in solid ink. The system is typographic and linear. Structure comes from rules and aligned columns, never from fills, shadows or effects. Voice is dry and exact; the hero's example shows what a listing declares (reads, writes, network, compatibility) and prints what it does not.

**Transition (read this first).** Only the landing hero is built in this direction. It owns: the headline, the title block, the search field, the example part (tag cell, name row, features, ratings table, pin diagram, ordering row, footer). Everything else still ships the earlier "Signal & Void" system from `styles/tokens.css` and `styles/globals.css`: the violet "Plasma" primary used as a large-area brand colour, the Newsreader serif `.editorial` headings, the plasma-text gradient tokens, the nebula, `--shadow-soft`/`--shadow-lift`/`--glow-*`, 0.9rem card radius, rounded pill chips, the 160 to 640ms motion tokens, and the header, footer, sections below the hero, dashboard, explore and product pages. Those are slated to be replaced, not extended. Do not add new surfaces in Signal & Void, and do not invent site-wide datasheet tokens: the datasheet uses the existing theme tokens only (ink, ground, hairline, one accent).

**Key Characteristics:**
- Ink on ground, one accent, one red, one green; no gradients, glow, shadows, photography or texture.
- Square corners inside the sheet and the search; rules do the work of cards.
- Three-column part with a double rule under its name row; a title-block table beside the headline from `lg`.
- Geist for words, Geist Mono for values and commands, Estedad for Persian.
- Static: no animation in the sheet; the sheet is server-rendered markup that works without script.

## Colors

A two-tone sheet: theme ink on theme ground, with the site's one primary used sparingly as the accent. Values below are the dark default; the light theme (`.light`) swaps ground and ink and deepens the accent, using the same token names.

### Primary
- **Accent** (`--primary`, oklch(68% 0.195 292) dark): the Search button fill, the table header cells and their 2px bottom rule, section numbers, the ordering-row heading, the rotated part label in the pin diagram, and the search field's focus border. Nothing else.

### Secondary
- **Not-declared red** (`--destructive`, oklch(66% 0.205 22)): only the bordered "not declared" status mark in the ratings table.
- **Reviewed green** (`--verified`, oklch(82% 0.175 152)): reserved for review state. The shipped hero does not use it yet (the title block prints "Reviewed" in ink); do not use it for anything that is not a review claim.

### Neutral
- **Ground** (`--background`): the page and the search field.
- **Ink** (`--foreground`): text, strong rules at 60% opacity, and the solid tag cell, title-block header and install command (ink fill, ground text).
- **Ink muted** (`--muted-foreground`): meta lines, labels in the title block, undeclared dashes.
- **Hairline** (`--border`): row dividers inside tables and lists, the hero's bottom edge.
- **Header cell** (`--muted`): the "Find a listing" cell and the ordering heading cell.

### Named Rules
**The One Accent Rule.** Accent is a mark, not a surface. It appears on the Search button, table header rule and numerals, and nowhere as a panel or background wash.

**The Red Means Absent Rule.** Red marks "not declared" and nothing else. It is never an error colour inside the sheet.

**The Strong-Rule Rule.** Outer frames and column dividers are ink at 60% (`border-foreground/60`); interior row dividers are the hairline token. Two weights, no third.

## Typography

**Display and Body Font:** Geist (Variable, with a metric-matched local fallback)
**Data Font:** Geist Mono (Variable)
**Persian:** Estedad (Variable), replacing both on `html[dir="rtl"]`

**Character:** Plain grotesque headline, bold and tight, with mono used strictly for values the reader might copy or compare.

### Hierarchy
- **Headline** (700, clamp(2.1rem, 1rem + 3.6vw, 3.6rem), 1.04, -0.025em): the hero h1, two balanced blocks. Persian runs clamp(1.9rem, 1rem + 2.8vw, 2.9rem) at 600 weight and 1.35 leading.
- **Sheet title** (700, 1.25rem to 1.5rem at `sm`, tight): the example listing's name.
- **Body** (400, 1rem to 1.125rem at `sm`, 1.75 to 2rem leading, muted): hero introduction, max 42rem.
- **Data** (13px): the two known 13px sizes, the ratings table text and the install command at `sm` and up. Values in the table cell are mono at 12px; the command drops to 11px on phones and wraps.
- **Small** (12px, `text-xs`): title-block rows, meta line, footer, status marks.
- **Label** (600, 11px, 0.08em tracking, uppercase): tag cell, table header cells, section headings, "Find a listing", "Pinned". Persian drops tracking and capitals globally (`html[lang="fa"]`), so labels there differ by size and weight only.

### Named Rules
**The Mono Is Data Rule.** Geist Mono is for versions, hashes, commands and table values. Prose and filters stay in Geist. In Persian, values that are not Latin fall back to Estedad (`rtl:font-sans`), because the mono face has no Persian glyphs.

**The Latin Island Rule.** Versions, document numbers, hashes and the command are wrapped `dir="ltr"` (`bdi`) so they hold their shape inside Persian text.

## Layout

One centred column, `container-page` (`min(100% - 2rem, 76rem)`). The hero is vertically padded 2.5rem, 3.5rem from `lg`. From `lg` the top is a two-column grid: headline on the left, an 18rem title block on the right, 3.5rem gap; below `lg` the title block is dropped, because the example repeats its facts. The search runs full width under it (2rem gap). The example part sits 2.5rem below.

The part is a single bordered box with horizontal bands: a name row (tag cell, name and meta, revision cell from `sm`), three columns from `lg` in the ratio `1fr 1.55fr 1fr` (features, ratings, compatibility) with cell padding 1rem, an ordering row (`auto auto 1fr` from `sm`), and a footer line. On phones everything stacks and each band is divided by a strong rule. Mirrored in RTL through logical properties (`border-s`, `ps-`, `me-`); the pin diagram stays left-to-right.

### Named Rules
**The Ruled-Cell Rule.** Regions are separated by a rule and cell padding, not by gaps between floating boxes.

## Elevation & Depth

None. The sheet and the search are flat: no shadows, gradients, glow, blur or translucency. Depth is conveyed by weight of rule (the 3px double rule under the name row, ink-filled cells) and by one inverted ink cell per band. Focus is the one state change: the search field border goes to the accent with a 2px ring at 25% opacity, and global `:focus-visible` outlines (2px, offset 3px) apply to links and buttons.

### Named Rules
**The No-Decoration Rule.** Nothing in the sheet exists only to look good: no icon without a function, no fill without information, no ornament. The pin diagram is the only drawing, and it states compatibility.

## Shapes

Square. `rounded-none` on the search field and its button, and every cell and frame of the sheet. Bullets in the features list are 6px hollow squares. The signature geometry is the part's double rule (`3px double`, ink at 60%) under the name row and the IC-style notch drawn in the pin diagram: a rectangle with a semicircular notch at its top edge and three lead lines left, dashed "NC" leads right.

## Components

### Search field
- **Shape:** square, 1px ink-60% border, ground fill, 56px tall input.
- **Label cell:** from `sm`, a `--muted` cell on the left reading "Find a listing" in the label style, divided by a strong rule.
- **Button:** accent fill, accent-ink text, square, 44px tall, 16px padding, hover to the lighter accent; on phones an icon-only 44px square.
- **Focus:** accent border plus a 2px ring at 25%.
- **Under it:** type shortcuts as plain underlined text, minimum 32px high; muted with a hairline underline, ink and semibold when active.
- **Carried, not canonical:** the hero search still shares the band variant's code: a typing placeholder (disabled under reduced motion), a lucide Search glyph, and a suggestions dropdown with rounded-xl corners, `--shadow-lift` and lucide icons. These are Signal & Void remnants.

### Title block
Bordered table beside the headline. Header row in solid ink with ground text and label type ("Title block · example", "1/1"). Rows: document, revision, safety review, pinned release; muted 12px keys, mono values for codes, hairline dividers.

### Tag cell
Solid ink, ground text, label type, full height of the name row: "Example listing". It is the label that tells the reader the part is synthetic; the footer repeats it.

### Ratings table
"Absolute maximum ratings". Header cells in accent label type over a 2px accent bottom rule; row headers semibold; values mono 12px; status column 12px. A declared status is plain mono; a "not declared" status is a 1px red-bordered square mark in bold red; an empty parameter is a muted em dash. Table text is 13px.

### Pin diagram
Inline SVG, 1.2px lines in currentColor, no fills: a labelled part body, three pins (platform names right-aligned, pin numbers above the leads), dashed 40% leads marked "NC" on the far side, and a rotated bold accent label. Max width 17rem, `role="img"` with a full-sentence label.

### Ordering row
Heading cell on `--muted` with accent label type and a mono numeral, a "Pinned" label with its mono hash, and the install command in a solid ink band: mono, a 60% opacity `$` prompt, 13px from `sm`.

### Named Rules
**The Example-Is-Labelled Rule.** Synthetic content is named as such twice, in the tag cell and in the footer. Never show a made-up listing as real.

**The State-Absence Rule.** Undeclared is printed, never omitted: a parameter with no declaration keeps its row, shows a dash or a red "not declared" mark, and is never hidden to make a listing look cleaner.

## Do's and Don'ts

### Do:
- **Do** build new sheet surfaces from the existing theme tokens only: ink, ground, hairline, `--muted`, `--primary`, `--destructive`, `--verified`.
- **Do** use the two rule weights: `border-foreground/60` for structure, `border-border` for rows.
- **Do** set values and commands in Geist Mono, wrapped in `dir="ltr"`, and give Persian its own face and no tracking.
- **Do** number sections with accent mono numerals and put labels at 11px, 0.08em, uppercase.
- **Do** keep the sheet static and readable without JavaScript; targets at least 24px (shortcuts 32px, buttons 44px).
- **Do** print "not declared" rows and mark examples as examples.

### Don't:
- **Don't** use gradients, glow, shadows, blur, photography or textures on the datasheet, and don't reintroduce the nebula or a gradient headline.
- **Don't** round the corners of the sheet or the hero search.
- **Don't** use accent as a panel, card or background fill, or red for anything but absence.
- **Don't** hide undeclared rows, or ship an unlabelled example.
- **Don't** extend Signal & Void for new surfaces: the Plasma large-area primary, Newsreader `.editorial` headings, pill chips, `--shadow-*`/`--glow-*` and the long motion tokens remain on the header, footer, lower sections, dashboard, explore and product pages and are slated to be replaced. Reuse of them is a migration debt, not a precedent.
- **Don't** treat the hero search's carried remnants (suggestions dropdown shape and shadow, placeholder typing, lucide glyphs) as part of the datasheet system.
