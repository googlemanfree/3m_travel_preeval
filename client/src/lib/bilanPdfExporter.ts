import jsPDF from "jspdf";
import { applyLetterhead, letterheadLayout, type LetterheadOptions } from "@shared/brandLetterhead";
import { loadClientBrandLogo } from "./brandLogo";

interface BilanData {
  dossierNumber: string;
  fullName?: string;
  score: number;
  verdict: string;
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
  /** Visa / destination du dossier : adaptent le service affiché en en-tête. */
  serviceFocus?: string | null;
}

export async function exportBilanToPDF(bilanData: BilanData) {
  try {
    // Create a new PDF document
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const logo = await loadClientBrandLogo();
    const letterhead: LetterheadOptions = {
      logoDataUri: logo?.dataUri,
      logoFormat: logo?.format,
      documentKind: "Bilan d’admissibilité",
      reference: bilanData.dossierNumber,
      recipient: bilanData.fullName,
      serviceFocus: bilanData.serviceFocus,
    };
    const layout = letterheadLayout(letterhead);
    let yPosition = layout.firstPageTop + 2;
    const margin = layout.marginLeft;
    const maxWidth = pdf.internal.pageSize.getWidth() - 2 * margin;

    // Helper function to add text with word wrapping
    const addText = (
      text: string,
      fontSize: number,
      isBold: boolean = false,
      color: [number, number, number] = [0, 0, 0]
    ) => {
      pdf.setFontSize(fontSize);
      pdf.setTextColor(color[0], color[1], color[2]);
      if (isBold) {
        pdf.setFont("helvetica", "bold");
      } else {
        pdf.setFont("helvetica", "normal");
      }

      const lines = pdf.splitTextToSize(text, maxWidth);
      pdf.text(lines, margin, yPosition);
      yPosition += lines.length * (fontSize / 2.5) + 2;

      // Check if we need a new page
      if (yPosition > layout.contentBottom) {
        pdf.addPage();
        yPosition = layout.nextPageTop;
      }
    };

    // Helper function to add a section
    const addSection = (title: string) => {
      if (yPosition > layout.contentBottom - 20) {
        pdf.addPage();
        yPosition = layout.nextPageTop;
      }
      pdf.setDrawColor(59, 130, 246); // Blue color
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPosition + 5, margin + maxWidth, yPosition + 5);
      addText(title, 14, true, [59, 130, 246]);
    };

    // ─── INFORMATIONS DU DOSSIER ───
    addSection("Informations du Dossier");
    addText(`Numéro de dossier: ${bilanData.dossierNumber}`, 11);
    if (bilanData.fullName) {
      addText(`Candidat: ${bilanData.fullName}`, 11);
    }
    addText(`Généré le ${new Date().toLocaleDateString("fr-FR")}`, 9, false, [100, 100, 100]);
    yPosition += 3;

    // ─── SCORE ET VERDICT ───
    addSection("Score et Verdict");
    
    // Score color based on value
    const scoreColor: [number, number, number] =
      bilanData.score >= 80
        ? [76, 175, 80] // Green
        : bilanData.score >= 60
          ? [244, 152, 67] // Orange
          : [244, 67, 54]; // Red

    addText(`Score d'Admissibilité: ${bilanData.score}/100`, 14, true, scoreColor);
    addText(`Verdict: ${bilanData.verdict}`, 12, true, scoreColor);

    // Add interpretation based on score
    const interpretation =
      bilanData.score >= 80
        ? "Profil très favorable pour votre projet"
        : bilanData.score >= 60
          ? "Profil favorable, quelques points à renforcer"
          : "Profil à renforcer avant soumission";
    addText(interpretation, 10, false, [100, 100, 100]);
    yPosition += 3;

    // ─── POINTS FORTS ───
    if (bilanData.strengths && bilanData.strengths.length > 0) {
      addSection("Points Forts");
      bilanData.strengths.forEach((strength) => {
        addText(`+ ${strength}`, 10, false, [76, 175, 80]);
      });
      yPosition += 3;
    }

    // ─── POINTS À AMÉLIORER ───
    if (bilanData.weaknesses && bilanData.weaknesses.length > 0) {
      addSection("Points à Améliorer");
      bilanData.weaknesses.forEach((weakness) => {
        addText(`→ ${weakness}`, 10, false, [244, 67, 54]);
      });
      yPosition += 3;
    }

    // ─── RECOMMANDATIONS ───
    if (bilanData.recommendations && bilanData.recommendations.length > 0) {
      addSection("Recommandations");
      bilanData.recommendations.forEach((rec, index) => {
        addText(`${index + 1}. ${rec}`, 10);
      });
      yPosition += 3;
    }

    applyLetterhead(pdf, letterhead);

    // Save the PDF
    const filename = `Bilan_${bilanData.dossierNumber}_${new Date().toISOString().split("T")[0]}.pdf`;
    pdf.save(filename);

    return filename;
  } catch (error) {
    console.error("Erreur lors de l'export PDF du bilan:", error);
    throw error;
  }
}
