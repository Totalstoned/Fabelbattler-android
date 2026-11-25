#!/usr/bin/env python3
"""Nächste Versionsstufe fuer Fabelbattler setzen (fortlaufend).

Schema: 1.<minor:2stellig>.<patch:1stellig>, VersionCode = major*1000+minor*10+patch.
Beispiel: 1.20.0 -> 1.20.1 -> 1.20.2 ... 1.20.9 -> 1.21.0 ... 1.99.9.
"""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parent.parent
PROPS = ROOT / 'gradle.properties'
LIMIT = (1, 99, 9)

text = PROPS.read_text(encoding='utf-8')
match = re.search(r'^APP_VERSION_NAME=(.*)$', text, re.M)
if not match:
    sys.exit('APP_VERSION_NAME fehlt in gradle.properties')
major, minor, patch = (int(x) for x in match.group(1).strip().split('.'))
if (major, minor, patch) >= LIMIT:
    print('LIMIT: 1.99.9 erreicht')
    sys.exit(2)

patch += 1
if patch > 9:
    patch = 0
    minor += 1
if (major, minor, patch) > LIMIT:
    print('LIMIT: 1.99.9 erreicht')
    sys.exit(2)

name = f'{major}.{minor:02d}.{patch}'
code = major * 1000 + minor * 10 + patch
text = re.sub(r'^APP_VERSION_NAME=.*$', f'APP_VERSION_NAME={name}', text, count=1, flags=re.M)
text = re.sub(r'^APP_VERSION_CODE=.*$', f'APP_VERSION_CODE={code}', text, count=1, flags=re.M)
PROPS.write_text(text, encoding='utf-8')
print(name)
