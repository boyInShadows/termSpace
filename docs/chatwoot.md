# Chatwoot and Termbuddy

Self-hosted Chatwoot (Community Edition 4.19.1) provides the live chat on
termspace.dev. The only responder is **Termbuddy**, an agent bot that answers
from a curated TermSpace knowledge pack through the OpenAI API. There are no
human agents on the inbox; anything the bot cannot answer is directed to
support@termspace.dev.

## Where everything runs

| Piece | Location |
| --- | --- |
| Chatwoot dashboard, widget API, help center | `https://chat.termspace.dev` (Cloudflare proxied) |
| TLS + reverse proxy | Caddy on the production host, `chat.termspace.dev` block → `127.0.0.1:3010` |
| Compose project (`chatwoot`) | `/opt/termspace/deploy/chatwoot` (tracked in this repo as `deploy/chatwoot/`) |
| Services | `rails`, `sidekiq`, `postgres` (pgvector/pg16), `redis`, `termbuddy` |
| Volumes | `chatwoot_postgres`, `chatwoot_storage` (compose-managed) |
| Secrets | `deploy/chatwoot/.env` and `deploy/chatwoot/.env.bot` (chmod 600, untracked) |
| Admin credentials | `/opt/chatwoot/credentials.env` (root only) |
| Bootstrap output (IDs/tokens, initial password) | `/opt/chatwoot/bootstrap.json` (chmod 600) |
| DNS | Cloudflare `A chat` → the production host, proxied |

Only the Rails port is published (`127.0.0.1:3010`). Postgres, Redis and the bot
are reachable only on the internal compose network. The TermSpace web container
does not talk to Chatwoot directly — it only renders the public widget script.

## How Termbuddy works

- Chatwoot agent bot (webhook type) named **Termbuddy**, attached to both
  website inboxes (`TermSpace Website (EN)` and `(FA)`). The two inboxes exist so
  the widget welcome copy is localized; the same bot answers both.
- Chatwoot posts every message event to `http://termbuddy:8787/webhook`, signed
  with `X-Chatwoot-Signature: sha256=HMAC_SHA256(secret, "<timestamp>.<raw body>")`.
  The bot rejects timestamps older than 300 s and acknowledges within
  milliseconds — Chatwoot treats 5 s as failure and retries 429/500.
- Replies are posted back with the bot's own access token. Chatwoot deliberately
  blocks bots from *reading* conversations ("Access to this endpoint is not
  authorized for bots"), so the bot keeps its own rolling context per
  conversation: 12 messages, 30-minute TTL, in memory. A restart clears context
  but every new message is still answered.
- The brain is the OpenAI **Responses API**; default model `gpt-6-luna`
  (override with `OPENAI_MODEL`). The key lives only in `.env.bot`. Without a
  key, every message receives the localized fallback reply and the failure is
  logged — the widget never goes silent.
- Knowledge lives in `deploy/chatwoot/bot/knowledge/en.md` and `fa.md` and is
  injected into the system prompt at boot. Edit the files and rebuild the bot
  container to publish changes.
- Widget endpoint abuse is limited by Chatwoot's Rack Attack
  (`ENABLE_RACK_ATTACK_WIDGET_*`; 20 conversations/min, 40 messages/min per IP).

## First-time setup (already done on production)

1. DNS: Cloudflare `A chat` → host, proxied.
2. Caddy: append the `chat.termspace.dev` block, `caddy validate`, reload.
3. `cp .env.example .env`, fill secrets (`openssl rand -hex`), `docker compose config`.
4. `docker compose up -d postgres redis`, wait healthy.
5. `docker compose run --rm rails bundle exec rails db:chatwoot_prepare`.
6. `docker compose up -d rails`, wait for the healthcheck.
7. Bootstrap (creates SuperAdmin + account + inboxes + agent bot):
   `docker compose exec -T -e BOOTSTRAP_ADMIN_PASSWORD=... rails bundle exec rails runner - < bootstrap.rb`
8. Fill `.env.bot` from the bootstrap output (account id, bot token, webhook
   secret, OpenAI key), then `docker compose up -d termbuddy`.
9. Put `CHATWOOT_TOKEN_EN` / `CHATWOOT_TOKEN_FA` (the website tokens, which are
   public identifiers) and `CHATWOOT_BASE_URL` in the TermSpace `.env`, then
   restart the `web` service. The widget reads them at runtime.

## Operations

```bash
cd /opt/termspace/deploy/chatwoot
docker compose ps
docker compose logs -f rails sidekiq termbuddy
curl -fsS https://chat.termspace.dev/api        # Chatwoot health
docker compose exec termbuddy wget -qO- http://localhost:8787/health

# upgrade: bump the pinned image tag, then
docker compose pull
docker compose run --rm rails bundle exec rails db:chatwoot_prepare
docker compose up -d
```

Backups (add to the host's backup routine):

```bash
docker compose exec -T postgres pg_dump -U chatwoot chatwoot | gzip > chatwoot-$(date -u +%Y%m%dT%H%M%SZ).sql.gz
docker run --rm -v chatwoot_chatwoot_storage:/data -v "$PWD":/backup alpine tar czf /backup/chatwoot-storage-$(date -u +%Y%m%dT%H%M%SZ).tgz -C /data .
```

OpenAI budget: set a monthly spend limit on the API project. Rotate the key by
editing `.env.bot` and `docker compose up -d termbuddy`.

## Known limits and open acceptance

- **OpenAI key not configured yet.** At deploy time no key was available, so
  every conversation currently receives the friendly fallback. Add
  `OPENAI_API_KEY=...` to `.env.bot` and restart `termbuddy`.
- `disable_branding` (removing "Powered by Chatwoot" from the widget) is a paid
  Chatwoot plan feature and was not circumvented.
- The widget follows the operating system colour scheme (`darkMode: "auto"`);
  it cannot read the site's class-based theme toggle.
- No SMTP configured: no transcript or notification email; inbox email
  collection is disabled.
- The help-center portal has not been created or themed yet.
- Live browser acceptance of the embedded widget (both themes, EN/FA RTL,
  320–1280 px) is still the owner's check.

## Verification evidence (2026-11-04)

- `https://chat.termspace.dev/api` → 200 JSON (`version 4.19.1`, queues ok),
  `/packs/js/sdk.js` → 200, TLS via Cloudflare.
- Widget flow exercised against the real stack for both inboxes: anonymous
  contact → conversation → incoming message → signed webhook → bot reply.
  English and Persian both received the correct localized fallback (no OpenAI
  key yet), and the bot logged `openai_http_401` with latency and no message
  content.
- Web: root typecheck, 503 tests, lint (0 errors), production build.
