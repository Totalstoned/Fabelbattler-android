
- 2026-11-24: Elite/Boss-Aktionsanzeige im Fokus-Panel: `focusIntent` zeigt "Angriff bereit in N,N s", "bereit", "nähert sich" oder "blockiert" – nur für Elite/Boss, aus echtem `attackCd` und Reichweite abgeleitet; `check_runtime.js` prüft die neuen Elemente.

- 2026-11-24: **1.20.0 – GameMaker-Engine-Port** in `gamemaker/Fabelbattler/`: 123 Einheiten, 51 Zauber, 18 Gegner-keys, 500er-Mob-Cap und Kampf-/Draft-/Wellenlogik als 111 GML-Funktionen; Daten maschinell aus `index3d.html` exportiert (`gamemaker/export_data.js`). GameMaker-Projekt laedt im ProjectTool; Android-WebView bleibt aktiv. 1.20.0 ist die Endmarke, der Loop bleibt gestoppt.

- 2026-11-24: 1.20.0-Korrektur: Draw-Event jetzt `Draw_0.gml` (eventType 8/eventNum 0); `gamemaker/check_project.py` prüft Ressourcen, Eventdateien, GML-Funktionen und Dateninvarianten.

- 2026-11-24: `VFX - Complete Pack.yymps.zip` importiert: 635 Sprites, 48 Ordner, VERSIONED-konvertiert; `gamemaker/import_vfx.py` + `scr_vfx.gml` verbinden Treffer, Krit, Zauber, Feuer, Wasser, Blitz, Heilung, Schild, Tod, Boss und Sieg/Niederlage mit der Engine. 644 Ressourcen / 118 GML-Funktionen; Headless bleibt unberührt.

- 2026-11-24: Autonomer Ideen-Scout `scripts/idea_scout.py` (DuckDuckGo, Wikipedia, öffentliche GitHub-Suche, keine API-Keys), tägliches Download-Budget 2 GiB via `scripts/download_budget.py`, `AUTO_MODEL` für kostenlose opencode-Modelle und `scripts/creature_reference.py` für Wikimedia-Wesenbilder samt 8-Winkel-Turntable-Prompt eingeführt. KI-9000-Prompt liegt in `docs/KI9000_PROMPT.md`.

- 2026-11-24: `creature-turntable`-Prototyp: Wikimedia-Referenz `bigfoot/reference.jpg` (Public Domain) geladen, Bildgenerierung hatte kein Guthaben, deshalb mit `scripts/make_turntable.py` ein 1024x512-Atlas aus 8 Blickwinkeln erzeugt (`bigfoot/turntable.png`). Einbau in index3d.html ist der nächste Schritt.

- 2026-11-24: `auto-model` ist umgesetzt: `AUTO_MODEL=<id>` in `scripts/auto-improve.sh` erlaubt kostenlose opencode-Modelle, Standard bleibt big-pickle.

- 2026-11-24: `auto-integrate.sh` integriert PRs jetzt auch bei der fixierten Endmarke 1.20.0 (Version bleibt 1.20.0, APK weiterhin `1.20.0.apk`); gestoppt wird nur bei Versionen über 1.20.0. Vorher blieben PRs nach Erreichen der Endmarke liegen.
