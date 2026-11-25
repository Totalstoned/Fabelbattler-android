   - Automatischer Kampf ab 1.20.6: Es gibt kein Mana und keine Knöpfe mehr für Heilregen, Blitz, Items oder Pause während der Welle. Wesen wählen und aufrüsten darf man nur zwischen den Wellen; Interface-Größe und Kamera unverändert.
   - Flint-Regel ab 1.20.6: Flint speichert APKs nur in `/root/projects/FABELBATTLER/Flint/`, der Hauptagent nur in `/root/projects/FABELBATTLER/`; beide prüfen gegenseitig die APKs des anderen und schreiben das Ergebnis in `docs/APP_DEV_STATE.md` und Issue #1.

   - Relikte ab 1.20.5: Fünf eigene Relikte nach Boss-Wellen (10, 20, …) mit kleinen Team-Boni; Anzeige in Nachkampf-Auswertung, Toast und Wellen-Vorschau, Interface-Größe fix.

  - Bugfix ab 1.20.4: Kampf nach viel Reroll (Auswahl voll, Gold leer) startbar.

  - Szenenwechsel ab 1.20.3: sechs eigene Farbszenen (Feld, Steppe, Ödnis, Höhle, Berg, Arena) im 6-Wellen-Zyklus; Interface-Größe bleibt fix.

  - Roster ab 1.20.2: keine Zwergenwesen mehr; Kaijū-Filmmonster und Märchen-/Sagen/Fabelwesen statt „normaler" Fantasy-Krieger.

  - Interface-Regel: HUD/Dialoge/Buttons behalten feste px-Größe, auch wenn neue Grafiken dazukommen.

  - Referenz-Loop: `scripts/reference_apk.py` schreibt zu jedem Lauf docs/REFERENCE_APK.md; eine Mechanik davon wird auf unsere Einheiten/Map übertragen. Bedarfsliste: docs/ASSET_BEDARF.md. CC0-Assets: /root/projects/FABELBATTLER/asset-library/ (1,1 GiB).

  - Versionierung (ab 1.20.1): keine Endmarke mehr; `bump_version.py` zählt 1.20.1 → 1.20.2 → … → 1.99.9, APK immer `<VERSION>.apk`.

  - 1.20.0: Runden-Vorschau im Prep-HUD (`nextWavePreview`): Standard/Elite/Boss, Gegnerzahl und Gold vor dem Start aus den Kampfregeln berechnet; im Kampf ausgeblendet.


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
