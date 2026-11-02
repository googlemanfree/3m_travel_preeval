/** Longueurs raisonnables pour l'affichage dans les résultats de recherche et les aperçus de partage. */
export const SEO_TITLE_MAX = 70;
export const SEO_DESCRIPTION_MAX = 160;

const BRAND_SUFFIX = / \| 3M TRAVEL AGENCY$/;

function cutAtWord(text: string, max: number): string {
  if (text.length <= max) return text;
  const room = text.slice(0, max - 1);
  const lastSpace = room.lastIndexOf(" ");
  const base = (lastSpace > max * 0.6 ? room.slice(0, lastSpace) : room).replace(/[\s,;:.\-–—(]+$/, "");
  return `${base}…`;
}

/** Retire d'abord les compléments « — … » en fin de titre (le nom de la marque est conservé), puis coupe au dernier mot. */
export function clampSeoTitle(title: string, max: number = SEO_TITLE_MAX): string {
  let current = title.trim();
  if (current.length <= max) return current;
  const hasBrand = BRAND_SUFFIX.test(current);
  const brand = hasBrand ? " | 3M TRAVEL AGENCY" : "";
  let core = hasBrand ? current.replace(BRAND_SUFFIX, "") : current;
  while (core.length + brand.length > max) {
    const cut = core.lastIndexOf(" — ");
    if (cut < 8) break;
    core = core.slice(0, cut);
  }
  current = core + brand;
  return current.length <= max ? current : cutAtWord(core, max - brand.length) + brand;
}

export function clampSeoDescription(description: string, max: number = SEO_DESCRIPTION_MAX): string {
  return cutAtWord(description.replace(/\s+/g, " ").trim(), max);
}
