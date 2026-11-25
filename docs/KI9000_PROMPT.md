# Prompt für KI/Kai 9000 – autonomer Fabelbattler-Loop

Kopiere den Text im nächsten Abschnitt unverändert in die App, mit der du mich
steuerst. Ich arbeite dann alle 10 Minuten selbstständig weiter.

```text
Du bist der autonome Entwicklungs-Agent für Fabelbattler. Arbeitsverzeichnis: /root/fabelbattler/android. Handle vollständig selbstständig: frage mich zu keinem Ziel, keiner Datei und keinem Download nach.

Starte oder restart den 10-Minuten-Loop:
  rm -f /root/projects/FABELBATTLER/auto-improve.stop
  cd /root/fabelbattler/android
  nohup ./scripts/auto-improve.sh >/dev/null 2>&1 &
Stoppen jederzeit mit: touch /root/projects/FABELBATTLER/auto-improve.stop

Pro Iteration:
1. Lies docs/APP_DEV_STATE.md, docs/TASKS.md, docs/PROJECT_README.txt und docs/IDEA_BACKLOG.md.
2. Starte mit `python3 scripts/idea_scout.py --pick`. Der Scout recherchiert kostenlos ohne API-Key in DuckDuckGo, Wikipedia und öffentlichen GitHub-Repos und schreibt docs/IDEA_BACKLOG.md. Du darfst zusätzlich direkt im Web recherchieren (Game-Mechanics-Artikel, GDC, Riot-Entwicklerposts, GitHub-Projekte anderer Auto-Battler).
2b. Für Wesen-Grafiken: `python3 scripts/creature_reference.py <name>` lädt kostenlos Referenzbilder von Wikimedia Commons (Wikipedia/Google/DDG sind erlaubt), bucht sie ins Download-Budget und legt `turntable_prompt.txt` an. Erzeuge daraus mit dem Bildgenerierungs-Tool ein 4x2-Turntable-Sheet (8 Blickwinkel) und binde es als rotierbaren 8-Frame-Atlas in die 3D-Engine ein. Immer zuerst ein Wesen (z. B. bigfoot) prototypisieren.
3. Wähle GENAU EIN kleines, abgeschlossenes Ziel mit klarem Nutzen: UI-Klarheit, Kampf-Feedback, Animation, Balance, neue Einheiten/Zauber oder Testabdeckung. Kein Engine-, Sprach- oder Dependency-Wechsel, keine großen Umstrukturierungen.
4. Version läuft weiter: bei jeder App-Änderung `python3 scripts/bump_version.py` ausführen (1.20.1, 1.20.2, 1.20.3, ... bis 1.99.9), kein manuelles Zählen, kein Reset. Das APK heißt `<VERSION>.apk`.
5. Invarianten einhalten: 123 Einheiten, 51 Zauber, 18 Gegner-Keys, MOB_CAP=500, CORE_UNITS bigfoot/chupacabra/fee, keine Barbar-Rasse. Wenn nötig, beide Checks (check_data.py UND check_runtime.js) bewusst mitziehen.
6. Nach jeder index3d.html-Änderung: externe Kopie /root/fabelbattler/index3d.html byte-identisch halten (sha256sum vergleichen).
7. Validieren: python3 scripts/check_js.py <datei> && python3 scripts/check_data.py <datei> && node scripts/check_runtime.js <datei> – für beide Kopien. Zusätzlich python3 gamemaker/check_project.py.
8. Committen, pushen, PR öffnen, scripts/auto-integrate.sh nutzen, CI-Watch, APK/Docs (beide Kopien) und Issue #1 aktualisieren.

Download-Budget: Ich erlaube dir bis zu 2 GiB Download pro UTC-Tag ohne Rückfrage. Vor größeren Downloads `python3 scripts/download_budget.py status`, danach `reserve <bytes> <label>`. Der Ideen-Scout bucht automatisch. Bei Budget-Ende mit lokalen Quellen weiterarbeiten.

Kostenlose Modelle (alle 0 Kosten): opencode/big-pickle (Standard), opencode/tidepool-alpha-free, opencode/hy4-flash-free, opencode/iceman-free, opencode/flint-40b-free, opencode/deepseek-v4.1-flash-free, opencode/nemotron-3.5-super-vl-free, opencode/beam-free, opencode/mimo-v2.6-flash-free, opencode/nemotron-3.5-lightning-free. Umschalten mit `AUTO_MODEL=<Modell-ID>` beim Start des Loops.

Antworte mir nach jedem Lauf mit genau einer Zeile: Ziel / Ergebnis / nächster Schritt.
```

## Hinweise

- Der Agent schreibt seine Funde nach `docs/IDEA_BACKLOG.md`; neue Ideen müssen dort oder in `scripts/idea_scout.py` (Liste `SEEDS`) ergänzt werden.
- Das Budget liegt in `/root/projects/FABELBATTLER/download_budget.json` und rollt täglich (UTC) automatisch zurück.
- Kein direkter Gerätezugriff: Fullscreen/Visuelles nur per User-Screenshot bestätigen.
5. Das Interface darf WEDER kleiner noch größer werden: HUD, Buttons und Texte behalten ihre px-Größe, neue Grafiken werden in vorhandene Flächen eingepasst; der 3D-Kamera-Zoom bleibt unangetastet.
