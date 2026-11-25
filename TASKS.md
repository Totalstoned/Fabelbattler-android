- [x] **57. Reroll-Overflow beheben**: Nach viel Reroll mit leerem Goldbudget startet der Kampf wieder; Draft-Start-Button und `startBattle` greifen jetzt auf Gold-Bedarf.

- [x] **56. Sechs eigene Szenen im Wellenzyklus**: Referenz-Idee „6 Akte" als prozedurale Palette auf dem 18x14-Feld, ohne UI-Änderung, Version 1.20.3.

- [x] **55. Zwergenwesen durch Kaijū und Fabeln ersetzt**: 10 neue Wesen, neue Fabel-Rasse, Checks in beiden Skripten, Version 1.20.2.

- [x] **54. Interface-Größe fixiert**: weder kleiner noch größer – als harte Regel in Automation und Doku; index3d.html unverändert.

- [x] **53. Referenz-Loop und Asset-Bedarf**: Referenz-APK wird jeden Lauf neu analysiert; Bedarfsliste und CC0-Bibliothek (1,1 GiB) liegen bereit; keine Änderung an index3d.html.

- [x] **52. Versionierung fortlaufend**: 1.20.1 ist gesetzt (Code 1201), `bump_version.py` erlaubt 1.20.2, 1.20.3 … bis 1.99.9; Integrator, Loop, Cron und Prompt folgen dem neuen Schema.

- [x] **51. Runden-Vorschau im Prep-HUD**: zeigt Wellenart, Gegnerzahl und Gold vor dem Kampf, deterministisch aus den Kampfregeln abgeleitet und im Kampf ausgeblendet; alle drei Checks grün.

- [x] **45. GameMaker-Engine 1.20.0** (Quellcode-Port): `gamemaker/export_data.js` + `build_project.py` erzeugen ein gueltiges `.yyp` mit 6 Skripten, `obj_game` und `Room1`; 111 GML-Funktionen decken Daten, Einheiten, Kampf, Draft, Rendering und Eingabe ab. Alle drei Checks in beiden index3d-Kopien gruen.

- [x] **46. GameMaker-Projekt verifiziert**: `gamemaker/check_project.py` und ProjectTool 2026.1.187 laden das Projekt sauber; Draw-Event korrigiert.

- [x] **47. VFX-Pack in die GameMaker-Engine**: 635 Sprites aus `VFX - Complete Pack.yymps.zip` konvertiert und eingebunden; `check_project.py` und ProjectTool grün.

- [x] **48. Selbstständige Ideenrecherche und 2 GiB-Budget**: Der 10-Minuten-Loop startet jetzt mit `scripts/idea_scout.py --pick` (Web + Git, kostenlos). `scripts/download_budget.py` bucht bis 2 GiB/UTC-Tag ohne Rückfrage; `AUTO_MODEL` erlaubt kostenlose opencode-Modelle; `scripts/creature_reference.py` holt Wesen-Referenzbilder von Wikimedia Commons und bereitet 8-Winkel-Turntables vor. Prompt für die Steuer-App: `docs/KI9000_PROMPT.md`.
