- [x] **56. Sechs eigene Szenen im Wellenzyklus**: Referenz-Idee „6 Akte" als prozedurale Palette auf dem 18x14-Feld, ohne UI-Änderung, Version 1.20.3.

- [x] **55. Zwergenwesen durch Kaijū und Fabeln ersetzt**: 10 neue Wesen, neue Fabel-Rasse, Checks in beiden Skripten, Version 1.20.2.

- [x] **54. Interface-Größe fixiert**: weder kleiner noch größer – als harte Regel in Automation und Doku; index3d.html unverändert.

- [x] **53. Referenz-Loop und Asset-Bedarf**: Referenz-APK wird jeden Lauf neu analysiert; Bedarfsliste und CC0-Bibliothek (1,1 GiB) liegen bereit; keine Änderung an index3d.html.

- [x] **52. Versionierung fortlaufend**: 1.20.1 ist gesetzt (Code 1201), `bump_version.py` erlaubt 1.20.2, 1.20.3 … bis 1.99.9; Integrator, Loop, Cron und Prompt folgen dem neuen Schema.

- [x] **51. Runden-Vorschau im Prep-HUD**: zeigt Wellenart, Gegnerzahl und Gold vor dem Kampf, deterministisch aus den Kampfregeln abgeleitet und im Kampf ausgeblendet; alle drei Checks grün.


- [x] **49. Elite/Boss-Intent im Fokus-Panel**: next-action telegraph für Elite/Boss (Angriff bereit/Restzeit/blockiert/nähert sich), deterministisch aus attackCd + Reichweite, keine normalen Mobs; alle drei Checks grün.

- [x] **50. Integration und APK-Sync bei der Endmarke**: `auto-integrate.sh` und `download-apk.sh` arbeiten mit fixierter Version 1.20.0; PR #161 eingebaut, CI 45455130556 grün, `1.20.0.apk` mit neuem Stand überschrieben.

- [x] **45. GameMaker-Engine 1.20.0** (Quellcode-Port): `gamemaker/export_data.js` + `build_project.py` erzeugen ein gueltiges `.yyp` mit 6 Skripten, `obj_game` und `Room1`; 111 GML-Funktionen decken Daten, Einheiten, Kampf, Draft, Rendering und Eingabe ab. Alle drei Checks in beiden index3d-Kopien gruen.

- [x] **46. GameMaker-Projekt verifiziert**: `gamemaker/check_project.py` und ProjectTool 2026.1.187 laden das Projekt sauber; Draw-Event korrigiert.

- [x] **47. VFX-Pack in die GameMaker-Engine**: 635 Sprites aus `VFX - Complete Pack.yymps.zip` konvertiert und eingebunden; `check_project.py` und ProjectTool grün.

- [x] **48. Selbstständige Ideenrecherche und 2 GiB-Budget**: Der 10-Minuten-Loop startet jetzt mit `scripts/idea_scout.py --pick` (Web + Git, kostenlos). `scripts/download_budget.py` bucht bis 2 GiB/UTC-Tag ohne Rückfrage; `AUTO_MODEL` erlaubt kostenlose opencode-Modelle; `scripts/creature_reference.py` holt Wesen-Referenzbilder von Wikimedia Commons und bereitet 8-Winkel-Turntables vor. Prompt für die Steuer-App: `docs/KI9000_PROMPT.md`.

- [x] **51. Bigfoot-Atlas drehbar eingebaut**: 4x2-Sheet aus der Wikimedia-Referenz im WebView-Atlas-Panel; Ziehen/Pfeile wechseln 8 Blickwinkel, das prozedurale 3D-Modell bleibt unverändert. Neue Prüfungen in `check_data.py` und `check_runtime.js`, alle drei Checks grün.

- [x] **52. Status-Formen statt nur Farbe**: Statusringe im 3D-Feld unterscheiden Schaden/Kontrolle/Verstärkung durch Dreieck/Viereck/Sechseck; Einheiten-Info mit Symbolen und Legende. Geometriewechsel, Spott und Legende in beiden Checks abgesichert, alle drei Checks grün.

- [x] **53. Nachkampf-Auswertung**: Kompaktes, schließbares Panel mit HP-Schaden, Heilung und Top-Einheit aus pro Welle gesammelten Heldenwerten; kein Einfluss auf Headless, Zufall oder Kampfwerte. Panel, Zählung und Reset in `check_data.py`/`check_runtime.js` geprüft, alle drei Checks grün.

- [x] **54. Visueller Hit-Stop**: Krit und sichtbarer Tod frieren Animation/Effekte für 45–120 ms ein; die Simulation läuft mit realer dt weiter, Headless bleibt unberührt, normale Mobs sind ausgenommen. Trigger, Kappung und Fortsetzung in `check_data.py`/`check_runtime.js` geprüft, alle drei Checks grün.

- [x] **55. Draft zeigt Rollenlücken direkt auf den Karten**: Wesen mit einer im Team fehlenden Rolle erhalten „✓ Lücke: …“ samt grünem Rahmen; die logische Teamwahl wird nicht verändert. Rollenabgleich und gerenderte Badges in `check_runtime.js` geprüft, CSS/Hinweis in `check_data.py`, alle drei Checks grün.
