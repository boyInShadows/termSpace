# TermSpace

TermSpace is a monorepo containing the main product site, its editorial site,
and one shared API.

The main product is a discovery and creator platform for agentic coding tools,
including skills, agents, MCP servers, integrations, rules, prompts, hooks,
templates, and workflows. Community members can discover, filter, acquire, and
review published items; creators will manage submissions and releases through a
dashboard. The Blog is a separate, staff-managed editorial publication and does
not accept public or creator uploads. See [Product Direction](docs/product-direction.md)
for the product boundaries and core journeys.

```text
apps/
  web/   Main TermSpace frontend (Next.js, port 3000)
  blog/  Editorial frontend (Next.js, port 3001)
  api/   Shared Express/Prisma API (port 4001)
docs/    Operational documentation
```

## Local development

Install all workspace dependencies from the repository root:

```bash
npm install
```

Copy each app's `.env.example` to `.env` in the same directory. Then start
PostgreSQL and run each application in its own terminal:

```bash
npm run db:up
npm run dev:api
npm run dev:web
npm run dev:blog
```

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

## Run the complete stack with Docker

Docker Compose runs PostgreSQL, the shared API, the publishing worker,
the main site, and Blog:

```bash
cp .env.example .env # required; replace the example database/admin passwords
npm run docker:up
```

After configuring Cloudflare Email Service, start the transactional email worker
with `docker compose --profile email up --build -d`.

The services are bound to loopback and available at `http://localhost:3000` (main site),
`http://localhost:3001` (Blog), and `http://localhost:4001/api/health` (API).
The API container applies committed Prisma migrations before starting. Persistent
PostgreSQL data is stored in the `blog_pgdata` volume and local media uploads in
`api_uploads`. Stop the stack with `npm run docker:down`.

If a host port is already in use, set `DB_HOST_PORT`, `API_HOST_PORT`,
`WEB_HOST_PORT`, or `BLOG_HOST_PORT` in `.env`; container-to-container addresses
do not change. For example, `DB_HOST_PORT=55433 WEB_HOST_PORT=3100` lets the
stack coexist with an older local database and frontend.

For production, provide a real `.env` without committing it. Set strong database
and administrator passwords, production `CORS_ORIGINS`, `MEDIA_PUBLIC_URL`, and
the exact reverse-proxy hop count in `TRUST_PROXY`. Put TLS and public routing in
a reverse proxy in front of the three HTTP services. PostgreSQL is bound to
loopback by default and must not be exposed publicly.

The API is shared infrastructure, but its route modules remain separated by
domain. Existing article, reader, newsletter, and editorial routes serve the
blog; TermSpace marketplace routes live in their own modules rather than being
coupled to editorial controllers.

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
