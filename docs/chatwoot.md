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
| Volumes | `chatwoot_postgres`, `chatwoot_storage`, `termbuddy_state` (compose-managed) |
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
  The bot rejects timestamps outside a 300 s window, missing/invalid signatures,
  and messages from another account. Missing account ID, bot token or webhook
  secret prevents startup. Incoming message and conversation IDs must be positive
  safe integers. Private, outgoing and non-text messages never generate answers.
- Incoming text is saved and fsynced to `/app/data` before a success response.
  Storage failures or a full queue (1,000 pending messages) return 503 so the
  sender can retry. The named `termbuddy_state` volume survives container
  recreation. One worker preserves conversation order; unrelated conversations
  can proceed while an earlier delivery is waiting for its retry time.
- Replies are posted back with the bot's own access token. Chatwoot deliberately
  blocks bots from *reading* conversations ("Access to this endpoint is not
  authorized for bots"), so the bot keeps its own rolling context per
  conversation: 12 messages, 30-minute TTL, in memory. A restart clears context
  while pending replies and message deduplication survive restarts.
- The brain is the OpenAI **Responses API**; default model `gpt-6-luna`
  (override with `OPENAI_MODEL`), with reasoning effort `none` for short support
  replies. Conversation history is an array, and `store: false` is retained.
  The key lives only in `.env.bot`. Without a key, the bot sends the localized
  fallback and reports degraded health. OpenAI timeout/network, 429 and 5xx
  failures receive one retry; other failures fall back immediately. Logs contain
  status, latency, correlation IDs and safe error codes, never message bodies or
  credentials. See the [Responses API documentation](https://developers.openai.com/api/docs/guides/migrate-to-responses).
- Generated answers are saved before delivery, so delivery retries reuse the
  answer rather than paying for another generation. Failed deliveries retry
  after 1 s, 5 s, 30 s, then every 5 minutes until resolved. Pending text remains
  on disk until delivered; success replaces it with a content-free deduplication
  marker retained for 24 hours. Access to the state directory is restricted to
  the container user.
- Delivery is **at least once**, not exactly once. Replies carry
  `content_attributes.termbuddy_reply_to`, and signed outgoing webhooks reconcile
  delivery if its HTTP response was lost. A timeout/restart before either the
  HTTP receipt or outgoing webhook is recorded can still cause a duplicate:
  Chatwoot 4.19.1's [message creation endpoint](https://github.com/chatwoot/chatwoot/blob/v4.19.1/app/controllers/api/v1/accounts/conversations/messages_controller.rb)
  does not enforce an idempotency key. Do not remove failed jobs to silence a
  health failure; diagnose and restore delivery.
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
8. Copy `bot.env.example` to `.env.bot` (chmod 600), fill it from the bootstrap
   output (account id, bot token, webhook secret) and add the OpenAI key, then
   `docker compose up -d --build termbuddy`.
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

The bot health endpoint returns 503 for a missing OpenAI key, recorded upstream
or storage failures, or a pending job older than two minutes. It includes safe
failure codes and queue counts/age. This reflects configuration and observed
outcomes, not a paid periodic OpenAI probe. After correcting credentials, recreate
the container and exercise a real chat; after a transient upstream failure, a
successful call clears that upstream's failure. Docker health status alone does
not restart a container or send an alert.

Backups run daily at 03:20 UTC plus up to 10 minutes of random delay, through
`termspace-chatwoot-backup.timer`. Root-only snapshots in `/var/backups/chatwoot`
contain a PostgreSQL custom-format dump, storage archive, bot queue snapshot,
Compose configuration and both secret environment files. Completed snapshots
expire after 14 days. **Keep this directory private:** recovery configuration
contains credentials and queue records can contain visitor text. Snapshots are
local to the host; off-host replication still needs an owner-selected destination.

```bash
cd /opt/termspace/deploy/chatwoot
bash backup.sh
# Check checksums/storage, restore bot state to a temporary directory, and restore
# the database into a new temporary database that is removed afterward.
bash verify-backup.sh /var/backups/chatwoot/<snapshot>
systemctl status termspace-chatwoot-backup.timer
journalctl -u termspace-chatwoot-backup.service --since today

# Install on another host:
install -m 644 termspace-chatwoot-backup.{service,timer} /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now termspace-chatwoot-backup.timer

# Dependency-free bot regression suite (also runs in CI on Node 22):
node --test deploy/chatwoot/bot/*.test.mjs  # from the repository root
```

OpenAI budget: set a monthly spend limit on the API project. Rotate the key by
editing `.env.bot` and `docker compose up -d termbuddy`.

## Branding

`INSTALLATION_NAME` and `BRAND_NAME` are set to `TermSpace`, and the TermSpace
mark is attached as the avatar of the agent bot and both inboxes, so the widget
header shows the brand rather than a letter. `BRAND_URL` and `WIDGET_BRAND_URL`
point at termspace.dev. The footer line reads "Powered by TermSpace" in the
widget (Chatwoot derives it from `BRAND_NAME`); removing the line entirely is
the paid `disable_branding` feature and was not circumvented. The Persian widget
still shows its own translation of "Powered by Chatwoot" in the footer.

## Known limits and open acceptance

- The OpenAI key is now configured and the history-serialization defect is fixed;
  real English and Persian answers were verified on 2026-11-06. The original fallback-only
  evidence below is retained as historical evidence, not current configuration.
- `disable_branding` (removing the footer line) is a paid Chatwoot plan feature
  and was not circumvented.
- The help-center portal has not been created or themed yet.
- No SMTP configured: no transcript or notification email; inbox email
  collection is disabled.
- Off-host backup replication and an external alert destination are not configured.
- Delivery has the at-least-once limitation described above. Do not scale the bot
  to multiple replicas sharing its directory; the queue has one process owner.

## Verification evidence (2026-11-06)

- Rebuilt/recreated only `termbuddy`; the container loads the owner's saved key.
  Real English and Persian questions about publishing received correct AI
  answers through the embedded widget. An English follow-up about where to
  submit retained the publishing context and pointed to the dashboard/Studio.
- Headless Chrome, EN/LTR and FA/RTL, 1280 and 320 px, light and dark: launcher,
  composer, message delivery and theme switching work. The root skip link is
  the first keyboard stop; the composer sends with Enter. Reduced-motion
  preference was enabled during this check.
- At 320 px a reload retains the conversation in both inboxes. Reopening the
  widget shows its welcome screen; **Continue conversation** (localized in FA)
  returns to the existing messages. Automatic panel reopening was not added.
- Nine bot regression tests pass both locally and in the production Node 22
  image. They cover history arrays/follow-ups, authentication and account scope,
  transient/permanent failures, localization, SIGKILL recovery, deduplication,
  outgoing-webhook reconciliation, private/ignored events and safe logging.
- `/var/backups/chatwoot/20261106T111601Z` passed checksums and storage validation,
  a temporary database restore (110 public tables), and a temporary bot queue
  restore. The daily timer is enabled; snapshots and environment files remain
  private. No off-host copy or external alert channel has been configured.

## Verification evidence (2026-11-04)

- `https://chat.termspace.dev/api` → 200 JSON (`version 4.19.1`, queues ok),
  `/packs/js/sdk.js` → 200, TLS via Cloudflare.
- Widget flow exercised against the real stack for both inboxes: anonymous
  contact → conversation → incoming message → signed webhook → bot reply.
  English and Persian both received the correct localized fallback (no OpenAI
  key yet), and the bot logged `openai_http_401` with latency and no message
  content.
- Browser pass with Chrome at 1280 px: EN and FA pages load the correct inbox
  token, the launcher opens, and a real message sent from the widget received
  the fallback reply inside the conversation. FA renders RTL; the panel follows
  the site's light/dark toggle through `setColorScheme`/initial config; at
  320 px the FA widget opens full-width and remains usable.
- Web: root typecheck, 503 tests, lint (0 errors), production build.

