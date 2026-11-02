---
name: persian-reel-factory
description: Make a 30–60 s vertical Instagram Reel / YouTube Short / TikTok with a Persian (Farsi) voiceover, word-by-word karaoke captions, motion graphics, music and SFX, rendered from code with Remotion — from a ready template, so only the script, the cue times and one small visual per chapter are new. Use whenever the user asks for a reel, ریلز, ریل, short video, «ویدیو برای اینستاگرام», a numbered list video («۵ تا ...»), an explainer clip with Persian narration, or "the next reel" for their page, even if they never say Remotion.
---

# Persian Reel Factory

A 1080×1920, 60 fps reel built from a fixed template. The template already owns the backdrop,
the camera whips, the numbered rail, the chapter panels, the karaoke captions, the footer, the
Instagram safe zone and the audio pipeline. **Per reel you write three small files and nothing else.**
That is where the savings come from: about half the tokens and half the time of building a reel
from scratch, with the same look every time.

## Rules that keep it cheap (follow them, they are the point of the skill)

1. **Do not read `src/kit/ReelKit.tsx`.** Its API is listed below. Read `src/example/Example.tsx` once,
   only when you need a pattern you cannot write from the API list.
2. **Never open `words.json`.** Run `python tools/beats.py <id>` and pick cue times from its compact lines.
3. One reel = `src/<id>/lines.json`, `src/<id>/cues.json`, `src/<id>/<Id>.tsx` (~150–250 lines). Reuse
   one visual idea across chapters (a function that returns a chapter visual) instead of five bespoke ones.
4. Check with **4–8 stills at half scale** of `<Id>Guides`, combined into one or two contact sheets,
   never a full render. Render the full reel once, at the end.
5. Fix by editing cue numbers or one component; do not rewrite the file.
6. Say what you are doing in one line per step; skip long explanations.

## Setup (once per machine)

```bash
cp -r <this skill>/starter my-reels && cd my-reels
npm install
pip install -r tools/requirements.txt
```
Needs Node 18+, Python 3.10+. A CUDA GPU makes Whisper fast; without one it runs on the CPU.
If `npx remotion render` cannot download Chrome Headless Shell (blocked region), see
`references/troubleshooting.md`.

## Make a reel (the whole workflow)

1. **Topic + script.** Read `references/viral-playbook.md` (short). Write 6–8 spoken lines:
   line 1 = hook (+ optional line 2), one line per chapter starting with its number («یک، ...»),
   last line = one CTA. Colloquial Persian, ~550–700 characters total for ~50–60 s. No ":" in lines.
2. **Scaffold:** `python tools/new_reel.py <id>` → copies the example to `src/<id>/`, registers
   `<Id>Reel` and `<Id>Guides`. Put the lines in `src/<id>/lines.json` (keep `tempo` 1.2).
3. **Voice:** one TTS call per line → `vo1.mp3 … voN.mp3` in one folder (e.g. `out/vo-<id>/`).
   ElevenLabs MCP: voice "Liam - Energetic, Social Media Creator" (or the user's voice), `model_id`
   `eleven_v3`, `language` `fa`. Rename the saved `tts_*.mp3` files to `voK.mp3` in line order.
   Any other TTS or a recorded voice works the same way.
4. **Align:** `python tools/align_vo.py src/<id>/lines.json out/vo-<id> public/<id>` then
   `python tools/reel_words.py <id>` (Whisper word times) then `python tools/beats.py <id>`.
5. **Cues:** write `src/<id>/cues.json` from the beats output — `duration` (from beats),
   `scenes` {hook: 0, ch1…chN: ~0.3 s before each chapter line, cta}, `beats` {name: second} for
   every moment a visual reacts to, and the SFX lists `impact`, `whoosh` (= chapter starts),
   `pop`, `chime`, `riser`, `click`, `cut` (the hook's punch word).
6. **Reel file:** edit `src/<id>/<Id>.tsx`: Hook, chapter visuals, Cta, SPEC. Then
   `python tools/reel_music.py <id>` (add `--mood drive` for tech/energetic topics) and uncomment
   `audio: '<id>/mix.wav'`.
7. **Check:** `SCALE=0.5 node render-stills.mjs <Id>Guides 1.5,4,9,15,22,30,40,47 out/stills-<id>`,
   paste them into a contact sheet (PIL), look once. Red bands = where Instagram UI covers the frame:
   no text or key visual may touch them. Fix, re-check only the changed times.
8. **Render + deliver:**
   `npx remotion render src/index.ts <Id>Reel out/<id>.mp4 --gl=angle` then
   `python tools/mux.py <id> out/<id>.mp4 <final>.mp4` (puts the mix back without Remotion's AAC
   delay). Cover = a still from the hook. Write the caption (playbook) next to the video.

## ReelKit API (import from `../kit/ReelKit`)

- Layout: `W` (1080), `SAFE` {left 80, right 920, top 230, bottom 1440}, `CX` (500 = centre of the safe zone), `COL` {yellow, white, soft, cyan, red, orange, violet, green}.
- Timing (all take seconds `t`): `enter(t, t0, d=.5)` 0→1 ease-out · `leave(t, t1, d=.3)` 0→1 ease-in · `move(t, t0, t1)` 0→1 ease-in-out · `span(t, t0, t1)` linear · `punch(t, t0, d=.45)` 1→0 kick · `mix(a, b, p)` · `fa(n)` Persian digits · `rnd(i, k)` stable random · `glow(color, r)` CSS filter.
- Type: `<Title y size color? t at o?>` blur-in title with a light sweep (yellow = shiny) · `<Chip text t t0 tone>` pill (tone red|cyan|yellow|violet|green) inside `<ChipRow y>`.
- Effects: `<Ripple x y t at c? r?>` · `<Burst x y t at c?>` (12 sparks).
- Stats: `<Counter from to t t0 t1 y size? color? prefix? suffix?>` counting number · `<CompareBars t at y rows=[{label, value 0..1, c, at?}]>` · `<Plane x y s t at>` paper-plane "send" icon.
- Template: `<ReelTemplate spec guides?>` with `ReelSpec` = {`audio?`, `words`, `scenes`, `hook: FC<{t}>`, `chapters: [{name, at, vis: FC<{t}>, chips?: [{text, at, tone?}], hits?: [{at, c?}]}]`, `cta: FC<{t}>`, `danger?: [{at, amount?, d?}]` red tint, `flash?: [s]` white flash, `footer?`}.

Fixed vertical bands (1080×1920): rail 262 · chapter number 420 · chapter title 570 ·
**chapter visual 640–1110** · chips 1150 · captions 1270 · footer 1395. Hook and CTA are free
but stay inside x 80..920, y 230..1440.

## Style rules (already in the template; keep them in your visuals)

- Minimal: navy backdrop, no grids or lines; one hero object per chapter, neon strokes with `glow`.
- Motion lively but restrained: things enter on the spoken word (cue = word time − 0.1…0.3 s),
  one `punch`/`Ripple` on the key word, nothing loops faster than ~1 Hz except tiny details.
- 2D transforms only (translate/scale/rotate). No `translate3d`, `will-change`, springs or
  animated `left/top` — they jitter in Remotion renders.
- Persian text always `dir="rtl" lang="fa"` with the `FA` font; numbers via `fa()`. Inside SVG use
  `<text textAnchor="middle">` without `direction` attributes (they clip Persian).
- Every word on screen is also spoken or is a 1–3 word label. Captions are automatic.

More: `references/viral-playbook.md` (topics, hooks, CTA, caption) ·
`references/troubleshooting.md` (Chrome download, ElevenLabs file quirk, Whisper, audio offset).
