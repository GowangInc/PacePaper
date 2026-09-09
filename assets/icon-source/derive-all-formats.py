"""Derive the complete PacePaper icon asset set from the B3 normalized geometry.

Tiering: full art >= 64px (downscaled from the 1024 master), simplified
bead counts for 32px and 16px so the mark stays structured at small sizes.
"""
from PIL import Image, ImageDraw
import os

ROOT = "/Users/nicholas/Insync/nicholasjgowan@gmail.com/Google Drive/toys/DigitalDP"
NAVY = (23, 32, 51)
PAPER = (241, 231, 208)
INK = (23, 32, 51)
TEAL = (46, 120, 143)
VERMILION = (184, 62, 53)

# normalized path: x = 260/1024..760/1024 etc.
def pt(t):
    x = 0.25390625 + 0.48828125 * t
    y = 0.6875 - 0.365234375 * t + 0.4296875 * t * (1 - t)
    return x, y


def render(P, beads, bead_scale, stroke):
    SS = 4
    S = P * SS
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, S, S], radius=int(S * 0.219), fill=NAVY)
    px = lambda v: int(v * SS)
    d.rounded_rectangle([px(P * 0.1797), px(P * 0.1953), px(P * 0.8203), px(P * 0.8047)],
                        radius=px(P * 0.035), fill=PAPER)
    pts = []
    n = 260
    for k in range(int(n * 0.9) + 1):
        x, y = pt(k / n)
        pts.append((px(x * P), px(y * P)))
    d.line(pts, fill=INK, width=max(1, int(P * stroke)), joint="curve")
    for i, t in enumerate(beads):
        x, y = pt(t)
        col = VERMILION if i == len(beads) - 1 else TEAL
        rad = px(P * bead_scale)
        cx, cy = px(x * P), px(y * P)
        d.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], fill=col)
    bs = px(P * 0.0547)
    sx, sy = px(P * 0.1992), px(P * 0.6602)
    d.rounded_rectangle([sx, sy, sx + bs, sy + bs], radius=px(P * 0.0127), fill=INK)
    rr = bs - px(P * 0.0127) * 2
    d.ellipse([sx + px(P * 0.0127), sy + px(P * 0.0127), sx + px(P * 0.0127) + rr, sy + px(P * 0.0127) + rr], fill=PAPER)
    return img.resize((P, P), Image.LANCZOS)


def full_art(P):
    master = Image.open(os.path.join(os.path.expanduser("~"), "Sync/shared/pictures/pacepaper-icon-candidates/linework/pacepaper-linework-B3-beatarc-1024.png"))
    return master.resize((P, P), Image.LANCZOS)


FULL = (512, 256, 180, 128, 64)
MID_32 = lambda P: render(P, (0.18, 0.50, 0.82), 0.046, 0.020)
TINY_16 = lambda P: render(P, (0.28, 0.72), 0.052, 0.023)

# public web icons
pub = os.path.join(ROOT, "public")
sizes = {512: full_art, 192: full_art, 64: full_art, 180: full_art}
for px_, fn in sizes.items():
    im = fn(px_)
    name = "apple-touch-icon.png" if px_ == 180 else f"app-icon-{px_}.png"
    im.save(os.path.join(pub, name))
    print("public", name)

# assets master (1024), icns, ico
master = Image.open(os.path.join(os.path.expanduser("~"), "Sync/shared/pictures/pacepaper-icon-candidates/linework/pacepaper-linework-B3-beatarc-1024.png"))
master.save(os.path.join(ROOT, "assets", "app-icon-master.png"))
print("assets app-icon-master.png")

# icns via iconset
ic = os.path.join(ROOT, "assets", "AppIcon.iconset")
os.makedirs(ic, exist_ok=True)
spec = {
    "icon_16x16.png": 16, "icon_16x16@2x.png": 32, "icon_32x32.png": 32,
    "icon_32x32@2x.png": 64, "icon_128x128.png": 128, "icon_128x128@2x.png": 256,
    "icon_256x256.png": 256, "icon_256x256@2x.png": 512, "icon_512x512.png": 512,
    "icon_512x512@2x.png": 1024,
}
for name, px_ in spec.items():
    if px_ <= 16:
        im = TINY_16(px_ * (2 if "@2x" in name else 1))
        if "@2x" in name:
            im = im.resize((px_, px_), Image.LANCZOS)
    elif px_ <= 32:
        im = MID_32(px_ * (2 if "@2x" in name else 1))
        if "@2x" in name:
            im = im.resize((px_, px_), Image.LANCZOS)
    else:
        im = full_art(px_)
    im.save(os.path.join(ic, name))
os.system(f"iconutil -c icns {ic} -o {os.path.join(ROOT, 'assets', 'app-icon.icns')}")
print("icns done")

# ico with tiered slots
ico_frames = []
for px_ in (256, 128, 64, 48, 32, 24, 16):
    if px_ <= 16:
        im = TINY_16(px_)
    elif px_ <= 32:
        im = MID_32(px_)
    else:
        im = full_art(px_)
    ico_frames.append(im)
ico_frames[0].save(os.path.join(ROOT, "assets", "app-icon.ico"), format="ICO",
                   sizes=[(f.width, f.height) for f in ico_frames],
                   append_images=ico_frames[1:])
print("ico done")
