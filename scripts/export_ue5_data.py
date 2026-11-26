#!/usr/bin/env python3
"""Exportiert ROSTER/RACE_PACKS aus index3d.html als JSON fuer das UE5-Projekt.

Kein Engine-Build noetig: Die Datei wird unter
ue5/Fabelbattler/Content/Data/units.json abgelegt und vom BattleSimActor
beim Start gelesen.
"""
from pathlib import Path
import ast
import re
import sys

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "app" / "src" / "main" / "assets" / "index3d.html"
OUT = ROOT / "ue5" / "Fabelbattler" / "Content" / "Data" / "units.json"

HUMAN_KEYS = set("""oma opa feuerwehr kampftruppe soldat missionar sanitaeter rebelle
armee bundeswehr soeldner feuerwehrwagen krankenwagen panzer hubschrauber
kampfflugzeug drohne teddy""".split())


def block(src: str, name: str) -> str:
    start = src.index("const " + name + " = {")
    i = start + len("const " + name + " = ")
    depth = 0
    while i < len(src):
        if src[i] == "{":
            depth += 1
        elif src[i] == "}":
            depth -= 1
            if depth == 0:
                return src[start:i + 1]
        i += 1
    raise ValueError("Block nicht gefunden: " + name)


def main() -> int:
    src = SRC.read_text(encoding="utf-8")
    units = []
    roster = block(src, "ROSTER")
    for m in re.finditer(r'^\s*([A-Za-z0-9_]+):\{(.*)\},?\s*$', roster, re.M):
        key, body = m.group(1), m.group(2)
        name = re.search(r'name:"([^"]+)"', body)
        cls = re.search(r'cls:"([^"]+)"', body)
        role = re.search(r'role:"([^"]+)"', body)
        ability = re.search(r'ability:"([^"]+)"', body)
        units.append({
            "key": key,
            "name": name.group(1) if name else key,
            "role": role.group(1) if role else "",
            "cls": cls.group(1) if cls else "",
            "race": "Basis",
            "ability": ability.group(1) if ability else "",
            "human": key in HUMAN_KEYS,
        })
    race = None
    for line in block(src, "RACE_PACKS").splitlines():
        header = re.match(r'^\s*([A-Za-z0-9_ÄÖÜäöü]+)\s*:\s*\[\s*$', line)
        if header:
            race = header.group(1)
            continue
        entry = re.match(r'^\s*(\[.*\]),?\s*$', line)
        if not entry or not race:
            continue
        e = ast.literal_eval(entry.group(1))
        if any(u["key"] == e[0] for u in units):
            continue
        units.append({
            "key": e[0], "name": e[1], "role": e[3], "cls": e[4],
            "race": race, "ability": e[10], "human": e[0] in HUMAN_KEYS,
        })

    if len(units) != 123:
        print("FEHLER: erwartet 123 Einheiten, gefunden %d" % len(units), file=sys.stderr)
        return 1

    payload = {
        "source": "index3d.html",
        "count": len(units),
        "human_count": sum(1 for u in units if u["human"]),
        "monster_count": sum(1 for u in units if not u["human"]),
        "human_keys": [u["key"] for u in units if u["human"]],
        "monster_keys": [u["key"] for u in units if not u["human"]],
        "units": units,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(__import__("json").dumps(payload, ensure_ascii=False, indent=2) + "\n",
                   encoding="utf-8")
    print("OK: %d Einheiten (%d Menschen / %d Monster) -> %s" %
          (len(units), payload["human_count"], payload["monster_count"], OUT))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
