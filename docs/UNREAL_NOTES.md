# Fabelbattler – Unreal Engine Migrationsnotizen

Ziel: Fabelbattler später als Fullscreen-3D-Spiel in Unreal Engine spielen, mit Popups/Fenstern für Draft, Team, Level-Up und Einheitenauswahl.

## Aktueller Stand

- 2D-Version: `/root/fabelbattler/index.html`
- 3D-Version: `/root/fabelbattler/index3d.html`
- Lokale Three.js-Abhängigkeit: `/root/fabelbattler/vendor/three.min.js`
- Android-WebView lädt `file:///android_asset/index3d.html`
- `ROSTER` ist die zentrale Datenquelle für Einheiten:
  - Name, Emoji, Rolle, Klasse, HP, ATK, Reichweite, Geschwindigkeit, Fähigkeit
- `MONSTER_STYLE` ist die visuelle Datenquelle in der 3D-Version:
  - `type`, `variant`, `body`, `trim`, `plate`, `glow`, `glowIntensity`, `scale`, `hpY`, `radius`
- Kampfprinzip:
  - wellenbasiert
  - Draft mit 2 Gold
  - Team aus maximal 6 Einheiten
  - aktive Eingriffe: Heilregen und Fabel-Blitz
  - Fähigkeiten mit Statuseffekten und Synergien

## Unreal-Zielarchitektur

1. Daten migrieren
   - `ROSTER` und `MONSTER_STYLE` als JSON oder DataAssets exportieren.
   - Stabile IDs beibehalten: `rumpelstilzchen`, `alp`, `kingkong`, `shingodzilla` usw.
   - Fähigkeiten als eigene DataAssets mit Effekt, Dauer, Cooldown und Visual Effect referenzieren.
   - Klassen- und Rollen-Metadaten als Enums/DataTables.

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

4. UI/Fenster
   - UMG Widget Blueprints für HUD, Draft, Teamliste, Level-Up, Fähigkeiten und Pause.
   - Modale Popups mit `Create Widget`, `Add to Viewport`, Fokussteuerung und `Set Input Mode UIOnly`.
   - Draftkarten zeigen Name, Rolle, Klasse, Stats, Fähigkeit und Synergie-Hinweise.
   - Auswahlfenster für Einheiten, Zielwahl und Fähigkeiten später auch per Gamepad bedienbar machen.

5. Gameplay-Logik
   - Wellenlogik und Draft-Ökonomie in einem `GameMode`/`GameState`.
   - Fähigkeiten über Gameplay Ability System oder ein leichtgewichtiges C++/Blueprint-Timer-System.
   - Statuseffekte: `fluch`, `blutdurst`, `segen`, `protz`, `werk`, `atom`, `staub`, `versteinern`, `heulen`, `berg`.
   - Synergien unverändert aus `CLASS_META` und `synergyCounts()` ableiten.
   - SaveGame für Team, Level, Gold, Welle und freigeschaltete Einheiten.

6. Mobile/Android
   - Später AAB statt APK bevorzugen.
   - WebView vollständig ersetzen; keine `index3d.html` mehr in der finalen Unreal-App.
   - Texturen und Meshes für Mobile komprimieren, LODs und Niagara-Qualitätsstufen setzen.
   - Touch-UI mit großen Buttons und sicheren Bereichen für Notch/Gesture-Navigation.

7. Offene Entscheidungen
   - Unreal Engine Version 5.x festlegen.
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

## Hinweise zur Umsetzung im aktuellen Prototyp

- Neue Roster-Einträge stehen in beiden Dateien: `/root/fabelbattler/index.html` und `/root/fabelbattler/index3d.html`.
- Neue und bestehende Einheiten nutzen in der 3D-Version `MONSTER_STYLE` und prozedurale Builder statt der alten generischen Humanoiden.
- Die Builder liegen in `/root/fabelbattler/index3d.html`:
  - `buildKaiju`, `buildMoth`, `buildApe`, `buildDragon`, `buildBug`, `buildRobot`, `buildSerpent`, `buildRock`, `buildQuadruped`, `buildPterosaur`
  - `buildFolk`, `buildBeast`, `buildBook`, `buildMermaid`, `buildHydra`, `buildReaper`
- Bei Unreal-Migration die prozeduralen Teile nicht eins zu eins übernehmen, sondern als modulare Mesh-Slots denken:
  - Kopf, Rumpf, Arme, Beine, Schwanz, Flügel, Hörner, Kutte, Waffen, Auren.
