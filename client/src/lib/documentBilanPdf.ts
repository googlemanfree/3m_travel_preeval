import type { jsPDF as JsPdf } from "jspdf";
import type { DocumentBilan } from "@/lib/documentBilan";

const MARGIN = 16;
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const BOTTOM = PAGE_HEIGHT - 18;

const LEVEL_COLORS: Record<string, [number, number, number]> = {
  done: [4, 120, 87],
  review: [29, 78, 216],
  fix: [190, 18, 60],
  missing: [180, 83, 9],
  waived: [100, 116, 139],
};

const formatDate = (date: Date) => date.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

/** Dessine le bilan sur un document jsPDF déjà créé (testable sans navigateur). */
export function renderDocumentBilanPdf(pdf: JsPdf, bilan: DocumentBilan): void {
  let y = MARGIN;
  const ensureSpace = (height: number) => {
    if (y + height > BOTTOM) {
      pdf.addPage();
      y = MARGIN;
    }
  };
  const text = (value: string, size: number, options: { bold?: boolean; color?: [number, number, number]; x?: number; width?: number } = {}) => {
    pdf.setFont("helvetica", options.bold ? "bold" : "normal");
    pdf.setFontSize(size);
    const [r, g, b] = options.color ?? [15, 23, 42];
    pdf.setTextColor(r, g, b);
    const lines = pdf.splitTextToSize(value, options.width ?? CONTENT_WIDTH) as string[];
    const lineHeight = size * 0.45;
    for (const line of lines) {
      ensureSpace(lineHeight + 1);
      pdf.text(line, options.x ?? MARGIN, y);
      y += lineHeight;
    }
  };

  text("3M TRAVEL AGENCY", 9, { bold: true, color: [30, 58, 138] });
  y += 1.5;
  text("Bilan documentaire du dossier", 18, { bold: true });
  y += 2;
  text(`${bilan.candidateName} · réf. ${bilan.reference}${bilan.destination ? ` · ${bilan.destination}` : ""}`, 10.5, { color: [51, 65, 85] });
  text(`Établi le ${formatDate(bilan.generatedAt)}`, 9, { color: [100, 116, 139] });
  y += 4;

  const { summary } = bilan;
  text(
    summary.total === 0
      ? "Aucune pièce demandée pour ce dossier."
      : `${summary.validated} pièce(s) validée(s) sur ${summary.total} demandée(s) (${summary.percent} %).`,
    12,
    { bold: true },
  );
  if (summary.total > 0) {
    ensureSpace(5);
    pdf.setFillColor(226, 232, 240);
    pdf.rect(MARGIN, y, CONTENT_WIDTH, 3, "F");
    pdf.setFillColor(4, 120, 87);
    pdf.rect(MARGIN, y, (CONTENT_WIDTH * summary.percent) / 100, 3, "F");
    y += 8;
  }

  text("Détail des pièces", 12, { bold: true });
  y += 1.5;
  for (const line of bilan.lines) {
    ensureSpace(11);
    const [r, g, b] = LEVEL_COLORS[line.level] ?? LEVEL_COLORS.waived;
    pdf.setFillColor(r, g, b);
    pdf.circle(MARGIN + 1.5, y - 1.2, 1.2, "F");
    text(line.label, 10.5, { bold: true, x: MARGIN + 5, width: 92 });
    const labelBottom = y;
    y -= 4.7;
    text(line.statusLabel, 10, { bold: true, color: [r, g, b], x: MARGIN + 100, width: 70 });
    y = Math.max(y, labelBottom);
    if (line.note) {
      text(line.note, 9, { color: [71, 85, 105], x: MARGIN + 5, width: CONTENT_WIDTH - 5 });
    }
    y += 2;
  }

  if (bilan.nextActions.length > 0) {
    y += 3;
    ensureSpace(14);
    text("Prochaines actions", 12, { bold: true });
    y += 1.5;
    for (const action of bilan.nextActions) text(`- ${action}`, 10, { x: MARGIN + 2, width: CONTENT_WIDTH - 2 });
  } else if (summary.total > 0) {
    y += 3;
    text("Toutes les pièces demandées sont traitées.", 10, { color: [4, 120, 87], bold: true });
  }

  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    pdf.setPage(page);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text("Document de suivi interne. La validation d'une pièce par l'agence ne préjuge pas de la décision des autorités.", MARGIN, PAGE_HEIGHT - 10, { maxWidth: CONTENT_WIDTH });
    pdf.text(`Page ${page} / ${pages}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 10, { align: "right" });
  }
}

/** Crée le PDF dans le navigateur et déclenche le téléchargement. */
export async function downloadDocumentBilanPdf(bilan: DocumentBilan, fileName: string): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  renderDocumentBilanPdf(pdf, bilan);
  pdf.save(fileName);
}
