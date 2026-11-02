import type { jsPDF as JsPdf } from "jspdf";
import type { DocumentBilan } from "@/lib/documentBilan";
import { applyLetterhead, letterheadLayout, serviceFocusLabel, type LetterheadOptions } from "@shared/brandLetterhead";
import { loadClientBrandLogo, type ClientBrandLogo } from "@/lib/brandLogo";

const MARGIN = 18;
const PAGE_WIDTH = 210;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const LEVEL_COLORS: Record<string, [number, number, number]> = {
  done: [4, 120, 87],
  review: [29, 78, 216],
  fix: [190, 18, 60],
  missing: [180, 83, 9],
  waived: [100, 116, 139],
};

const formatDate = (date: Date) => date.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

/** Dessine le bilan sur un document jsPDF déjà créé (testable sans navigateur). */
export function renderDocumentBilanPdf(pdf: JsPdf, bilan: DocumentBilan, logo?: ClientBrandLogo | null): void {
  const letterhead: LetterheadOptions = {
    logoDataUri: logo?.dataUri,
    logoFormat: logo?.format,
    documentKind: "Bilan documentaire du dossier",
    reference: bilan.reference,
    recipient: bilan.candidateName,
    serviceFocus: serviceFocusLabel(null, bilan.destination),
  };
  const layout = letterheadLayout(letterhead);
  let y = layout.firstPageTop + 2;
  const ensureSpace = (height: number) => {
    if (y + height > layout.contentBottom) {
      pdf.addPage();
      y = layout.nextPageTop;
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

  text(`Établi le ${formatDate(bilan.generatedAt)}${bilan.destination ? ` · Destination : ${bilan.destination}` : ""}`, 9, { color: [100, 116, 139] });
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

  y += 4;
  text("Document de suivi. La validation d'une pièce par l'agence ne préjuge pas de la décision des autorités.", 8, { color: [100, 116, 139] });

  applyLetterhead(pdf, letterhead);
}

/** Crée le PDF dans le navigateur et déclenche le téléchargement. */
export async function downloadDocumentBilanPdf(bilan: DocumentBilan, fileName: string): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  renderDocumentBilanPdf(pdf, bilan, await loadClientBrandLogo());
  pdf.save(fileName);
}
