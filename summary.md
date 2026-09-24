# TermSpace — handoff summary for Fable

_Written 2026-09-24 by Ramtin's Claude Code session. Branch `ramtin`, which
`main` has now merged in full (`b165938`); the two trees are identical._

This covers what the project is, what this side has done, what is left, and my
opinions. It ends with three requests for you (§6). Please read `AGENTS.md`,
`pending.md` and the top of `changelog.md` before answering. They are the
handoff channel between the two maintainers' agents.

---

## 1. What TermSpace is

A discovery, publishing and community platform for agentic coding tools:
skills, agents, MCP servers, integrations, rules, prompts, hooks, templates
and workflows. It exists to answer three questions for a visitor: *what solves
my problem, will it work with my setup, can I trust it?*
(`docs/product-direction.md`).

npm workspace, three apps:

| App | What it is | Port |
| --- | --- | --- |
| `apps/web` | Public catalog + creator platform (Next.js 16.3.6, React, Tailwind v4) | 3000 |
| `apps/blog` | Separate staff-run editorial site | 3001 |
| `apps/api` | Shared Express + Prisma + PostgreSQL API | 4001 |

Core journeys: consumer `discover → evaluate → install → use → rate/review`;
creator `profile → submit → moderation → publish → release → feedback`.

Two people each work with their own AI agent. **The other maintainer's agent
owns `pending.md`** (marketplace trust, reviews, reporting, notifications,
analytics, collections, and the Blog). **Our side owns `apps/web` presentation:
the landing page, design, motion, and the dashboard shell.** Your plan must not
touch pending.md's items.

---

## 2. What we have done (Sep 22 – 24)

All of it is on `main`; full details are in `changelog.md`.

**Landing page pass (from a now-deleted `plan.md`)**
- The page renders without the API: one cached loader, a `lib/mock-home.ts`
  fallback, per-section skeletons, empty states, and an inline Retry notice
  instead of a page-wide red banner. `NEXT_PUBLIC_USE_MOCK=1` serves the fixture.
- Search moved into the hero as the primary action, with type-scoped chips
  that show live counts. The floating hero chips went from five to three,
  anchored to the card. Collections and Browse-by-practice merged into one
  tabbed section. Trust became one inverted full-bleed band. There is now a
  `--section-y` spacing scale.
- Accessibility: contrast was measured (the gradient headline and muted
  tokens) and focus rings restored on every button. Lighthouse Accessibility
  is **100** on desktop and mobile.
- Performance: live `filter: blur()` layers were replaced with gradients, and
  the WebGL `PlasmaField` shader now compiles at idle instead of during
  hydration. Mobile Lighthouse Performance went **83 → 91–92** (TBT 380 → ~95 ms);
  desktop is **100**. Next.js is on 16.3.3 → 16.3.6.

**Dashboard (from a now-deleted `dashboardPlan.md`)**
- `/dashboard` is now a workbench with its own frame: a top bar (search with
  ⌘K/Ctrl K, theme, language, avatar), a sidebar with a single Publish action,
  and below `lg` a bottom tab bar plus a floating Publish button. Signed-out
  visitors are redirected to sign in and back.
- The overview reads the owner-scoped marketplace creator API through
  `lib/dashboard.ts`: a greeting, the tiles *Acquisitions · 7d (▲▼ against the
  previous week)*, *Listings live*, *Avg rating (review-weighted, null until
  reviewed)* and *In review*, an 8-row listings table, an activity feed built
  from lifecycle events, and quick actions. Every card has loading, empty,
  no-profile and error-with-retry states.
- Persian RTL was checked in a real browser. That pass fixed a **site-wide**
  bug: `.eyebrow` letter-spacing and its mono face broke Persian letter joins.

**Merge of `main` into `ramtin`**
- `main`'s `?type=` filter now accepts only stable keys, so the homepage type
  counts are grouped on `itemType` and returned as keys. The chips submit
  keys, and "Developer tools" became "Rules" because `Developer utility` has
  no key.

**Verification at hand-off:** root typecheck clean, **237 tests** (150 API,
15 Blog, 72 web), web lint clean, all production builds pass.

---

## 3. What is left on our side (not in the other agent's lane)

Tracked in the `Web — Homepage Follow-ups` section of `pending.md`:
1. **Manual browser passes that have never been done:** the homepage and
   `/dashboard` at 375px, a keyboard-only walkthrough, and the how-it-works
   panel stepping on scroll. My environment could not resize the browser
   window, so phone width has only been checked through class inspection and
   unit tests.
2. **A creator account with real listings has never been viewed** in the new
   dashboard. It is covered by tests only.
3. **Font preload for the display serif** on the LCP element. This needs
   moving from `@fontsource-variable` to `next/font/local`.

Things I found that are **not tracked anywhere yet**:
- **Hard-coded English in shared UI**, which breaks the Persian site:
  `product-card.tsx` ("Editor's pick", "Trending", "uses", the favourites
  `aria-label`, `aria-label="Communities"`), and community badges always
  render `nameEn`, even in `fa`.
- **Two creator flows exist side by side.** `/dashboard/studio` still
  publishes through the legacy `/api/community` endpoints (no moderation,
  instantly live), while `/creator` runs the real marketplace lifecycle
  (drafts → review → releases). For a creator this is confusing, and it
  contradicts the trust story. Retiring or redirecting the legacy studio is
  a product decision (see the questions in §6).
- **`AGENTS.md` has stale facts.** It names `development` as the integration
  branch (it does not exist on the remote) and says `main` does not exist
  (it is what is actually used, and CI triggers on it).
- There are no end-to-end tests. Nothing guards the landing page's layout,
  motion or the redirect flow in a real browser, and there is no Lighthouse
  budget in CI, so the mobile 91–92 score can regress silently.

---

## 4. My opinions

**On the landing page**
- The page has a lot of motion all at once: WebGL plasma, a decode headline,
  magnetic buttons, tilt cards, the marquee, reveals and a pinned narrative.
  Each piece is well built, but together they compete. I would pick **one
  signature moment** (the hero's manifest card is the strongest idea: it
  literally shows "trust is product information") and make everything else
  calmer.
- The hero card should **perform the product**, not decorate it. For example,
  a short, pausable sequence: type a search → a listing resolves → its
  permission manifest unfolds line by line → `termspace add …@2.4.0` succeeds.
  That is the core journey in five seconds.
- Move scroll reveals from JS (IntersectionObserver + state) to **CSS
  scroll-driven animations** (`animation-timeline: view()`), with the current
  code as a fallback. It is cheaper on the main thread, which is exactly where
  mobile is tight.
- Add **View Transitions** for card → product detail, so the listing card
  morphs into the detail header. Continuity is the thing that makes a catalog
  feel expensive.
- Mobile performance is 91–92, which is one heavy feature away from failing.
  Any new motion needs a budget, and the WebGL field should probably drop to
  the static `PlasmaFallback` on low-end or small screens.

**On process**
- The two agents collide most on `i18n.ts`, `types.ts` and `api.ts`.
  Splitting `i18n.ts` into per-surface dictionaries (home, dashboard,
  creator, moderation) would remove most of our merge conflicts.

---

## 5. Current landing page structure (for your design answer)

`app/page.tsx`, in order: header + announcement → **hero** (WebGL
`PlasmaField`, `DecodeText` headline, console search with type chips,
`HeroScene` manifest card with three corner chips, "works with" marquee) →
**featured** → **how it works** (pinned three-step narrative, panel states
DISCOVER / INSPECT / INSTALL) → **trust** (inverted band) → **browse**
(tabs: collections / by practice, state in `?browse=`) → **creators** (+
invitation tile) → **closing CTA** → footer.

Motion primitives: `components/motion/{decode-text,magnetic,marquee,reveal,tilt-card}.tsx`.
Everything respects `prefers-reduced-motion`. Design tokens are in
`styles/tokens.css` (oklch; dark default, `#090913` canvas, plasma violet
primary, cyan signal accent; Newsreader / Geist / Geist Mono / Estedad for
Persian).

---

## 6. What we are asking you for

### A. A clear, phased plan for `apps/web`, excluding everything in `pending.md`

Please give us phases we can execute one at a time. For each phase, include
its goal, the exact files, acceptance criteria and how to verify it (tests,
Lighthouse numbers, the browser checks). Cover:
- **Landing page motion and design:** what to cut, what to make the
  signature moment, and concrete specs: durations, easing (we have
  `--ease-expo`, `--ease-spring`), and what triggers each animation
  (load, scroll, hover), with the reduced-motion behaviour spelled out.
- **Everything else in `apps/web`** worth doing: product detail, explore,
  empty/error/404 pages, SEO and OG images, i18n gaps, e2e tests and a
  performance budget in CI.
- A **priority order** you would defend, and what you would *not* do.

### B. Details we need from you (please answer each)
1. Should the hero keep WebGL, or would a static or CSS-only field do the same
   job for less? Which devices should get which version?
2. Is the "hero performs the install journey" idea worth it? If yes, storyboard
   it frame by frame, including the pause and replay controls.
3. Which motion should go entirely? Rank the seven effects in §4 by value per
   millisecond of main-thread time.
4. Scroll-driven CSS vs the current JS reveals: what is the fallback for
   browsers without `animation-timeline`?
5. What performance budget should CI enforce: LCP, TBT and JS kB for `/`
   and `/dashboard`?
6. The legacy `/dashboard/studio`: retire it, redirect it to `/creator`, or
   keep it? (If this is a product call, tell us what to ask the other
   maintainer.)
7. What should the Persian homepage do differently beyond mirroring: type
   scale for Estedad, the direction of motion, and numerals?

### C. Update `AGENTS.md` to current vibe-coding standards
Please rewrite or extend `AGENTS.md` so every agent session on this repo
is **better and cheaper**. It is a shared file, so announce the change in the
commit body as `AGENTS.md` already requires. At minimum:

- **Fix the stale facts first:** `main` is the integration branch, not
  `development`; CI does run on `main`; list the real branches.
- **A "Session commands" section** for Claude Code users that says when to use
  each command, not just what it does:
  - `/compact [focus]`: compact the context at natural breakpoints (after a
    phase is committed, before switching task). Always pass a focus, e.g.
    `/compact keep the dashboard decisions and open TODOs`.
  - `/clear`: start fresh between unrelated tasks, which is cheaper than
    compacting.
  - `/context` and `/cost`: check what is filling the window and what the
    session has spent.
  - `/model`: pick the tier for the task (small model for mechanical edits,
    large for architecture).
  - **Plan mode** (Shift+Tab) for anything touching more than one app or any
    shared file. **Esc Esc / `/rewind`** to back out of a wrong turn instead of
    arguing forward.
  - `/resume` / `claude -c` to continue a session instead of re-explaining.
  - `/init`, `/memory`, `/agents`, `/hooks`, `/permissions`, `/mcp`,
    `/review`, plus `@path` file mentions and the `!` shell prefix.
  - Please verify each command against the current Claude Code docs before
    writing it down. Commands change, and a wrong instruction in `AGENTS.md`
    is worse than none.
- **Context hygiene rules:** read files by range rather than whole; use
  subagents for broad searches so their output stays out of the main context;
  don't paste logs, grep them; one phase per session where possible.
- **Tool-agnostic rules too:** the other maintainer may use a different
  harness. Keep the Claude-specific commands in their own section, and say
  whether a root `CLAUDE.md` should simply import `@AGENTS.md` so both kinds
  of tool read the same rules.
- Keep the existing rules (phases, squash-then-push, verification gates,
  shared-surface announcements, caching and state rules). Tighten them, don't
  drop them.

Thank you. Please answer in a form we can paste back to our agent as a plan.
