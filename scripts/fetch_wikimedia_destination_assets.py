from __future__ import annotations

import json
import re
from pathlib import Path
from urllib.parse import urlencode

import requests
from PIL import Image
from io import BytesIO

OUT = Path("/home/ubuntu/webdev-static-assets")
OUT.mkdir(parents=True, exist_ok=True)

DESTINATIONS = {
    "canada": "Toronto skyline CN Tower city photograph",
    "luxembourg": "Luxembourg City skyline photograph",
    "france": "Eiffel Tower Paris city photograph",
    "belgium": "Brussels Grand Place city photograph",
    "germany": "Berlin Brandenburg Gate city photograph",
    "switzerland": "Swiss Alps mountain landscape photograph",
    "united-kingdom": "London Big Ben Thames city photograph",
    "united-states": "New York Statue of Liberty skyline photograph",
    "australia": "Sydney Opera House Harbour Bridge city photograph",
    "italy": "Rome Colosseum city photograph",
}

SESSION = requests.Session()
SESSION.headers.update({"User-Agent": "3M-Travel-Destination-Asset-Audit/1.0 (contact: aureoldonfack@gmail.com)"})


def clean(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def search_image(query: str) -> dict:
    params = {
        "action": "query",
        "format": "json",
        "generator": "search",
        "gsrsearch": query,
        "gsrnamespace": 6,
        "gsrlimit": 10,
        "prop": "imageinfo",
        "iiprop": "url|size|extmetadata",
    }
    response = SESSION.get("https://commons.wikimedia.org/w/api.php", params=params, timeout=30)
    response.raise_for_status()
    pages = response.json().get("query", {}).get("pages", {})
    candidates = []
    for page in pages.values():
        info = (page.get("imageinfo") or [{}])[0]
        width, height = int(info.get("width", 0) or 0), int(info.get("height", 0) or 0)
        url = info.get("url")
        title = page.get("title", "")
        if not url or width < 1000 or height < 600:
            continue
        if url.lower().split("?")[0].endswith((".djvu", ".pdf", ".svg")):
            continue
        if any(term in title.lower() for term in ("flag", "map", "logo", "coat of arms", "drawing", "atlas", "engraving", "historical", "fountain", "poster")):
            continue
        candidates.append({"title": title, "url": url, "width": width, "height": height, "metadata": info.get("extmetadata", {})})
    if not candidates:
        raise RuntimeError(f"Aucun visuel panoramique trouvé pour {query!r}")
    candidates.sort(key=lambda item: item["width"] * item["height"], reverse=True)
    return candidates[0]


def crop_16_9(image: Image.Image) -> Image.Image:
    image = image.convert("RGB")
    target_ratio = 16 / 9
    ratio = image.width / image.height
    if ratio > target_ratio:
        new_width = int(image.height * target_ratio)
        left = (image.width - new_width) // 2
        image = image.crop((left, 0, left + new_width, image.height))
    elif ratio < target_ratio:
        new_height = int(image.width / target_ratio)
        top = (image.height - new_height) // 2
        image = image.crop((0, top, image.width, top + new_height))
    return image.resize((1600, 900), Image.Resampling.LANCZOS)


manifest = {"generated_at": "2026-09-09", "license_note": "Each item retains Wikimedia Commons attribution metadata.", "assets": {}}
for slug, query in DESTINATIONS.items():
    selected = search_image(query)
    raw = SESSION.get(selected["url"], timeout=60)
    raw.raise_for_status()
    if not raw.headers.get("content-type", "").lower().startswith("image/"):
        raise RuntimeError(f"La source Wikimedia sélectionnée n’est pas une image pour {slug}: {selected['url']}")
    output = OUT / f"destination-{slug}.jpg"
    try:
        image = Image.open(BytesIO(raw.content))
    except Exception as exc:
        raise RuntimeError(f"Image Wikimedia illisible pour {slug}: {selected['url']}") from exc
    crop_16_9(image).save(output, "JPEG", quality=90, optimize=True)
    metadata = selected["metadata"]
    manifest["assets"][slug] = {
        "file": str(output),
        "source_page": f"https://commons.wikimedia.org/wiki/{selected['title'].replace(' ', '_')}",
        "source_title": selected["title"],
        "source_url": selected["url"],
        "width": selected["width"],
        "height": selected["height"],
        "artist": clean((metadata.get("Artist") or {}).get("value", "")),
        "license": clean((metadata.get("LicenseShortName") or {}).get("value", "")),
    }

(OUT / "destination-visual-assets-lot1.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps(manifest, ensure_ascii=False, indent=2))
