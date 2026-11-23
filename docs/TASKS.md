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

- [x] **7. Animationen** (v1.22)
  Stack bleibt unverändert (Three.js, JavaScript, WebView). Neues `poseCharacter()` animiert alle Helden: Idle-Atmen und Gewichtverlagerung, Laufzyklus aus der tatsächlichen Bewegungsgeschwindigkeit (`walk`), Angriffs-Lunge/-Schwung, Treffer-Rückprallen und Todestaumeln mit anschließender Drehung. Humanoid-Einheiten schwingen Arme und Beine; Monster-Modelle atmen, zucken und kippen. `attackPulse()` normalisiert die Dauer (0,25 s Basisangriff, 0,3 s Zauber, 0,18 s Mobs) — keine negativen Schwünge mehr. Instanzierte Mobs erhalten zusätzlich einen scale-/rotationsbasierten Angriffs-Impuls.
  *Erledigt:* `check_runtime.js` prüft Existenz von `poseCharacter`/`attackPulse`, die Animations-Felder im `userData` und dass ein Treffer die Pose tatsächlich verändert.}

- [x] **8. Boss-Lebensbalken in der Kampfleiste** (v1.23)
  Gegnerische Bosse (12× HP) haben als Schwarm-Mobs keine eigenen HP-Balken. `updateBossBar()`
  blendet in der Kampfleiste einen roten Balken mit Prozentwert ein, solange ein Boss lebt.
  *Erledigt:* `check_runtime.js` prüft die UI-Tokens und dass der Balken bei 50 % Boss-HP genau 50 anzeigt.

- [x] **9. Kritische Boss-HP als Warnung** (v1.24)
  `updateBossBar()` setzt die Klasse `critical`, sobald der gegnerische Boss unter 25 % HP fällt;
  der Balken wechselt auf rot/orange und der Prozentwert pulsiert. Nach dem Boss-Tod verschwinden
  beide Klassen wieder.
  *Erledigt:* `check_runtime.js` prüft Normalzustand bei 50 %, Warnung bei 20 % und dass der Balken
  nach dem Tod des Bosses ausgeblendet und die Warnung zurückgesetzt wird.

- [x] **10. Live-Kampfstatus in der Kampfleiste** (v1.25)
  `updateBattleStatus()` zeigt während des Kampfes die Anzahl lebender Gegner (Helden + Mobs)
  und lebender Helden im Verhältnis zur Startgröße. Außerhalb des Kampfes ist die Anzeige ausgeblendet.
  *Erledigt:* `check_runtime.js` prüft die UI-Tokens, den Startwert, die Aktualisierung bei Toden
  und das Ausblenden nach Kampfende; `check_data.py` prüft die Tokens.

- [x] **11. Warnung für kritische Helden** (v1.26)
  `updateHeroAlert()` blendet in der Kampfleiste eine pulsierende Warnung mit der Anzahl lebender
  Helden ein, deren HP plus Schild höchstens 25 % beträgt. Tote Helden zählen nicht; außerhalb des
  Kampfes verschwindet die Warnung.
  *Erledigt:* `check_runtime.js` prüft Startzustand, Zählung, Schildberücksichtigung, Tote und
  Ausblenden; `check_data.py` prüft die UI-Tokens.

- [x] **12. Team-HP-Balken in der Kampfleiste** (v1.27)
  `updateTeamHpBar()` zeigt die Summe aus HP+Schild aller Helden (pro Held auf max. HP gedeckelt)
  als Balken mit Prozentwert: grün, ab 50 % gelb (`warn`), ab 25 % rot und pulsierend (`critical`).
  Tote Helden steuern 0 bei; außerhalb des Kampfes verschwindet der Balken inklusive Warnklassen.
  *Erledigt:* `check_runtime.js` prüft Startwert, Schadensreaktion, Schildausgleich, kritische HP,
  tote Helden und Ausblenden; `check_data.py` prüft die UI-Tokens.

- [x] **13. Schwarmzahlen in der Kampfleiste** (v1.28)
  `updateBattleStatus()` zeigt zusätzlich die lebenden Schwarm-Mobs beider Seiten als
  „Mobs Spieler/Gegner“ (id `statusMobs`) in der Kampfleiste. Damit bleibt der Kernmechaniker
  des 500er-Schwarms auch im Kampfmodus sichtbar, in dem das HUD ausgeblendet ist.
  *Erledigt:* `check_runtime.js` prüft Startwert und Abzug bei einem toten Gegner-Mob;
  `check_data.py` prüft den UI-Token.

- [x] **14. Mana-Anzeige in der Kampfleiste** (v1.29)
  Das HUD mit dem Mana-Balken ist im Kampfmodus ausgeblendet, obwohl dort die mana-kostenden
  Fähigkeiten „Heilregen“ (40) und „Blitz“ (70) angeboten werden. `updateBattleManaBar()`
  blendet jetzt einen kompakten Mana-Balken mit aktuellem Wert in der Kampfleiste ein und
  verbirgt ihn außerhalb des Kampfes wieder.
  *Erledigt:* `check_runtime.js` prüft Tokens, Ein-/Ausblenden, Startwert, 40/70-Mana und 0;
  `check_data.py` prüft die UI-Tokens.

- [x] **15. Treffer-Impuls für Mobs** (v1.30)
  `mobHitPulse()` nutzt das vorhandene `hitFlash` der Mobs für einen kurzen Scale-/Wackel-Impuls
  in `updateMobVisuals()`. Damit sind Treffer auch im 500er-Schwarm sichtbar, nicht nur bei Helden.
  *Erledigt:* `check_runtime.js` prüft die Impuls-Skalierung und dass sich die Instanz-Matrix
  eines getroffenen Mobs tatsächlich ändert; `check_data.py` prüft die Tokens.

- [x] **16. Fokus-HP in der Kampfleiste** (v1.31)
  `updateFocusHp()` zeigt HP und Schild des per ◀/▶ fokussierten Wesens in der Kampfleiste.
  HUD und Einheiten-Panel sind im Kampfmodus ausgeblendet, daher waren die Werte bisher nur
  über die kleinen 3D-Balken ablesbar. Grün/gelb/rot ab 50/25 %, Ausblenden außerhalb des Kampfes
  und bei totem Fokus.
  *Erledigt:* `check_runtime.js` prüft Startwert, Schaden, Schild, kritische HP, toten Fokus
  und Ausblenden; `check_data.py` prüft die UI-Tokens.

- [x] **17. Fokus-Zauber-Cooldown in der Kampfleiste** (v1.32)
  `updateFocusCooldown()` zeigt den Zauber des per ◀/▶ fokussierten Wesens mit Restzeit in
  Sekunden oder „bereit" (grün). Das Einheiten-Panel mit `cooldownText()` ist im Kampfmodus
  ausgeblendet; bei totem Fokus und außerhalb des Kampfes verschwindet die Anzeige.
  *Erledigt:* `check_runtime.js` prüft Restzeit, Bereit-Zustand, toten Fokus und Ausblenden;
  `check_data.py` prüft die UI-Tokens.

- [x] **18. Gegner-Helden im Kampfstatus** (v1.33)
  `updateBattleStatus()` zeigt neben der Gesamtzahl der lebenden Gegner die lebenden
  gegnerischen Helden als „Helden x/y“ (id `statusFoeHeroes`). Damit ist erkennbar,
  wie viele Helden im 500er-Schwarm noch am Leben sind, ohne Mobs doppelt zu zählen.
  *Erledigt:* `check_runtime.js` prüft Startwert und Abzug bei einem toten Gegner-Helden;
  `check_data.py` prüft den UI-Token.

- [x] **19. Statuseffekte des Fokus in der Kampfleiste** (v1.34)
  Die Fokus-Anzeige (`focusStatus`) zeigt aktive Buffs/Debuffs des fokussierten Wesens
  als Emoji mit Restzeit. Im Kampfmodus sind HUD und Einheiten-Panel ausgeblendet,
  daher waren Statuseffekte dort nicht erkennbar. Unbekannte und abgelaufene
  Effekte werden ausgeblendet.
  *Erledigt:* `check_runtime.js` prüft Anzeige, Filter und Löschen der Statuseffekte;
  `check_data.py` prüft die UI-Tokens.

- [x] **20. Fokusname live in der Kampfleiste** (v1.35)
  `updateFocusHp()` zeigt neben HP und Schild auch den Namen des per ◀/▶ fokussierten Wesens.
  Das Battle-Info (`updateHud()`) wird nur bei bestimmten Ereignissen aktualisiert und konnte nach der
  Fokusnavigation einen veralteten Namen zeigen; die neue Anzeige wird pro Frame aktualisiert.
  *Erledigt:* `check_runtime.js` prüft Namen, Aktualisierung nach `cycleFocus(1)` und Zurücksetzen
  außerhalb des Kampfes; `check_data.py` prüft den UI-Token.

- [x] **21. Gold-Anzeige in der Kampfleiste** (v1.36)
  Das HUD mit der Gold-Anzeige ist im Kampfmodus ausgeblendet. `updateBattleGold()` blendet
  einen kompakten Gold-Stand (id `battleGold`) in der Kampfleiste ein, damit Gold-Gewinne
  durch Gold-auf-Kill-Effekte und der Stand für den kommenden Draft sichtbar bleiben.
  *Erledigt:* `check_runtime.js` prüft Tokens, Ein-/Ausblenden, Startwert und Live-Updates;
  `check_data.py` prüft die UI-Tokens.

- [x] **22. Bossname im Boss-Lebensbalken** (v1.37)
  Der Boss-Balken zeigt neben Prozent und Füllstand nun den Namen des aktiven gegnerischen
  Boss-Mobs (`bossBarName`), damit Boss/Elite-Begegnungen im Schwarm klar erkennbar sind.
  Bei Boss-Tod oder außerhalb des Kampfes wird der Name auf „Boss“ zurückgesetzt.
  *Erledigt:* `check_runtime.js` prüft Bossname sichtbar, korrekt und Reset;
  `check_data.py` prüft den UI-Token.
- [x] **4. Mob-Schwarm auf beiden Seiten** (v1.18)
  `MOB_CAP = 500`, 3 Archetypen und wellenbasierte Anzahl auf Spieler- und Gegnerseite. Mobs sind kompakte Einheiten ohne `makeCharacter()` und werden über `THREE.InstancedMesh` gerendert. Die KI nutzt alle 0,2 s einen Front-/Ziel-Cache statt pro Mob sortierter Zielwahl; Helden treffen weiterhin vollwertige ROSTER-Gegner.
  *Erledigt:* `check_data.py` prüft Cap und System-Tokens, `check_runtime.js` spawnt 500/500 Mobs und simuliert 600 Ticks ohne DOM-Fehler. User hat „Beide Seiten“ bestätigt.
