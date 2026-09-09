"""PacePaper linework icon B3 — polished rising beat arc (final candidate)."""
from PIL import Image, ImageDraw

SS = 4
S = 1024 * SS
NAVY = (23, 32, 51)
PAPER = (241, 231, 208)
INK = (23, 32, 51)
TEAL = (46, 120, 143)
VERMILION = (184, 62, 53)


def path_pt(t):
    x = 260 + 500 * t
    y = 704 - 374 * t + 110 * 4 * t * (1 - t)
    return x, y


def draw():
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    r = int(S * 0.219)
    d.rounded_rectangle([0, 0, S, S], radius=r, fill=NAVY)
    px = lambda v: int(v * SS)
    d.rounded_rectangle([px(184), px(200), px(840), px(824)], radius=px(36), fill=PAPER)

    # arc emerges from the origin square and ends shortly past the finish bead
    pts = []
    n = 260
    for k in range(int(n * 0.9) + 1):
        t = k / n
        x, y = path_pt(t)
        pts.append((px(x), px(y)))
    d.line(pts, fill=INK, width=px(18), joint="curve")

    # beads follow the same path (teal x4, vermilion finish)
    for i, t in enumerate((0.16, 0.34, 0.52, 0.70, 0.86)):
        x, y = path_pt(t)
        rad = px(36 if i == 4 else 32)
        cx, cy = px(x), px(y)
        color = VERMILION if i == 4 else TEAL
        d.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], fill=color)

    # bold origin square with ivory core dot, arc rooted at its right edge
    bs = px(56)
    sx, sy = px(204), px(676)
    d.rounded_rectangle([sx, sy, sx + bs, sy + bs], radius=px(13), fill=INK)
    d.ellipse([sx + px(13), sy + px(13), sx + bs - px(13), sy + bs - px(13)], fill=PAPER)

    img = img.resize((1024, 1024), Image.LANCZOS)
    return img


def sizes_strip(im):
    strip = Image.new("RGBA", (3 * 128, 128), NAVY)
    for i, px_ in enumerate((128, 64, 32)):
        c = im.resize((px_, px_), Image.LANCZOS)
        strip.paste(c, (i * 128 + (128 - px_) // 2, (128 - px_) // 2), c)
    return strip


if __name__ == "__main__":
    import os
    out = os.path.expanduser("~/Sync/shared/pictures/pacepaper-icon-candidates/linework")
    os.makedirs(out, exist_ok=True)
    im = draw()
    im.save(os.path.join(out, "pacepaper-linework-B3-beatarc-1024.png"))
    sizes_strip(im).save(os.path.join(out, "pacepaper-linework-B3-beatarc-sizes.png"))
    print("saved")
