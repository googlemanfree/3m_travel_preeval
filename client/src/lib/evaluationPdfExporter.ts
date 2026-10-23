import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { applyLetterhead, letterheadLayout, serviceFocusLabel, type LetterheadOptions } from '@shared/brandLetterhead';
import { loadClientBrandLogo } from './brandLogo';

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
  let yPosition = 20;

  // ===== PAPIER À EN-TÊTE OFFICIEL =====
  const logo = await loadClientBrandLogo();
  const letterhead: LetterheadOptions = {
    logoDataUri: logo?.dataUri,
    logoFormat: logo?.format,
    documentKind: "Résultat d’évaluation",
    reference: `EVAL-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`,
    recipient: evaluation.candidateName,
    serviceFocus: serviceFocusLabel(evaluation.evaluationType === 'study_visa' ? 'études' : evaluation.evaluationType === 'luxembourg' ? 'visa' : '', evaluation.country),
  };
  const layout = letterheadLayout(letterhead);
  yPosition = layout.firstPageTop + 2;
  // Aucune section n'est plus ignorée faute de place : on passe à la page suivante.
  const ensureSpace = (needed: number) => {
    if (yPosition + needed > layout.contentBottom) {
      doc.addPage();
      yPosition = layout.nextPageTop;
    }
  };

  // ===== CANDIDATE INFO =====
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Informations du Candidat', 18, yPosition);

  yPosition += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nom: ${evaluation.candidateName}`, 18, yPosition);
  yPosition += 6;
  doc.text(`Email: ${evaluation.email}`, 18, yPosition);
  yPosition += 6;
  if (evaluation.country) {
    doc.text(`Destination: ${evaluation.country}`, 18, yPosition);
    yPosition += 6;
  }
  doc.text(`Type d'évaluation: ${evaluation.evaluationType === 'luxembourg' ? 'Luxembourg' : evaluation.evaluationType === 'study_visa' ? 'Visa Études' : 'Évaluation Générale'}`, 18, yPosition);

  yPosition += 12;

  // ===== SCORE SECTION =====
  doc.setFillColor(240, 240, 240);
  doc.rect(18, yPosition - 5, 174, 25, 'F');

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Score d\'Éligibilité', 18, yPosition);

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
    doc.text('Détail du Scoring', 18, yPosition);

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
      margin: { left: 18, right: 18, top: layout.nextPageTop, bottom: 40 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // ===== NEXT STEPS SECTION =====
  if (evaluation.nextSteps && evaluation.nextSteps.length > 0) {
    ensureSpace(40);
    doc.setFillColor(240, 248, 255); // Light blue
    doc.rect(18, yPosition - 5, 174, 5, 'F');
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(25, 118, 210);
    doc.text('Prochaines Étapes Recommandées', 18, yPosition);

    yPosition += 8;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    evaluation.nextSteps.forEach((step, index) => {
      const lines = doc.splitTextToSize(`${index + 1}. ${step}`, 174);
      doc.text(lines, 18, yPosition);
      yPosition += lines.length * 5 + 3;

      if (yPosition > layout.contentBottom - 8) {
        doc.addPage();
        yPosition = layout.nextPageTop;
      }
    });

    yPosition += 8;
  }

  // ===== RECOMMENDATIONS =====
  if (evaluation.recommendations.length > 0) {
    ensureSpace(40);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Recommandations', 18, yPosition);

    yPosition += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    evaluation.recommendations.forEach((rec, index) => {
      const lines = doc.splitTextToSize(`• ${rec}`, 174);
      doc.text(lines, 18, yPosition);
      yPosition += lines.length * 5 + 2;

      if (yPosition > layout.contentBottom - 8) {
        doc.addPage();
        yPosition = layout.nextPageTop;
      }
    });

    yPosition += 5;
  }

  // ===== ALTERNATIVES =====
  if (evaluation.alternatives.length > 0) {
    ensureSpace(40);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Destinations Alternatives', 18, yPosition);

    yPosition += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    evaluation.alternatives.forEach((alt, index) => {
      const lines = doc.splitTextToSize(`• ${alt}`, 174);
      doc.text(lines, 18, yPosition);
      yPosition += lines.length * 5 + 2;

      if (yPosition > layout.contentBottom - 8) {
        doc.addPage();
        yPosition = layout.nextPageTop;
      }
    });

    yPosition += 5;
  }

  // ===== REQUIRED DOCUMENTS =====
  if (evaluation.requiredDocuments.length > 0) {
    ensureSpace(40);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Documents Requis', 18, yPosition);

    yPosition += 6;
    const docsData = evaluation.requiredDocuments.map(doc => [doc]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Document']],
      body: docsData,
      theme: 'grid',
      headStyles: { fillColor: [25, 118, 210], textColor: 255, fontStyle: 'bold' },
      bodyStyles: { textColor: 0 },
      margin: { left: 18, right: 18, top: layout.nextPageTop, bottom: 40 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // ===== TIMELINE AND COST =====
  {
    ensureSpace(40);
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
      margin: { left: 18, right: 18, top: layout.nextPageTop, bottom: 40 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  applyLetterhead(doc, letterhead);

  // ===== DOWNLOAD =====
  const filename = `evaluation_${evaluation.candidateName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
