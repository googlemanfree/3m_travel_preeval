#!/usr/bin/env python3
"""Compact letterhead, business card, and email signature for 3M GROUP SARL."""

from __future__ import annotations

import base64
import io
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path("/workspace")
BRAND = ROOT / "client/public/brand"
ARTIFACTS = Path("/opt/cursor/artifacts")

LOGO = BRAND / "3m-group-logo.png"
CIRCULAR = BRAND / "3m-group-logo-circular.png"
CIRCULAR_MARK = BRAND / "3m-group-logo-circular-mark.png"

NAVY = (11, 42, 82)
CYAN = (56, 168, 224)
ROYAL = (37, 99, 180)
MUTED = (90, 108, 130)
RULE = (180, 198, 220)
PAPER = (247, 249, 252)
INK = (18, 32, 52)

FONT_REG = "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf"
FONT_ITALIC = "/usr/share/fonts/truetype/noto/NotoSansDisplay-Italic.ttf"

MOTTO = "L’Afrique vers le monde."
SERVICES_SHORT = "Mobilité · Voyages · Informatique · Sécurité · Assurance · Prestations de services"
SERVICES_FULL = (
    "Études · Travail · Voyages · Visas · Immigration · "
    "Hôtellerie · Informatique · Sécurité · Assurance · Prestations de services"
)
FOOTER_L1 = "Biyem-Assi, Montée Chapelle Obili · Yaoundé, Cameroun  ·  Ottawa, Ontario, Canada"
FOOTER_L2 = "RC/YAO/2019/A/2567  ·  NIU M112417203369H  ·  3M Group SARL"


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


def crop_content(im: Image.Image, pad: int = 12, threshold: int = 245) -> Image.Image:
    rgba = im.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size
    minx, miny, maxx, maxy = w, h, 0, 0
    found = False
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 8 or (r >= threshold and g >= threshold and b >= threshold):
                continue
            found = True
            minx, miny = min(minx, x), min(miny, y)
            maxx, maxy = max(maxx, x), max(maxy, y)
    if not found:
        return rgba
    return rgba.crop((max(0, minx - pad), max(0, miny - pad), min(w, maxx + pad + 1), min(h, maxy + pad + 1)))


def paper_bg(w: int, h: int) -> Image.Image:
    img = Image.new("RGB", (w, h), PAPER)
    draw = ImageDraw.Draw(img)
    for y in range(min(h, int(h * 0.2))):
        t = 1 - y / max(int(h * 0.2), 1)
        draw.line([(0, y), (w, y)], fill=(int(242 + 5 * (1 - t)), int(245 + 4 * (1 - t)), 252))
    return img


def gradient_rule(draw: ImageDraw.ImageDraw, x0: int, x1: int, y: int, thick: int = 2):
    span = max(x1 - x0, 1)
    for i in range(span):
        t = i / span
        r = int(CYAN[0] * (1 - t) + NAVY[0] * t)
        g = int(CYAN[1] * (1 - t) + NAVY[1] * t)
        b = int(CYAN[2] * (1 - t) + NAVY[2] * t)
        draw.line([(x0 + i, y), (x0 + i, y + thick - 1)], fill=(r, g, b))


def render_compact_letterhead(out: Path, dpi: int = 300) -> Image.Image:
    """Slim header (~38mm): lockup left + contacts right; services in footer only."""
    w = int(210 / 25.4 * dpi)
    h = int(297 / 25.4 * dpi)
    margin = int(16 / 25.4 * dpi)
    img = paper_bg(w, h)
    draw = ImageDraw.Draw(img)
    scale = dpi / 72.0

    f_contact = font(FONT_REG, 8.0 * scale)
    f_tag = font(FONT_BOLD, 7.2 * scale)
    f_motto = font(FONT_ITALIC, 8.5 * scale)
    f_foot = font(FONT_REG, 6.8 * scale)
    f_foot_b = font(FONT_BOLD, 6.8 * scale)
    f_svc = font(FONT_BOLD, 6.4 * scale)

    # Compact logo (~55mm wide)
    logo = knock_white(crop_content(Image.open(LOGO)))
    logo_w = int(55 / 25.4 * dpi)
    logo_h = int(logo.height * (logo_w / logo.width))
    logo = logo.resize((logo_w, logo_h), Image.Resampling.LANCZOS)
    logo_y = margin
    img.paste(logo, (margin, logo_y), logo)

    # Right contacts
    right = w - margin
    lines = [
        ("3M GROUP SARL", f_tag, NAVY),
        ("contact@3mtravelagency.com", f_contact, MUTED),
        ("hello@3mtravelagency.com", f_contact, MUTED),
        ("+237 620 996 045", f_contact, MUTED),
        ("WA Yaoundé +237 698 104 832", f_contact, MUTED),
        ("WA Ottawa +1 672 897 2999", f_contact, MUTED),
        ("www.3mtravelagency.com", f_contact, MUTED),
    ]
    y = logo_y + int(2 / 25.4 * dpi)
    lh = int(f_contact.size * 1.45)
    for text, fnt, col in lines:
        tw = draw.textlength(text, font=fnt)
        draw.text((right - tw, y), text, font=fnt, fill=col)
        y += lh if fnt is f_contact else int(lh * 1.1)

    # Motto under logo
    motto_y = max(logo_y + logo_h, y) + int(2 / 25.4 * dpi)
    tw = draw.textlength(MOTTO.upper(), font=f_motto)
    draw.text(((w - tw) / 2, motto_y), MOTTO.upper(), font=f_motto, fill=NAVY)
    rule_y = motto_y + f_motto.size + int(2.5 / 25.4 * dpi)
    gradient_rule(draw, margin, w - margin, rule_y, max(2, int(0.45 / 25.4 * dpi)))

    # Soft circular watermark
    seal_src = CIRCULAR if CIRCULAR.exists() else CIRCULAR_MARK
    if seal_src.exists():
        seal = knock_white(Image.open(seal_src))
        sw = int(w * 0.38)
        seal.thumbnail((sw, sw), Image.Resampling.LANCZOS)
        alpha = seal.split()[3].point(lambda p: int(p * 0.04))
        seal.putalpha(alpha)
        img.paste(seal, ((w - seal.width) // 2, int(h * 0.42) - seal.height // 2), seal)

    # Footer with services
    foot_top = h - margin - int(16 / 25.4 * dpi)
    # Small seal bottom-right
    if seal_src.exists():
        s2 = knock_white(Image.open(seal_src))
        sd = int(22 / 25.4 * dpi)
        s2 = s2.resize((sd, sd), Image.Resampling.LANCZOS)
        img.paste(s2, (w - margin - sd, foot_top - sd - int(2 / 25.4 * dpi)), s2)

    draw.line([(margin, foot_top), (w - margin, foot_top)], fill=RULE, width=1)
    draw.rectangle([margin, foot_top, margin + int(12 / 25.4 * dpi), foot_top + 2], fill=CYAN)

    fy = foot_top + int(2.5 / 25.4 * dpi)
    tw = draw.textlength(SERVICES_SHORT, font=f_svc)
    draw.text(((w - tw) / 2, fy), SERVICES_SHORT, font=f_svc, fill=ROYAL)
    fy2 = fy + int(f_svc.size * 1.6)
    tw = draw.textlength(FOOTER_L1, font=f_foot)
    draw.text(((w - tw) / 2, fy2), FOOTER_L1, font=f_foot, fill=MUTED)
    tw = draw.textlength(FOOTER_L2, font=f_foot_b)
    draw.text(((w - tw) / 2, fy2 + int(f_foot.size * 1.55)), FOOTER_L2, font=f_foot_b, fill=NAVY)

    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out, "PNG", dpi=(dpi, dpi), optimize=True)
    return img


def render_business_card(out: Path, dpi: int = 300) -> Image.Image:
    """European card 85×55 mm — recto."""
    w = int(85 / 25.4 * dpi)
    h = int(55 / 25.4 * dpi)
    img = Image.new("RGB", (w, h), (255, 255, 255))
    # Soft left navy panel
    panel_w = int(w * 0.32)
    draw = ImageDraw.Draw(img)
    for x in range(panel_w):
        t = x / max(panel_w - 1, 1)
        r = int(NAVY[0] * (1 - t * 0.15) + 6 * t * 0.15)
        g = int(NAVY[1] * (1 - t * 0.15) + 26 * t * 0.15)
        b = int(NAVY[2] * (1 - t * 0.1) + 54 * t * 0.1)
        draw.line([(x, 0), (x, h)], fill=(r, g, b))
    # Cyan accent bar
    draw.rectangle([panel_w, 0, panel_w + max(2, int(0.8 / 25.4 * dpi)), h], fill=CYAN)

    # Circular mark on panel
    seal_src = CIRCULAR_MARK if CIRCULAR_MARK.exists() else CIRCULAR
    if seal_src.exists():
        seal = knock_white(Image.open(seal_src))
        # On navy: brighten — use white-knocked seal
        sd = int(panel_w * 0.72)
        seal = seal.resize((sd, sd), Image.Resampling.LANCZOS)
        # Optional: place on slight translucent disc
        sx = (panel_w - sd) // 2
        sy = (h - sd) // 2
        img_rgba = img.convert("RGBA")
        img_rgba.paste(seal, (sx, sy), seal)
        img = img_rgba.convert("RGB")
        draw = ImageDraw.Draw(img)

    # Right content
    pad = int(3.2 / 25.4 * dpi)
    x0 = panel_w + pad + max(2, int(1 / 25.4 * dpi))
    f_name = font(FONT_BOLD, 9.5 * (dpi / 72))
    f_role = font(FONT_REG, 6.2 * (dpi / 72))
    f_body = font(FONT_REG, 5.8 * (dpi / 72))
    f_motto = font(FONT_ITALIC, 5.5 * (dpi / 72))

    y = pad
    draw.text((x0, y), "3M GROUP SARL", font=f_name, fill=NAVY)
    y += int(f_name.size * 1.35)
    draw.text((x0, y), MOTTO, font=f_motto, fill=ROYAL)
    y += int(f_motto.size * 1.8)
    draw.line([(x0, y), (w - pad, y)], fill=RULE, width=1)
    y += int(2.2 / 25.4 * dpi)

    for line in [
        "contact@3mtravelagency.com",
        "hello@3mtravelagency.com",
        "+237 620 996 045",
        "WA +237 698 104 832",
        "WA Ottawa +1 672 897 2999",
        "www.3mtravelagency.com",
    ]:
        draw.text((x0, y), line, font=f_body, fill=MUTED)
        y += int(f_body.size * 1.45)

    # Tiny services strip at bottom
    y = h - pad - font(FONT_BOLD, 4.8 * (dpi / 72)).size
    f_tiny = font(FONT_BOLD, 4.6 * (dpi / 72))
    tiny = "Informatique · Prestations · Mobilité · Sécurité"
    # Truncate if needed
    while draw.textlength(tiny, font=f_tiny) > (w - x0 - pad) and " · " in tiny:
        tiny = " · ".join(tiny.split(" · ")[:-1])
    draw.text((x0, y), tiny, font=f_tiny, fill=ROYAL)

    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out, "PNG", dpi=(dpi, dpi), optimize=True)
    return img


def render_email_signature(out_png: Path, out_html: Path) -> Image.Image:
    """Wide email signature strip ~600×160 CSS px @2x."""
    w, h = 1200, 320
    img = Image.new("RGB", (w, h), (255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Left circular seal
    seal_src = CIRCULAR if CIRCULAR.exists() else CIRCULAR_MARK
    if seal_src.exists():
        seal = knock_white(Image.open(seal_src))
        sd = 240
        seal = seal.resize((sd, sd), Image.Resampling.LANCZOS)
        img_rgba = img.convert("RGBA")
        img_rgba.paste(seal, (24, (h - sd) // 2), seal)
        img = img_rgba.convert("RGB")
        draw = ImageDraw.Draw(img)

    x0 = 290
    f_name = font(FONT_BOLD, 34)
    f_motto = font(FONT_ITALIC, 20)
    f_body = font(FONT_REG, 18)
    f_svc = font(FONT_BOLD, 15)

    y = 36
    draw.text((x0, y), "3M GROUP SARL", font=f_name, fill=NAVY)
    y += 46
    draw.text((x0, y), MOTTO, font=f_motto, fill=ROYAL)
    y += 36
    draw.rectangle([x0, y, x0 + 420, y + 3], fill=CYAN)
    y += 18
    for line in [
        "contact@3mtravelagency.com  ·  hello@3mtravelagency.com",
        "+237 620 996 045  ·  WA Yaoundé +237 698 104 832",
        "WA Ottawa +1 672 897 2999  ·  www.3mtravelagency.com",
    ]:
        draw.text((x0, y), line, font=f_body, fill=MUTED)
        y += 28
    y += 6
    draw.text((x0, y), "Informatique · Prestations de services · Mobilité · Sécurité", font=f_svc, fill=ROYAL)

    out_png.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_png, "PNG", optimize=True)

    # HTML signature (table-based for email clients)
    # Embed a relative path note — for brand kit we also base64 a small version
    small = img.copy()
    small.thumbnail((600, 160), Image.Resampling.LANCZOS)
    buf = io.BytesIO()
    small.save(buf, format="PNG", optimize=True)
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")

    html = f"""<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><title>Signature 3M GROUP SARL</title></head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;">
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;max-width:600px;">
  <tr>
    <td style="padding:0 16px 0 0;vertical-align:middle;">
      <img src="data:image/png;base64,{b64}" width="600" alt="3M GROUP SARL" style="display:block;border:0;outline:none;">
    </td>
  </tr>
  <tr>
    <td style="padding-top:8px;font-size:11px;color:#5A6C82;line-height:1.4;">
      <strong style="color:#0B2A52;">3M GROUP SARL</strong> — {MOTTO}<br>
      <a href="mailto:contact@3mtravelagency.com" style="color:#2563B4;text-decoration:none;">contact@3mtravelagency.com</a>
      &nbsp;·&nbsp;
      <a href="mailto:hello@3mtravelagency.com" style="color:#2563B4;text-decoration:none;">hello@3mtravelagency.com</a><br>
      +237 620 996 045 · WhatsApp Yaoundé +237 698 104 832 · Ottawa +1 672 897 2999<br>
      <a href="https://www.3mtravelagency.com" style="color:#2563B4;text-decoration:none;">www.3mtravelagency.com</a>
      &nbsp;·&nbsp; Informatique · Prestations de services · Mobilité · Sécurité
    </td>
  </tr>
</table>
</body>
</html>
"""
    out_html.write_text(html, encoding="utf-8")
    return img


def render_envelope(out: Path, width_mm: float, height_mm: float, dpi: int = 300) -> Image.Image:
    """Envelope face — return address top-left + circular seal; destination zone empty."""
    w = int(width_mm / 25.4 * dpi)
    h = int(height_mm / 25.4 * dpi)
    margin = int(12 / 25.4 * dpi)
    img = Image.new("RGB", (w, h), (255, 253, 250))
    # Soft paper wash
    draw = ImageDraw.Draw(img)
    for y in range(h):
        t = y / max(h - 1, 1)
        r = int(255 - t * 4)
        g = int(253 - t * 3)
        b = int(250 + t * 2)
        draw.line([(0, y), (w, y)], fill=(r, g, b))

    # Thin navy top edge accent
    draw.rectangle([0, 0, w, max(2, int(0.6 / 25.4 * dpi))], fill=NAVY)
    draw.rectangle([0, max(2, int(0.6 / 25.4 * dpi)), w, max(4, int(1.1 / 25.4 * dpi))], fill=CYAN)

    scale = dpi / 72.0
    f_name = font(FONT_BOLD, 8.5 * scale)
    f_body = font(FONT_REG, 6.8 * scale)
    f_motto = font(FONT_ITALIC, 6.2 * scale)
    f_tiny = font(FONT_BOLD, 5.5 * scale)

    # Circular seal top-left
    seal_src = CIRCULAR if CIRCULAR.exists() else CIRCULAR_MARK
    seal_d = int(min(28, height_mm * 0.22) / 25.4 * dpi)
    x = margin
    y = margin + int(2 / 25.4 * dpi)
    if seal_src.exists():
        seal = knock_white(Image.open(seal_src))
        seal = seal.resize((seal_d, seal_d), Image.Resampling.LANCZOS)
        img_rgba = img.convert("RGBA")
        img_rgba.paste(seal, (x, y), seal)
        img = img_rgba.convert("RGB")
        draw = ImageDraw.Draw(img)

    # Return address to the right of seal
    tx = x + seal_d + int(3 / 25.4 * dpi)
    ty = y + int(2 / 25.4 * dpi)
    draw.text((tx, ty), "3M GROUP SARL", font=f_name, fill=NAVY)
    ty += int(f_name.size * 1.35)
    draw.text((tx, ty), MOTTO, font=f_motto, fill=ROYAL)
    ty += int(f_motto.size * 1.55)
    for line in [
        "Biyem-Assi, Montée Chapelle Obili",
        "Yaoundé, Cameroun",
        "contact@3mtravelagency.com",
        "+237 620 996 045",
        "www.3mtravelagency.com",
    ]:
        draw.text((tx, ty), line, font=f_body, fill=MUTED)
        ty += int(f_body.size * 1.4)

    # Destination guide (subtle dashed box, center-right) — print aid only
    box_w = int(w * 0.42)
    box_h = int(h * 0.28)
    bx = w - margin - box_w
    by = int(h * 0.38)
    # Hairline dashed rectangle
    dash = max(4, int(1.5 / 25.4 * dpi))
    gap = max(3, int(1.2 / 25.4 * dpi))
    # top
    x0 = bx
    while x0 < bx + box_w:
        x1 = min(x0 + dash, bx + box_w)
        draw.line([(x0, by), (x1, by)], fill=RULE, width=1)
        x0 += dash + gap
    # bottom
    x0 = bx
    while x0 < bx + box_w:
        x1 = min(x0 + dash, bx + box_w)
        draw.line([(x0, by + box_h), (x1, by + box_h)], fill=RULE, width=1)
        x0 += dash + gap
    # left / right
    y0 = by
    while y0 < by + box_h:
        y1 = min(y0 + dash, by + box_h)
        draw.line([(bx, y0), (bx, y1)], fill=RULE, width=1)
        draw.line([(bx + box_w, y0), (bx + box_w, y1)], fill=RULE, width=1)
        y0 += dash + gap
    hint = font(FONT_REG, 5.2 * scale)
    ht = "Destinataire"
    tw = draw.textlength(ht, font=hint)
    draw.text((bx + (box_w - tw) / 2, by + box_h + int(1.5 / 25.4 * dpi)), ht, font=hint, fill=RULE)

    # Bottom strip
    strip_h = int(8 / 25.4 * dpi)
    draw.rectangle([0, h - strip_h, w, h], fill=NAVY)
    svc = "Informatique · Prestations de services · Mobilité · Sécurité"
    tw = draw.textlength(svc, font=f_tiny)
    # Use lighter text on navy
    draw.text(((w - tw) / 2, h - strip_h + (strip_h - f_tiny.size) // 2), svc, font=f_tiny, fill=(200, 220, 240))

    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out, "PNG", dpi=(dpi, dpi), optimize=True)
    return img


def main():
    ARTIFACTS.mkdir(parents=True, exist_ok=True)

    compact = BRAND / "3m-group-letterhead-compact.png"
    card = BRAND / "3m-group-business-card.png"
    sig_png = BRAND / "3m-group-email-signature.png"
    sig_html = BRAND / "3m-group-email-signature.html"
    env_c5 = BRAND / "3m-group-envelope-c5.png"
    env_c6 = BRAND / "3m-group-envelope-c6.png"

    print("Compact letterhead…")
    render_compact_letterhead(compact)
    print("Business card…")
    render_business_card(card)
    print("Email signature…")
    render_email_signature(sig_png, sig_html)
    print("Envelope C5 (162×229 mm)…")
    render_envelope(env_c5, 229, 162)  # landscape face common for C5
    print("Envelope C6 (114×162 mm)…")
    render_envelope(env_c6, 162, 114)

    # Artifacts
    Image.open(compact).save(ARTIFACTS / "letterhead-3m-group-compact.png", "PNG", optimize=True)
    c = Image.open(card)
    prev = c.copy()
    prev = prev.resize((prev.width * 2, prev.height * 2), Image.Resampling.LANCZOS)
    prev.save(ARTIFACTS / "business-card-3m-group.png", "PNG", optimize=True)
    Image.open(sig_png).save(ARTIFACTS / "email-signature-3m-group.png", "PNG", optimize=True)
    for src, name in [
        (env_c5, "envelope-3m-group-c5.png"),
        (env_c6, "envelope-3m-group-c6.png"),
    ]:
        im = Image.open(src)
        # Preview at readable size
        p = im.copy()
        p.thumbnail((1400, 1000), Image.Resampling.LANCZOS)
        p.save(ARTIFACTS / name, "PNG", optimize=True)

    for p in (compact, card, sig_png, sig_html, env_c5, env_c6):
        print(f"  {p.name} ({p.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
