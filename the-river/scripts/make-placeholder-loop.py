# Run from anywhere: python3 scripts/make-placeholder-loop.py   (needs ffmpeg)
# Writes media-src/aerial-omo.mp4, then `npm run media` encodes it for the web.
# A seamless 16 s loop: a slow, eased push in and back out on the aerial photograph.
import math, subprocess
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parent.parent
src = Image.open(ROOT / "media-src" / "originals" / "Filming-and-photography-in-Ethiopia-omo-valley.webp").convert("RGB")
SW, SH = src.size
W, H, FPS, T = 1920, 1280, 24, 16
N = FPS * T
ff = subprocess.Popen(["ffmpeg","-hide_banner","-loglevel","error","-y","-f","rawvideo","-pix_fmt","rgb24","-s",f"{W}x{H}","-r",str(FPS),"-i","-",
    "-an","-c:v","libx264","-crf","10","-preset","veryfast","-pix_fmt","yuv420p",str(ROOT / "media-src" / "aerial-omo.mp4")], stdin=subprocess.PIPE)
for i in range(N):
    s = 0.5 - 0.5 * math.cos(2 * math.pi * i / N)      # 0 -> 1 -> 0, eased at both ends, so frame N-1 flows into frame 0
    z = 1 + 0.07 * s
    w, h = SW / z, SH / z
    cx = SW / 2 + 22 * (s - 0.5)                          # a small drift, same rhythm
    cy = SH / 2 + 18 * (s - 0.5)
    x0 = min(max(cx - w / 2, 0), SW - w)                  # never look past the edge of the photograph
    y0 = min(max(cy - h / 2, 0), SH - h)
    box = (x0, y0, x0 + w, y0 + h)
    ff.stdin.write(src.resize((W, H), Image.LANCZOS, box=box).tobytes())
ff.stdin.close(); ff.wait()
print("frames", N, "exit", ff.returncode)
