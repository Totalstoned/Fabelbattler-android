  - 1.20.0: Runden-Vorschau im Prep-HUD (`nextWavePreview`): Standard/Elite/Boss, Gegnerzahl und Gold vor dem Start aus den Kampfregeln berechnet; im Kampf ausgeblendet.


  - 1.20.0: Neues GameMaker-Projekt `gamemaker/Fabelbattler/` als kompletter Quellcode-Port der Engine (Daten 1:1 aus index3d.html, Kampfformeln und Wellencadenz uebernommen, 3D-Feld als 2D-Schlachtansicht). Projekt laedt im ProjectTool 2026.1.187. Kein GameMaker-Android-Export ohne Lizenz/SDK; die APK kommt weiterhin aus dem WebView-Build.

  - 1.20.0: `gamemaker/check_project.py` prüft das Quellprojekt ohne Runtime (Events, Ressourcen, 111 GML-Funktionen, 123/51/18/500).

  - 1.20.0: Das GameMaker-Projekt enthält zusätzlich den vollständigen VFX-Pack (635 Sprites, 48 Ordner) und eine kuratierte GML-Brücke (`scr_vfx.gml`) für Kampf-, Zauber- und End-Effekte.

  - Autonomie (1.20.0): `scripts/idea_scout.py` sammelt kostenlos Ideen aus DuckDuckGo/Wikipedia/GitHub, `scripts/download_budget.py` erlaubt 2 GiB Download pro UTC-Tag ohne Rückfrage, `AUTO_MODEL` schaltet auf freie Modelle um, `scripts/creature_reference.py` lädt Wesenbilder für drehbare 3D-Turntables.

  - Grafik-Pipeline (1.20.0): `creature_reference.py` + `make_turntable.py` erzeugen aus Wikimedia-Bildern 8-Winkel-Atlanten; Prototyp: `creatures/bigfoot/turntable.png`.
