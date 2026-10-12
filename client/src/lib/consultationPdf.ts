export interface ConsultationSummaryPdfInput {
  candidateName: string;
  email: string;
  phone?: string | null;
  targetCountry?: string | null;
  status: string;
  report: string;
  adminNotes?: string | null;
  fileName?: string | null;
}

export function buildConsultationPdfFilename(candidateName: string, date = new Date()): string {
  const safeName = candidateName.trim().replace(/[^a-zA-Z0-9À-ÿ]+/g, "_").replace(/^_+|_+$/g, "") || "candidat";
  return `resume_consultation_${safeName}_${date.toISOString().slice(0, 10)}.pdf`;
}

export function buildConsultationSummaryLines(input: ConsultationSummaryPdfInput): string[] {
  return [
    `Candidat : ${input.candidateName}`,
    `Email : ${input.email}`,
    ...(input.phone ? [`Téléphone : ${input.phone}`] : []),
    ...(input.targetCountry ? [`Destination : ${input.targetCountry}`] : []),
    `Statut : ${input.status}`,
    ...(input.fileName ? [`CV analysé : ${input.fileName}`] : []),
  ];
}

/** Génère le résumé localement dans le navigateur ; aucune donnée CV n'est envoyée à un tiers. */
export async function exportConsultationSummaryPdf(input: ConsultationSummaryPdfInput): Promise<void> {
  const [{ default: JsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const doc = new JsPDF({ unit: "mm", format: "a4" });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const margin = 15;

  doc.setFillColor(15, 48, 95);
  doc.rect(0, 0, width, 38, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text("3M TRAVEL AGENCY", margin, 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Résumé de consultation CV — usage administratif", margin, 23);
  doc.text(`Édité le ${new Date().toLocaleDateString("fr-FR")}`, width - margin, 23, { align: "right" });

  let y = 52;
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Informations du candidat", margin, y);
  y += 6;
  autoTable(doc, {
    startY: y,
    head: [["Élément", "Détail"]],
    body: buildConsultationSummaryLines(input).map((line) => {
      const separator = line.indexOf(" : ");
      return separator >= 0 ? [line.slice(0, separator), line.slice(separator + 3)] : ["", line];
    }),
    theme: "grid",
    margin: { left: margin, right: margin },
    headStyles: { fillColor: [30, 93, 164], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 3 },
  });
  y = ((doc as typeof doc & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 30) + 12;

  if (y > height - 55) {
    doc.addPage();
    y = 18;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Résumé de l’évaluation", margin, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const reportLines = doc.splitTextToSize(input.report.trim() || "Aucun résumé d’évaluation disponible.", width - margin * 2);
  for (const line of reportLines) {
    if (y > height - 25) {
      doc.addPage();
      y = 18;
    }
    doc.text(line, margin, y);
    y += 5;
  }

  if (input.adminNotes?.trim()) {
    y += 6;
    if (y > height - 35) {
      doc.addPage();
      y = 18;
    }
    doc.setFont("helvetica", "bold");
    doc.text("Note interne", margin, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    for (const line of doc.splitTextToSize(input.adminNotes.trim(), width - margin * 2)) {
      if (y > height - 25) {
        doc.addPage();
        y = 18;
      }
      doc.text(line, margin, y);
      y += 5;
    }
  }

  const pages = (doc as typeof doc & { internal: { pages: unknown[] } }).internal.pages.length - 1;
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(210, 218, 230);
    doc.line(margin, height - 15, width - margin, height - 15);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Confidentiel — 3M TRAVEL AGENCY · Page ${page}/${pages}`, width / 2, height - 9, { align: "center" });
  }

  doc.save(buildConsultationPdfFilename(input.candidateName));
}
