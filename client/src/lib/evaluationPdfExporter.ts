import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable';

export interface EvaluationResult {
  candidateName: string;
  email: string;
  evaluationType: 'luxembourg' | 'study_visa' | 'general';
  country?: string;
  totalScore: number;
  verdict: string;
  breakdown: {
    academic?: number;
    financial?: number;
    linguistic?: number;
    experience?: number;
  };
  recommendations: string[];
  alternatives: string[];
  requiredDocuments: string[];
  estimatedTimeline: string;
  estimatedCost: number;
  createdAt: Date;
}

export async function exportEvaluationToPDF(evaluation: EvaluationResult): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 15;

  // ===== HEADER =====
  doc.setFillColor(25, 55, 109); // Dark blue
  doc.rect(0, 0, pageWidth, 30, 'F');

  // Logo and title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('3M Travel & Services', 15, 12);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Visa & Immigration Simplifiés', 15, 20);

  // Date
  doc.setFontSize(9);
  doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - 40, 12);

  yPosition = 40;

  // ===== CANDIDATE INFO =====
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Informations du Candidat', 15, yPosition);

  yPosition += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nom: ${evaluation.candidateName}`, 15, yPosition);
  yPosition += 6;
  doc.text(`Email: ${evaluation.email}`, 15, yPosition);
  yPosition += 6;
  if (evaluation.country) {
    doc.text(`Destination: ${evaluation.country}`, 15, yPosition);
    yPosition += 6;
  }
  doc.text(`Type d'évaluation: ${evaluation.evaluationType === 'luxembourg' ? 'Luxembourg' : evaluation.evaluationType === 'study_visa' ? 'Visa Études' : 'Évaluation Générale'}`, 15, yPosition);

  yPosition += 12;

  // ===== SCORE SECTION =====
  doc.setFillColor(240, 240, 240);
  doc.rect(15, yPosition - 5, pageWidth - 30, 25, 'F');

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Score d\'Éligibilité', 15, yPosition);

  yPosition += 8;
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(25, 118, 210); // Blue
  doc.text(`${evaluation.totalScore}/100`, 20, yPosition);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Verdict: ${evaluation.verdict}`, 70, yPosition);

  yPosition += 15;

  // ===== BREAKDOWN TABLE =====
  if (Object.keys(evaluation.breakdown).length > 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Détail du Scoring', 15, yPosition);

    yPosition += 6;
    const breakdownData: any[] = [];
    if (evaluation.breakdown.academic) breakdownData.push(['Académique', `${evaluation.breakdown.academic}/30`]);
    if (evaluation.breakdown.financial) breakdownData.push(['Financier', `${evaluation.breakdown.financial}/25`]);
    if (evaluation.breakdown.linguistic) breakdownData.push(['Linguistique', `${evaluation.breakdown.linguistic}/25`]);
    if (evaluation.breakdown.experience) breakdownData.push(['Expérience', `${evaluation.breakdown.experience}/20`]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Critère', 'Score']],
      body: breakdownData,
      theme: 'grid',
      headStyles: { fillColor: [25, 118, 210], textColor: 255, fontStyle: 'bold' },
      bodyStyles: { textColor: 0 },
      margin: { left: 15, right: 15 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // ===== RECOMMENDATIONS =====
  if (evaluation.recommendations.length > 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Recommandations', 15, yPosition);

    yPosition += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    evaluation.recommendations.forEach((rec, index) => {
      const lines = doc.splitTextToSize(`• ${rec}`, pageWidth - 30);
      doc.text(lines, 15, yPosition);
      yPosition += lines.length * 5 + 2;

      // Check if we need a new page
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = 15;
      }
    });

    yPosition += 5;
  }

  // ===== ALTERNATIVES =====
  if (evaluation.alternatives.length > 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Destinations Alternatives', 15, yPosition);

    yPosition += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    evaluation.alternatives.forEach((alt, index) => {
      const lines = doc.splitTextToSize(`• ${alt}`, pageWidth - 30);
      doc.text(lines, 15, yPosition);
      yPosition += lines.length * 5 + 2;

      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = 15;
      }
    });

    yPosition += 5;
  }

  // ===== REQUIRED DOCUMENTS =====
  if (evaluation.requiredDocuments.length > 0 && yPosition < pageHeight - 40) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Documents Requis', 15, yPosition);

    yPosition += 6;
    const docsData = evaluation.requiredDocuments.map(doc => [doc]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Document']],
      body: docsData,
      theme: 'grid',
      headStyles: { fillColor: [25, 118, 210], textColor: 255, fontStyle: 'bold' },
      bodyStyles: { textColor: 0 },
      margin: { left: 15, right: 15 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // ===== TIMELINE AND COST =====
  if (yPosition < pageHeight - 30) {
    const timelineCostData = [
      ['Timeline Estimé', evaluation.estimatedTimeline],
      ['Coût Estimé', `$${evaluation.estimatedCost.toLocaleString()}`],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [['Élément', 'Détail']],
      body: timelineCostData,
      theme: 'grid',
      headStyles: { fillColor: [25, 118, 210], textColor: 255, fontStyle: 'bold' },
      bodyStyles: { textColor: 0 },
      margin: { left: 15, right: 15 },
    });
  }

  // ===== FOOTER =====
  const totalPages = (doc as any).internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${i} / ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.text(
      '© 2026 3M Travel & Services - Tous droits réservés',
      pageWidth / 2,
      pageHeight - 5,
      { align: 'center' }
    );
  }

  // ===== DOWNLOAD =====
  const filename = `evaluation_${evaluation.candidateName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
