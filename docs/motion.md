# Motion in `apps/web`

One thing on the homepage moves with intent: the hero manifest card, which
performs the search → inspect → install journey the product exists for.
Everything else is calm. Motion must never delay the first paint of the
largest text, move layout, or run for someone who asked for less of it.

Tokens live in `apps/web/styles/tokens.css`; the rules that use them are in
`apps/web/styles/globals.css`.

## Spec

| Trigger | Effect | Duration | Easing | Reduced motion | Where |
|---|---|---|---|---|---|
| Page load, above the fold | eyebrow → h1 → intro → search → card, rising 8px, stagger 60ms. Eyebrow, search and card also fade in; h1 and intro only rise (see below) | `--duration-enter` 480ms | `--ease-out-expo` | instant, no stagger | `.ts-enter`, `--enter-i` |
| Scroll into view (sections) | opacity 0→1, rise 16px, tied to scroll position (entry 0–40%) | scroll-driven | linear | none | `.ts-reveal` (CSS view timeline) |
| Hover card | lift 2px, `--shadow-lift` | `--duration-hover` 160ms | `--ease-out-expo` | shadow only | `.ts-lift` |
| Hover / press button | lift 1px / settle | 160ms / `--duration-press` 80ms | `--ease-out-expo` | colour only | `buttonVariants` |
| Panel state (how-it-works) | lines cross-fade; header dot widens | `--duration-panel` 240ms / `--duration-chip` 320ms | expo / `--ease-spring` | instant | `.ts-panel-line`, `process.tsx` |
| Chip appear (hero) | scale .92→1 + opacity | `--duration-chip` 320ms | `--ease-spring` | already shown | `.ts-chip` |
| Marquee | linear loop, paused on hover and focus, mirrored in RTL | 64s a pass | linear | stopped, scrollable static row | `.animate-marquee` |
| Hero atmosphere | CSS nebula's conic layer turns; the WebGL field fades in over it on capable desktops | 24s a turn / 640ms fade | linear / expo | nebula held still, no WebGL | `.ts-nebula`, `hero-atmosphere.tsx` |
| Hero manifest sequence | see below | ≈ 6.4s, once | per line | the finished frame, no controls | `manifest-sequence.tsx` |

Nothing but the manifest sequence, the marquee and the nebula drift runs
longer than 640ms.
Only `opacity`, `transform` / `translate` / `scale` and `clip-path` animate;
never `width`, `height`, `top`, `left` or `box-shadow` on scroll. The two
exceptions are hover-only: a card's shadow, and a process-panel dot's width.

## Rules

- **Never fade the LCP element in from 0.** The browser does not count an
  element as painted while its opacity is 0. A fade on the hero intro cost
  430ms of mobile LCP, so the h1 and intro take `data-enter="nudge"`: the
  rise without the fade.
- **Reduced motion is decided in CSS first.** The server cannot know the
  preference, so every reduced-motion state is a `prefers-reduced-motion`
  rule that is right from the first paint, before any script runs. Scripts
  only follow it (read in an effect, never during render).
- **Marquee states belong in `globals.css`.** The `.animate-marquee` rule is
  unlayered, so it overrides any layered Tailwind utility on the same element.
  Utility classes for pause, direction or reduced motion silently do nothing
  there.
- **Reserve space; reveal, don't insert.** Sequenced content is laid out at
  its final size from the start, so nothing moves while it plays (CLS).
- **Reveals are CSS, with no fallback.** They run on a scroll-driven view
  timeline inside `@supports (animation-timeline: view())`. Browsers without
  it show the content with no reveal. There is no observer and no React
  state, and no JS path kept alive for the smallest audience.
- **The hero atmosphere is tiered** (`use-plasma-tier.ts`). Reduced motion,
  Save-Data and reduced data get a still CSS nebula; phones, touch screens
  and low-end machines get the drifting CSS nebula and never download the
  WebGL chunk; capable desktops load the WebGL field at idle and drop its
  GL context while the hero is off screen. The nebula drifts by rotating a
  layer on the compositor, not by animating a custom property, which
  would repaint every frame on the main thread.
- **No pointer-tracking effects.** Tilt cards, magnetic buttons and the
  headline decode were removed in plan P2. They cost a listener per element
  and explained nothing.

## The hero manifest sequence

`components/hero/manifest-timeline.ts` is a pure function from elapsed time
to a frame. It is unit-tested, so every frame can be checked without a
browser. `manifest-sequence.tsx` owns one `requestAnimationFrame` clock and
re-renders only when the frame changes.

| t (s) | Frame |
|---|---|
| 0 | `$ █` |
| 0.6 | types `termspace search "review my PR like a staff engineer"` |
| 2.2 | the prompt dims; the result line appears |
| 2.8 | types `termspace inspect conversion-copywriter` |
| 3.8 | manifest rows unfold, one per 120ms; "No network" lands with `permissions`, "Verified" with `reviewed` |
| 5.0 | `✓ all declared surfaces accounted for` |
| 5.4 | types `termspace add conversion-copywriter@2.4.0` |
| 6.25 | `✓ installed · pinned to v2.4.0`; the "v2.4.0" chip lands |
| 6.4 | holds; Replay appears |

- It starts 600ms after `load`, plays once, and never loops.
- It holds while the pointer is over the card, while less than half the scene
  is on screen (on a phone it sits below the copy until scrolled to), and
  while the tab is hidden.
- The pause toggle and Replay are real buttons outside the `aria-hidden` scene.
  Keyboard users pause with the toggle; the card itself has nothing focusable.
- The card is `dir="ltr"` in Persian: it is a terminal, and the commands are
  Latin. Only the title bar is translated.
