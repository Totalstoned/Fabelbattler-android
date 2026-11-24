# Fabelbattler (Android)

Leichte Three.js-WebView-App mit prozeduralen Creature-Formen und Emojis. Keine externen Assets außer dem lokalen `three.min.js`.

## Aufbau

- Aktive App: `app/src/main/assets/index3d.html`
- Externe Quelle (Source of Truth): `/root/fabelbattler/index3d.html` – nach Änderungen in die WebView-Datei kopieren; beide Kopien müssen per `sha256sum` byte-identisch sein
- WebView lädt `file:///android_asset/index3d.html`
- Version kommt aus `gradle.properties`: `APP_VERSION_CODE` und `APP_VERSION_NAME`

## Develop

Nach jeder App-Änderung:

```bash
python3 scripts/check_js.py app/src/main/assets/index3d.html
python3 scripts/check_data.py app/src/main/assets/index3d.html
node scripts/check_runtime.js app/src/main/assets/index3d.html
# Version in gradle.properties erhöhen, dann committen/pushen
```

`simulateBattle(dt)` nutzt `SIM.headless`, um Kämpfe ohne Effekte, HUD oder Three.js zu simulieren; der Renderloop verwendet weiterhin `updateBattle`/`updateVisuals`.

Die GitHub Action `.github/workflows/build-apk.yml` baut die APK und benennt sie ausschließlich `<VERSION>.apk` (z. B. `1.00.4.apk`, ohne `v`-Präfix und `-b<code>`-Suffix). `scripts/download-apk.sh <run-id>` lädt nur neue Versionen nach `/root/projects/FABELBATTLER/`.

Für Balancing und gezielte Gegner-Szenarien gibt es `scripts/game_harness.js` (headless, ohne Gerät/WebGL):

```bash
node scripts/game_harness.js --enemies oma,feuerwehr,teddy --wave 3 --ticks 1800 --runs 5
node scripts/game_harness.js --team bigfoot,fee --no-mobs --seed 7 --json
```

Optionen: `--team`, `--enemies`, `--wave`, `--level`, `--ticks`, `--runs` (Bilanz mit Siegquote über aufeinanderfolgende Seeds), `--no-mobs`, `--seed`, `--html`, `--json`. Die 18 gegner-exklusiven Wesen sind `oma`, `opa`, `feuerwehr`, `kampftruppe`, `soldat`, `missionar`, `sanitaeter`, `rebelle`, `armee`, `bundeswehr`, `soeldner`, `teddy`, `feuerwehrwagen`, `krankenwagen`, `panzer`, `hubschrauber`, `kampfflugzeug`, `drohne`; ohne `--enemies` wählt das Spiel wie gewohnt zufällig. Der Harness nutzt dieselben DOM-/WebGL-Stubs wie `check_runtime.js` und lässt sich per `require('./scripts/game_harness')` auch aus anderen Skripten aufrufen.

## Bedienung

- Wesen antippen wählt es aus; das Team-Panel zeigt Name, Rolle, Klassen, Rassen, Fähigkeit und Reichweite
- `◀` / `▶` in der Kampfleiste wechselt den Fokus; die Anzeige nennt das aktive Wesen
- Mausrad oder Zwei-Finger-Zoom, Doppelklick oder `0` setzt die Ansicht zurück
- Kampf: Auswahl, nächste Welle, Heilregen, Blitz, Fähigkeit, Vollbild aus
- Draft: drei verschiedene Karten, Rollen-/Klassenfilter und Synergie-Hinweis, Auswahl kostet 2 Gold pro Wesen; Reroll kostet 2, dann 3, dann 4 Gold (danach 4). Runde 1 startet mit der Wahl von 3 Wesen; nach jedem Sieg kommt 1 Wesen dazu (bis 10).
- Verbrauchsitems: Heiltrank (35 % HP für den schwächsten Helden), Schutzrune (25 % Schild für alle), Blitzsplitter (30 % Schaden + Stun). Start 2/1/1, Nachschub nach Wellensieg; HUD-Pill und Kampfleisten-Buttons zeigen den Bestand
- Kampfzeit läuft in Sekunden (Kampfleiste und HUD)
- App startet immer im Querformat und immersive Fullscreen-Modus
- Team-Buffs: ab zwei Wesen mit gleicher Klasse/Rasse gilt ein Stack pro weiterem Duden (max. 4); zusätzlich gibt jeder weitere Dude dem ganzen Team +4 % HP/ATK
- Mob-Schwarm: beide Seiten erhalten Mobs nach `mobWaveSize()`; Welle 1 = 4 Spieler-Mobs + 5 Gegner-Mobs, ab Welle ~28 je 500 (Cap). Mobs werden als `InstancedMesh` gerendert und nutzen einen Front-/Ziel-Cache; das HUD zeigt `Mobs player/enemy`.
- Mob-Tiere: alle 5 Wellen Elite-Mobs (golden, 3,5× HP), alle 10 Wellen ein Boss pro Seite (rot, 12× HP). Elite +2 Gold, Boss +15 Gold.
- Animationen: Helden atmen im Idle, schwingen Arme/Beine beim Laufen, lungern beim Angriff, prallen bei Treffern zurück und stürzen beim Tod. Monster-Modelle atmen/zucken/kippen; instanzierte Mobs pulsieren beim Schlag. `attackPulse()` normalisiert die Dauer (Basis 0,25 s, Zauber 0,3 s, Mob 0,18 s).
- Rassen: Folklore, Kaiju, Fee, Zwerg, Kryptozoologie, Assassine, Alien (die Barbar-Rasse wurde entfernt)

## Automatisierung

- `.github/workflows/autonomous-app.yml` läuft alle 10 Minuten (`*/10 * * * *`) und kommentiert den Fortschritt in Issue #1; zusätzlich läuft lokal `scripts/auto-improve.sh` mit `INTERVAL=600` und integriert CLEAN-PRs per `scripts/auto-integrate.sh`
- Der Agent braucht das GitHub Secret `OPENCODE_API_KEY`; ohne Key wird der Agentenschritt übersprungen
- Issue #1 ist der Fortschrittskanal (`FABEL_PROGRESS_ISSUE=1`)

Weitere Migrationsnotizen: `docs/UNREAL_NOTES.md`.
