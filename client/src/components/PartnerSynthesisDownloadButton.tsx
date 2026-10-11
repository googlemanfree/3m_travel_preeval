import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { renderSynthesisPdf, synthesisPdfFileName } from "@/lib/synthesisPdf";

type Props = {
  sessionToken: string;
  submissionId: number;
  language?: "fr" | "en";
};

/** Téléchargement de la fiche validée — employeur ou agence de placement. */
export default function PartnerSynthesisDownloadButton({ sessionToken, submissionId, language = "fr" }: Props) {
  const [busy, setBusy] = useState(false);
  const availability = trpc.candidateSynthesis.partnerAvailability.useQuery(
    { sessionToken, submissionId },
    { enabled: Boolean(sessionToken && submissionId), retry: false },
  );
  const fetchValidated = trpc.candidateSynthesis.partnerGetValidated.useMutation();

  if (availability.isLoading) {
    return (
      <Button type="button" size="sm" variant="outline" disabled className="w-full">
        <Loader2 className="h-4 w-4 animate-spin" />
        {language === "en" ? "Checking summary…" : "Vérification fiche…"}
      </Button>
    );
  }

  if (!availability.data?.available) {
    return (
      <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500" data-testid="partner-synthesis-unavailable">
        {language === "en"
          ? "No validated one-page summary available yet."
          : "Aucune fiche de synthèse validée pour ce profil."}
      </p>
    );
  }

  const download = async () => {
    setBusy(true);
    try {
      const payload = await fetchValidated.mutateAsync({ sessionToken, submissionId });
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ unit: "mm", format: "a4" });
      let portraitDataUrl: string | null = null;
      if (payload.portraitUrl) {
        try {
          const response = await fetch(payload.portraitUrl);
          const blob = await response.blob();
          portraitDataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || null));
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
          });
        } catch {
          portraitDataUrl = null;
        }
      }
      renderSynthesisPdf(pdf, {
        content: payload.content,
        portraitDataUrl,
        profileCode: payload.profileCode,
      });
      pdf.save(synthesisPdfFileName(payload.content.displayFirstName, payload.content.displayLastInitial));
      toast.success(language === "en" ? "Summary downloaded" : "Fiche téléchargée");
    } catch (error) {
      toast.error(language === "en" ? "Download unavailable" : "Téléchargement impossible", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      type="button"
      size="sm"
      className="w-full bg-indigo-700 hover:bg-indigo-800"
      disabled={busy || fetchValidated.isPending}
      onClick={() => void download()}
      data-testid="partner-synthesis-download"
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      {language === "en" ? "Download summary (PDF)" : "Télécharger la synthèse (PDF)"}
      {availability.data.displayName ? ` · ${availability.data.displayName}` : ""}
    </Button>
  );
}
