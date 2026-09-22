# Marketplace Role Operations

Marketplace roles belong to reader accounts and are independent from Blog
administrator accounts. A Blog `AdminUser` does not receive marketplace access,
and a marketplace administrator does not receive Blog access.

## Prerequisites

- Apply committed Prisma migrations.
- The target must already have a reader account.
- The reader email must be verified. Google-authenticated accounts are verified
  from Google's verified-email assertion. Password-only accounts remain
  unverified until the first-party email-verification flow is implemented.
- Run the command from a trusted API environment with `DATABASE_URL` configured.

When a verified Google identity first claims an existing unverified password
account with the same email, the API atomically removes the unverified password
credential and its existing sessions before issuing the Google-backed session.
This prevents a pre-created password account from inheriting verified access.

## Grant a role

```bash
npm run marketplace:role --workspace @termspace/api -- grant \
  --email creator@example.com \
  --role creator \
  --actor ops:initials \
  --reason "Approved creator access"
```

Valid roles are `creator`, `moderator`, and `administrator`. Use a non-email
operator identifier for `--actor`; it is stored in the append-only role event.

## Revoke a role

```bash
npm run marketplace:role --workspace @termspace/api -- revoke \
  --email creator@example.com \
  --role creator \
  --actor ops:initials \
  --reason "Creator access revoked by operator"
```

Grant and revoke operations fail when the requested state already exists. Grants
require a verified email; revocation remains available even if verification is
later removed. Each successful operation changes the grant and writes its audit
event in one database transaction. Output contains the internal user ID and
correlation ID, not the reader email.

## Bootstrap a marketplace administrator

Sign in to the main TermSpace application with Google first, then grant that
reader account the `administrator` role using the operator command. Do not reuse
the Blog administrator password or insert a hidden role during application
startup.

## Moderation workspace

Readers with an active `moderator` or `administrator` marketplace grant can use
the main application's `/moderation` workspace. The queue and preview APIs
recheck the grant on every request. A marketplace staff member cannot view
private moderation context for, add notes to, or decide a listing owned by their
own creator account. Assign a different authorized staff account when a reviewer
has a creator conflict.

Internal notes are append-only audit data. They must not contain credentials,
provider tokens, private artifact contents, or unnecessary personal data. Only
public-safe reasons are returned to creators. Marketplace moderation access does
not authenticate the separate Blog administration service.
