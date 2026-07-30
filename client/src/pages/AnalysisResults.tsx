import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';

interface AnalysisResult {
  score: number;
  verdict: 'Très Favorable' | 'Favorable sous réserve' | 'Risqué / À renforcer';
  cvAnalysis: {
    detectedDegree: string;
    totalExperienceYears: string;
    keySkills: string[];
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  candidateName: string;
  destinationCountry: string;
  projectType: string;
}

interface AnalysisResultsProps {
  result: AnalysisResult;
  onNewEvaluation: () => void;
}

export default function AnalysisResults({ result, onNewEvaluation }: AnalysisResultsProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'Très Favorable':
        return 'from-green-500 to-emerald-600';
      case 'Favorable sous réserve':
        return 'from-yellow-500 to-orange-600';
      case 'Risqué / À renforcer':
        return 'from-red-500 to-rose-600';
      default:
        return 'from-blue-500 to-indigo-600';
    }
  };

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case 'Très Favorable':
        return '✅';
      case 'Favorable sous réserve':
        return '⚠️';
      case 'Risqué / À renforcer':
        return '❌';
      default:
        return '📋';
    }
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;

      // Header
      doc.setFillColor(10, 37, 64);
      doc.rect(0, 0, pageWidth, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.text('3M Travel & Services', pageWidth / 2, 15, { align: 'center' });
      doc.setFontSize(12);
      doc.text('Rapport d\'Analyse IA du CV', pageWidth / 2, 30, { align: 'center' });

      yPosition = 50;

      // Candidate Info
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Informations du Candidat', 20, yPosition);
      yPosition += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Nom: ${result.candidateName}`, 20, yPosition);
      yPosition += 6;
      doc.text(`Pays de Destination: ${result.destinationCountry}`, 20, yPosition);
      yPosition += 6;
      doc.text(`Type de Projet: ${result.projectType}`, 20, yPosition);
      yPosition += 6;
      doc.text(`Date d'Analyse: ${new Date().toLocaleDateString('fr-FR')}`, 20, yPosition);
      yPosition += 12;

      // Score Section
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Score d\'Admissibilité', 20, yPosition);
      yPosition += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Score: ${result.score}/100`, 20, yPosition);
      yPosition += 6;
      doc.text(`Verdict: ${result.verdict}`, 20, yPosition);
      yPosition += 12;

      // CV Analysis
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Analyse du CV', 20, yPosition);
      yPosition += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Diplôme Détecté: ${result.cvAnalysis.detectedDegree}`, 20, yPosition);
      yPosition += 6;
      doc.text(`Expérience: ${result.cvAnalysis.totalExperienceYears}`, 20, yPosition);
      yPosition += 6;
      const skillsText = result.cvAnalysis.keySkills?.join(', ') || 'N/A';
      doc.text(`Compétences Clés: ${skillsText}`, 20, yPosition, { maxWidth: 170 });
      yPosition += 12;

      // Strengths
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Points Forts', 20, yPosition);
      yPosition += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      result.strengths?.forEach((strength) => {
        const lines = doc.splitTextToSize(`• ${strength || ''}`, 170) as string[];
        doc.text(lines, 20, yPosition);
        yPosition += lines.length * 5 + 2;
      });
      yPosition += 4;

      // Weaknesses
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Points à Améliorer', 20, yPosition);
      yPosition += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      result.weaknesses?.forEach((weakness) => {
        const lines = doc.splitTextToSize(`• ${weakness || ''}`, 170) as string[];
        doc.text(lines, 20, yPosition);
        yPosition += lines.length * 5 + 2;
      });
      yPosition += 4;

      // Recommendations
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Recommandations', 20, yPosition);
      yPosition += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      result.recommendations?.forEach((rec, index) => {
        const lines = doc.splitTextToSize(`${index + 1}. ${rec || ''}`, 170) as string[];
        doc.text(lines, 20, yPosition);
        yPosition += lines.length * 5 + 2;
      });

      // Footer
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.text(
        `© 2026 3M Travel & Services - Rapport généré le ${new Date().toLocaleString('fr-FR')}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );

      // Download
      doc.save(`Analyse_CV_${result.candidateName}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Erreur lors de la génération du PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-[#0a2540] mb-2">Résultats de l'Analyse</h1>
          <p className="text-gray-600">Votre évaluation IA du CV est prête</p>
        </motion.div>

        {/* Score Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`bg-gradient-to-r ${getVerdictColor(result.verdict)} rounded-2xl shadow-2xl p-8 mb-8 text-white`}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-lg opacity-90">Score d'Admissibilité</p>
              <h2 className="text-5xl font-bold">{result.score}/100</h2>
            </div>
            <div className="text-6xl">{getVerdictIcon(result.verdict)}</div>
          </div>
          <p className="text-lg font-semibold">{result.verdict}</p>
        </motion.div>

        {/* Candidate Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <h3 className="text-xl font-bold text-[#0a2540] mb-4">Informations</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600 text-sm">Candidat</p>
              <p className="font-semibold text-gray-900">{result.candidateName}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Destination</p>
              <p className="font-semibold text-gray-900">{result.destinationCountry}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Type de Projet</p>
              <p className="font-semibold text-gray-900">{result.projectType}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Date d'Analyse</p>
              <p className="font-semibold text-gray-900">{new Date().toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
        </motion.div>

        {/* CV Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <h3 className="text-xl font-bold text-[#0a2540] mb-4">Analyse du CV</h3>
          <div className="space-y-4">
            <div>
              <p className="text-gray-600 text-sm">Diplôme Détecté</p>
              <p className="font-semibold text-gray-900">{result.cvAnalysis.detectedDegree}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Expérience</p>
              <p className="font-semibold text-gray-900">{result.cvAnalysis.totalExperienceYears}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Compétences Clés</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {result.cvAnalysis.keySkills.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Strengths & Weaknesses */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h3 className="text-xl font-bold text-green-600 mb-4">✅ Points Forts</h3>
            <ul className="space-y-3">
              {result.strengths.map((strength, index) => (
                <li key={index} className="flex gap-3">
                  <span className="text-green-600 font-bold">•</span>
                  <span className="text-gray-700">{strength}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h3 className="text-xl font-bold text-red-600 mb-4">⚠️ Points à Améliorer</h3>
            <ul className="space-y-3">
              {result.weaknesses.map((weakness, index) => (
                <li key={index} className="flex gap-3">
                  <span className="text-red-600 font-bold">•</span>
                  <span className="text-gray-700">{weakness}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <h3 className="text-xl font-bold text-[#0a2540] mb-4">💡 Recommandations</h3>
          <ol className="space-y-3">
            {result.recommendations.map((rec, index) => (
              <li key={index} className="flex gap-3">
                <span className="font-bold text-blue-600 flex-shrink-0">{index + 1}.</span>
                <span className="text-gray-700">{rec}</span>
              </li>
            ))}
          </ol>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex gap-4 justify-center"
        >
          <Button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-8 py-3 rounded-lg transition-all"
          >
            {isDownloading ? '📥 Génération...' : '📥 Télécharger PDF'}
          </Button>

          <Button
            onClick={onNewEvaluation}
            variant="outline"
            className="border-2 border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold px-8 py-3 rounded-lg transition-all"
          >
            🔄 Nouvelle Évaluation
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
