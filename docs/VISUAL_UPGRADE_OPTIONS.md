# Optik-Optionen – was mehr Download wert ist

Stand 2026-11-26. Der aktuelle Build ist 1.22.7 (mit 76 Atlanten, Fahrzeugen, Hafen, beleuchteter Skyline und Neon-Schildern) – weiterhin weit unter 100 MB. Du hast gesagt, dass dir ein größerer Download für deutlich bessere Optik egal ist – hier sind die sinnvollsten Wege, sortiert nach Wirkung pro Megabyte.

| Option | Mehrgröße (geschätzt) | Wirkung |
| --- | --- | --- |
| Weitere CC0-Turntables für alle 123 Wesen (47 fehlen noch, 76 sind fertig) | +2–5 MB pro Wesen, gesamt +250–500 MB | Jedes Wesen bekommt 8 drehbare Ansichten statt generischer 3D-Formen; größter Sprung für den Wesen-Atlas. |
| Hochauflösende CC0-Boden-/Gebäudetexturen (2K statt 512 px) | +20–80 MB | Stadt und Schlachtfeld wirken detailscharf, besonders nah an der Kamera. |
| Stadt-Requisiten: beschädigte Häuser, Brücke, Schiffe, Straßenbahn, Trümmer | +5–20 MB | Die japanischen Kaiju-Überfälle wirken wie echte Städte, nicht wie zwei Reihen Häuser. |
| Bessere Fahrzeug- und Soldatenmodelle (Panzer, Feuerwehr, Hubschrauber) | +10–30 MB | Die menschliche Verteidigung ist klar erkennbar statt einfacher Würfel. |
| CC0-Soundtrack und Kampfeffekte (OGG, komprimiert) | +10–30 MB | Deutlich mehr „FilmAthmosphäre“, aktuell ist das Spiel still. |
| Wasser-/Rauch-/Explosions-Partikel in 2K | +10–25 MB | Größere Explosionen und sichtbarer Staub nach Gebäudeeinstürzen. |
| Kompletter UE5-Neubau mit Nanite/Lumen und Asset Packs | +150 MB–1,5 GB (Play-Limit 4 GB komprimiert) | Filmreife Beleuchtung und Zerstörung – aber nur mit leistungsfähigem PC und Epic-Zugang machbar, kein schneller Umstieg. |

**Empfehlung ohne Engine-Wechsel:** zuerst die 47 fehlenden CC0-Wesen-Atlanten (Prioritäten in `docs/UNIT_ART_AUDIT.md`), dann 2K-Stadttexturen und Requisiten, danach Sound. Das bleibt im WebView-Build, läuft auf deinem Handy und kostet zusammen vielleicht 400–600 MB statt 3,5 MB – technisch machbar, weil Phone Gap/Asset Packs Speicher nicht knapp werden lassen, sofern die Laufzeitflüssigkeit erhalten bleibt.

**Wichtig:** Die 3D-Szene darf nicht langsamer werden. Jede neue Textur wird lokal im APK ausgeliefert, damit nichts nachgeladen werden muss. Große Pakete werden erst eingebaut, wenn die Checks und die Runtime-Simulation (1500 Ticks) weiter grün sind und du per Screenshot bestätigt hast, dass es besser aussieht.
