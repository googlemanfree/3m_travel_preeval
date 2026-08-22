import jsPDF from 'jspdf';

export interface EvaluationResult {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  education: number;
  experience: number;
  frenchLevel: number;
  englishLevel: number;
  sector: number;
  totalScore: number;
  eligibilityStatus: string;
  recommendations: string[];
}

export function generateEvaluationPDF(result: EvaluationResult): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Header
  doc.setFillColor(102, 126, 234); // Blue
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text('🇱🇺 Rapport d\'Évaluation Luxembourg', pageWidth / 2, 15, { align: 'center' });
  doc.setFontSize(10);
  doc.text('3M Travel & Services SARL', pageWidth / 2, 25, { align: 'center' });

  yPosition = 50;

  // Candidate Info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Informations du Candidat', 20, yPosition);
  yPosition += 10;

  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.text(`Nom : ${result.lastName}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Prénom : ${result.firstName}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Email : ${result.email}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Téléphone : ${result.phone}`, 20, yPosition);
  yPosition += 12;

  // Score Section
  doc.setFont(undefined, 'bold');
  doc.setFontSize(12);
  doc.text('Score d\'Éligibilité', 20, yPosition);
  yPosition += 10;

  // Score Box
  doc.setFillColor(240, 240, 240);
  doc.rect(20, yPosition, pageWidth - 40, 30, 'F');

  doc.setFont(undefined, 'bold');
  doc.setFontSize(32);
  doc.setTextColor(102, 126, 234);
  doc.text(`${result.totalScore}/100`, 50, yPosition + 22, { align: 'center' });

  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  const statusColor = getStatusColor(result.eligibilityStatus);
  doc.setTextColor(...statusColor);
  doc.text(result.eligibilityStatus, 120, yPosition + 22, { align: 'center' });

  yPosition += 40;

  // Breakdown
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'bold');
  doc.setFontSize(11);
  doc.text('Détail des Points', 20, yPosition);
  yPosition += 8;

  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  const breakdownData = [
    [`Formation Académique`, `${result.education} pts`],
    [`Expérience Professionnelle`, `${result.experience} pts`],
    [`Français`, `${result.frenchLevel} pts`],
    [`Anglais`, `${result.englishLevel} pts`],
    [`Secteur Professionnel`, `${result.sector} pts`],
  ];

  breakdownData.forEach((row, index) => {
    if (index % 2 === 0) {
      doc.setFillColor(245, 245, 245);
      doc.rect(20, yPosition - 3, pageWidth - 40, 6, 'F');
    }
    doc.text(row[0], 25, yPosition);
    doc.text(row[1], pageWidth - 30, yPosition, { align: 'right' });
    yPosition += 6;
  });

  yPosition += 5;

  // Eligibility Criteria
  doc.setFont(undefined, 'bold');
  doc.setFontSize(11);
  doc.text('Critères d\'Éligibilité', 20, yPosition);
  yPosition += 8;

  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  const criteria = [
    { label: '✅✅✅ Très Éligible', range: '80-100 points', description: 'Excellent profil pour le Luxembourg' },
    { label: '✅✅ Éligible', range: '70-79 points', description: 'Bon profil, admission probable' },
    { label: '🟡 Modérément Éligible', range: '60-69 points', description: 'Profil acceptable, amélioration recommandée' },
    { label: '🔴 Non-Éligible', range: '<60 points', description: 'Profil insuffisant, destinations alternatives proposées' },
  ];

  criteria.forEach((item) => {
    doc.setFont(undefined, 'bold');
    doc.text(item.label, 25, yPosition);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    doc.text(`(${item.range})`, 80, yPosition);
    doc.setFontSize(9);
    doc.text(item.description, 25, yPosition + 4);
    yPosition += 10;
  });

  // Check if we need a new page
  if (yPosition > pageHeight - 40) {
    doc.addPage();
    yPosition = 20;
  }

  // Recommendations
  doc.setFont(undefined, 'bold');
  doc.setFontSize(11);
  doc.text('Recommandations Personnalisées', 20, yPosition);
  yPosition += 8;

  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  result.recommendations.forEach((rec, index) => {
    const lines = doc.splitTextToSize(`${index + 1}. ${rec}`, pageWidth - 40);
    lines.forEach((line: string) => {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, 25, yPosition);
      yPosition += 5;
    });
    yPosition += 2;
  });

  yPosition += 5;

  // Next Steps
  if (yPosition > pageHeight - 40) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFont(undefined, 'bold');
  doc.setFillColor(255, 193, 7); // Amber
  doc.rect(20, yPosition, pageWidth - 40, 8, 'F');
  doc.setTextColor(0, 0, 0);
  doc.text('Prochaines Étapes', 25, yPosition + 5);
  yPosition += 12;

  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  const nextSteps = [
    '1. Contactez notre équipe via WhatsApp pour discuter de votre profil',
    '2. Préparez vos documents (diplômes, certificats de travail, tests de langue)',
    '3. Ouvrez votre dossier (frais : 65 000 FCFA)',
    '4. Soumettez vos documents pour vérification',
    '5. Recevez votre rapport d\'admissibilité complet',
  ];

  nextSteps.forEach((step) => {
    if (yPosition > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
    }
    doc.text(step, 25, yPosition);
    yPosition += 6;
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(
    `3M Travel & Services SARL | +1 672 897 2999 | www.3mtravelagency.click`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  // Download
  const fileName = `Evaluation_Luxembourg_${result.lastName}_${result.firstName}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

function getStatusColor(status: string): [number, number, number] {
  if (status.includes('Très Éligible')) return [34, 197, 94]; // Green
  if (status.includes('Éligible')) return [59, 130, 246]; // Blue
  if (status.includes('Modérément')) return [251, 191, 36]; // Amber
  return [239, 68, 68]; // Red
}
