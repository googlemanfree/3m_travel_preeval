import jsPDF from "jspdf";
import { autoTable } from "jspdf-autotable";

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

const addSectionTitle = (doc: jsPDF, title: string, y: number) => {
  doc.setTextColor(11, 42, 82);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(title, 15, y);
  doc.setTextColor(20, 28, 45);
  doc.setFont("helvetica", "normal");
};

export function orientationPdfFileName(destinationCountry: string) {
  const normalized = destinationCountry.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `recapitulatif-3m-${normalized || "orientation"}.pdf`;
}

export function downloadOrientationSummaryPdf(data: OrientationSummaryPdf) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const width = doc.internal.pageSize.getWidth();
  let y = 18;
  doc.setFillColor(11, 42, 82);
  doc.rect(0, 0, width, 34, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text("3M Travel & Services", 15, 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Récapitulatif d’évaluation et pistes à vérifier", 15, 23);
  doc.setTextColor(20, 28, 45);
  y = 46;

  addSectionTitle(doc, "Informations déclarées", y);
  y += 7;
  doc.setFontSize(9.5);
  [
    `Candidat : ${data.candidateName}`,
    `E-mail : ${data.email}`,
    `Projet : ${data.projectType}`,
    `Destination sélectionnée : ${data.destinationCountry}`,
    `Créé le : ${new Date(data.createdAt).toLocaleDateString("fr-FR")}`,
  ].forEach((line) => { doc.text(line, 15, y); y += 5; });

  if (data.summary) {
    y += 4;
    addSectionTitle(doc, "Brouillon d’orientation", y);
    y += 6;
    const lines = doc.splitTextToSize(data.summary, width - 30);
    doc.setFontSize(9.5);
    doc.text(lines, 15, y);
    y += lines.length * 4.5 + 5;
  }

  if (data.alternatives.length > 0) {
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
      margin: { left: 15, right: 15 },
      styles: { fontSize: 8, cellPadding: 2.2, valign: "top" },
      headStyles: { fillColor: [11, 42, 82], textColor: 255, fontStyle: "bold" },
    });
    y = (doc as any).lastAutoTable.finalY + 7;
  }

  if (data.documentPriorities?.length && y < 250) {
    addSectionTitle(doc, "Éléments documentaires à préparer", y);
    y += 6;
    doc.setFontSize(9.5);
    data.documentPriorities.slice(0, 6).forEach((item) => { const lines = doc.splitTextToSize(`• ${item}`, width - 30); doc.text(lines, 15, y); y += lines.length * 4.5 + 2; });
  }

  if (y > 255) { doc.addPage(); y = 20; }
  doc.setFillColor(245, 247, 251);
  doc.roundedRect(15, y, width - 30, 30, 2, 2, "F");
  doc.setTextColor(70, 76, 88);
  doc.setFontSize(8.5);
  const disclaimer = doc.splitTextToSize(data.disclaimer, width - 38);
  doc.text(disclaimer, 19, y + 7);
  doc.setTextColor(20, 28, 45);
  doc.save(orientationPdfFileName(data.destinationCountry));
}
