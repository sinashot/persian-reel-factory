# Troubleshooting

**Remotion cannot download Chrome Headless Shell (403 / "not available in your location").**
Download `https://cdn.npmmirror.com/binaries/chrome-for-testing/<VERSION>/win64/chrome-headless-shell-win64.zip`
(`linux64` / `mac-arm64` for other systems), unzip into
`node_modules/.remotion/chrome-headless-shell/<platform>/`, and write `<VERSION>` (no newline) to
`node_modules/.remotion/chrome-headless-shell/VERSION`. VERSION is Remotion's tested Chrome
version (149.0.7790.0 for remotion 4.0.530).

**ElevenLabs file is empty / 0 bytes on Windows.** The MCP names files `tts_<first words>.mp3`.
A ":" near the start of the text makes Windows write the audio into an NTFS alternate data
stream. Keep ":" out of TTS text (or read it with PowerShell `Get-Content -Stream`).

**Whisper: "metadata_errors" / decode error.** `reel_words.py` decodes with librosa and passes a
numpy array to faster-whisper, which avoids PyAV version clashes. Keep it that way.

**Captions drift on one line.** `reel_words.py` keeps align_vo's times when Whisper heard a very
different number of words or a span much shorter than the line (it prints "kept align_vo
times"). Re-run `align_vo.py` then `reel_words.py`; if one line is still off, regenerate that
line's voice.

**Audio ~40 ms late in the rendered MP4.** Remotion's AAC encode adds a small offset. Always run
`tools/mux.py` on the render: it copies the picture and puts `mix.wav` back on.

**Persian text clipped or reversed in SVG.** Do not set `direction="rtl"` on SVG `<text>`; use
`textAnchor="middle"` and position, or draw the text in an HTML div with `dir="rtl"`.

**Jittery motion.** Animate only `transform` (translate/scale/rotate) and `opacity`. No
`translate3d`, `will-change`, springs, or animated `left/top`.

**Text under the like/comment buttons.** Check the `<Id>Guides` stills: red bands are the
Instagram UI. Keep every word inside x 80..920, y 230..1440.
