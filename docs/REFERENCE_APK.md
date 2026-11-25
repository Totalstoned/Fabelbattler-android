# Referenz-APK – How Many Dudes (automatisch ausgelesen)

- Datei: `/root/projects/FABELBATTLER/How-Many-Dudes-v100.1.35-full-apkvision.apk`
- Version: 100.1.35 · Engine: GameMaker (libyoyo.so/game.droid) · Landscape: True
- SHA-256: `4069117feaf386acaa28d7a0b921ff1f5ee810f7669e7bf3dc3d3236f85f8d73`

## Inhalt der Referenz

| Bereich | Anzahl |
|---|---:|
| Wesen-Typen | 45 |
| Gegner-Typen | 70 |
| Relikte | 264 |
| Trinkets | 31 |
| Kampf-Traits | 14 |
| Glossar-Begriffe | 53 |
| Lokalisierungs-Strings | 2348 |
| Erfolge | 69 |
| Assets .ogg | 29 |
| Assets .png | 2 |
| Assets .ttf | 12 |
| Sprachen | 9 |

- Akte: The Barrens, The Berg, The Cave, The Coliseum, The Field, The Flats
- Modi: Ensemble, Rematch, Standard, The Daily Dude
- Wesen-Familien: action, employed, fantasy, scifi, undead, warrior
- Rundentypen: boss, business, dude_trainer, flyer, food_dude, investment_matures, promoter_dude, relic, scavenger, scavenger_return, shop, smuggler_dude, smuggler_return, trained_dudes_return
- Tier-Mutatoren: 10

Die Grafiken der Referenz stecken in `assets/game.droid`; die wenigen losen PNGs
sind keine Sprite-Vorlagen. Wir übernehmen nur Mechaniken, nicht deren Assets.

## Abgleich mit Fabelbattler

- Unsere Version: 1.20.4; 123 Einheiten, 51 Zauber, 18 Gegner-Keys, MOB_CAP=500, Feld 18x14.
- Die Referenz hat deutlich mehr Inhalte, aber **andere** Einheiten und eine andere Karte.
- Kopiere KEINE Grafiken, Texte oder Namen der Referenz. Übertrage nur Mechaniken und Lesbarkeit.

## Mögliche kleine nächste Schritte (aus Referenz abgeleitet)

1. Runden-Vorschau ist umgesetzt – nächster Schritt wäre eine leichte Relikt-Belohnung nach Boss-Wellen.
2. Biome-Paletten für das 18x14-Feld (6 Akte) statt eines einzigen Steinbodens.
3. Status-/Rollen-Icons mit Form statt nur Farbe auf unseren vorhandenen Wesen.
4. Nachkampf-Statistik nach dem Vorbild des Scoreboards (Schaden/Heilung pro Einheit).
5. Zwei kurze, lizenzfreie Audio-Loops (Prep/Boss) – derzeit hat die App keine Audiodateien.

Siehe `docs/ASSET_BEDARF.md` für Grafiken, Audio, Fonts und Entscheidungen, die noch fehlen.
