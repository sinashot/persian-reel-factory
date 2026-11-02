#!/usr/bin/env python3
"""Refine word timings in public/<id>/words.json with real word timestamps from faster-whisper.

align_vo.py lays the lines on the beat grid and estimates word times from energy and syllable
weight. This pass listens to the finished public/<id>/vo.wav (large-v3-turbo, Persian, GPU when there is one) and
moves every script word onto the time Whisper heard it. The script's spelling is kept; only the
times change. Per line: when Whisper heard the same number of words, they map one to one; when
not, script words are spread over Whisper's word boundaries by character share.

usage: python tools/reel_words.py <id>
"""
import json
import os
import re
import sys
import warnings

warnings.filterwarnings("ignore")
os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")

import librosa
from faster_whisper import WhisperModel

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
MODEL = "mobiuslabsgmbh/faster-whisper-large-v3-turbo"


def letters(w):
    return max(1, len(re.sub(r"[^\w]", "", w)))


def main(rid):
    pub = os.path.join(ROOT, "public", rid)
    words_path = os.path.join(pub, "words.json")
    data = json.load(open(words_path, encoding="utf-8"))
    audio, _ = librosa.load(os.path.join(pub, "vo.wav"), sr=16000, mono=True)
    try:
        model = WhisperModel(MODEL, device="cuda", compute_type="float16")
    except Exception:
        print("no CUDA GPU, using the CPU (slower)")
        model = WhisperModel(MODEL, device="cpu", compute_type="int8")
    segs, _ = model.transcribe(audio, language="fa", word_timestamps=True, vad_filter=False)
    heard = [(w.start, w.end) for s in segs for w in s.words]
    moved = 0
    for line in data["lines"]:
        a, b = line["start"] - 0.3, line["end"] + 0.3
        mine = [h for h in heard if a <= (h[0] + h[1]) / 2 <= b]
        script = line["words"]
        if not mine:
            continue
        dur = line["end"] - line["start"]
        heard_span = mine[-1][1] - mine[0][0]
        if len(mine) != len(script) and (abs(len(mine) - len(script)) > 3 or heard_span < 0.75 * dur):
            print(f"line {line['i'] + 1}: Whisper heard {len(mine)} words over {heard_span:.1f}s of {dur:.1f}s -> kept align_vo times")
            continue
        if len(mine) == len(script):
            for w, (s, e) in zip(script, mine):
                w["s"], w["e"] = round(s, 3), round(e, 3)
        else:
            # character share of the script spread over Whisper's spoken span, snapped to its boundaries
            t0, t1 = mine[0][0], mine[-1][1]
            bounds = sorted({t for h in mine for t in h})
            tot = sum(letters(w["w"]) for w in script)
            acc = 0
            for w in script:
                s = t0 + (t1 - t0) * acc / tot
                acc += letters(w["w"])
                e = t0 + (t1 - t0) * acc / tot
                w["s"] = round(min(bounds, key=lambda x: abs(x - s)), 3)
                w["e"] = round(max(w["s"] + 0.08, min(bounds, key=lambda x: abs(x - e))), 3)
        moved += len(script)
        print(f"line {line['i'] + 1}: script {len(script)} words, heard {len(mine)} -> {'1:1' if len(mine) == len(script) else 'spread'}")
    json.dump(data, open(words_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"retimed {moved} words in {words_path}")


if __name__ == "__main__":
    main(sys.argv[1])
