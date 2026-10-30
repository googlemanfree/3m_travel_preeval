import { useEffect, useRef, useState } from "react";
import { FileText } from "lucide-react";
import { BilanDocumentActions } from "@/components/BilanDocumentActions";
import { ClientBilanDecision } from "@/components/ClientBilanDecision";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { clientSpacePolling } from "@/lib/clientSpaceSync";

/**
 * Le bilan d'évaluation que le conseiller a validé puis envoyé : exactement la mise en forme reçue par e-mail, dans l'espace du candidat.
 * Le HTML est affiché dans un cadre isolé (sandbox sans script) : un contenu collé ne peut ni exécuter de code ni toucher à la page.
 */
export function SentBilanViewer({ enabled = true }: { enabled?: boolean }) {
  const query = trpc.candidate.getMyEvaluationBilan.useQuery(undefined, { enabled, ...clientSpacePolling(), retry: 1 });
  const bilan = query.data;
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(640);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || !bilan) return;
    const resize = () => {
      const doc = frame.contentDocument;
      if (doc?.body) setHeight(Math.min(Math.max(doc.body.scrollHeight + 24, 360), 6000));
    };
    frame.addEventListener("load", resize);
    return () => frame.removeEventListener("load", resize);
  }, [bilan?.html]);

  if (!bilan) return null;
  return (
    <Card className="overflow-hidden border-2 border-emerald-200 bg-white shadow-md" data-testid="sent-bilan" role="region" aria-labelledby="sent-bilan-title">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100 bg-emerald-50 px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-emerald-700 p-2.5 text-white"><FileText className="h-5 w-5" aria-hidden="true" /></span>
          <div>
            <h2 id="sent-bilan-title" className="text-lg font-bold text-slate-900">Mon bilan d’évaluation</h2>
            <p className="text-sm text-slate-600">
              {bilan.subject ?? "Bilan validé par votre conseiller"}
              {bilan.sentAt ? ` · envoyé le ${new Date(bilan.sentAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}` : ""}
              {bilan.dossierNumber ? ` · dossier ${bilan.dossierNumber}` : ""}
            </p>
          </div>
        </div>
        <BilanDocumentActions getDocumentHtml={() => bilan.html} title={bilan.subject ?? "Mon bilan d’évaluation"} reference={bilan.dossierNumber} pdfUrl={bilan.pdfUrl} />
      </div>
      <iframe
        ref={frameRef}
        title="Bilan d’évaluation"
        sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        srcDoc={bilan.html}
        className="w-full border-0 bg-white"
        style={{ height }}
      />
      <ClientBilanDecision enabled={enabled} />
    </Card>
  );
}
