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
  nextSteps: string[];
  estimatedTimeline: string;
  estimatedCost: number;
  createdAt: Date;
  logoUrl?: string;
}

export async function exportEvaluationToPDF(evaluation: EvaluationResult): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // ===== HEADER WITH LOGO =====
  doc.setFillColor(25, 55, 109); // Dark blue
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Logo circle badge
  doc.setFillColor(255, 255, 255);
  doc.circle(20, 20, 7, 'F');
  doc.setDrawColor(25, 55, 109);
  doc.setLineWidth(1);
  doc.circle(20, 20, 7, 'S');
  
  // Logo text inside circle
  doc.setTextColor(25, 55, 109);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('3M', 20, 22, { align: 'center' });

  // Title and subtitle
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('3M Travel & Services', 32, 14);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Visa & Immigration Simplifiés', 32, 22);

  // Date and report reference
  doc.setFontSize(8);
  doc.setTextColor(200, 200, 200);
  doc.text(`Rapport d'Évaluation - ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - 15, 14, { align: 'right' });
  doc.text(`Réf: ${new Date().getTime()}`, pageWidth - 15, 20, { align: 'right' });

  yPosition = 50;

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

  // ===== NEXT STEPS SECTION =====
  if (evaluation.nextSteps && evaluation.nextSteps.length > 0 && yPosition < pageHeight - 60) {
    doc.setFillColor(240, 248, 255); // Light blue
    doc.rect(15, yPosition - 5, pageWidth - 30, 5, 'F');
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(25, 118, 210);
    doc.text('🎯 Prochaines Étapes Recommandées', 15, yPosition);

    yPosition += 8;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    evaluation.nextSteps.forEach((step, index) => {
      const lines = doc.splitTextToSize(`${index + 1}. ${step}`, pageWidth - 30);
      doc.text(lines, 15, yPosition);
      yPosition += lines.length * 5 + 3;

      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 15;
      }
    });

    yPosition += 8;
  }

  // ===== RECOMMENDATIONS =====
  if (evaluation.recommendations.length > 0 && yPosition < pageHeight - 50) {
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

      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 15;
      }
    });

    yPosition += 5;
  }

  // ===== ALTERNATIVES =====
  if (evaluation.alternatives.length > 0 && yPosition < pageHeight - 50) {
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

      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 15;
      }
    });

    yPosition += 5;
  }

  // ===== REQUIRED DOCUMENTS =====
  if (evaluation.requiredDocuments.length > 0 && yPosition < pageHeight - 50) {
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
  if (yPosition < pageHeight - 50) {
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

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // ===== CONTACT SECTION =====
  if (yPosition < pageHeight - 30) {
    doc.setFillColor(245, 245, 245);
    doc.rect(15, yPosition, pageWidth - 30, 20, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(25, 55, 109);
    doc.text('📞 Besoin d\'aide ?', 15, yPosition + 5);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('Email: contact@3mtravelagency.com', 15, yPosition + 10);
    doc.text('WhatsApp: +237 6XX XXX XXX | Web: www.3mtravelagency.com', 15, yPosition + 15);
  }

  // ===== FOOTER =====
  const totalPages = (doc as any).internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Separator line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
    
    // Footer text
    doc.setFontSize(7);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${i} / ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.text(
      '© 2026 3M Travel & Services - Tous droits réservés | Confidentiel',
      pageWidth / 2,
      pageHeight - 5,
      { align: 'center' }
    );
  }

  // ===== DOWNLOAD =====
  const filename = `evaluation_${evaluation.candidateName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
