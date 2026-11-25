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
# Kostenlose Modelle (alle cost=0). Standard bleibt der bewährte Big Pickle;
# mit AUTO_MODEL=<id> kann der User ein anderes freies Modell waehlen.
#   opencode/big-pickle, opencode/tidepool-alpha-free, opencode/hy4-flash-free,
#   opencode/iceman-free, opencode/flint-40b-free, opencode/deepseek-v4.1-flash-free,
#   opencode/nemotron-3.5-super-vl-free, opencode/beam-free,
#   opencode/mimo-v2.6-flash-free, opencode/nemotron-3.5-lightning-free
MODEL="${AUTO_MODEL:-opencode/big-pickle}"
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

  # Referenz-APK immer neu auslesen (lokal, kein Netz, kein Asset-Kopieren).
  # Schreibt in den Worktree, damit der Hauptcheckout sauber bleibt.
  python3 "$WT/scripts/reference_apk.py" >>"$LOG" 2>&1 || \
    log "Referenz-APK nicht lesbar – Lauf ohne Referenz fortsetzen"

  local PROMPT
  PROMPT=$(cat <<'EOF'
Du arbeitest autonom an Fabelbattler. Lies zuerst docs/APP_DEV_STATE.md, docs/TASKS.md, docs/PROJECT_README.txt, docs/IDEA_BACKLOG.md, docs/REFERENCE_APK.md und docs/ASSET_BEDARF.md.

Die Referenz-APK wurde zu Beginn dieses Laufs neu ausgelesen: docs/REFERENCE_APK.md beschreibt ihre Mechaniken (Runden-Vorschau, Relikte, Trinkets, 6 Akte, Tier-Mutatoren, Scoreboard). Waehle daraus GENAU EINE kleine Mechanik und uebertrage sie auf UNSERE 123 Einheiten, 51 Zauber, 18 Gegner und unser 18x14-Feld. Kopiere NIEMALS Grafiken, Texte oder Namen der Referenz – nur die Idee. Wenn eine Grafik noetig ist, nutze die CC0-Bibliothek in /root/projects/FABELBATTLER/asset-library und dokumentiere die Quelle in docs/ASSET_SOURCES.md.

STARTE JEDE ITERATION mit `python3 scripts/idea_scout.py --pick`. Der Scout durchsucht kostenlos (ohne API-Key) DuckDuckGo, Wikipedia und öffentliche GitHub-Repos und schreibt docs/IDEA_BACKLOG.md. `python3 scripts/idea_scout.py` schreibt den vollen Scan. Für Wesen-Grafiken: `python3 scripts/creature_reference.py <name>` lädt kostenlos Referenzbilder von Wikimedia Commons (Wikipedia/Google/DDG erlaubt), bucht sie ins Budget und legt turntable_prompt.txt an; daraus mit dem Bildgenerierungs-Tool ein 4x2-Turntable (8 Blickwinkel) machen und als rotierbaren Atlas in index3d.html einbauen. Zuerst ein Wesen (bigfoot) prototypeieren. Du darfst zusaetzlich direkt im Web recherchieren (z. B. game-mechanics, GDC, Riot-Entwicklerartikel, GitHub-Repos anderer Auto-Battler), aber entscheide IMMER selbst – frage den User NICHT nach Zielen oder Dateien.

HARTE REGEL: Das Interface darf WEDER kleiner noch groesser werden. HUD, Buttons, Dialoge und Texte behalten ihre px-Groesse; keine Aenderung an font-size, padding, max-width oder transform:scale von UI-Elementen, keine neuen vw/vh-Regeln fuer das HUD. Neue Grafiken werden in die vorhandenen UI-Flaechen eingepasst. Der 3D-Kamera-Zoom bleibt unangetastet (er betrifft nur die Szene, nicht das Interface).

Wähle GENAU EIN kleines, abgeschlossenes Ziel mit klarem Nutzen. Bevorzugt: Darstellung, Animation, Kampf-Feedback, UI-Klarheit, Balance, neue Einheiten/Zauber oder Testabdeckung. Behalte den bestehenden Stack (Three.js, JavaScript, Kotlin-WebView) unverändert – keine Engine-, Sprach- oder Dependency-Wechsel, keine großen Umstrukturierungen. Neue Einheiten duerfen ergaenzt werden, aber die festen Invarianten in scripts/check_data.py und scripts/check_runtime.js (u. a. 123 Einheiten, 51 Zauber, 18 Gegner-Keys, MOB_CAP=500, CORE_UNITS, keine Barbar-Rasse) muessen entweder eingehalten oder in BEIDEN Checks bewusst mitgezogen werden.

Regeln:
- Ändere nach Möglichkeit app/src/main/assets/index3d.html und bei Bedarf scripts/ oder docs/.
- Version läuft weiter: bei jeder App-Änderung `python3 scripts/bump_version.py` ausführen (1.20.1, 1.20.2, ... bis 1.99.9; VersionCode = major*1000+minor*10+patch). Nicht manuell zählen, kein Reset. Die APK heißt `<VERSION>.apk`.
- Parallel arbeitet Flint am selben Projekt: Flint legt seine APKs IMMER nach `/root/projects/FABELBATTLER/Flint/<VERSION>.apk`, du legst deine direkt nach `/root/projects/FABELBATTLER/`. Beide Speicherorte sind strikt getrennt – nie im gleichen Ordner ablegen. Ihr entwickelt bewusst getrennt mit eigenen Regeln; APKs und Stände dürfen abweichen, es gibt keinen Sync-Zwang. Keine fremde Datei überschreiben; vor dem Bump nur prüfen, dass die Nummer im jeweils anderen Ordner nicht schon vergeben ist (keine doppelte Nummer). Der User merged euch gelegentlich selbst. Prüfe Flints APKs (drei Checks auf beiden index3d-Kopien + `python3 gamemaker/check_project.py`, Dateiname/Signatur/Version) und Flint prüft deine; Befund kurz in `docs/APP_DEV_STATE.md` und Issue #1, aber nicht still in die fremde Linie eingreifen.
- Download-Budget: Du darfst pro UTC-Tag bis zu 2 GiB herunterladen, ohne mich zu fragen. Vor groesseren Downloads `python3 scripts/download_budget.py status` pruefen und danach `reserve <bytes> <label>` buchen; `scripts/idea_scout.py` bucht seine Web-/Git-Abfragen automatisch. Bei Ueberschreitung mit lokalen Quellen weiterarbeiten und den Grund in docs/IDEA_BACKLOG.md notieren.
- Validiere mit: python3 scripts/check_js.py app/src/main/assets/index3d.html && python3 scripts/check_data.py app/src/main/assets/index3d.html && node scripts/check_runtime.js app/src/main/assets/index3d.html
- Wenn ein Check fehlschlägt: beheben oder die Änderung verwerfen. Never commit a broken build.
- Bleibe auf dem aktuellen Branch (auto-improve/*). Wechsle NICHT zu main und erstelle keinen neuen Branch.
- Erstelle einen Commit mit kurzer deutscher Nachricht. Pushe NICHT und erstelle KEinen PR – das macht das umgebende Skript.
- Falls nichts Sicheres zu tun ist: keine Änderung, kein Commit.

Antworte am Ende mit einer einzeiligen Zusammenfassung: Ziel, Ergebnis, nächster Schritt.
EOF
)
  local OPEN_PRS
  OPEN_PRS=$("$GH_BIN" pr list --repo "$GH_REPO" --state open --limit 50 \
      --json number,title --jq '.[] | "#\(.number) \(.title)"' 2>/dev/null || true)
  if [ -n "$OPEN_PRS" ]; then
    PROMPT="$PROMPT

Offene PRs – waehle KEINES dieser Ziele erneut, sonst entstehen Duplikate:
$OPEN_PRS"
  fi

  PROMPT="$PROMPT

WICHTIG – Arbeitsverzeichnis: $WT
Nutze fuer JEDE Datei-, Shell- und Git-Operation ausschliesslich $WT als workdir/Pfad.
Verwende NIE workdir: /root/fabelbattler/android und keine absoluten Pfade in den Hauptcheckout.
Der Hauptcheckout /root/fabelbattler/android ist tabu und darf nicht veraendert werden."

  if timeout 480 opencode run --auto --standalone --archived \
       --model "$MODEL" --title "auto-improve $TS" "$PROMPT" >>"$LOG" 2>&1; then
    if [ -n "$(git status --porcelain)" ]; then
      log "WARNUNG: Hauptcheckout wurde veraendert – Aenderungen werden verworfen"
      git checkout -- . >/dev/null 2>&1
      git clean -fd >/dev/null 2>&1
    fi
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
               --title "$SUBJ" --body "Autonomer 10-Minuten-Lauf $TS. Alle Checks im Worktree grün; automatische Integration durch den Loop." >>"$LOG" 2>&1; then
            log "PR für $BRANCH erstellt"
            bash scripts/auto-integrate.sh >>"$LOG" 2>&1 || log "Auto-Integration fehlgeschlagen"
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
    if [ -n "$(git status --porcelain)" ]; then
      log "WARNUNG: Hauptcheckout wurde veraendert – Aenderungen werden verworfen"
      git checkout -- . >/dev/null 2>&1
      git clean -fd >/dev/null 2>&1
    fi
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
