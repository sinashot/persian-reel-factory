#!/usr/bin/env python3
"""Start a new reel from the example: copies src/example to src/<id>, renames the component,
points it at public/<id>/, and registers <Id>Reel + <Id>Guides in src/Root.tsx.

usage: python tools/new_reel.py <id>        e.g. python tools/new_reel.py sleep5
"""
import json
import os
import re
import shutil
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")


def main(rid):
    if not re.fullmatch(r"[a-z][a-z0-9]*", rid):
        raise SystemExit("id: lowercase letters and digits, starting with a letter")
    name, up = rid[0].upper() + rid[1:], rid.upper()
    src, dst = os.path.join(ROOT, "src", "example"), os.path.join(ROOT, "src", rid)
    if os.path.exists(dst):
        raise SystemExit(f"{dst} exists")
    shutil.copytree(src, dst)
    os.rename(os.path.join(dst, "Example.tsx"), os.path.join(dst, f"{name}.tsx"))
    p = os.path.join(dst, f"{name}.tsx")
    s = open(p, encoding="utf-8").read()
    s = s.replace("public/example/", f"public/{rid}/").replace("'example/mix.wav'", f"'{rid}/mix.wav'")
    s = s.replace("EXAMPLE_", f"{up}_").replace("Example", name)
    open(p, "w", encoding="utf-8").write(s)
    pub = os.path.join(ROOT, "public", rid)
    os.makedirs(pub, exist_ok=True)
    # placeholder words until the voice is made, so the reel already opens in the studio
    if not os.path.exists(os.path.join(pub, "words.json")):
        shutil.copy(os.path.join(ROOT, "public", "example", "words.json"), os.path.join(pub, "words.json"))
    r = os.path.join(ROOT, "src", "Root.tsx")
    s = open(r, encoding="utf-8").read()
    s = s.replace("// new_reel.py adds an import line here", f"import {{{name}, {up}_FPS, {up}_SECONDS}} from './{rid}/{name}';\n// new_reel.py adds an import line here")
    comp = (f'<Composition id="{name}Reel" component={{{name}}} durationInFrames={{Math.round({up}_SECONDS * {up}_FPS)}} fps={{{up}_FPS}} width={{1080}} height={{1920}} />\n'
            f'\t\t<Composition id="{name}Guides" component={{{name}}} defaultProps={{{{guides: true}}}} durationInFrames={{Math.round({up}_SECONDS * {up}_FPS)}} fps={{{up}_FPS}} width={{1080}} height={{1920}} />\n'
            "\t\t{/* new_reel.py adds compositions here */}")
    s = s.replace("{/* new_reel.py adds compositions here */}", comp)
    open(r, "w", encoding="utf-8").write(s)
    print(f"src/{rid}/{name}.tsx  src/{rid}/lines.json  src/{rid}/cues.json  ->  compositions {name}Reel, {name}Guides")


if __name__ == "__main__":
    main(sys.argv[1])
