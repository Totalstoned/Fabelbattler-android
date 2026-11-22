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

- [x] **5. Teamauswahl-Filter/Synergie + Kampf-Verbrauchsitems** (v1.20)
  Draft mit Rollen-Chips und Klassen-Dropdown (gefiltertes Angebot), Synergie-Hinweis zu fehlenden Rollen, aktiven Klassen/Rassen und Duden-Bonus. Drei Verbrauchsitems: Heiltrank (35 % des schwächsten Helden), Schutzrune (25 % Schild für alle Helden), Blitzsplitter (30 % Schaden + Stun auf gegnerischen Helden, sonst Mob). Startbestand 2/1/1, Nachschub nach Wellensieg (jede Welle Trank, gerade Welle Schild, jede dritte Splitter). HUD-Pill und Kampfleisten-Buttons zeigen Bestand.
  *Erledigt:* `check_runtime.js` prüft Rollen-/Klassenfilter, Synergie-Text, Item-Startbestand und Wirkung aller drei Items; `check_data.py` prüft die UI-Tokens.

- [x] **6. Elite- und Boss-Mobs** (v1.21)
  Alle 5 Wellen erhalten einen Teil der Mobs den Tier `elite` (3,5× HP, 2,2× ATK, 1,7× Größe, goldfarben), alle 10 Wellen zusätzlich einen `boss` pro Seite (12× HP, 3,5× ATK, 2,6× Größe, rot, eigene Geometrie und Puls). `mobTierFor()` bestimmt das Tier pro Index; `MOB_TIERS` enthält die Multiplikatoren. Elite geben +2 Gold, Bosse +15 Gold. Toast/HUD zeigen die Begegnung an.
  *Erledigt:* `check_runtime.js` prüft Spawn auf beiden Seiten, stärkere Boss-Werte, Bonus-Gold, Elite-Welle ohne Boss und dass Welle 1 keine Tiere enthält.

- [x] **4. Mob-Schwarm auf beiden Seiten** (v1.18)
  `MOB_CAP = 500`, 3 Archetypen und wellenbasierte Anzahl auf Spieler- und Gegnerseite. Mobs sind kompakte Einheiten ohne `makeCharacter()` und werden über `THREE.InstancedMesh` gerendert. Die KI nutzt alle 0,2 s einen Front-/Ziel-Cache statt pro Mob sortierter Zielwahl; Helden treffen weiterhin vollwertige ROSTER-Gegner.
  *Erledigt:* `check_data.py` prüft Cap und System-Tokens, `check_runtime.js` spawnt 500/500 Mobs und simuliert 600 Ticks ohne DOM-Fehler. User hat „Beide Seiten“ bestätigt.
