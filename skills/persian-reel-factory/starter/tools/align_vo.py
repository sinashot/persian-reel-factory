#!/usr/bin/env python3
"""Lay VO lines on a beat grid and align words to the audio.

Better than spreading characters over the whole line: each line is cut into phrases at its
punctuation, and phrase boundaries are pinned to the real pauses found in the audio (the
longest silences, in order). Inside a phrase, words share the voiced time by an estimated
syllable weight. Words get a small positive bias so text never shows before it is heard.

usage: python tools/align_vo.py src/<id>/lines.json <vo dir with vo1.mp3..voN.mp3> public/<id>
LINES.json: {"tempo": 1.25, "start": 0.4, "gap": 0.25, "extra_gap": {"5": 2.6}, "tail": 2.2, "lines": ["...", ...]}
writes OUT_DIR/vo.wav (48 kHz mono) and OUT_DIR/words.json
"""
import json
import os
import re
import subprocess
import sys
import wave

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ff import ffmpeg  # noqa: E402

FF = ffmpeg()
SR = 48000
BEAT = 0.5
WIN = 0.01
BREAK = re.compile(r"[،,.!؛:؟?…]$|\.\.\.$")
VOWELS = re.compile(r"[اآوی]")
LETTERS = re.compile(r"[؀-ۿA-Za-z0-9]")


def decode(path, tempo):
    raw = subprocess.run([FF, "-v", "error", "-i", path, "-af", f"atempo={tempo}", "-ac", "1", "-ar", str(SR), "-c:a", "pcm_s16le", "-f", "wav", "-"],
                         capture_output=True, check=True).stdout
    k = raw.find(b"data") + 8
    return np.frombuffer(raw[k:k + (len(raw) - k) // 2 * 2], dtype="<i2").astype(np.float32) / 32768


def energy_db(x):
    n = int(WIN * SR)
    f = len(x) // n
    rms = np.sqrt(np.mean(x[: f * n].reshape(f, n) ** 2, axis=1) + 1e-12)
    return 20 * np.log10(rms)


def weight(w):
    letters = len(LETTERS.findall(w))
    return 0.55 * letters + 0.9 * len(VOWELS.findall(w)) + 1.0


def silences(db, thr, min_len=0.09):
    quiet = db < thr
    out, i = [], 0
    while i < len(quiet):
        if quiet[i]:
            j = i
            while j < len(quiet) and quiet[j]:
                j += 1
            if (j - i) * WIN >= min_len:
                out.append((i * WIN, j * WIN))
            i = j
        else:
            i += 1
    return out


def align_line(x, text):
    db = energy_db(x)
    peak = np.percentile(db, 95)
    thr = peak - 30
    loud = np.nonzero(db > thr)[0]
    t0, t1 = loud[0] * WIN, (loud[-1] + 1) * WIN
    words = text.split()
    # phrases at punctuation
    phrases, cur = [], []
    for w in words:
        cur.append(w)
        if BREAK.search(w):
            phrases.append(cur)
            cur = []
    if cur:
        phrases.append(cur)
    sil = [s for s in silences(db, thr) if s[0] > t0 + 0.05 and s[1] < t1 - 0.05]
    # expected time of each phrase boundary from the syllable weights, then take the pause
    # nearest to it (in order); no pause within 0.9 s -> a zero-length boundary at the estimate
    pw = np.array([sum(map(weight, p)) for p in phrases])
    expect = t0 + np.cumsum(pw)[:-1] / pw.sum() * (t1 - t0)
    pauses, last = [], t0
    for e in expect:
        cand = [s for s in sil if s[0] >= last and abs((s[0] + s[1]) / 2 - e) < 0.9]
        if cand:
            s = min(cand, key=lambda s: abs((s[0] + s[1]) / 2 - e) - 0.5 * (s[1] - s[0]))
        else:
            s = (max(last, e), max(last, e))
        pauses.append(s)
        last = s[1]
    bounds = [t0] + [v for p in pauses for v in p] + [t1]
    spans = [(bounds[2 * i], bounds[2 * i + 1]) for i in range(len(pauses) + 1)]
    out = []
    for (a, b), ph in zip(spans, phrases):
        # voiced time inside the span, so short internal gaps do not shift words early
        seg = db[int(a / WIN):int(b / WIN)] > thr
        voiced = np.cumsum(seg) * WIN
        total = voiced[-1] if len(voiced) else (b - a)
        ws = np.array([weight(w) for w in ph])
        cum = np.concatenate([[0], np.cumsum(ws)]) / ws.sum() * total

        def at(v):
            if not len(voiced):
                return a + v
            i = int(np.searchsorted(voiced, v, side="left"))
            return a + min(i, len(voiced) - 1) * WIN

        for i, w in enumerate(ph):
            s = at(cum[i]) if i else a
            out.append({"w": w, "s": round(s + 0.04, 3), "e": round(at(cum[i + 1]), 3)})
    return out, t0, t1


def main(lines_path, vo_dir, out_dir):
    cfg = json.load(open(lines_path, encoding="utf-8"))
    os.makedirs(out_dir, exist_ok=True)
    t = cfg.get("start", 0.4)
    clips, lines = [], []
    for i, text in enumerate(cfg["lines"]):
        x = decode(os.path.join(vo_dir, f"vo{i + 1}.mp3"), cfg.get("tempo", 1.0))
        words, s0, s1 = align_line(x, text)
        start = round(t - s0, 3)
        for w in words:
            w["s"] = round(w["s"] + start, 3)
            w["e"] = round(w["e"] + start, 3)
        lines.append({"i": i, "start": round(start + s0, 3), "end": round(start + s1, 3), "words": words})
        clips.append((start, x))
        t = np.ceil((start + s1 + cfg.get("gap", 0.25)) / BEAT) * BEAT + cfg.get("extra_gap", {}).get(str(i + 1), 0)
    total = t + cfg.get("tail", 2.2)
    buf = np.zeros(int(total * SR), dtype=np.float32)
    for start, x in clips:
        k = int(start * SR)
        buf[k:k + len(x)] += x[: len(buf) - k]
    with wave.open(os.path.join(out_dir, "vo.wav"), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(buf, -1, 1) * 32767).astype("<i2").tobytes())
    json.dump({"duration": round(float(total), 3), "lines": lines}, open(os.path.join(out_dir, "words.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    for l in lines:
        print(f"line {l['i'] + 1}: {l['start']:.2f} - {l['end']:.2f}")
    print("total", total)


if __name__ == "__main__":
    main(*sys.argv[1:4])
