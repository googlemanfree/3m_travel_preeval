import { CalendarClock, FilePenLine, RefreshCw, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

type AdvisorEvaluationReviewQueueProps = {
  sessionToken: string;
  onOpenDossier: (dossierNumber: string) => void;
};

export function AdvisorEvaluationReviewQueue({ sessionToken, onOpenDossier }: AdvisorEvaluationReviewQueueProps) {
  const [queueFilter, setQueueFilter] = useState<"all" | "without_evaluation">("all");
  const queue = trpc.unifiedRequests.evaluationReviewsToday.useQuery(
    { sessionToken, filter: queueFilter },
    { enabled: Boolean(sessionToken), refetchOnWindowFocus: false },
  );

  const rows = (queue.data?.rows ?? []) as Array<{
    id: number;
    dossierNumber: string;
    fullName: string;
    destination: string | null;
    scoringTotal: number | null;
    reviewOverdue: boolean;
    reviewDeadline: Date | string;
    updatedAt: Date | string;
    hasDraft: boolean;
  }>;
  return (
    <section className="space-y-5" aria-labelledby="evaluation-review-queue-title">
      <div className="flex flex-col justify-between gap-3 rounded-2xl bg-gradient-to-r from-amber-50 via-white to-blue-50 p-5 ring-1 ring-amber-100 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2"><CalendarClock className="h-5 w-5 text-amber-700" /><h2 id="evaluation-review-queue-title" className="text-lg font-bold text-slate-950">Bilans à valider aujourd’hui</h2></div>
          <p className="mt-1 text-sm text-slate-600">Les candidats nouvellement inscrits ou les brouillons IA attendent votre préparation et votre relecture obligatoire avant toute programmation ou diffusion. Après huit heures, ils remontent en priorité mais ne sont jamais envoyés sans validation.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2"><Badge className="bg-amber-600 text-white">{queue.data?.total ?? 0} à traiter</Badge><Select value={queueFilter} onValueChange={(value) => setQueueFilter(value as "all" | "without_evaluation")}><SelectTrigger className="w-[220px] bg-white" aria-label="Filtrer la file d’évaluation"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous les dossiers</SelectItem><SelectItem value="without_evaluation">Dossiers sans évaluation</SelectItem></SelectContent></Select><Button type="button" size="sm" variant="outline" onClick={() => queue.refetch()} disabled={queue.isFetching}><RefreshCw className={`mr-2 h-4 w-4 ${queue.isFetching ? "animate-spin" : ""}`} />Actualiser</Button></div>
      </div>

      {queue.isLoading ? <Card><CardContent className="flex items-center gap-2 p-8 text-sm text-slate-500"><RefreshCw className="h-4 w-4 animate-spin" />Chargement de la file de validation…</CardContent></Card> : null}
      {queue.isError ? <Card className="border-red-200"><CardContent className="p-6 text-sm text-red-700">Impossible de charger les bilans à valider : {queue.error.message}</CardContent></Card> : null}
      {!queue.isLoading && !queue.isError && rows.length === 0 ? <Card><CardContent className="p-8 text-center"><ShieldCheck className="mx-auto h-9 w-9 text-emerald-600" /><p className="mt-3 font-semibold text-slate-900">{queueFilter === "without_evaluation" ? "Aucun dossier sans évaluation" : "Aucun bilan en attente aujourd’hui"}</p><p className="mt-1 text-sm text-slate-500">{queueFilter === "without_evaluation" ? "Tous les dossiers actuellement visibles disposent déjà d’une évaluation ou ne nécessitent pas encore de préparation." : "Les nouveaux brouillons IA apparaîtront ici lorsqu’ils nécessiteront une validation conseiller."}</p></CardContent></Card> : null}
      <div className="grid gap-4 xl:grid-cols-2">
        {rows.map((row) => <Card key={row.id} className={row.reviewOverdue ? "border-amber-300 shadow-sm" : "border-amber-100 shadow-sm"}><CardContent className="space-y-4 p-5"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-xs font-semibold text-blue-700">{row.dossierNumber.startsWith("EVAL-DRAFT-") ? "Brouillon interne — dossier à attribuer" : row.dossierNumber}</p><h3 className="mt-1 font-bold text-slate-950">{row.fullName}</h3><p className="mt-1 text-sm text-slate-600">{row.destination || "Destination à confirmer"} · Score proposé : {row.scoringTotal ?? "—"}/100</p></div><Badge variant="outline" className={row.reviewOverdue ? "border-rose-300 bg-rose-50 text-rose-800" : "border-amber-200 bg-amber-50 text-amber-800"}>{row.reviewOverdue ? "Priorité 8 h" : row.hasDraft ? "À relire" : "À préparer"}</Badge></div><div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500"><span>{row.reviewOverdue ? `Échéance dépassée le ${new Date(row.reviewDeadline).toLocaleString("fr-FR")}` : `Mis à jour le ${new Date(row.updatedAt).toLocaleString("fr-FR")}`}</span><Button type="button" size="sm" onClick={() => onOpenDossier(row.dossierNumber)}><FilePenLine className="mr-2 h-4 w-4" />{row.hasDraft ? "Traiter le bilan" : "Préparer l’évaluation"}</Button></div></CardContent></Card>)}
      </div>
    </section>
  );
}
