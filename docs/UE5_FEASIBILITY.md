# UE5-Machbarkeit, Größe und Play-Store-Beispiele

Stand 2026-11-26. Recherche ohne Wikipedia/Wikimedia. Der In-App-Browser war in dieser Sitzung nicht verbunden, daher direkte Web-Abfragen.

## Kurzantwort
Ja, es gibt Play-Store-Spiele mit Unreal Engine 5 – auch mit zweistelligen Millionen-Downloads. Ein Umstieg ist technisch möglich, aber für Fabelbattler derzeit nicht nötig: Die aktive App ist 2,0 MB (Three.js/WebView) und die komplette Spiellogik liegt in `index3d.html`. Ein Engine-Wechsel bedeutet einen Neuaufbau, keine Konvertierung.

## Beispiele im Play Store (Live-Einträge, geprüft)
- **Fortnite** (Epic Games): Play-Store-Seite `com.epicgames.fortnite`, 10M+ Downloads, zuletzt aktualisiert 17.11.2026. Fortnite ist Epics eigenes UE5-Flaggschiff; die mobile Fassung nutzt dieselbe Engine-Generation. Quelle: https://play.google.com/store/apps/details?id=com.epicgames.fortnite
- **Delta Force** (Level Infinite / Team Jade): Play-Store-Seite `com.proxima.dfm`, 10M+ Downloads, Update 30.10.2026. Offizielle Trailer heißen explizit „Unreal Engine 5 Warfare Features“. Quelle: https://play.google.com/store/apps/details?id=com.proxima.dfm und https://www.ign.com/videos/delta-force-official-unreal-engine-5-warfare-features-trailer
- Vorsicht: Die Play-Store-Suche nach „Unreal Engine 5“ liefert überwiegend Tutorials und Demos, nicht das Engine-Merkmal. Die Engine muss über Entwickler-/Verlagsquellen belegt werden.

## Engine-Stand
Epic dokumentiert Android/Linux-Mobilentwicklung direkt in der UE-Dokumentation (z. B. „Android Application Development with Unreal Engine“, Version 5.6; die Docs-Suche zeigt 2026 bereits 5.9).Für Mobilgeräte werden typischerweise der Mobile Renderer und reduzierte Skalierstufen genutzt; Nanite/Lumen sind dort nicht uneingeschränkt verfügbar. Das heißt: UE5 auf Android ist real, aber nicht mit PC-Bildqualität gleichzusetzen.

## Wie groß könnte Fabelbattler werden?
Realistische Größenordnung für einen UE5-Build mit 123 Einheiten, 8-Blickwinkel-Atlanten, Texturen und VFX:

| Variante | Download/Install geschätzt | Anmerkung |
| --- | --- | --- |
| Aktueller WebView-Build | ~2 MB | Three.js lokal, Texturen klein |
| UE5, sparsam (Mobile Renderer, 512px-Texturen) | ~150–350 MB | Engine-Bibliotheken dominieren |
| UE5, mittel (1K-Texturen, VFX, Audio) | ~350 MB–1,5 GB | Größenordnung großer Mobile-Titel |
| UE5, hoch (4K/hochauflösende Assets) | 2–4 GB | nur mit Asset Packs sinnvoll |

Google-Play-Rahmen (offizielle Doku):
- Android App Bundle ist Pflicht; compilation APKs müssen zusammen ≤ 4 GB komprimiert sein.
- Über 200 MB geht nur mit Play Feature Delivery oder Play Asset Delivery.
- Asset Packs zählen **nicht** in die 4-GB-Grenze, haben aber eigene Limits.
- Quellen: https://developer.android.com/guide/app-bundle und https://support.google.com/googleplay/android-developer/answer/9859152

Empfehlung bei Umstieg: AAB + Play Asset Delivery, Einheiten-/Atlas-Packs pro Rasse, Basis-ZIP klein halten. So bleibt der Erstdownload klein und spätere Waves laden nach.

## Fazit
- Für die aktuellen Ziele (bessere Grafik, CC0-Atlanten, Kampfansicht) reicht Three.js völlig; ein Wechsel würde die Checks, den Headless-Simulator und die WebView-Architektur obsolet machen.
- Falls UE5 später gewünscht ist: zuerst eine einzelne Welle als Prototyp bauen, Größenlimit und Bildqualität auf echten Geräten messen, dann entscheiden.
- Ein Wechsel braucht ausdrückliche Freigabe (AGENTS.md: keine Engine-Änderung ohne Rückfrage).
