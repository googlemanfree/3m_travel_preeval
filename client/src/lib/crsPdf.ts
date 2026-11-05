import { CRS_SOURCE, CRS_TOTAL_MAX, type CrsBreakdown } from "@shared/crsScore";
import { resultSections } from "@/lib/crsResultModel";

/**
 * Export PDF du résultat de la calculatrice CRS Canada : mêmes sections, mêmes libellés et mêmes points que l'écran
 * (`resultSections`), produit localement dans le navigateur — aucune réponse n'est envoyée à un serveur.
 * Police par défaut de jsPDF (WinAnsi) : on évite l'espace fine insécable (U+202F) de `toLocaleString("fr-FR")`.
 */
export type CrsPdfInput = {
  breakdown: CrsBreakdown;
  withSpouse: boolean;
  levers: Array<{ label: string; gain: number }>;
  /** Date d'édition (injectable pour les tests). */
  generatedAt?: Date;
};

const plainNumber = (value: number) => String(value).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

export function crsPdfFileName(date: Date = new Date()): string {
  const iso = date.toISOString().slice(0, 10);
  return `score-crs-canada-${iso}.pdf`;
}

/** Construit le document (sans l'enregistrer) : séparé du téléchargement pour pouvoir être vérifié en test. */
export async function buildCrsPdf(input: CrsPdfInput) {
  const [{ default: JsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const { breakdown, withSpouse, levers } = input;
  const date = input.generatedAt ?? new Date();
  const doc = new JsPDF({ unit: "mm", format: "a4" });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const margin = 15;
  const lastY = (fallback: number) => (doc as typeof doc & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? fallback;
  const ensureSpace = (y: number, needed: number) => {
    if (y > height - needed) {
      doc.addPage();
      return 18;
    }
    return y;
  };

  doc.setFillColor(15, 48, 95);
  doc.rect(0, 0, width, 38, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text("3M TRAVEL AGENCY", margin, 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Estimation du score CRS — Entrée express (Canada)", margin, 23);
  doc.text(`Établie le ${date.toLocaleDateString("fr-FR")}`, width - margin, 23, { align: "right" });
  doc.text("Grille IRCC en vigueur depuis le 3 novembre 2026", margin, 30);

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Note totale du SCG", margin, 52);
  doc.setFontSize(28);
  doc.setTextColor(30, 64, 175);
  doc.text(`${plainNumber(breakdown.total)} / ${plainNumber(CRS_TOTAL_MAX)}`, width - margin, 54, { align: "right" });

  let y = 62;
  for (const section of resultSections(breakdown, withSpouse)) {
    y = ensureSpace(y, 60);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(section.title, margin, y);
    autoTable(doc, {
      startY: y + 2,
      body: [
        ...section.lines.map((line) => [line.sub ? `      ${line.label}` : line.label, String(line.points)]),
        [{ content: section.subtotalLabel, styles: { fontStyle: "bold", fillColor: [226, 236, 250] } }, { content: String(section.subtotal), styles: { fontStyle: "bold", fillColor: [226, 236, 250] } }],
      ],
      theme: "grid",
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 2.2, textColor: [15, 23, 42] },
      columnStyles: { 0: { cellWidth: "auto" }, 1: { cellWidth: 22, halign: "right" } },
    });
    y = lastY(y + 30) + 9;
  }

  y = ensureSpace(y, 30);
  doc.setFillColor(15, 48, 95);
  doc.rect(margin, y, width - margin * 2, 11, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Note totale du SCG", margin + 3, y + 7.3);
  doc.text(`${plainNumber(breakdown.total)} / ${plainNumber(CRS_TOTAL_MAX)}`, width - margin - 3, y + 7.3, { align: "right" });
  y += 20;

  if (breakdown.labourMarketSource === "job_offer") {
    y = ensureSpace(y, 30);
    doc.setTextColor(71, 85, 105);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    const note = doc.splitTextToSize(
      `Pour le facteur d’intégration sur le marché du travail, l’offre d’emploi (${breakdown.jobOfferPoints} points) vaut plus que votre expérience canadienne (${breakdown.canadianExperience + breakdown.highWageExperience} points) : IRCC retient la plus élevée.`,
      width - margin * 2,
    );
    doc.text(note, margin, y);
    y += note.length * 4.2 + 4;
  }

  if (levers.length > 0) {
    y = ensureSpace(y, 50);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Ce qui pourrait augmenter votre note", margin, y);
    autoTable(doc, {
      startY: y + 2,
      body: levers.map((lever) => [lever.label, `+${lever.gain} points`]),
      theme: "grid",
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 2.2, textColor: [15, 23, 42] },
      columnStyles: { 1: { cellWidth: 30, halign: "right", fontStyle: "bold" } },
    });
    y = lastY(y + 25) + 5;
    doc.setTextColor(71, 85, 105);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Écarts calculés avec la même grille : des simulations, pas des promesses. Seul IRCC fixe la note de chaque ronde d’invitations.", margin, y, { maxWidth: width - margin * 2 });
    y += 12;
  }

  y = ensureSpace(y, 35);
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const legal = doc.splitTextToSize(
    `Estimation indicative établie à partir de la grille publiée par IRCC (${CRS_SOURCE.url}), relue le ${new Date(CRS_SOURCE.verifiedAt).toLocaleDateString("fr-FR")}. Les niveaux de langue sont convertis avec les tranches de notes officielles. En cas de divergence avec le résultat du système électronique Entrée express, c’est ce dernier qui prévaut. Ce document ne constitue ni une invitation à présenter une demande ni une promesse de visa.`,
    width - margin * 2,
  );
  doc.text(legal, margin, y);

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`3M Travel Agency — page ${page}/${pages}`, width / 2, height - 8, { align: "center" });
  }
  return doc;
}

/** Télécharge le PDF dans le navigateur. */
export async function downloadCrsPdf(input: CrsPdfInput): Promise<void> {
  const doc = await buildCrsPdf(input);
  doc.save(crsPdfFileName(input.generatedAt));
}
