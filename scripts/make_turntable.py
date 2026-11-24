#!/usr/bin/env python3
"""Baut aus einem Referenzbild einen 8-Winkel-Turntable-Atlas (4x2).

Fallback, wenn kein Bildgenerierungs-Guthaben verfügbar ist: Die 8 Zellen
werden mit ImageMagick aus dem Referenzbild abgeleitet (Vorder-/Rückseite,
3/4- und Seitenansicht durch Stauchen/Spiegeln/Abdunkeln). Das ist kein echtes
Photogrammetrie-Modell, aber ein sofort in Three.js nutzbarer Rotations-Atlas
für Wesen, die man aus jeder Richtung sehen können soll.

Beispiel:
  python3 scripts/make_turntable.py \
      app/src/main/assets/creatures/bigfoot/reference.jpg \
      app/src/main/assets/creatures/bigfoot/turntable.png
"""
from __future__ import annotations

import argparse
import subprocess
import tempfile
from pathlib import Path

CELL = 256
ANGLES = [
    ('front',       []),
    ('right34',     ['-resize', '72%x100%']),
    ('right_side',  ['-resize', '40%x100%']),
    ('right_back',  ['-flop', '-resize', '72%x100%', '-modulate', '72']),
    ('back',        ['-flop', '-modulate', '65']),
    ('left_back',   ['-resize', '72%x100%', '-modulate', '72']),
    ('left_side',   ['-flop', '-resize', '40%x100%']),
    ('left34',      ['-flop', '-resize', '72%x100%']),
]


def sh(cmd: list[str]) -> None:
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('reference', type=Path)
    ap.add_argument('output', type=Path)
    args = ap.parse_args()
    if not args.reference.is_file():
        raise SystemExit(f'Referenz fehlt: {args.reference}')

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='fb-turntable-') as tmp:
        work = Path(tmp)
        cells = []
        for i, (name, extra) in enumerate(ANGLES):
            cell = work / f'{i:02d}-{name}.png'
            sh([
                'convert', str(args.reference),
                '-background', 'none', '-alpha', 'on',
                '-fuzz', '10%', '-transparent', 'white',
                '-trim', '+repage', '-resize', f'{CELL - 24}x{CELL - 24}>',
                *extra,
                '-gravity', 'center', '-extent', f'{CELL}x{CELL}',
                str(cell),
            ])
            cells.append(cell)
        rows = []
        for row in range(2):
            out = work / f'row{row}.png'
            sh(['convert', *(str(c) for c in cells[row * 4:(row + 1) * 4]),
                '+append', str(out)])
            rows.append(out)
        sh(['convert', *(str(r) for r in rows), '-append', str(args.output)])

    print(f'OK {args.output} ({CELL * 4}x{CELL * 2}, {len(ANGLES)} Winkel)')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
