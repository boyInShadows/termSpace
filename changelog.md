# Changelog

Project changes completed from `pending.md` should be recorded here with the date, a short summary, and any verification performed.

## 2026-10-28

- **Full gate for the first launch-readiness items (noindex, one library home,
  Settings link, specific sign-out errors).** Root typecheck, tests (270 API +
  17 blog + 403 web), web lint (two existing warnings) and production build
  pass. Full web E2E: 420 passed, 46 skipped, 17 failed under default
  parallelism; the failing specs pass with limited workers (125 passed, one
  reporting case) and `reporting` passes alone (28 passed), so they are
  load-sensitive. The two `/account` library cases were a real failure from
  this change and were rewritten to assert the link. Lighthouse not run (`/`,
  `/dashboard` and product pages were not changed).

- **Name the cause of a failed sign-out (launch-readiness item 2).**
  `account-settings.tsx` showed one generic message for every failure and also
  hid failures after a successful logout. The logout call is now classified:
  unreachable server or timeout, rate limit (429), server failure (5xx) and any
  other rejection each show their own message, and the session is kept until
  logout succeeds. Reused existing copy (`rateLimited`, `serviceError`,
  `signOutError`) and added one key, `signOutOffline`, to the Settings-only
  `account-security-copy.ts` (English and Persian; the Persian wording needs
  maintainer approval). A retry clears the previous message.
  - Verification: root typecheck, 36 dashboard tests (five new: four failure
    classes and retry), web lint pass. Not run: full tests, build, E2E (no E2E
    spec asserts the sign-out message). Also corrected the sign-out-everywhere
    item: a password change already signs out other sessions. Removed the item
    from `pending.md` and renumbered. Shared surfaces `pending.md` and
    `changelog.md`.

- **Link the release manager to Settings for provider connections
  (launch-readiness item 1, part 2).** At the owner's decision, replaced the
  three `ProviderConnections` renders in `creator-release-manager.tsx`
  (loading, history-failed and normal states) with a short section that reuses
  `connectionsTitle`/`connectionsIntro` and links to `/dashboard/settings`,
  which stays the single home for the GitHub and npm token forms. Rewrote the
  two release-manager tests that asserted embedded token controls and removed
  the unused provider mock. With part 1 this completes item 1; the creator
  profile summary in Settings is unchanged.
  - Verification: root typecheck, 63 creator tests, web lint pass. Not run:
    full tests, build, E2E (no E2E spec covers the release page token forms;
    `dashboard-capabilities.spec.ts` connects from Settings). Removed the item
    from `pending.md` and renumbered. Shared surfaces `pending.md` and
    `changelog.md`.

- **Give the acquired library one home (launch-readiness item 1, part 1).**
  `/account` no longer embeds `AcquiredLibrary`; the signed-in view shows the
  existing library title and intro with a link to `/dashboard/library`
  (reusing `libraryCopy`, no new keys). Removed the now-unused `embedded` prop,
  so the library heading is always the page `h1`. Replaced the account-form
  library tests with a link test and updated the library test.
  - Verification: root typecheck, 46 account and library tests, web lint
    pass. Not run: full tests, build, E2E. The provider-connections half of the
    item is left open in `pending.md` pending an owner decision. Shared
    surfaces `pending.md` and `changelog.md`.

- **Noindex the dashboard (launch-readiness item 1).** Added
  `export const metadata = { robots: { index: false, follow: false } }` to
  `apps/web/app/dashboard/layout.tsx`, matching the moderation pages, so every
  dashboard route (studio, library, settings, moderation) renders
  `noindex, nofollow` and is not indexable even when linked. Added
  `layout.test.ts` for the metadata. `/account` is private in `robots.ts` but
  still has no `noindex` tag; left out of scope and not yet queued.
  - Verification: root typecheck, new test, web lint (two existing warnings)
    pass; live dev server returns `<meta name="robots" content="noindex,
    nofollow">` for `/dashboard/settings` and `/fa/dashboard/library`. Not
    yet run: full web tests, production build and E2E (build would clobber the
    running dev server); run them before squashing. Removed from `pending.md`
    and renumbered the rest. Shared surfaces `pending.md` and `changelog.md`.

- **Replace `pending.md` with the dashboard launch-readiness queue.** At the
  owner's request, cleared the previous queue and added 12 ordered items from
  the review of `/dashboard/studio`, `/dashboard/library` and
  `/dashboard/settings` (noindex, duplicate surfaces, account deletion and
  export, sign-out everywhere, change email, preferences, library depth, studio
  onboarding, creator notifications, copy consolidation, signed-in verification
  pass). Kept the migration `202609240001` deployment-safety warning because it
  guards against data loss. The removed items (LCP targets, launch owner
  decisions, reporting, reviews, search, P1 growth, Blog) are preserved in git
  at `db6e095`; the relevant ones (account-deletion rating recalculation,
  analytics, creator notifications) were carried into the new items.
  - Verification: documentation only; nothing run. Shared surfaces
    `pending.md` and `changelog.md` edited; announce in the commit body.
