FABELBATTLER - PROJEKT-README / UEBERGABE FUER NACHFOLGENDE KI-AGENTEN
Stand: 2026-11-22
Letzte gebaute Version: v1.18-b19 (Commit ccf8a65, Test-Fix 5646ba0)

=====================================================================
0) ZUERST LESEN - WICHTIGE REGELN
=====================================================================
- Autorisierte Statusdateien im Repo:
  /root/fabelbattler/android/docs/APP_DEV_STATE.md   (Setup + aktueller Stand)
  /root/fabelbattler/android/docs/TASKS.md           (Core-Loop-Mikro-Schritte)
  Diese Datei ist die chronologische Update-Historie fuer den Projektordner.
- Repo: /root/fabelbattler/android
  GitHub: Totalstoned/Fabelbattler-android, Branch: main
- Aktive Spiellogik: /root/fabelbattler/android/app/src/main/assets/index3d.html
- Externe Source of Truth: /root/fabelbattler/index3d.html
  Nach JEDER Aenderung BEIDE Dateien parallel halten!
- APKs, Screenshots, Videos und diese Datei liegen in /root/projects/FABELBATTLER/
- Nach JEDER App-Aenderung:
  1) APP_VERSION_CODE in gradle.properties erhoehen, APP_VERSION_NAME anpassen
  2) Drei Checks ausfuehren (siehe Abschnitt 3)
  3) Committen und pushen
  4) CI-Lauf abwarten, APK nach /root/projects/FABELBATTLER/ laden
  5) docs/APP_DEV_STATE.md, docs/TASKS.md, Issue #1 und diese readme.txt aktualisieren
- Pro Lauf genau EIN kleines, abgeschlossenes Ziel. Keine Engine-Wechsel ohne Rueckfrage.
- Der User spricht Deutsch. Antworten kurz und auf Deutsch halten.
- Kein direkter Geraetezugriff: Fullscreen/Visuelles wird vom User per Screenshot bestaetigt.
- Fortschrittskanal: GitHub Issue #1 (hourly autonomous agent).
- GitHub-Token: /tmp/opencode/gh_token
  gh-Binary: /tmp/opencode/gh/gh_2.104.0_linux_arm64/bin/gh

=====================================================================
1) SETUP
=====================================================================
Engine/Sprache: Web/JavaScript mit Three.js (lokales three.min.js), kein TypeScript,
kein Build-Step fuer die Spiellogik. Android-Wrapper in Kotlin (MainActivity.kt),
WebView laedt file:///android_asset/index3d.html. Kein Godot/Unity aktiv.
UE5-Datenexport und C++-Geruest sind nur vorbereitet (docs/UNREAL_NOTES.md).

Inhalt aktuell (v1.17): 95 Einheiten, 10 Klassen, 7 Rassen, 50 Zauber.
Rassen: Folklore, Kaiju, Fee, Zwerg, Kryptozoologie, Assassine, Alien.
Die Barbar-Rasse wurde in v1.15 durch Kryptozoologie ersetzt.

Kampf: wellenbasiert, Sekunden-Timer, Statuseffekte, Auren, Cooldowns, Zielwahl.
Team-Buffs skalieren nach Anzahl: 1 Stack pro weiterem Wesen gleicher Klasse/Rasse
(max. 4) plus +4 % HP/ATK pro zusaetzlichem Duden ab dem dritten.
Startteam seit v1.17 fest: bigfoot (TANK), chupacabra (DPS), fee (HEALER), 3 gegen 3.

Fullscreen/Querformat: AndroidManifest.xml (screenOrientation=landscape) plus
MainActivity.kt (Immersive-Sticky + Legacy-Flags). Vom User nach v1.14 bestaetigt.

=====================================================================
2) VERSIONEN / CHANGELOG (chronologisch)
=====================================================================
v1.0-b1   2026-11-18  8d59814/cc70c62
  - Android-WebView-Grundgeruest und Three.js-Szene; APKs werden nach App-Version benannt.

v1.1-b2   2026-11-18  bd0524e
  - Faehigkeitsinfos und visuelle Selektions-Effekte.

v1.2-b3   2026-11-19  8545717
  - 3D-Einheiten per Tap auswaehlbar.

v1.3-b4   2026-11-19  fdff827
  - Kampflesbarkeit verbessert (Hp/Schild/Cooldown, Targeting-Hinweise).

v1.4-b5   2026-11-19  683f262
  - Mobile Fokus-Navigation (◀/▶ in der Kampfleiste).

v1.5-b6   2026-11-19  13a7836
  - 3D-Synergie-Linien zwischen Wesen mit geteilter Klasse/Rasse.

v1.6-b7   2026-11-20  c6c8a35
  - Einheiten-Kollisionen, Taunt und Aura-Buffs.

v1.7-b8   2026-11-20  aa3ec25
  - Kamera-Fokus und Impact-Effekte verbessert.

v1.8-b9   2026-11-21  cd94966
  - Handgezeichnete Outlines und groessenskalierte Einheiten.

v1.9-b10  2026-11-21  f03d4fb / b142233
  - Outline-Rendering gegen Laufzeitfehler gehaertet.

v1.10-b11 2026-11-21  7ea91d5
  - Laufzeitabsturz im Kampf-Loop behoben (vel -> velocities, fill in userData).
  - scripts/check_runtime.js als Headless-Smoke-Test eingefuehrt.

v1.11-b12 2026-11-21  b0a1ee3
  - CSS: Kampfleiste wird im Battle-Mode angezeigt (body.battle-mode .battle-bar).

v1.12-b13 2026-11-21  4a195af
  - Sekunden-Timer (battleTimer/hudTime, updateBattleTimer()).
  - Fullscreen + Querformat eingefuehrt; renderer.setSize(w,h) korrigiert.

v1.13-b14 2026-11-21  08e5924
  - Fullscreen/Querformat-Startup gehaertet.

v1.14-b15 2026-11-22  b4d0c8f
  - Immersive Navigation-Bar wird nach WebView-Attach erneut ausgeblendet.
  - Vom User ausdruecklich als funktionierend bestaetigt.

v1.15-b16 2026-11-22  8e73bce
  - Barbar-Rasse entfernt; Kryptozoologie mit 12 Kryptiden eingebaut.
  - Neue Faehigkeiten: schrecken (Schreckensblick), schwarmruf (Team-Buff).
  - Gestaffelte Team-Buffs nach Duden-Anzahl; Dudes-Badge und Stufenanzeige.
  - Datenstand: 95 Einheiten, 10 Klassen, 7 Rassen, 50 Zauber.
  - CI 44971742650 gruen, SHA-256 8458f16d2627ecccd3f15a691c3bf19ca9308fefcbf75e27a4c5c85cd0a57696

v1.16-b17 2026-11-22  9ce81fa
  - simulateBattle(dt) mit SIM.headless entkoppelt: keine DOM-/Three.js-Seiteneffekte.
  - updateBattle/updateVisuals bleiben unveraendert; check_runtime.js simuliert
    5 Runden a max. 600 Ticks und prueft Sieg/Niederlage.
  - CI 45022914858 gruen, SHA-256 d497fab8a84cf8e006c6cf3908f022997dbf991ae468d8db27ed34fe3e353ebc

v1.17-b18 2026-11-22  2ee95f0
  - CORE_UNITS = ["bigfoot","chupacabra","fee"] als festes Startteam.
  - beginRun() setzt teamSize = 3, erster Kampf 3 gegen 3; Draft erst nach Sieg.
  - check_data.py prueft Rollen TANK/DPS/HEALER, check_runtime.js prueft Startteam
    und 3-gegen-3-Kampf.
  - CI 45023346370 gruen, SHA-256 a2090c625cd4b136b0c8001737c14182ab0bbdfdbd3039fb38449e3745ffa64c

v1.18-b19 2026-11-22  (Mob-Schwarm)
  - User hat entschieden: Mobs auf BEIDEN Seiten, nicht nur gegnerisch.
  - MOB_CAP = 500; mobWaveSize(wave,side) = min(500, 4 + 3*(w-1) + 0.6*(w-1)^2 + enemyBonus).
  - Welle 1: 4 Spieler-Mobs + 5 Gegner-Mobs; ab Welle ~28 je 500 Mobs.
  - 3 Archetypen: kriecher (hp 9), flieger (hp 6), brute (hp 22); Werte skalieren leicht mit der Welle.
  - Mobs sind kompakte Objekte ohne makeCharacter(); Rendern via THREE.InstancedMesh (6 Meshes, alle 3 Frames).
  - Mob-KI nutzt alle 0,2 s einen Front-/Ziel-Cache (max. 40 Ziele) statt pro Mob sortierter Zielwahl.
  - Helden behalten volle ROSTER-/Zauber-/Statuslogik; Sieg/Niederlage prueft beide Seiten inkl. Mobs.
  - HUD-Pill "Mobs player/enemy"; check_data.py prueft Cap/Tokens, check_runtime.js spawnt 500/500 und simuliert 600 Ticks.

Weitere wichtige Commits ohne Versionssprung:
  20870e8 Folklore-Einheiten + prozedurale Modelle
  2a8882b Rassen, Fernkampf-Zauber, Heiler-Reichweite 3
  f93c297 Three.js-Grafik-Polish (Schatten, Glow, Partikel, HP-Balken, Zoom)
  582a122 Stuendlicher autonomer Agent + Issue #1
  7375350 / b873313 / 6d03a9a APK-Downloader (nur neue Versionen, alle behalten)
  275b32c / 2478866 Repo-Dokumentation
  8cc857b APP_DEV_STATE.md + TASKS.md angelegt, erste 3 Mikro-Schritte in Issue #1

Core-Loop-Status:
  [x] 1. Kampf-Simulation entkoppeln (v1.16)
  [x] 2. Drei Basis-Einheiten als Startteam (v1.17)
  [ ] 3. Einfacher Shop/Draft mit drei Karten + Reroll fuer 1 Gold
  [x] 4. Mob-Schwarm auf beiden Seiten bis 500 (v1.18)

=====================================================================
3) BEFEHLE / VALIDIERUNG
=====================================================================
cd /root/fabelbattler/android
python3 scripts/check_js.py app/src/main/assets/index3d.html
python3 scripts/check_data.py app/src/main/assets/index3d.html
node scripts/check_runtime.js app/src/main/assets/index3d.html

# Externe Quelle zusaetzlich pruefen:
python3 scripts/check_js.py /root/fabelbattler/index3d.html
python3 scripts/check_data.py /root/fabelbattler/index3d.html
node scripts/check_runtime.js /root/fabelbattler/index3d.html

# Push + CI + APK:
git add ... && git commit -m "..." && git push
export GH_TOKEN=$(cat /tmp/opencode/gh_token)
/tmp/opencode/gh/gh_2.104.0_linux_arm64/bin/gh run watch <RUN_ID> --exit-status
GH_BIN=/tmp/opencode/gh/gh_2.104.0_linux_arm64/bin/gh bash scripts/download-apk.sh <RUN_ID>
aapt dump badging /root/projects/FABELBATTLER/fabelbattler-v<VERSION>-b<CODE>.apk | grep versionCode

=====================================================================
4) MOB-SCHWARM (umgesetzt in v1.18)
=====================================================================
Der User wollte explizit BEIDE Seiten: bis 500 Mobs auf Spielerseite und bis 500
auf Gegnerseite. Die auswaehlbaren Helden bleiben klein (Start 3); der Rest ist
automatisch generierter Schwarm.

Umgesetzt:
- MOB_CAP = 500, mobWaveSize() mit quadratischem Wachstum und Cap.
  Welle 1 = 4 Spieler-Mobs + 5 Gegner-Mobs, ab Welle ~28 je 500.
- 3 Archetypen: kriecher, flieger, brute. Werte skalieren leicht mit der Welle;
  der Duden-Stack (+4 % pro weiterem Wesen) wirkt auch auf Mobs.
- Mobs sind kompakte Objekte ohne ROSTER/makeCharacter(); 6 THREE.InstancedMesh
  (3 Archetypen x 2 Seiten), Update alle 3 Frames, keine DOM-Labels.
- Mob-KI: alle 0,2 s Front und bis zu 40 Ziele pro Seite cachen; Mobs laufen zur
  gegnerischen Front und schlagen dort auf Ziele. Kein O(n^2) pro Mob.
- Helden behalten volle Zielwahl, Zauber, Statuseffekte und Splash; Sieg/Niederlage
  prueft alle Einheiten beider Seiten inklusive Mobs.
- HUD-Pill "Mobs <spieler>/<gegner>".
- checks: check_data.py prueft MOB_CAP und System-Tokens; check_runtime.js spawnt
  500/500 Mobs, simuliert 600 Ticks headless und prueft Schaden sowie Cap.
  - CI 45025103386 gruen (nach Test-Fix 5646ba0), SHA-256 5641934b62ab0c0a1adb2572ec3ad27a41ad48c87068e6bdf78b29581a75bd85

Bewusste Vereinfachungen (spaeter ausbaubar): keine Elite-/Boss-Mobs, keine
einzelnen HP-Balken pro Mob, kein Reserve-Nachschub innerhalb einer Welle,
kein Spatial-Hash fuer Fernkampf-Splash (Hero-Splash nutzt die volle Zielliste).
