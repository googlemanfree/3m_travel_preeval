import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type ReceiptDocument = {
  id: number;
  documentName: string;
  documentType: string;
  createdAt: Date | string;
};

function escapePdfText(value: string): string {
  return value.replace(/[\\()\r\n]/g, (character) => ({ "\\": "\\\\", "(": "\\(", ")": "\\)", "\r": " ", "\n": " " }[character] ?? " "));
}

export default function DocumentReceiptButton({
  document,
  candidateName,
  candidateEmail,
  dossierNumber,
}: {
  document: ReceiptDocument;
  candidateName: string;
  candidateEmail: string;
  dossierNumber?: string | null;
}) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ unit: "mm", format: "a4" });
      const receiptNumber = `REC-${document.id}-${new Date(document.createdAt).getTime()}`;
      const date = new Date(document.createdAt).toLocaleDateString("fr-FR");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.setTextColor(10, 37, 64);
      pdf.text("3M Travel Agency", 105, 24, { align: "center" });
      pdf.setFontSize(14);
      pdf.text("DÉCHARGE DE REMISE DE DOCUMENT", 105, 40, { align: "center" });
      pdf.setDrawColor(255, 152, 0);
      pdf.line(20, 48, 190, 48);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor(40, 40, 40);
      const lines = [
        `Numéro de reçu : ${receiptNumber}`,
        `Date de remise : ${date}`,
        `Numéro de dossier : ${dossierNumber || "Non renseigné"}`,
        `Candidat : ${candidateName}`,
        `E-mail : ${candidateEmail}`,
        `Document : ${document.documentName}`,
        `Catégorie : ${document.documentType.replaceAll("_", " ")}`,
      ];
      lines.forEach((line, index) => pdf.text(escapePdfText(line), 25, 68 + index * 10));
      pdf.setFontSize(10);
      pdf.text("Ce document confirme la remise numérique de la pièce au dossier du candidat.", 25, 155, { maxWidth: 160 });
      pdf.text("La pièce reste conservée dans l’espace sécurisé de 3M Travel Agency.", 25, 168, { maxWidth: 160 });
      pdf.line(35, 220, 95, 220);
      pdf.line(115, 220, 175, 220);
      pdf.setFontSize(9);
      pdf.text("Signature du candidat", 65, 228, { align: "center" });
      pdf.text("Signature de l’agence", 145, 228, { align: "center" });
      pdf.save(`${receiptNumber}.pdf`);
      toast.success("La décharge PDF a été téléchargée.");
    } catch (error) {
      console.error("Document receipt export failed", error);
      toast.error("Impossible de générer la décharge PDF.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={handleDownload} disabled={isGenerating} aria-label={`Télécharger la décharge de ${document.documentName}`}>
      {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
      Décharge PDF
    </Button>
  );
}
