- 2026-11-25: **Endmarke 1.20.0 aufgehoben** (User-Regel): Versionen laufen weiter 1.20.1 → 1.20.2 → … bis 1.99.9. `scripts/bump_version.py` hat jetzt `LIMIT=(1,99,9)`; `scripts/auto-integrate.sh`, `scripts/auto-improve.sh`, `.github/workflows/autonomous-app.yml` und der KI-9000-Prompt sind auf laufende Bumps umgestellt. Aktuell `APP_VERSION_NAME=1.20.1`, `APP_VERSION_CODE=1201`; der nächste Bump erzeugt 1.20.2. Ältere „Endmarke“-Einträge sind historisch.

- 2026-11-24: **Runden-Vorschau im Prep-HUD** nach dem Vorbild der Rundenkarte aus der `How-Many-Dudes`-Referenz-APK: `nextWavePreview(wave)` leitet Typ (Standard / Elite×N / 👑 Boss), Gegnerzahl und Goldbelohnung aus denselben Regeln wie `mobWaveSize()` und `mobTierFor()` ab. Die Anzeige bleibt im laufenden Kampf ausgeblendet. `check_data.py` und `check_runtime.js` prüfen Vorschau, Elite-/Boss-Hervorhebung und Goldwert; alle drei Checks in beiden index3d-Kopien grün. CI 45506294985 grün, `1.20.0.apk` SHA-256 `2ccbcb7a7e51680c5d200549f95db45a3084837fae8bccb6c2c5ff7bcf4781c1`. Version bleibt 1.20.0 (Endmarke).

- 2026-11-24: **1.20.0 – GameMaker-Engine-Port** in `gamemaker/Fabelbattler/`: 123 Einheiten, 51 Zauber, 18 Gegner-keys, 500er-Mob-Cap und Kampf-/Draft-/Wellenlogik als 111 GML-Funktionen; Daten maschinell aus `index3d.html` exportiert (`gamemaker/export_data.js`). GameMaker-Projekt laedt im ProjectTool; Android-WebView bleibt aktiv. 1.20.0 ist die Endmarke, der Loop bleibt gestoppt.

- 2026-11-24: 1.20.0-Korrektur: Draw-Event jetzt `Draw_0.gml` (eventType 8/eventNum 0); `gamemaker/check_project.py` prüft Ressourcen, Eventdateien, GML-Funktionen und Dateninvarianten.

- 2026-11-24: `VFX - Complete Pack.yymps.zip` importiert: 635 Sprites, 48 Ordner, VERSIONED-konvertiert; `gamemaker/import_vfx.py` + `scr_vfx.gml` verbinden Treffer, Krit, Zauber, Feuer, Wasser, Blitz, Heilung, Schild, Tod, Boss und Sieg/Niederlage mit der Engine. 644 Ressourcen / 118 GML-Funktionen; Headless bleibt unberührt.

- 2026-11-24: Autonomer Ideen-Scout `scripts/idea_scout.py` (DuckDuckGo, Wikipedia, öffentliche GitHub-Suche, keine API-Keys), tägliches Download-Budget 2 GiB via `scripts/download_budget.py`, `AUTO_MODEL` für kostenlose opencode-Modelle und `scripts/creature_reference.py` für Wikimedia-Wesenbilder samt 8-Winkel-Turntable-Prompt eingeführt. KI-9000-Prompt liegt in `docs/KI9000_PROMPT.md`.

- 2026-11-24: `creature-turntable`-Prototyp: Wikimedia-Referenz `bigfoot/reference.jpg` (Public Domain) geladen, Bildgenerierung hatte kein Guthaben, deshalb mit `scripts/make_turntable.py` ein 1024x512-Atlas aus 8 Blickwinkeln erzeugt (`bigfoot/turntable.png`). Einbau in index3d.html ist der nächste Schritt.

- 2026-11-24: `auto-model` ist umgesetzt: `AUTO_MODEL=<id>` in `scripts/auto-improve.sh` erlaubt kostenlose opencode-Modelle, Standard bleibt big-pickle.
