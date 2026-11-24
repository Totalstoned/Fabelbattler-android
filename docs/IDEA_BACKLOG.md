# Ideen-Backlog (autonom gepflegt)

Letzter Scan: 2026-11-24 17:37 UTC

Erzeugt von `scripts/idea_scout.py` – kostenlos, ohne API-Key. Der 10-Minuten-Agent startet jeden Lauf mit `python3 scripts/idea_scout.py --pick`.

Autonomer Stand 2026-11-24: Der `--pick`-Vorschlag (Boss/Elite-Intent, Task 49), die Idee „Status-Icons erhalten Formen“ (Task 52), der Bigfoot-Atlas (Task 51) und die kurze Nachkampf-Auswertung (Task 53) sind geliefert. Der Scout schlägt weiterhin den bereits umgesetzten Boss-Intent vor – die nächste offene Idee ist der Mikro-Hit-Stop bei Krit und Kill (nur visuell). Diesen Lauf wurde nichts heruntergeladen, das Budget bleibt bei 0,5 MiB / 2048 MiB.

## Priorisiert (höchste Priorität zuerst)

| Idee | Nutzen | Aufwand | Risiko | Score | Tags |
|---|---:|---:|---:|---:|---|
| Boss/Elite zeigt die nächste Aktion im Fokus-Panel | 5 | 2 | 2 | 11 | UI,Kampf-Feedback,Boss |
| Status-Icons erhalten Formen statt nur Farbe | 4 | 2 | 1 | 9 | UI,Barrierefreiheit,Status |
| Kurze Nachkampf-Auswertung (Schaden, Heilung, Top-Einheit) | 4 | 2 | 1 | 9 | UI,Bilanz,Runden |
| Mikro-Hit-Stop bei Krit und Kill (nur visuell) | 4 | 2 | 3 | 7 | GameFeel,Krit,Headless |
| Duplikat-Merge im Draft (3 gleiche Wesen → Stufe+1) | 4 | 4 | 4 | 4 | Draft,Balance |
| Nachbarschafts-Synergie auf dem 18x14-Feld | 3 | 4 | 3 | 2 | Position,Balance |
| Rucksack-Grid für Kampfitsems | 2 | 5 | 5 | -4 | Items,Großprojekt |

## Nächster konkreter Schritt

**Mikro-Hit-Stop bei Krit und Kill (nur visuell)**

Kritische Treffer und Todesstöße kurz (ein paar Frame-Ticks) visuell einfrieren, ohne Simulationszeit, Cooldowns oder Headless-Ergebnisse zu verändern.

Warum: Die drei höchstbewerteten Ideen (Boss-Intent, Status-Formen, Nachkampf-Auswertung) sind umgesetzt; der Hit-Stop ist die nächste noch offene Idee mit gutem Nutzen/Aufwand-Verhältnis. Quelle: game-mechanics/concepts/hit-stop.

## Web- und Git-Funde

## Kostenlose Modelle für den Loop

`opencode/big-pickle` (Standard), `opencode/tidepool-alpha-free`, `opencode/hy4-flash-free`, `opencode/iceman-free`, `opencode/flint-40b-free`, `opencode/deepseek-v4.1-flash-free`, `opencode/nemotron-3.5-super-vl-free`, `opencode/beam-free`, `opencode/mimo-v2.6-flash-free`, `opencode/nemotron-3.5-lightning-free`.

Umschalten mit `AUTO_MODEL=<Modell-ID>` beim Start des Loops.
