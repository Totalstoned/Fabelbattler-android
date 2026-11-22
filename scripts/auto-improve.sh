#!/usr/bin/env bash
# Fabelbattler: alle 10 Minuten eine kleine, isolierte Verbesserung.
# Stopp:  touch /root/projects/FABELBATTLER/auto-improve.stop
# Log:    /root/projects/FABELBATTLER/auto-improve.log
set -uo pipefail

REPO=/root/fabelbattler/android
OUT=/root/projects/FABELBATTLER
LOG="$OUT/auto-improve.log"
STOP="$OUT/auto-improve.stop"
LOCK=/tmp/opencode/fabel-improve.lock
GH_BIN=/tmp/opencode/gh/gh_2.104.0_linux_arm64/bin/gh
GH_REPO=Totalstoned/Fabelbattler-android
INTERVAL=600
MODEL=opencode/big-pickle
ONCE=0
[ "${1:-}" = "once" ] && ONCE=1

mkdir -p "$OUT" /tmp/opencode
if [ -f "$STOP" ]; then
  echo "$(date -u +%FT%TZ) Loop nicht gestartet: Stopp-Datei vorhanden" >> "$LOG"
  exit 0
fi

exec 9>"$LOCK"
if ! flock -n 9; then
  echo "$(date -u +%FT%TZ) Loop läuft bereits, zweiter Start ignoriert" >> "$LOG"
  exit 0
fi

export GH_TOKEN="$(cat /tmp/opencode/gh_token 2>/dev/null || true)"
cd "$REPO" || exit 1

log(){ echo "$(date -u +%FT%TZ) $*" >> "$LOG"; }

run_iteration(){
  local START_TS TS WT BRANCH BASE COMMITS ELAPSED SLEEP_T
  START_TS=$(date +%s)
  TS=$(date -u +%Y%m%d-%H%M%S)
  WT=/tmp/opencode/fabel-improve-$TS
  BRANCH=auto-improve/$TS

  git worktree prune >/dev/null 2>&1
  if ! git worktree add -q -b "$BRANCH" "$WT" main >>"$LOG" 2>&1; then
    log "Worktree konnte nicht angelegt werden – übersprungen"
    return 1
  fi
  BASE=$(cd "$WT" && git rev-parse HEAD)
  log "Run $TS gestartet (Worktree $WT, Basis $BASE)"

  local PROMPT
  PROMPT=$(cat <<'EOF'
Du arbeitest autonom an Fabelbattler. Lies zuerst docs/APP_DEV_STATE.md, docs/TASKS.md und docs/PROJECT_README.txt.

Wähle GENAU EIN kleines, abgeschlossenes Ziel mit klarem Nutzen. Bevorzugt: Darstellung, Animation, Kampf-Feedback, UI-Klarheit, Balance oder Testabdeckung. Behalte den bestehenden Stack (Three.js, JavaScript, Kotlin-WebView) unverändert – keine Engine-, Sprach- oder Dependency-Wechsel, keine großen Umstrukturierungen.

Regeln:
- Ändere nach Möglichkeit app/src/main/assets/index3d.html und bei Bedarf scripts/ oder docs/.
- Bei jeder Änderung an index3d.html: APP_VERSION_CODE in gradle.properties um 1 erhöhen und APP_VERSION_NAME passend aktualisieren (aktuelle Version steht in docs/APP_DEV_STATE.md).
- Validiere mit: python3 scripts/check_js.py app/src/main/assets/index3d.html && python3 scripts/check_data.py app/src/main/assets/index3d.html && node scripts/check_runtime.js app/src/main/assets/index3d.html
- Wenn ein Check fehlschlägt: beheben oder die Änderung verwerfen. Never commit a broken build.
- Bleibe auf dem aktuellen Branch (auto-improve/*). Wechsle NICHT zu main und erstelle keinen neuen Branch.
- Bei einer Änderung an index3d.html: APP_VERSION_CODE in gradle.properties um GENAU 1 erhöhen (nie mehr), ausgehend vom dortigen Wert.
- Erstelle einen Commit mit kurzer deutscher Nachricht. Pushe NICHT und erstelle KEinen PR – das macht das umgebende Skript.
- Falls nichts Sicheres zu tun ist: keine Änderung, kein Commit.

Antworte am Ende mit einer einzeiligen Zusammenfassung: Ziel, Ergebnis, nächster Schritt.
EOF
)

  if timeout 480 opencode run --auto --standalone --archived \
       --model "$MODEL" --title "auto-improve $TS" "$PROMPT" >>"$LOG" 2>&1; then
    log "Agent $TS beendet – validiere erneut"
    if (cd "$WT" && python3 scripts/check_js.py app/src/main/assets/index3d.html \
         && python3 scripts/check_data.py app/src/main/assets/index3d.html \
         && node scripts/check_runtime.js app/src/main/assets/index3d.html) >>"$LOG" 2>&1; then
      COMMITS=$(cd "$WT" && git rev-list --count "$BASE..HEAD" 2>/dev/null || echo 0)
      if [ "$COMMITS" -gt 0 ]; then
        if (cd "$WT" && git -c url."https://x-access-token:${GH_TOKEN}@github.com/".insteadOf=git@github.com: push -q origin "HEAD:$BRANCH") >>"$LOG" 2>&1; then
          local SUBJ
          SUBJ=$(cd "$WT" && git log -1 --pretty=%s)
          if "$GH_BIN" pr create --repo "$GH_REPO" --base main --head "$BRANCH" \
               --title "$SUBJ" --body "Autonomer 10-Minuten-Lauf $TS. Alle Checks im Worktree grün. Bitte prüfen und mergen." >>"$LOG" 2>&1; then
            log "PR für $BRANCH erstellt"
          else
            log "PR für $BRANCH fehlgeschlagen – Branch bleibt gepusht"
          fi
        else
          log "Push von $BRANCH fehlgeschlagen"
        fi
      else
        log "Kein Commit in $TS – nichts zu veröffentlichen"
      fi
    else
      log "Validierung fehlgeschlagen – $BRANCH wird verworfen"
    fi
  else
    log "Agent $TS abgebrochen oder fehlgeschlagen"
  fi

  git worktree remove --force "$WT" >/dev/null 2>&1 || rm -rf "$WT"
  git branch -D "$BRANCH" >/dev/null 2>&1 || true
  git worktree prune >/dev/null 2>&1

  ELAPSED=$(( $(date +%s) - START_TS ))
  SLEEP_T=$(( INTERVAL - ELAPSED ))
  [ "$SLEEP_T" -lt 30 ] && SLEEP_T=30
  log "Run $TS fertig nach ${ELAPSED}s – nächster in ${SLEEP_T}s"
  if [ "$ONCE" -eq 0 ]; then
    # In 30-Sekunden-Schritten schlafen, damit die Stopp-Datei schnell wirkt.
    while [ "$SLEEP_T" -gt 0 ] && [ ! -f "$STOP" ]; do
      sleep $(( SLEEP_T < 30 ? SLEEP_T : 30 ))
      SLEEP_T=$(( SLEEP_T - 30 ))
    done
  fi
}

log "Loop gestartet (Intervall ${INTERVAL}s, Modell $MODEL)"
if [ "$ONCE" -eq 1 ]; then
  run_iteration
else
  while [ ! -f "$STOP" ]; do
    run_iteration
  done
  log "Stopp-Datei erkannt – Loop beendet"
fi
