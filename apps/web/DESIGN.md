---
name: TermSpace
description: One Datasheet identity for public discovery, account flows and the creator dashboard.
colors:
  ground: "oklch(14.5% 0.022 286)"
  ink: "oklch(96% 0.01 286)"
  ink-muted: "oklch(73% 0.024 286)"
  hairline: "oklch(30% 0.028 286)"
  accent: "oklch(68% 0.195 292)"
  reviewed: "oklch(82% 0.175 152)"
  ground-light: "oklch(97.6% 0.006 286)"
  ink-light: "oklch(19% 0.028 286)"
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
  persian:
    fontFamily: "Estedad Variable, Geist Variable, sans-serif"
rounded:
  none: "0px"
spacing:
  cell: "16px"
  control-height: "44px"
---

# Design System: TermSpace

Creative North Star: **The Datasheet**. Updated 2026-10-19 after comparing the
rendered main site and dashboard. Every app surface uses the same ink, ground,
rules, sans typography and square controls. The previous Signal & Void style is
retired from `apps/web`; do not use its serif display, gradients, glass, glow,
floating cards or scroll entrances as a precedent.

## Surface modes and hierarchy

- Landing: Persuade. A centered outcome headline, search and featured shelf share
  the first desktop viewport. Follow with discover/inspect/install, explicit
  trust information and newsletter signup. Preserve the actual product copy.
- Discovery, product, account, moderation and dashboard: Operate. Prioritize the
  task, readable state, scanability and recovery. The root web layout owns the
  same global navigation for public pages and dashboard routes. The nested
  dashboard layout adds breadcrumb/search, desktop sidebar, phone tabs and the
  session gate, without duplicating account, theme or language controls.
- Blog: Read. It remains a separate editorial app with its own reading hierarchy;
  project-wide design changes still require Impeccable and cross-surface review.

## Foundations

Use `styles/tokens.css` and `styles/globals.css`, not a second palette. Both
themes retain the existing accessible ink, ground, muted, border and state colors.
Use `border-border` for rows and `border-border-strong` or `border-foreground/60`
for frames and structural divisions. Structure comes from rules and aligned
content rather than elevated containers.

Geist carries words and headings; Estedad carries Persian. `.editorial` is a
compatibility class for the shared sans heading style, not a second font family.
Geist Mono is reserved for commands, versions, identifiers and comparable data.
Labels use sans, 12px and restrained tracking. Persian has no tracking or forced
capitals. Latin identifiers use `bdi`/`dir="ltr"`; creator prose keeps `.ts-bidi`.
Body text and form input remain readable on phones, with fields normally 16px.

Existing radius tokens resolve to zero for controls, panels, menus and dialogs.
Avatars, switch tracks and small state dots may remain circular because their
shape conveys a familiar function. No shadows or blur on app panels or overlays;
use opaque ground, borders and the existing dimming overlay for protected focus.

## Shared components and states

Use `Button`/`buttonVariants`, `Input`, `Badge` and the existing status patterns.
Primary buttons use foreground ink with background text, with an opacity hover;
secondary and outline actions use ruled borders. The hero search may use the
existing primary accent for its submit action. Accent also marks focus, current
selection and links; it does not wash decorative panels.

Cards and compact cards share square, ruled frames, sans titles, explicit trust
metadata, creator identity and stable action placement. Type badges are neutral;
editor selection uses restrained accent text. Green denotes reviewed/successful
states, amber caution, red absence/errors/destructive actions. Keep visible state
labels so color never carries meaning alone. An unreviewed or undeclared field
must remain explicit. Synthetic fixtures are test evidence, never real claims.

Keep all loading, empty, failure, retry, disabled and success states. Never hide
failed catalogue requests with fabricated cards/counts or change role permissions
to make the UI appear complete. Account security and provider token clearing
remain authoritative behavior, independent of presentation.

## Layout and motion

Public pages use `container-page` (76rem, 1rem phone gutters). Use existing space
increments and section rhythm; dashboard density follows the task. At phone
widths, stack sections and keep filters/menus reachable. Sticky surfaces remain
opaque. Long content wraps, tables scroll within their region, and fixed actions
clear phone navigation and safe areas.

The shared header measures its actual height for sticky-sidebar and focus-scroll
offsets, including announcement dismissal, condensation and mobile disclosure.
Menus close on route changes because the layout persists. A single localized
skip link precedes navigation and targets each route's focusable `main#content`.
Pages and loading boundaries render content, not a second global header. Use
nested Next.js layouts for persistent structure rather than a route overlay.

Content is visible immediately: no card lift, scroll reveals, blinking decorative
carets or typed placeholders. Short feedback transitions, theme feedback and
listing navigation transitions may remain when they communicate a change. Honor
reduced motion. The discovery scroll-edge fade is a functional overflow cue.

## Required verification

Use Impeccable for design planning, implementation and review. Inspect rendered
home, dashboard, explore, product and account paths in EN/FA, light/dark and
320/768/1280px widths. Check keyboard focus, minimum 24px targets (normally 44px
controls), contrast, navigation, long content and relevant recovery states. Keep
local before/after evidence. Run required root checks, browser regressions,
Lighthouse and the requested design detector. A clean detector alone is not
visual acceptance. Real phones, provider credentials and native Persian wording
review must be recorded separately when unavailable.

Detector review (2026-10-19): advisory-only findings were checked against the
rendered pages. Geist is the established product face, not a font-selection
proposal. Compact 11px metadata/badges, 12px labels and 13px mono data are the
existing intentional ramp; the showroom's 9px palette values are reference
annotations, not body copy or controls. The 2px global focus-outline corner is
an accessibility treatment, independent of square control geometry. Existing
short spring easing is limited to theme/step feedback and respects reduced
motion; there is no entrance, card lift or bouncing page content.
