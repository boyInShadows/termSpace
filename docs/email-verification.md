# Password-account email verification

Password registration creates the reader, a 30-minute verification record, and
an email outbox job in one database write. Registration does not call the email
provider, so a provider outage cannot roll back or stall account creation.

Verification links use `/account/verify-email#token=...`. The browser removes the
fragment before posting the token to the API, keeping it out of HTTP access logs,
referrers, and server-rendered requests. Tokens are single-use and signed with an
application secret; the bearer signature is not stored in the database. Creating
a replacement invalidates earlier links, and successful verification invalidates
all remaining links atomically.

## Cloudflare Email Service setup

1. Add and verify the sending domain in Cloudflare Email Service. The domain must
   use Cloudflare DNS.
2. Confirm the domain with `npx wrangler@latest email sending list`.
3. Create a scoped API token allowed to send email for the account.
4. Publish and validate the Cloudflare-provided SPF and DKIM records. Add a DMARC
   policy and monitor aggregate reports before tightening enforcement.
5. Configure the same `EMAIL_VERIFICATION_SECRET` in the API and email worker,
   plus `WEB_PUBLIC_URL`, `CLOUDFLARE_ACCOUNT_ID`,
   `CLOUDFLARE_EMAIL_API_TOKEN`, `EMAIL_FROM_ADDRESS`, and optionally
   `EMAIL_FROM_NAME`.
6. Deploy the migration, API, and `email-worker` service together.

The sender includes text and HTML bodies, a 10-second timeout, and a correlation
ID. It retries only network failures, timeouts, HTTP 429, and HTTP 5xx responses,
with bounded exponential backoff and at most five attempts. HTTP 4xx responses
and permanent bounces fail terminally. Logs include outcome, provider status,
latency, and correlation ID but never recipient addresses, tokens, credentials,
or provider response bodies.

## Operations and recovery

- Inspect `TransactionalEmailOutbox` by status and correlation ID. Do not copy
  recipient addresses or verification tokens into incident logs.
- Jobs left in `PROCESSING` for 15 minutes are reclaimed safely. Multiple workers
  coordinate with PostgreSQL `FOR UPDATE SKIP LOCKED`.
- A user can request another message after 60 seconds, up to five records per
  account per hour. The route also has an IP limit and always gives the same
  accepted response for verified, throttled, and newly queued requests.
- After correcting provider configuration, explicitly requeue selected failed
  rows by correlation ID only after confirming they are not expired or consumed.
  Never bulk-requeue an unbounded set.
- Rotate `CLOUDFLARE_EMAIL_API_TOKEN` independently. Rotating
  `EMAIL_VERIFICATION_SECRET` immediately invalidates every outstanding link, so
  do it only as a deliberate security action and tell users to request a new one.

## Local development bypass

When an email provider is intentionally unavailable during local browser
testing, set both values explicitly:

```env
WEB_PUBLIC_URL=http://localhost:3000
LOCAL_AUTO_VERIFY_EMAIL=true
```

New password accounts are then stored as verified immediately and no verification
record or email outbox job is created. An older unverified local account is also
marked verified on its next successful password login.

The bypass refuses to activate unless `WEB_PUBLIC_URL` uses the exact loopback
hostname `localhost`, `127.0.0.1`, or `[::1]`. Keep the flag unset or `false` in
staging and production; it is a testing convenience, not a fallback for a broken
email provider.
