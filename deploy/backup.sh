#!/bin/sh
set -eu
umask 077
cd /opt/termspace
config=/etc/termspace/preview.env
recipient=$(cat /etc/termspace/backup-recipient)
test -n "$recipient"
mkdir -p /var/backups/termspace
staging=$(mktemp -d /var/backups/termspace/.staging-XXXXXX)
trap 'rm -rf "$staging"' EXIT HUP INT TERM
compose() { docker compose --env-file "$config" -f deploy/compose.yml "$@"; }
compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$staging/database.dump"
ops_image=$(node --input-type=module -e 'import {readConfig} from "./deploy/check-config.mjs";console.log((await readConfig(process.argv[1])).OPS_IMAGE)' "$config")
docker run --rm --network none --read-only --cap-drop ALL --security-opt no-new-privileges:true \
  -v termspace-preview_uploads:/uploads:ro --entrypoint tar "$ops_image" -C /uploads -cf - . > "$staging/uploads.tar"
cp "$config" "$staging/preview.env"
cp deploy/compose.yml "$staging/compose.yml"
archive=/var/backups/termspace/$(date -u +%Y%m%dT%H%M%SZ).tar.age
# Separate commands preserve exit codes: a failed dump or tar must never become
# an apparently successful encrypted backup of incomplete input.
tar -C "$staging" -cf "$staging/archive.tar" database.dump uploads.tar preview.env compose.yml
age -r "$recipient" -o "$archive" "$staging/archive.tar"
test -s "$archive"
find /var/backups/termspace -maxdepth 1 -type f -name '*.tar.age' -mtime +7 -delete
echo "Encrypted backup completed: $archive"
