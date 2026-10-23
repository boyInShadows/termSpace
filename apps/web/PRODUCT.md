# Product

<!-- impeccable:product-schema 1 -->

Scope: `apps/web`, the TermSpace marketplace. The editorial blog (`apps/blog`) and the shared API are out of scope; each would need its own record.

## Platform

web

## Users

**Primary: developers choosing agentic coding tools.** They work inside Claude Code, Cursor, Codex, VS Code, ChatGPT, Gemini or a raw API, and are about to add a skill, agent, MCP server, rule, prompt or hook that can read their files and run commands in their repository. The job is to find a tool that solves the problem, judge whether it works with their platform and workflow, and decide whether they can trust it enough to install, quickly and before anything touches their code.

**Second: creators** who publish such tools (create a profile, submit a listing, pass moderation, publish releases, learn from feedback). **Third: TermSpace staff** who moderate submissions, reviews and reports. Persian-speaking and English-speaking users are both first-class (RTL included).

## Product Purpose

TermSpace is a discovery, publishing and community platform for agentic coding tools. It exists so a person can answer three questions about a tool: what solves my problem, will it work with my platform and workflow, and can I trust it enough to install or use it. Success is a visitor who can evaluate a listing from what it declares about itself, add the exact release they inspected, and later rate and review it.

Core consumer journey: discover, evaluate, add or install, use, rate or review. Core creator journey: create profile, submit item, moderation, publish, release updates, learn from feedback.

## Positioning

Declared permissions and provenance on every listing. Each listing states what it reads, writes and calls out to; is pinned to an immutable release with source provenance and an integrity digest where the provider gives one; and carries a safety-review state. Trust is treated as product information rather than marketing copy, so a neighbouring catalogue that only lists a README and a star count could not truthfully copy it.

## Operating Context

Tools are evaluated and installed from terminals and editors. A release resolves to a pinned source (a GitHub commit or an npm version) and is fetched with an exact command. Community-submitted files, code and agent instructions are untrusted content: TermSpace never executes a submission or shows an unapproved artifact. Visitors are often on a phone when they find a tool and at a desk when they install it.

## Capabilities and Constraints

- Catalogue of listings by controlled type (skills, agents, MCP servers, integrations, rules, prompts, hooks, templates, workflows). Search and filters by type, category, platform, community, compatibility and rating; platform and community are separate facets.
- Staff-created, platform-oriented communities; one listing can be placed in several without duplicating releases, reviews or installation history.
- Signed-in readers can favourite, add to their library, rate and review (reviews need a completed acquisition and a verified account; moderators can hide them).
- Creators manage profile, listings, releases, compatibility and publication state in the dashboard; staff moderate with scoped, auditable actions.
- **Every published resource is free.** No checkout, pricing, payouts, subscriptions or revenue language, anywhere user-facing.
- Artifacts are not hosted: creators submit metadata pointing at supported GitHub or npm sources.
- Trust signals are layered and separate: account, verified email, creator identity, source ownership, release review, community reputation. A creator's identity and a listing's safety review are different claims and must not look alike.
- Terminology in use: listing, release, community, creator, "Add to library", "safety reviewed".
- Existing stack (so not recorded as a choice): Next.js 16, Tailwind 4, Express and Postgres API, English and Persian.
- Public creator profiles show the creator's public identity, biography and a paginated collection of published listings. Creators without public listings are not discoverable; private drafts and suspended listings stay excluded, including counts.
- Undecided or not built yet: reporting and appeals interface, a permissions filter in discovery, curated/community collections, notifications; launch with the demo seed or with real curated listings; privacy policy, terms and content policy pages (none exist).

## Brand Commitments

Found in the codebase; not separately confirmed as binding by the owner: the lowercase "termspace" wordmark with a terminal caret, the product voice of plain, outcome-first copy ("what it touches"), and the Persian name ترم‌اسپیس. The current look ("Signal & Void", recorded in `DESIGN.md` as a pre-redesign baseline) is explicitly **not** binding: the owner wants to move away from the nebula and gradient headline.

## Evidence on Hand

- Product direction and ADRs in `docs/` (product-direction, architecture/0001 to 0004).
- A fixture catalogue of six listings and nine generated ones (`apps/web/lib/mock-home.ts`, `e2e/mock-catalog.mjs`) with invented creators, ratings and counts. **None of it is real**: no real listings, creators, testimonials, download counts, press or benchmarks exist yet, and future work must not present the fixtures as such.
- Real behaviour exists end to end: registration, creator onboarding, draft, submission, moderation, publication, acquisition and review.

## Product Principles

1. **Trust is product information.** What a listing reads, writes and calls out to, its licence and its review state belong where the decision is made, not on a separate page.
2. **State it, never imply it.** An unreviewed listing says "not yet reviewed"; a listing that declares nothing says so. Absence is shown, not hidden.
3. **Evaluate before you install, and install what you evaluated.** The release a visitor inspects is the exact release they add.
4. **Free, external, untrusted.** No commerce language; sources live with their creators; nothing submitted is trusted or executed.
5. **Persian and English are equals.** Neither is a translation of the other, and creator-supplied English inside a Persian page keeps its own direction.

## Accessibility & Inclusion

Right-to-left Persian is a requirement, not an afterthought: layout, icons, numerals and dates. Keyboard operation with visible focus, reduced-motion support, labelled loading and error states, text contrast of at least 4.5:1, and pointer targets of at least 24 px (checked by an end-to-end test). Users range from keyboard-only and screen-reader users to one-handed phone users.
