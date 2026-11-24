
  - 1.20.0: Neues GameMaker-Projekt `gamemaker/Fabelbattler/` als kompletter Quellcode-Port der Engine (Daten 1:1 aus index3d.html, Kampfformeln und Wellencadenz uebernommen, 3D-Feld als 2D-Schlachtansicht). Projekt laedt im ProjectTool 2026.1.187. Kein GameMaker-Android-Export ohne Lizenz/SDK; die APK kommt weiterhin aus dem WebView-Build.

  - 1.20.0: `gamemaker/check_project.py` prüft das Quellprojekt ohne Runtime (Events, Ressourcen, 111 GML-Funktionen, 123/51/18/500).

  - 1.20.0: Das GameMaker-Projekt enthält zusätzlich den vollständigen VFX-Pack (635 Sprites, 48 Ordner) und eine kuratierte GML-Brücke (`scr_vfx.gml`) für Kampf-, Zauber- und End-Effekte.

  - Autonomie (1.20.0): `scripts/idea_scout.py` sammelt kostenlos Ideen aus DuckDuckGo/Wikipedia/GitHub, `scripts/download_budget.py` erlaubt 2 GiB Download pro UTC-Tag ohne Rückfrage, `AUTO_MODEL` schaltet auf freie Modelle um, `scripts/creature_reference.py` lädt Wesenbilder für drehbare 3D-Turntables.

  - Grafik-Pipeline (1.20.0): `creature_reference.py` + `make_turntable.py` erzeugen aus Wikimedia-Bildern 8-Winkel-Atlanten; Prototyp: `creatures/bigfoot/turntable.png`.

  - Release-Sync (1.20.0): Der Integrator merged PRs auch bei der Endmarke (Version bleibt 1.20.0), `download-apk.sh` aktualisiert `1.20.0.apk` bei explizitem CI-Lauf; PR #161 mit Elite/Boss-Intent ist enthalten.

  - Wesen-Atlas (1.20.0): Der Bigfoot-4x2-Atlas ist als drehbares Panel in `index3d.html` nutzbar (Ziehen/Pfeile, 8 Winkel); erreichbar aus Einheiten-Info und Kampf-Fähigkeiten. 3D-Modell, Daten und Version bleiben unverändert.

   - Status-Formen (1.20.0): Der Statusring im 3D-Feld ist formkodiert (Dreieck Schaden, Viereck Kontrolle, Sechseck Verstärkung), die Einheiten-Info zeigt Symbole und eine Legende. Farbblinde Spieler koennen Wirkungen ohne Farbunterscheidung lesen; Daten und Version bleiben unverändert.

   - Nachkampf-Auswertung (1.20.0): Nach Sieg oder Niederlage zeigt ein schliessbares Panel Schaden, Heilung und die staerkste Heldeneinheit der Welle. Die Werte werden pro Kampf aus echten Treffern und Heilungen gesammelt; Draft-Overlays liegen darueber, Headless und Version bleiben unverändert.

   - Hit-Stop (1.20.0): Kritische Treffer und sichtbare Tode halten Animation und Effekte kurz an; Simulationszeit, Cooldowns und Headless-Ergebnisse bleiben unverändert. Normale Schwarm-Mobs lösen keinen Stop aus, Boss-Töde den längsten.

   - Draft-Rollenhinweis (1.20.0): Draft-Karten markieren Wesen, die eine noch fehlende Rolle schließen (grüner Badge und Rahmen). Die Auswahl bleibt bei 2 Gold pro Wesen; Team- und Kampfwerte sind unverändert.
