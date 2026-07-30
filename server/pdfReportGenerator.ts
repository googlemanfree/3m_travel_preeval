import { jsPDF } from "jspdf";

export interface ReportData {
  candidateName: string;
  email: string;
  folderCode: string;
  evaluationDate: Date;
  scores: {
    poland: number;
    canada: number;
    germany: number;
    luxembourg: number;
  };
  criteria: {
    formation: number;
    experience: number;
    language: number;
    scarcitySektor: number;
    marketAdjustment: number;
  };
  strengths: string[];
  recommendations: string[];
  summary: string;
  legalFramework: string;
}

export function generateReportPDF(data: ReportData): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = 20;

  // Header bleu nuit sombre
  doc.setFillColor(15, 23, 42); // #0F172A
  doc.rect(0, 0, pageWidth, 35, "F");

  // Logo et titre
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("3M Travel & Services", margin, 12);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Votre Pré-Évaluation Visa & Immigration", margin, 18);

  // Sous-titre officiel
  doc.setTextColor(252, 211, 77); // #FCD34D
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Rapport d'Évaluation Consulaire Officiel", margin, 24);

  // Ligne de séparation
  doc.setDrawColor(229, 231, 235); // #E5E7EB
  doc.line(margin, 30, pageWidth - margin, 30);

  // Contenu principal
  doc.setTextColor(0, 0, 0);
  yPosition = 40;

  // Informations du candidat
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Informations du Candidat", margin, yPosition);
  yPosition += 8;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Nom: ${data.candidateName}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Email: ${data.email}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Dossier: ${data.folderCode}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Date d'évaluation: ${data.evaluationDate.toLocaleDateString("fr-FR")}`, margin, yPosition);
  yPosition += 12;

  // Scores par destination
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Scores d'Éligibilité par Destination", margin, yPosition);
  yPosition += 8;

  const destinations = [
    { name: "🇵🇱 Pologne", score: data.scores.poland },
    { name: "🇨🇦 Canada", score: data.scores.canada },
    { name: "🇪🇺 Allemagne", score: data.scores.germany },
    { name: "🇱🇺 Luxembourg", score: data.scores.luxembourg },
  ];

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  destinations.forEach((dest) => {
    doc.text(dest.name, margin, yPosition);

    // Barre de score
    const barWidth = 60;
    const filledWidth = (dest.score / 100) * barWidth;

    // Barre vide
    doc.setDrawColor(209, 213, 219); // #D1D5DB
    doc.rect(margin + 40, yPosition - 2, barWidth, 3);

    // Barre remplie
    doc.setFillColor(16, 185, 129); // #10B981
    doc.rect(margin + 40, yPosition - 2, filledWidth, 3, "F");

    // Pourcentage
    doc.text(`${dest.score}%`, margin + 105, yPosition);
    yPosition += 7;
  });

  yPosition += 5;

  // Grille analytique des critères
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Analyse Détaillée des Critères", margin, yPosition);
  yPosition += 8;

  const criteria = [
    { name: "Formation", score: data.criteria.formation },
    { name: "Expérience Professionnelle", score: data.criteria.experience },
    { name: "Maîtrise de la Langue", score: data.criteria.language },
    { name: "Secteur en Pénurie", score: data.criteria.scarcitySektor },
    { name: "Ajustement Marché", score: data.criteria.marketAdjustment },
  ];

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  criteria.forEach((crit) => {
    doc.text(crit.name, margin, yPosition);

    // Barre de score
    const barWidth = 50;
    const filledWidth = (crit.score / 100) * barWidth;

    // Barre vide
    doc.setDrawColor(209, 213, 219);
    doc.rect(margin + 50, yPosition - 2, barWidth, 3);

    // Barre remplie
    let color: [number, number, number] = [16, 185, 129]; // Vert
    if (crit.score < 75) color = [245, 158, 11]; // Ambre
    if (crit.score < 50) color = [239, 68, 68]; // Rouge

    doc.setFillColor(...color);
    doc.rect(margin + 50, yPosition - 2, filledWidth, 3, "F");

    // Pourcentage
    doc.text(`${crit.score}%`, margin + 105, yPosition);
    yPosition += 7;
  });

  yPosition += 8;

  // Points forts
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Points Forts", margin, yPosition);
  yPosition += 6;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  data.strengths.forEach((strength) => {
    const lines = doc.splitTextToSize(`• ${strength}`, pageWidth - 2 * margin);
    doc.text(lines, margin + 3, yPosition);
    yPosition += lines.length * 4 + 1;
  });

  yPosition += 3;

  // Recommandations techniques
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Recommandations Techniques", margin, yPosition);
  yPosition += 6;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  data.recommendations.forEach((rec) => {
    const lines = doc.splitTextToSize(`• ${rec}`, pageWidth - 2 * margin);
    doc.text(lines, margin + 3, yPosition);
    yPosition += lines.length * 4 + 1;
  });

  // Ajouter une nouvelle page si nécessaire
  if (yPosition > pageHeight - 50) {
    doc.addPage();
    yPosition = 20;
  }

  yPosition += 5;

  // Synthèse stratégique
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Synthèse Stratégique", margin, yPosition);
  yPosition += 6;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const summaryLines = doc.splitTextToSize(data.summary, pageWidth - 2 * margin);
  doc.text(summaryLines, margin, yPosition);
  yPosition += summaryLines.length * 5 + 5;

  // Cadre juridique
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Cadre Juridique & Conformité", margin, yPosition);
  yPosition += 6;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  const legalLines = doc.splitTextToSize(data.legalFramework, pageWidth - 2 * margin);
  doc.text(legalLines, margin, yPosition);

  // Footer avec signature
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Signature Officielle", margin, pageHeight - 25);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Aureol DONFACK", margin, pageHeight - 18);

  doc.setFontSize(8);
  doc.text("PDG - 3M Travel & Services", margin, pageHeight - 13);

  doc.setTextColor(153, 153, 153); // #999999
  doc.text(`Généré le: ${new Date().toLocaleString("fr-FR")}`, margin, pageHeight - 8);

  return doc;
}
