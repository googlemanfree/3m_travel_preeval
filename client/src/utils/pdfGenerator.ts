/**
 * Utilitaire pour générer des PDF à partir des données du formulaire
 * Utilise jsPDF pour créer des PDFs professionnels
 */

import { jsPDF } from "jspdf";

export const exportFormDataAsPDF = (
  formData: Record<string, string>,
  filename: string = "formulaire.pdf"
): void => {
  try {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    let yPosition = margin;

    // En-tête
    pdf.setFontSize(18);
    pdf.setTextColor(25, 45, 85);
    pdf.text("Demande de Visa", margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(11);
    pdf.setTextColor(100, 100, 100);
    pdf.text("3M Travel & Services", margin, yPosition);
    yPosition += 10;

    // Ligne de séparation
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Contenu
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);

    for (const [key, value] of Object.entries(formData)) {
      if (!value) continue;

      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = margin;
      }

      // Label
      pdf.setFont(undefined, "bold");
      pdf.setTextColor(25, 45, 85);
      const label = key.replace(/([A-Z])/g, " $1").trim();
      pdf.text(label as any, margin, yPosition);

      // Valeur
      pdf.setFont(undefined, "normal");
      pdf.setTextColor(50, 50, 50);
      pdf.text(String(value) as any, margin + 50, yPosition);

      yPosition += 8;
    }

    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      `Généré le ${new Date().toLocaleString("fr-FR")}`,
      margin,
      pageHeight - 10
    );

    pdf.save(filename);
  } catch (error) {
    console.error("Erreur lors de la génération du PDF:", error);
    throw error;
  }
};
