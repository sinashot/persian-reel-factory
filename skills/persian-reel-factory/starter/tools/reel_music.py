#!/usr/bin/env python3
"""Score + SFX for a reel, ducked under the voice and normalised to -14 LUFS.

Reads public/<id>/vo.wav and src/<id>/cues.json, writes public/<id>/mix.wav.
The score is synthesised here (warm pads, sub bass, music-box arpeggio, soft pulse at 120 BPM,
the same 0.5 s beat grid align_vo.py lays the lines on), so there is nothing to license.
SFX are synthesised too; drop your own samples in public/sfx/ (whoosh.mp3, impact.mp3, pop.mp3,
chime.mp3, riser.mp3) and they are used instead.

cues.json keys used here: duration, scenes (hook, ch1.., cta), impact, whoosh, pop, chime,
riser, click (lists of seconds) and cut (one second where the music ducks for the hook's punch).

usage: python tools/reel_music.py <id> [--mood calm|drive]
"""
import json
import os
import subprocess
import sys
import wave

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..")
sys.path.insert(0, HERE)
from ff import ffmpeg  # noqa: E402

SR = 48000
BEAT = 0.5
rng = np.random.default_rng(3)

RID = sys.argv[1]
MOOD = sys.argv[sys.argv.index("--mood") + 1] if "--mood" in sys.argv else "calm"
CUES = json.load(open(os.path.join(ROOT, "src", RID, "cues.json"), encoding="utf-8"))
DUR = CUES["duration"]
N = int(DUR * SR)
FF = ffmpeg()

# ---------------------------------------------------------------- dsp
SEMI = {"C": -9, "D": -7, "E": -5, "F": -4, "G": -2, "A": 0, "B": 2}


def hz(name):
    """'A4' = 440, 'Bb3', 'F#3'."""
    letter, rest = name[0], name[1:]
    acc = 0
    if rest[0] == "b":
        acc, rest = -1, rest[1:]
    elif rest[0] == "#":
        acc, rest = 1, rest[1:]
    return 440.0 * 2 ** ((SEMI[letter] + acc + (int(rest) - 4) * 12) / 12)


def ffilt(x, lo=None, hi=None, slope=0.25):
    """Zero-phase band filter with soft (raised-cosine, in octaves) edges."""
    n = len(x)
    size = 1 << int(np.ceil(np.log2(max(2, n))))
    X = np.fft.rfft(x, size)
    f = np.fft.rfftfreq(size, 1 / SR)
    g = np.ones_like(f)
    lf = np.log2(np.maximum(f, 1e-6))
    if hi:
        g *= 0.5 * (1 + np.cos(np.pi * np.clip((lf - np.log2(hi)) / slope, 0, 1)))
    if lo:
        g *= 0.5 * (1 + np.cos(np.pi * np.clip((np.log2(lo) - lf) / slope, 0, 1)))
    return np.fft.irfft(X * g, size)[:n]


def sweep(x, lo_hz, hi_hz, chunk=0.04):
    """Band-pass whose centre moves (log) from lo_hz to hi_hz across x."""
    n, hop = len(x), int(chunk * SR / 2)
    win = np.hanning(hop * 2)
    out = np.zeros(n + hop * 2)
    starts = range(0, n, hop)
    for i, s in enumerate(starts):
        seg = np.zeros(hop * 2)
        piece = x[s:s + hop * 2]
        seg[:len(piece)] = piece
        c = lo_hz * (hi_hz / lo_hz) ** (i / max(1, len(starts) - 1))
        out[s:s + hop * 2] += ffilt(seg * win, lo=max(40, c * 0.6), hi=c * 1.6)
    return out[:n]


def place(buf, x, t, gain=1.0):
    i = int(round(t * SR))
    if i >= len(buf):
        return
    j = min(len(buf), i + len(x))
    buf[i:j] += x[: j - i] * gain


def env(n, tau):
    return np.exp(-np.arange(n) / SR / tau)


# ---------------------------------------------------------------- instruments
def saw(freq, n, detune=0.0):
    t = np.arange(n) / SR
    f = freq * 2 ** (detune / 1200)
    x = np.zeros(n)
    for k in range(1, int(9000 // f) + 1):
        x += np.sin(2 * np.pi * k * f * t + rng.uniform(0, 6.28)) / k
    return x * 0.5


def pad_chord(notes, dur, cutoff=1100):
    n = int(dur * SR)
    L, R = np.zeros(n), np.zeros(n)
    for nt in notes:
        L += saw(hz(nt), n, -7)
        R += saw(hz(nt), n, +7)
    e = np.minimum(1, np.arange(n) / (0.35 * SR)) * np.minimum(1, (n - np.arange(n)) / (0.4 * SR))
    return ffilt(L, hi=cutoff) * e, ffilt(R, hi=cutoff) * e


def bass_note(note, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = hz(note)
    x = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t)
    return np.tanh(1.3 * x * np.minimum(1, t / 0.004) * np.exp(-t / 0.5)) * 0.5


def musicbox(note, dur=1.4):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = hz(note)
    x = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2.01 * f * t) + 0.08 * np.sin(2 * np.pi * 3.98 * f * t)
    return x * np.minimum(1, t / 0.003) * env(n, 0.45) * 0.22


def kick(vel=0.6):
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    f = 45 + 110 * np.exp(-t / 0.028)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.26) * np.minimum(1, t / 0.0012)
    return ffilt(np.tanh(1.6 * body * vel) / np.tanh(1.6), hi=180 if MOOD == "calm" else 900)


def hat(vel=0.18):
    n = int(0.08 * SR)
    return ffilt(rng.standard_normal(n), lo=7000, hi=15000) * env(n, 0.017) * 0.55 * vel


# ---------------------------------------------------------------- sfx (synth, or samples in public/sfx)
def synth_sfx(name):
    if name == "whoosh":
        n = int(0.9 * SR)
        t = np.arange(n) / n
        e = np.where(t < 0.62, (t / 0.62) ** 2.5, ((1 - t) / 0.38) ** 1.6)
        return sweep(rng.standard_normal(n), 500, 6000) * e * 0.7
    if name == "impact":
        n = int(2.0 * SR)
        t = np.arange(n) / SR
        boom = np.sin(2 * np.pi * np.cumsum(38 + 40 * np.exp(-t / 0.06)) / SR) * np.exp(-t / 0.6)
        return boom + ffilt(rng.standard_normal(n), lo=3000) * np.exp(-t / 0.35) * 0.25
    if name == "pop":
        n = int(0.12 * SR)
        t = np.arange(n) / SR
        return np.sin(2 * np.pi * np.cumsum(520 + 520 * (1 - np.exp(-t / 0.03))) / SR) * env(n, 0.04) * 0.6
    if name == "chime":
        x = np.zeros(int(2.0 * SR))
        for i, nt in enumerate(["A5", "E6", "C#6"]):
            n = int(1.6 * SR)
            place(x, np.sin(2 * np.pi * hz(nt) * np.arange(n) / SR) * env(n, 0.6) * 0.3, i * 0.09)
        return x
    if name == "riser":
        n = int(1.6 * SR)
        t = np.arange(n) / n
        tone = np.sin(2 * np.pi * np.cumsum(220 * 2 ** (t * 3)) / SR) * 0.15
        return (sweep(rng.standard_normal(n), 300, 9000) * 0.6 + tone) * t ** 2.2
    raise ValueError(name)


def sfx(name):
    path = os.path.join(ROOT, "public", "sfx", name + ".mp3")
    if os.path.exists(path):
        raw = subprocess.run([FF, "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
        return np.frombuffer(raw, np.float32).astype(float)
    return synth_sfx(name)


# ---------------------------------------------------------------- score
# Am - F - C - G, one chord per bar (2 s)
PROG = [["A2", "E3", "A3", "C4"], ["F2", "C3", "F3", "A3"], ["C3", "G3", "C4", "E4"], ["G2", "D3", "G3", "B3"]]
BASS = ["A1", "F1", "C2", "G1"]
BOX = [["A4", "E4", "C5", "B4"], ["A4", "F4", "C5", "E5"], ["G4", "E4", "C5", "D5"], ["B4", "G4", "D5", "A4"]]


def music():
    L, R = np.zeros(N), np.zeros(N)
    sc = CUES["scenes"]
    ch1, ch3 = sc.get("ch1", 4.0), sc.get("ch3", sc.get("ch2", 8.0))
    for b in range(int(np.ceil(DUR / (4 * BEAT)))):
        t0, k = b * 4 * BEAT, b % 4
        pl, pr = pad_chord(PROG[k], 4 * BEAT + 0.6)
        place(L, pl, t0, 0.16)
        place(R, pr, t0, 0.16)
        bn = ffilt(bass_note(BASS[k], 1.8), hi=220)
        place(L, bn, t0, 0.7)
        place(R, bn, t0, 0.7)
        if t0 >= ch1 - 0.1:  # arpeggio from the first chapter on, in 8ths from the third
            for s in range(8):
                if s % 2 and t0 < ch3:
                    continue
                p, pan = musicbox(BOX[k][s % 4]), (0.35 if s % 2 else -0.35)
                place(L, p, t0 + s * BEAT / 2, 1 - max(0, pan))
                place(R, p, t0 + s * BEAT / 2, 1 + min(0, pan))
        if t0 >= ch3 - 0.1 and t0 < DUR - 2.5:  # soft pulse
            for s in ((0, 2) if MOOD == "calm" else (0, 1, 2, 3)):
                place(L, kick(), t0 + s * BEAT, 0.55)
                place(R, kick(), t0 + s * BEAT, 0.55)
            place(L, hat(), t0 + 3 * BEAT, 1)
            place(R, hat(), t0 + 1 * BEAT, 1)
    if "cut" in CUES:  # the hook's punch: music ducks out, then the impact lands
        i0, i1 = int((CUES["cut"] - 0.25) * SR), int((CUES["cut"] + 0.05) * SR)
        L[i0:i1] *= np.linspace(1, 0.15, i1 - i0)
        R[i0:i1] *= np.linspace(1, 0.15, i1 - i0)
    return ffilt(L, lo=35), ffilt(R, lo=35)


def effects():
    L, R = np.zeros(N), np.zeros(N)
    whoosh, impact, pop, chime, riser = (sfx(n) for n in ("whoosh", "impact", "pop", "chime", "riser"))

    def put(x, t, g=1.0, pan=0.0):
        place(L, x, max(0.0, t), g * (1 - max(0, pan)))
        place(R, x, max(0.0, t), g * (1 + min(0, pan)))

    def peak(x):
        return int(np.argmax(np.abs(x))) / SR

    for t in CUES.get("impact", []):
        put(impact, t - peak(impact), 0.55)
    for t in CUES.get("whoosh", []):
        put(whoosh, t - peak(whoosh), 0.38)
    for i, t in enumerate(CUES.get("pop", [])):
        put(pop, t - 0.01, 0.32, (-0.25, 0.25)[i % 2])
    for t in CUES.get("chime", []):
        put(chime, t - 0.02, 0.35)
    for t in CUES.get("riser", []):
        put(riser, t - len(riser) / SR, 0.3)
    for t in CUES.get("click", []):
        put(pop, t, 0.3)
    return L, R


def read_wav(path):
    with wave.open(path) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), dtype="<i2").astype(float) / 32768
    out = np.zeros(N)
    out[: min(N, len(x))] = x[:N]
    return out


def duck_env(vo):
    hop = int(0.01 * SR)
    frames = len(vo) // hop
    e = (np.abs(vo[: frames * hop]).reshape(frames, hop).max(axis=1) > 0.02).astype(float)
    sm, g = np.zeros(frames), 0.0
    for i in range(frames):
        g += (e[i] - g) * (0.3 if e[i] > g else 0.03)
        sm[i] = g
    out = np.repeat(sm, hop)
    return np.pad(out, (0, max(0, N - len(out))), mode="edge")[:N]


def main():
    vo = read_wav(os.path.join(ROOT, "public", RID, "vo.wav"))
    vo = vo / (np.abs(vo).max() + 1e-9) * 0.9
    mL, mR = music()
    sL, sR = effects()
    pk = max(np.abs(mL).max(), np.abs(mR).max())
    d = 1 - 0.55 * duck_env(vo)
    L = vo + mL / pk * 0.34 * d + sL * 0.55
    R = vo + mR / pk * 0.34 * d + sR * 0.55
    fade = np.minimum(1, (N - np.arange(N)) / (1.2 * SR))
    st = np.stack([L * fade, R * fade], 1)
    st = st / np.abs(st).max() * 0.9
    raw = os.path.join(ROOT, "public", RID, "mix-raw.wav")
    with wave.open(raw, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((st * 32767).astype("<i2").tobytes())
    out = os.path.join(ROOT, "public", RID, "mix.wav")
    subprocess.run([FF, "-v", "error", "-y", "-i", raw, "-af", "loudnorm=I=-14:TP=-1.0:LRA=9", "-ar", str(SR), "-c:a", "pcm_s16le", out], check=True)
    print("wrote", out)


if __name__ == "__main__":
    main()
