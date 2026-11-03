#!/usr/bin/env python3
"""Rebuild dist/persian-reel-factory-skill.zip from skills/persian-reel-factory/.

This is the zip claude.ai's "Upload a skill" needs: a single top-level folder
(persian-reel-factory/) with SKILL.md directly inside it, and no .claude-plugin/
manifest anywhere — GitHub's own "Download ZIP" button bundles the whole repo
(plugin manifest included) and claude.ai rejects that, so this file is the one
to link to for direct skill uploads. Re-run this after any change under
skills/persian-reel-factory/ and commit the updated zip.

usage: python scripts/build_skill_zip.py
"""
import os
import zipfile

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SRC = os.path.join(ROOT, "skills", "persian-reel-factory")
OUT = os.path.join(ROOT, "dist", "persian-reel-factory-skill.zip")


def main():
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
        for r, dirs, files in os.walk(SRC):
            dirs[:] = [d for d in dirs if d != "__pycache__"]
            for f in sorted(files):
                if f.endswith(".pyc") or f == ".DS_Store":
                    continue
                full = os.path.join(r, f)
                rel = os.path.relpath(full, SRC).replace(os.sep, "/")
                z.write(full, "persian-reel-factory/" + rel)
    names = zipfile.ZipFile(OUT).namelist()
    assert "persian-reel-factory/SKILL.md" in names, "SKILL.md missing at the right depth"
    assert not any(".claude-plugin" in n for n in names), "plugin manifest leaked into the skill zip"
    print(f"wrote {OUT} ({os.path.getsize(OUT)} bytes, {len(names)} files)")


if __name__ == "__main__":
    main()
