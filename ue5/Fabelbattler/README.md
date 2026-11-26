# Fabelbattler – UE5-Windows-Prototyp

Dieses Verzeichnis ist ein **Gerüst**, keine fertige `.exe`. Es lässt sich ohne installierte Engine prüfen; zum Bauen brauchst du einen Windows-/Linux-PC mit **UE 5.7 oder neuer** (Google Play verlangt SDK 35) und Epic-Konto.

## Daten aktualisieren
```
python3 scripts/export_ue5_data.py
```
Schreibt `Content/Data/units.json` mit allen 123 Einheiten aus `index3d.html`.

## Windows-EXE bauen (auf deinem PC)
1. UE 5.7+ installieren, Android/Windows-Toolchain und NDK r27c mitinstallieren.
2. `Fabelbattler.uproject` doppelklicken → „Generate Visual Studio project files“ bestätigen.
3. Editor öffnen, Map `/Game/Maps/Arena` anlegen und speichern.
4. `File → Package Project → Windows (64-bit)` → Zielordner wählen.
5. Ergebnis: `<Zielordner>/Windows/Fabelbattler.exe`.

Der Prototyp spawnt eine Welle Menschen gegen Monster, nutzt die exportierten Namen und die Größenverhältnisse 0,27 / 0,45 und wechselt alle 20 Sekunden die Welle.

## Winlator
Winlator kann Windows-Programme auf Android starten, aber UE5-Spiele brauchen Vulkan, viel RAM und einen leistungsfähigen GPU-Treiber. Die `.exe` ist primär für den PC gedacht; auf dem Handy ist der WebView-Build (`1.21.3.apk`) die funktionierende Variante.

## Wichtig
Die aktive App bleibt `app/src/main/assets/index3d.html`. Dieses Gerüst ist ein zusätzlicher Weg für später – kein Ersatz und kein lauffähiger Engine-Wechsel ohne Freigabe.
