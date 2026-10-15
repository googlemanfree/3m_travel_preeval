#!/usr/bin/env python3
"""Generate premium A4 letterhead assets for 3M GROUP SARL brand kit."""

from __future__ import annotations

import base64
import io
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

ROOT = Path("/workspace")
BRAND = ROOT / "client/public/brand"
ARTIFACTS = Path("/opt/cursor/artifacts")
LOGO_PATH = BRAND / "3m-group-logo.png"
MARK_PATH = BRAND / "3m-group-mark.png"

NAVY = (11, 42, 82)  # #0B2A52
NAVY_DEEP = (6, 26, 54)  # #061A36
CYAN = (56, 168, 224)  # accent
ROYAL = (37, 99, 180)
INK = (18, 32, 52)
MUTED = (90, 108, 130)
RULE = (180, 198, 220)
PAPER = (247, 249, 252)
PAPER_WARM = (252, 253, 255)

FONT_REG = "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf"
FONT_DISP = "/usr/share/fonts/truetype/noto/NotoSansDisplay-Bold.ttf"
FONT_ITALIC = "/usr/share/fonts/truetype/noto/NotoSansDisplay-Italic.ttf"

# Devise de marque (alignée sur INTERNATIONAL_BRAND.slogan)
BRAND_MOTTO = "L’Afrique vers le monde."

# Services du groupe (emblème multi-pôles — labels pour l’en-tête)
GROUP_SERVICES = (
    "Études · Travail · Voyages · Visas · Immigration · "
    "Hôtellerie · Digital · Sécurité · Assurance · Conseil"
)

# Contact block (GROUP letterhead — parent entity)
LINES_RIGHT = [
    "hello@3mtravelagency.com",
    "contact@3mtravelagency.com",
    "+237 620 996 045",
    "WhatsApp Yaoundé +237 698 104 832",
    "WhatsApp Ottawa +1 672 897 2999",
    "www.3mtravelagency.com",
]
FOOTER_L1 = "Biyem-Assi, Montée Chapelle Obili · Yaoundé, Cameroun  ·  Ottawa, Ontario, Canada"
FOOTER_L2 = "RC/YAO/2019/A/2567  ·  NIU M112417203369H  ·  3M Group SARL"


def knock_white(im: Image.Image, threshold: int = 248) -> Image.Image:
    """Make near-white background transparent."""
    rgba = im.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if r >= threshold and g >= threshold and b >= threshold:
                px[x, y] = (r, g, b, 0)
    return rgba


def crop_content(im: Image.Image, pad: int = 16, threshold: int = 245) -> Image.Image:
    """Tight crop around non-white artwork so the lockup can span the header."""
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
            if x < minx:
                minx = x
            if y < miny:
                miny = y
            if x > maxx:
                maxx = x
            if y > maxy:
                maxy = y
    if not found:
        return rgba
    box = (
        max(0, minx - pad),
        max(0, miny - pad),
        min(w, maxx + pad + 1),
        min(h, maxy + pad + 1),
    )
    return rgba.crop(box)


def load_fonts(scale: float):
    def f(path: str, size: float):
        return ImageFont.truetype(path, int(round(size * scale)))

    return {
        "contact": f(FONT_REG, 9.5),
        "contact_sm": f(FONT_REG, 8.2),
        "services": f(FONT_BOLD, 7.6),
        "motto": f(FONT_ITALIC, 11.5),
        "footer": f(FONT_REG, 7.4),
        "footer_bold": f(FONT_BOLD, 7.4),
        "tag": f(FONT_BOLD, 7.0),
        "sample": f(FONT_REG, 11),
        "sample_title": f(FONT_DISP, 13),
    }


def draw_spaced_text(
    draw: ImageDraw.ImageDraw,
    text: str,
    xy: tuple[float, float],
    font: ImageFont.FreeTypeFont,
    fill,
    tracking: float = 1.35,
) -> float:
    """Draw centered text with letter-spacing; returns rendered width."""
    chars = list(text)
    widths = [draw.textlength(ch, font=font) for ch in chars]
    gaps = tracking * font.size * 0.08
    total = sum(widths) + gaps * max(len(chars) - 1, 0)
    x0 = xy[0] - total / 2
    y = xy[1]
    x = x0
    for ch, cw in zip(chars, widths):
        draw.text((x, y), ch, font=font, fill=fill)
        x += cw + gaps
    return total


def paper_background(w: int, h: int) -> Image.Image:
    """Cool paper with subtle vertical atmosphere (not flat white)."""
    img = Image.new("RGB", (w, h), PAPER)
    draw = ImageDraw.Draw(img)
    for y in range(h):
        t = y / max(h - 1, 1)
        # Soft top wash toward deep navy, very light
        r = int(PAPER_WARM[0] * (1 - t * 0.02) + 236 * (t * 0.02))
        g = int(PAPER_WARM[1] * (1 - t * 0.03) + 242 * (t * 0.03))
        b = int(255 * (1 - t * 0.04) + 248 * (t * 0.04))
        # Slightly cooler near top
        top = max(0.0, 1.0 - y / (h * 0.35))
        r = int(r * (1 - top * 0.015) + 232 * top * 0.015)
        g = int(g * (1 - top * 0.01) + 240 * top * 0.01)
        b = int(min(255, b + top * 4))
        draw.line([(0, y), (w, y)], fill=(r, g, b))
    # Soft vignette corners via blur overlay
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.rectangle([0, 0, w, int(h * 0.08)], fill=(*NAVY, 6))
    od.rectangle([0, int(h * 0.92), w, h], fill=(*NAVY, 5))
    overlay = overlay.filter(ImageFilter.GaussianBlur(radius=max(8, int(w * 0.01))))
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    return img


def place_watermark(base: Image.Image, mark: Image.Image, opacity: float = 0.045) -> None:
    w, h = base.size
    mw = int(w * 0.42)
    m = mark.copy()
    m.thumbnail((mw, mw), Image.Resampling.LANCZOS)
    if m.mode != "RGBA":
        m = knock_white(m)
    else:
        # ensure transparency on white
        m = knock_white(m)
    alpha = m.split()[3].point(lambda p: int(p * opacity))
    m.putalpha(alpha)
    x = (w - m.width) // 2
    y = int(h * 0.42) - m.height // 2
    base.paste(m, (x, y), m)


def draw_gradient_rule(draw: ImageDraw.ImageDraw, x0: int, x1: int, y: int, thick: int):
    span = max(x1 - x0, 1)
    for i in range(span):
        t = i / span
        r = int(CYAN[0] * (1 - t) + NAVY[0] * t)
        g = int(CYAN[1] * (1 - t) + NAVY[1] * t)
        b = int(CYAN[2] * (1 - t) + NAVY[2] * t)
        draw.line([(x0 + i, y), (x0 + i, y + thick - 1)], fill=(r, g, b))


def render_letterhead_png(
    out_path: Path,
    dpi: int = 300,
    with_sample: bool = False,
) -> Image.Image:
    # A4 mm
    w = int(210 / 25.4 * dpi)
    h = int(297 / 25.4 * dpi)
    scale = dpi / 72.0  # ~4.166 at 300dpi
    fonts = load_fonts(scale)
    margin = int(18 / 25.4 * dpi)  # 18mm
    img = paper_background(w, h)

    # Watermark
    if MARK_PATH.exists():
        place_watermark(img, Image.open(MARK_PATH), opacity=0.04)
    elif LOGO_PATH.exists():
        logo_full = Image.open(LOGO_PATH)
        # crop left emblem roughly
        place_watermark(img, logo_full.crop((0, 0, int(logo_full.width * 0.42), logo_full.height)), 0.04)

    draw = ImageDraw.Draw(img)

    # Logo — extended across the full header band
    content_w = w - 2 * margin
    logo = knock_white(crop_content(Image.open(LOGO_PATH)))
    logo_w = content_w  # span edge-to-edge within margins
    logo_h = int(round(logo.height * (logo_w / logo.width)))
    # Allow full content width (cropped lockup ~2.7:1 → ~22% page height)
    max_h = int(h * 0.225)
    if logo_h > max_h:
        logo_h = max_h
        logo_w = int(round(logo.width * (logo_h / logo.height)))
    logo = logo.resize((logo_w, logo_h), Image.Resampling.LANCZOS)
    logo_y = int(10 / 25.4 * dpi)
    logo_x = margin + (content_w - logo_w) // 2
    img.paste(logo, (logo_x, logo_y), logo)

    # Devise de marque — sous le lockup, au-dessus des contacts
    motto_y = logo_y + logo_h + int(2.4 / 25.4 * dpi)
    draw_spaced_text(
        draw,
        BRAND_MOTTO.upper(),
        (w / 2, motto_y),
        fonts["motto"],
        NAVY,
        tracking=1.6,
    )
    motto_bottom = motto_y + fonts["motto"].size

    # Services — bandeau sous la devise
    services_y = motto_bottom + int(2.2 / 25.4 * dpi)
    tw = draw.textlength(GROUP_SERVICES, font=fonts["services"])
    if tw > content_w:
        # Split into two balanced lines if needed
        parts = GROUP_SERVICES.split(" · ")
        mid = (len(parts) + 1) // 2
        svc_lines = [" · ".join(parts[:mid]), " · ".join(parts[mid:])]
    else:
        svc_lines = [GROUP_SERVICES]
    svc_step = int(fonts["services"].size * 1.45)
    for i, line in enumerate(svc_lines):
        tw = draw.textlength(line, font=fonts["services"])
        draw.text(
            ((w - tw) / 2, services_y + i * svc_step),
            line,
            font=fonts["services"],
            fill=ROYAL,
        )
    services_bottom = services_y + (len(svc_lines) - 1) * svc_step + fonts["services"].size

    # Contact meta strip under the services
    meta_lines = [
        "hello@3mtravelagency.com  ·  contact@3mtravelagency.com  ·  www.3mtravelagency.com",
        "+237 620 996 045  ·  WhatsApp Yaoundé +237 698 104 832  ·  WhatsApp Ottawa +1 672 897 2999",
    ]
    meta_y = services_bottom + int(2.6 / 25.4 * dpi)
    line_step = int(fonts["contact_sm"].size * 1.55)
    for i, line in enumerate(meta_lines):
        tw = draw.textlength(line, font=fonts["contact_sm"])
        draw.text(
            ((w - tw) / 2, meta_y + i * line_step),
            line,
            font=fonts["contact_sm"],
            fill=MUTED,
        )
    meta_bottom = meta_y + (len(meta_lines) - 1) * line_step + fonts["contact_sm"].size

    # Header rule under logo/contact
    rule_y = meta_bottom + int(3.5 / 25.4 * dpi)
    draw_gradient_rule(draw, margin, w - margin, rule_y, max(2, int(0.55 / 25.4 * dpi)))
    # Thin secondary hairline
    hair_y = rule_y + max(3, int(1.1 / 25.4 * dpi))
    draw.line([(margin, hair_y), (w - margin, hair_y)], fill=RULE, width=max(1, int(0.2 / 25.4 * dpi)))

    # Footer
    foot_top = h - margin - int(14 / 25.4 * dpi)
    draw.line([(margin, foot_top), (w - margin, foot_top)], fill=RULE, width=max(1, int(0.25 / 25.4 * dpi)))
    # Accent tick left
    tick_w = int(14 / 25.4 * dpi)
    draw.rectangle([margin, foot_top, margin + tick_w, foot_top + max(2, int(0.5 / 25.4 * dpi))], fill=CYAN)

    fy = foot_top + int(3.2 / 25.4 * dpi)
    for i, (text, font, color) in enumerate(
        [
            (FOOTER_L1, fonts["footer"], MUTED),
            (FOOTER_L2, fonts["footer_bold"], NAVY),
        ]
    ):
        tw = draw.textlength(text, font=font)
        draw.text(((w - tw) / 2, fy + i * int(fonts["footer"].size * 1.65)), text, font=font, fill=color)

    if with_sample:
        # Soft sample letter body (for preview only)
        body_top = hair_y + int(18 / 25.4 * dpi)
        sample_lines = [
            ("Yaoundé, le _______________", fonts["sample"], MUTED),
            ("", fonts["sample"], MUTED),
            ("Objet : ________________________________", fonts["sample_title"], NAVY),
            ("", fonts["sample"], MUTED),
            ("Madame, Monsieur,", fonts["sample"], INK),
            ("", fonts["sample"], MUTED),
            ("________________________________________________________________", fonts["sample"], RULE),
            ("________________________________________________________________", fonts["sample"], RULE),
            ("________________________________________________________________", fonts["sample"], RULE),
            ("________________________________________________________________", fonts["sample"], RULE),
            ("", fonts["sample"], MUTED),
            ("Veuillez agréer, Madame, Monsieur, l’expression de nos salutations distinguées.", fonts["sample"], INK),
            ("", fonts["sample"], MUTED),
            ("Pour 3M Group SARL", fonts["sample"], MUTED),
            ("________________________", fonts["sample"], MUTED),
        ]
        sy = body_top
        for text, font, color in sample_lines:
            if text:
                draw.text((margin, sy), text, font=font, fill=color)
            sy += int(fonts["sample"].size * 2.05)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_path, "PNG", dpi=(dpi, dpi), optimize=True)
    return img


def logo_data_uri() -> str:
    logo = knock_white(crop_content(Image.open(LOGO_PATH)))
    # Higher embed res for full-width header
    logo.thumbnail((2400, 1000), Image.Resampling.LANCZOS)
    buf = io.BytesIO()
    logo.save(buf, format="PNG", optimize=True)
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")
    return f"data:image/png;base64,{b64}"


def write_svg(out_path: Path) -> None:
    """Print-oriented SVG letterhead (A4 mm), logo spanning header."""
    uri = logo_data_uri()
    cropped = knock_white(crop_content(Image.open(LOGO_PATH)))
    aspect = cropped.width / cropped.height
    logo_w = 178.0  # full content width
    logo_h = round(logo_w / aspect, 2)
    max_h = 66.0
    if logo_h > max_h:
        logo_h = max_h
        logo_w = round(logo_h * aspect, 2)
    logo_x = round((210 - logo_w) / 2, 2)
    motto_y = 10 + logo_h + 5
    services_y = motto_y + 4.8
    meta_y1 = services_y + 4.6
    meta_y2 = meta_y1 + 4.2
    rule_y = meta_y2 + 4.5
    hair_y = rule_y + 2.2
    motto_svg = BRAND_MOTTO.upper()
    svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="210mm" height="297mm" viewBox="0 0 210 297">
  <defs>
    <linearGradient id="rule" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38A8E0"/>
      <stop offset="55%" stop-color="#2563B4"/>
      <stop offset="100%" stop-color="#0B2A52"/>
    </linearGradient>
    <linearGradient id="paper" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#F4F7FB"/>
      <stop offset="40%" stop-color="#F7F9FC"/>
      <stop offset="100%" stop-color="#FCFDFE"/>
    </linearGradient>
    <radialGradient id="wm" cx="50%" cy="52%" r="38%">
      <stop offset="0%" stop-color="#0B2A52" stop-opacity="0.035"/>
      <stop offset="100%" stop-color="#0B2A52" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="210" height="297" fill="url(#paper)"/>
  <circle cx="105" cy="160" r="72" fill="url(#wm)"/>

  <!-- Logo extended across header -->
  <image x="{logo_x}" y="10" width="{logo_w}" height="{logo_h}" preserveAspectRatio="xMidYMid meet"
         xlink:href="{uri}"/>

  <!-- Devise de marque -->
  <g font-family="Noto Sans Display, Noto Sans, Helvetica, Arial, sans-serif" text-anchor="middle">
    <text x="105" y="{motto_y}" font-size="3.6" font-style="italic" fill="#0B2A52"
          letter-spacing="1.4">{motto_svg}</text>
  </g>

  <!-- Services -->
  <g font-family="Noto Sans, Helvetica, Arial, sans-serif" text-anchor="middle">
    <text x="105" y="{services_y}" font-size="2.7" font-weight="700" fill="#2563B4">{GROUP_SERVICES}</text>
  </g>

  <!-- Contact meta under services (Yaoundé + Ottawa) -->
  <g font-family="Noto Sans, Helvetica, Arial, sans-serif" text-anchor="middle">
    <text x="105" y="{meta_y1}" font-size="2.85" fill="#5A6C82">hello@3mtravelagency.com  ·  contact@3mtravelagency.com  ·  www.3mtravelagency.com</text>
    <text x="105" y="{meta_y2}" font-size="2.85" fill="#5A6C82">+237 620 996 045  ·  WhatsApp Yaoundé +237 698 104 832  ·  WhatsApp Ottawa +1 672 897 2999</text>
  </g>

  <!-- Rules -->
  <rect x="16" y="{rule_y}" width="178" height="0.55" fill="url(#rule)"/>
  <line x1="16" y1="{hair_y}" x2="194" y2="{hair_y}" stroke="#B4C6DC" stroke-width="0.2"/>

  <!-- Footer -->
  <line x1="16" y1="272" x2="194" y2="272" stroke="#B4C6DC" stroke-width="0.25"/>
  <rect x="16" y="272" width="12" height="0.55" fill="#38A8E0"/>
  <g font-family="Noto Sans, Helvetica, Arial, sans-serif" text-anchor="middle">
    <text x="105" y="278.5" font-size="2.65" fill="#5A6C82">{FOOTER_L1}</text>
    <text x="105" y="283.2" font-size="2.65" font-weight="700" fill="#0B2A52">{FOOTER_L2}</text>
  </g>
</svg>
'''
    out_path.write_text(svg, encoding="utf-8")


def write_pdf(out_path: Path, preview_png: Path) -> None:
    """Vector-ish PDF: logo spans header width."""
    pdfmetrics.registerFont(TTFont("Noto", FONT_REG))
    pdfmetrics.registerFont(TTFont("NotoBold", FONT_BOLD))
    pdfmetrics.registerFont(TTFont("NotoItalic", FONT_ITALIC))

    c = canvas.Canvas(str(out_path), pagesize=A4)
    page_w, page_h = A4
    margin = 16 * mm
    content_w = page_w - 2 * margin

    # Paper wash
    c.setFillColorRGB(247 / 255, 249 / 255, 252 / 255)
    c.rect(0, 0, page_w, page_h, fill=1, stroke=0)

    # Logo — extended across header
    logo = knock_white(crop_content(Image.open(LOGO_PATH)))
    tmp = Path("/tmp/3m-letterhead-logo.png")
    logo.save(tmp, "PNG")
    logo_w = content_w
    logo_h = logo_w * (logo.height / logo.width)
    max_h = 66 * mm
    if logo_h > max_h:
        logo_h = max_h
        logo_w = logo_h * (logo.width / logo.height)
    logo_x = margin + (content_w - logo_w) / 2
    logo_y = page_h - 10 * mm - logo_h
    c.drawImage(
        str(tmp),
        logo_x,
        logo_y,
        width=logo_w,
        height=logo_h,
        mask="auto",
        preserveAspectRatio=True,
        anchor="sw",
    )

    # Devise de marque (letter-spaced manually)
    c.setFillColorRGB(*[x / 255 for x in NAVY])
    c.setFont("NotoItalic", 10)
    motto_y = logo_y - 4.2 * mm
    motto = BRAND_MOTTO.upper()
    gap = 1.2
    widths = [c.stringWidth(ch, "NotoItalic", 10) for ch in motto]
    total = sum(widths) + gap * max(len(motto) - 1, 0)
    x = (page_w - total) / 2
    for ch, cw in zip(motto, widths):
        c.drawString(x, motto_y, ch)
        x += cw + gap

    # Services under motto
    c.setFillColorRGB(*[x / 255 for x in ROYAL])
    c.setFont("NotoBold", 7)
    services_y = motto_y - 4.5 * mm
    c.drawCentredString(page_w / 2, services_y, GROUP_SERVICES)

    # Contact meta under services (Yaoundé + Ottawa)
    c.setFillColorRGB(*[x / 255 for x in MUTED])
    c.setFont("Noto", 7.2)
    meta_y1 = services_y - 4.5 * mm
    meta_y2 = meta_y1 - 4.0 * mm
    c.drawCentredString(
        page_w / 2,
        meta_y1,
        "hello@3mtravelagency.com  ·  contact@3mtravelagency.com  ·  www.3mtravelagency.com",
    )
    c.drawCentredString(
        page_w / 2,
        meta_y2,
        "+237 620 996 045  ·  WhatsApp Yaoundé +237 698 104 832  ·  WhatsApp Ottawa +1 672 897 2999",
    )

    # Gradient rule
    rule_y = meta_y2 - 4 * mm
    x0, x1 = margin, page_w - margin
    steps = 80
    for i in range(steps):
        t = i / (steps - 1)
        r = (CYAN[0] * (1 - t) + NAVY[0] * t) / 255
        g = (CYAN[1] * (1 - t) + NAVY[1] * t) / 255
        b = (CYAN[2] * (1 - t) + NAVY[2] * t) / 255
        c.setFillColorRGB(r, g, b)
        seg_w = (x1 - x0) / steps
        c.rect(x0 + i * seg_w, rule_y, seg_w + 0.1, 0.55 * mm, fill=1, stroke=0)
    c.setStrokeColorRGB(*[x / 255 for x in RULE])
    c.setLineWidth(0.4)
    c.line(margin, rule_y - 1.6 * mm, page_w - margin, rule_y - 1.6 * mm)

    # Footer
    foot_y = margin + 12 * mm
    c.setStrokeColorRGB(*[x / 255 for x in RULE])
    c.setLineWidth(0.5)
    c.line(margin, foot_y + 6 * mm, page_w - margin, foot_y + 6 * mm)
    c.setFillColorRGB(*[x / 255 for x in CYAN])
    c.rect(margin, foot_y + 6 * mm, 12 * mm, 0.55 * mm, fill=1, stroke=0)
    c.setFillColorRGB(*[x / 255 for x in MUTED])
    c.setFont("Noto", 7)
    c.drawCentredString(page_w / 2, foot_y + 2.8 * mm, FOOTER_L1)
    c.setFillColorRGB(*[x / 255 for x in NAVY])
    c.setFont("NotoBold", 7)
    c.drawCentredString(page_w / 2, foot_y - 0.8 * mm, FOOTER_L2)

    c.showPage()
    c.save()


def main():
    blank = BRAND / "3m-group-letterhead.png"
    preview = BRAND / "3m-group-letterhead-preview.png"
    svg = BRAND / "3m-group-letterhead.svg"
    pdf = BRAND / "3m-group-letterhead.pdf"

    print("Rendering blank letterhead PNG @300dpi…")
    render_letterhead_png(blank, dpi=300, with_sample=False)
    print("Rendering preview with sample body @200dpi…")
    render_letterhead_png(preview, dpi=200, with_sample=True)
    print("Writing SVG…")
    write_svg(svg)
    print("Writing PDF…")
    write_pdf(pdf, blank)

    # Artifacts copies for walkthrough
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    for src, name in [
        (blank, "letterhead-3m-group-blank.png"),
        (preview, "letterhead-3m-group-preview.png"),
    ]:
        Image.open(src).save(ARTIFACTS / name, "PNG", optimize=True)

    print("Done:")
    for p in (blank, preview, svg, pdf):
        print(f"  {p} ({p.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
