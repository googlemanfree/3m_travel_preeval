/**
 * Mise en forme sûre du bilan : le CSS brut n'est jamais conservé. Une mise en forme collée (Word, Google Docs, page web, e-mail)
 * est reconnue puis ramenée à des NOMS d'une palette fermée (couleur, surlignage, taille, alignement, encadré, style de tableau) ;
 * seuls ces noms sont enregistrés, et ils sont convertis en styles en ligne au moment de l'affichage, de l'e-mail et de la copie.
 * Module pur (aucun DOM) : même code dans le navigateur et sur le serveur.
 */

export const BILAN_TEXT_COLORS = {
  gray: "#64748b", red: "#b91c1c", orange: "#c2410c", amber: "#a16207", green: "#15803d",
  teal: "#0f766e", blue: "#1d4ed8", indigo: "#4338ca", purple: "#7e22ce", pink: "#be185d",
} as const;
export const BILAN_TEXT_COLOR_LABELS: Record<keyof typeof BILAN_TEXT_COLORS, string> = {
  gray: "Gris", red: "Rouge", orange: "Orange", amber: "Ocre", green: "Vert", teal: "Turquoise", blue: "Bleu", indigo: "Indigo", purple: "Violet", pink: "Rose",
};

export const BILAN_HIGHLIGHTS = { yellow: "#fef08a", green: "#bbf7d0", blue: "#bfdbfe", pink: "#fbcfe8", orange: "#fed7aa", gray: "#e2e8f0" } as const;
export const BILAN_HIGHLIGHT_LABELS: Record<keyof typeof BILAN_HIGHLIGHTS, string> = { yellow: "Jaune", green: "Vert", blue: "Bleu", pink: "Rose", orange: "Orange", gray: "Gris" };

export const BILAN_SIZES = { sm: "12.5px", lg: "17px", xl: "21px" } as const;
export const BILAN_SIZE_LABELS: Record<keyof typeof BILAN_SIZES, string> = { sm: "Petit", lg: "Grand", xl: "Très grand" };

export const BILAN_ALIGNS = ["left", "center", "right", "justify"] as const;
export type BilanAlign = (typeof BILAN_ALIGNS)[number];

export const BILAN_CALLOUTS = {
  info: { label: "Information", background: "#eff6ff", border: "#2b6cb8", color: "#1e3a5f" },
  success: { label: "Point fort", background: "#f0fdf4", border: "#15803d", color: "#14532d" },
  warning: { label: "Point d'attention", background: "#fffbeb", border: "#d97706", color: "#78350f" },
  danger: { label: "Alerte", background: "#fef2f2", border: "#b91c1c", color: "#7f1d1d" },
} as const;
export type BilanCallout = keyof typeof BILAN_CALLOUTS;

export const BILAN_TABLE_DESIGNS = ["classic", "soft", "plain"] as const;
export type BilanTableDesign = (typeof BILAN_TABLE_DESIGNS)[number];
export const BILAN_TABLE_DESIGN_LABELS: Record<BilanTableDesign, string> = { classic: "Classique (en-tête foncé)", soft: "Doux (en-tête clair)", plain: "Sobre (lignes fines)" };

const has = (object: object, key: string | null | undefined): key is string => typeof key === "string" && Object.prototype.hasOwnProperty.call(object, key);

type Rgba = { r: number; g: number; b: number; a: number };

const NAMED_COLORS: Record<string, string> = {
  red: "#ff0000", crimson: "#dc143c", darkred: "#8b0000", orange: "#ffa500", darkorange: "#ff8c00", gold: "#ffd700", yellow: "#ffff00", green: "#008000", lime: "#00ff00",
  darkgreen: "#006400", teal: "#008080", cyan: "#00ffff", aqua: "#00ffff", blue: "#0000ff", navy: "#000080", royalblue: "#4169e1", indigo: "#4b0082", purple: "#800080",
  violet: "#ee82ee", magenta: "#ff00ff", fuchsia: "#ff00ff", pink: "#ffc0cb", hotpink: "#ff69b4", gray: "#808080", grey: "#808080", silver: "#c0c0c0", brown: "#a52a2a",
};

function parseCssColor(value: string | null | undefined): Rgba | null {
  const text = String(value ?? "").trim().toLowerCase();
  if (!text || text === "transparent" || text === "inherit" || text === "initial" || text === "none" || text === "currentcolor") return null;
  const named = NAMED_COLORS[text];
  const source = named ?? text;
  const hexMatch = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(source);
  if (hexMatch) {
    const digits = hexMatch[1].length === 3 ? hexMatch[1].split("").map((c) => c + c).join("") : hexMatch[1];
    return { r: parseInt(digits.slice(0, 2), 16), g: parseInt(digits.slice(2, 4), 16), b: parseInt(digits.slice(4, 6), 16), a: 1 };
  }
  const rgb = /^rgba?\(\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/.exec(source);
  if (rgb) {
    const alpha = rgb[4] === undefined ? 1 : rgb[4].endsWith("%") ? Number(rgb[4].slice(0, -1)) / 100 : Number(rgb[4]);
    return { r: Math.min(255, Number(rgb[1])), g: Math.min(255, Number(rgb[2])), b: Math.min(255, Number(rgb[3])), a: Number.isFinite(alpha) ? alpha : 1 };
  }
  return null;
}

function toHsl({ r, g, b }: Rgba): { h: number; s: number; l: number } {
  const red = r / 255, green = g / 255, blue = b / 255;
  const max = Math.max(red, green, blue), min = Math.min(red, green, blue);
  const l = (max + min) / 2;
  const delta = max - min;
  if (delta === 0) return { h: 0, s: 0, l };
  const s = delta / (1 - Math.abs(2 * l - 1));
  let h = max === red ? ((green - blue) / delta) % 6 : max === green ? (blue - red) / delta + 2 : (red - green) / delta + 4;
  h = (h * 60 + 360) % 360;
  return { h, s, l };
}

function hueToTextName(h: number): keyof typeof BILAN_TEXT_COLORS {
  if (h < 15 || h >= 345) return "red";
  if (h < 40) return "orange";
  if (h < 65) return "amber";
  if (h < 165) return "green";
  if (h < 195) return "teal";
  if (h < 255) return "blue";
  if (h < 275) return "indigo";
  if (h < 320) return "purple";
  return "pink";
}

/** Couleur de texte collée → nom de la palette ; null pour le noir, le blanc et tout ce qui est la couleur par défaut. */
export function cssColorToTextName(value: string | null | undefined): keyof typeof BILAN_TEXT_COLORS | null {
  const color = parseCssColor(value);
  if (!color || color.a < 0.5) return null;
  const { h, s, l } = toHsl(color);
  if (l < 0.2 || l > 0.93) return null;
  if (s < 0.15) return l >= 0.3 && l <= 0.7 ? "gray" : null;
  return hueToTextName(h);
}

/** Couleur de fond (surlignage) collée → nom de la palette ; null pour le blanc, le transparent et les fonds quasi neutres. */
export function cssColorToHighlightName(value: string | null | undefined): keyof typeof BILAN_HIGHLIGHTS | null {
  const color = parseCssColor(value);
  if (!color || color.a < 0.4) return null;
  const { h, s, l } = toHsl(color);
  if (l > 0.97 || l < 0.2) return null;
  if (s < 0.12) return l < 0.92 ? "gray" : null;
  if (h < 15 || h >= 345) return "pink";
  if (h < 40) return "orange";
  if (h < 70) return "yellow";
  if (h < 165) return "green";
  if (h < 260) return "blue";
  return "pink";
}

/** Taille de police collée (px, pt, em, rem, %, mots-clés ou attribut size de <font>) → sm / lg / xl ; null pour la taille normale. */
export function cssFontSizeToName(value: string | null | undefined): keyof typeof BILAN_SIZES | null {
  const text = String(value ?? "").trim().toLowerCase();
  if (!text) return null;
  const keyword: Record<string, keyof typeof BILAN_SIZES | null> = { "x-small": "sm", small: "sm", smaller: "sm", medium: null, large: "lg", larger: "lg", "x-large": "xl", "xx-large": "xl", "xxx-large": "xl" };
  if (has(keyword, text)) return keyword[text];
  const match = /^([\d.]+)\s*(px|pt|em|rem|%)?$/.exec(text);
  if (!match) return null;
  const amount = Number(match[1]);
  const unit = match[2] ?? "px";
  const px = unit === "pt" ? amount * 1.333 : unit === "em" || unit === "rem" ? amount * 16 : unit === "%" ? (amount / 100) * 16 : amount;
  if (!Number.isFinite(px) || px <= 0) return null;
  if (px <= 12.5) return "sm";
  if (px >= 22) return "xl";
  if (px >= 17) return "lg";
  return null;
}

function legacyFontSizeToName(raw: string | null | undefined): keyof typeof BILAN_SIZES | null {
  const value = Number(String(raw ?? "").replace(/[^\d]/g, ""));
  if (!Number.isFinite(value) || value <= 0) return null;
  if (value <= 2) return "sm";
  if (value >= 6) return "xl";
  if (value >= 5) return "lg";
  return null;
}

const attributeValue = (attributes: string, name: string): string | null => {
  const found = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i").exec(attributes);
  return found ? (found[1] ?? found[2] ?? found[3] ?? "").trim() : null;
};

function cssProperty(style: string | null, property: string): string | null {
  if (!style) return null;
  const found = new RegExp(`(?:^|;)\\s*${property}\\s*:\\s*([^;]+)`, "i").exec(style);
  return found ? found[1].replace(/!important/i, "").trim().toLowerCase() : null;
}

/** Alignement demandé par un attribut align ou un style text-align ; « left » est l'alignement par défaut et n'est pas conservé. */
export function alignFromAttributes(attributes: string): BilanAlign | null {
  const direct = (attributeValue(attributes, "data-a") ?? attributeValue(attributes, "align") ?? cssProperty(attributeValue(attributes, "style"), "text-align") ?? "").toLowerCase();
  const normalized = direct === "start" ? "left" : direct === "end" ? "right" : direct === "justify-all" ? "justify" : direct;
  return normalized === "center" || normalized === "right" || normalized === "justify" ? normalized : null;
}

export function calloutFromAttributes(attributes: string): BilanCallout | null {
  const name = attributeValue(attributes, "data-v");
  return has(BILAN_CALLOUTS, name) ? (name as BilanCallout) : null;
}

export function tableDesignFromAttributes(attributes: string): BilanTableDesign | null {
  const name = attributeValue(attributes, "data-d");
  return name === "soft" || name === "plain" ? name : null;
}

/**
 * Attributs canoniques d'un <span>, <font> ou <mark> collé : couleur, surlignage, taille, gras, italique, souligné, barré.
 * Renvoie une chaîne vide si rien de reconnu (le <span> est alors retiré, son contenu est conservé).
 */
export function spanAttributesFrom(rawName: string, attributes: string): string {
  const style = attributeValue(attributes, "style");
  const directColor = attributeValue(attributes, "data-c");
  const colorName = has(BILAN_TEXT_COLORS, directColor) ? directColor : cssColorToTextName(cssProperty(style, "color") ?? attributeValue(attributes, "color"));
  const directHighlight = attributeValue(attributes, "data-h");
  const highlightName = has(BILAN_HIGHLIGHTS, directHighlight)
    ? directHighlight
    : cssColorToHighlightName(cssProperty(style, "background-color") ?? cssProperty(style, "background"))
      ?? (rawName.toLowerCase() === "mark" ? "yellow" : null);
  const directSize = attributeValue(attributes, "data-s");
  const sizeName = has(BILAN_SIZES, directSize) ? directSize : cssFontSizeToName(cssProperty(style, "font-size")) ?? legacyFontSizeToName(attributeValue(attributes, "size"));
  const weight = cssProperty(style, "font-weight");
  const bold = attributeValue(attributes, "data-b") === "1" || weight === "bold" || weight === "bolder" || (weight !== null && Number(weight) >= 600);
  const italic = attributeValue(attributes, "data-i") === "1" || cssProperty(style, "font-style") === "italic";
  const decoration = cssProperty(style, "text-decoration") ?? cssProperty(style, "text-decoration-line") ?? "";
  const underline = attributeValue(attributes, "data-u") === "1" || /underline/.test(decoration);
  const strike = attributeValue(attributes, "data-x") === "1" || /line-through/.test(decoration);
  return [
    colorName ? ` data-c="${colorName}"` : "",
    highlightName ? ` data-h="${highlightName}"` : "",
    sizeName ? ` data-s="${sizeName}"` : "",
    bold ? ' data-b="1"' : "",
    italic ? ' data-i="1"' : "",
    underline ? ' data-u="1"' : "",
    strike ? ' data-x="1"' : "",
  ].join("");
}

/** Retire les <span> sans mise en forme et rééquilibre les ouvertures/fermetures (HTML collé : spans imbriqués par centaines). */
export function dropBareSpans(html: string): string {
  let stack: boolean[] = [];
  const result = html.replace(/<(\/?)span\b([^>]*)>|<\/(?:p|li|h2|h3|h4|td|th|blockquote)>/g, (match, closing: string | undefined, attributes: string | undefined) => {
    // Fin d'un bloc : les spans restés ouverts dans ce bloc sont refermés avant lui (jamais de </span> après </p>).
    if (closing === undefined) {
      const open = stack.filter(Boolean).length;
      stack = [];
      return "</span>".repeat(open) + match;
    }
    if (!closing) {
      const keep = (attributes ?? "").trim().length > 0;
      stack.push(keep);
      return keep ? `<span${attributes}>` : "";
    }
    const keep = stack.pop();
    return keep ? "</span>" : "";
  });
  return result + "</span>".repeat(stack.filter(Boolean).length);
}

const escapeAttr = (value: string) => value.replace(/[^a-z0-9#(),.%:; -]/gi, "");

/** Styles en ligne correspondant aux noms de la palette présents sur une balise canonique. */
export function inlineStyleFromDesign(tag: string, attributes: string): string {
  const parts: string[] = [];
  const align = alignFromAttributes(attributes);
  if (align && tag !== "span" && tag !== "table") parts.push(`text-align:${align}`);
  if (tag === "span") {
    const color = attributeValue(attributes, "data-c");
    if (has(BILAN_TEXT_COLORS, color)) parts.push(`color:${BILAN_TEXT_COLORS[color as keyof typeof BILAN_TEXT_COLORS]}`);
    const highlight = attributeValue(attributes, "data-h");
    if (has(BILAN_HIGHLIGHTS, highlight)) parts.push(`background-color:${BILAN_HIGHLIGHTS[highlight as keyof typeof BILAN_HIGHLIGHTS]};padding:0 2px;border-radius:2px`);
    const size = attributeValue(attributes, "data-s");
    if (has(BILAN_SIZES, size)) parts.push(`font-size:${BILAN_SIZES[size as keyof typeof BILAN_SIZES]};line-height:1.4`);
    if (attributeValue(attributes, "data-b") === "1") parts.push("font-weight:700");
    if (attributeValue(attributes, "data-i") === "1") parts.push("font-style:italic");
    const lines = [attributeValue(attributes, "data-u") === "1" ? "underline" : "", attributeValue(attributes, "data-x") === "1" ? "line-through" : ""].filter(Boolean).join(" ");
    if (lines) parts.push(`text-decoration:${lines}`);
  }
  if (tag === "blockquote") {
    const callout = calloutFromAttributes(attributes);
    if (callout) {
      const { background, border, color } = BILAN_CALLOUTS[callout];
      parts.push(`background:${background};border-left:4px solid ${border};color:${color}`);
    }
  }
  return escapeAttr(parts.join(";")).replace(/;;+/g, ";");
}
