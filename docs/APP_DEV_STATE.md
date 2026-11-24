# APP_DEV_STATE

Letztes Update: 2026-11-23

## Engine / Sprache

- **Web/JavaScript** mit **Three.js** (`app/src/main/assets/vendor/three.min.js`), kein TypeScript, kein Build-Step für die Spiellogik.
- Android-Wrapper in **Kotlin** (`MainActivity.kt`); die WebView lädt `file:///android_asset/index3d.html`.
- Kein Godot/Unity aktiv. UE5-Datenexport und C++-Gerüst sind nur vorbereitet (`docs/UNREAL_NOTES.md`).

## Aktueller Stand

- Repo: `/root/fabelbattler/android`, GitHub `Totalstoned/Fabelbattler-android`, Branch `main`.
- Externe Source of Truth: `/root/fabelbattler/index3d.html` – nach Änderungen in die WebView-Datei synchronisieren.
- Aktive App: `app/src/main/assets/index3d.html`.
- Version **1.74**, Build **74**; APK folgt nach CI-Lauf (zuletzt heruntergeladen: `/root/projects/FABELBATTLER/fabelbattler-v1.73-b73.apk`). Signatur fest über `app/debug.p12`.
- Letztes geprüftes APK: `/root/projects/FABELBATTLER/fabelbattler-v1.36-b37.apk`.
- Kampf-Logik ist über `simulateBattle(dt)` headless testbar (`SIM.headless` unterdrückt Effekte/UI); der Renderloop nutzt weiterhin `updateBattle`/`updateVisuals`. `check_runtime.js` prüft seit v1.74 zusätzlich pro Tick, dass Simulation keine Effekte/Partikel/Schockwellen/Toasts erzeugt (inkl. Gegenprobe des Toast-Zählers).
- Feste Startbesetzung `CORE_UNITS = ["bigfoot","chupacabra","fee"]` (Tank/DPS/Heiler), erster Kampf 3 gegen 3.
- Mob-Schwarm auf **beiden Seiten**: `MOB_CAP = 500`, 3 Archetypen, Instanced-Mesh-Rendering, Front/Cache-basierte KI. Welle 1: 4 Spieler-Mobs + 5 Gegner-Mobs, ab Welle ~28 je 500.
- Mob-Tiere: `elite` alle 5 Wellen (3,5× HP, 2,2× ATK), `boss` alle 10 Wellen (12× HP, 3,5× ATK, je Seite 1). Bonus-Gold +2 pro Elite, +15 pro Boss.
- Animationen: `poseCharacter()` für Idle/Lauf/Angriff/Treffer/Tod bei allen Einheiten, `attackPulse()` normalisiert die Angriffs-Dauer; Mobs mit Impuls bei Angriff. Kein Engine- oder Sprachwechsel (User: „alles so lassen wie es ist").
- Inhalt: **113 Einheiten, 10 Klassen, 7 Rassen, 51 Zauber**; davon 18 gegner-exklusive zivile Wesen/Fahrzeuge.
- Rassen: Folklore, Kaiju, Fee, Zwerg, **Kryptozoologie**, Assassine, Alien. Barbar-Rasse wurde entfernt.
- Kryptiden-Pack mit 12 Wesen; neue Fähigkeiten `schrecken` (Schreckensblick) und `schwarmruf` (Team-Buff).
- Team-Buffs skalieren nach Anzahl: ein Stack pro weiterem Wesen mit gleicher Klasse/Rasse (max. 4) sowie +4 % HP/ATK pro zusätzlichem Duden ab dem dritten.
- Kampf-Simulation: wellenbasiert, Start 3 Helden + Mobs gegen 3 Helden + Mobs (später 3–6 Helden), Sekunden-Timer, Statuseffekte, Auren, Cooldowns, Zielwahl, Front-basierte Mob-KI.
- UI: Kampfleiste mit Timer, HUD, Draft (3 Karten, Rollen-/Klassenfilter, Synergie-Hinweis, Reroll 1 Gold, Auswahl 2 Gold), Verbrauchsitems (Trank/Schild/Splitter), Heilregen/Blitz, Touch-Fokus, Zoom, Einheiten-Info.
- Fullscreen/Querformat: Manifest + `MainActivity` (Immersive-Sticky plus Legacy-Flags); auf dem Testgerät vom User bestätigt.
- Checks: `scripts/check_js.py`, `scripts/check_data.py`, `scripts/check_runtime.js`; CI baut die APK. Letzter grüner Lauf: `45207657533` (v1.48-Lauf folgt).
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
- Fokus-Anzeige zeigt seit v1.37 Level und Rolle des fokussierten Wesens (`focusMeta`, `updateFocusMeta()`): Teamliste und Einheiten-Panel sind im Kampfmodus ausgeblendet; die ◀/▶-Navigation bleibt dadurch auch über Stufe und Rolle (Tank/DPS/Heiler/Puffer) lesbar. Bei totem Fokus und außerhalb des Kampfes ausgeblendet.
- Sieg-Feedback ist seit v1.39 ein einziger Zusammenfassungs-Toast: `winBattle()` zeigt Gold-Belohnung (inkl. Boss-/Elite-Bonus), Kampfdauer in Sekunden und überlebende Helden („Helden A/B“). Der zweite, redundante Toast („… gegen … · nächste Welle bereit“) entfällt; `check_runtime.js` prüft genau einen Sieges-Toast mit allen Angaben.
- Niederlage-Feedback ist seit v1.45 ebenfalls ein Zusammenfassungs-Toast: `loseBattle()` zeigt Kampfdauer, überlebende Helden und verbleibende Gegner. Die Werte werden vor `reviveTeam()` und dem Zurücksetzen von `G.battle` ausgelesen; `check_runtime.js` prüft genau einen Toast mit allen Angaben.
- Kampfleiste zeigt seit v1.40 zusätzlich den HP-Balken des eigenen Boss (`updatePlayerBossBar()`, `playerBossBar`): Bosse spawnen auf beiden Seiten, bisher war aber nur der Gegner-Boss sichtbar. Der Balken ist türkis, bei ≤ 25 % HP rot/pulsierend und verschwindet nach dem Tod; beide Balken tragen jetzt die Labels „Gegner“/„Team“.
- Fokus-Anzeige zeigt seit v1.41 den live Angriffswert (`focusAtkValue` in `updateFocusHp()`): Im Kampfmodus sind HUD und Einheiten-Panel ausgeblendet, daher war der ATK-Wert trotz Name/HP/Status/Zauber nicht ablesbar; Buffs wie `killAtk` wirken sofort, bei totem Fokus und außerhalb des Kampfes wird der Wert zurückgesetzt.
- Stirbt der fokussierte Held im Kampf, springt der Fokus seit v1.42 automatisch auf den nächsten lebenden Helden (`killUnit()`), damit Fokus-HP, Zauber-Cooldown und Statuseffekte ohne manuelles Umschalten weiter nutzbar bleiben.
- Fokus-Anzeige zeigt seit v1.45 das aktuelle Ziel des fokussierten Wesens mit Namen, Rest-HP und Schild (`focusTarget`, `updateFocusTarget()`); bei totem Ziel/Fokus und außerhalb des Kampfes ausgeblendet.
- Mana-Anzeige markiert seit v1.37 die Zauber-Bereitschaft (`manaHealReady`/`manaNovaReady`): Während des Kampfes leuchten `✚40` und `✺70` auf, sobald Heilregen (40) bzw. Fabel-Blitz (70) bezahlbar sind. Die Mana regeneriert laufend; die Marker machen den Zeitpunkt des nächsten Zaubers direkt an der Kampfleiste ablesbar. Außerhalb des Kampfes ausgeblendet.
- Kampfleiste zeigt seit v1.37 den aktiven Duden-Bonus (`battleDudes`, `updateBattleDudes()`): +4 % HP/ATK pro Stack aus der Spielerseite; ohne Bonus und außerhalb des Kampfes ausgeblendet.
- Elite- und Boss-Mobs zeigen seit v1.45 Trefferzahlen, Partikel und Schockwellen im 3D-Feld (`hasDamageFx()`); die normalen Schwarm-Mobs bleiben zugunsten der Performance effektfrei.
- Mob-Schwarm ist umgesetzt (v1.18); der User wollte explizit **beide Seiten** bis 500, nicht nur die Gegnerseite.
- Toasts erscheinen seit v1.45 im Kampfmodus oben statt unten (`body.battle-mode .toasts`): Die Kampfleiste mit Timer, Status, Fokus, Mana und Boss-Balken wird dadurch nicht mehr von Wellen-, Tod- und Sieges-Meldungen verdeckt; Toasts sind dort zusätzlich klick-transparent.
- GitHub-Issue #1 ist der Fortschrittskanal für den 15-Minuten-Hintergrund-Agenten.
- UI (v1.74): Kampfleiste und Toasts halbtransparent mit Blur, schmalere Buttons/Balken – mehr freies Schlachtfeld.
- Grafik (v1.73): Steinboden als 220x220-Ebene mit 36x wiederholter Textur, Fog/Hintergrund auf Steinton – der Boden deckt den ganzen Bildschirm ab.
- Grafik (v1.72): prozedurale Steintexturen auf allen 48 Kacheln, sichtbare Plattenkante und warmes Key-Licht; keine Trennlinie.
- Kampffeld (v1.56): keine Trennlinie und keine farblichen Seitenhälften mehr; `buildArena()` erzeugt nur noch den durchgehenden Schachboden mit Eck-Ringen. `moveUnit()` bleibt seitenunabhängig (Clamp auf das ganze GRID), `check_runtime.js` misst die minimale Annäherung (0,99 Felder).
- Kampfleiste (v1.55, PRs #125–#133): Eliten-Zähler `✨ Elite x/y`, blauer Trefferimpuls bei Schildblock, Fokus-Ziel mit Statuseffekten **und** live Angriffswert, Draft-Karten mit Level-Vorschau (Lv/HP/ATK), fokusgeringer Toast-Spam im Kampf, Gold-Gewinn `+N`, Gegner-Stärkebalken inkl. Schwarm (grün ≤ 25 %) und Zähler besiegter Gegner. Alle neuen UI-Tokens werden in `check_data.py` **und** `check_runtime.js` geprüft.
- Support-Cooldown (v1.54): `supportAction()` wird über `u.supportCd` (4 s, in `tickUnit()` dekrementiert) gedrosselt. Vorher schildeten Einheiten mit `shieldPct` (z. B. Stahl-Buff) bei jedem Zyklus statt anzugreifen – Kämpfe endeten nicht. Jetzt greifen sie dazwischen normal an (Harness: 12/12 Siege statt Timeouts).
- Gegner-exklusive Wesen (v1.50–v1.53): 18 zivile Gegner – `oma`, `opa`, `feuerwehr`, `kampftruppe`, `soldat`, `missionar`, `sanitaeter`, `rebelle`, `armee`, `bundeswehr`, `soeldner`, `teddy` sowie die Fahrzeuge `feuerwehrwagen`, `krankenwagen`, `panzer`, `hubschrauber`, `kampfflugzeug`, `drohne`. Einzige Fähigkeit `biss` (einfacher Nahkampf), keine Sonderwirkungen; Fahrzeuge sind erlaubt (User-Entscheid 2026-11-23) und nutzen den vorhandenen `robot`-Mesh. Sie liegen in `ENEMY_ONLY`/`FOE_KEYS`, werden nicht gedraftet; `enemyKeyFor()` wählt seit v1.51 ausschließlich aus diesem Pool – Gegnerteams enthalten keine Monster aus dem Spieler-Roster. Werte skalieren über `createUnit(key,level)`.

## Entwicklungsregeln

- Nach jeder App-Änderung `APP_VERSION_CODE` in `gradle.properties` erhöhen und alle drei Checks ausführen.
- Pro Lauf genau ein kleines, abgeschlossenes Ziel; keine Engine-Wechsel ohne Rückfrage.
- Die ersten Core-Loop-Mikro-Schritte stehen in `docs/TASKS.md`.
