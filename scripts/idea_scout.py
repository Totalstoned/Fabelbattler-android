#!/usr/bin/env python3
"""Autonomer Ideen-Scout für Fabelbattler.

Der Scout sammelt kostenlos (ohne API-Key) Ideen aus:
  - DuckDuckGo HTML-Suche
  - Wikipedia REST API
  - öffentlicher GitHub-Suche
  - lokalen Doku-/Task-Dateien (damit nichts doppelt gemacht wird)

Ausgabe: docs/IDEA_BACKLOG.md. Mit --pick wird nur die beste offene Idee
ausgegeben – das ist der Einstieg für den 10-Minuten-Loop.
"""
from __future__ import annotations

import argparse
import html
import json
import re
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

from download_budget import reserve_download

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs' / 'IDEA_BACKLOG.md'
UA = 'FabelbattlerIdeaScout/1.0 (+autonomer 10-Minuten-Loop)'
TIMEOUT = 6

QUERIES = [
    'auto battler enemy intent telegraph design',
    'game feel hit stop damage feedback visual',
    'GameMaker draw_sprite_ext animated sprite effects',
    'auto battler positioning synergy design',
]
GH_QUERIES = [
    'auto battler game in:description language:javascript',
    'GameMaker VFX sprites in:description',
    'roguelike auto battler in:description',
]
WIKI_TOPICS = ['Auto battler', 'Roguelike', 'Game feel']

# Kuratierte, sofort umsetzbare Ideen. `done` markiert bereits erledigte Punkte.
SEEDS = [
    {
        'id': 'intent-telegraph',
        'title': 'Boss/Elite zeigt die nächste Aktion im Fokus-Panel',
        'hint': 'In index3d.html beim Fokus-Ziel eine Zeile wie „⚡ Blitz bereit in 1,2 s“ ergänzen; nur für Elite/Boss, nie für normale Mobs. deterministic & wahrhaftig halten.',
        'why': 'Enemy-intent-telegraph macht Kämpfe lesbar statt zufällig; Quelle: game-mechanics/concepts/enemy-intent-telegraph.',
        'fit': 5, 'effort': 2, 'risk': 2, 'tags': 'UI,Kampf-Feedback,Boss',
        'done': 'fokus-ziel',
    },
    {
        'id': 'hit-stop',
        'title': 'Mikro-Hit-Stop bei Krit und Kill (nur visuell)',
        'hint': 'Kurzen 40–70 ms Render-Freeze bei Krit/Tod einbauen; SIM/Tick unangetastet lassen, Headless-Simulation darf nicht langsamer werden.',
        'why': 'Game-Feel-Studien zeigen: Hit-Stop + Shake + ZahlenPopup trägt den Impact; Quelle: rozgames/arxiv 2208.06155.',
        'fit': 4, 'effort': 2, 'risk': 3, 'tags': 'GameFeel,Krit,Headless',
        'done': 'trefferimpuls',
    },
    {
        'id': 'creature-turntable',
        'title': 'Wesen-Referenzbilder → 8-Winkel-Turntable für 3D-Drehung',
        'hint': 'Mit scripts/creature_reference.py Wikimedia/Commons-Bilder laden (Budget buchen), daraus über das Bildgenerierungs-Tool ein 4x2-Turntable-Sheet erzeugen und als 8-Frame-Rotationsatlas in index3d.html anbinden. Zuerst mit bigfoot prototypeen.',
        'why': 'Userwunsch: echte Monster/Wesen-Grafiken aus Wikipedia/Google-Suche, in jede Richtung drehbar; kostenlos via Commons + Bild-Tool.',
        'fit': 5, 'effort': 3, 'risk': 3, 'tags': 'Grafik,3D,Wesen,Bildquellen',
        'done': 'creature-turntable',
    },
    {
        'id': 'post-battle-summary',
        'title': 'Kurze Nachkampf-Auswertung (Schaden, Heilung, Top-Einheit)',
        'hint': 'Am Sieg/Niederlage-Toast drei Werte anzeigen: Gesamtschaden, Heilung, stärkstes Wesen. Nur G-Gänze zählen, keine Simulation ändern.',
        'why': 'Auto-Battler leben von nachvollziehbaren Runden; Quelle: Wikipedia Auto battler + PC-Gamer-Genre-Überblick.',
        'fit': 4, 'effort': 2, 'risk': 1, 'tags': 'UI,Bilanz,Runden',
        'done': 'sieg-toast',
    },
    {
        'id': 'colorblind-shapes',
        'title': 'Status-Icons erhalten Formen statt nur Farbe',
        'hint': 'Statuseffekte (Stun, Burn, Schild, Regen) mit ◈/▲/⬟/✚ statt nur Farbe markieren; in check_data.py und check_runtime.js mitziehen.',
        'why': 'Barrierefreiheit: Form + Farbe bleibt bei Farbfehlsichtigkeit lesbar; Quelle: Game-Feel-/UI-Feedback-Artikel.',
        'fit': 4, 'effort': 2, 'risk': 1, 'tags': 'UI,Barrierefreiheit,Status',
        'done': 'fokusstatus',
    },
    {
        'id': 'free-model-pool',
        'title': 'Freie Modelle im 10-Minuten-Loop dokumentieren und umschaltbar machen',
        'hint': 'AUTO_MODEL=<freie Modell-ID> in scripts/auto-improve.sh auswerten; Standard bleibt opencode/big-pickle.',
        'why': 'Alle opencode/*-free-Modelle kosten 0; hilft bei leeren Kontingenten.',
        'fit': 5, 'effort': 1, 'risk': 1, 'tags': 'Autonomie,Kostenlos',
        'done': 'auto-model',
    },
    {
        'id': 'merge-duplicates',
        'title': 'Duplikat-Merge im Draft (3 gleiche Wesen → Stufe+1)',
        'hint': 'Vorsichtig: berührt Draft-Logik und Invarianten. Erst Harness-Vergleich, dann beide Checks anpassen.',
        'why': 'Duplikat-Merge ist Kernmechanik klassischer Auto-Battler; Quelle: Wikipedia Auto battler.',
        'fit': 4, 'effort': 4, 'risk': 4, 'tags': 'Draft,Balance',
        'done': 'teamwachstum',
    },
    {
        'id': 'spatial-synergy',
        'title': 'Nachbarschafts-Synergie auf dem 18x14-Feld',
        'hint': 'Nachbarn derselben Rolle geben kleinen Bonus; HUD zeigt „Nachbarschaft +N“. Nur nicht-Mobs zählen.',
        'why': 'Spatial synergies (Pack Tactics) machen Positionierung relevant; Quelle: dev.to/myjoinlong.',
        'fit': 3, 'effort': 4, 'risk': 3, 'tags': 'Position,Balance',
        'done': 'grosse-karte',
    },
    {
        'id': 'grid-inventory',
        'title': 'Rucksack-Grid für Kampfitsems',
        'hint': 'Zu groß für einen Lauf – in BACKLOG behalten, nicht jetzt anfangen.',
        'why': 'Grid-Inventar ist ein eigenes Genre-Modul; Quelle: game-mechanics/concepts/grid-inventory.',
        'fit': 2, 'effort': 5, 'risk': 5, 'tags': 'Items,Großprojekt',
        'done': 'items',
    },
]


def get(url: str) -> str:
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': '*/*'})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
        raw = resp.read()
    reserve_download(len(raw), url)
    return raw.decode('utf8', 'replace')


def strip_tags(text: str) -> str:
    return html.unescape(re.sub(r'<[^>]+>', '', text)).strip()


def duckduckgo(query: str) -> list[dict]:
    url = 'https://duckduckgo.com/html/?q=' + urllib.parse.quote_plus(query)
    raw = get(url)
    out = []
    for href, title in re.findall(
        r'class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)</a>', raw, re.S
    )[:5]:
        link = html.unescape(href)
        if link.startswith('//duckduckgo.com/l/'):
            qs = urllib.parse.parse_qs(urllib.parse.urlparse('https:' + link).query)
            link = qs.get('uddg', [link])[0]
        out.append({'title': strip_tags(title), 'url': link})
    return out


def github(query: str) -> list[dict]:
    url = ('https://api.github.com/search/repositories?q='
           + urllib.parse.quote(query) + '&sort=stars&per_page=5')
    data = json.loads(get(url))
    return [
        {
            'title': item['full_name'],
            'url': item['html_url'],
            'stars': item.get('stargazers_count', 0),
            'description': item.get('description') or '',
        }
        for item in data.get('items', [])
    ]


def wikipedia(topic: str) -> dict | None:
    slug = urllib.parse.quote(topic.replace(' ', '_'), safe='')
    data = json.loads(get('https://en.wikipedia.org/api/rest_v1/page/summary/' + slug))
    return {'title': data.get('title', topic), 'url': data.get('content_urls', {})
            .get('desktop', {}).get('page', ''), 'extract': data.get('extract', '')}


def local_done_text() -> str:
    parts = []
    for name in ('docs/TASKS.md', 'docs/APP_DEV_STATE.md', 'docs/PROJECT_README.txt'):
        path = ROOT / name
        if path.is_file():
            parts.append(path.read_text(encoding='utf8', errors='replace'))
    return '\n'.join(parts).lower()


def rank(done_text: str) -> list[dict]:
    ranked = []
    for seed in SEEDS:
        if seed['done'] in done_text:
            continue
        score = seed['fit'] * 3 - seed['effort'] - seed['risk']
        ranked.append({**seed, 'score': score})
    ranked.sort(key=lambda x: (-x['score'], x['id']))
    return ranked


def render(ranked: list[dict], web: dict, errors: list[str]) -> str:
    now = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')
    lines = [
        '# Ideen-Backlog (autonom gepflegt)',
        '',
        f'Letzter Scan: {now}',
        '',
        'Erzeugt von `scripts/idea_scout.py` – kostenlos, ohne API-Key. '
        'Der 10-Minuten-Agent startet jeden Lauf mit `python3 scripts/idea_scout.py --pick`.',
        '',
        '## querelle (höchste Priorität zuerst)'.replace('querelle', 'Priorisiert'),
        '',
        '| Idee | Nutzen | Aufwand | Risiko | Score | Tags |',
        '|---|---:|---:|---:|---:|---|',
    ]
    for item in ranked:
        lines.append(
            f"| {item['title']} | {item['fit']} | {item['effort']} | "
            f"{item['risk']} | {item['score']} | {item['tags']} |"
        )
    lines += ['', '## Nächster konkreter Schritt', '']
    if ranked:
        best = ranked[0]
        lines += [f"**{best['title']}**", '', best['hint'], '', f"Warum: {best['why']}"]
    else:
        lines += ['Alle kuratierten Ideen sind umgesetzt. Neue Funde bitte in SEEDS ergänzen.']

    lines += ['', '## Web- und Git-Funde', '']
    for group, entries in web.items():
        lines.append(f'### {group}')
        lines.append('')
        if not entries:
            lines.append('_Keine Treffer._')
        for entry in entries:
            if 'stars' in entry:
                lines.append(f"- [{entry['title']}]({entry['url']}) "
                             f"★{entry['stars']} – {entry['description'][:120]}")
            elif 'extract' in entry:
                lines.append(f"- [{entry['title']}]({entry['url']}) – "
                             f"{entry['extract'][:220]}")
            else:
                lines.append(f"- [{entry['title']}]({entry['url']})")
        lines.append('')
    if errors:
        lines += ['## Netzwerk-Hinweise', '']
        lines += [f'- {err}' for err in errors]
        lines.append('')
    lines += [
        '## Kostenlose Modelle für den Loop',
        '',
        '`opencode/big-pickle` (Standard), `opencode/tidepool-alpha-free`, '
        '`opencode/hy4-flash-free`, `opencode/iceman-free`, '
        '`opencode/flint-40b-free`, `opencode/deepseek-v4.1-flash-free`, '
        '`opencode/nemotron-3.5-super-vl-free`, `opencode/beam-free`, '
        '`opencode/mimo-v2.6-flash-free`, `opencode/nemotron-3.5-lightning-free`.',
        '',
        'Umschalten mit `AUTO_MODEL=<Modell-ID>` beim Start des Loops.',
        '',
    ]
    return '\n'.join(lines)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--offline', action='store_true', help='nur lokale Seeds auswerten')
    ap.add_argument('--pick', action='store_true', help='nur die beste Idee ausgeben')
    ap.add_argument('--json', action='store_true', help='Ranking als JSON ausgeben')
    args = ap.parse_args()

    ranked = rank(local_done_text())
    if args.pick:
        if not ranked:
            print('Keine offene Idee – SEEDS in scripts/idea_scout.py ergänzen.')
            return 0
        best = ranked[0]
        print(f"{best['title']} :: {best['hint']}")
        return 0
    if args.json:
        print(json.dumps(ranked, ensure_ascii=False, indent=2))
        return 0

    web: dict[str, list[dict]] = {}
    errors: list[str] = []
    if not args.offline:
        for label, query in enumerate(QUERIES, 1):
            try:
                web[f'DuckDuckGo: {query}'] = duckduckgo(query)
            except Exception as exc:
                errors.append(f'DuckDuckGo {query}: {type(exc).__name__}: {exc}')
        for query in GH_QUERIES:
            try:
                web[f'GitHub: {query}'] = github(query)
            except Exception as exc:
                errors.append(f'GitHub {query}: {type(exc).__name__}: {exc}')
        for topic in WIKI_TOPICS:
            try:
                result = wikipedia(topic)
                if result:
                    web[f'Wikipedia: {topic}'] = [result]
            except Exception as exc:
                errors.append(f'Wikipedia {topic}: {type(exc).__name__}: {exc}')

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(render(ranked, web, errors), encoding='utf8')
    print(f'OK {OUT.relative_to(ROOT)}: {len(ranked)} offene Ideen, '
          f'{len(web)} Web-/Git-Quellen, {len(errors)} Hinweise')
    return 0


if __name__ == '__main__':
    sys.exit(main())
