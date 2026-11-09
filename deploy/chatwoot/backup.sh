#!/usr/bin/env bash
set -euo pipefail
umask 077

cd "${CHATWOOT_DIRECTORY:-/opt/termspace/deploy/chatwoot}"
backup_directory="${CHATWOOT_BACKUP_DIRECTORY:-/var/backups/chatwoot}"
mkdir -p "$backup_directory"
chmod 700 "$backup_directory"
exec 9>"$backup_directory/.lock"
flock -n 9 || { echo "Chatwoot backup already running"; exit 0; }

temporary_directory="$(mktemp -d "$backup_directory/.backup-XXXXXX")"
trap 'rm -rf -- "$temporary_directory"' EXIT
docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$temporary_directory/database.dump"
docker compose exec -T rails tar -C /app/storage -czf - . > "$temporary_directory/storage.tgz"
# Read each atomically replaced job file. A completion/prune can remove a file
# during the scan; it is then already delivered and need not be restored.
docker compose exec -T termbuddy node -e '
  const fs = require("node:fs");
  const directory = process.env.STATE_DIRECTORY || "/app/data";
  const records = [];
  for (const name of fs.existsSync(directory) ? fs.readdirSync(directory) : []) {
    if (!/^\d+\.json$/.test(name)) continue;
    try { records.push(JSON.parse(fs.readFileSync(directory + "/" + name, "utf8"))); }
    catch (error) { if (error.code !== "ENOENT") throw error; }
  }
  process.stdout.write(JSON.stringify(records));
' > "$temporary_directory/bot-state.json"
# Stable encryption keys and bot credentials are required for disaster recovery.
cp .env .env.bot docker-compose.yml "$temporary_directory/"
tar -tzf "$temporary_directory/storage.tgz" > /dev/null
(cd "$temporary_directory" && sha256sum database.dump storage.tgz bot-state.json .env .env.bot docker-compose.yml > SHA256SUMS)
snapshot="$backup_directory/$(date -u +%Y%m%dT%H%M%SZ)"
mv "$temporary_directory" "$snapshot"
trap - EXIT
# Only completed snapshots produced by this script are eligible for retention.
find "$backup_directory" -mindepth 2 -maxdepth 2 -type f -name SHA256SUMS -mtime +14 -print0 |
  while IFS= read -r -d '' manifest; do
    snapshot_directory="$(dirname "$manifest")"
    if [[ "$(basename "$snapshot_directory")" =~ ^[0-9]{8}T[0-9]{6}Z$ ]]; then
      rm -rf -- "$snapshot_directory"
    fi
  done
echo "Chatwoot backup completed: $snapshot"
