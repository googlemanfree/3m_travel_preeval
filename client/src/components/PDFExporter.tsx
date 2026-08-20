import React, { useState } from "react";
import { Download, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface PDFExporterProps {
  candidate: {
    fullName: string;
    email: string;
    phone: string;
    destination: string;
    visaType: string;
    scoringTotal: number;
    scoringBadge: "excellent" | "bon" | "moyen" | "faible";
    status: string;
    paymentStatus: string;
    createdAt: string;
    applicationNumber: string;
  };
  aiSummary?: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    overallAssessment: string;
  };
  interviewQuestions?: Array<{
    id: number;
    question: string;
    category: "strength" | "development" | "motivation";
    icon: string;
  }>;
}

export function PDFExporter({ candidate, aiSummary, interviewQuestions }: PDFExporterProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState("");

  const exportToPDF = async () => {
    setIsExporting(true);
    setExportProgress(15);
    setExportStatus("Préparation de l’export PDF…");

    try {
      setExportProgress(35);
      setExportStatus("Chargement des dépendances PDF…");
      const { default: JsPDF } = await import("jspdf");
      setExportProgress(60);
      setExportStatus("Génération du document PDF…");
      // Create a new PDF document only when the user requests an export.
      const pdf = new JsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      let yPosition = 20;
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const maxWidth = pdf.internal.pageSize.getWidth() - 2 * margin;

      // Helper function to add text with word wrapping
      const addText = (text: string, fontSize: number, isBold: boolean = false, color: [number, number, number] = [0, 0, 0]) => {
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
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }
      };

      // Helper function to add a section
      const addSection = (title: string) => {
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.setDrawColor(59, 130, 246); // Blue color
        pdf.setLineWidth(0.5);
        pdf.line(margin, yPosition + 5, margin + maxWidth, yPosition + 5);
        addText(title, 14, true, [59, 130, 246]);
      };

      // Header
      addText("3M TRAVEL AGENCY", 16, true, [25, 55, 109]);
      addText("Profil Candidat Complet", 12, true);
      addText(`Généré le ${new Date().toLocaleDateString("fr-FR")}`, 9, false, [100, 100, 100]);
      yPosition += 5;

      // ─── INFORMATIONS PERSONNELLES ───
      addSection("Informations Personnelles");
      addText(`Nom: ${candidate.fullName}`, 11);
      addText(`Email: ${candidate.email}`, 11);
      addText(`Téléphone: ${candidate.phone}`, 11);
      addText(`Numéro de dossier: ${candidate.applicationNumber}`, 11);
      yPosition += 3;

      // ─── INFORMATIONS DE CANDIDATURE ───
      addSection("Informations de Candidature");
      addText(`Destination: ${candidate.destination}`, 11);
      addText(`Type de visa: ${candidate.visaType}`, 11);
      addText(`Statut: ${candidate.status}`, 11);
      addText(`Paiement: ${candidate.paymentStatus}`, 11);
      addText(`Date de création: ${new Date(candidate.createdAt).toLocaleDateString("fr-FR")}`, 11);
      yPosition += 3;

      // ─── SCORE ET ÉVALUATION ───
      addSection("Score et Évaluation");
      addText(`Score total: ${candidate.scoringTotal}/100`, 11);
      addText(`Évaluation: ${candidate.scoringBadge.toUpperCase()}`, 11, true, [76, 175, 80]);
      yPosition += 3;

      // ─── RÉSUMÉ DU PROFIL ───
      if (aiSummary) {
        addSection("Résumé du profil");

        if (aiSummary.overallAssessment) {
          addText("Évaluation Générale:", 11, true);
          addText(aiSummary.overallAssessment, 10);
          yPosition += 2;
        }

        if (aiSummary.strengths.length > 0) {
          addText("Points Forts:", 11, true, [76, 175, 80]);
          aiSummary.strengths.forEach((strength) => {
            addText(`• ${strength}`, 10);
          });
          yPosition += 2;
        }

        if (aiSummary.weaknesses.length > 0) {
          addText("Points à Améliorer:", 11, true, [244, 67, 54]);
          aiSummary.weaknesses.forEach((weakness) => {
            addText(`• ${weakness}`, 10);
          });
          yPosition += 2;
        }

        if (aiSummary.recommendations.length > 0) {
          addText("Recommandations:", 11, true, [33, 150, 243]);
          aiSummary.recommendations.forEach((rec, index) => {
            addText(`${index + 1}. ${rec}`, 10);
          });
          yPosition += 2;
        }
      }

      // ─── QUESTIONS D'ENTRETIEN ───
      if (interviewQuestions && interviewQuestions.length > 0) {
        addSection("Questions d’entretien proposées");

        interviewQuestions.forEach((q, index) => {
          const categoryLabel = {
            strength: "Basée sur les forces",
            development: "Amélioration continue",
            motivation: "Motivation & Projet",
          }[q.category];

          addText(`Question ${index + 1} - ${categoryLabel}:`, 11, true);
          addText(q.question, 10);
          yPosition += 2;
        });
      }

      // ─── FOOTER ───
      yPosition = pageHeight - 15;
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`© 2026 3M Travel Agency | Candidat: ${candidate.fullName}`, margin, yPosition);

      // Save the PDF
      setExportProgress(85);
      setExportStatus("Téléchargement du document PDF…");
      pdf.save(`Profil_${candidate.fullName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`);
      setExportProgress(100);
      setExportStatus("Export PDF terminé");
      toast.success("Export PDF réussi", {
        description: "Votre document a été généré et téléchargé avec succès.",
      });
    } catch (error) {
      console.error("Erreur lors de l'export PDF", error);
      setExportStatus("L’export PDF a échoué");
      toast.error("Échec de l’export PDF", {
        description: "Veuillez réessayer ou contacter le support si le problème persiste.",
      });
    } finally {
      setIsExporting(false);
      window.setTimeout(() => {
        setExportProgress(0);
        setExportStatus("");
      }, 800);
    }
  };

  return (
    <div className="w-full space-y-2" aria-live="polite">
      <Button
        onClick={exportToPDF}
        disabled={isExporting}
        variant="outline"
        size="sm"
        className="h-12 w-full rounded-xl gap-2"
        aria-busy={isExporting}
        aria-label={isExporting ? "Export PDF en cours" : "Exporter le profil en PDF"}
      >
        {isExporting ? (
          <>
            <Loader className="w-4 h-4 animate-spin" aria-hidden="true" />
            Export en cours…
          </>
        ) : (
          <>
            <Download className="w-4 h-4" aria-hidden="true" />
            Exporter en PDF
          </>
        )}
      </Button>
      {isExporting && (
        <div className="space-y-1" role="status" aria-label={exportStatus}>
          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>{exportStatus}</span>
            <span>{exportProgress}%</span>
          </div>
          <Progress value={exportProgress} className="h-2" aria-label={`Progression de l’export PDF : ${exportProgress}%`} />
        </div>
      )}
    </div>
  );
}
