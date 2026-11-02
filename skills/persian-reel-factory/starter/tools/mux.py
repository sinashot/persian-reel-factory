#!/usr/bin/env python3
"""Put public/<id>/mix.wav on the rendered video (Remotion's own AAC lands ~40 ms late, so the
render's audio is replaced, the picture is copied untouched).

usage: python tools/mux.py <id> out/<id>.mp4 final.mp4
"""
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from ff import ffmpeg  # noqa: E402

if __name__ == "__main__":
    rid, video, out = sys.argv[1:4]
    mix = os.path.join(HERE, "..", "public", rid, "mix.wav")
    subprocess.run([ffmpeg(), "-v", "error", "-y", "-i", video, "-i", mix, "-map", "0:v", "-map", "1:a", "-c:v", "copy",
                    "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", out], check=True)
    print("wrote", out)
