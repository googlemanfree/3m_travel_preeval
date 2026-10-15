#!/usr/bin/env python3
"""Generate circular seal logo for 3M GROUP SARL brand kit."""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path("/workspace")
BRAND = ROOT / "client/public/brand"
ARTIFACTS = Path("/opt/cursor/artifacts")

EMBLEM_CANDIDATES = [
    ARTIFACTS / "assets/3m-group-icons-no-labels-v2.jpg",
    BRAND / "3m-group-mark.png",
    BRAND / "3m-group-logo.png",
]

NAVY = (11, 42, 82)
CYAN = (56, 168, 224)
WHITE = (255, 255, 255)

FONT_BOLD = "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf"
FONT_REG = "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf"

TOP_ARC = "3M GROUP SARL"
BOTTOM_ARC = "L'AFRIQUE VERS LE MONDE"


def knock_white(im: Image.Image, threshold: int = 248) -> Image.Image:
    rgba = im.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if r >= threshold and g >= threshold and b >= threshold:
                px[x, y] = (r, g, b, 0)
    return rgba


def content_bbox(im: Image.Image, threshold: int = 245, pad: int = 8):
    rgba = im.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size
    minx, miny, maxx, maxy = w, h, 0, 0
    found = False
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 8:
                continue
            if r >= threshold and g >= threshold and b >= threshold:
                continue
            found = True
            minx = min(minx, x)
            miny = min(miny, y)
            maxx = max(maxx, x)
            maxy = max(maxy, y)
    if not found:
        return (0, 0, w, h)
    return (
        max(0, minx - pad),
        max(0, miny - pad),
        min(w, maxx + pad + 1),
        min(h, maxy + pad + 1),
    )


def load_emblem() -> Image.Image:
    for path in EMBLEM_CANDIDATES:
        if not path.exists():
            continue
        im = Image.open(path).convert("RGBA")
        # If horizontal lockup, crop left emblem
        if im.width > im.height * 1.4:
            im = im.crop((0, 0, int(im.width * 0.42), im.height))
        box = content_bbox(im)
        im = im.crop(box)
        return knock_white(im)
    raise FileNotFoundError("No emblem source found")


def circular_mask(size: int) -> Image.Image:
    m = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(m)
    d.ellipse((0, 0, size - 1, size - 1), fill=255)
    return m


def fit_in_circle(emblem: Image.Image, diameter: int, inset: float = 0.78) -> Image.Image:
    """Place emblem centered in a transparent square of `diameter`."""
    canvas = Image.new("RGBA", (diameter, diameter), (0, 0, 0, 0))
    target = int(diameter * inset)
    e = emblem.copy()
    e.thumbnail((target, target), Image.Resampling.LANCZOS)
    x = (diameter - e.width) // 2
    y = (diameter - e.height) // 2
    canvas.paste(e, (x, y), e)
    return canvas


def draw_arc_text(
    base: Image.Image,
    text: str,
    radius: float,
    font: ImageFont.FreeTypeFont,
    fill,
    start_angle_deg: float,
    clockwise: bool = True,
    tracking: float = 1.08,
) -> None:
    """Draw text along a circular arc. Angles: 0° = right, 90° = bottom (PIL)."""
    draw = ImageDraw.Draw(base)
    cx = cy = base.width / 2
    # Measure total arc length needed
    widths = [draw.textlength(ch, font=font) for ch in text]
    gaps = [font.size * 0.06 * tracking] * max(len(text) - 1, 0) + [0]
    total = sum(widths) + sum(gaps[:-1] if gaps else [0])
    # Angular span in radians
    span = total / radius
    if clockwise:
        # Center the arc around start_angle (which is the midpoint for bottom text)
        # For top arc we pass start as leftmost; for bottom as leftmost going clockwise
        angle = math.radians(start_angle_deg)
    else:
        angle = math.radians(start_angle_deg)

    # Recenter: start so text is centered on the intended mid-angle
    mid = math.radians(start_angle_deg)
    if clockwise:
        angle = mid - span / 2
    else:
        angle = mid + span / 2

    for i, ch in enumerate(text):
        cw = widths[i]
        # Position at center of character
        half = (cw / 2) / radius
        if clockwise:
            a = angle + half
        else:
            a = angle - half
        x = cx + radius * math.cos(a)
        y = cy + radius * math.sin(a)
        # Rotation: tangent
        if clockwise:
            rot = -math.degrees(a) - 90
        else:
            rot = -math.degrees(a) + 90
        # Render single char
        bbox = font.getbbox(ch)
        tw = max(bbox[2] - bbox[0], 1)
        th = max(bbox[3] - bbox[1], 1)
        pad = 4
        tile = Image.new("RGBA", (tw + pad * 2, th + pad * 2), (0, 0, 0, 0))
        ImageDraw.Draw(tile).text((pad - bbox[0], pad - bbox[1]), ch, font=font, fill=fill)
        tile = tile.rotate(rot, resample=Image.Resampling.BICUBIC, expand=True)
        tx = int(x - tile.width / 2)
        ty = int(y - tile.height / 2)
        base.alpha_composite(tile, (tx, ty))
        step = (cw + (gaps[i] if i < len(gaps) else 0)) / radius
        if clockwise:
            angle += step
        else:
            angle -= step


def build_seal(size: int = 2048, dark: bool = False) -> Image.Image:
    emblem = load_emblem()
    # Outer seal on transparent (or dark disc for dark variant)
    if dark:
        canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        disc = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        d = ImageDraw.Draw(disc)
        d.ellipse((0, 0, size - 1, size - 1), fill=(*NAVY, 255))
        canvas = Image.alpha_composite(canvas, disc)
    else:
        canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))

    draw = ImageDraw.Draw(canvas)
    # Outer rings
    m = 18
    draw.ellipse((m, m, size - 1 - m, size - 1 - m), outline=CYAN if dark else NAVY, width=max(4, size // 180))
    m2 = int(size * 0.055)
    draw.ellipse((m2, m2, size - 1 - m2, size - 1 - m2), outline=NAVY if not dark else (200, 220, 240), width=max(6, size // 120))
    # Inner hairline
    m3 = int(size * 0.12)
    draw.ellipse((m3, m3, size - 1 - m3, size - 1 - m3), outline=CYAN, width=max(2, size // 400))

    # Emblem in center
    inner = fit_in_circle(emblem, size, inset=0.62 if not dark else 0.58)
    # Soft circular clip of emblem area only for cleanliness
    mask = circular_mask(size)
    # Slightly smaller mask so rings stay
    inset_mask = Image.new("L", (size, size), 0)
    idr = ImageDraw.Draw(inset_mask)
    pad = int(size * 0.125)
    idr.ellipse((pad, pad, size - 1 - pad, size - 1 - pad), fill=255)
    clipped = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    clipped.paste(inner, (0, 0), inset_mask)
    canvas = Image.alpha_composite(canvas, clipped)

    # Arc text
    font_size = max(28, size // 18)
    font = ImageFont.truetype(FONT_BOLD, font_size)
    text_fill = WHITE if dark else NAVY
    text_radius = size * 0.43
    # Top arc: centered at top (-90° in standard math = 270° PIL? )
    # PIL: 0° east, 90° south, 180° west, 270°/-90° north
    draw_arc_text(canvas, TOP_ARC, text_radius, font, text_fill, start_angle_deg=-90, clockwise=True, tracking=1.15)
    font_b = ImageFont.truetype(FONT_REG, max(22, size // 22))
    draw_arc_text(canvas, BOTTOM_ARC, text_radius, font_b, CYAN if dark else (37, 99, 180), start_angle_deg=90, clockwise=False, tracking=1.05)

    # Separator dots at 3 and 9 o'clock
    for ang in (0, 180):
        a = math.radians(ang)
        cx = cy = size / 2
        x = cx + text_radius * math.cos(a)
        y = cy + text_radius * math.sin(a)
        r = max(4, size // 160)
        ImageDraw.Draw(canvas).ellipse((x - r, y - r, x + r, y + r), fill=CYAN)

    # Final circular alpha (soft edge)
    final_mask = circular_mask(size).filter(ImageFilter.GaussianBlur(radius=0.6))
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(canvas, (0, 0), final_mask)
    return out


def also_plain_circle(size: int = 2048) -> Image.Image:
    """True circular emblem only (no ring text) — avatar / favicon style."""
    emblem = load_emblem()
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    # Soft white disc behind for contrast on dark UIs optional — keep transparent
    fitted = fit_in_circle(emblem, size, inset=0.92)
    mask = circular_mask(size)
    canvas.paste(fitted, (0, 0), mask)
    # Thin navy rim
    d = ImageDraw.Draw(canvas)
    d.ellipse((4, 4, size - 5, size - 5), outline=(*NAVY, 220), width=max(3, size // 220))
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(canvas, (0, 0), mask)
    return out


def write_svg_stub(png_path: Path, out_svg: Path, size_mm: float = 60) -> None:
    import base64

    b64 = base64.b64encode(png_path.read_bytes()).decode("ascii")
    svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="{size_mm}mm" height="{size_mm}mm" viewBox="0 0 1000 1000">
  <title>3M GROUP SARL — logo circulaire</title>
  <image x="0" y="0" width="1000" height="1000" xlink:href="data:image/png;base64,{b64}"/>
</svg>
'''
    # Embed a downscaled preview to keep SVG smaller
    im = Image.open(png_path).convert("RGBA")
    im.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
    from io import BytesIO

    buf = BytesIO()
    im.save(buf, format="PNG", optimize=True)
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")
    svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="{size_mm}mm" height="{size_mm}mm" viewBox="0 0 1000 1000">
  <title>3M GROUP SARL — logo circulaire</title>
  <image x="0" y="0" width="1000" height="1000" xlink:href="data:image/png;base64,{b64}"/>
</svg>
'''
    out_svg.write_text(svg, encoding="utf-8")


def main():
    BRAND.mkdir(parents=True, exist_ok=True)
    ARTIFACTS.mkdir(parents=True, exist_ok=True)

    seal = build_seal(2048, dark=False)
    seal_dark = build_seal(2048, dark=True)
    plain = also_plain_circle(2048)

    paths = {
        BRAND / "3m-group-logo-circular.png": seal,
        BRAND / "3m-group-logo-circular-dark.png": seal_dark,
        BRAND / "3m-group-logo-circular-mark.png": plain,
    }
    for path, im in paths.items():
        im.save(path, "PNG", optimize=True)
        print(f"wrote {path} {im.size}")

    # Preview on white / navy for artifacts
    for name, im, bg in [
        ("logo-circular-3m-group.png", seal, (247, 249, 252, 255)),
        ("logo-circular-3m-group-dark.png", seal_dark, (6, 26, 54, 255)),
        ("logo-circular-3m-group-mark.png", plain, (247, 249, 252, 255)),
    ]:
        bg_im = Image.new("RGBA", im.size, bg)
        comp = Image.alpha_composite(bg_im, im)
        # also smaller preview
        preview = comp.copy()
        preview.thumbnail((900, 900), Image.Resampling.LANCZOS)
        preview.convert("RGB").save(ARTIFACTS / name, "PNG", optimize=True)

    write_svg_stub(BRAND / "3m-group-logo-circular.png", BRAND / "3m-group-logo-circular.svg")
    print("done")


if __name__ == "__main__":
    main()
