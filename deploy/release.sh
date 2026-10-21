#!/bin/sh
set -eu
# Files are local, operator-owned configuration; never source or print them.
cd /opt/termspace
config=/etc/termspace/preview.env
node deploy/check-config.mjs "$config"
compose() { docker compose --env-file "$config" -f deploy/compose.yml "$@"; }

# Only immutable digests pass preflight. Pull and check baked configuration before
# migrating or changing running services.
compose config --quiet
compose pull
web_image=$(node --input-type=module -e 'import {readConfig} from "./deploy/check-config.mjs";console.log((await readConfig(process.argv[1])).WEB_IMAGE)' "$config")
expected_origin=$(node --input-type=module -e 'import {readConfig} from "./deploy/check-config.mjs";console.log((await readConfig(process.argv[1])).WEB_PUBLIC_URL)' "$config")
actual_origin=$(docker image inspect --format '{{index .Config.Labels "io.termspace.web-origin"}}' "$web_image")
test "$actual_origin" = "$expected_origin" || { echo 'Web image origin does not match deployment configuration' >&2; exit 1; }
mock=$(docker image inspect --format '{{index .Config.Labels "io.termspace.mock"}}' "$web_image")
test "$mock" = false || { echo 'Image must declare fixtures disabled' >&2; exit 1; }
expected_google=$(node --input-type=module -e 'import {readConfig} from "./deploy/check-config.mjs";console.log((await readConfig(process.argv[1])).GOOGLE_CLIENT_ID || "")' "$config")
actual_google=$(docker image inspect --format '{{index .Config.Labels "io.termspace.google-client-id"}}' "$web_image")
test "$actual_google" = "$expected_google" || { echo 'Rebuild the web image for the configured Google client ID' >&2; exit 1; }

# Do not treat first deployment as a reason to overwrite an existing release.
if docker volume inspect termspace-preview_database >/dev/null 2>&1; then
  case "${PRE_MIGRATION_BACKUP:-}" in
    /var/backups/termspace/*.tar.age) ;;
    *) echo 'Stop application writes, create an encrypted backup and copy it off-server before updating.' >&2; exit 1 ;;
  esac
  test -f "$PRE_MIGRATION_BACKUP"
  backup_hash=$(sha256sum "$PRE_MIGRATION_BACKUP" | cut -d ' ' -f 1)
  test "$backup_hash" = "${OFFSITE_BACKUP_SHA256:-}" || { echo 'Confirm the SHA-256 of the matching off-server backup' >&2; exit 1; }
fi
compose up -d db redis
compose run --rm migrate
compose up -d --no-deps --wait api web source-worker
compose ps --all
echo 'Private preview deployed. Verify HTTPS through the SSH tunnel and preserve the deployed image digests.'
