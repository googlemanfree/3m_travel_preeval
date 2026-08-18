const allowedTags = new Set(["p", "br", "strong", "b", "em", "i", "u", "ul", "ol", "li", "h3", "a", "table", "tbody", "tr", "td", "th"]);

function decodeEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

export function sanitizeRichTextHtml(value: string) {
  const withoutComments = value.replace(/<!--[\s\S]*?-->/g, "");
  return withoutComments.replace(/<\s*(\/?)\s*([a-z0-9]+)([^>]*)>/gi, (_match, closing: string, tagName: string, attributes: string) => {
    const tag = tagName.toLowerCase();
    if (!allowedTags.has(tag)) return "";
    if (closing) return `</${tag}>`;
    if (tag !== "a") return `<${tag}>`;
    const href = /href\s*=\s*["']([^"']+)["']/i.exec(attributes)?.[1] ?? "";
    if (!href.startsWith("https://") && !href.startsWith("/")) return "<a>";
    const safeHref = href.replace(/["<>]/g, "");
    return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer">`;
  }).trim();
}

export function richTextToPlainText(value: string) {
  return decodeEntities(value
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\s*\/\s*(p|h3|li|tr)\s*>/gi, "\n")
    .replace(/<[^>]+>/g, ""))
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}
