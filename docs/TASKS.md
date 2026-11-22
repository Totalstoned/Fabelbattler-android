# TASKS – Core-Loop, erste 3 Mikro-Schritte

Kleine, einzeln abgeschlossene Schritte. Reihenfolge ist die empfohlene Reihenfolge.

- [x] **1. Kampf-Simulation entkoppeln** (v1.16)
  `simulateBattle(dt)` führt die Kampf-Logik mit `SIM.headless` aus; Effekte, Toasts, HUD, Teamliste, Synergien, Buttons und `syncUnits` werden dabei übersprungen. `updateBattle(dt)` und `updateVisuals(dt)` bleiben für den normalen Renderloop unverändert.
  *Erledigt:* `scripts/check_runtime.js` simuliert fünf Runden à maximal 600 Ticks und prüft, dass Sieg/Niederlage ausgelöst werden und der Headless-Modus danach zurückgesetzt ist.

- [ ] **2. Drei Basis-Einheiten als Startteam**
  Ein festes Basis-Trio definieren: `bigfoot` (Tank), `chupacabra` (DPS), `fee` (Heiler). `beginRun()` soll dieses Trio als Startteam setzen, statt mit leerer Auswahl zu beginnen.
  *Fertig, wenn:* das Trio exakt diese drei Rollen enthält, ein 3-gegen-3-Kampf startbar ist und `check_data.py`/`check_runtime.js` grün sind.

- [ ] **3. Einfacher Shop/Draft mit drei Karten**
  Den vorhandenen Draft auf drei zufällige, verschiedene Karten und einen `Reroll` für 1 Gold erweitern. Die Auswahl bleibt bei 2 Gold pro Wesen; das Gegnerteam wird wie bisher angepasst.
  *Fertig, wenn:* `draftKeys()` stets drei verschiedene Keys liefert, Reroll genau 1 Gold abzieht und die drei Checks plus der APK-Build grün sind.
