# Fabelbattler – Unreal Engine 5 Migrationsnotizen

Ziel: Fabelbattler später als Fullscreen-3D-Spiel in Unreal Engine 5 umsetzen. Ablauf: Menü mit Start/Einstellungen/Credits → Start öffnet leere 3D-Arena → Auswahlfenster für das erste Team → Kampf mit gleich vielen Einheiten pro Seite → Auswahl-/HUD-Fenster als UMG-Overlays.

## Aktueller Stand

- 2D-Version: `/root/fabelbattler/index.html`
- 3D-Version: `/root/fabelbattler/index3d.html`
- Lokale Three.js-Abhängigkeit: `/root/fabelbattler/vendor/three.min.js`
- Android-WebView lädt `file:///android_asset/index3d.html`
- `ROSTER` ist die zentrale Datenquelle für Einheiten:
  - Name, Emoji, Rolle, primäre Klasse, sekundäre Klasse (`cls2`), Rasse, HP, ATK, Reichweite, Geschwindigkeit, Fähigkeit, Fernzauber, Heilreichweite
  - Klassen: Wald, Magie, Dunkel, Chaos, Kaiju, Mythos, Geist, Tier, Stahl, Element
  - Rassen: Folklore, Kaiju, Fee, Zwerg, Barbar, Assassine, Alien – jede neue Rasse hat genau 10 Wesen
  - `RACE_PACKS` erzeugt die neuen Rassen kompakt; `RACE_SYNERGY` belohnt 2+ gleiche Rassen im Team
- `MONSTER_STYLE` ist die visuelle Datenquelle in der 3D-Version:
  - `type`, `variant`, `body`, `trim`, `plate`, `glow`, `glowIntensity`, `scale`, `hpY`, `radius`
- Kampfprinzip:
  - Startmenü, dann leere Arena, dann Auswahlfenster
  - Teamgröße einstellbar: 3, 4, 5 oder 6 Einheiten pro Seite
  - Gegnerteam wird nach Anzahl, Rolle und Klassen des Spielerteams erzeugt
  - 2 Gold pro gewählter Einheit
  - Draft-Karten werden nach fehlenden Rollen komplementiert; Gegner spiegeln Rassen/Klassen und füllen fehlende Rollen
  - Heiler heilen bis zu 3 Felder entfernt und bewegen sich bei größerem Abstand zum Ziel
  - aktive Fernzauber mit Reichweite/Cooldown: Godzilla Atomstrahl, King Kong Ansturm & Spott, Plus Varianten für alle anderen Wesen
  - aktive Eingriffe: Heilregen und Fabel-Blitz
  - Fähigkeiten mit Statuseffekten und Synergien; Synergien zählen Primär-/Sekundärklassen und Rassen
  - Fullscreen-Kampf, Auswahl und HUD als Overlay-Fenster

## Game-Flow in Unreal Engine 5

1. `W_MainMenu` startet im GameViewport mit Start, Einstellungen und Credits.
2. `Start` lädt `L_BattleArena` mit leerer KampfFläche, ohne spawnte Einheiten.
3. Direkt danach wird `W_UnitSelection` als modales UMG-Overlay geöffnet.
4. Der Spieler wählt genau `TeamSize` Einheiten; Standard ist 4 gegen 4.
5. `W_UnitSelection` schließt und `BP_BattleManager` spawnt das Gegnerteam mit gleicher Anzahl und passenden Klassen/Rollen.
6. Der Kampf läuft fullscreen; `W_BattleHUD`, `W_BattleBar` und bei Bedarf `W_UnitSelection` liegen darüber.
7. Nach Sieg bleibt die Arena sichtbar; „Nächste Welle“ spawn ein neues Gegnerteam gleicher Größe.

## Unreal-Zielarchitektur

1. Daten migrieren
   - `ROSTER` und `MONSTER_STYLE` als JSON oder UE5 DataAssets exportieren.
   - Stabile IDs beibehalten: `rumpelstilzchen`, `alp`, `kingkong`, `shingodzilla` usw.
   - Primärklasse und `cls2` als `EUnitClass`-Werte oder `PrimaryDataAsset`-Felder abbilden.
   - Rasse als `EUnitRace`; `RACE_PACKS` als DataTables für Fee, Zwerg, Barbar, Assassine und Alien.
   - Fähigkeiten als eigene `DA_Ability`-DataAssets mit Effekt, Dauer, Cooldown, Status und Niagara-Effekt referenzieren.
   - Fernzauber als `DA_Spell` mit `CastRange`, `Cooldown`, Damage Multiplier, Splash, Heal, Shield, Statuseffekten und Cast-VFX.
   - Heilreichweite pro Einheit: Heiler 3 Felder, andere Support-Einheiten 2 Felder.
   - Klassen-, Rassen- und Rollen-Metadaten als Enums/DataTables.
   - Teamgröße als `TeamSize`-Configwert im `GameInstance` oder `UGameUserSettings`.

2. Actor-Struktur
   - `BP_UnitBase` als gemeinsame Basis für Spieler- und Gegnereinheiten.
   - `BP_Kaiju`, `BP_Folk`, `BP_Beast`, `BP_Robot`, `BP_Dragon`, `BP_Mermaid`, `BP_Reaper` als Unterklassen.
   - Pro Einheit StaticMesh/SkeletalMesh oder modular zusammengesetzte Mesh-Teile.
   - Materialparameter: `BodyColor`, `TrimColor`, `PlateColor`, `GlowColor`, `GlowIntensity`.
   - Emissive Materials und Niagara für Atomatem, Feuer, Eis, magische Auren und Schilde.

3. Arena und Kamera
   - Fullscreen-3D-Arena, Kachelraster oder Freifläche mit taktischer Kamera.
   - Perspektivische Kamera mit sanfter Verfolgung, alternativ orthographisch für taktisches Gameplay.
   - Click-to-move, Click-to-attack und Auswahl via Cursor oder Gamepad.
   - HP-Balken und Namenslabels als Widget Components über den Einheiten.

4. UI/Fenster in UE5
   - `W_MainMenu`, `W_Settings`, `W_Credits`, `W_UnitSelection`, `W_BattleHUD`, `W_BattleBar`, `W_TeamList`.
   - Modale Popups mit `Create Widget`, `Add to Viewport`, `Set Input Mode UIOnly` und sauberer Fokus-Rückgabe.
   - CommonUI für konsistente Gamepad-/Touch-Navigation und sichtbare Fokuszustände.
   - Draftkarten zeigen Name, Rolle, Primärklasse, Sekundärklasse, Stats, Fähigkeit und Synergie-Hinweise.
   - `W_BattleBar` enthält Auswahl, nächste Welle, Heilregen, Blitz und Vollbild-Exit.
   - Auswahlfenster bleibt über der Arena, statt die Szene zu verlassen.

5. Gameplay-Logik in UE5
   - Wellenlogik und Draft-Ökonomie in `BP_BattleGameMode`/`BP_BattleGameState`.
   - Fähigkeiten über Gameplay Ability System (GAS) mit Attributen für HP, ATK, Speed, Shield und Statusresistenz.
   - Statuseffekte: `weaken`, `slow`, `root`, `stun`, `charm`, `burn`, `atkBuff`, `shield`, `revive`, `rage`, `killAtk`.
   - Thematische Fähigkeiten: `atomatem`, `multi_atom`, `schmelze`, `gewitter`, `frost`, `raketen`, `emp`, `traumzauber`, `zehrfluch`, `sensenstreich`, `moosheilung`, `wassersang`.
   - Fernzauber in UE5 als GAS-Abilities mit `CastRange` aus `DA_Spell`; Beispiele: `Atomstrahl` (Godzilla), `Schmelzstrahl`, `Multi-Atom`, `Raketensalve`, `Ansturm & Spott` (King Kong), `Steinbild`, `Schattenstoß`, `Mondbruch`, `Frostatem`, `Feensegen`.
   - Heil-Fernzauber von Heilern dürfen nur Ziele innerhalb von 3 Feldern heilen; bei größerem Abstand läuft die Einheit zum Ziel.
   - Synergien aus `CLASS_META`/`RACE_META` und `synergyCounts()`/`raceCounts()` ableiten; Primär-, Sekundärklassen und Rassen zählen.
   - Gegnerteam per `BP_BattleManager` aus Spielerklassen und Rollen spiegeln.
   - SaveGame für Team, Level, Gold, Welle, Teamgröße und freigeschaltete Einheiten.

6. Mobile/Android
   - Später AAB statt APK bevorzugen.
   - WebView vollständig ersetzen; keine `index3d.html` mehr in der finalen Unreal-App.
   - Texturen und Meshes für Mobile komprimieren, LODs und Niagara-Qualitätsstufen setzen.
   - Touch-UI mit großen Buttons und sicheren Bereichen für Notch/Gesture-Navigation.

7. Offene Entscheidungen
   - Unreal Engine 5 ist als Ziel festgelegt; konkrete Minor-Version bei Projektstart wählen.
   - Ziel: zuerst Desktop, zuerst Mobile oder beides parallel.
   - Stil: stilisiertes Low-Poly wie aktueller Prototyp oder detailreichere Creatures.
   - Lizenzierung: creature-Inspirationen stilisiert und eigenständig umsetzen, keine exakten Film-/Spielmodelle kopieren.
   - Eingabeschema: Maus/Tastatur, Touch oder Gamepad.

## Visuelle Referenzen und Aussehensnotizen

### Neu ergänzte Folklore-Einheiten

- `Alp`
  - Männliches Wesen der deutschen Folklore; trägt eine `Tarnkappe`, sitzt auf der Brust Schlafender und verursacht `Alpdruck`.
  - Umsetzung: kleines dunkles Wesen, breiter Hut, Schattenmantel, einzelnes leuchtendes Auge.
  - Quelle: https://en.wikipedia.org/wiki/Alp_%28folklore%29

- `Blaubart`
  - Ritter mit blauem Bart, Ehefrauenmörder, Schlüssel und verbotene Kammer mit blutigem Schlüssel.
  - Umsetzung: adliger Mann mit großem blauem Bart, dunklem Mantel und Schlüsselbund.
  - Quelle: http://www.goethezeitportal.de/wissen/enzyklopaedie/franz-graf-von-pocci/blaubart.html

- `Duden`
  - Keine gesicherte Fabelwesen-Quelle gefunden; Annahme: personifiziertes rotes Nachschlagewerk.
  - Umsetzung: großes rotes Buch, goldene Lettern, Seitenflügel, goldene Augen, strenger bibliothekarischer Vibe.

- `Nachzehrer` / `Nachtzerrer`
  - Untoter zwischen Vampir und Ghul, der eigenes und fremdes Fleisch isst und Familien heimsucht.
  - Umsetzung: zerfallener, in ein Leintuch gehüller Körper mit offenen Rippen und rotem Auge.
  - Quelle: https://www.army.mil/article/137089/Germany_s_ghouls_and_goblins

- `Moosweiblein`
  - Freundlicher Waldgeist aus Fichtelgebirge/Vogtland; Kleidung und Kopfbedeckung dicht mit Moos bedeckt, hilft Waldarbeitern und Kindern.
  - Umsetzung: kleine gebückte Waldfrau mit Mooshaaren, Moosrock und Korb.
  - Quelle: http://www.bayern-fichtelgebirge.de/heimatkunde/123.htm

- `Aufhocker`
  - Koboldartiger Druckgeist; springt Wanderern auf Schulter/Rücken, wird mit jedem Schritt schwerer und lähmt.
  - Umsetzung: schwerer, gebückter schwarzer Geist mit tierischen Ohren und roten Augen.
  - Quelle: https://dewiki.de/Lexikon/Aufhocker

- `Fernrisswolf`
  - Keine gesicherte Quelle unter exakt diesem Namen; Annahme: Fenrir/Fenris-inspirierter Geisterwolf.
  - Umsetzung: großer dunkler Wolf mit zerrissenem Fell, blauen Rissmarken und leuchtenden Augen.
  - Referenz: https://literature.stackexchange.com/questions/9250/what-are-the-different-names-of-fenrir-fenris-wolf

- `Nixen`
  - Wassergeister/Meerjungfrauen mit blasser Haut, langem Haar, Kamm/Spiegel und Fischschwanz.
  - Umsetzung: blaue Wasserfee mit Fischschwanz, langem Haar und Kamm.

- `Krötenmönch`
  - Keine gesicherte Quelle unter exakt diesem Namen; Annahme: Mönch/Kröte-Hybrid oder Bergmönch-Variante.
  - Umsetzung: Mönchskutte, krötenartiger Kopf, Warzen, gelbe Augen, Wanderstock.
  - Bergmönch-Referenz: https://en.wikipedia.org/wiki/Bergm%C3%B6nch

- `Sensenmann`
  - Skelett in schwarzer Kapuzenkutte mit Sense.
  - Umsetzung: schwarzer Umhang, bleicher Schädel, blaue Augenhöhlen, gebogene Sense.

- `Heinzelmännchen`
  - Bereits vorhanden unter `heinzelmaennchen`; kleine, braune, hilfsbereite Hausgeister.
  - Umsetzung: sehr kleiner Handwerker mit Hammer und werkzeugartigen Details.

### Kaiju-Referenzen

- `Godzilla`, `Minilla`, `Burning Godzilla`, `Shin Godzilla`, `Godzilla Earth`
  - Stilisierte Echsenkaiju mit Rückenplatten, langem Schwanz, starker Silhouette und glowenden Augen.
  - Shin: dunkle, schlanke Form mit violetten/karmesinroten Akzenten.
  - Burning: orange/glühende Rückenplatten und Risse.
  - Earth: sehr groß, grün, bewaldet, pflanzliche Rückenstacheln.

- `Mothra`
  - Große weiße Motte mit gelben und blauen Flügelakzenten, Fühlern und leuchtenden Augen.

- `King Kong`, `Scar King`
  - Großer brauner Affe mit markanter Narbe, mächtigen Armen und tierischer Silhouette.
  - `Scar King` zusätzlich blau glowende Wunden und ein Stab/Schwert.

- `Queen M.U.T.O.`, `WarBat`
  - Insektenartige bzw. flughautige Kaiju mit Spinnen-/Fledermaus-Silhouette und orange-roten Akzenten.

- `Mechagodzilla`
  - Metallischer Roboter mit roten Augen, Kanonenarmen und künstlicher Rückenplattenstruktur.

- `Methuselah`, `Bagan`, `Shimo`
  - Felsige bzw. vierbeinige Kaiju; Shimo mit Eis- und Frostakzenten.

- `King Ghidorah`
  - Goldener dreiköpfiger Drache mit Schwingen und mehreren Köpfen.

- `Rodan`
  - Roter Pterosaurier mit großen Schwingen und spitzem Schnabel.

## Neue Rassen (je 10 Wesen)

- Fee: Lichtfee, Gartenelfe, Mondelfe, Frostfee, Feenritter, Blumengeist, Glühwisp, Traumfee, Nebelhexe, Feenkönigin.
- Zwerg: Zwergenkrieger, Baumeister, Schmied, Runenheiler, Zwergenjäger, Wächter, Zwergenbarde, Alchemist, Minenhaupt, Runenmeister.
- Barbar: Häuptling, Sturmrenner, Speerwerfer, Schamane, Bisonreiter, Schlachtsänger, Frostbarbar, Pirat, Wildläuferin, Mooskrieger.
- Assassine: Klinge, Schatten, Giftmischer, Bogenschütze, Nebeltänzerin, Nachtläufer, Fallensteller, Seidenmord, Spiegelklinge, Großmeister.
- Alien: Grauer, Reptiloid, Insektoid, Kristallwesen, Pflanzenwesen, Energieform, Tentakelwesen, Sporenwesen, Metallroid, Leerwesen.
- Modelle: `buildFolk` hat neue Varianten `fee`, `dwarf`, `barbar`, `assassin`; `buildAlien` hat `grey`, `reptilian`, `insectoid`, `crystal`, `plant`, `energy`, `cephalopod`, `spore`, `robot`, `void`.

## Fähigkeits-Mapping nach Recherche

- Kaiju/Filmlore
  - `godzilla`, `burninggodzilla`, `shingodzilla`, `godzillaearth`: Atomatem, Multi-Atom, Meltdown, Regeneration → Splash, Brand, hohe HP.
  - `mothra`: Schwingenstoß, Seidenschlinge, reflektierende Schuppen → Verlangsamung, Startschild, Speed.
  - `kingkong`, `scarking`: Quake Slam, Peitschenarm, Kristallbefehl → Splash, Betäubung, Howl/Charm.
  - `queenmuto`, `warbat`: EMP, Parasitismus, Venom, Schwarm → Stun, Lifesteal, Curse.
  - `mechagodzilla`: Raketen, Proton Scream, Jet-Booster → Splash, Crit, Speed.
  - `kingghidorah`, `shimo`, `rodan`: Gravity Beams, Frost, Supersonic Flight → Stun, Root, Slow, Speed.
  - `methuselah`, `bagan`: Tarnung, Horn-Rammstoß, Formwechsel → DR, HP, Brand/Splash.
  - Quellen: https://en.wikipedia.org/wiki/Godzilla, https://en.wikipedia.org/wiki/Mothra, https://en.wikipedia.org/wiki/Kong_(Monsterverse), https://en.wikipedia.org/wiki/Shin_Godzilla_(character), https://en.wikipedia.org/wiki/King_Ghidorah, https://en.wikipedia.org/wiki/Rodan, https://en.wikipedia.org/wiki/Bagan_(kaiju), https://www.hbomax.com/movie/e8dfef9b-fa41-4041-8230-7dd832116f2e

- Folklore/Mythos
  - `rumpelstilzchen`, `blaubart`: Gold spinnen, verbotener Raum, Blutiger Schlüssel → Bonus-Gold, Crit, Schilde.
  - `chupacabra`, `vampire`, `nachtzerrer`, `sensenmann`: Blutsaugen, Zehren, Sense → Lifesteal, Brand, Kill-Atk.
  - `alp`, `sukubus`, `lilith`, `nixen`: Albtraum, Verführung, Wassersang → Charm, Curse, Slow.
  - `werewolf`, `fernrisswolf`, `bigfoot`, `hydra`: Mondraserei, Rissbiss, Erdbeben, Kopfregeneration → Rage, Crit, Splash, Revive.
  - `hexe`, `ruebezahl`, `dschinn`: Wetter, Sturm, Gestaltwandel → Slow, Splash, Charm.
  - `fee`, `moosweiblein`, `klabautermann`, `heinzelmaennchen`: Segen, Moosheilung, Reparatur, Werkzeug → Heal, Shield, Crit.
  - `medusa`, `krötenmoench`, `aufhocker`, `goblin`: Steinblick, Krötenfluch, Druckgeist, Horden → Stun, Curse, DR, Kill-Atk.
  - Quellen: https://www.britannica.com/topic/Rumpelstiltskin, https://www.britannica.com/topic/Bluebeard-literary-character, https://en.wikipedia.org/wiki/Chupacabra, https://en.wikipedia.org/wiki/Alp_(folklore), https://en.wikipedia.org/wiki/Aufhocker, https://www.britannica.com/topic/Hydra-Greek-mythology, https://www.britannica.com/topic/Medusa-Greek-mythology, https://en.wikipedia.org/wiki/Klabautermann, https://www.britannica.com/topic/nix-German-mythology

- Unsicher/Ausnahme: `duden`, `fernrisswolf`, `kroetenmoench` haben keine gesicherte direkte Quelle; sie bleiben stilisierte Design-Annahmen. `nachtzerrer` wird als `Nachzehrer` behandelt.

## Hinweise zur Umsetzung im aktuellen Prototyp

- Die aktuelle Klassen-/Fähigkeits-/Ablauf-Logik steht nur in `/root/fabelbattler/index3d.html`; `/root/fabelbattler/index.html` bleibt vorerst die ältere 2D-Variante.
- Neue und bestehende Einheiten nutzen in der 3D-Version `MONSTER_STYLE` und prozedurale Builder statt der alten generischen Humanoiden.
- Die Builder liegen in `/root/fabelbattler/index3d.html`:
  - `buildKaiju`, `buildMoth`, `buildApe`, `buildDragon`, `buildBug`, `buildRobot`, `buildSerpent`, `buildRock`, `buildQuadruped`, `buildPterosaur`
   - `buildFolk`, `buildBeast`, `buildBook`, `buildMermaid`, `buildHydra`, `buildReaper`, `buildAlien`
- Bei Unreal-Migration die prozeduralen Teile nicht eins zu eins übernehmen, sondern als modulare Mesh-Slots denken:
  - Kopf, Rumpf, Arme, Beine, Schwanz, Flügel, Hörner, Kutte, Waffen, Auren.
