# Pending Improvements

This file tracks known improvement work that has not been completed yet. When an item is finished, remove it from this file and add a dated entry to `changelog.md`.

## Launch Readiness — Dashboard Studio, Library, Settings

Source: 2026-10-28 review of `/dashboard/studio`, `/dashboard/library` and
`/dashboard/settings` (code, API routes and the 2026-10-25 E2E evidence; not
rendered signed in). Items are in the suggested order; each is one reviewable
phase. The views item adds a migration, so it touches shared surfaces
(`schema.prisma`, `migrations/`, `lib/api.ts`, `lib/types.ts`, `lib/i18n/`) and
needs a written plan first.

1. **Listing views and trends (privacy-conscious analytics).** The studio card
   now shows acquisitions for the last 30 days and recent reader reviews, but
   nothing records listing views, so there is no view-to-acquisition
   conversion and no trend over time. Design a counter that stores no
   personal data (daily per-listing aggregates, no per-visitor rows, honour
   Do Not Track), decide what the creator sees (views, conversion, a 30-day
   sparkline), and add it to the listing card. Needs a migration and a short
   privacy-policy note. Acceptance: API test that no visitor identifier is
   stored, UI states for no data, and the policy updated.
2. **Creator notifications for moderation decisions.** Creators currently have
    to return to the dashboard to see approvals, rejections and change
    requests. Notify on each decision (in dashboard and by email); delivery is
    controlled by the email preferences section added on 2026-10-31.
    Acceptance: API test per decision type, email worker coverage.
3. **Consolidate creator copy.** `creator-hub.tsx` and
    `provider-connections.tsx` merge `t.creatorHub`/`t.creatorReleases` with
    `creatorWorkspace[locale]`. Collapse to one source so English and Persian
    cannot drift. Acceptance: key-parity test passes, no behaviour change.
4. **Set up Cloudflare Email Sending and test the email flows (needs the
   domain).** Blocked until a domain is on the Cloudflare account. Steps:
   onboard the domain under Email Sending and add the SPF, DKIM and DMARC
   records it lists; create an API token with the "Email Sending: Edit"
   permission; fill `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_EMAIL_API_TOKEN` and
   `EMAIL_FROM_ADDRESS` (an address on that domain) in `apps/api/.env`, set
   `LOCAL_AUTO_VERIFY_EMAIL=false`, restart the API and run the worker in a
   loop (`npm run email:worker -w @termspace/api`). Then exercise registration
   and email verification, password reset, change email (confirmation to the
   new address and the notice to the old one) from the website. Cloudflare's
   service is in public beta, so check its limits and pricing first. Watch for
   `HTTP_403` (token permission), `PROVIDER_NOT_CONFIGURED` (a setting is
   empty) and `HTTP_400`: `cloudflareEmail.ts` sends `from` as
   `"Name <address>"` and the docs describe a separate address and name, so if
   that is rejected switch to the object form. Diagnose failures from
   `TransactionalEmailOutbox.lastStatusCode`/`lastErrorCode`. Mailgun's free
   tier would also cover the volume but needs a provider adapter (not built).
   Acceptance: each flow delivers a real email and the link or code works;
   record evidence in `changelog.md`.
5. **Rate limiting can silently turn off at API startup.** Found 2026-10-28 in
   the Docker stack: with the machine under load, every limiter logged
   "async error during store initialization: Command timed out" (Redis
   `commandTimeout` is 1 s in `lib/redis.ts`), `passOnStoreError` then let all
   requests through uncounted, and 12 wrong logins were never blocked. A
   restart on a quiet machine fixed it. Make startup robust: create the
   limiters only once Redis answers (or retry the store initialization), log
   loudly and expose it on the health check when a limiter's store is down.
   Acceptance: a test that starts the app with a slow Redis and still counts,
   plus a documented failure mode.
6. **Signed-in verification pass (final gate).** Seed a verified account and a
    verified creator, then check all three pages and their sub-routes in light
    and dark, English and Persian RTL, 320–1280 px, keyboard focus, and every
    loading/error/empty state. Also cover what automated tests could not:
    the Google re-authentication button on a real Google client, the export
    download in a real browser, an Impeccable review of the new "Your data" and
    "Delete account" sections, and maintainer approval of the new Persian copy
    (sign-out errors, sign out other devices, account data, change email, library filters, privacy policy). Record evidence in
    `changelog.md`.

## Deployment Safety

- Before applying migration `202609240001_remove_duplicate_creator_ownership`
  to any database that served the retired `/api/community` publishing routes,
  audit `MarketplaceCreator.userId`. If any row is non-null, reconcile it into
  the canonical `ownerUserId` profile and create any required audited creator
  role grant before migrating. The migration intentionally aborts instead of
  discarding ownership data.
- Apply migration `202610280001_reader_account_deletion` (adds
  `ReaderUser.deletedAt`) before starting the API that includes the account
  deletion change: the generated client reads that column on every reader
  query, so the new API fails against an unmigrated database. The change is
  additive; old API versions keep working after the migration.
- Apply migration `202610280002_reader_email_change` (new `ReaderEmailChange`
  table, two outbox columns and a widened `exactly_one_target` check) before
  starting the API and the email worker that include the email change feature:
  the worker's claim query selects the new outbox columns. The change is
  additive; the old check is replaced in the same migration.
