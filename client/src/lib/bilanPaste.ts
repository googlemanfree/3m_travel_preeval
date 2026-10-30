/**
 * Collage depuis Word, Google Docs, un e-mail ou ChatGPT : le HTML du presse-papiers est converti en texte structuré (## titres, - listes, **gras**, tableaux « | a | b | »)
 * que le champ de saisie affiche et que l'aperçu met en forme. Les styles parasites, scripts et images sont ignorés.
 */
const BLOCK_PATTERN = /<(?:h[1-6]|ul|ol|li|table|strong|b|p)\b/i;

/** Vrai si le HTML collé porte une structure à conserver (sinon le texte brut suffit). */
export function hasStructure(html: string): boolean {
  return BLOCK_PATTERN.test(html);
}

export function htmlToStructuredText(html: string): string {
  if (typeof DOMParser === "undefined") return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script,style,meta,link,title,head,img,svg,iframe,object").forEach((node) => node.remove());
  const out: string[] = [];
  const clean = (value: string) => value.replace(/ /g, " ").replace(/\s+/g, " ").trim();

  const inline = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return (node.textContent ?? "").replace(/\s+/g, " ");
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    const element = node as HTMLElement;
    const tag = element.tagName.toLowerCase();
    if (tag === "br") return "\n";
    const content = Array.from(element.childNodes).map(inline).join("");
    if (tag === "strong" || tag === "b") return content.trim() ? `**${content.trim()}**` : "";
    if (tag === "em" || tag === "i") return content.trim() ? `*${content.trim()}*` : "";
    if (tag === "a") {
      const href = element.getAttribute("href") ?? "";
      return /^https:\/\//i.test(href) && content.trim() ? `[${content.trim()}](${href})` : content;
    }
    return content;
  };

  const block = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = clean(node.textContent ?? "");
      if (text) out.push(text, "");
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const element = node as HTMLElement;
    const tag = element.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag)) { const text = clean(inline(element)); if (text) out.push(`${tag === "h1" || tag === "h2" ? "##" : "###"} ${text.replace(/\*\*/g, "")}`, ""); return; }
    if (tag === "ul" || tag === "ol") {
      Array.from(element.children).forEach((item, index) => { const text = clean(inline(item)); if (text) out.push(`${tag === "ol" ? `${index + 1}.` : "-"} ${text}`); });
      out.push("");
      return;
    }
    if (tag === "table") {
      const rows = Array.from(element.querySelectorAll("tr")).map((row) => Array.from(row.children).map((cell) => clean(inline(cell)).replace(/\|/g, "/")));
      rows.filter((row) => row.some(Boolean)).forEach((row, index) => {
        out.push(`| ${row.join(" | ")} |`);
        if (index === 0) out.push(`| ${row.map(() => "---").join(" | ")} |`);
      });
      out.push("");
      return;
    }
    if (tag === "blockquote") { const text = clean(inline(element)); if (text) out.push(`> ${text}`, ""); return; }
    if (tag === "hr") { out.push("────────────────────", ""); return; }
    if (tag === "p" || tag === "pre") { const text = inline(element).split("\n").map(clean).filter(Boolean).join("\n"); if (text) out.push(text, ""); return; }
    // div, section, body… : on descend en regroupant le texte et les éléments en ligne (liens, gras…) d'un même paragraphe.
    flow(Array.from(element.childNodes));
  };

  const INLINE = new Set(["a", "strong", "b", "em", "i", "span", "font", "u", "code", "small", "sup", "sub", "mark", "label", "br"]);
  const flow = (nodes: Node[]) => {
    let buffer = "";
    const flush = () => {
      const text = buffer.split("\n").map(clean).filter(Boolean).join("\n");
      if (text) out.push(text, "");
      buffer = "";
    };
    for (const node of nodes) {
      const inlineNode = node.nodeType === Node.TEXT_NODE || (node.nodeType === Node.ELEMENT_NODE && INLINE.has((node as HTMLElement).tagName.toLowerCase()));
      if (inlineNode) buffer += inline(node);
      else { flush(); block(node); }
    }
    flush();
  };

  flow(Array.from(doc.body.childNodes));
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** Insère `text` à la sélection d'un champ et renvoie le nouveau contenu avec la position du curseur. */
export function insertAtSelection(current: string, start: number, end: number, text: string): { value: string; caret: number } {
  const from = Math.max(0, Math.min(start, current.length));
  const to = Math.max(from, Math.min(end, current.length));
  return { value: `${current.slice(0, from)}${text}${current.slice(to)}`, caret: from + text.length };
}

/** Position d'un passage dans le texte, sans tenir compte de la casse ni des accents ; -1 s'il n'y est pas. */
export function locatePassage(text: string, needle: string): { start: number; end: number } | null {
  if (!needle.trim()) return null;
  const fold = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const index = fold(text).indexOf(fold(needle));
  // La mise en forme sans accent garde les mêmes positions tant que le texte est précomposé (NFC) ; sinon on retombe sur la recherche brute.
  if (index >= 0 && fold(text).length === text.length) return { start: index, end: index + needle.length };
  const raw = text.toLowerCase().indexOf(needle.toLowerCase());
  return raw >= 0 ? { start: raw, end: raw + needle.length } : null;
}
