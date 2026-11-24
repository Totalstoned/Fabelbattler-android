#!/usr/bin/env bash
# Fabelbattler: offene PRs automatisch validieren, integrieren und APK nachziehen.
# Wird vom 10-Minuten-Loop (auto-improve.sh) nach jedem Lauf aufgerufen.
# Stopp: touch /root/projects/FABELBATTLER/auto-improve.stop
set -uo pipefail

REPO=/root/fabelbattler/android
OUT=/root/projects/FABELBATTLER
LOG="$OUT/auto-improve.log"
STOP="$OUT/auto-improve.stop"
LOCK=/tmp/opencode/fabel-integrate.lock
GH_BIN=/tmp/opencode/gh/gh_2.104.0_linux_arm64/bin/gh
GH_REPO=Totalstoned/Fabelbattler-android

mkdir -p "$OUT" /tmp/opencode
[ -f "$STOP" ] && exit 0
export GH_TOKEN="$(cat /tmp/opencode/gh_token 2>/dev/null || true)"

exec 9>"$LOCK"
if ! flock -n 9; then
  echo "$(date -u +%FT%TZ) [integrate] läuft bereits" >> "$LOG"
  exit 0
fi

cd "$REPO" || exit 1
log(){ echo "$(date -u +%FT%TZ) [integrate] $*" >> "$LOG"; }

VERSION="$(grep '^APP_VERSION_NAME=' gradle.properties | cut -d= -f2)"
if [ "$VERSION" = "1.20.0" ]; then
  log "Zielversion 1.20.0 erreicht – keine weitere Integration"
  exit 0
fi

if ! git -c url."https://x-access-token:${GH_TOKEN}@github.com/".insteadOf=git@github.com: fetch -q origin main; then
  log "Fetch fehlgeschlagen – Integration übersprungen"
  exit 1
fi

PRS="$($GH_BIN pr list --repo "$GH_REPO" --state open --limit 20 --json number --jq '.[].number' 2>/dev/null || true)"
MERGED=0
for n in $PRS; do
  # Zielversion darf nicht ueberschritten werden
  PV="$($GH_BIN pr view "$n" --repo "$GH_REPO" --json files --jq '.files[] | select(.filename=="gradle.properties") | .patch' 2>/dev/null || true)"
  if printf '%s' "$PV" | grep -q '^[-+]APP_VERSION_NAME=1\.2[1-9]\|^[-+]APP_VERSION_NAME=2\.'; then
    $GH_BIN pr comment "$n" --repo "$GH_REPO" \
      --body "Automatische Integration übersprungen: Zielversion 1.20.0 wäre überschritten." >>"$LOG" 2>&1 || true
    log "PR #$n über 1.20.0 – übersprungen"
    continue
  fi

  WT="/tmp/opencode/fabel-prcheck-$n"
  git worktree remove --force "$WT" >/dev/null 2>&1 || true
  git worktree prune >/dev/null 2>&1
  if ! git fetch -q origin "refs/pull/$n/head:refs/remotes/pr/$n"; then
    log "PR #$n konnte nicht gefetcht werden"
    continue
  fi
  if ! git worktree add -q --detach "$WT" "refs/remotes/pr/$n" >>"$LOG" 2>&1; then
    log "Worktree für PR #$n fehlgeschlagen"
    continue
  fi

  PRVER="$(grep '^APP_VERSION_NAME=' "$WT/gradle.properties" 2>/dev/null | cut -d= -f2)"
  MAINVER="$(grep '^APP_VERSION_NAME=' gradle.properties | cut -d= -f2)"
  if [ -n "$PRVER" ] && [ "$PRVER" != "$MAINVER" ] && \
     [ "$(printf '%s\n%s\n' "$MAINVER" "$PRVER" | sort -V | head -1)" = "$PRVER" ]; then
    $GH_BIN pr comment "$n" --repo "$GH_REPO" \
      --body "Automatische Integration übersprungen: PR-Version $PRVER ist nicht neuer als main ($MAINVER). Bitte auf main rebasen und `scripts/bump_version.py` erneut ausführen." >>"$LOG" 2>&1 || true
    log "PR #$n Version $PRVER <= $MAINVER – zurückgestellt"
    git worktree remove --force "$WT" >/dev/null 2>&1 || rm -rf "$WT"
    continue
  fi

  if (cd "$WT" && python3 scripts/check_js.py app/src/main/assets/index3d.html \
       && python3 scripts/check_data.py app/src/main/assets/index3d.html \
       && node scripts/check_runtime.js app/src/main/assets/index3d.html) >>"$LOG" 2>&1; then
    ST="$($GH_BIN pr view "$n" --repo "$GH_REPO" --json mergeStateStatus --jq .mergeStateStatus 2>/dev/null || true)"
    if [ "$ST" = "CLEAN" ]; then
      if $GH_BIN pr merge "$n" --repo "$GH_REPO" --squash >>"$LOG" 2>&1; then
        log "PR #$n automatisch integriert"
        MERGED=$((MERGED+1))
      else
        log "PR #$n Merge trotz CLEAN fehlgeschlagen"
      fi
    else
      $GH_BIN pr comment "$n" --repo "$GH_REPO" \
        --body "Automatische Integration zurückgestellt: Merge-Status $ST (Konflikt mit main). Bitte als Union auflösen." >>"$LOG" 2>&1 || true
      log "PR #$n Status $ST – zurückgestellt"
    fi
  else
    $GH_BIN pr comment "$n" --repo "$GH_REPO" \
      --body "Automatische Integration zurückgestellt: mind. einer der drei Checks ist rot." >>"$LOG" 2>&1 || true
    log "PR #$n Checks rot – zurückgestellt"
  fi
  git worktree remove --force "$WT" >/dev/null 2>&1 || rm -rf "$WT"
done

if [ "$MERGED" -gt 0 ]; then
  git -c url."https://x-access-token:${GH_TOKEN}@github.com/".insteadOf=git@github.com: fetch -q origin main
  if ! git diff --quiet origin/main -- app/src/main/assets/index3d.html; then
    git show origin/main:app/src/main/assets/index3d.html > /root/fabelbattler/index3d.html
  fi
  if [ -z "$(git status --porcelain)" ]; then
    git reset -q --hard origin/main
    git clean -qfd
  fi
  RUN="$($GH_BIN run list --repo "$GH_REPO" --workflow build-apk.yml --status success --limit 1 --json databaseId --jq '.[0].databaseId' 2>/dev/null || true)"
  if [ -n "$RUN" ]; then
    GH_BIN="$GH_BIN" bash scripts/download-apk.sh "$RUN" >>"$LOG" 2>&1 || log "APK-Download nach PR-Integration fehlgeschlagen"
  fi
  log "$MERGED PR(s) integriert – externe Kopie und APK aktualisiert"
else
  log "Keine integrationfähigen PRs"
fi
