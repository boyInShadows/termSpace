#!/usr/bin/env bash
# Pull-based deployer for the TermSpace VPS. Run by termspace-deploy.timer every 2 minutes.
#
# When origin/main has a commit that is not deployed yet AND every GitHub Actions
# workflow for that commit passed, it: dumps the database, builds api and web,
# applies migrations, restarts the stack, and health-checks it. If the health
# check fails it puts the previous images back. Migrations are forward-only, so a
# rollback restores code, not the database (the pre-deploy dump is logged).
#
#   DRY_RUN=1 deploy.sh   fetch + CI gate only; builds nothing, changes nothing
#
# State: /var/lib/termspace-deploy/{deployed-sha,failed-sha,last-gate}
# To retry a sha that failed to deploy: rm /var/lib/termspace-deploy/failed-sha
#
# The whole script lives in main() so `git checkout` replacing this file while it
# runs cannot corrupt the running copy (bash reads a function body in full first).
set -Eeuo pipefail

REPO_DIR=${REPO_DIR:-/opt/termspace}
GH_REPO=${GH_REPO:-boyInShadows/termSpace}
BRANCH=${BRANCH:-main}
STATE=${STATE:-/var/lib/termspace-deploy}
BACKUPS=${BACKUPS:-/opt/backups}
SERVICES="api web scheduler email-worker marketplace-source-worker"
# Workflow names (the `name:` in .github/workflows/*.yml) that must be green.
REQUIRED_WORKFLOWS="CI|Web e2e and performance"

log() { printf '%s %s\n' "$(date -u +%FT%TZ)" "$*"; }

# Prints ok | pending:<why> | failed:<why> for a commit, from the workflow-runs API.
ci_state() {
  curl -fsS -m 30 -H 'Accept: application/vnd.github+json' \
    "https://api.github.com/repos/$GH_REPO/actions/runs?head_sha=$1&event=push&per_page=50" |
    REQUIRED="$REQUIRED_WORKFLOWS" python3 -c '
import json, os, sys
runs = {}
for r in json.load(sys.stdin)["workflow_runs"]:
    # The API lists newest first; keep the newest run per workflow.
    runs.setdefault(r["name"], r)
bad = []
for name in os.environ["REQUIRED"].split("|"):
    r = runs.get(name)
    if r is None:
        print("pending:no run for %s yet" % name); sys.exit()
    if r["status"] != "completed":
        print("pending:%s is %s" % (name, r["status"])); sys.exit()
    if r["conclusion"] not in ("success", "skipped"):
        bad.append("%s=%s" % (name, r["conclusion"]))
print("failed:" + ", ".join(bad) if bad else "ok")
'
}

healthy() {
  local running svc
  running=$(docker compose ps --status running --services)
  for svc in db redis $SERVICES; do
    grep -qx "$svc" <<<"$running" || { log "  not running: $svc"; return 1; }
  done
  curl -fsS -m 10 http://127.0.0.1:4001/api/health | grep -q '"ok"' || { log "  api health failed"; return 1; }
  curl -fsS -m 10 -o /dev/null http://127.0.0.1:3000/ || { log "  web local failed"; return 1; }
  curl -fsS -m 15 "${WEB_PUBLIC_URL%/}/backend/api/health" | grep -q '"ok"' || { log "  public health failed"; return 1; }
}

wait_healthy() {
  local i
  for i in $(seq 1 24); do
    healthy && return 0
    sleep 5
  done
  return 1
}

rollback() {
  local old=$1 dump=$2 img
  log "ROLLBACK to $old (database NOT reverted; pre-deploy dump: $dump)"
  for img in api web; do
    docker image inspect "termspace-$img:rollback-$old" >/dev/null 2>&1 &&
      docker tag "termspace-$img:rollback-$old" "termspace-$img:latest"
  done
  git checkout -f -B "$BRANCH" "$old" >/dev/null 2>&1 || true
  # --no-deps skips the migrate service: the old image does not know the new migrations.
  docker compose up -d --no-build --no-deps $SERVICES || true
  if wait_healthy; then log "rollback healthy"; else log "ROLLBACK ALSO UNHEALTHY: manual attention needed"; fi
}

main() {
  mkdir -p "$STATE"
  exec 9>"$STATE/lock"
  flock -n 9 || { log "another deploy is running"; exit 0; }

  cd "$REPO_DIR"
  git fetch --quiet origin "$BRANCH"
  local new old short_new dump gate
  new=$(git rev-parse "origin/$BRANCH")
  old=$(git rev-parse HEAD)
  [ "$new" = "$(cat "$STATE/deployed-sha" 2>/dev/null || true)" ] && exit 0
  [ "$new" = "$(cat "$STATE/failed-sha" 2>/dev/null || true)" ] && exit 0

  gate=$(ci_state "$new") || { log "CI lookup failed, will retry"; exit 0; }
  # Log only when the gate result changes, so a 2-minute timer does not flood the journal.
  if [ "$gate" != "$(cat "$STATE/last-gate" 2>/dev/null || true)" ]; then
    log "origin/$BRANCH ${new:0:7}: CI gate $gate"
    printf '%s' "$gate" >"$STATE/last-gate"
  fi
  [ "$gate" = ok ] || exit 0
  if [ "${DRY_RUN:-0}" = 1 ]; then log "DRY_RUN: would deploy ${new:0:7} (running ${old:0:7})"; exit 0; fi

  set -a; . ./.env; set +a
  short_new=${new:0:7}
  log "deploying $short_new (was ${old:0:7})"

  umask 0077
  dump="$BACKUPS/termspace-auto-$(date -u +%Y%m%d-%H%M%S)-$short_new.sql.gz"
  docker compose exec -T db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip >"$dump"
  gzip -t "$dump"
  log "database dump ok: $dump"
  # shellcheck disable=SC2012
  ls -1t "$BACKUPS"/termspace-auto-*.sql.gz | tail -n +11 | xargs -r rm --

  local img
  for img in api web; do
    docker image inspect "termspace-$img:latest" >/dev/null 2>&1 &&
      docker tag "termspace-$img:latest" "termspace-$img:rollback-${old:0:7}"
  done
  old=${old:0:7}

  git checkout -f -B "$BRANCH" "$new" >/dev/null 2>&1
  # Sequential: the box has 4 GB of RAM.
  if docker compose build api && docker compose build web &&
     docker compose up -d db redis migrate api web scheduler email-worker marketplace-source-worker &&
     wait_healthy; then
    printf '%s' "$new" >"$STATE/deployed-sha"
    rm -f "$STATE/failed-sha"
    log "deployed $short_new"
  else
    printf '%s' "$new" >"$STATE/failed-sha"
    rollback "$old" "$dump"
    log "FAILED deploy of $short_new; will not retry this commit (rm $STATE/failed-sha to retry)"
    exit 1
  fi

  # Keep the two newest rollback tags per image; the build cache grows ~1 GB per deploy.
  for img in api web; do
    docker image ls "termspace-$img" --format '{{.Tag}}' | grep '^rollback-' | tail -n +3 |
      xargs -r -I{} docker rmi "termspace-$img:{}" >/dev/null || true
  done
  docker builder prune -f --filter until=72h >/dev/null || true
  docker image prune -f >/dev/null || true
}

main "$@"
exit
