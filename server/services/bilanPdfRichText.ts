import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

/**
 * Dessine un bilan « libre » (HTML déjà nettoyé par shared/bilanContent) dans un PDF : titres, paragraphes avec gras et italique, listes,
 * citations, séparateurs et tableaux. La pagination est automatique ; l'en-tête et le pied de page sont peints ensuite par applyLetterhead.
 */

type Run = { text: string; bold?: boolean; italic?: boolean };
export type PdfBlock =
  | { kind: "heading"; level: 2 | 3 | 4; runs: Run[] }
  | { kind: "paragraph" | "quote"; runs: Run[] }
  | { kind: "item"; marker: string; runs: Run[]; depth: number }
  | { kind: "rule" }
  | { kind: "table"; head: string[][]; body: string[][] };

const SYMBOLS: Array<[RegExp, string]> = [
  [/[✓✔☑]/g, "+"], [/[▸▶►→➜➔]/g, ">"], [/[◆◇✦■▪●]/g, "-"], [/①/g, "(1)"], [/②/g, "(2)"], [/③/g, "(3)"], [/④/g, "(4)"], [/⑤/g, "(5)"], [/⑥/g, "(6)"],
  [/[   ]/g, " "], [/[“”„]/g, '"'], [/[‘’]/g, "'"],
];

/** Les polices PDF standard ne couvrent que le latin : les symboles courants sont remplacés, les autres caractères exotiques retirés. */
export function pdfSafeText(value: string): string {
  let out = value;
  for (const [pattern, replacement] of SYMBOLS) out = out.replace(pattern, replacement);
  return out.replace(/[^ -ÿ–—•…€Œœ]/g, "");
}

const decode = (value: string) =>
  value.replace(/&nbsp;/gi, " ").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/&amp;/gi, "&");

export function parsePdfBlocks(html: string): PdfBlock[] {
  const blocks: PdfBlock[] = [];
  const pattern = /<(\/?)([a-z0-9]+)([^>]*)>|([^<]+)/gi;
  let runs: Run[] = [];
  let container: { kind: "heading"; level: 2 | 3 | 4 } | { kind: "paragraph" | "quote" } | { kind: "item"; marker: string; depth: number } | null = null;
  let bold = 0;
  let italic = 0;
  const lists: Array<{ ordered: boolean; index: number }> = [];
  let table: { head: string[][]; body: string[][]; row: string[]; cell: string; inHead: boolean; rowHasTh: boolean } | null = null;

  const flush = () => {
    const text = runs.map((run) => run.text).join("").trim();
    if (container && text) {
      const trimmed = runs.map((run, index) => ({ ...run, text: index === 0 ? run.text.replace(/^\s+/, "") : run.text }));
      if (container.kind === "heading") blocks.push({ kind: "heading", level: container.level, runs: trimmed });
      else if (container.kind === "item") blocks.push({ kind: "item", marker: container.marker, runs: trimmed, depth: container.depth });
      else blocks.push({ kind: container.kind, runs: trimmed });
    }
    runs = [];
    container = null;
  };
  const open = (next: NonNullable<typeof container>) => { flush(); container = next; };

  for (const match of Array.from(html.matchAll(pattern))) {
    if (match[4] !== undefined) {
      const text = decode(match[4]).replace(/\s+/g, " ");
      if (!text.trim() && !container && !table) continue;
      if (table) { table.cell += text; continue; }
      if (!container) container = { kind: "paragraph" };
      runs.push({ text, bold: bold > 0, italic: italic > 0 });
      continue;
    }
    const closing = match[1] === "/";
    const tag = match[2].toLowerCase();
    if (table) {
      if (tag === "thead") table.inHead = !closing;
      else if (tag === "tr" && closing) {
        if (table.row.length) (table.inHead || table.rowHasTh ? table.head : table.body).push(table.row);
        table.row = []; table.rowHasTh = false;
      } else if ((tag === "td" || tag === "th") && closing) { table.row.push(table.cell.replace(/\s+/g, " ").trim()); table.cell = ""; }
      else if (tag === "th" && !closing) table.rowHasTh = true;
      else if (tag === "br" && !closing) table.cell += " ";
      else if (tag === "table" && closing) { blocks.push({ kind: "table", head: table.head, body: table.body }); table = null; }
      continue;
    }
    if (tag === "table" && !closing) { flush(); table = { head: [], body: [], row: [], cell: "", inHead: false, rowHasTh: false }; continue; }
    if (tag === "strong") bold = Math.max(0, bold + (closing ? -1 : 1));
    else if (tag === "em" || tag === "u") italic = Math.max(0, italic + (closing ? -1 : 1));
    else if (tag === "br") runs.push({ text: "\n" });
    else if (tag === "hr") { flush(); blocks.push({ kind: "rule" }); }
    else if (tag === "h2" || tag === "h3" || tag === "h4") { if (closing) flush(); else open({ kind: "heading", level: Number(tag[1]) as 2 | 3 | 4 }); }
    else if (tag === "p") { if (closing) flush(); else if (container?.kind !== "quote") open({ kind: "paragraph" }); }
    else if (tag === "blockquote") { if (closing) flush(); else open({ kind: "quote" }); }
    else if (tag === "ul" || tag === "ol") { flush(); if (closing) lists.pop(); else lists.push({ ordered: tag === "ol", index: 0 }); }
    else if (tag === "li") {
      if (closing) flush();
      else {
        const list = lists[lists.length - 1] ?? { ordered: false, index: 0 };
        list.index += 1;
        open({ kind: "item", marker: list.ordered ? `${list.index}.` : "•", depth: Math.max(0, lists.length - 1) });
      }
    }
  }
  flush();
  return blocks;
}

type Layout = { left: number; width: number; nextTop: number; bottom: number };
type Word = { text: string; bold: boolean; italic: boolean };

function wrapRuns(doc: jsPDF, runs: Run[], width: number, size: number): Word[][] {
  doc.setFontSize(size);
  const lines: Word[][] = [[]];
  let lineWidth = 0;
  const style = (word: Word) => doc.setFont("helvetica", word.bold && word.italic ? "bolditalic" : word.bold ? "bold" : word.italic ? "italic" : "normal");
  for (const run of runs) {
    const parts = pdfSafeText(run.text).split(/(\n)/);
    for (const part of parts) {
      if (part === "\n") { lines.push([]); lineWidth = 0; continue; }
      for (const piece of part.split(/(\s+)/)) {
        if (!piece) continue;
        const word: Word = { text: piece, bold: Boolean(run.bold), italic: Boolean(run.italic) };
        style(word);
        const w = doc.getTextWidth(piece);
        const isSpace = /^\s+$/.test(piece);
        if (isSpace && lineWidth === 0) continue;
        if (!isSpace && lineWidth + w > width && lineWidth > 0) { lines.push([]); lineWidth = 0; }
        lines[lines.length - 1].push(word);
        lineWidth += w;
      }
    }
  }
  return lines.filter((line) => line.some((word) => word.text.trim()));
}

/** Dessine les blocs à partir de `startY` (dans la zone utile) et renvoie la position Y suivante. */
export function drawBilanBlocks(doc: jsPDF, blocks: PdfBlock[], layout: Layout, startY: number): number {
  let y = startY;
  const room = (needed: number) => {
    if (y + needed <= layout.bottom) return;
    doc.addPage();
    y = layout.nextTop;
  };
  const drawLines = (lines: Word[][], x: number, size: number, lineHeight: number, color: [number, number, number], forceBold = false) => {
    for (const line of lines) {
      room(lineHeight);
      let cursor = x;
      for (const word of line) {
        doc.setFont("helvetica", forceBold || word.bold ? (word.italic ? "bolditalic" : "bold") : word.italic ? "italic" : "normal");
        doc.setFontSize(size);
        doc.setTextColor(color[0], color[1], color[2]);
        doc.text(word.text, cursor, y);
        cursor += doc.getTextWidth(word.text);
      }
      y += lineHeight;
    }
  };

  for (const block of blocks) {
    if (block.kind === "heading") {
      const size = block.level === 2 ? 13 : block.level === 3 ? 11.5 : 9.5;
      const color: [number, number, number] = block.level === 3 ? [43, 108, 184] : [23, 55, 94];
      const runs = block.level === 4 ? block.runs.map((run) => ({ ...run, text: run.text.toUpperCase() })) : block.runs;
      const lines = wrapRuns(doc, runs, layout.width, size);
      y += block.level === 2 ? 5 : 3;
      room(lines.length * (size * 0.42) + 6);
      drawLines(lines, layout.left, size, size * 0.42, color, true);
      if (block.level === 2) {
        doc.setDrawColor(187, 217, 234);
        doc.setLineWidth(0.5);
        doc.line(layout.left, y - 2, layout.left + layout.width, y - 2);
        y += 1;
      }
      y += 2;
    } else if (block.kind === "paragraph") {
      drawLines(wrapRuns(doc, block.runs, layout.width, 10), layout.left, 10, 5, [31, 41, 55]);
      y += 2.5;
    } else if (block.kind === "quote") {
      const lines = wrapRuns(doc, block.runs, layout.width - 8, 10);
      room(lines.length * 5 + 4);
      const top = y - 4;
      drawLines(lines, layout.left + 6, 10, 5, [51, 65, 85]);
      doc.setDrawColor(43, 108, 184);
      doc.setLineWidth(1);
      doc.line(layout.left + 1.5, top, layout.left + 1.5, y - 3);
      y += 3;
    } else if (block.kind === "item") {
      const indent = 4 + block.depth * 6;
      const lines = wrapRuns(doc, block.runs, layout.width - indent - 6, 10);
      room(5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(43, 108, 184);
      doc.text(pdfSafeText(block.marker), layout.left + indent, y);
      drawLines(lines, layout.left + indent + 6, 10, 5, [31, 41, 55]);
      y += 1;
    } else if (block.kind === "rule") {
      room(6);
      doc.setDrawColor(187, 217, 234);
      doc.setLineWidth(0.4);
      doc.line(layout.left, y, layout.left + layout.width, y);
      y += 6;
    } else if (block.kind === "table" && (block.head.length || block.body.length)) {
      room(20);
      const clean = (rows: string[][]) => rows.map((row) => row.map(pdfSafeText));
      autoTable(doc, {
        startY: y,
        head: clean(block.head),
        body: clean(block.body),
        theme: "grid",
        margin: { left: layout.left, right: 210 - layout.left - layout.width, top: layout.nextTop, bottom: 297 - layout.bottom },
        styles: { fontSize: 9, cellPadding: 2, textColor: [31, 41, 55], lineColor: [213, 227, 238] },
        headStyles: { fillColor: [23, 55, 94], textColor: 255, fontStyle: "bold" },
      });
      y = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 5;
    }
  }
  return y;
}
