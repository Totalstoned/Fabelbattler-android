#!/usr/bin/env python3
"""Referenz-APK auslesen und einen kompakten Abgleich mit Fabelbattler schreiben.

Der 10-Minuten-Loop startet jeden Lauf mit diesem Skript. Es liest nur die
vorhandene APK (kein Netz, kein Extrahieren großer Assets) und schreibt
docs/REFERENCE_APK.md. Daraus wählt der Agent genau EINE kleine Idee und
überträgt sie auf UNSERE Einheiten und unsere 18x14-Map – nie durch Kopieren
der Referenz-Grafiken oder -Texte.
"""
from pathlib import Path
import argparse
import collections
import hashlib
import json
import re
import zipfile

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_APK = Path('/root/projects/FABELBATTLER/How-Many-Dudes-v100.1.35-full-apkvision.apk')
OUT = ROOT / 'docs' / 'REFERENCE_APK.md'
PLURALS = re.compile(r'_(plural|many|few|extended_singular|extended_plural)$')


def unique_names(strings, prefix):
    """Zählt echte Namen (`<prefix>foo_name`) ohne Plural-/Textvarianten."""
    found = set()
    for entry in strings:
        key = entry.get('key', '')
        if key.startswith(prefix) and key.endswith('_name') and not PLURALS.search(key):
            found.add(key[len(prefix):-len('_name')])
    return sorted(found)


def read_reference(apk_path):
    with zipfile.ZipFile(apk_path) as zf:
        names = zf.namelist()
        strings = json.loads(zf.read('assets/localization/english.json'))['strings']
        options = zf.read('assets/options.ini').decode('utf-8', 'replace')
        achievements = json.loads(zf.read('assets/achievements/achievements.json'))['achievements']
        digest = hashlib.sha256()
        with apk_path.open('rb') as fh:
            for chunk in iter(lambda: fh.read(1024 * 1024), b''):
                digest.update(chunk)

    version = ''
    for key in ('MajorVersion', 'MinorVersion', 'BuildVersion'):
        match = re.search(rf'^{key}=(\d+)$', options, re.M)
        if match:
            version += ('.' if version else '') + match.group(1)

    def texts(prefix, suffix='_name'):
        vals = []
        for entry in strings:
            key = entry.get('key', '')
            if key.startswith(prefix) and (not suffix or key.endswith(suffix)):
                vals.append(entry.get('text', ''))
        return sorted(set(vals))

    counts = {
        'Wesen-Typen': len(unique_names(strings, 'dude_')),
        'Gegner-Typen': len(unique_names(strings, 'enemy_')),
        'Relikte': len(unique_names(strings, 'relic_r_')),
        'Trinkets': len(unique_names(strings, 'trinket_tr_')),
        'Kampf-Traits': len(unique_names(strings, 'combatant_trait_trait_')),
        'Glossar-Begriffe': len(unique_names(strings, 'glossary_term_gt_')),
        'Lokalisierungs-Strings': len(strings),
        'Erfolge': len(achievements),
    }
    assets = collections.Counter(Path(name).suffix.lower() for name in names if name.startswith('assets/'))
    locales = sorted({Path(name).stem.replace('credits.', '') for name in names
                      if name.startswith('assets/credits/credits.') and name.endswith('.json')})
    return {
        'path': str(apk_path),
        'sha': digest.hexdigest(),
        'version': version,
        'gamemaker': any('libyoyo.so' in name for name in names) and 'assets/game.droid' in names,
        'landscape': 'OrientLandscape=-1' in options,
        'counts': counts,
        'assets': assets,
        'locales': locales,
        'acts': texts('act_name_', ''),
        'modes': texts('game_mode_'),
        'families': [key[len('dudetag_'):-len('_name')] for key in sorted({e['key'] for e in strings
                     if e['key'].startswith('dudetag_') and e['key'].endswith('_name')})],
        'rounds': [key[len('round_type_'):] for key in sorted({e['key'] for e in strings
                   if e['key'].startswith('round_type_') and not e['key'].endswith('_desc')})],
        'mutators': len({e['key'] for e in strings if e['key'].startswith('tier_mutator_mut_')}),
    }


def build_report(info, game_version):
    lines = [
        '# Referenz-APK – How Many Dudes (automatisch ausgelesen)',
        '',
        f"- Datei: `{info['path']}`",
        f"- Version: {info['version']} · Engine: {'GameMaker (libyoyo.so/game.droid)' if info['gamemaker'] else 'unbekannt'} · Landscape: {info['landscape']}",
        f"- SHA-256: `{info['sha']}`",
        '',
        '## Inhalt der Referenz',
        '',
        '| Bereich | Anzahl |',
        '|---|---:|',
    ]
    for key, value in info['counts'].items():
        lines.append(f'| {key} | {value} |')
    for ext in ('.ogg', '.png', '.ttf'):
        lines.append(f'| Assets {ext} | {info["assets"].get(ext, 0)} |')
    lines += [
        f'| Sprachen | {len(info["locales"])} |',
        '',
        '- Akte: ' + ', '.join(info['acts']),
        '- Modi: ' + ', '.join(info['modes']),
        '- Wesen-Familien: ' + ', '.join(info['families']),
        '- Rundentypen: ' + ', '.join(info['rounds']),
        f'- Tier-Mutatoren: {info["mutators"]}',
        '',
        'Die Grafiken der Referenz stecken in `assets/game.droid`; die wenigen losen PNGs',
        'sind keine Sprite-Vorlagen. Wir übernehmen nur Mechaniken, nicht deren Assets.',
        '',
        '## Abgleich mit Fabelbattler',
        '',
        f"- Unsere Version: {game_version}; 123 Einheiten, 51 Zauber, 18 Gegner-Keys, MOB_CAP=500, Feld 18x14.",
        '- Die Referenz hat deutlich mehr Inhalte, aber **andere** Einheiten und eine andere Karte.',
        '- Kopiere KEINE Grafiken, Texte oder Namen der Referenz. Übertrage nur Mechaniken und Lesbarkeit.',
        '',
        '## Mögliche kleine nächste Schritte (aus Referenz abgeleitet)',
        '',
        '1. Runden-Vorschau ist umgesetzt – nächster Schritt wäre eine leichte Relikt-Belohnung nach Boss-Wellen.',
        '2. Biome-Paletten für das 18x14-Feld (6 Akte) statt eines einzigen Steinbodens.',
        '3. Status-/Rollen-Icons mit Form statt nur Farbe auf unseren vorhandenen Wesen.',
        '4. Nachkampf-Statistik nach dem Vorbild des Scoreboards (Schaden/Heilung pro Einheit).',
        '5. Zwei kurze, lizenzfreie Audio-Loops (Prep/Boss) – derzeit hat die App keine Audiodateien.',
        '',
        'Siehe `docs/ASSET_BEDARF.md` für Grafiken, Audio, Fonts und Entscheidungen, die noch fehlen.',
        '',
    ]
    return '\n'.join(lines)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apk', type=Path, default=DEFAULT_APK)
    parser.add_argument('--out', type=Path, default=OUT)
    args = parser.parse_args()

    game_version = ''
    props = ROOT / 'gradle.properties'
    if props.is_file():
        match = re.search(r'^APP_VERSION_NAME=(.*)$', props.read_text(encoding='utf-8'), re.M)
        if match:
            game_version = match.group(1).strip()

    if not args.apk.is_file():
        report = (f'# Referenz-APK – nicht gefunden\n\nErwartet: `{args.apk}`\n\n'
                  'Der Loop arbeitet ohne Referenz weiter und darf keine Ideen daraus übernehmen.\n')
    else:
        report = build_report(read_reference(args.apk), game_version)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    old = args.out.read_text(encoding='utf-8') if args.out.is_file() else None
    args.out.write_text(report, encoding='utf-8')
    print(f"{args.out} ({'neu' if old != report else 'unverändert'})")


if __name__ == '__main__':
    main()
