# Fabelbattler (Android)

Leichte Three.js-WebView-App mit prozeduralen Creature-Formen und Emojis. Keine externen Assets außer dem lokalen `three.min.js`.

## Aufbau

- Aktive App: `app/src/main/assets/index3d.html`
- Externe Quelle (Source of Truth): `/root/fabelbattler/index3d.html` – nach Änderungen in die WebView-Datei kopieren
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

Die GitHub Action `.github/workflows/build-apk.yml` baut die APK und benennt sie `fabelbattler-v<name>-b<code>.apk`. `scripts/download-apk.sh <run-id>` lädt nur neue Versionen nach `/root/projects/FABELBATTLER/`.

## Bedienung

- Wesen antippen wählt es aus; das Team-Panel zeigt Name, Rolle, Klassen, Rassen, Fähigkeit und Reichweite
- `◀` / `▶` in der Kampfleiste wechselt den Fokus; die Anzeige nennt das aktive Wesen
- Mausrad oder Zwei-Finger-Zoom, Doppelklick oder `0` setzt die Ansicht zurück
- Kampf: Auswahl, nächste Welle, Heilregen, Blitz, Fähigkeit, Vollbild aus
- Draft: drei verschiedene Karten, Rollen-/Klassenfilter und Synergie-Hinweis, `Reroll 1 Gold`, Auswahl kostet 2 Gold pro Wesen
- Verbrauchsitems: Heiltrank (35 % HP für den schwächsten Helden), Schutzrune (25 % Schild für alle), Blitzsplitter (30 % Schaden + Stun). Start 2/1/1, Nachschub nach Wellensieg; HUD-Pill und Kampfleisten-Buttons zeigen den Bestand
- Kampfzeit läuft in Sekunden (Kampfleiste und HUD)
- App startet immer im Querformat und immersive Fullscreen-Modus
- Team-Buffs: ab zwei Wesen mit gleicher Klasse/Rasse gilt ein Stack pro weiterem Duden (max. 4); zusätzlich gibt jeder weitere Dude dem ganzen Team +4 % HP/ATK
- Mob-Schwarm: beide Seiten erhalten Mobs nach `mobWaveSize()`; Welle 1 = 4 Spieler-Mobs + 5 Gegner-Mobs, ab Welle ~28 je 500 (Cap). Mobs werden als `InstancedMesh` gerendert und nutzen einen Front-/Ziel-Cache; das HUD zeigt `Mobs player/enemy`.
- Mob-Tiere: alle 5 Wellen Elite-Mobs (golden, 3,5× HP), alle 10 Wellen ein Boss pro Seite (rot, 12× HP). Elite +2 Gold, Boss +15 Gold.
- Animationen: Helden atmen im Idle, schwingen Arme/Beine beim Laufen, lungern beim Angriff, prallen bei Treffern zurück und stürzen beim Tod. Monster-Modelle atmen/zucken/kippen; instanzierte Mobs pulsieren beim Schlag. `attackPulse()` normalisiert die Dauer (Basis 0,25 s, Zauber 0,3 s, Mob 0,18 s).
- Rassen: Folklore, Kaiju, Fee, Zwerg, Kryptozoologie, Assassine, Alien (die Barbar-Rasse wurde entfernt)

## Automatisierung

- `.github/workflows/autonomous-app.yml` läuft stündlich und kommentiert den Fortschritt in Issue #1
- Der Agent braucht das GitHub Secret `OPENCODE_API_KEY`; ohne Key wird der Agentenschritt übersprungen
- Issue #1 ist der Fortschrittskanal (`FABEL_PROGRESS_ISSUE=1`)

Weitere Migrationsnotizen: `docs/UNREAL_NOTES.md`.
