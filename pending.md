# Pending Improvements

This file tracks known improvement work that has not been completed yet. When an item is finished, remove it from this file and add a dated entry to `changelog.md`.

## Launch Readiness — Dashboard Studio, Library, Settings

Source: 2026-10-28 review of `/dashboard/studio`, `/dashboard/library` and
`/dashboard/settings` (code, API routes and the 2026-10-25 E2E evidence; not
rendered signed in). Items are in the suggested order; each is one reviewable
phase. Items 1–4 add API routes and migrations, so they touch shared surfaces
(`apps/api/src/app.ts`, `schema.prisma`, `migrations/`, `lib/api.ts`,
`lib/types.ts`, `lib/i18n/`) and need a written plan first.

1. **Blog data on account deletion.** Deliberately left out of the account
   deletion phase (owner: no blog work for now). `Comment` stores a name and
   email with no link to the reader, and `NewsletterSubscriber` stores an
   email. Account deletion does not touch either, and the privacy policy tells
   people to write to us for both. Add deletion of comments and the
   subscription matching the account email, and an unsubscribe in Settings
   (see the notification preferences item). Acceptance: API test that both
   are removed with the account, policy copy updated.
2. **Sign out everywhere.** Settings can only end the current session, although
   a password change already signs out the others (per
   `account-security-copy.ts`; confirm that also holds for password reset). Add
   session listing or at minimum a "sign out all devices" action that
   invalidates the other sessions. Acceptance: API test that old cookies stop working, UI in Settings
   under Account security.
3. **Change email.** The email row is read-only. Add a verified change flow
   (confirm via the new address, notify the old one, keep the verified-email
   requirement for creators). Acceptance: API and UI tests, rate limits like
   the existing verification routes.
4. **Notification and newsletter preferences.** Settings has no opt-out for
   the newsletter or future notifications. Add a preferences section backed by
   the existing newsletter subscription data; extend it when item 7 ships.
   Acceptance: unsubscribe reflected in the newsletter API, both locales.
5. **Library depth.** Add sort and filter (and search past one page) to
   `/dashboard/library`, a link from each acquired entry to its review
   composer, and a batch endpoint so Saved (`saved-listings.tsx`) stops
   resolving up to 12 products one request at a time. Acceptance: one request
   per Saved page, E2E for sort/filter and for the review link.
6. **Studio onboarding and feedback.** Give a creator with no listings a short
   guide (profile, first draft, source check, submit). Show review feedback
   and per-listing analytics (views, acquisitions over time) on the listing
   card; this overlaps the privacy-conscious analytics item below, so build
   them together. Acceptance: empty-state E2E, no personal data exposed.
7. **Creator notifications for moderation decisions.** Creators currently have
    to return to the dashboard to see approvals, rejections and change
    requests. Notify on each decision (in dashboard and by email) and let item
    4 control delivery. Acceptance: API test per decision type, email worker
    coverage.
8. **Consolidate creator copy.** `creator-hub.tsx` and
    `provider-connections.tsx` merge `t.creatorHub`/`t.creatorReleases` with
    `creatorWorkspace[locale]`. Collapse to one source so English and Persian
    cannot drift. Acceptance: key-parity test passes, no behaviour change.
9. **Signed-in verification pass (final gate).** Seed a verified account and a
    verified creator, then check all three pages and their sub-routes in light
    and dark, English and Persian RTL, 320–1280 px, keyboard focus, and every
    loading/error/empty state. Also cover what automated tests could not:
    the Google re-authentication button on a real Google client, the export
    download in a real browser, an Impeccable review of the new "Your data" and
    "Delete account" sections, and maintainer approval of the new Persian copy
    (sign-out errors, account data, privacy policy). Record evidence in
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
