# Cleanup report — 2026-10-27

Branch `chore/cleanup-2026-10-27` from `origin/main` (`3490d23`), in worktree `../termSpace-cleanup`.
Stage 1 only (read-only). Nothing has been deleted.

> **Read first — base branch.** `origin/main` is 7 commits behind `origin/ramtin`
> (startup-performance work + today's "restore redesign landing"). Two items that are
> dead on `main` (`lib/hooks/use-reduced-motion.ts`, `public/fonts/newsreader-latin-wght-v5.3.0.woff2`)
> are **used again on `ramtin`**. Every finding below was re-checked against `origin/ramtin`;
> anything `ramtin` uses is marked `keep`. Recommendation: merge `ramtin` → `main` first,
> then rebase this branch, so the cleanup and the redesign don't conflict in
> `changelog.md`, `pending.md` and `apps/web`.

## Baseline (origin/main, Windows, cold `npm ci`)

| Gate | Result | Time |
|---|---|---|
| `npm ci` | pass | 230 s |
| `prisma:generate` | pass | 11 s |
| `npm run typecheck` | pass | 42 s |
| `npm run lint -w apps/web` | pass | 84 s |
| `npm test` | **1 failure** — `product-actions.test.tsx › reveals only the exact acquired release after acquisition` (role=dialog not found, 3.2 s). Passes 2/2 when run alone → load-sensitive flake, not a regression | 81 s |
| `npm run build` | pass | 98 s |

API: 270 pass / 12 skipped (4 files gated on `DATABASE_URL`/Redis — intentional). Blog: 17 pass. Web: 374 pass / 1 flaky.

Size: 39 718 source lines in 422 files (`apps/**` ts/tsx/mjs/mts/css/prisma, migrations excluded) · 73 declared dependencies · jscpd 1.61 % overall (TS 0.72 %, TSX 0.15 %, JS 0.57 %; licence texts 78 % of txt) · repo pack 6.1 MiB · 546 tracked files.

Tools: `knip@5` (workspace config kept outside the repo), `ts-prune@0.10`, `jscpd@4 --min-lines 8`, `depcheck@1`, plus `git grep` on `main` **and** `origin/ramtin` for every candidate.

## 1. Dead code

| Item | Evidence | Action | Risk | Lines |
|---|---|---|---|---|
| `CreatorGridSkeleton`, `CategoryGridSkeleton` (`apps/web/components/patterns/skeleton.tsx:104-146`) | knip + ts-prune unused export; `git grep -w` only hits the definition on main and ramtin | delete | low | ~43 |
| `EMAIL_VERIFICATION_TTL_MS`, `PASSWORD_RESET_TTL_MS` (`apps/api/src/lib/emailVerification.ts`) | knip; used only inside the file | drop `export` | low | 0 |
| `DISCOVERY_PAGE_SIZE` (`apps/web/lib/discovery-url.ts`), `OVERVIEW_ACTIVITY_LIMIT` (`apps/web/lib/dashboard.ts`) | knip; used only inside the file | drop `export` | low | 0 |
| 16 exported types (`ApiError` blog, `SourceResolution*`, `EmailDeliveryResult`, `MarketplacePlatformKey`, `MarketplaceListing*` api; `OgChip`, `NumberContext`, `ButtonProps`, `TrustStripLabels`, `ListingTone`, `DashboardActivity`, `GreetingPeriod`, `LegalDoc`, `EmptyStateFilter` web) | knip unused exported types | drop `export` where the type is used locally; delete if not | low | ~5 |
| `apps/web/lib/hooks/use-reduced-motion.ts` | knip unused file on main; **imported by `console-search.tsx` on ramtin** | keep (ramtin uses it) | — | 0 |
| `apps/web/e2e/serve.mjs` | knip unused file; referenced as a string in `lighthouserc.cjs:60` | keep (dynamic reference) | — | 0 |
| ts-prune hits `sharedMessages`, `DraftMessages`, `footerLabels`, `localePath`, `MARKETPLACE_PLATFORM_REGISTRY`, `marketplacePlatformKey`, Next route exports | used via the `@/` alias, `prisma/seed.ts` or Next conventions | keep (false positives) | — | 0 |
| `POST /api/marketplace/moderation/products/:id/community-placements/:communitySlug` | no caller in `apps/web`/`apps/blog`; covered by `app.test.ts:1796,1823` | ask owner (UI not built yet, or retire?) | medium | ~40 |
| Feature flags | only `NEXT_PUBLIC_USE_MOCK` (used by e2e/LHCI mock builds) | keep | — | 0 |
| Commented-out code blocks | none found (≥3 consecutive commented code lines) | — | — | 0 |

## 2. Duplicate code

| Item | Evidence | Action | Risk | Lines |
|---|---|---|---|---|
| `apps/{web,blog}/app/backend/[...path]/route.ts` | jscpd 47 + 14 lines | keep — separate apps/deployments; AGENTS.md: don't couple blog to marketplace | — | 0 |
| `compact-product-card.tsx` vs `product-card.tsx` | jscpd 13 + 31 lines | keep — two deliberate card variants; the compact one is on the landing page being redesigned | — | 0 |
| `apps/web/{public/fonts,lib/og/fonts}/LICENSE-*.txt` | jscpd (OFL text) | keep (licence files) | — | 0 |
| Intra-file clones in `marketplaceModerationController.ts`, `marketplaceCreatorController.ts`/`DraftController.ts`, `ArticleForm.tsx`, `ArticleCard.tsx`, `BlogExplorer`/`AdminArticleList`, `blog/page`/`topics/page` | jscpd, 8–20 lines each | keep — merging these is a refactor, not waste removal | — | 0 |
| `lib/{api,format,serverLocale,types}.ts` in web and blog | same file names; different contents except `ReaderProfile` and a 3-line `getLocale` | keep (separate apps; no shared package to put them in) | — | 0 |
| Two publishing APIs | the old `/api/community` path was already retired (`7058cc4`) | — | — | 0 |

## 3. Redesign leftovers

| Item | Evidence | Action | Risk | Lines |
|---|---|---|---|---|
| 48 top-level keys in `apps/web/lib/i18n/common.ts`, en + fa: `dash*` ×40 (pre-workbench studio form, last used before `7058cc4`), `collectionsEyebrow`, `creatorsEyebrow`, `designSystem`, `exploreMarketplace`, `featuredCreators`, `featuredEyebrow`, `navSettings`, `practiceEyebrow`, `settingsTitle`, `worksWith` | `git grep -w` outside `lib/i18n` = 0 on main and ramtin; the only dynamic lookups are `source_*`/`check_*`, which don't match | delete (shared surface: announce in the commit body) | low | ~96 |
| `inboxEyebrow` | unused on main, **used on ramtin** | keep | — | 0 |
| `homeSections.{en,fa}.shelves` (`lib/i18n/home-sections.ts`) | 0 references on main and ramtin | delete | low | ~28 |
| `apps/web/public/fonts/newsreader-latin-wght-v5.3.0.woff2` | unreferenced on main; **ramtin's `globals.css:261` loads it** | keep | — | 0 |
| `apps/web/.impeccable/mocks/decision/*.html` (7) and `critique/*.md` (3), root `.impeccable/critique/*.md` (1) | design-exploration output (hero decision `0443c19`); nothing imports them; readiness S19 says "untrack `.impeccable` files if not shipping". `config.json`, `design.json` and `surfaces/` are Impeccable context the project rules depend on | ask owner — recommend `git rm --cached` mocks and critiques, then gitignore `.impeccable/critique/`, `.impeccable/mocks/`, `.impeccable/live/` | low | ~896 |
| `docs/brand/logo-concepts/*.png` (4 files, 3.2 MB) | not referenced anywhere; the shipped logo is `components/layout/logo.tsx` | ask owner — recommend removing from the tree; history stays | low | 0 (3.2 MB) |
| Components and CSS from replaced screens | knip finds no other unused files; all 17 class selectors in the CSS files are referenced | — | — | 0 |

## 4. Dependencies

| Item | Evidence | Action | Risk | Lines |
|---|---|---|---|---|
| Unused dependencies | knip: `tailwindcss` (web); depcheck: `autoprefixer`, `postcss` (blog), `@tailwindcss/postcss`, `tailwindcss`, `@storybook/addon-a11y` (web) — all used by string in `postcss.config.mjs`, `@import "tailwindcss"` or `.storybook/main.ts` | keep (false positives) | — | 0 |
| `@testing-library/user-event` used by 5 web tests but declared only in `apps/blog` | knip + depcheck "unlisted/missing"; resolves only through hoisting | move — add to `apps/web` devDependencies (same version) | low | +1 |
| `@vitest/coverage-v8` named by the `coverage:` blocks in `apps/api/vitest.config.ts` and `apps/blog/vitest.config.mts`, but not installed | knip unlisted; scripts pass `--coverage.enabled=false`; CI never enables coverage | delete the dead `coverage` blocks | low | ~2 |
| `server-only` (blog) | depcheck missing; Next.js provides it | keep | — | 0 |
| `prisma` is a devDependency but the compose `migrate` service runs it | readiness B2/S14; `codex/vps-preview` changes `apps/api/package.json` | ask owner (being fixed on the deploy branch) | medium | 0 |
| Tailwind 4 (web) and Tailwind 3 (blog) | two majors for one job across two apps | keep (separate apps; migrating is not cleanup) | — | 0 |

## 5. Tests

| Item | Evidence | Action | Risk | Lines |
|---|---|---|---|---|
| `features/product/product-actions.test.tsx` "reveals only the exact acquired release" | fails under the full suite, passes alone 2/2 | fix — wait with `findByRole` and an explicit timeout; never delete | low | 0 |
| 12 `test.skip(cond, …)` in `apps/web/e2e` | all gated by Playwright project (mobile/desktop) with a reason | keep | — | 0 |
| 4 env-gated API integration files (`runIf`/`skipIf`) | CI runs them with a database | keep | — | 0 |
| `.only`, snapshots without tests, tests for deleted code | none found | — | — | 0 |

## 6. Repository waste

| Item | Evidence | Action | Risk | Lines |
|---|---|---|---|---|
| Build output, binaries, traces, Lighthouse reports | none tracked; already gitignored | — | — | 0 |
| `apps/web/AGENTS.md`, `apps/web/CLAUDE.md` (tracked since `62a257d`) | generated by `next dev`; AGENTS.md: "never commit the AGENTS.md / CLAUDE.md files that `next dev` auto-generates" | ask owner — the rule says untrack and gitignore, but the generated block says committing it keeps the tree clean; pick one and fix the other text | low | 10 |
| Untracked local tooling: `.agents/`, `.codebase-memory/`, `.impeccable/live/`, `skills-lock.json`, `apps/blog/{AGENTS,CLAUDE}.md` | show up in `git status` on every branch | gitignore | low | 0 |
| Files > 500 KB | the 4 logo PNGs (see §3), `package-lock.json` | see §3 | — | — |
| Large historical blobs | only the same logo PNGs and old lockfile versions; pack is 6.1 MiB | keep history (no rewrite) | — | — |

## 7. Process waste

| Item | Evidence | Action | Risk | Lines |
|---|---|---|---|---|
| `changelog.md` — 3 253 lines, 261 KB, 28 dated entries (10-19 alone is 541 lines) | most entries narrate each step and each rejected trial | compact to one line per merged change; move the bodies to `docs/archive/changelog-2026.md` if wanted. Shared surface and the agents' handoff channel → needs both maintainers' OK | medium | ~3 150 |
| `summary.md` (239) | one-off handoff to another agent dated 2026-09-24; only `changelog.md` mentions it | delete | low | 239 |
| `readiness.md` (156) | 8/8 blockers fixed; ~15 S/N items still open and **not** in `pending.md` | merge the open items into `pending.md` as one-liners, then delete (`pending.md` is the other maintainer's queue) | medium | ~140 |
| `pending.md` — empty "Bug Audit 2026-08-27 / 2026-09-02" sections | headings with no items | delete | low | ~8 |
| Docs that describe removed code | every `apps/…`/`docs/…` path cited in tracked `*.md` exists | — | — | 0 |
| Duplicate instruction files | root `CLAUDE.md` = `@AGENTS.md` (fine); `apps/web/AGENTS.md` see §6 | — | — | — |

## 8. Branches and drift

| Branch | Last commit | vs main | Evidence | Recommendation |
|---|---|---|---|---|
| `ramtin` | 2026-10-25 | +7 / −0 | redesign + startup perf | merge into `main` (PR) **before** this cleanup |
| `redesign` | 2026-10-25 | +4 / −0 | subset of `ramtin` (`ramtin` has 3 more) | delete after `ramtin` merges |
| `codex/vps-preview` | 2026-10-25 | +17 / −0 | `deploy/release.sh` deploys image digests built from **this unmerged branch**: the public HTTPS preview runs code that isn't on `main` | merge into `main` (PR) — drift |
| `codex/ratings-reviews-batch` | 2026-10-02 | +6 / −130 | 72 of its 87 new files are absent from `main`; reviews are still P0 in `pending.md` | ask owner (other maintainer): rebase and PR, or close |
| `codex/discovery-community-batch` | 2026-10-01 | +2 / −130 | its 2 commits are the first 2 of `ratings-reviews-batch` | delete (contained in the ratings branch) |
| `codex/contributor-guide` | 2026-09-09 | merged | fully in `main` | delete |
| `v.2` | 2026-09-25 | +0 / −89 | merged; other maintainer's personal branch | keep; update from `main` |

## 9. Scripts and config

| Item | Evidence | Action | Risk | Lines |
|---|---|---|---|---|
| `apps/api` `prisma:push` | no reference in docs, CI or compose; `db push` bypasses migrations | delete | low | 1 |
| root `db:down` | same command as `docker:down`; no reference | delete | low | 1 |
| `apps/web` `build-storybook` | unreferenced, but it's the standard Storybook build entry | keep | — | 0 |
| API job scripts (`publish:scheduled`, `email:worker`, `marketplace:*`) | documented in `README.md` and `docs/` for local use | keep | — | 0 |
| Config files | one tsconfig/vitest/postcss/next config per app; one ESLint (web only); no Prettier; Dockerfiles are per app | keep | — | 0 |
| `docker compose up -d db` fails unless `LEGAL_CONTACT_EMAIL` is set (required by the `web` service's interpolation) | seen today | not waste; add to `pending.md` (dev friction) | — | 0 |

## Totals

| | Count | Est. lines |
|---|---|---|
| delete / unexport / move (low risk) | 15 | ~570 code/docs + ~3 150 changelog if approved |
| ask owner | 8 | — |
| keep | 22 | — |

Expected after Stage 2 (if every recommendation is approved): about −180 source lines, −1 dependency gap fixed,
about −3 500 process-doc lines, −11 tracked design artefacts, −3.2 MB working tree. The duplication
percentage barely moves (<0.1 pt) because the remaining clones are intentional.
