# TASKS – Core-Loop, erste 3 Mikro-Schritte

Kleine, einzeln abgeschlossene Schritte. Reihenfolge ist die empfohlene Reihenfolge.

- [ ] **1. Kampf-Simulation entkoppeln**
  Die KampfLogik aus `updateBattle(dt)` in eine reine Funktion `simulateBattle(dt)` überführen, die ohne DOM und ohne Three.js läuft. Sie soll den bestehenden Zustand `G.battle` nutzen und `updateVisuals` unberührt lassen.
  *Fertig, wenn:* `scripts/check_runtime.js` die Simulation 600 Ticks ohne Fehler durchlaufen lässt und Sieg/Niederlage weiterhin ausgelöst werden.

- [ ] **2. Drei Basis-Einheiten als Startteam**
  Ein festes Basis-Trio definieren: `bigfoot` (Tank), `chupacabra` (DPS), `fee` (Heiler). `beginRun()` soll dieses Trio als Startteam setzen, statt mit leerer Auswahl zu beginnen.
  *Fertig, wenn:* das Trio exakt diese drei Rollen enthält, ein 3-gegen-3-Kampf startbar ist und `check_data.py`/`check_runtime.js` grün sind.

- [ ] **3. Einfacher Shop/Draft mit drei Karten**
  Den vorhandenen Draft auf drei zufällige, verschiedene Karten und einen `Reroll` für 1 Gold erweitern. Die Auswahl bleibt bei 2 Gold pro Wesen; das Gegnerteam wird wie bisher angepasst.
  *Fertig, wenn:* `draftKeys()` stets drei verschiedene Keys liefert, Reroll genau 1 Gold abzieht und die drei Checks plus der APK-Build grün sind.
