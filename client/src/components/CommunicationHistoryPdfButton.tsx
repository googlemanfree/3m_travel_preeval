import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { buildCommunicationHistoryEntries, type CommunicationHistoryMessage, type CommunicationHistoryNotification } from "@/lib/communicationHistoryPdf";

type Props = {
  sessionToken: string;
  candidateId: string;
  candidateName: string;
  folderCode: string;
  messages: CommunicationHistoryMessage[];
  notifications: CommunicationHistoryNotification[];
};

export function CommunicationHistoryPdfButton({ sessionToken, candidateId, candidateName, folderCode, messages, notifications }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const exportMutation = trpc.admin.recordCandidate360CommunicationExport.useMutation();

  const generate = async () => {
    setIsGenerating(true);
    try {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ unit: "mm", format: "a4" });
      const entries = buildCommunicationHistoryEntries(messages, notifications);
      let y = 38;
      const drawHeader = () => {
        pdf.setFillColor(15, 48, 95); pdf.rect(0, 0, 210, 26, "F");
        pdf.setTextColor(255, 255, 255); pdf.setFont("helvetica", "bold"); pdf.setFontSize(14); pdf.text("3M Travel & Services — Historique de communication", 14, 16);
        pdf.setTextColor(31, 41, 55); pdf.setFontSize(8); pdf.setFont("helvetica", "normal");
        pdf.text("DOCUMENT INTERNE CONFIDENTIEL — Traçabilité administrative", 105, 289, { align: "center" });
        pdf.setTextColor(224, 231, 255); pdf.setFontSize(26); pdf.text("3M TRAVEL", 105, 145, { align: "center", angle: 45 });
        pdf.setTextColor(31, 41, 55);
      };
      const nextPage = () => { pdf.addPage(); y = 22; drawHeader(); y = 38; };
      drawHeader();
      pdf.setFont("helvetica", "bold"); pdf.setFontSize(11); pdf.text(candidateName, 14, y); y += 6;
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(9); pdf.text(`Dossier : ${folderCode} · Exporté le ${new Date().toLocaleString("fr-FR")}`, 14, y); y += 10;
      if (!entries.length) { pdf.text("Aucune communication ni notification enregistrée.", 14, y); }
      for (const entry of entries) {
        const title = `${formatDateForPdf(entry.createdAt)} — ${entry.title}`;
        const contentLines = pdf.splitTextToSize(entry.content, 178) as string[];
        const titleHeight = 6;
        const contentHeight = Math.max(contentLines.length, 1) * 4.4;
        if (y + titleHeight + contentHeight + 8 > 280) nextPage();
        pdf.setFillColor(239, 246, 255); pdf.roundedRect(12, y - 4, 186, titleHeight + contentHeight + 6, 2, 2, "F");
        pdf.setFont("helvetica", "bold"); pdf.setFontSize(9); pdf.text(title, 16, y); y += 5;
        pdf.setFont("helvetica", "normal"); pdf.setFontSize(8.5); pdf.text(contentLines, 16, y); y += contentHeight + 8;
      }
      pdf.save(`historique-communications-${folderCode}.pdf`);
      await exportMutation.mutateAsync({ sessionToken, candidateId });
      toast.success("Historique PDF téléchargé", { description: "La génération est enregistrée dans le journal du dossier." });
    } catch (error: any) {
      toast.error("Export PDF impossible", { description: error.message || "Veuillez réessayer." });
    } finally {
      setIsGenerating(false);
    }
  };

  return <Button variant="outline" size="sm" onClick={generate} disabled={isGenerating}><Download className="mr-2 h-4 w-4" />{isGenerating ? "Préparation…" : "Exporter l’historique PDF"}</Button>;
}

function formatDateForPdf(value: Date | string) {
  return new Date(value).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}
