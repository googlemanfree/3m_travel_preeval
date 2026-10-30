import { LEGAL_DISCLAIMER, findForbiddenTerms, findSensitiveValues } from "./evaluationValidation";
import { BRAND, escapeBrandHtml, frameBrandedDocument } from "./brandLetterhead";
import { BILAN_CALLOUTS, alignFromAttributes, calloutFromAttributes, dropBareSpans, inlineStyleFromDesign, spanAttributesFrom, tableDesignFromAttributes, type BilanTableDesign } from "./bilanDesign";

/**
 * Bilan d'évaluation « libre » : l'administrateur colle un bilan déjà rédigé ailleurs (HTML, Word, Google Docs, texte, Markdown…) ;
 * il est converti en un HTML propre et sûr, puis mis en forme à l'identité de l'agence pour l'espace candidat, l'aperçu, le PDF et l'e-mail.
 * Module pur (aucun DOM) : le même code tourne dans le navigateur (aperçu en direct) et sur le serveur (enregistrement, envoi).
 */

export const BILAN_MAX_HTML_LENGTH = 300_000;

const ALLOWED_TAGS = new Set(["p", "br", "hr", "strong", "em", "u", "del", "sup", "sub", "ul", "ol", "li", "h2", "h3", "h4", "blockquote", "table", "thead", "tbody", "tfoot", "tr", "td", "th", "a", "span"]);
/** Blocs qui conservent un alignement (centré, à droite, justifié). */
const ALIGNABLE = new Set(["p", "h2", "h3", "h4", "li", "blockquote", "td", "th"]);
const TAG_ALIASES: Record<string, string> = {
  b: "strong", i: "em", s: "del", strike: "del", font: "span", mark: "span", h1: "h2", h5: "h4", h6: "h4", pre: "p", dl: "ul", dt: "li", dd: "li",
  div: "p", section: "p", article: "p", header: "p", footer: "p", main: "p", aside: "p", nav: "p", center: "p", figure: "p", figcaption: "p", address: "p", caption: "p",
};
const BLOCKS_INSIDE_P = /<p>\s*(?=<(?:ul|ol|table|h[2-4]|blockquote|hr)\b)/g;
const DROP_WITH_CONTENT = /<(script|style|head|title|iframe|object|embed|svg|math|template|noscript|xml|form|select|textarea|button)\b[\s\S]*?<\/\1\s*>/gi;
const ALIGN_ATTRIBUTE = '(?: data-a="(?:left|center|right|justify)")?';
const CANONICAL_TAG_OR_LT = new RegExp(
  "(" + [
    "</?(?:strong|em|u|del|sup|sub|ul|ol|thead|tbody|tfoot|tr)>",
    "</(?:p|li|h2|h3|h4|blockquote|table|span)>",
    "<(?:p|li|h2|h3|h4)" + ALIGN_ATTRIBUTE + ">",
    "<blockquote" + ALIGN_ATTRIBUTE + '(?: data-v="(?:info|success|warning|danger)")?>',
    '<table(?: data-d="(?:soft|plain)")?>',
    '<span(?: data-c="[a-z]{3,8}")?(?: data-h="[a-z]{3,8}")?(?: data-s="(?:sm|lg|xl)")?(?: data-b="1")?(?: data-i="1")?(?: data-u="1")?(?: data-x="1")?>',
    "<(?:br|hr)>",
    '<a(?: href="[^"<>]*" target="_blank" rel="noopener noreferrer")?>',
    "</a>",
    '<t[dh](?: colspan="\d{1,2}")?(?: rowspan="\d{1,2}")?' + ALIGN_ATTRIBUTE + ">",
    "</t[dh]>",
  ].join("|") + ")|<",
  "g",
);
const DROP_SELF_CLOSING =/<(?:meta|link|base|input|img|video|audio|source|picture|canvas|col|colgroup)\b[^>]*>/gi;

const decodeBasicEntities = (value: string) =>
  value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d{2,5});/g, (_match, code: string) => String.fromCodePoint(Math.min(0x10ffff, Number(code))));

const escapeText = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function safeHref(raw: string): string | null {
  const href = raw.trim().replace(/["'<>`\s]/g, "");
  if (/^https:\/\//i.test(href) || /^mailto:[^\s@]+@[^\s@]+$/i.test(href) || /^tel:[+0-9().-]{5,}$/i.test(href) || (href.startsWith("/") && !href.startsWith("//"))) return href;
  return null;
}

/** HTML quelconque (Word, Google Docs, navigateur, éditeur…) → sous-ensemble sûr : titres, paragraphes, listes, tableaux, citations, liens. Aucun style, script ni image. */
export function sanitizeBilanHtml(raw: string): string {
  let html = String(raw ?? "").replace(/\r\n?/g, "\n").replace(/\u0000/g, "");
  html = html.replace(/<!--[\s\S]*?-->/g, "").replace(/<!\[if[\s\S]*?<!\[endif\]>/gi, "");
  html = html.replace(DROP_WITH_CONTENT, "").replace(DROP_SELF_CLOSING, "");
  const body = /<body\b[^>]*>([\s\S]*?)(?:<\/body\s*>|$)/i.exec(html);
  if (body) html = body[1];
  html = html.replace(/<\s*(\/?)\s*([a-zA-Z][a-zA-Z0-9:-]*)([^<>]*)>/g, (_match, closing: string, rawName: string, attributes: string) => {
    const name = rawName.toLowerCase();
    const tag = TAG_ALIASES[name] ?? name;
    if (!ALLOWED_TAGS.has(tag)) return "";
    if (closing) return tag === "br" || tag === "hr" ? "" : `</${tag}>`;
    if (tag === "br" || tag === "hr") return `<${tag}>`;
    if (tag === "a") {
      const href = /href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attributes);
      const safe = href ? safeHref(href[1] ?? href[2] ?? href[3] ?? "") : null;
      return safe ? `<a href="${escapeBrandHtml(safe)}" target="_blank" rel="noopener noreferrer">` : "<a>";
    }
    if (tag === "span") return `<span${spanAttributesFrom(name, attributes)}>`;
    const alignment = ALIGNABLE.has(tag) ? alignFromAttributes(attributes) : null;
    const alignAttribute = alignment ? ` data-a="${alignment}"` : "";
    if (tag === "td" || tag === "th") {
      const span = (attribute: string) => {
        const found = new RegExp(`${attribute}\\s*=\\s*["']?(\\d{1,2})`, "i").exec(attributes);
        const value = found ? Number(found[1]) : 0;
        return value > 1 && value <= 12 ? ` ${attribute}="${value}"` : "";
      };
      return `<${tag}${span("colspan")}${span("rowspan")}${alignAttribute}>`;
    }
    if (tag === "blockquote") {
      const callout = calloutFromAttributes(attributes);
      return `<blockquote${alignAttribute}${callout ? ` data-v="${callout}"` : ""}>`;
    }
    if (tag === "table") {
      const design = tableDesignFromAttributes(attributes);
      return design ? `<table data-d="${design}">` : "<table>";
    }
    return `<${tag}${alignAttribute}>`;
  });
  // Liste fermée : seules les balises telles que CE code vient de les réécrire survivent ; tout autre « < » (balise non fermée, attributs
  // glissés avant un « < » suivant, noms approchants…) devient du texte. Un simple test sur le nom de balise laissait passer `<a onmouseover=… <b>`.
  html = html.replace(CANONICAL_TAG_OR_LT, (match, tag: string | undefined) => (tag ? tag : "&lt;"));
  html = dropBareSpans(html);
  html = html
    .replace(/<p>\s*(?:&nbsp;|\s|<br>)*<\/p>/g, "")
    .replace(BLOCKS_INSIDE_P, "")
    .replace(/(<\/(?:ul|ol|table|h[2-4]|blockquote)>)\s*<\/p>/g, "$1")
    .replace(/(?:<br>\s*){3,}/g, "<br><br>")
    .replace(/<p>(\s*<p>)+/g, "<p>")
    .replace(/(<\/p>\s*)+<\/p>/g, "</p>")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return html.slice(0, BILAN_MAX_HTML_LENGTH);
}

export function isHtmlLike(text: string): boolean {
  return /<\/?(?:p|div|br|h[1-6]|ul|ol|li|table|tr|td|th|strong|b|em|i|span|a|body|html|blockquote|font)\b[^>]*>/i.test(text);
}

function inlineMarkdown(value: string): string {
  let out = escapeText(value);
  out = out.replace(/\[([^\]]{1,200})\]\((https:\/\/[^\s)]+|mailto:[^\s)]+|\/[^\s)]*)\)/g, (_m, label: string, url: string) => `<a href="${escapeBrandHtml(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`);
  out = out.replace(/(^|[\s(])(https:\/\/[^\s<)]+)/g, (_m, lead: string, url: string) => `${lead}<a href="${escapeBrandHtml(url)}" target="_blank" rel="noopener noreferrer">${url}</a>`);
  out = out.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>").replace(/__([^_\n]+)__/g, "<strong>$1</strong>");
  out = out.replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,;:!?]|$)/g, "$1<em>$2</em>");
  return out;
}

const BULLET = /^\s*(?:[-*•·–—▪●■✓✔☑▸▶►→①-⑳]|\d{1,2}[.)])\s+(.*\S.*)$/;
const ORDERED = /^\s*(?:\d{1,2}[.)]|[①-⑳])\s+/;
const MD_HEADING = /^\s*(#{1,4})\s+(.+?)\s*#*\s*$/;
const RULE = /^\s*(?:[-*_]\s*){3,}$|^\s*[━─═]{6,}\s*$/;
const SECTION_MARK = /^\s*[─━═\-]*\s*[◆◇✦]\s*[─━═\-]*\s*$/;
const HEAVY_RULE = /^\s*[━═]{6,}\s*$/;
const THIN_RULE = /^\s*─{6,}\s*$/;
/** « LIBELLÉ ........ valeur » : ligne à points de conduite (score, statut, montant…). */
const LEADER = /^\s*(\S(?:.*?\S)?)\s*(?:\.{4,}|…{2,}|(?:\.\s){4,}\.?)\s*(\S.*)$/;
const ARROW = /^\s*[↓⬇▼⇓]\s*$/;
const SUBHEADING_MARK = /^\s*[▸▶►]\s+(.+)$/;
const TOTAL_LABEL = /^(?:note globale|total|score global)\b/i;

const looksLikeUpperTitle = (line: string) => {
  const letters = line.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g, "");
  if (letters.length < 4 || line.length > 90 || /[.!?]$/.test(line.trim())) return false;
  const upper = letters.replace(/[^A-ZÀ-ÖØ-Þ]/g, "").length;
  return upper / letters.length > 0.8;
};

/**
 * Texte brut ou Markdown → HTML : titres (#, MAJUSCULES : section puis sous-titre), listes (-, •, ✓, ▸, 1., ①), tableaux « | a | b | »,
 * lignes à points « LIBELLÉ ..... valeur » (tableau de scores), flèches « ↓ » (schéma centré), séparateurs (━━━, ─ ◆ ─), gras et liens.
 */
export function textToBilanHtml(text: string): string {
  const lines = String(text ?? "").replace(/\r\n?/g, "\n").replace(/\t/g, "  ").split("\n").map((line) => line.replace(/\s+$/, ""));
  const out: string[] = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let table: string[][] | null = null;
  let scores: Array<{ label: string; value: string; total: boolean }> | null = null;
  let totalNext = false;
  /** Vrai au début du document et après chaque séparateur : le premier titre en majuscules est alors un titre de section, les suivants des sous-titres. */
  let sectionStart = true;
  const flushParagraph = () => {
    if (paragraph.length) {
      const flow = paragraph.some((line) => ARROW.test(line));
      out.push(`<p${flow ? ' data-a="center"' : ""}>${paragraph.map(inlineMarkdown).join("<br>")}</p>`);
      sectionStart = false;
    }
    paragraph = [];
  };
  const flushList = () => {
    if (list) { out.push(`<${list.ordered ? "ol" : "ul"}>${list.items.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</${list.ordered ? "ol" : "ul"}>`); sectionStart = false; }
    list = null;
  };
  const flushTable = () => {
    if (table && table.length) {
      const [head, ...rest] = table;
      out.push(`<table><thead><tr>${head.map((cell) => `<th>${inlineMarkdown(cell)}</th>`).join("")}</tr></thead><tbody>${rest.map((row) => `<tr>${row.map((cell) => `<td>${inlineMarkdown(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table>`);
      sectionStart = false;
    }
    table = null;
  };
  const flushScores = () => {
    if (scores && scores.length) {
      const cell = (value: string, total: boolean, align: boolean) => `<td${align ? ' data-a="right"' : ""}>${total ? `<strong>${inlineMarkdown(value)}</strong>` : inlineMarkdown(value)}</td>`;
      out.push(`<table data-d="plain"><tbody>${scores.map((row) => `<tr>${cell(row.label, row.total, false)}${cell(row.value, true, true)}</tr>`).join("")}</tbody></table>`);
      sectionStart = false;
    }
    scores = null;
    totalNext = false;
  };
  const flushAll = () => { flushParagraph(); flushList(); flushTable(); flushScores(); };
  const heading = (level: 2 | 3, value: string) => { out.push(`<h${level}>${inlineMarkdown(value.replace(/\s*:$/, ""))}</h${level}>`); sectionStart = false; };
  const nextNonEmpty = (from: number) => {
    for (let cursor = from + 1; cursor < lines.length; cursor += 1) if (lines[cursor].trim()) return lines[cursor];
    return "";
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();
    if (!trimmed) {
      // Une puce suivie d'une autre puce du même type (lignes vides entre elles) reste dans la même liste.
      const upcoming = nextNonEmpty(index);
      const continues = Boolean(list) && BULLET.test(upcoming) && ORDERED.test(upcoming) === list!.ordered;
      flushParagraph(); flushTable(); flushScores();
      if (!continues) flushList();
      continue;
    }
    if (THIN_RULE.test(trimmed) && scores && LEADER.test(nextNonEmpty(index))) { totalNext = true; continue; }
    if (SECTION_MARK.test(trimmed) || RULE.test(trimmed)) {
      flushAll();
      if (RULE.test(trimmed) && !SECTION_MARK.test(trimmed)) out.push("<hr>");
      sectionStart = true;
      continue;
    }
    const leader = LEADER.exec(trimmed);
    if (leader) {
      flushParagraph(); flushList(); flushTable();
      (scores ??= []).push({ label: leader[1].trim(), value: leader[2].trim(), total: totalNext || TOTAL_LABEL.test(leader[1].trim()) });
      totalNext = false;
      continue;
    }
    flushScores();
    if (trimmed.startsWith("|") && trimmed.endsWith("|") && trimmed.split("|").length >= 4) {
      flushParagraph(); flushList();
      if (/^[\s|:-]+$/.test(trimmed)) continue;
      (table ??= []).push(trimmed.slice(1, -1).split("|").map((cell) => cell.trim()));
      continue;
    }
    flushTable();
    const markdownHeading = MD_HEADING.exec(trimmed);
    if (markdownHeading) { flushAll(); heading(markdownHeading[1].length <= 2 ? 2 : 3, markdownHeading[2]); continue; }
    if (trimmed.startsWith(">")) { flushAll(); out.push(`<blockquote><p>${inlineMarkdown(trimmed.replace(/^>\s?/, ""))}</p></blockquote>`); sectionStart = false; continue; }
    const subheading = SUBHEADING_MARK.exec(trimmed);
    if (subheading && looksLikeUpperTitle(subheading[1].trim())) { flushAll(); heading(3, subheading[1].trim()); continue; }
    const bullet = BULLET.exec(line);
    if (bullet) {
      flushParagraph();
      const ordered = ORDERED.test(line);
      if (list && list.ordered !== ordered) flushList();
      (list ??= { ordered, items: [] }).items.push(bullet[1].trim());
      continue;
    }
    if (list && /^\s{2,}\S/.test(line) && list.items.length) { list.items[list.items.length - 1] += ` ${trimmed}`; continue; }
    flushList();
    const next = lines[index + 1]?.trim() ?? "";
    if (looksLikeUpperTitle(trimmed) && paragraph.length === 0) { heading(sectionStart ? 2 : 3, trimmed); continue; }
    if (/:$/.test(trimmed) && trimmed.length <= 70 && paragraph.length === 0 && next) { heading(3, trimmed.replace(/\s*:$/, "")); continue; }
    paragraph.push(trimmed);
  }
  flushAll();
  return out.join("");
}

export type BilanFraming = { body: string; subject: string | null; removedHeader: boolean; removedFooter: boolean };

const normalizeLines = (text: string) => String(text ?? "").replace(/\r\n?/g, "\n").split("\n");
const isBlank = (line: string) => !line.trim();

/**
 * Un bilan rédigé pour l'e-mail commence souvent par « Objet : … » puis un bloc de marque encadré par des traits, et finit par un bloc de
 * coordonnées : le papier à en-tête les fournit déjà. Ils sont retirés (jamais le corps) ; l'objet est renvoyé à part.
 */
export function extractBilanFraming(text: string): BilanFraming {
  let lines = normalizeLines(text);
  let subject: string | null = null;
  let removedHeader = false;
  let removedFooter = false;

  let first = lines.findIndex((line) => !isBlank(line));
  if (first >= 0) {
    const found = /^\s*(?:objet|subject)\s*:\s*(.+)$/i.exec(lines[first]);
    if (found) {
      const parts = [found[1].trim()];
      let cursor = first + 1;
      while (cursor < lines.length && /^\s{2,}\S/.test(lines[cursor])) { parts.push(lines[cursor].trim()); cursor += 1; }
      subject = parts.join(" ").slice(0, 300);
      lines = lines.slice(cursor);
      first = lines.findIndex((line) => !isBlank(line));
    }
  }
  if (first >= 0 && HEAVY_RULE.test(lines[first])) {
    const close = lines.findIndex((line, position) => position > first && HEAVY_RULE.test(line));
    if (close > first) {
      const block = lines.slice(first + 1, close).filter((line) => !isBlank(line));
      if (block.length > 0 && block.length <= 8 && block.some((line) => /3M\s+TRAVEL|votre mobilité|votre réussite/i.test(line))) {
        lines = lines.slice(close + 1);
        removedHeader = true;
      }
    }
  }
  const rules: number[] = [];
  lines.forEach((line, position) => { if (HEAVY_RULE.test(line)) rules.push(position); });
  if (rules.length >= 2) {
    const last = rules[rules.length - 1];
    const before = rules[rules.length - 2];
    const trailing = lines.slice(last + 1).filter((line) => !isBlank(line));
    const block = lines.slice(before + 1, last).filter((line) => !isBlank(line));
    if (trailing.length === 0 && block.length > 0 && block.length <= 16 && block.some((line) => /@|\+\d{2,3}\s?\d|www\.|direction de la mobilité/i.test(line))) {
      lines = lines.slice(0, before);
      removedFooter = true;
    }
  }
  return { body: lines.join("\n").trim(), subject, removedHeader, removedFooter };
}

/** Point d'entrée unique : ce que l'administrateur a collé (HTML, texte, Markdown) → HTML propre. */
export function toBilanHtml(input: string): string {
  const raw = String(input ?? "");
  if (!raw.trim()) return "";
  // Texte brut ou Markdown : l'objet d'e-mail, le bloc de marque et le bloc de coordonnées du modèle sont retirés (le papier à en-tête les fournit).
  const html = sanitizeBilanHtml(isHtmlLike(raw) ? raw : textToBilanHtml(extractBilanFraming(raw).body));
  return /<(?:p|ul|ol|h[2-4]|table|blockquote)\b/.test(html) ? html : html ? `<p>${html}</p>` : "";
}

/** HTML du bilan → texte brut lisible (listes à puces, lignes de tableau) : contrôle des formulations, PDF, version texte de l'e-mail. */
export function bilanPlainText(html: string): string {
  return decodeBasicEntities(
    String(html ?? "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(?:p|h[2-4]|blockquote|tr|ul|ol|table)>/gi, "\n")
      .replace(/<li>/gi, "• ")
      .replace(/<\/li>/gi, "\n")
      .replace(/<\/t[dh]>/gi, " | ")
      .replace(/<hr>/gi, "\n────────\n")
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export type BilanInspection = { characters: number; words: number; headings: number; forbiddenTerms: string[]; sensitiveData: string[]; placeholders: string[]; empty: boolean };

/** Zones à compléter laissées dans le texte : « [À CONFIRMER] », « [À COMPLÉTER] », « [...] », « {{…}} », « XXX ». Le bilan ne doit pas partir avec. */
const PLACEHOLDER = /\[\s*(?:à|a)\s+(?:confirmer|compléter|completer|préciser|preciser|renseigner)[^\]]{0,40}\]|\[\s*(?:\.{3}|…|xx+)\s*\]|\{\{[^}]{1,60}\}\}|\bX{3,}\b/gi;

/** Contrôle avant envoi : formulations promettant un résultat (« visa garanti »…) et données sensibles (passeport, IBAN, carte). Jamais supprimées en silence. */
export function inspectBilan(html: string): BilanInspection {
  const text = bilanPlainText(html);
  return {
    characters: text.length,
    words: text ? text.split(/\s+/).length : 0,
    headings: (html.match(/<h[2-4][ >]/g) ?? []).length,
    forbiddenTerms: findForbiddenTerms(text),
    sensitiveData: findSensitiveValues(text),
    placeholders: Array.from(new Set(text.match(PLACEHOLDER) ?? [])).slice(0, 8),
    empty: text.length < 20,
  };
}

const STYLE = {
  h2: "font:700 20px/1.3 'Segoe UI',Calibri,Arial,Helvetica,sans-serif;color:#17375e;margin:30px 0 14px;padding:0 0 8px 12px;border-bottom:2px solid #bbd9ea;border-left:5px solid #2b6cb8;letter-spacing:.2px",
  h3: "font:700 15.5px/1.35 Arial,Helvetica,sans-serif;color:#2b6cb8;margin:22px 0 8px",
  h4: "font:700 12.5px/1.4 Arial,Helvetica,sans-serif;color:#17375e;margin:16px 0 6px;text-transform:uppercase;letter-spacing:.5px",
  p: "margin:0 0 13px;line-height:1.75;color:#1f2937;font-size:14.5px;font-family:'Segoe UI',Calibri,Arial,Helvetica,sans-serif;text-align:justify;text-justify:inter-word;hyphens:auto",
  strong: "font-weight:700;color:#17375e",
  ul: "margin:0 0 14px;padding-left:24px;color:#1f2937;font-size:14.5px;line-height:1.75;font-family:'Segoe UI',Calibri,Arial,Helvetica,sans-serif;text-align:justify",
  ol: "margin:0 0 14px;padding-left:26px;color:#1f2937;font-size:14.5px;line-height:1.75;font-family:'Segoe UI',Calibri,Arial,Helvetica,sans-serif;text-align:justify",
  li: "margin:0 0 6px",
  blockquote: "margin:16px 0;padding:10px 18px;border-left:4px solid #2b6cb8;background:#f3f8fc;color:#334155",
  hr: "border:0;border-top:1px solid #bbd9ea;margin:22px 0",
  table: "width:100%;border-collapse:collapse;margin:16px 0;font-size:13.5px",
  th: "background:#17375e;color:#ffffff;padding:9px 11px;border:1px solid #17375e;text-align:left;vertical-align:top",
  td: "padding:9px 11px;border:1px solid #d5e3ee;vertical-align:top;color:#1f2937",
  a: "color:#2b6cb8;text-decoration:underline",
} as const;

/** Variantes de tableau : seuls l'en-tête et les lignes changent, le reste du style est commun. */
const TABLE_DESIGN_STYLE: Record<BilanTableDesign, { th: string; td: string }> = {
  classic: { th: STYLE.th, td: STYLE.td },
  soft: {
    th: "background:#eaf2fa;color:#17375e;padding:9px 11px;border:1px solid #d5e3ee;text-align:left;vertical-align:top",
    td: STYLE.td,
  },
  plain: {
    th: "padding:8px 10px;border:0;border-bottom:2px solid #17375e;text-align:left;vertical-align:top;color:#17375e",
    td: "padding:8px 10px;border:0;border-bottom:1px solid #e2e8f0;vertical-align:top;color:#1f2937",
  },
};

/**
 * Ajoute les styles en ligne (seule mise en forme que les messageries conservent) à un HTML déjà nettoyé.
 * Les noms de la palette (couleur, surlignage, taille, alignement, encadré, style de tableau) sont convertis en styles ; le reste est inchangé.
 */
export function styleBilanHtml(html: string): string {
  const designs: BilanTableDesign[] = [];
  return html.replace(/<(\/)?(h2|h3|h4|p|ul|ol|li|blockquote|hr|table|th|td|a|span|strong)(\s[^>]*)?>/g, (match, closing: string | undefined, tag: string, attributes: string | undefined) => {
    if (closing) {
      if (tag === "table") designs.pop();
      return match;
    }
    const attrs = attributes ?? "";
    if (tag === "table") designs.push(tableDesignFromAttributes(attrs) ?? "classic");
    const design = designs[designs.length - 1] ?? "classic";
    const base = tag === "span" ? "" : tag === "th" ? TABLE_DESIGN_STYLE[design].th : tag === "td" ? TABLE_DESIGN_STYLE[design].td : STYLE[tag as keyof typeof STYLE];
    const extra = inlineStyleFromDesign(tag, attrs);
    const style = [base, extra].filter(Boolean).join(";");
    return style ? `<${tag}${attrs} style="${style}">` : match;
  });
}

export type BilanDocumentInput = {
  html: string;
  title: string;
  candidateName: string;
  reference?: string | null;
  projectLabel?: string | null;
  destination?: string | null;
  /** Score affiché seulement s'il a été renseigné (jamais « 0 » par défaut). */
  score?: number | null;
  validatedLabel?: string | null;
  introHtml?: string | null;
};

/** Fragment du bilan prêt à l'emploi (espace candidat, aperçu, e-mail) : en-tête de document, contenu mis en forme, mention légale. */
export function renderBilanFragment(input: BilanDocumentInput): string {
  const meta = [input.projectLabel, input.destination, input.reference ? `Réf. ${input.reference}` : null].filter(Boolean).map((item) => escapeBrandHtml(String(item))).join(" · ");
  const score = typeof input.score === "number" && input.score > 0
    ? `<div style="display:inline-block;margin-top:12px;background:#17375e;color:#ffffff;border-radius:22px;padding:7px 16px;font:700 14px Arial,Helvetica,sans-serif">Indice de préparation : ${Math.round(input.score)} / 100</div>`
    : "";
  return `<div style="font-family:Arial,Helvetica,sans-serif;color:#1f2937">
<div style="background:#f3f8fc;border:1px solid #d5e3ee;border-left:5px solid #2b6cb8;border-radius:8px;padding:16px 20px;margin:0 0 20px">
<div style="font:700 11px Arial,Helvetica,sans-serif;letter-spacing:1px;text-transform:uppercase;color:#2b6cb8">${escapeBrandHtml(BRAND.commercialName)}</div>
<div style="font:700 21px/1.3 Arial,Helvetica,sans-serif;color:#17375e;margin-top:4px">${escapeBrandHtml(input.title)}</div>
<div style="font:14px/1.5 Arial,Helvetica,sans-serif;color:#334155;margin-top:6px"><strong>${escapeBrandHtml(input.candidateName)}</strong>${meta ? ` — ${meta}` : ""}</div>${input.validatedLabel ? `<div style="font:12px Arial,Helvetica,sans-serif;color:#64748b;margin-top:4px">${escapeBrandHtml(input.validatedLabel)}</div>` : ""}${score}
</div>
${input.introHtml ? `<div style="margin:0 0 18px">${input.introHtml}</div>` : ""}
<div>${styleBilanHtml(input.html)}</div>
<p style="margin:26px 0 0;padding-top:14px;border-top:1px solid #bbd9ea;font:12px/1.6 Arial,Helvetica,sans-serif;color:#64748b">${escapeBrandHtml(LEGAL_DISCLAIMER)}</p>
</div>`;
}

/** Même fragment dans un document complet à l'identité de l'agence : aperçu administrateur et lecture dans l'espace candidat. */
export function renderBilanStandalone(input: BilanDocumentInput): string {
  return frameBrandedDocument(renderBilanFragment(input));
}
