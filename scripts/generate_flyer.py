#!/usr/bin/env python3
"""Generate premium A5 flyer for 3M GROUP SARL brand kit."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont
from reportlab.lib.pagesizes import A5
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

ROOT = Path("/workspace")
BRAND = ROOT / "client/public/brand"
ARTIFACTS = Path("/opt/cursor/artifacts")
CIRCULAR = BRAND / "3m-group-logo-circular.png"
CIRCULAR_MARK = BRAND / "3m-group-logo-circular-mark.png"
LOCKUP = BRAND / "3m-group-logo.png"
BG_AI = ARTIFACTS / "assets/3m-group-flyer-bg.jpg"

NAVY = (11, 42, 82)
NAVY_DEEP = (6, 26, 54)
CYAN = (56, 168, 224)
ROYAL = (37, 99, 180)
MUTED = (90, 108, 130)
PAPER = (247, 249, 252)
WHITE = (255, 255, 255)

FONT_REG = "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf"
FONT_DISP = "/usr/share/fonts/truetype/noto/NotoSansDisplay-Bold.ttf"
FONT_ITALIC = "/usr/share/fonts/truetype/noto/NotoSansDisplay-Italic.ttf"

MOTTO = "L’Afrique vers le monde."
SERVICES = [
    "Études & formation",
    "Travail & mobilité",
    "Voyages & visas",
    "Immigration",
    "Hôtellerie",
    "Informatique",
    "Sécurité",
    "Assurance",
    "Prestations de services",
]


def font(path: str, size: float) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, int(round(size)))


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


def gradient_bg(w: int, h: int) -> Image.Image:
    img = Image.new("RGB", (w, h), NAVY_DEEP)
    draw = ImageDraw.Draw(img)
    split = int(h * 0.42)
    for y in range(split):
        t = y / max(split - 1, 1)
        r = int(NAVY_DEEP[0] * (1 - t) + NAVY[0] * t)
        g = int(NAVY_DEEP[1] * (1 - t) + 48 * t)
        b = int(NAVY_DEEP[2] * (1 - t) + 110 * t)
        # cyan wash toward mid
        r = int(r * (1 - t * 0.1) + CYAN[0] * t * 0.15)
        g = int(g * (1 - t * 0.1) + CYAN[1] * t * 0.2)
        b = int(min(255, b + t * 30))
        draw.line([(0, y), (w, y)], fill=(r, g, b))
    for y in range(split, h):
        t = (y - split) / max(h - split - 1, 1)
        r = int(240 + t * 12)
        g = int(244 + t * 8)
        b = int(250 + t * 5)
        draw.line([(0, y), (w, y)], fill=(r, g, b))
    # soft curve transition
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.ellipse((-w * 0.2, split - int(h * 0.08), w * 1.2, split + int(h * 0.18)), fill=(*PAPER, 255))
    overlay = overlay.filter(ImageFilter.GaussianBlur(radius=max(12, w // 40)))
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    return img


def blend_ai_bg(base: Image.Image) -> Image.Image:
    if not BG_AI.exists():
        return base
    ai = Image.open(BG_AI).convert("RGB").resize(base.size, Image.Resampling.LANCZOS)
    # Darken/cool AI top, keep our bottom readability
    w, h = base.size
    out = Image.blend(base, ai, 0.35)
    # Prefer our clean bottom panel
    split = int(h * 0.40)
    out.paste(base.crop((0, split, w, h)), (0, split))
    # Soft blend band
    band = Image.new("RGBA", (w, int(h * 0.12)), (0, 0, 0, 0))
    # just leave hard-ish transition from ellipse already in base
    return out


def render_flyer(out_png: Path, dpi: int = 300) -> Image.Image:
    # A5 mm
    w = int(148 / 25.4 * dpi)
    h = int(210 / 25.4 * dpi)
    margin = int(12 / 25.4 * dpi)
    scale = dpi / 72.0

    img = blend_ai_bg(gradient_bg(w, h))
    draw = ImageDraw.Draw(img)

    # Circular logo top center
    seal_src = CIRCULAR if CIRCULAR.exists() else CIRCULAR_MARK
    seal = knock_white(Image.open(seal_src))
    seal_d = int(72 / 25.4 * dpi)
    seal = seal.resize((seal_d, seal_d), Image.Resampling.LANCZOS)
    # Soft white disc behind seal for contrast on navy
    disc = Image.new("RGBA", (seal_d + 40, seal_d + 40), (0, 0, 0, 0))
    ImageDraw.Draw(disc).ellipse((0, 0, disc.width - 1, disc.height - 1), fill=(255, 255, 255, 235))
    disc = disc.filter(ImageFilter.GaussianBlur(radius=2))
    sx = (w - disc.width) // 2
    sy = int(10 / 25.4 * dpi)
    img_rgba = img.convert("RGBA")
    img_rgba.alpha_composite(disc, (sx, sy))
    img_rgba.alpha_composite(seal, (sx + 20, sy + 20))
    img = img_rgba.convert("RGB")
    draw = ImageDraw.Draw(img)

    # Motto under seal
    f_motto = font(FONT_ITALIC, 13 * scale)
    motto_y = sy + disc.height + int(2 / 25.4 * dpi)
    # On light panel — navy
    tw = draw.textlength(MOTTO, font=f_motto)
    draw.text(((w - tw) / 2, motto_y), MOTTO, font=f_motto, fill=NAVY)

    # Headline
    f_head = font(FONT_DISP, 16 * scale)
    head = "Un groupe, plusieurs expertises."
    hy = motto_y + int(f_motto.size * 1.8)
    tw = draw.textlength(head, font=f_head)
    draw.text(((w - tw) / 2, hy), head, font=f_head, fill=NAVY)

    f_lead = font(FONT_REG, 8.2 * scale)
    lead = "Mobilité · Digital · Sécurité · Prestations de services"
    ly = hy + int(f_head.size * 1.55)
    tw = draw.textlength(lead, font=f_lead)
    draw.text(((w - tw) / 2, ly), lead, font=f_lead, fill=ROYAL)

    # Accent rule
    rule_y = ly + int(f_lead.size * 1.8)
    x0, x1 = margin + int(20 / 25.4 * dpi), w - margin - int(20 / 25.4 * dpi)
    for i in range(x1 - x0):
        t = i / max(x1 - x0, 1)
        r = int(CYAN[0] * (1 - t) + NAVY[0] * t)
        g = int(CYAN[1] * (1 - t) + NAVY[1] * t)
        b = int(CYAN[2] * (1 - t) + NAVY[2] * t)
        draw.line([(x0 + i, rule_y), (x0 + i, rule_y + max(2, int(0.5 / 25.4 * dpi)))], fill=(r, g, b))

    # Services grid — 3 columns
    f_svc = font(FONT_BOLD, 7.4 * scale)
    f_svc_dot = font(FONT_BOLD, 9 * scale)
    start_y = rule_y + int(6 / 25.4 * dpi)
    cols = 3
    col_w = (w - 2 * margin) // cols
    row_h = int(9.5 / 25.4 * dpi)
    for i, label in enumerate(SERVICES):
        col = i % cols
        row = i // cols
        x = margin + col * col_w + int(2 / 25.4 * dpi)
        y = start_y + row * row_h
        draw.text((x, y), "●", font=f_svc_dot, fill=CYAN)
        draw.text((x + int(4 / 25.4 * dpi), y + 2), label, font=f_svc, fill=NAVY)

    # CTA block
    cta_top = start_y + 3 * row_h + int(4 / 25.4 * dpi)
    # Soft navy band
    band_h = int(38 / 25.4 * dpi)
    band = Image.new("RGBA", (w - 2 * margin, band_h), (0, 0, 0, 0))
    bd = ImageDraw.Draw(band)
    bd.rounded_rectangle((0, 0, band.width - 1, band.height - 1), radius=int(3 / 25.4 * dpi), fill=(*NAVY, 245))
    # cyan left tick
    bd.rectangle((0, 0, max(4, int(1.2 / 25.4 * dpi)), band.height), fill=(*CYAN, 255))
    img_rgba = img.convert("RGBA")
    img_rgba.alpha_composite(band, (margin, cta_top))
    img = img_rgba.convert("RGB")
    draw = ImageDraw.Draw(img)

    f_cta = font(FONT_BOLD, 9 * scale)
    f_contact = font(FONT_REG, 7.2 * scale)
    f_contact_b = font(FONT_BOLD, 7.2 * scale)
    tx = margin + int(5 / 25.4 * dpi)
    ty = cta_top + int(4 / 25.4 * dpi)
    draw.text((tx, ty), "Contactez-nous", font=f_cta, fill=WHITE)
    ty += int(f_cta.size * 1.55)
    contacts = [
        "contact@3mtravelagency.com",
        "hello@3mtravelagency.com",
        "+237 620 996 045",
        "WhatsApp Yaoundé +237 698 104 832",
        "WhatsApp Ottawa +1 672 897 2999",
        "www.3mtravelagency.com",
    ]
    for line in contacts:
        draw.text((tx, ty), line, font=f_contact, fill=(210, 225, 240))
        ty += int(f_contact.size * 1.4)

    # Footer legal
    f_foot = font(FONT_REG, 5.5 * scale)
    foot = "3M Group SARL  ·  RC/YAO/2019/A/2567  ·  Yaoundé · Ottawa"
    tw = draw.textlength(foot, font=f_foot)
    draw.text(((w - tw) / 2, h - margin - f_foot.size), foot, font=f_foot, fill=MUTED)

    out_png.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_png, "PNG", dpi=(dpi, dpi), optimize=True)
    return img


def write_pdf(png_path: Path, pdf_path: Path) -> None:
    pdfmetrics.registerFont(TTFont("Noto", FONT_REG))
    c = canvas.Canvas(str(pdf_path), pagesize=A5)
    page_w, page_h = A5
    c.drawImage(str(png_path), 0, 0, width=page_w, height=page_h, preserveAspectRatio=True, anchor="c")
    c.showPage()
    c.save()


def main():
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    png = BRAND / "3m-group-flyer.png"
    pdf = BRAND / "3m-group-flyer.pdf"
    print("Rendering A5 flyer @300dpi…")
    img = render_flyer(png, dpi=300)
    print("Writing PDF…")
    write_pdf(png, pdf)
    # Artifacts preview
    prev = img.copy()
    prev.thumbnail((900, 1280), Image.Resampling.LANCZOS)
    prev.save(ARTIFACTS / "flyer-3m-group.png", "PNG", optimize=True)
    img.save(ARTIFACTS / "flyer-3m-group-print.png", "PNG", optimize=True)
    print(f"  {png} ({png.stat().st_size})")
    print(f"  {pdf} ({pdf.stat().st_size})")


if __name__ == "__main__":
    main()
