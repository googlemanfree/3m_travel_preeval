/**
 * Mode « texte simple » de l'éditeur de bilan : les sections modifiables s'écrivent comme un texte ordinaire, facile à copier ou à coller.
 *   ## Titre de la section
 *   Paragraphe…
 *
 *   Autre paragraphe…
 *   - puce
 * Les sections calculées (verdict, note) n'en font pas partie : elles dépendent de la notation et se changent par le champ de note contrôlé.
 */
export type EditableSection = { id: string; title: string; paragraphs: string[]; bullets: string[]; table?: Array<[string, string]>; locked?: boolean };

export function sectionsToEditableText(sections: EditableSection[]): string {
  return sections
    .filter((section) => !section.locked)
    .map((section) => [`## ${section.title}`, ...section.paragraphs.flatMap((paragraph, index) => (index === 0 ? [paragraph] : ["", paragraph])), ...(section.paragraphs.length > 0 && section.bullets.length > 0 ? [""] : []), ...section.bullets.map((bullet) => `- ${bullet}`)].join("\n"))
    .join("\n\n");
}

export type ParsedSection = { title: string; paragraphs: string[]; bullets: string[] };

/** Relit le texte simple : même nombre de sections que l'original (la structure du bilan ne change pas), dans le même ordre. */
export function parseEditableText(text: string, expectedCount: number): { ok: true; sections: ParsedSection[] } | { ok: false; error: string } {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  const blocks = normalized.split(/\n(?=## )/).map((block) => block.trim()).filter(Boolean);
  if (blocks.length !== expectedCount || blocks.some((block) => !block.startsWith("## "))) {
    return { ok: false, error: `Le texte doit contenir exactement ${expectedCount} sections, chacune commençant par « ## » (trouvé : ${blocks.length}).` };
  }
  const sections = blocks.map((block): ParsedSection => {
    const [heading, ...rest] = block.split("\n");
    const paragraphs: string[] = [];
    const bullets: string[] = [];
    let current: string[] = [];
    const flush = () => { if (current.length) paragraphs.push(current.join(" ").trim()); current = []; };
    for (const line of rest) {
      if (/^\s*[-•]\s+/.test(line)) { flush(); bullets.push(line.replace(/^\s*[-•]\s+/, "").trim()); }
      else if (line.trim() === "") flush();
      else current.push(line.trim());
    }
    flush();
    return { title: heading.replace(/^##\s*/, "").trim(), paragraphs: paragraphs.filter(Boolean), bullets: bullets.filter(Boolean) };
  });
  if (sections.some((section) => !section.title)) return { ok: false, error: "Chaque section doit avoir un titre après « ## »." };
  return { ok: true, sections };
}
