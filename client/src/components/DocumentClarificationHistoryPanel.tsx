import { CheckCircle2, Clock3, FileUp, MessageSquareText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ClarificationHistoryEntry = {
  id: string;
  actorRole: "candidate" | "advisor" | "system";
  eventType: string;
  message: string | null;
  createdAt: Date | string;
};

type CandidateClarification = {
  id: number;
  documentLabel: string;
  status: "pending" | "answered" | "closed";
  history?: ClarificationHistoryEntry[];
  canUpload?: boolean;
  hasSubmittedDocument?: boolean;
};

function eventLabel(entry: ClarificationHistoryEntry) {
  if (entry.eventType === "request_created") return "Votre demande";
  if (entry.eventType === "advisor_response_sent") return "Réponse de l’agence";
  if (entry.eventType === "document_uploaded") return "Pièce transmise";
  return entry.actorRole === "advisor" ? "Message de l’agence" : "Mise à jour";
}

export function DocumentClarificationHistoryPanel({
  clarifications,
  onUpload,
}: {
  clarifications: CandidateClarification[];
  onUpload: (clarification: { id: number; documentLabel: string }) => void;
}) {
  if (!clarifications.length) return null;
  return (
    <Card className="border-violet-100 bg-white shadow-sm" aria-labelledby="document-clarification-history-title">
      <CardHeader>
        <CardTitle id="document-clarification-history-title" className="flex items-center gap-2 text-lg text-slate-950"><MessageSquareText className="h-5 w-5 text-violet-700" />Échanges sur vos pièces</CardTitle>
        <p className="text-sm text-slate-600">Retrouvez les messages associés à chaque pièce. Les délais de traitement internes et les notes de l’équipe ne sont pas affichés.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {clarifications.map((clarification) => (
          <section key={clarification.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4" aria-label={`Historique pour ${clarification.documentLabel}`}>
            <div className="flex flex-wrap items-center justify-between gap-2"><h4 className="font-semibold text-slate-950">{clarification.documentLabel}</h4><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${clarification.status === "pending" ? "bg-violet-100 text-violet-900" : clarification.hasSubmittedDocument ? "bg-blue-100 text-blue-900" : "bg-emerald-100 text-emerald-900"}`}>{clarification.status === "pending" ? "En attente de réponse" : clarification.hasSubmittedDocument ? "Pièce transmise" : "Réponse disponible"}</span></div>
            <ol className="mt-3 space-y-3 border-l-2 border-violet-100 pl-4">
              {(clarification.history ?? []).map((entry) => <li key={entry.id} className="relative"><span className="absolute -left-[22px] top-1 h-3 w-3 rounded-full border-2 border-white bg-violet-600" /><p className="text-xs font-semibold text-violet-900">{eventLabel(entry)}</p>{entry.message && <p className="mt-0.5 text-sm leading-6 text-slate-700">{entry.message}</p>}<time className="mt-1 block text-xs text-slate-500" dateTime={new Date(entry.createdAt).toISOString()}>{new Date(entry.createdAt).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}</time></li>)}
            </ol>
            {clarification.canUpload && <Button type="button" className="mt-4 bg-violet-700 hover:bg-violet-800" onClick={() => onUpload(clarification)}><FileUp className="mr-2 h-4 w-4" />Déposer cette pièce maintenant</Button>}
            {clarification.hasSubmittedDocument && <p className="mt-4 flex items-center gap-2 text-sm font-medium text-blue-800"><Clock3 className="h-4 w-4" />Pièce reçue — vérification en cours.</p>}
            {clarification.status === "answered" && !clarification.canUpload && !clarification.hasSubmittedDocument && <p className="mt-4 flex items-center gap-2 text-sm font-medium text-emerald-800"><CheckCircle2 className="h-4 w-4" />Réponse consultée.</p>}
          </section>
        ))}
      </CardContent>
    </Card>
  );
}
