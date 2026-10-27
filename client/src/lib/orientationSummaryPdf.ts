import jsPDF from "jspdf";
import { autoTable } from "jspdf-autotable";
import { applyLetterhead, letterheadLayout, type LetterheadOptions } from "@shared/brandLetterhead";
import { loadClientBrandLogo } from "@/lib/brandLogo";

export type OrientationAlternativePdf = { country: string; rationale: string; checks: string[]; officialUrl?: string };

export type OrientationSummaryPdf = {
  candidateName: string;
  email: string;
  destinationCountry: string;
  projectType: string;
  createdAt: Date | string;
  summary?: string;
  alternatives: OrientationAlternativePdf[];
  documentPriorities?: string[];
  disclaimer: string;
};

const addSectionTitle = (doc: jsPDF, title: string, y: number, x = 18) => {
  doc.setTextColor(23, 55, 94);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(title, x, y);
  doc.setTextColor(20, 28, 45);
  doc.setFont("helvetica", "normal");
};

export function orientationPdfFileName(destinationCountry: string) {
  const normalized = destinationCountry.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `recapitulatif-3m-${normalized || "orientation"}.pdf`;
}

export async function downloadOrientationSummaryPdf(data: OrientationSummaryPdf) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const logo = await loadClientBrandLogo();
  const letterhead: LetterheadOptions = {
    logoDataUri: logo?.dataUri,
    logoFormat: logo?.format,
    documentKind: "Récapitulatif d’évaluation",
    recipient: data.candidateName,
    subject: `Pistes à vérifier — ${data.destinationCountry}`,
    dateLabel: new Date(data.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }),
  };
  const layout = letterheadLayout(letterhead);
  const left = layout.marginLeft;
  const textWidth = layout.contentWidth;
  const ensure = (y: number, needed: number) => {
    if (y + needed <= layout.contentBottom) return y;
    doc.addPage();
    return layout.nextPageTop;
  };
  let y = layout.firstPageTop + 2;

  addSectionTitle(doc, "Informations déclarées", y);
  y += 7;
  doc.setFontSize(9.5);
  [
    `Candidat : ${data.candidateName}`,
    `E-mail : ${data.email}`,
    `Projet : ${data.projectType}`,
    `Destination sélectionnée : ${data.destinationCountry}`,
    `Créé le : ${new Date(data.createdAt).toLocaleDateString("fr-FR")}`,
  ].forEach((line) => { y = ensure(y, 5); doc.text(line, left, y); y += 5; });

  if (data.summary) {
    y = ensure(y + 4, 14);
    addSectionTitle(doc, "Brouillon d’orientation", y);
    y += 6;
    const lines = doc.splitTextToSize(data.summary, textWidth) as string[];
    doc.setFontSize(9.5);
    for (const line of lines) { y = ensure(y, 4.5); doc.text(line, left, y); y += 4.5; }
    y += 5;
  }

  if (data.alternatives.length > 0) {
    y = ensure(y, 20);
    addSectionTitle(doc, "Pistes de destination à vérifier", y);
    y += 5;
    autoTable(doc, {
      startY: y,
      head: [["Destination", "Motif de comparaison", "Vérifications / source officielle"]],
      body: data.alternatives.map((alternative) => [
        alternative.country,
        alternative.rationale,
        [...alternative.checks, alternative.officialUrl ? `Source : ${alternative.officialUrl}` : ""].filter(Boolean).join("\n"),
      ]),
      theme: "grid",
      margin: { left, right: 210 - layout.marginRight, top: layout.nextPageTop, bottom: 297 - layout.contentBottom },
      styles: { fontSize: 8, cellPadding: 2.2, valign: "top" },
      headStyles: { fillColor: [23, 55, 94], textColor: 255, fontStyle: "bold" },
    });
    y = (doc as any).lastAutoTable.finalY + 7;
  }

  if (data.documentPriorities?.length) {
    y = ensure(y, 16);
    addSectionTitle(doc, "Éléments documentaires à préparer", y);
    y += 6;
    doc.setFontSize(9.5);
    data.documentPriorities.slice(0, 6).forEach((item) => {
      const lines = doc.splitTextToSize(`• ${item}`, textWidth) as string[];
      y = ensure(y, lines.length * 4.5 + 2);
      doc.text(lines, left, y);
      y += lines.length * 4.5 + 2;
    });
  }

  const disclaimer = doc.splitTextToSize(data.disclaimer, textWidth - 8) as string[];
  const boxHeight = disclaimer.length * 4 + 8;
  y = ensure(y + 4, boxHeight);
  doc.setFillColor(245, 247, 251);
  doc.roundedRect(left, y, textWidth, boxHeight, 2, 2, "F");
  doc.setTextColor(70, 76, 88);
  doc.setFontSize(8.5);
  doc.text(disclaimer, left + 4, y + 6);
  doc.setTextColor(20, 28, 45);
  applyLetterhead(doc, letterhead);
  doc.save(orientationPdfFileName(data.destinationCountry));
}
