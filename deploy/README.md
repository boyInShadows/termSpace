# VPS preview

Deploy web/API only. INSIGHT keeps its existing Nginx sites, host PostgreSQL,
certificates and port 3000. TermSpace uses separate Docker volumes and loopback
ports 3300/8443. The blog and article scheduler are not deployed.

## Prerequisites

- VPS: x86_64, at least 2 CPUs, 4 GB RAM, 40 GB disk with the filesystem expanded.
- Snapshot and encrypted off-server backup of the existing service before host changes.
- Docker Engine, Compose v2, Node 22+, age, Nginx and key-based operator access.
  age provides authenticated backup encryption without custom cryptography.
- A dedicated read-only GHCR credential, provisioned through stdin. A registry
  bearer may be scoped to pull only `boyinshadows/termspace-web`,
  `boyinshadows/termspace-api` and `boyinshadows/termspace-ops`. Keep broader local
  GitHub OAuth credentials on the development computer. Use a protected temporary
  `DOCKER_CONFIG` for the pull/release and remove it afterward; never put a
  credential in an image, Git, shell arguments or this document.
- A locally trusted `termspace.localhost` certificate. Install mkcert's CA only
  on the development computer; never copy its CA private key to the VPS.

## Release images

The `Preview images` GitHub workflow builds linux/amd64 web, API and operations
images, smoke-tests them and publishes immutable digests as workflow artifacts.
Images contain no local `.env` files or fixtures. The operations image contains
Prisma/seed/role tools; the API runtime has production dependencies only.

All three jobs must pass for the same commit before deploying. Record their
digest references in `WEB_IMAGE`, `API_IMAGE`, `OPS_IMAGE`. Never deploy a mutable
tag. Google and the blog are disabled. The current workflow builds for the public preview origin
`https://termspace.13.140.89.146.sslip.io`. An origin or Google client change
requires a rebuild; existing private-origin digests remain available for rollback.

## Initial installation

Keep a complete release checkout in `/opt/termspace`. Protect `/etc/termspace`
with mode 700, configuration and TLS private keys with mode 600. Generate once:

```sh
node deploy/init-preview.mjs /etc/termspace/preview.env
node deploy/check-config.mjs /etc/termspace/preview.env
```

The first command refuses to overwrite existing secrets. The second fails until
all three verified image digests are supplied. It prints variable names/reasons,
never values. Do not reuse the development database or its placeholder passwords.
The new provider encryption key and verification secret must remain stable.

Install `nginx-preview.conf` as an additional site, with its leaf certificate
and key at `/etc/termspace/tls/preview.pem` and `preview-key.pem`. Run `nginx -t`
before reloading. Do not replace or edit the INSIGHT sites. Then:

```sh
sh deploy/release.sh
```

No demo data or users are seeded automatically. Seed only reference data using
the operations image with `NODE_ENV=production`, `SEED_DEMO=false` and
`SEED_RESET=false`. Bootstrap an administrator only after the owner supplies an
email and a separately generated password through protected configuration.
Marketplace roles require a verified reader and the existing audited role CLI;
a blog administrator account does not grant marketplace roles.

## Private access (private-origin releases)

For a private-origin release or rollback, resolve `termspace.localhost` to `127.0.0.1`, trust
the local certificate and open the tunnel:

```sh
ssh -F /dev/null -i ~/.ssh/termspace-preview -o IdentitiesOnly=yes \
  -o UserKnownHostsFile=~/.ssh/known_hosts_termspace \
  -o StrictHostKeyChecking=yes -o ExitOnForwardFailure=yes \
  -N -L 127.0.0.1:8443:127.0.0.1:8443 termspace-ops@13.140.89.146
```

Open `https://termspace.localhost:8443`. Its hostname isolates cookies from
localhost development. API/database/Redis have no published ports. Confirm an
external connection to 3300/8443 fails. All preview users share the tunnel's
loopback IP, so they share per-IP limits; this is expected for this private setup.

## Email and public launch gates

The email worker is an explicit Compose `email` profile. Do not start it while
the sending domain/credentials are undecided. New registrations remain
unverified; verification and reset jobs remain queued. No automatic verification
bypass is enabled and no marketplace role is granted to unverified readers.

Before enabling the worker, set all three Cloudflare values, the sender and the
same signing secret as the API. Validate the configuration, then start the profile
and prove inbox delivery, one-use verification, resend and password reset. Never
claim a provider's accepted/queued response proves receipt.

`DEPLOYMENT_MODE=public` requires a real HTTPS origin, complete mail configuration
and legal contact. Public DNS/TLS, legal review, signup consent, Google credentials
and verified creator/moderator acceptance remain owner-dependent launch gates.

## Public preview

The owner-requested public preview uses
`https://termspace.13.140.89.146.sslip.io` and `DEPLOYMENT_MODE=public-preview`.
The free sslip.io hostname resolves its embedded IP without a DNS account. It
depends on that service and the VPS retaining its current IP; it is not an owned
domain. Use this origin consistently in `WEB_PUBLIC_URL`, `CORS_ORIGINS`,
`NEXT_PUBLIC_SITE_URL`, and `MEDIA_PUBLIC_URL` (with `/backend/media` appended).
Compile and verify the matching web image before changing runtime settings.

Public preview keeps the existing undecided-mail behavior: the email profile and
Google remain disabled, registrations cannot bypass verification, and the
owner-provisioned verified test accounts retain their audited roles. It does
not satisfy full public-launch acceptance. Partial mail settings are rejected
in every mode; `public` still requires complete mail settings and legal contact.

Install `nginx-public-preview.conf` as an additional SNI site on ports 80/443,
preserving INSIGHT and the private listener. Bootstrap only its HTTP ACME
location before the certificate exists; keep the application location unavailable
until the new images and origin settings pass verification. Use the installed
Certbot webroot authenticator with `/var/www/termspace-acme` and certificate name
`termspace-public-preview`. Reload Nginx only after `nginx -t` succeeds. The
existing certificate-renewal timer runs Certbot renewal for all managed
certificates and reloads Nginx; verify a dry run for the new certificate.

The public site redirects HTTP to HTTPS and sends `X-Robots-Tag: noindex,
nofollow`. Only Nginx is public; web/API/database/Redis container ports retain
their private bindings. The health check validates the configured HTTPS origin
with normal CA verification, using the explicit local CA only for the original
private origin. Verify sign-in, sign-out, host-only secure cookies, CSRF rejection,
admin/client permissions, Persian RTL and Brotli byte equality on the public
hostname. Preserve a pre-change encrypted backup and saved configuration for
rollback. The old tunnel is no longer required for public access.

## Backups, upgrades and rollback

Generate an age identity on the development computer. Keep its private identity
there and store only the public recipient in `/etc/termspace/backup-recipient`.
Install the supplied systemd backup service/timer; keep seven days locally and
copy encrypted archives off-server. The backup contains a custom-format database
dump, uploads, protected environment and Compose definition.

Before an upgrade:

1. Save the current release checkout and configuration, including image digests.
2. Stop web, API and source/email workers so no writes occur. Keep PostgreSQL running.
3. Run `sh deploy/backup.sh`; copy that exact encrypted archive to the computer.
4. Verify its SHA-256 locally and test decryption. Do not print archived configuration.
5. Set the new tested release digests, then run:

```sh
PRE_MIGRATION_BACKUP=/var/backups/termspace/ARCHIVE.tar.age \
OFFSITE_BACKUP_SHA256=MATCHING_LOCAL_SHA256 sh deploy/release.sh
```

Restore-test by decrypting locally into a protected temporary directory, then
restoring `database.dump` with `pg_restore --exit-on-error` into a disposable
database, never INSIGHT or the live TermSpace database. Verify migrations and
representative rows; remove decrypted temporary files after verification.

For application-only rollback, restore the previous configuration/digests and
start those images without re-running migrations, after confirming schema
compatibility. For incompatible schema rollback, keep writers stopped, restore
the tested pre-migration database/uploads backup, then start previous images.
Migrations are forward-only; never rename applied migrations or run `down -v`.

## Operational checks

Verify API/database health through `/backend/api/health`, catalog availability,
EN/FA rendering, secure host-only cookies, CSRF rejection, limits and restart
recovery. Run database/Redis integration tests only against disposable services.
Inspect failed worker containers and health status: failed batches exit nonzero,
and worker health requires a successful poll within three minutes. Docker logs
are capped at three 10 MB files per container. Real external alerting remains
pending until an owner-provided destination exists.

Install the public local CA certificate (never its private key) at
`/etc/termspace/tls/rootCA.pem`. Install `termspace-health.service` and
`termspace-health.timer` after the first successful backup. The five-minute
check requires healthy containers, verified private HTTPS, root disk below 85%,
at least 384 MiB available memory and an encrypted backup less than 36 hours old.
Failures remain visible in the system journal; this is local monitoring until
an external notification destination is configured. The operator account has
SSH tunnel access but no sudo or Docker-group membership; administration uses
an authenticated root SSH session.
