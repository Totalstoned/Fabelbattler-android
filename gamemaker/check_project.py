#!/usr/bin/env python3
"""Strukturprüfung für das GameMaker-Quellprojekt (ohne GameMaker-Runtime)."""
from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parent
PROJ = ROOT / 'Fabelbattler'
NAME = 'Fabelbattler'
EVENT_FILES = {(0, 0): 'Create_0.gml', (3, 0): 'Step_0.gml', (8, 0): 'Draw_0.gml'}

errors = []


def fail(msg):
    errors.append(msg)


def strip_gml(code):
    out = []
    i, state = 0, 'code'
    while i < len(code):
        c = code[i]
        if state == 'code':
            if c == '/' and i + 1 < len(code) and code[i + 1] == '/':
                state, i = 'line', i + 2
                continue
            if c == '/' and i + 1 < len(code) and code[i + 1] == '*':
                state, i = 'block', i + 2
                continue
            if c == '"':
                state, i = 'string', i + 1
                out.append(' ')
                continue
            out.append(c)
            i += 1
        elif state == 'line':
            if c == '\n':
                state, out = 'code', out + ['\n']
            i += 1
        elif state == 'block':
            if c == '*' and i + 1 < len(code) and code[i + 1] == '/':
                state, i = 'code', i + 2
            else:
                i += 1
        else:
            if c == '\\':
                out.append(' ')
                i += 2
                continue
            if c == '"':
                state, i = 'code', i + 1
                continue
            out.append(' ')
            i += 1
    return ''.join(out)


def check_json(path):
    text = path.read_text(encoding='utf8')
    # GameMaker-YY-Dateien erlauben trailing commas; Python nicht.
    text = re.sub(r',(\s*[}\]])', r'\1', text)
    try:
        return json.loads(text)
    except Exception as exc:
        fail(f'{path.relative_to(PROJ)}: ungültiges JSON ({exc})')
        return {}


yyp_path = PROJ / f'{NAME}.yyp'
yyp = check_json(yyp_path)
if yyp.get('%Name') != NAME:
    fail('Projektname in .yyp falsch')
resources = yyp.get('resources', [])
expected_paths = sorted(str(p.relative_to(PROJ)) for p in PROJ.rglob('*.yy'))
actual_paths = sorted(r.get('id', {}).get('path', '') for r in resources)
if actual_paths != expected_paths:
    fail(f'.yyp und Dateien weichen ab: {len(actual_paths)} registriert, {len(expected_paths)} vorhanden')
for entry in resources:
    rid = entry.get('id', {})
    rel = rid.get('path', '')
    target = PROJ / rel
    if not target.is_file():
        fail(f'Ressourcendatei fehlt: {rel}')
    if target.stem != rid.get('name'):
        fail(f'Ressourcenname passt nicht zu Pfad: {rel}')

order = check_json(PROJ / f'{NAME}.resource_order')
order_paths = sorted(o.get('path', '') for o in order.get('ResourceOrderSettings', []))
if order_paths != actual_paths:
    fail('resource_order ist nicht mit .yyp abgeglichen')

obj = check_json(PROJ / 'objects/obj_game/obj_game.yy')
seen_events = set()
for event in obj.get('eventList', []):
    key = (event.get('eventType'), event.get('eventNum'))
    expected = EVENT_FILES.get(key)
    if expected is None:
        fail(f'Unbekannte Kombination eventType={key[0]} eventNum={key[1]}')
        continue
    seen_events.add(key)
    if not (PROJ / 'objects/obj_game' / expected).is_file():
        fail(f'Eventdatei fehlt: {expected}')
for key, filename in EVENT_FILES.items():
    if key not in seen_events:
        fail(f'Event fehlt: {filename}')
for stale in (PROJ / 'objects/obj_game').glob('*.gml'):
    if stale.name not in EVENT_FILES.values():
        fail(f'Verwaiste Eventdatei: {stale.name}')

room = check_json(PROJ / 'rooms/Room1/Room1.yy')
room_text = (PROJ / 'rooms/Room1/Room1.yy').read_text(encoding='utf8')
if '"name":"inst_FB_GAME"' not in room_text:
    fail('Room1 enthält keine obj_game-Instanz')
if room.get('roomSettings', {}).get('Width') != 1280 or room.get('roomSettings', {}).get('Height') != 720:
    fail('Room1 hat nicht die erwartete Auflösung 1280x720')

gml_files = sorted(PROJ.rglob('*.gml'))
defined, called = set(), set()
for path in gml_files:
    code = strip_gml(path.read_text(encoding='utf8'))
    defined.update(re.findall(r'function\s+([A-Za-z_]\w*)\s*\(', code))
    called.update(re.findall(r'\b(fb_[A-Za-z_]\w*)\s*\(', code))
    stack, pairs = [], {')': '(', ']': '[', '}': '{'}
    for idx, ch in enumerate(code):
        if ch in '([{':
            stack.append(ch)
        elif ch in ')]}':
            line = code[:idx].count('\n') + 1
            if not stack or stack[-1] != pairs[ch]:
                fail(f'{path.relative_to(PROJ)}:{line}: Klammer {ch} ohne Partner')
                break
            stack.pop()
    if stack:
        fail(f'{path.relative_to(PROJ)}: {len(stack)} offene Klammern')
missing = sorted(c for c in called if c not in defined)
if missing:
    fail('Fehlende GML-Funktionen: ' + ', '.join(missing))

data = (PROJ / 'scripts/scr_data/scr_data.gml').read_text(encoding='utf8')
for marker, expected in [('global.ROSTER = {', 123), ('global.SPELLS = {', 51), ('global.FOE_KEYS = [', 18)]:
    if marker not in data:
        fail(f'Datenblock fehlt: {marker}')
if 'global.MOB_CAP = 500' not in data:
    fail('MOB_CAP ist nicht 500')

sprites = len(list((PROJ / 'sprites').glob('*/*.yy')))
if sprites != 635:
    fail(f'Erwarte 635 VFX-Sprites, gefunden {sprites}')
vfx = (PROJ / 'scripts/scr_vfx/scr_vfx.gml').read_text(encoding='utf8')
if 'global.VFX_SPRITES' not in vfx or 'function fb_vfx_draw()' not in vfx:
    fail('VFX-Brücke scr_vfx.gml ist unvollständig')
referenced = set(re.findall(r'\b(?:spr|spt)_[A-Za-z0-9_]+\b', vfx))
sprite_dirs = {p.name for p in (PROJ / 'sprites').iterdir() if p.is_dir()}
missing_sprites = sorted(referenced - sprite_dirs)
if missing_sprites:
    fail('VFX-Sprites fehlen: ' + ', '.join(missing_sprites))

if errors:
    for err in errors:
        print('FEHLER:', err)
    sys.exit(1)
print(f'OK GameMaker-Projekt: {len(resources)} Ressourcen ({sprites} VFX-Sprites), '
      f'{len(gml_files)} GML-Dateien, {len(defined)} Funktionen, '
      '123 Einheiten / 51 Zauber / 18 Gegner-Keys / MOB_CAP 500')
