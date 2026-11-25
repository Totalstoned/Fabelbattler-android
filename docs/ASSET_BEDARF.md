# Asset-Bedarf für Fabelbattler

Stand: 2026-11-25. Ziel: Stil der Referenz-APK (`How Many Dudes`) mechanisch
nachvollziehen – mit **unseren** 123 Einheiten, 51 Zaubern, 18 Gegnern und dem
18x14-Feld. Keine Grafiken, Texte oder Namen der Referenz übernehmen.

## Was schon da ist

| Bereich | Vorhanden |
|---|---|
| Spiellogik | `app/src/main/assets/index3d.html`: Three.js, prozedurale Körper, Steinboden, 18x14-Feld |
| Wesen-Grafik | `creatures/bigfoot/`: `reference.jpg`, `turntable.png` (4x2-Ansichten), `source.json`, `turntable_prompt.txt` – 1 von 123 Einheiten |
| Referenz-Analyse | `docs/REFERENCE_APK.md` (automatisch aus `scripts/reference_apk.py`) |
| CC0-Bibliothek | `/root/projects/FABELBATTLER/asset-library/`: ~1,1 GiB, 55.717 Dateien aus `Tiddybub/2d-assets` (ui, fantasy, tiles-terrain, characters, effects, nature, misc, modern-urban), inkl. `LICENSE` und `catalog.json` |
| APK | `1.20.1.apk`, 1,7 MB – die_library darf nicht direkt hinein |

## Bedarf nach Priorität

### P0 – Entscheidung, die alles andere blockiert

1. **Stil festlegen.** Referenz wirkt wie freundliche, klare 2D-/Low-Poly-Tiergrafik mit
   dicken Konturen und gut lesbaren Icons. Optionen:
   - A) 4x2-Turntable-Atlas pro Einheit wie bei Bigfoot (konsistent mit Three.js, teuer: 123 Atlasse).
   - B) CC0-2D-Sprites aus der Bibliothek pro Rolle/Klasse/Rasse (schnell, aber Stilbruch im 3D-Feld).
   - C) Hybrid: prozedurale 3D-Körper + 2D-Porträt-/Status-Icons (empfohlen: kleinen Umfang, sofort umsetzbar).
2. **Core-Trio zuerst:** Bigfoot, Chupacabra, Fee – dann der Rest in Batchen à 10.
3. **Zielgröße:** kuratierte, komprimierte Assets ~2–5 MB im APK, nicht die 1,1 GiB Rohdaten.

### P1 – Grafiken

- [ ] 18 Gegner-Sprites/-Modelle: `oma`, `opa`, `feuerwehr`, `soldat`, `missionar`, `sanitaeter`,
      `rebelle`, `armee`, `bundeswehr`, `soeldner`, `teddy`, `feuerwehrwagen`, `krankenwagen`,
      `panzer`, `hubschrauber`, `kampfflugzeug`, `drohne`, `kampftruppe`.
      Quellen in der Bibliothek: `characters/`, `modern-urban/`, `misc/`; Fahrzeuge `vehicles/`
      (im ersten Download nicht entpackt).
- [ ] 6 Biome-Paletten für das 18x14-Feld (Feld / Flats / Ödnis / Höhle / Berg / Arena) –
      eigene Farben, eigene Namen, abgeleitet aus den 6 Akten der Referenz.
      Quellen: `tiles-terrain/`, `nature/`.
- [ ] Rundenkarte/Vorschau-Icons: Standard, Elite×N, Boss, Shop, Lager, Event.
- [ ] 8–12 Relikt- und 4–6 Trinket-Icons für ein leichtes Belohnungssystem nach Boss-Wellen
      (Referenz hat 264 Relikte / 31 Trinkets – wir brauchen nur eine kleine, eigene Auswahl).
- [ ] Status- und Rollen-Icons mit **Form** statt nur Farbe (Teilweise umgesetzt: `status-formen`).
- [ ] Goldstern, Scoreboard-Spalten, Sieg-/Niederlage-Banner.

### P2 – Audio (bei uns komplett leer)

- [ ] 2 kurze, lizenzfreie Loops: Prep-Runde und Boss-Kampf.
- [ ] SFX: Krit, Treffer, Tod, Gold, Sieg, Niederlage, Draft-Reroll.
- [ ] Quellen: CC0/OGA oder Kenney; Referenz hat 29 `.ogg` in `assets/`.

### P3 – Typografie und Lizenz

- [ ] 1 lizenzfreier UI-Font (z. B. OFL) für Zahlen, Level und Rundentitel; Referenz hat 12 `.ttf`.
- [ ] `docs/ASSET_SOURCES.md`: für jede übernommene Datei Quelle, Lizenz, Verarbeitung.
      Die Bibliothek liegt mit `LICENSE` (CC0) und `catalog.json` bereits bereit.

## Konkrete nächste Schritte

1. Stil option C wählen und Bigfoot-Porträt + Statusformen als Vorlage nehmen.
2. Aus `asset-library/characters/` und `modern-urban/` 18 Gegner-Kandidaten kuratieren und
   in `app/src/main/assets/sprites/` (neu) mit `LICENSE.txt` ablegen.
3. Sechs Boden-Paletten aus `tiles-terrain/` als 64x64-Kacheln zuschneiden; nur 6–12 Dateien,
   nicht ganze Packs.
4. Danach: einem Wesen pro Lauf ein Portrait geben, bis das Core-Trio komplett ist.

## Budget

Tagesbudget: 2 GiB (`scripts/download_budget.py`). Für die CC0-Bibliothek sind 1 GiB
reserviert und genutzt; der Rest bleibt für gezielte Einzeldownloads (Audio/Fonts).
