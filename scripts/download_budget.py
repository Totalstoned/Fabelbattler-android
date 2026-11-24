#!/usr/bin/env python3
"""Tägliches Download-Budget für den autonomen Agenten (Standard: 2 GiB).

Der User hat freigegeben, dass bis zu 2 GB pro UTC-Tag ohne Rückfrage
heruntergeladen werden darf. Alle Netzfunktionen (aktuell idea_scout.py)
buchen ihre Bytes hier ein. Bei Überschreitung wird der Download verweigert.

Beispiele:
  python3 scripts/download_budget.py status
  python3 scripts/download_budget.py reserve 1048576 "VFX-Pack"
  python3 scripts/download_budget.py reset
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

DEFAULT_LIMIT = 2 * 1024 ** 3  # 2 GiB pro UTC-Tag
BUDGET_FILE = Path(os.environ.get(
    'FABEL_DOWNLOAD_BUDGET',
    '/root/projects/FABELBATTLER/download_budget.json',
))


class BudgetError(RuntimeError):
    pass


def _today() -> str:
    return datetime.now(timezone.utc).strftime('%Y-%m-%d')


def _load() -> dict:
    data = {'date': _today(), 'bytes': 0, 'entries': [], 'limit': DEFAULT_LIMIT}
    if BUDGET_FILE.is_file():
        try:
            stored = json.loads(BUDGET_FILE.read_text(encoding='utf8'))
            if stored.get('date') == _today():
                data.update(stored)
        except (OSError, ValueError):
            pass
    data['date'] = _today()
    data.setdefault('limit', DEFAULT_LIMIT)
    data.setdefault('entries', [])
    return data


def _save(data: dict) -> None:
    BUDGET_FILE.parent.mkdir(parents=True, exist_ok=True)
    BUDGET_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n',
                           encoding='utf8')


def used_bytes() -> int:
    return int(_load().get('bytes', 0))


def reserve_download(size: int, label: str = '') -> None:
    """Bucht `size` Bytes auf den heutigen Tag. Wirft BudgetError bei Überzug."""
    size = max(0, int(size))
    data = _load()
    limit = int(data.get('limit', DEFAULT_LIMIT))
    if data['bytes'] + size > limit:
        raise BudgetError(
            f'Download-Budget überschritten: {data["bytes"]}/{limit} Bytes '
            f'bereits verbraucht, {size} Bytes angefordert ({label})'
        )
    data['bytes'] += size
    data['entries'].append({
        'at': datetime.now(timezone.utc).strftime('%H:%M:%SZ'),
        'bytes': size,
        'label': label[:160],
    })
    del data['entries'][-200:]
    _save(data)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    sub = ap.add_subparsers(dest='cmd')
    sub.add_parser('status')
    res = sub.add_parser('reserve')
    res.add_argument('bytes', type=int)
    res.add_argument('label', nargs='?', default='')
    sub.add_parser('reset')
    args = ap.parse_args()

    if args.cmd in (None, 'status'):
        data = _load()
        limit = int(data.get('limit', DEFAULT_LIMIT))
        used = int(data.get('bytes', 0))
        print(f"{data['date']}: {used / 2**20:.1f} MiB / {limit / 2**20:.0f} MiB "
              f"({100 * used / max(1, limit):.2f} %), "
              f"frei {(limit - used) / 2**20:.1f} MiB")
        print(f"Datei: {BUDGET_FILE}")
        return 1 if used > limit else 0

    if args.cmd == 'reserve':
        try:
            reserve_download(args.bytes, args.label)
        except BudgetError as exc:
            print(f'ABGELEHNT: {exc}', file=sys.stderr)
            return 2
        data = _load()
        print(f"OK {args.bytes} Bytes gebucht; heute {data['bytes']}/{data['limit']} Bytes")
        return 0

    if args.cmd == 'reset':
        _save({'date': _today(), 'bytes': 0, 'entries': [], 'limit': DEFAULT_LIMIT})
        print('Budget für heute zurückgesetzt')
        return 0

    ap.print_help()
    return 0


if __name__ == '__main__':
    sys.exit(main())
