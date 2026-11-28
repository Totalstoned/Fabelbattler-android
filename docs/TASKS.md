# TASKS – Mechanik-Pivot (ab 2026-11-26)

Frühere Grafik-Ziele sind zurückgestellt. Neue Reihenfolge: Fähigkeiten, dann UI-Rückmeldung, dann optional Grafik.

## Erledigt in 1.22.9 / 1.23.0 / 1.23.1 / 1.23.2 / 1.23.3 / 1.23.4
- [x] **82. Orientierung neu schreiben**: `/root/projects/FABELBATTLER/AGENTS.md`, `FRAGEN.md` und diese `TASKS.md` auf Mechanik zuerst umgestellt; Fragekatalog für 10-Minuten-Intervalle.
- [x] **83. Godzilla-Atomstrahl**: `SPELLS.atomstrahl/multi_atom/schmelzstrahl` sind `charge=true`; `tickMechanics()` lädt, `castMechanic()` nutzt `sp.range + 2*charge` und `dmg*(1+0.6*charge)` plus Burn/Splash. Ladegrenze steigt mit Level/Boss/Elite (1–3 s). Check-Token `atomladung`.
- [x] **84. King-Kong-Sturm**: `+50 %` Tempo für 4 s (`speedSurge`), Sturm auf das Ziel mit höchstem ATK, Spott 3 s und Kurz-Betäubung. Check-Token `koenig-kong-sturm`.
- [x] **85. Feen/Wald**: im 4-Schritt-Zyklus `Ruf der Natur` (6 s HoT, 50 % ATK), `Feenkraft` (+10 % Max-HP solange beide leben, `breakBond()` bei Tod), `Feenstaub` (Betörung aller Gegner), `Waldgeflüster` (Teamheilung nur wenn alle verletzt). Check-Token `feen-wald`.
- [x] **86. Rumpelstilzchen**: 3-Schritt-Zyklus `Kessel-Sprung` (Aufladung + Splash), `Lied` (Betörung), `Kindraub` (Dauer-Spott + Ziel wird in die Ecke gelockt). Check-Token `rumpel-zauber`.
- [x] **88. CC0-Universal-Animation integriert**: `models/universal_animation.glb` (7,6 MB, Quaternius CC0, 43 Clips) wird über lokal gepatchte `vendor/GLTFLoader.js` + `vendor/SkeletonUtils.js` geladen. Menschliche Einheiten nutzen das skelettbasierte Modell statt der prozeduralen Puppe; Clips folgen Idle/Walk/Sprint/Punch/Hit/Dance/Death. Pause friert den Mixer (`dt=0`). Check-Token `universal-animation`.
- [x] **89. Sechs menschliche CC0-Atlanten**: `missionar`, `sanitaeter`, `rebelle`, `armee`, `bundeswehr`, `soeldner` sind jetzt registriert (82/123), mit `CC0_SOURCE.md`; Token `24-neue-atlanten`.

## Aktiv / nächster Block
- [x] **87. Fragen und UI (Feedback 1)**: User-Antworten: Atomladung sofort **1/2/3 s** (nicht levelabhängig), HUD/Pause/Startbild **unverändert**, als Design-Alternative **Ladeleiste** gewählt.
- [x] **90. Ladeleiste**: `makeChargeBar()` über dem Wesen; zeigt Atomladung (0–3 s) und Rumpels Kessel (0–2 s), voll = gelb. Evolutionsstufe wirkt jetzt über `mechanicEvolution()` auf den Schaden statt auf die Ladedauer. Token `ladeleiste-3s`.
- [x] **91. Feedback-Block 2**: Fähigkeiten bleiben; Ladeleiste nun violett→pink; Status-Icons im Feld umgesetzt (gecachte Emoji-Texturen, gültig auch für `regrow`/`taunt`). Token `status-icons`.
- [x] **92. Feedback-Block 3 / Fähigkeits-Log**: Antwort „5“ aus `FRAGEN.md` = Fähigkeits-Log. `logAbility()` schreibt maximal drei Zeilen (je 3 s) über die Kampfleiste, nur für Heldenzauber; Token `faehigkeits-log`. Mechanik und Icons bleiben unverändert.
- [x] **93. Feedback-Block 4 / Fokus-Pfeil**: Mechanik und Log bleiben; Design-Option 1 umgesetzt. `makeFocusArrow()` markiert verspottete Gegner gelb und kindgeraubte/eckgelockte Gegner pink. Token `fokus-pfeil`.
- [x] **94. Feedback-Block 5 / CC0-Modelle**: Mechanik und UI bleiben; Design-Option 4 umgesetzt. `adventurer.glb` und elf GLBs aus `Ultimate Modular Men Pack` liegen unter `models/` bzw. `models/modular/`; `loadCc0ModelLibrary()` laedt sie lokal, `cc0ClipMap()` bildet ihre 24 Clips auf die generischen Kampf-Clips ab. Token `cc0-modelle`.
- [ ] **95. Nächster Frageblock**: Evolutionsstufen, frischer Screenshot oder Grafik? erneut abfragen.

## Zurückgestellt (nicht verworfen)
- Übrige 41 Wesen-Atlanten, weitere Stadt-Dekoration, echtes Sprite-/Engine-Upgrade.
- Visuelle Bestätigung auf dem Gerät: frischer Screenshot nach dem 5-s-Startbild fehlt weiterhin.

## Erledigt (historisch, kurz)
- 1.22.7: 5-s-Startbild, hellere Stadt, gestaffelte Labels.
- 1.22.8: Torii, Pagoden, Neon, Taxis als Kulisse.
- Pause, Menschenquote 938:62, Garnison/Höhenreichweite, Panzer und Shin-Godzilla sind grün.
