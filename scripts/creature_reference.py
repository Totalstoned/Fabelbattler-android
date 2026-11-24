#!/usr/bin/env python3
"""Lädt kostenlos Referenzbilder für Wesen/Monster (Wikimedia Commons).

Der User hat 2 GiB Download pro UTC-Tag ohne Rückfrage freigegeben. Alle
Downloads werden über scripts/download_budget.py gebucht. Das Ergebnis ist
ein Referenzbild plus ein fertiger Prompt für ein 8-Winkel-Turntable, aus dem
die Engine später eine in jede Richtung drehbare 3D-Grafik baut.

Beispiel:
  python3 scripts/creature_reference.py bigfoot chupacabra fee
"""
from __future__ import annotations

import argparse
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

from download_budget import reserve_download

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'app' / 'src' / 'main' / 'assets' / 'creatures'
API = 'https://commons.wikimedia.org/w/api.php'
UA = ('FabelbattlerCreatureReference/1.0 '
      '(https://github.com/Totalstoned/Fabelbattler-android; autonomer Agent)')


def api(params: dict) -> dict:
    url = API + '?' + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'application/json'})
    with urllib.request.urlopen(req, timeout=15) as resp:
        raw = resp.read()
    reserve_download(len(raw), url)
    return json.loads(raw.decode('utf8', 'replace'))


def search_images(name: str, limit: int = 8) -> list[dict]:
    data = api({
        'action': 'query', 'generator': 'search',
        'gsrsearch': f'filetype:bitmap {name}', 'gsrnamespace': '6',
        'gsrlimit': str(limit), 'prop': 'imageinfo',
        'iiprop': 'url|size|extmetadata', 'iiurlwidth': '512',
        'format': 'json',
    })
    pages = data.get('query', {}).get('pages', {})
    items = []
    for page in pages.values():
        info = (page.get('imageinfo') or [{}])[0]
        url = (info.get('thumburl') or info.get('url') or '').split('?')[0]
        if not url:
            continue
        meta = info.get('extmetadata', {})
        items.append({
            'title': page.get('title', ''),
            'url': url,
            'page': info.get('descriptionurl', ''),
            'license': meta.get('LicenseShortName', {}).get('value', ''),
            'artist': re.sub('<[^>]+>', '', meta.get('Artist', {}).get('value', ''))[:120],
            'width': info.get('width'), 'height': info.get('height'),
        })
    return items


def download(url: str, target: Path) -> None:
    url = url.split('?')[0]
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'image/*'})
    with urllib.request.urlopen(req, timeout=30) as resp:
        raw = resp.read()
    reserve_download(len(raw), url)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(raw)


def turntable_prompt(name: str) -> str:
    return (
        f'Using the attached reference image of "{name}", create one clean 4x2 '
        'turntable sprite sheet of the SAME creature in 8 evenly spaced yaw '
        'angles: 0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°. Every cell has '
        'identical scale, lighting and pose except for rotation. Transparent '
        'background, centered subject, game-ready stylized fantasy creature, '
        'no text, no border, no extra limbs. The sheet must be usable as an '
        '8-frame rotation atlas in a real-time 3D game.'
    )


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('names', nargs='+', help='Wesenname, z. B. bigfoot')
    ap.add_argument('--limit', type=int, default=8)
    ap.add_argument('--slug', help='Zielordner überschreiben, z. B. bigfoot')
    ap.add_argument('--dry-run', action='store_true', help='nur URLs anzeigen')
    args = ap.parse_args()

    for name in args.names:
        slug = args.slug or re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
        results = search_images(name, args.limit)
        if not results:
            print(f'KEIN BILD: {name}')
            continue
        pick = results[0]
        print(f'{name}: {pick["title"]} – {pick["url"]} ({pick["license"]})')
        if args.dry_run:
            continue
        folder = ASSETS / slug
        folder.mkdir(parents=True, exist_ok=True)
        ref = folder / 'reference.jpg'
        download(pick['url'], ref)
        (folder / 'source.json').write_text(
            json.dumps({'name': name, **pick}, ensure_ascii=False, indent=2) + '\n',
            encoding='utf8')
        (folder / 'turntable_prompt.txt').write_text(
            turntable_prompt(name) + '\n', encoding='utf8')
        print(f'OK {ref.relative_to(ROOT)} ({ref.stat().st_size} Bytes)')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
