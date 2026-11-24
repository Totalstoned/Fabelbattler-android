#!/usr/bin/env python3
"""Baut das GameMaker-Projektgerüst (YP/YY) um die portierten GML-Skripte."""
from pathlib import Path
import json
import re
import uuid

ROOT = Path(__file__).resolve().parent
PROJ = ROOT / 'Fabelbattler'
NAME = 'Fabelbattler'

SCRIPTS = [
    'scr_data', 'scr_core', 'scr_units', 'scr_battle', 'scr_run', 'scr_draw'
]

SCRIPT_YY = {
    '$GMScript': 'v1',
    '%Name': None,
    'isCompatibility': False,
    'isDnD': False,
    'name': None,
    'resourceType': 'GMScript',
    'resourceVersion': '2.0',
}

EVENTS = [
    (0, 0, 'Create_0.gml', 'fb_data_init();\nfb_state_init();\n'),
    (0, 3, 'Step_0.gml', 'fb_step(delta_time / 1000000);\n'),
    (0, 8, 'Draw_0.gml', 'fb_draw();\n'),
]

INSTANCE = (
    '{"$GMRInstance":"v4","%Name":"inst_FB_GAME","colour":4294967295,"frozen":false,'
    '"hasCreationCode":false,"ignore":false,"imageIndex":0,"imageSpeed":1.0,'
    '"inheritCode":false,"inheritedItemId":null,"inheritItemSettings":false,"isDnd":false,'
    '"name":"inst_FB_GAME","objectId":{"name":"obj_game","path":"objects/obj_game/obj_game.yy",},'
    '"properties":[],"resourceType":"GMRInstance","resourceVersion":"2.0","rotation":0.0,'
    '"scaleX":1.0,"scaleY":1.0,"x":0.0,"y":0.0,}'
)


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


def guid(path):
    return str(uuid.uuid5(uuid.NAMESPACE_URL, 'fabelbattler:' + path))


def build_scripts():
    for name in SCRIPTS:
        folder = PROJ / 'scripts' / name
        folder.mkdir(parents=True, exist_ok=True)
        d = dict(SCRIPT_YY)
        d['%Name'] = name
        d['name'] = name
        write_json(folder / f'{name}.yy', d)
        gml = folder / f'{name}.gml'
        if not gml.exists():
            gml.write_text(f'function {name}() {{\n}}\n', encoding='utf8')


def build_object():
    folder = PROJ / 'objects' / 'obj_game'
    folder.mkdir(parents=True, exist_ok=True)
    events = []
    for num, typ, filename, code in EVENTS:
        events.append({
            '$GMEvent': 'v1', '%Name': '', 'collisionObjectId': None,
            'eventNum': num, 'eventType': typ, 'isDnD': False,
            'name': '', 'resourceType': 'GMEvent', 'resourceVersion': '2.0',
        })
        (folder / filename).write_text(code, encoding='utf8')
    obj = {
        '$GMObject': '', '%Name': 'obj_game', 'eventList': events,
        'managed': True, 'name': 'obj_game', 'overriddenProperties': [],
        'parentObjectId': None, 'persistent': True,
        'physicsAngularDamping': 0.1, 'physicsDensity': 0.5,
        'physicsFriction': 0.2, 'physicsGroup': 0, 'physicsKinematic': False,
        'physicsLinearDamping': 0.1, 'physicsObject': False,
        'physicsRestitution': 0.1, 'physicsSensor': False,
        'physicsShape': 1, 'physicsShapePoints': [], 'physicsStartAwake': True,
        'properties': [], 'resourceType': 'GMObject', 'resourceVersion': '2.0',
        'solid': False, 'spriteId': None, 'spriteMaskId': None, 'visible': True,
    }
    write_json(folder / 'obj_game.yy', obj)


def build_room():
    path = PROJ / 'rooms' / 'Room1' / 'Room1.yy'
    s = path.read_text(encoding='utf8')
    s = re.sub(r'"parent":\{.*?\},', '"parent":null,', s, count=1, flags=re.S)
    s = s.replace('"instanceCreationOrder":[]',
                  '"instanceCreationOrder":[{"name":"inst_FB_GAME","path":"rooms/Room1/Room1.yy",},]')
    s = s.replace('"instances":[]', '"instances":[' + INSTANCE + ']')
    s = s.replace('"Height":120', '"Height":720').replace('"Width":940', '"Width":1280')
    path.write_text(s, encoding='utf8')


def build_yyp():
    paths = [f'scripts/{n}/{n}.yy' for n in SCRIPTS]
    paths += ['objects/obj_game/obj_game.yy', 'rooms/Room1/Room1.yy']
    resources = [{'id': {'name': Path(p).stem, 'path': p}} for p in paths]
    yyp = {
        '$GMProject': 'v1',
        '%Name': NAME,
        'AudioGroups': [{
            '$GMAudioGroup': 'v1', '%Name': 'audiogroup_default', 'exportDir': '',
            'name': 'audiogroup_default', 'resourceType': 'GMAudioGroup',
            'resourceVersion': '2.0', 'targets': -1,
        }],
        'configs': {'children': [], 'name': 'Default'},
        'defaultScriptType': 1,
        'Folders': [],
        'ForcedPrefabProjectReferences': [],
        'IncludedFiles': [],
        'isEcma': False,
        'LibraryEmitters': [],
        'MetaData': {'IDEVersion': '2026.1.0.27'},
        'name': NAME,
        'resources': resources,
        'resourceType': 'GMProject',
        'resourceVersion': '2.0',
        'RoomOrderNodes': [{'roomId': {'name': 'Room1', 'path': 'rooms/Room1/Room1.yy'}}],
        'templateType': None,
        'TextureGroups': [{
            '$GMTextureGroup': '', '%Name': 'Default', 'autocrop': True,
            'border': 2, 'compressFormat': 'bz2', 'customOptions': '',
            'directory': '', 'groupParent': None, 'isScaled': True,
            'loadType': 'default', 'mipsToGenerate': 0, 'name': 'Default',
            'resourceType': 'GMTextureGroup', 'resourceVersion': '2.0', 'targets': -1,
        }],
    }
    write_json(PROJ / f'{NAME}.yyp', yyp)
    order = {
        'FolderOrderSettings': [],
        'ResourceOrderSettings': [
            {'name': Path(p).stem, 'order': i, 'path': p} for i, p in enumerate(paths)
        ],
    }
    write_json(PROJ / f'{NAME}.resource_order', order)
    print(f'OK {len(paths)} Ressourcen')


if __name__ == '__main__':
    build_scripts()
    build_object()
    build_room()
    build_yyp()
