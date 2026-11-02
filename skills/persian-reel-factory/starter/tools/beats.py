#!/usr/bin/env python3
"""Print public/<id>/words.json as one compact line per spoken line, to pick cue times from
without reading the whole JSON:  L3 16.50-23.10 | 16.54 دو، · 16.98 ترامادول · ...

usage: python tools/beats.py <id>
"""
import json
import os
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")

if __name__ == "__main__":
    d = json.load(open(os.path.join(ROOT, "public", sys.argv[1], "words.json"), encoding="utf-8"))
    sys.stdout.reconfigure(encoding="utf-8")
    print(f"duration {d['duration']}")
    for l in d["lines"]:
        print(f"L{l['i'] + 1} {l['start']:.2f}-{l['end']:.2f} | " + " · ".join(f"{w['s']:.2f} {w['w']}" for w in l["words"]))
