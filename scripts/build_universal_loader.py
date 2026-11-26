#!/usr/bin/env python3
"""Erzeugt lokale, THREE-kompatible Loader aus den pinned three.js r160 ESM-Quellen.

Das Spiel laedt Three.js als UMD-Build (`vendor/three.min.js`, REVISION 160).
Die offiziellen `examples/jsm` Loader sind ES-Module; dieser Build entfernt die
Import-/Export-Zeilen und bindet die Klassen an das globale `THREE`-Objekt.
Damit bleibt die WebView ohne Modul-Loader und ohne Netzwerk auskommbar.

Quellen (MIT, Three.js Authors):
  https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js
  https://unpkg.com/three@0.160.0/examples/jsm/utils/SkeletonUtils.js
"""
from __future__ import annotations

import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VENDOR = ROOT / "app/src/main/assets/vendor"
SOURCES = {
    "GLTFLoader.js": "https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js",
    "SkeletonUtils.js": "https://unpkg.com/three@0.160.0/examples/jsm/utils/SkeletonUtils.js",
}
EXPORTS = {
    "GLTFLoader.js": "THREE.GLTFLoader = GLTFLoader;",
    "SkeletonUtils.js": "THREE.SkeletonUtils = { retarget, retargetClip, clone };",
}


def load(name: str) -> str:
    cached = Path("/tmp/opencode") / (name.replace(".js", ".r160.js"))
    if cached.exists():
        return cached.read_text(encoding="utf8")
    return urllib.request.urlopen(SOURCES[name], timeout=60).read().decode("utf8")


def patch(name: str, source: str) -> str:
    def three_import(match: re.Match) -> str:
        names = [line.strip().rstrip(",").split(" as ")[0].strip()
                 for line in match.group(1).splitlines() if line.strip()]
        return "const { " + ", ".join(names) + " } = THREE;\n"

    out = re.sub(r"^import\s*\{(.*?)\}\s*from\s*'three';\s*",
                 three_import, source, count=1, flags=re.M | re.S)
    # GLTFLoader bentoetigt nur Dreieckskonvertierung; unsere GLBs sind bereits
    # reine Dreiecke, daher genuegt eine Identity-Stub ohne Extra-Datei.
    out = re.sub(r"^import \{[^}]*\} from '[^']*BufferGeometryUtils\.js';\s*",
                 "const toTrianglesDrawMode = geometry => geometry;\n",
                 out, count=1, flags=re.M)
    out = re.sub(r"^export \{[^}]*\};\s*", "", out, flags=re.M | re.S)
    out = out.replace("export function ", "function ").replace("export class ", "class ")
    assert "import " not in out and "export " not in out, name
    return ("// Aus three.js r160 examples/jsm generiert – siehe scripts/build_universal_loader.py\n"
            + "/* global THREE */\n(function(){\n" + out + "\n" + EXPORTS[name] + "\n})();\n")


def main() -> None:
    VENDOR.mkdir(parents=True, exist_ok=True)
    for name in SOURCES:
        target = VENDOR / name
        target.write_text(patch(name, load(name)), encoding="utf8")
        print(f"{target.relative_to(ROOT)}: {target.stat().st_size} Bytes")


if __name__ == "__main__":
    main()
