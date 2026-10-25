#!/bin/sh
set -eu
cd /opt/termspace
compose() { docker compose --env-file /etc/termspace/preview.env -f deploy/compose.yml "$@"; }
for service in db redis api web source-worker; do
  container=$(compose ps -q "$service")
  test -n "$container" || { echo "Missing service: $service" >&2; exit 1; }
  state=$(docker inspect --format '{{.State.Running}} {{.State.Health.Status}}' "$container")
  test "$state" = 'true healthy' || { echo "Unhealthy service: $service" >&2; exit 1; }
done
origin=$(node --input-type=module -e 'import {readConfig} from "./deploy/check-config.mjs"; console.log((await readConfig("/etc/termspace/preview.env")).WEB_PUBLIC_URL)')
if [ "$origin" = 'https://termspace.localhost:8443' ]; then
  curl --fail --silent --show-error --connect-timeout 5 --max-time 15 \
    --cacert /etc/termspace/tls/rootCA.pem \
    --resolve termspace.localhost:8443:127.0.0.1 \
    "$origin/backend/api/health" >/dev/null
else
  curl --fail --silent --show-error --connect-timeout 5 --max-time 15 \
    "$origin/backend/api/health" >/dev/null
fi
df -Pk / | awk 'NR == 2 { found = 1; if ($5 + 0 >= 85) exit 1 } END { if (!found) exit 1 }' || { echo 'Root disk check failed (threshold 85%)' >&2; exit 1; }
awk '/MemAvailable:/ { found = 1; exit ($2 < 393216) } END { if (!found) exit 1 }' /proc/meminfo || { echo 'Available memory is below 384 MiB' >&2; exit 1; }
test -n "$(find /var/backups/termspace -maxdepth 1 -type f -name '*.tar.age' -mmin -2160 -print -quit)" || {
  echo 'No encrypted backup from the last 36 hours' >&2
  exit 1
}
echo 'TermSpace services, verified HTTPS, disk, memory and backup freshness are healthy'
