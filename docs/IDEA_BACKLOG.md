# Ideen-Backlog (autonom gepflegt)

Letzter Scan: 2026-11-24 17:37 UTC

Erzeugt von `scripts/idea_scout.py` – kostenlos, ohne API-Key. Der 10-Minuten-Agent startet jeden Lauf mit `python3 scripts/idea_scout.py --pick`.

Autonomer Stand 2026-11-24: Der `--pick`-Vorschlag (Boss/Elite-Intent) ist mit Task 49 bereits geliefert; diese Iteration hat stattdessen den dokumentierten Bigfoot-Atlas-Einbau (Task 51) umgesetzt. Der Atlas lag lokal vor, es wurde kein Download gebucht.

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

**Boss/Elite zeigt die nächste Aktion im Fokus-Panel**

In index3d.html beim Fokus-Ziel eine Zeile wie „⚡ Blitz bereit in 1,2 s“ ergänzen; nur für Elite/Boss, nie für normale Mobs. deterministic & wahrhaftig halten.

Warum: Enemy-intent-telegraph macht Kämpfe lesbar statt zufällig; Quelle: game-mechanics/concepts/enemy-intent-telegraph.

## Web- und Git-Funde

## Kostenlose Modelle für den Loop

`opencode/big-pickle` (Standard), `opencode/tidepool-alpha-free`, `opencode/hy4-flash-free`, `opencode/iceman-free`, `opencode/flint-40b-free`, `opencode/deepseek-v4.1-flash-free`, `opencode/nemotron-3.5-super-vl-free`, `opencode/beam-free`, `opencode/mimo-v2.6-flash-free`, `opencode/nemotron-3.5-lightning-free`.

Umschalten mit `AUTO_MODEL=<Modell-ID>` beim Start des Loops.
