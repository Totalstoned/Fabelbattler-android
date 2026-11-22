# TASKS – Core-Loop, erste 3 Mikro-Schritte

Kleine, einzeln abgeschlossene Schritte. Reihenfolge ist die empfohlene Reihenfolge.

- [x] **1. Kampf-Simulation entkoppeln** (v1.16)
  `simulateBattle(dt)` führt die Kampf-Logik mit `SIM.headless` aus; Effekte, Toasts, HUD, Teamliste, Synergien, Buttons und `syncUnits` werden dabei übersprungen. `updateBattle(dt)` und `updateVisuals(dt)` bleiben für den normalen Renderloop unverändert.
  *Erledigt:* `scripts/check_runtime.js` simuliert fünf Runden à maximal 600 Ticks und prüft, dass Sieg/Niederlage ausgelöst werden und der Headless-Modus danach zurückgesetzt ist.

- [x] **2. Drei Basis-Einheiten als Startteam** (v1.17)
  `CORE_UNITS = ["bigfoot","chupacabra","fee"]` setzt in `beginRun()` fest `teamSize = 3` und das Startteam. Der erste Kampf läuft 3 gegen 3; das Draft-Fenster öffnet erst nach dem Sieg.
  *Erledigt:* `check_data.py` prüft die Rollen TANK/DPS/HEALER, `check_runtime.js` prüft Startteam und 3-gegen-3-Kampf.

- [x] **3. Einfacher Shop/Draft mit drei Karten** (v1.19)
  `draftKeys()` liefert über `draftOffer` genau drei verschiedene Karten; der neue Button `mdReroll` verwirft das Angebot für 1 Gold. Die Auswahl kostet weiterhin 2 Gold pro Wesen, das Gegnerteam wird wie bisher angepasst.
  *Erledigt:* `check_runtime.js` prüft drei verschiedene Keys und den Gold-Abzug von genau 1, `check_data.py` prüft die Tokens.

- [x] **4. Mob-Schwarm auf beiden Seiten** (v1.18)
  `MOB_CAP = 500`, 3 Archetypen und wellenbasierte Anzahl auf Spieler- und Gegnerseite. Mobs sind kompakte Einheiten ohne `makeCharacter()` und werden über `THREE.InstancedMesh` gerendert. Die KI nutzt alle 0,2 s einen Front-/Ziel-Cache statt pro Mob sortierter Zielwahl; Helden treffen weiterhin vollwertige ROSTER-Gegner.
  *Erledigt:* `check_data.py` prüft Cap und System-Tokens, `check_runtime.js` spawnt 500/500 Mobs und simuliert 600 Ticks ohne DOM-Fehler. User hat „Beide Seiten“ bestätigt.
