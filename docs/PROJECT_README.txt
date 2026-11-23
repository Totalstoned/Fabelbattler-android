FABELBATTLER - PROJEKT-README / UEBERGABE FUER NACHFOLGENDE KI-AGENTEN
Stand: 2026-11-23
Aktuelle Version: v1.37-b38

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
  - CI 45025103386 gruen (nach Test-Fix 5646ba0), SHA-256 5641934b62ab0c0a1adb2572ec3ad27a41ad48c87068e6bdf78b29581a75bd85

v1.19-b20 2026-11-22  (Draft)
  - draftKeys() liefert ueber draftOffer genau 3 verschiedene Karten statt 4.
  - Neuer Button mdReroll: verwirft das Angebot und zieht genau 1 Gold ab.
  - Auswahl weiterhin 2 Gold pro Wesen; Gegnerteam wird wie bisher angepasst.
  - check_runtime.js prueft 3 verschiedene Keys und den Gold-Abzug von genau 1.
  - CI 45030182990 gruen, SHA-256 93ed3c036a8cf6d57c4cde20fb72f41aa5c5c97f80337848610d0fe3cc4b3d93

v1.20-b21 2026-11-22  (Teamauswahl + Items)
  - User-Abfrage: "Filter + Synergie" und "Kampf-Verbrauch" gewaehlt.
  - Draft: Rollen-Chips (Alle/Tank/DPS/Heiler/Puffer), Klassen-Dropdown, Synergie-Hinweis
    mit fehlenden Rollen, aktiven Klassen/Rassen und Duden-Bonus. Filter setzen draftOffer
    zurueck; zu wenige passende Karten -> Fallback auf alle unverwendeten Wesen.
  - Verbrauchsitems: heal (35 % HP des schwaechsten Helden), shield (25 % Schild fuer alle
    Helden), nova (30 % Schaden + Stun auf gegnerischen Helden, sonst Mob).
  - Startbestand 2/1/1; Wellensieg: +1 Trank, +1 Schild in geraden Wellen, +1 Splitter
    in Wellen durch 3. HUD-Pill und Kampfleiste zeigen Bestand.
  - Items wirken bewusst auf Helden, nicht auf Mobs (Hp/Schild-Suche).
  - CI 45034999915 gruen, SHA-256 d8d3074c82605a6b184028d41c96ee20ad37253609089ad89dbe489de9b9d06a

v1.21-b22 2026-11-22  (Elite-/Boss-Mobs)
  - User hat "Elite/Boss-Mobs" als naechsten Schritt gewaehlt.
  - ELITE_EVERY = 5, BOSS_EVERY = 10, MOB_TIERS mit normal/elite/boss.
  - elite: 3,5x HP, 2,2x ATK, 1,7x Groesse, goldfarben, Prefix "Elit-", Emoji ✨.
  - boss: 12x HP, 3,5x ATK, 2,6x Groesse, rot, detailreichere Geometrie, Puls, "Boss-", 👑.
  - mobTierFor() waehlt Tier pro Index; jeder 10. Welle 1 Boss pro Seite, dazu 2+ Eliten.
  - Bonus-Gold: +2 pro Elite, +15 pro Boss; Toast/HUD zeigen Boss-Begegnung.
  - Instanced-Meshes jetzt 2 Seiten x 3 Archetypen x 3 Tier = 18 Meshes (statt 6).
  - check_runtime.js prueft Spawn, Werte, Bonus-Gold, Elite-Welle ohne Boss und Welle 1 ohne Tiere.
  - CI 45036756998 gruen, SHA-256 6ff6c8bfd80a483c3b2ffe7d3b5480d420581050f2f725133b93f54c88c4978e

v1.22-b23 2026-11-22  (Animationen)
  - User will Stack unveraendert lassen; nur Animationen ergaenzen (kein Unity/Godot/TS/C++).
  - poseCharacter(): Idle-Atmen, Laufzyklus aus movement speed (walk), Angriffs-Schwung,
    Treffer-Rueckprallen, Todestaumeln mit Drehung. Humanoid-Arme/-Beine schwingen,
    Monster-Modelle atmen/zucken/kippen.
  - attackPulse(u,dur) normalisiert Dauer: Basis 0,25s, Zauber 0,3s, Mobs 0,18s
    (verhindert negative Schwuenge bei gemischten Dauern).
  - updateMobVisuals(): zusaetzlicher scale/positions/rotations-Impuls bei m.animAttack.
  - userData der Einheiten: model, modelScale, baseYaw, limbs, animPhase, walk.
  - check_runtime.js prueft Funktionen, userData-Felder und Treffer-Reaktion; alle Checks gruen.
  - CI 45038192792 gruen, SHA-256 2742f779625bc5fedc8b994dc1a55100587e9ef551bb5f160cbc574cc0dee60c

v1.23-b24 2026-11-22  0dc39b3  (Boss-Lebensbalken)
  - updateBossBar() blendet einen roten Balken mit Prozentwert in der Kampfleiste ein,
    solange ein gegnerischer Boss lebt.
  - check_runtime.js prueft UI-Tokens und 50 % Anzeige bei halber Boss-HP.

v1.24-b25 2026-11-22  (Kritische Boss-HP)
  - Unter 25 % Boss-HP setzt updateBossBar() die Klasse "critical": rot/oranger Balken
    und pulsierender Prozentwert; beim Boss-Tod werden beide Klassen entfernt.
  - check_runtime.js prueft Normalzustand (50 %), Warnung (20 %) und Ausblenden nach Tod.

v1.25-b26 2026-11-22  (Live-Kampfstatus)
  - Neue Anzeige in der Kampfleiste: "Gegner N · Helden A/B" (id battleStatus),
    updateBattleStatus() zaehlt lebende Gegner (Helden + Mobs) und Helden.
  - Wird wie der Boss-Balken pro Frame aktualisiert und ausserhalb des Kampfes
    ausgeblendet; check_runtime.js prueft Startwert, Tod-Updates und Ausblenden.

v1.26-b27 2026-11-22  (Kritische Helden)
  - Neue pulsierende Warnung in der Kampfleiste (id heroAlert): updateHeroAlert()
    zaehlt lebende Helden mit HP+Schild <= 25 % und zeigt die Anzahl an.
  - Tote Helden zaehlen nicht; ausserhalb des Kampfes ist die Warnung ausgeblendet.
  - check_runtime.js prueft Startzustand, Zaehlung, Schild, Tote und Ausblenden;
    check_data.py prueft die UI-Tokens.

v1.27-b28 2026-11-22  (Team-HP-Balken)
  - Neuer Balken in der Kampfleiste (id teamHpBar): updateTeamHpBar() summiert HP+Schild
    aller Helden (pro Held auf max. HP gedeckelt) und zeigt Prozent an.
  - Farben: gruen, gelb (warn) ab 50 %, rot und pulsierend (critical) ab 25 %.
  - Tote Helden zahlen 0; ausserhalb des Kampfes verschwindet der Balken mit allen Warnklassen.
  - check_runtime.js prueft Start, Schaden, Schild, kritische HP, Tote und Ausblenden;
    check_data.py prueft die UI-Tokens.

v1.28-b29 2026-11-22  (Schwarmzahlen in der Kampfleiste)
  - updateBattleStatus() ergaenzt "Mobs Spieler/Gegner" (id statusMobs) im Kampfstatus.
  - Damit bleibt der Schwarm im Kampfmodus sichtbar, in dem das HUD ausgeblendet ist.
  - check_runtime.js prueft Startwert und Tod eines Gegner-Mobs;
    check_data.py prueft den UI-Token.

v1.29-b30 2026-11-22  (Mana-Anzeige in der Kampfleiste)
   - Im Kampfmodus ist das HUD inklusive Mana-Balken ausgeblendet, obwohl dort die
     mana-kostenden Faehigkeiten "Heilregen" (40) und "Blitz" (70) angeboten werden.
   - Neue kompakte Mana-Anzeige (id battleMana) mit Balken (battleManaFill) und
     Wert (battleManaValue) in der Kampfleiste; updateBattleManaBar() zeigt
     aktuellen Mana/Wert und verbirgt die Anzeige ausserhalb des Kampfes.
   - check_runtime.js prueft Tokens, Ein-/Ausblenden, Startwert, 40/70-Mana und 0;
     check_data.py prueft die UI-Tokens.

v1.30-b31 2026-11-22  (Treffer-Impuls fuer Mobs)
   - Mobs hatten trotz hitFlash keine sichtbare Trefferreaktion (Helden haben einen
     Emissive-Flash). mobHitPulse() skaliert hitFlash/0.15 auf 0..1; getroffene Mobs
     wachsen kurz an und wackeln in updateMobVisuals() (auch bei 500 pro Seite).
   - check_data.py prueft die Tokens; check_runtime.js prueft die Impuls-Skalierung
     und dass sich die Instanz-Matrix eines getroffenen Mobs tatsaechlich aendert.

v1.32-b33 2026-11-22  (Fokus-Zauber-Cooldown)
   - Neben der Fokus-HP (v1.31) zeigt die Kampfleiste jetzt den Zauber des
     fokussierten Wesens: Restzeit in Sekunden oder "bereit" in Gruen.
   - updateFocusCooldown() wird pro Frame aufgerufen; das Einheiten-Panel mit
     cooldownText() ist im Kampfmodus ausgeblendet. Bei totem Fokus und
     ausserhalb des Kampfes verschwindet die Anzeige.
   - check_data.py prueft die UI-Tokens; check_runtime.js prueft Restzeit,
     Bereit-Zustand, toten Fokus und Ausblenden.

v1.33-b34 2026-11-22  (Gegner-Helden im Kampfstatus)
   - updateBattleStatus() zeigt "Gegner N (Helden x/y)", damit die gegnerischen
     Helden im 500er-Schwarm erkennbar sind und Mobs nicht doppelt gezaehlt wirken.
   - check_runtime.js prueft Startwert und Abzug nach einem toten Gegner-Helden;
     check_data.py prueft den UI-Token statusFoeHeroes.

v1.34-b35 2026-11-22  (Fokus-Statuseffekte)
   - Die Fokus-Anzeige in der Kampfleiste zeigt aktive Buffs/Debuffs des
     fokussierten Wesens als Emoji mit Restzeit (id focusStatus).
   - Im Kampfmodus sind HUD und Einheiten-Panel ausgeblendet; Statuseffekte
     waren dort bisher nicht erkennbar. activeStatusKeys() filtert unbekannte
     und abgelaufene Effekte; die Anzeige wird bei Fokuswechsel geleert.
   - check_data.py prueft die Tokens; check_runtime.js prueft Anzeige,
     Filtern unbekannter Effekte und Loschen nach Ablauf/Fokusverlust.

v1.35-b36 2026-11-22  (Fokusname in der Kampfleiste)
   - Neues UI-Element "focusName" direkt neben der Fokus-HP-Anzeige: updateFocusHp()
     zeigt den Namen des per ◀/▶ fokussierten Wesens und setzt ihn außerhalb des
     Kampfes zurück. Bisher aktualisierte nur updateHud() den Fokusnamen im
     battleInfo, was nach der Fokusnavigation veraltet sein konnte.
   - check_runtime.js prueft Namen, cycleFocus(1)-Aktualisierung und Reset;
     check_data.py prueft den UI-Token.
v1.36-b37 2026-11-22  (Gold-Anzeige in der Kampfleiste)
   - Das HUD mit der Gold-Anzeige ist im Kampfmodus ausgeblendet. Neue kompakte Anzeige
     (id battleGold, battleGoldValue) via updateBattleGold(): zeigt den aktuellen Gold-Stand
     waehrend des Kampfes und verschwindet ausserhalb davon. Damit bleiben Gold-Gewinne
     durch Gold-auf-Kill-Effekte und der Stand fuer den kommenden Draft sichtbar.
   - check_data.py prueft die Tokens; check_runtime.js prueft Ein-/Ausblenden,
     Startwert und Live-Updates bei Gold-Aenderungen.
v1.37-b38 2026-11-23  (Gegner-HP-Balken)
   - updateFoeHpBar() zeigt einen roten Balken mit Prozentwert (id foeHpBar)
     fuer die Summe aus HP+Schild der gegnerischen Helden, gedeckelt pro Held
     auf max. HP. Das HUD ist im Kampfmodus ausgeblendet; damit bleibt der
     Fortschritt gegen die feindlichen Helden sichtbar.
   - check_data.py prueft die Tokens; check_runtime.js prueft Startwert,
     Schaden, Schild, tote Helden und Ausblenden.

Automatisierung ab 2026-11-22:
  - User will Verbesserungen alle 10 Minuten; Entscheidung "Beides kombinieren".
  - Details im Abschnitt "Automatisierung ab 2026-11-22 (10-Minuten-Verbesserung)" unten.

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
  [x] 3. Einfacher Shop/Draft mit drei Karten + Reroll fuer 1 Gold (v1.19)
  [x] 4. Mob-Schwarm auf beiden Seiten bis 500 (v1.18)
  [x] 5. Teamauswahl-Filter/Synergie + Kampf-Verbrauchsitems (v1.20)
  [x] 6. Elite-/Boss-Mobs (v1.21)
  [x] 7. Animationen (v1.22)
  [x] 8. Boss-Lebensbalken (v1.23)
  [x] 9. Kritische Boss-HP als Warnung (v1.24)
  [x] 10. Live-Kampfstatus in der Kampfleiste (v1.25)
  [x] 11. Warnung fuer kritische Helden (v1.26)
  [x] 12. Team-HP-Balken in der Kampfleiste (v1.27)
  [x] 13. Schwarmzahlen in der Kampfleiste (v1.28)
  [x] 14. Mana-Anzeige in der Kampfleiste (v1.29)
  [x] 15. Treffer-Impuls fuer Mobs (v1.30)
  [x] 16. Fokus-HP in der Kampfleiste (v1.31)
  [x] 17. Fokus-Zauber-Cooldown in der Kampfleiste (v1.32)
  [x] 18. Gegner-Helden im Kampfstatus (v1.33)
  [x] 19. Statuseffekte des Fokus in der Kampfleiste (v1.34)
  [x] 20. Fokusname live in der Kampfleiste (v1.35)
  [x] 21. Gold-Anzeige in der Kampfleiste (v1.36)
  [x] 22. Gegner-HP-Balken in der Kampfleiste (v1.37)

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

Bewusste Vereinfachungen (spaeter ausbaubar): keine Elite-/Boss-Mobs, keine
einzelnen HP-Balken pro Mob, kein Reserve-Nachschub innerhalb einer Welle,
kein Spatial-Hash fuer Fernkampf-Splash (Hero-Splash nutzt die volle Zielliste).


Automatisierung ab 2026-11-22 (10-Minuten-Verbesserung):
  - User-Entscheidung "Beides kombinieren": lokaler Loop + GitHub-Cron.
  - Lokaler Loop scripts/auto-improve.sh (Intervall 600 s; PID/Aktualisierung
    in AUTO_IMPROVE.txt). Worktree, ein autonomer Lauf, drei Checks, danach PR.
    Stopp-Datei:
    /root/projects/FABELBATTLER/auto-improve.stop. Details AUTO_IMPROVE.txt.
  - Der Loop hat 0dc39b3..a369e3b direkt nach main gepusht (v1.23..v1.31):
    Boss-Balken, kritische Boss-HP, Live-Kampfstatus, kritische Helden,
    Team-HP-Balken, Schwarmzahlen, Mana-Anzeige, Treffer-Impuls.
  - Fix 1a03252: Branch-Erkennung ueber Basis-Commit statt main..HEAD,
    Push auf HEAD:$BRANCH, Prompt verbietet Branch-Wechsel und begrenzt
    Versionsbumpen auf genau +1.
  - GitHub-Cron .github/workflows/autonomous-app.yml: */10 * * * *,
    OpenAI-Projekt-Key als OPENCODE_API_KEY + OPENAI_API_KEY hinterlegt,
    Modell openai/gpt-4o-mini, Action-Fehler behoben.
  - Cloud-Agent blockiert: OpenAI-Konto ohne Guthaben (insufficient_quota).
    Nach Aufladen laeuft der Cron ohne weitere Aenderung.
  - PRs #3-#7 aus dem Loop wurden geprueft, Konflikte mit den vorherigen
    Kampfleisten-Funktionen aufgeloest und als v1.32-b33 bis v1.36-b37
    nacheinander in main integriert (Commit 042f4f0). Jeder PR behielt seinen
    Featureschritt; Versionsnummern wurden fortlaufend korrigiert.
  - CI 45055518497 gruen; APK /root/projects/FABELBATTLER/fabelbattler-v1.36-b37.apk
    SHA-256 88f2bd7bcf1ad5d6e60c0caa7bc9dc03c56d134988b43458411fb718469f8821
  - Externe Quelle /root/fabelbattler/index3d.html synchronisiert; alle drei
    Checks dort und in der WebView-Datei gruen.
