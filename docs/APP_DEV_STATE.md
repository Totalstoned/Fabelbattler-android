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
- Version **1.25**, Build **26**; APK nach CI: `/root/projects/FABELBATTLER/fabelbattler-v1.25-b26.apk`.
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
- Checks: `scripts/check_js.py`, `scripts/check_data.py`, `scripts/check_runtime.js`; CI baut die APK. Letzter grüner Lauf: `45038192792`.
- Chronologische Übergabe inkl. aller Versionen: `/root/projects/FABELBATTLER/readme.txt` (Kopie: `docs/PROJECT_README.txt`).
- Offen: kein direkter Gerätezugriff in der Entwicklung; Fullscreen-Verhalten nur per User-Screenshot verifiziert.
- Boss-Mobs zeigen in der Kampfleiste einen eigenen Lebensbalken inkl. Prozent (`updateBossBar()`, v1.23); unter 25 % HP pulsiert er rot als kritische Warnung (v1.24). Die Schwarm-Mobs haben keine Einzelbalken.
- Da HUD und Mana-Balken im Kampfmodus ausgeblendet sind, zeigt die Kampfleiste seit v1.25 einen kompakten Mana-Balken mit Wert (`battleMana`, `updateManaBar()`); Tooltip nennt die Kosten von Heilregen (40) und Fabel-Blitz (70).
- Mob-Schwarm ist umgesetzt (v1.18); der User wollte explizit **beide Seiten** bis 500, nicht nur die Gegnerseite.
- GitHub-Issue #1 ist der Fortschrittskanal für den stündlichen Hintergrund-Agenten.

## Entwicklungsregeln

- Nach jeder App-Änderung `APP_VERSION_CODE` in `gradle.properties` erhöhen und alle drei Checks ausführen.
- Pro Lauf genau ein kleines, abgeschlossenes Ziel; keine Engine-Wechsel ohne Rückfrage.
- Die ersten Core-Loop-Mikro-Schritte stehen in `docs/TASKS.md`.
