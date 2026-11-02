import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const escapeXml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char] ?? char);

/** Badge circulaire embarqué (data URI) pour que les scrapers sociaux voient le nouveau logo. */
function ogLogoDataUri(): string | null {
  const candidates = [
    resolve(import.meta.dirname, "../client/public/logo-3m-og-badge.png"),
    resolve(process.cwd(), "client/public/logo-3m-og-badge.png"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    const bytes = readFileSync(path);
    return `data:image/png;base64,${bytes.toString("base64")}`;
  }
  return null;
}

export function renderOgImageSvg(title: string, path = "/") {
  const safeTitle = escapeXml(title.trim().slice(0, 96) || "3M TRAVEL AGENCY");
  const safePath = escapeXml(path.trim().slice(0, 80) || "/");
  const titleLines = safeTitle.match(/.{1,42}(?:\s|$)/g)?.map((line) => line.trim()).filter(Boolean).slice(0, 2) ?? [safeTitle];
  const titleMarkup = titleLines.map((line, index) => `<text x="96" y="${292 + index * 58}" class="title">${line}</text>`).join("");
  const logoUri = ogLogoDataUri();
  const logoMarkup = logoUri
    ? `<image href="${logoUri}" x="940" y="200" width="180" height="180" preserveAspectRatio="xMidYMid meet" />`
    : `<circle cx="1030" cy="290" r="78" fill="#fff" opacity=".92"/><text x="1030" y="300" text-anchor="middle" class="badge">3M</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="title desc"><title id="title">${safeTitle}</title><desc id="desc">Aperçu officiel 3M TRAVEL AGENCY</desc><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#06152f"/><stop offset="1" stop-color="#123f80"/></linearGradient><linearGradient id="accent" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4ea1ff"/><stop offset="1" stop-color="#9fd0ff"/></linearGradient></defs><rect width="1200" height="630" fill="url(#bg)"/><circle cx="1040" cy="100" r="210" fill="#4ea1ff" opacity=".14"/><circle cx="1040" cy="100" r="130" fill="none" stroke="#9fd0ff" stroke-width="2" opacity=".45"/><rect x="96" y="92" width="104" height="8" rx="4" fill="url(#accent)"/><text x="96" y="176" class="brand">3M TRAVEL AGENCY</text>${titleMarkup}<text x="96" y="474" class="path">${safePath}</text><text x="96" y="532" class="footer">Mobilité internationale · Évaluation · Accompagnement documenté</text>${logoMarkup}<style>.brand{fill:#9fd0ff;font:700 24px Arial,sans-serif;letter-spacing:4px}.title{fill:#fff;font:700 52px Arial,sans-serif}.path{fill:#bfd4f5;font:400 22px Arial,sans-serif}.footer{fill:#dbe8fb;font:400 22px Arial,sans-serif}.badge{fill:#0b2f6f;font:800 42px Arial,sans-serif}</style></svg>`;
}
