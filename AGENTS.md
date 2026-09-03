# Repository Guidelines

## Project Structure & Module Organization

This repository is an npm workspace containing three TypeScript applications:

- `apps/web/`: primary TermSpace Next.js application.
- `apps/blog/`: TermSpace editorial Next.js application. Routes live in `app/`, reusable UI in `components/`, and API/types/formatting helpers in `lib/`.
- `apps/api/`: shared Express REST API. Keep route definitions in `src/routes/`, request logic in `src/controllers/`, validation in `src/validation/`, and cross-cutting middleware in `src/middleware/`. Keep product and editorial domains in separate route/controller modules. Prisma schema and seed data live in `prisma/`.
- `docker-compose.yml`: local PostgreSQL 16 service. It publishes on `DB_HOST_PORT` from the root `.env`, which is **not** always the `5433` in `apps/api/.env.example` — this machine uses `5434` because another project holds `5433`. Read the root `.env` before assuming a port.

Run shared checks and infrastructure commands from the repository root. Use npm workspace scripts to target an individual application.

## Build, Test, and Development Commands

Install all dependencies with `npm install` at the repository root.

- `docker compose up -d db`: start the local PostgreSQL database.
- `npm run dev:web`, `npm run dev:blog`, and `npm run dev:api`: start the main site on `3000`, blog on `3001`, or API on `4001`.
- `npm run typecheck`: type-check all workspaces.
- `npm test`: test all workspaces.
- `npm run build`: build all workspaces.
- API only: root `prisma:migrate`, `prisma:generate`, and `seed` scripts update, generate, and populate the database.

Copy each package's `.env.example` to `.env` before local development. Never commit secrets or local `.env` files.

Keep reader session cookies host-only in production; do not widen them to a
parent domain shared by sibling subdomains. Keep both frontends on
`NEXT_PUBLIC_API_URL=/backend` and route that path to the shared API so
authentication remains same-origin from each browser.

## Coding Style & Naming Conventions

Follow the existing TypeScript style: strict typing, ES modules, two-space indentation, semicolons, and double quotes. Use `PascalCase` for React components and their files (`ArticleCard.tsx`), `camelCase` for functions and variables, and descriptive suffixes such as `*Controller`, `*Routes`, and `*Manager`. Prefer the frontend `@/` alias for package-root imports. Keep route files thin and place reusable business or validation logic outside them.

## Testing Guidelines

Vitest runs automated tests in all workspaces; API tests use Supertest and frontend component tests use Testing Library with jsdom. Colocate tests as `*.test.ts` or `*.test.tsx`. Before submitting changes, run `npm run typecheck`, `npm test`, and `npm run build` from the repository root. Add regression coverage for changed API authorization, validation, and interactive UI behavior.

## Commit & Pull Request Guidelines

History uses Conventional Commit prefixes (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`). Keep using them, with concise imperative subjects, for example `feat: add category filtering`. Keep commits focused. Pull requests should explain the change, list verification commands, mention schema or environment changes, link related issues, and include screenshots for visible UI changes.

## Branching and Collaboration

Two people work on this repository, and each works with their own AI agent. Assume
another agent is editing this codebase at the same time as you.

| Branch | Role |
| --- | --- |
| `development` | Integration branch and GitHub default. Everything merges here through a pull request. |
| `ramtin` | Ramtin's working branch. |
| `v.2` | The other maintainer's working branch. |

- Work on the branch belonging to the person you are working with. Never commit
  directly to `development`.
- Pull `development` and rebase your branch onto it **before** starting a task and
  again before opening a pull request. Most conflicts between the two agents come
  from starting work on a stale base.
- Never rewrite history that has been pushed to a shared branch. No `--force` on
  `development`, `ramtin`, or `v.2`. Use `--force-with-lease` only on your own
  branch, and only when the other agent is not building on it.

Note: CI (`.github/workflows`) triggers on pushes to `main`, which does not exist.
Until the default branch is renamed, the push job never runs and only the
`pull_request` trigger provides coverage.

## Working Alongside Another Agent

You and the other maintainer's agent must behave like two engineers on one team,
not two engineers on two forks of the same idea.

**Read before you write.** At the start of every task read `AGENTS.md`,
`pending.md`, and the most recent `changelog.md` entries. Those three files are the
handoff channel between the two agents — they are how you learn what the other
agent already did, decided, or deliberately left alone.

**Write what you did.** Every completed task updates `changelog.md`, and removes or
adds the corresponding `pending.md` items in the same change. An undocumented change
is invisible to the other agent and will be re-litigated or undone.

**Stay inside the task.** Do not opportunistically reformat, rename, or refactor
code outside the change you were asked for. Drive-by edits to shared files are the
main cause of painful merges. If you spot an unrelated problem, add it to
`pending.md` instead of fixing it.

**Announce shared-surface changes.** These files are edited by both sides and
conflict badly. When you touch one, say so explicitly in the commit body and pull
request description:

- `apps/api/prisma/schema.prisma` and `apps/api/prisma/migrations/`
- `apps/web/lib/i18n.ts` and `apps/web/lib/types.ts`
- `apps/web/lib/api.ts`
- `apps/api/src/app.ts` (route mounting)
- `AGENTS.md`, `pending.md`, `changelog.md`

**Migrations must not collide.** Name every migration
`<YYYYMMDD><NNNN>_<snake_case>` and check `apps/api/prisma/migrations/` for the
highest existing number first. Two agents creating the same-numbered migration on
different branches produces a database that cannot be migrated cleanly. Never edit
a migration that has already been merged into `development`; add a new one.

**Do not resolve a conflict by deleting the other side's work.** If a merge conflict
touches logic you did not write, keep both behaviours or ask, rather than taking
your own version wholesale.

## Version Control Rules for Agents

### Commit and Push Cadence

**Commit small and often. Push once per phase, as a single commit.**

Local commits are a working safety net; the pushed history is the reviewable
record. They are not the same thing and are not held to the same standard.

- **Commit every small, coherent step as you work** — a component extracted, a
  test made to pass, a migration written. Do not wait to be asked, and do not
  accumulate an hour of work in the working tree where a mistake loses all of it.
- **Local commit messages can be rough.** Prefix them `wip:`. They will not
  survive, so do not spend effort on them.
- **Do not push mid-phase.** A branch is pushed when a phase is finished, not
  when a step is.
- **A phase is one reviewable deliverable** — the unit the human would name when
  asking for the work ("restructure the product card", "add community
  publishing"). State what the current phase is at the start of a task, so both
  the human and the other agent know what the eventual commit will contain.
- **When the phase is complete and verified, squash it into one commit and push
  that.** `development` receives one clean, self-contained commit per phase with
  a proper Conventional Commit subject and a body explaining the change.

Because the squash only rewrites local commits that were never pushed, this does
not conflict with the rule against rewriting shared history. Once a commit is
pushed it is immutable.

Note that `git rebase -i` is not available to every agent harness. The reliable
way to collapse a finished phase is:

```
git reset --soft $(git merge-base HEAD origin/development)
git commit            # one message for the whole phase
```

`--soft` keeps the working tree untouched, so nothing can be lost by running it.

### Verification Gates the Push, Not the Commit

Run `npm run typecheck`, `npm test`, and `npm run build` from the repository root
**before squashing and pushing**. A red intermediate `wip:` commit is expected and
fine. A pushed commit that fails any of the three is not.

### Always

- One logical change per pushed commit. A schema change, its API, and its UI
  belong together; unrelated fixes do not.
- Never commit `.env` files, secrets, `node_modules/`, build output, or the
  `AGENTS.md` / `CLAUDE.md` files that `next dev` auto-generates inside `apps/*`.
- **Never stage changes you did not make.** Run `git status` before committing and
  stage explicit paths, never `git add -A`. The human or the other agent may have
  unrelated edits in the working tree; sweeping them into your commit steals their
  work and corrupts your phase.
- Never `git checkout --`, `git reset --hard`, or `git clean` over changes you did
  not make yourself.
- Do not push to `development`, or merge your own pull request into it, without
  the human saying so.

## Engineering Rules

These exist so both agents make the same call in the same situation. When a rule
does not cover your case, follow the closest one and record the new case here.

### Caching

`lib/api.ts` currently sends `cache: "no-store"` on every request, so nothing is
cached and every route renders dynamically. That is the correct default for
personal data and the wrong default for the public catalog. Choose per endpoint:

- **Public, slow-changing data** (catalog listings, product detail, categories):
  cache and revalidate — `next: { revalidate: <seconds> }`. Prefer a revalidating
  cache over `no-store` whenever the response is identical for every visitor.
- **Reader-authenticated or personal data** (session, favourites, the creator
  studio): always `no-store`. Never cache a response that varies by session cookie;
  a shared cache entry leaks one member's data to another.
- **Mutations**: never cached. After a mutation, refresh the affected data rather
  than mutating a cached copy in place.
- Do not add a client-side caching library before the server cache is used properly.

### State Management

Pick the **narrowest** tool that holds the state correctly. Most state does not
belong in a store at all.

| The state is… | Use |
| --- | --- |
| Server data (products, categories, a listing) | Fetch it in a Server Component. Do not copy it into client state. |
| Shareable view state (filters, sort, page, active tab, search) | The URL — search params. It survives reload and can be linked. |
| Per-device preference that must outlive a reload (theme, dismissed banner, draft text) | `localStorage` |
| Needed by the **server** on the next request (auth session, locale for SSR) | A cookie. `httpOnly`, `Secure`, `SameSite` for anything authentication-related. |
| App-wide and low-frequency (locale, theme, session identity) | React context — already how `locale-context` and `marketplace-session` work. |
| Genuinely shared client state, updated often, spanning distant components | **Zustand** |

Rules that follow from the table:

- **Zustand is the chosen client-state library**, but it is not yet a dependency
  because nothing has needed it. Add it when the first real case appears — not
  speculatively, and not for state one component owns.
- Never duplicate server data into a store. Derive it during render instead.
- Never put a session token in `localStorage`. Authentication lives in an
  `httpOnly` cookie so JavaScript, and therefore any XSS, cannot read it.
- Reading `localStorage` or `document.cookie` during render breaks hydration. Read
  it in an effect, or gate it behind a mounted check.
- `useState` is the right answer for state one component owns. Lift it only when a
  second component genuinely needs it.

### Data and Error Handling

- Validate every request body and query at the API boundary with a Zod schema in
  `apps/api/src/validation/schemas.ts`; never trust a client-supplied field.
- Trust, placement, and pricing fields (`verified`, `featured`, `trending`,
  `rating`, counts, price) are set server-side and never read from a request body.
- Scope every owner-specific query by the authenticated identity so a missing
  record and a forbidden record are indistinguishable to the caller.
- Surface the real failure in the UI. Do not collapse every error into one generic
  retry string.

## Pending Work Workflow

At the start of each task, check `pending.md` for relevant outstanding improvements before planning or editing. If a task completes an item from `pending.md`, remove that item from `pending.md` in the same change and add a dated entry to `changelog.md` describing what was completed and how it was verified. Keep `pending.md` limited to unfinished work; do not leave completed items there.
