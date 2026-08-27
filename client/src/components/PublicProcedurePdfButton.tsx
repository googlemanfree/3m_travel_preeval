import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { PublicDestinationDetail } from "@/lib/publicDestinationCatalog";
import { getPublicProcedurePdfFilename, getVerifiedPortalForPdf, type VerifiedPortalForPdf } from "@/lib/publicProcedurePdf";

type Props = {
  destination: PublicDestinationDetail;
  updatedAt: string;
  portal?: VerifiedPortalForPdf | null;
  language: "fr" | "en";
};

const pdfCopy = {
  fr: {
    title: "FICHE DE PROCÉDURE",
    information: "Information publique de préparation",
    overview: "Présentation",
    steps: "Étapes indicatives",
    documents: "Documents à préparer",
    portal: "Portail institutionnel vérifié",
    noPortal: "Portail institutionnel : à vérifier auprès de l’agence avant toute démarche.",
    notice: "Cette fiche est un repère d’information. Les exigences, décisions, délais et conditions applicables sont confirmés par les autorités et organismes compétents.",
    generated: "Généré le",
    updated: "Dernière vérification",
    success: "La fiche de procédure PDF a été téléchargée.",
    error: "Impossible de générer la fiche PDF pour le moment.",
    button: "Exporter la fiche PDF",
    exporting: "Préparation du PDF…",
  },
  en: {
    title: "PROCEDURE BRIEF",
    information: "Public preparation information",
    overview: "Overview",
    steps: "Indicative steps",
    documents: "Documents to prepare",
    portal: "Verified institutional portal",
    noPortal: "Institutional portal: confirm with the agency before taking any steps.",
    notice: "This brief is provided for information only. Requirements, decisions, timeframes and applicable conditions are confirmed by the relevant authorities and institutions.",
    generated: "Generated on",
    updated: "Last verification",
    success: "The procedure PDF brief has been downloaded.",
    error: "The PDF brief cannot be generated at the moment.",
    button: "Export PDF brief",
    exporting: "Preparing PDF…",
  },
} as const;

export function PublicProcedurePdfButton({ destination, updatedAt, portal, language }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const copy = pdfCopy[language];
  const country = destination.procedure;

  const handleExport = async () => {
    setIsGenerating(true);
    try {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ unit: "mm", format: "a4" });
      const pageHeight = 287;
      const left = 18;
      const contentWidth = 174;
      let cursorY = 20;
      const verifiedPortal = getVerifiedPortalForPdf(portal);

      const drawHeader = () => {
        pdf.setFillColor(6, 26, 54);
        pdf.rect(0, 0, 210, 28, "F");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(16);
        pdf.setTextColor(255, 255, 255);
        pdf.text("3M Travel & Services", left, 13);
        pdf.setFontSize(10);
        pdf.text(copy.title, left, 20);
        pdf.setDrawColor(244, 185, 66);
        pdf.setLineWidth(1.1);
        pdf.line(left, 29, 192, 29);
        cursorY = 40;
      };

      const nextPageIfNeeded = (lineCount: number) => {
        if (cursorY + lineCount * 5 + 12 <= pageHeight) return;
        pdf.addPage();
        drawHeader();
      };

      const addParagraph = (value: string, indent = 0) => {
        const lines = pdf.splitTextToSize(value.replace(/[\r\n]+/g, " "), contentWidth - indent);
        nextPageIfNeeded(lines.length);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10.5);
        pdf.setTextColor(35, 48, 64);
        pdf.text(lines, left + indent, cursorY);
        cursorY += lines.length * 5 + 4;
      };

      const addHeading = (value: string) => {
        nextPageIfNeeded(3);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.setTextColor(11, 47, 112);
        pdf.text(value, left, cursorY);
        cursorY += 8;
      };

      drawHeader();
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(22);
      pdf.setTextColor(6, 26, 54);
      pdf.text(country.name, left, cursorY);
      cursorY += 9;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10.5);
      pdf.setTextColor(65, 77, 93);
      pdf.text(`${copy.information} · ${country.visaType}`, left, cursorY);
      cursorY += 7;
      pdf.text(`${copy.updated}: ${updatedAt}`, left, cursorY);
      cursorY += 10;

      addHeading(copy.overview);
      addParagraph(country.description);
      addParagraph(country.detailedDescription);

      addHeading(copy.steps);
      country.steps.forEach((step, index) => addParagraph(`${index + 1}. ${step}`));

      addHeading(copy.documents);
      country.requiredDocuments.forEach((category) => {
        addParagraph(category.category);
        category.documents.forEach((document) => addParagraph(`• ${document}`, 4));
      });

      addHeading(copy.portal);
      addParagraph(verifiedPortal ? `${verifiedPortal.label}: ${verifiedPortal.url}` : copy.noPortal);

      addHeading("Important");
      addParagraph(copy.notice);
      addParagraph(`${copy.generated}: ${new Date().toLocaleDateString(language === "fr" ? "fr-FR" : "en-CA")}.`);
      pdf.save(getPublicProcedurePdfFilename(country.id, country.name));
      toast.success(copy.success);
    } catch (error) {
      console.error("Public procedure PDF export failed", error);
      toast.error(copy.error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button type="button" variant="outline" onClick={handleExport} disabled={isGenerating} className="w-full border-white/30 bg-white/10 px-6 py-3 font-bold text-white hover:bg-white/20">
      {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="mr-2 h-4 w-4" aria-hidden="true" />}
      {isGenerating ? copy.exporting : copy.button}
    </Button>
  );
}
