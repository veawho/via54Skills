"""
One-shot OG card generator for via54Skills.
Output: docs/public/og-image.png (1200×630)
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

# Brand palette
BG_TOP    = (15, 23, 42)     # slate-900
BG_BOT    = (30, 41, 59)     # slate-800
ACCENT    = (59, 130, 246)   # blue-500
TEXT_MAIN = (248, 250, 252)  # slate-50
TEXT_DIM  = (148, 163, 184)  # slate-400

W, H = 1200, 630

# Build vertical gradient
img = Image.new("RGB", (W, H))
draw = ImageDraw.Draw(img)
for y in range(H):
    t = y / H
    r = int(BG_TOP[0] * (1 - t) + BG_BOT[0] * t)
    g = int(BG_TOP[1] * (1 - t) + BG_BOT[1] * t)
    b = int(BG_TOP[2] * (1 - t) + BG_BOT[2] * t)
    draw.line([(0, y), (W, y)], fill=(r, g, b))

# Find a usable font. Fall back to default if no TTF available.
font_paths = [
    "/System/Library/Fonts/HelveticaNeue.ttc",
    "/System/Library/Fonts/Helvetica.ttc",
    "/System/Library/Fonts/SFNSMono.ttf",
    "/Library/Fonts/Arial.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
]
font_big = None
font_med = None
font_small = None
for fp in font_paths:
    try:
        font_big   = ImageFont.truetype(fp, 96)
        font_med   = ImageFont.truetype(fp, 48)
        font_small = ImageFont.truetype(fp, 28)
        break
    except OSError:
        continue
if font_big is None:
    font_big = font_med = font_small = ImageFont.load_default()

# Accent left bar
draw.rectangle([(0, 0), (12, H)], fill=ACCENT)

# Top tag: via54 (the brand prefix)
draw.text((72, 72), "via54", font=font_med, fill=ACCENT)

# Main title
draw.text((72, 160), "via54Skills", font=font_big, fill=TEXT_MAIN)

# Tagline
draw.text((72, 280), "Personal Skills for", font=font_med, fill=TEXT_DIM)
draw.text((72, 340), "Hermes / Claude / OpenClaw / OpenCode / Codex",
          font=font_med, fill=TEXT_MAIN)

# Bottom-left: GitHub URL
draw.text((72, 540), "github.com/veawho/via54Skills",
          font=font_small, fill=TEXT_DIM)

# Bottom-right: bilingual marker
draw.text((W - 72 - 200, 540), "中文 · English",
          font=font_small, fill=ACCENT)

out = Path("docs/public/og-image.png")
out.parent.mkdir(parents=True, exist_ok=True)
img.save(out, format="PNG", optimize=True)
print(f"  wrote {out} ({out.stat().st_size} bytes, {W}×{H})")