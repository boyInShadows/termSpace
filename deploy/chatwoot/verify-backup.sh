#!/usr/bin/env bash
set -euo pipefail
umask 077

snapshot="$(realpath "${1:?Usage: verify-backup.sh /var/backups/chatwoot/SNAPSHOT}")"
(cd "$snapshot" && sha256sum --check --status SHA256SUMS)
tar -tzf "$snapshot/storage.tgz" > /dev/null
cd "${CHATWOOT_DIRECTORY:-/opt/termspace/deploy/chatwoot}"
if [[ -f "$snapshot/bot-state.json" ]]; then
  docker compose exec -T termbuddy node --input-type=module -e '
    import fs from "node:fs";
    import os from "node:os";
    import path from "node:path";
    import { Queue } from "./queue.mjs";
    const records = JSON.parse(fs.readFileSync(0, "utf8"));
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "termbuddy-restore-"));
    try {
      for (const record of records) {
        if (!Number.isSafeInteger(record.id) || record.id < 1) throw new Error("invalid_backup_job");
        fs.writeFileSync(path.join(directory, record.id + ".json"), JSON.stringify(record));
      }
      const queue = new Queue(directory);
      if (queue.stats().pending !== records.filter(record => record.status === "pending").length) {
        throw new Error("queue_restore_mismatch");
      }
      console.log("Termbuddy queue restore verified");
    } finally { fs.rmSync(directory, { recursive: true, force: true }); }
  ' < "$snapshot/bot-state.json"
fi
restore_database="chatwoot_restorecheck_$(date -u +%Y%m%d%H%M%S)_$$"
docker compose exec -T postgres sh -c 'createdb -U "$POSTGRES_USER" -T template0 "$1"' sh "$restore_database"
cleanup() {
  docker compose exec -T postgres sh -c 'dropdb -U "$POSTGRES_USER" "$1"' sh "$restore_database"
}
trap cleanup EXIT
docker compose exec -T postgres sh -c 'pg_restore -U "$POSTGRES_USER" --dbname "$1" --exit-on-error --no-owner --no-acl' sh "$restore_database" < "$snapshot/database.dump"
table_count="$(docker compose exec -T postgres sh -c 'psql -U "$POSTGRES_USER" -d "$1" -Atc "SELECT count(*) FROM pg_catalog.pg_tables WHERE schemaname = '\''public'\''"' sh "$restore_database")"
[[ "$table_count" =~ ^[0-9]+$ ]] && (( table_count > 20 ))
echo "Chatwoot restore verified: $table_count public tables; storage archive and checksums valid"
