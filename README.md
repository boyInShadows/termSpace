# TermSpace

TermSpace is a community publishing and discovery platform for agentic coding
tools. Its catalog is designed for skills, agents, MCP servers, integrations,
rules, prompts, hooks, templates, and workflows contributed by creators and
shared across platform communities.

The repository also contains the TermSpace Blog, a separate staff-managed
publication about agentic coding. Community accounts and creator or moderator
roles never grant Blog publishing access. See
[Product Direction](docs/product-direction.md) for the durable product
boundaries and core user journeys.

## Current product foundation

- A localized English/Persian community library with public catalog and item pages.
- Reader authentication, verified accounts, marketplace role grants, and
  creator profiles.
- An owner-scoped creator dashboard and structured drafts for all nine item
  types, including compatibility, permissions, installation, and source data.
- Immutable proposed and approved listing snapshots with explicit lifecycle
  states and audit events.
- A role-gated moderation workspace with queues, safe text-only previews,
  private staff notes, decisions, suspension, archival, and restoration.
- Staff-defined communities and creator placement requests, kept separate from
  platform compatibility.

The first community-library milestone is external-source-first: submissions reference
GitHub or npm artifacts instead of uploading executable packages to TermSpace.
Source ingestion, creator-controlled release management, add/install flows, public
community browsing, and authenticated ratings/reviews remain active roadmap
work tracked in [pending.md](pending.md).

## Repository layout

```text
apps/
  web/   Community library and creator frontend (Next.js)
  blog/  Staff-managed editorial frontend (Next.js)
  api/   Shared Express/Prisma API
docs/    Product, architecture, and operational documentation
```

## Local development

Prerequisites are Node.js 22 or newer, npm, Docker, and Docker Compose.

Install all workspace dependencies from the repository root:

```bash
npm install
```

Copy each application's `.env.example` to `.env` in the same directory. Start
PostgreSQL, apply the migrations, and run each application in its own terminal:

```bash
npm run db:up
npm run prisma:deploy
npm run dev:api
npm run dev:web
npm run dev:blog
```

Run `npm run seed` when you explicitly want development seed data. A clean
database is intentionally not seeded during normal startup.

For local browser testing without an email provider, set
`LOCAL_AUTO_VERIFY_EMAIL=true` and keep `WEB_PUBLIC_URL` on a loopback hostname.
New password accounts will be verified immediately. The API rejects this bypass
for non-loopback public URLs. Production and staging must use the real email
verification worker described in
[Email Verification Operations](docs/email-verification.md).

Run all repository checks from the root with:

```bash
npm run typecheck
npm test
npm run build
```

Marketplace roles are assigned independently from Blog administration. See
[Marketplace Role Operations](docs/marketplace-roles.md) for verified-account
requirements and the audited grant/revoke command.
Password-account verification delivery and Cloudflare onboarding are documented
in [Email Verification Operations](docs/email-verification.md).
Creator identity boundaries and self-service ownership are documented in
[Creator Onboarding and Ownership](docs/creator-onboarding.md).
Controlled item types, manifest validation, legacy classification, and immutable
release storage are documented in [Marketplace Item Types and Manifests](docs/marketplace-manifests.md).
Listing review states, immutable approved/proposed snapshots, and transition
authorization are documented in [Marketplace Listing Lifecycle](docs/marketplace-listing-lifecycle.md).

## Run the complete stack with Docker

Docker Compose runs PostgreSQL, the shared API, the scheduled publishing worker,
the community library, and the Blog:

```bash
cp .env.example .env # required; replace the example database/admin passwords
npm run docker:up
```

The API applies every committed Prisma migration before it starts. The other
services wait for the API health check, so a migration failure prevents a
partially working stack from coming online.

After configuring Cloudflare Email Service, start the transactional email worker
with `docker compose --profile email up --build -d`.

With the example host ports, the loopback-only services are available at:

- Community library: <http://localhost:3000>
- Blog: <http://localhost:3001>
- API health: <http://localhost:4001/api/health>
- PostgreSQL: `localhost:5433`

Confirm startup with `docker compose ps`; the database and API should report as
healthy. Stop the stack without deleting local data with `npm run docker:down`.

Persistent PostgreSQL data is stored in the `blog_pgdata` volume and local media
uploads in `api_uploads`. To rebuild from a completely empty local state:

```bash
docker compose down -v --remove-orphans
docker compose build --no-cache
docker compose up -d
```

The `-v` reset permanently deletes the local database and locally uploaded
media. It is not a normal restart command and cannot be undone without a backup.

If a host port is already in use, set `DB_HOST_PORT`, `API_HOST_PORT`,
`WEB_HOST_PORT`, or `BLOG_HOST_PORT` in `.env`; container-to-container addresses
do not change. For example, `DB_HOST_PORT=55433 WEB_HOST_PORT=3100` lets the
stack coexist with an older local database and frontend.

For production, provide a real `.env` without committing it. Set strong database
and administrator passwords, production `CORS_ORIGINS`, `MEDIA_PUBLIC_URL`, and
the exact reverse-proxy hop count in `TRUST_PROXY`. Put TLS and public routing in
a reverse proxy in front of the three HTTP services. PostgreSQL is bound to
loopback by default and must not be exposed publicly.

The API is shared infrastructure, but its route modules and permissions remain
separated by domain. Article, reader, newsletter, and editorial routes serve the
Blog; community-catalog routes retain their internal `marketplace` module names
and remain separate from editorial controllers.

The main frontend supports English and Persian through the same locale pattern
as Blog: English uses `/`, while Persian uses `/fa` (for example `/fa/explore`
and `/fa/account`). The web proxy strips the locale prefix internally, sets the
request locale, and applies RTL document direction and Persian typography.

## Production subdomain deployment

The intended production layout is one parent domain with two Next.js surfaces,
for example:

```text
www.example.com   -> apps/web
blog.example.com  -> apps/blog
api.example.com   -> apps/api (or an internal API service behind both proxies)
```

Both frontends call the same `/api/readers/*` endpoints and use the same
`ReaderUser` records. Browser requests go through each frontend's same-origin
`/backend/*` rewrite. Reader cookies are deliberately host-only so a compromised
or dangling sibling subdomain cannot receive them; users therefore authenticate
separately on each frontend until a controlled one-time token exchange is added.
`SameSite=Lax` remains intentional and the cookie is unavailable to JavaScript.

Set `API_URL` at frontend build time to the internal API address and include the public
frontend origins in `CORS_ORIGINS` when the API is reachable cross-origin (for
example `https://www.example.com,https://blog.example.com`). Keep
`NEXT_PUBLIC_API_URL=/backend` in both frontends so browser calls remain
same-origin and preserve the shared cookie.

## Existing database migration

The monorepo adds the previously missing initial content migration. Before the
first deployment to a database that already contains the blog tables, mark only
that baseline as applied, then deploy the remaining migrations:

```bash
npm exec --workspace @termspace/api prisma migrate resolve --applied 202608230001_initial_content
npm run prisma:deploy
```

Do not run `resolve` on a new database; `prisma migrate deploy` must create the
initial tables there.
