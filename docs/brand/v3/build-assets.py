"""Génère shared/brandLetterheadAssets.ts à partir de entete.html (papier à en-tête v3).

Usage (depuis docs/brand/v3) :  python build-assets.py
Prérequis : Google Chrome, Pillow.  Les bandeaux sont rendus en JPEG (fond blanc) puis encodés en base64 ;
le texte dynamique (nature du document, référence, date, destinataire, pagination) est dessiné par shared/brandLetterhead.ts.
"""
import base64
import io
import os
import re
import subprocess
import sys

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
CHROME = os.environ.get("CHROME", r"C:\Program Files\Google\Chrome\Application\chrome.exe")
SCALE = 2.5
PX_PER_MM = 794 / 210 * SCALE

base = open(os.path.join(HERE, "entete.html"), encoding="utf-8").read()

HIDE_ALL_PAPER = ".field,.watermark,.rule-bottom,.col,.legal,.pill,.wave-bottom{display:none!important}"
HIDE_HEADER = ".logo,.brand,.tagline,.services,.rule-top,.wave-top{display:none!important}"


def with_css(html: str, css: str) -> str:
    return html.replace("</head>", f"<style>{css}</style></head>")


footer_html = base
# Bloc Cameroun resserré : adresse sur deux lignes, téléphones sur une seule
footer_html = footer_html.replace(
    "<span>+237 698 104 832 (WhatsApp)<br>+237 620 996 045 (appels)</span>",
    "<span>+237 698 104 832 (WhatsApp) · +237 620 996 045</span>",
)
footer_html = footer_html.replace(
    "<span>Yaoundé — Biyem-Assi,<br>Montée Chapelle Obili,<br>à 10 m de EHS</span>",
    "<span>Yaoundé — Biyem-Assi, Montée Chapelle Obili,<br>à 10 m de EHS</span>",
)

VARIANTS = {
    # nom : (html, css, (haut_mm, bas_mm))
    "header": (base, HIDE_ALL_PAPER, (0, 44)),
    "headerFocus": (base, HIDE_ALL_PAPER + ".services{display:none!important}", (0, 44)),
    "compact": (
        base,
        HIDE_ALL_PAPER
        + ".services{display:none!important}.logo{left:15mm;top:7mm;width:14mm;height:14mm}"
        + ".brand{left:32mm;top:8.2mm;font-size:13.5pt}.tagline{left:32.2mm;top:15.2mm;font-size:5pt;letter-spacing:.2em}"
        + ".rule-top{top:26.2mm}.wave-top{height:22mm}",
        (0, 28),
    ),
    "footer": (
        footer_html,
        HIDE_HEADER
        + ".field,.watermark{display:none!important}"
        + ".rule-bottom{top:256mm}.col{top:258.8mm}.legal{top:275.4mm}.pill{top:279.6mm}",
        (252, 297),
    ),
}


def render(name: str, html: str, css: str, box):
    page = os.path.join(HERE, f"_tmp_{name}.html")
    png = os.path.join(HERE, f"_tmp_{name}.png")
    with open(page, "w", encoding="utf-8") as handle:
        handle.write(with_css(html, css))
    subprocess.run(
        [
            CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files",
            "--virtual-time-budget=8000", "--window-size=794,1123", f"--force-device-scale-factor={SCALE}",
            f"--screenshot={png}", "file:///" + page.replace("\\", "/"),
        ],
        check=True, capture_output=True,
    )
    image = Image.open(png).convert("RGB")
    top, bottom = box
    crop = image.crop((0, round(top * PX_PER_MM), image.width, round(bottom * PX_PER_MM)))
    buffer = io.BytesIO()
    crop.save(buffer, "JPEG", quality=90, optimize=True)
    os.remove(page)
    os.remove(png)
    return buffer.getvalue()


lines = [
    "/* Fichier généré par docs/brand/v3/build-assets.py : ne pas modifier à la main. */",
    "/* Bandeaux du papier à en-tête v3 (JPEG, fond blanc), peints par shared/brandLetterhead.ts. */",
    "",
]
for name, (html, css, box) in VARIANTS.items():
    data = render(name, html, css, box)
    print(name, len(data) // 1024, "Ko", file=sys.stderr)
    lines.append(f'export const LETTERHEAD_{re.sub(r"([A-Z])", r"_\1", name).upper()}_JPEG = "data:image/jpeg;base64,{base64.b64encode(data).decode()}";')
out = os.path.abspath(os.path.join(HERE, "..", "..", "..", "shared", "brandLetterheadAssets.ts"))
with open(out, "w", encoding="utf-8", newline="\n") as handle:
    handle.write("\n".join(lines) + "\n")
print("écrit", out)
