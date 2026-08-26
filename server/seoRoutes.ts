import { OFFICIAL_SITE_ORIGIN } from "./canonicalDomain";
import { getIndexablePublicPaths } from "./publicPrerender";

const xmlEscape = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char] ?? char);

export function renderSitemapXml() {
  const urls = getIndexablePublicPaths().map((pagePath) => `  <url><loc>${xmlEscape(`${OFFICIAL_SITE_ORIGIN}${pagePath}`)}</loc></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function renderRobotsTxt() {
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /login",
    "Disallow: /panier",
    "Disallow: /mon-espace",
    "Disallow: /mon-dossier",
    "Disallow: /document-upload",
    "Disallow: /mes-vols-favoris",
    "Disallow: /flights",
    "Disallow: /api/",
    `Sitemap: ${OFFICIAL_SITE_ORIGIN}/sitemap.xml`,
    "",
  ].join("\n");
}
