"""Find an ffmpeg binary: imageio-ffmpeg's, else the one Remotion ships, else ffmpeg on PATH."""
import glob
import os
import shutil

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")


def ffmpeg():
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        pass
    for p in glob.glob(os.path.join(ROOT, "node_modules", "@remotion", "compositor-*", "ffmpeg*")):
        if os.path.isfile(p):
            return p
    p = shutil.which("ffmpeg")
    if p:
        return p
    raise SystemExit("ffmpeg not found: pip install imageio-ffmpeg")
