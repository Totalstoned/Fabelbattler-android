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

- [x] **22. Fokus-Level und -Rolle in der Kampfleiste** (v1.37)
  Im Kampfmodus sind Teamliste und Einheiten-Panel ausgeblendet. `updateFocusMeta()`
  zeigt als `focusMeta` Stufe und Rolle (Tank/DPS/Heiler/Puffer) des per ◀/▶
  fokussierten Wesens direkt neben Namen und HP; bei totem Fokus und außerhalb
  des Kampfes ist die Anzeige ausgeblendet.
  *Erledigt:* `check_runtime.js` prüft Startwert, Aktualisierung nach `cycleFocus(1)`,
  toten Fokus und Ausblenden; `check_data.py` prüft die UI-Tokens.

- [x] **23. Sieges-Zusammenfassung als ein Toast** (v1.39)
  `winBattle()` erzeugte zwei fast identische „Welle X besiegt!“-Toasts; der zweite nannte
  statisch `teamSize gegen teamSize`. Jetzt gibt es genau einen Toast mit Gold-Belohnung
  (inkl. Boss-/Elite-Bonus), Kampfdauer in Sekunden und überlebenden Helden („Helden A/B“).
  *Erledigt:* `check_runtime.js` prüft, dass genau ein Sieges-Toast erscheint und Gold,
  Dauer und Helden-Zahl korrekt enthalten sind.
- [x] **24. Eigener Boss-Lebensbalken** (v1.40)
  `updatePlayerBossBar()` zeigt in der Kampfleiste die HP des Spieler-Boss (türkis, rot/pulsierend unter 25 %), der bisher nur auf Gegnerseite sichtbar war. Die Balken sind als „Gegner“/„Team“ beschriftet; nach Boss-Tod verschwindet die Anzeige.
  *Erledigt:* `check_runtime.js` prüft Anzeige, 50 %/20 % HP und Ausblenden; `check_data.py` prüft die UI-Tokens.
- [x] **25. Fokus-Angriffswert in der Kampfleiste** (v1.41)
  Die Fokus-Anzeige ergänzt den live Angriffswert (`focusAtkValue`) des per ◀/▶
  fokussierten Wesens. Im Kampfmodus sind HUD und Einheiten-Panel ausgeblendet;
  der ATK-Wert bestimmt die Schadenswirkung und ändert sich durch Buffs (z. B. `killAtk`).
  `updateFocusHp()` aktualisiert den Wert pro Frame und setzt ihn bei totem Fokus
  sowie außerhalb des Kampfes zurück.
  *Erledigt:* `check_runtime.js` prüft Startwert, Live-Update nach ATK-Änderung,
  totes Fokus und Zurücksetzen; `check_data.py` prüft die UI-Tokens.
- [x] **26. Fokus-Auto-Wechsel bei Heldentod** (v1.42)
  Stirbt der fokussierte Helden im Kampf, springt `killUnit()` automatisch auf den nächsten
  lebenden Helden (`G.selectedUnitId`). Dadurch bleiben Fokus-HP, Cooldown und Statuseffekte
  in der Kampfleiste sichtbar, ohne manuelles Umschalten über ◀/▶.
  *Erledigt:* `check_runtime.js` prüft, dass der Fokus nach `killUnit()` auf einen lebenden
  Helden wechselt.
- [x] **27. Zauber-Bereitschaft an der Mana-Anzeige** (v1.43)
  Im Kampfmodus ist das HUD mit den Zauber-Kosten ausgeblendet; die Mana regeneriert laufend.
  `updateBattleManaBar()` ergänzt die kompakte Mana-Anzeige um zwei Marker (`manaHealReady`
  für Heilregen ab 40, `manaNovaReady` für Fabel-Blitz ab 70), die farbig aufleuchten, sobald
  der Zauber bezahlbar ist, und sich sonst abdunkeln. Außerhalb des Kampfes verschwinden sie.
  *Erledigt:* `check_runtime.js` prüft die Schwellen 40/70, das Ausblenden bei 0 und außerhalb
  des Kampfes; `check_data.py` prüft die UI-Tokens.
- [x] **28. Duden-Bonus in der Kampfleiste** (v1.44)
  Das HUD mit den Synergie-Badges ist im Kampfmodus ausgeblendet. `updateBattleDudes()`
  zeigt nun den aktiven Schwarm-Bonus aus der Spielerseite (Helden + Mobs) als
  „● Duden +X %“ in der Kampfleiste. Ohne Bonus und außerhalb des Kampfes ist die
  Anzeige ausgeblendet.
  *Erledigt:* `check_runtime.js` prüft Ein-/Ausblenden, Bonuswert und Reaktion auf die
  Einheitenanzahl; `check_data.py` prüft die UI-Tokens.
- [x] **29. Niederlage-Zusammenfassung im Toast** (v1.45)
  `loseBattle()` zeigt jetzt kampfdauer, überlebende Helden und verbleibende Gegner
  in genau einem Toast. Bisher stand dort nur „Niederlage in Welle X – erneut versuchen“;
  die neuen Werte bleiben trotz `reviveTeam()` erhalten, weil sie vorher aus `G.battle`
  gelesen werden.
  *Erledigt:* `check_runtime.js` prüft genau einen Toast mit Welle, Dauer, Helden und
  Gegnerzahl; `check_data.py` prüft die Tokens.

- [x] **29. Toasts im Kampf oben** (v1.45)
  Die Toasts lagen mit `bottom:14px` und `z-index:99` direkt über der Kampfleiste und verdeckten Timer, Kampfstatus, Fokus- und Mana-Anzeige. `body.battle-mode .toasts` setzt sie auf `top:14px` (`bottom:auto`, `pointer-events:none`); außerhalb des Kampfes bleibt die alte Position.
  *Erledigt:* `check_runtime.js` prüft die CSS-Regel; `check_data.py` und die Kampf-Simulation bleiben grün.
- [x] **30. Fokus-Ziel in der Kampfleiste** (v1.46, erweitert v1.51)
  `updateFocusTarget()` zeigt ➤ Ziel mit Namen, Rest-HP, Schild und Angriffswert des
  Wesens, das der per ◀/▶ fokussierte Held aktuell angreift. Bei kritischem Ziel
  (≤ 25 %) pulsiert der Wert rot; ohne Ziel, bei totem Ziel/Fokus und außerhalb des
  Kampfes ist die Anzeige ausgeblendet. Im Kampfmodus sind HUD und Einheiten-Panel
  ausgeblendet; der live ATK-Wert zeigt die Bedrohung des Ziels direkt an.
  *Erledigt:* `check_runtime.js` prüft Anzeige, HP/Schild/ATK, kritische HP, totes
  Ziel, toten Fokus und Ausblenden; `check_data.py` prüft die UI-Tokens.

- [x] **4. Mob-Schwarm auf beiden Seiten** (v1.18)
  `MOB_CAP = 500`, 3 Archetypen und wellenbasierte Anzahl auf Spieler- und Gegnerseite. Mobs sind kompakte Einheiten ohne `makeCharacter()` und werden über `THREE.InstancedMesh` gerendert. Die KI nutzt alle 0,2 s einen Front-/Ziel-Cache statt pro Mob sortierter Zielwahl; Helden treffen weiterhin vollwertige ROSTER-Gegner.
  *Erledigt:* `check_data.py` prüft Cap und System-Tokens, `check_runtime.js` spawnt 500/500 Mobs und simuliert 600 Ticks ohne DOM-Fehler. User hat „Beide Seiten“ bestätigt.

- [x] **31. Zivile Gegnerheere statt Monster** (v1.53)
  `ENEMY_ONLY`/`FOE_KEYS` enthalten 18 gegner-exklusive Wesen: Oma, Opa, Feuerwehr,
  Kampftruppe, Soldat, Missionar, Sanitäter, Rebell, Armee, Bundeswehr, Söldner
  sowie Feuerwehrwagen, Krankenwagen, Panzer, Hubschrauber, Kampfflugzeug und
  Drohne. Alle besitzen nur `biss` (Level-Scaling), keine Sonderfähigkeiten;
  Fahrzeuge nutzen den vorhandenen `robot`-Mesh. `enemyKeyFor()` wählt
  ausschließlich aus `FOE_KEYS`, sodass Gegnerteams nie die Monster des
  Spieler-Pools enthalten. Draft bleibt auf `ALL_KEYS` beschränkt.
  *Erledigt:* `check_data.py` prüft 113 Einheiten/51 Zauber und alle 18 Keys;
  `check_runtime.js` prüft Draft-Sperre und dass 80 `enemyKeyFor()`-Ziehung
  ausschließlich Gegner-Wesen liefern. Balance der Fahrzeug-Reichweiten so
  angepasst, dass Kämpfe terminieren.

- [x] **32. Support-Cooldown gegen Kampf-Stillstand** (v1.54)
  `supportAction()` griff früher bei jedem Zyklus ein, sobald ein Verbündeter
  unter 78 % HP+Schild lag – besonders durch den Stahl-Klassen-Buff
  (`shieldPct`) schildeten beide Seiten dauerhaft statt anzugreifen. Kämpfe
  endeten dadurch gar nicht (Harness: 12/12 Timeouts). Neuer `supportCd`
  (4 s, in `tickUnit()` dekrementiert) erlaubt nur noch einen Support pro
  4 Sekunden; dazwischen wird normal angegriffen und gezaubert.
  *Erledigt:* Harness 12/12 Siege statt Timeouts (Welle 3), 5/5 Siege bei
  Welle 5/10 und gegen Panzer/Kampftruppe/Feuerwehr (Ø 10–14 s);
  `check_runtime.js` 5 Siege in 2023 Ticks, alle drei Checks grün.

- [x] **38. Elite-/Boss-Spawn im 3D ankündigen** (v1.73)
  Im 500er-Schwarm waren Eliten und Bosse trotz Farbe und Größe beim Wellenstart
  schwer zu finden. `announceSpecialMobs()` erzeugt beim Start einer Welle für
  jedes besondere Mob eine Schockwelle, Partikel und ein Text-Schild („✨ Elite"
  bzw. „👑 Boss") direkt am Spawnort; bei Bossen kommt ein kurzer Wackler dazu.
  Normale Mobs bleiben effektfrei, damit die Performance erhalten bleibt.
  *Erledigt:* `check_data.py` prüft die Tokens; `check_runtime.js` prüft, dass
  Welle 1 keine Spawn-Effekte erzeugt, Welle 5 genau einen Effekt pro Elite
  und Welle 10 zusätzlich den Boss-Wackler auslöst. Alle drei Checks grün.

- [x] **37. Realistischer Steinboden** (v1.72)
  User: „so grafisch jetzt viel realistischer". Neue `stoneTexture()` erzeugt
  prozedurale Stein-Kacheln (Koerner, Risse, Vignette, zwei Toene), die Arena
  bekommt eine sichtbare Plattenkante und ein warmes Key-Licht. Keine
  Trennlinie. Checks sichern 48 texturierte Kacheln.
  *Offen:* Screenshot vom Geraet zur optischen Bestaetigung.

- [x] **36. Feste Signatur fuer funktionierende App-Updates** (v1.71)
  Der User meldete, dass die Installation abbricht, statt die alte App zu
  aktualisieren. Ursache: `assembleDebug` auf den GitHub-Runnern erzeugte bei
  jedem Lauf ein neues Debug-Zertifikat (5 APKs, 5 verschiedene Hashes).
  Android verweigert ein Update bei wechselnder Signatur.
  *Erledigt:* `app/debug.p12` als fester Keystore im Repo, in `build.gradle`
  unter `signingConfigs.debug` verdrahtet und beiden Build-Types zugewiesen.
  Alle zukuenftigen APKs tragen dieselbe Signatur. Die aktuell installierte
  App muss wegen des alten Zufallskeys EINMAL deinstalliert werden.

- [x] **35. Versionssprung auf 1.70** (v1.70)
  User-Wunsch: „benneng 1.59 1.60 1.70 der app" → direkt 1.70, keine
  Zwischenversionen. `APP_VERSION_NAME=1.70`, `APP_VERSION_CODE=70` (bewusst
  kein +1). Keine Änderung an `index3d.html`; Spiellogik entspricht v1.56.
  *Erledigt:* CI-Lauf und APK `fabelbattler-v1.70-b70.apk`, alle Checks grün.

- [x] **34. Kampffläche ohne Trennstrich** (v1.56)
  User-Wunsch: „die Fläche soll ohne Trennstrich sein und die Einheiten können
  zueinander [hin]laufen". `buildArena()` erzeugte einen goldenen Mittelstreifen
  (`arenaPulse`) sowie zwei farbliche Seitenflächen – beides entfernt, inklusive
  der Puls-Animation in `updateVisuals()`. Die Bewegung war bereits frei
  (`moveUnit()` clampet auf `0..GRID.cols-1`, `collisionAt()` prüft nur
  Einheitskollisionen, keine Seitenbindung).
  *Erledigt:* `check_data.py` verbietet die Trennlinien-Tokens und verlangt das
  vollständige Grid-Clamping; `check_runtime.js` misst während der Simulation
  die minimale Distanz zwischen Helden und Gegnern (0,99 Felder < 2) und bricht
  ab, wenn Einheiten auf ihren Seiten stehen bleiben.

- [x] **33. Neun Loop-PRs (#125–#133) als Union integriert** (v1.55)
  PRs #125 (Eliten-Zähler), #126 (blauer Schildblock-Impuls), #127
  (Fokus-Ziel-Statuseffekte), #128 (Draft-Level-Vorschau), #129 (Fokuswechsel
  ohne Toast-Spam), #130 (Gold-Gewinn `+N`), #131 (Gegner-Stärkebalken),
  #132 (besiegte Gegner) und #133 (Fokus-Ziel-Angriffswert) wurden per
  Cherry-Pick in einem separaten Worktree zusammengeführt. Da alle PRs auf
  älteren Versionen (v1.49/v1.51/v1.52) basierten, gab es Konflikte in
  `index3d.html`, `check_data.py`, `check_runtime.js` und den Docs; diese wurden
  als **Union** aufgelöst, sodass alle Features und alle Token-Prüfungen
  erhalten bleiben. Ein sauberer Integrations-Commit statt neun kaputter
  Zwischencommits.
  *Erledigt:* alle drei Checks in Repo- und externer Kopie grün; `check_runtime.js`
  prüft jetzt zusätzlich `focusQuiet`/`focusToastInPrep`, alle neuen IDs und
  den kombinierten Status-String.
