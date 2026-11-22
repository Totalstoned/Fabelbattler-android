# APP_DEV_STATE

Letztes Update: 2026-11-22

## Engine / Sprache

- **Web/JavaScript** mit **Three.js** (`app/src/main/assets/vendor/three.min.js`), kein TypeScript, kein Build-Step für die Spiellogik.
- Android-Wrapper in **Kotlin** (`MainActivity.kt`); die WebView lädt `file:///android_asset/index3d.html`.
- Kein Godot/Unity aktiv. UE5-Datenexport und C++-Gerüst sind nur vorbereitet (`docs/UNREAL_NOTES.md`).

## Aktueller Stand

- Repo: `/root/fabelbattler/android`, GitHub `Totalstoned/Fabelbattler-android`, Branch `main`.
- Externe Source of Truth: `/root/fabelbattler/index3d.html` – nach Änderungen in die WebView-Datei synchronisieren.
- Aktive App: `app/src/main/assets/index3d.html`.
- Version **1.36**, Build **37**; APK: `/root/projects/FABELBATTLER/fabelbattler-v1.36-b37.apk`.
- Kampf-Logik ist über `simulateBattle(dt)` headless testbar (`SIM.headless` unterdrückt Effekte/UI); der Renderloop nutzt weiterhin `updateBattle`/`updateVisuals`.
- Feste Startbesetzung `CORE_UNITS = ["bigfoot","chupacabra","fee"]` (Tank/DPS/Heiler), erster Kampf 3 gegen 3.
- Mob-Schwarm auf **beiden Seiten**: `MOB_CAP = 500`, 3 Archetypen, Instanced-Mesh-Rendering, Front/Cache-basierte KI. Welle 1: 4 Spieler-Mobs + 5 Gegner-Mobs, ab Welle ~28 je 500.
- Mob-Tiere: `elite` alle 5 Wellen (3,5× HP, 2,2× ATK), `boss` alle 10 Wellen (12× HP, 3,5× ATK, je Seite 1). Bonus-Gold +2 pro Elite, +15 pro Boss.
- Animationen: `poseCharacter()` für Idle/Lauf/Angriff/Treffer/Tod bei allen Einheiten, `attackPulse()` normalisiert die Angriffs-Dauer; Mobs mit Impuls bei Angriff. Kein Engine- oder Sprachwechsel (User: „alles so lassen wie es ist").
- Inhalt: **95 Einheiten, 10 Klassen, 7 Rassen, 50 Zauber**.
- Rassen: Folklore, Kaiju, Fee, Zwerg, **Kryptozoologie**, Assassine, Alien. Barbar-Rasse wurde entfernt.
- Kryptiden-Pack mit 12 Wesen; neue Fähigkeiten `schrecken` (Schreckensblick) und `schwarmruf` (Team-Buff).
- Team-Buffs skalieren nach Anzahl: ein Stack pro weiterem Wesen mit gleicher Klasse/Rasse (max. 4) sowie +4 % HP/ATK pro zusätzlichem Duden ab dem dritten.
- Kampf-Simulation: wellenbasiert, Start 3 Helden + Mobs gegen 3 Helden + Mobs (später 3–6 Helden), Sekunden-Timer, Statuseffekte, Auren, Cooldowns, Zielwahl, Front-basierte Mob-KI.
- UI: Kampfleiste mit Timer, HUD, Draft (3 Karten, Rollen-/Klassenfilter, Synergie-Hinweis, Reroll 1 Gold, Auswahl 2 Gold), Verbrauchsitems (Trank/Schild/Splitter), Heilregen/Blitz, Touch-Fokus, Zoom, Einheiten-Info.
- Fullscreen/Querformat: Manifest + `MainActivity` (Immersive-Sticky plus Legacy-Flags); auf dem Testgerät vom User bestätigt.
- Checks: `scripts/check_js.py`, `scripts/check_data.py`, `scripts/check_runtime.js`; CI baut die APK. Letzter grüner Lauf: `45055518497`.
- Chronologische Übergabe inkl. aller Versionen: `/root/projects/FABELBATTLER/readme.txt` (Kopie: `docs/PROJECT_README.txt`).
- Offen: kein direkter Gerätezugriff in der Entwicklung; Fullscreen-Verhalten nur per User-Screenshot verifiziert.
- Boss-Mobs zeigen in der Kampfleiste einen eigenen Lebensbalken inkl. Prozent (`updateBossBar()`, v1.23); unter 25 % HP pulsiert er rot als kritische Warnung (v1.24). Die Schwarm-Mobs haben keine Einzelbalken.
- Kampfleiste zeigt während des Kampfes live „Gegner N · Helden A/B“ (`updateBattleStatus()`, v1.25); außerhalb des Kampfes ist die Anzeige ausgeblendet.
- Kampfleiste warnt pulsierend vor kritischen Helden (`updateHeroAlert()`, v1.26): zählt lebende Helden mit HP+Schild ≤ 25 % und blendet sich außerhalb des Kampfes aus.
- Kampfleiste zeigt einen Team-HP-Balken (`updateTeamHpBar()`, v1.27): Summe aus HP+Schild aller Helden, gedeckelt pro Held auf max. HP; grün/gelb/rot ab 50/25 %, außerhalb des Kampfes ausgeblendet.
- Kampfleiste zeigt im Kampfstatus die lebenden Schwarm-Mobs beider Seiten als „Mobs Spieler/Gegner“ (`statusMobs`, v1.28); das HUD ist im Kampfmodus ausgeblendet.
- Kampfleiste zeigt im Kampf eine kompakte Mana-Anzeige mit Balken und Wert (`battleMana`, v1.29), da das HUD mit dem Mana-Balken im Kampfmodus ausgeblendet ist; außerhalb des Kampfes ausgeblendet.
- Mob-Schwarm zeigt einen kurzen Treffer-Impuls (`mobHitPulse()`, v1.30): Getroffene Mobs wachsen kurz an und wackeln, damit Treffer im 500er-Schwarm sichtbar bleiben.
- Kampfleiste zeigt die HP inkl. Schild des fokussierten Wesens (`updateFocusHp()`, v1.31): Im Kampfmodus sind HUD und Einheiten-Panel ausgeblendet; die ◀/▶-Fokusnavigation bleibt dadurch mit exakten Werten und Warnfarben lesbar.
- Kampfleiste zeigt zusätzlich Zauber und restliche Abklingzeit des fokussierten Wesens (`updateFocusCooldown()`, v1.32): „bereit" in Grün oder die Restzeit in Sekunden; bei totem Fokus und außerhalb des Kampfes ausgeblendet.
- Kampfstatus trennt seit v1.33 die lebenden gegnerischen Helden (`statusFoeHeroes`) von der Gesamtzahl inkl. Schwarm, damit die Mobs nicht doppelt gezählt wirken.
- Fokus-Anzeige ergänzt seit v1.34 aktive Statuseffekte mit Emoji und Restzeit (`focusStatus`): Buffs/Debuffs des fokussierten Wesens bleiben im Kampfmodus sichtbar, obwohl das Einheiten-Panel ausgeblendet ist.
- Fokus-Anzeige zeigt seit v1.35 live den Namen des fokussierten Wesens (`focusName`): `updateFocusHp()` läuft pro Frame, damit ◀/▶ sofort den richtigen Namen anzeigt und außerhalb des Kampfes zurücksetzt.
- Kampfleiste zeigt seit v1.36 das aktuelle Gold (`updateBattleGold()`): Das HUD ist im Kampfmodus ausgeblendet, daher bleiben Gold-Gewinne durch Gold-auf-Kill-Effekte und der Stand für den kommenden Draft sichtbar; außerhalb des Kampfes ausgeblendet.
- Mob-Schwarm ist umgesetzt (v1.18); der User wollte explizit **beide Seiten** bis 500, nicht nur die Gegnerseite.
- GitHub-Issue #1 ist der Fortschrittskanal für den 10-Minuten-Hintergrund-Agenten.

## Entwicklungsregeln

- Nach jeder App-Änderung `APP_VERSION_CODE` in `gradle.properties` erhöhen und alle drei Checks ausführen.
- Pro Lauf genau ein kleines, abgeschlossenes Ziel; keine Engine-Wechsel ohne Rückfrage.
- Die ersten Core-Loop-Mikro-Schritte stehen in `docs/TASKS.md`.
