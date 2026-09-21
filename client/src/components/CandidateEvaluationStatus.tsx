import React, { useState } from "react";
import { Clock, MailQuestion } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import EvaluationReportView from "@/components/EvaluationReportView";
import type { ClientReport } from "@shared/evaluationValidation";

export type CandidateEvaluationViewData = {
  stage: "not_started" | "pending" | "info_requested" | "published";
  pendingNotice: { title: string; body: string } | null;
  infoRequest: { message: string; items: Array<{ id: string; label: string }> } | null;
  report: ClientReport | null;
  publishedAt: string | null;
};

/**
 * Ce que le candidat voit de son évaluation : l'avis d'attente tant que rien n'est validé, les demandes
 * de complément, puis le rapport PUBLIÉ. Aucun brouillon, score initial ou commentaire interne n'existe
 * dans les données reçues : le serveur ne les renvoie jamais.
 */
export default function CandidateEvaluationStatus({ evaluationId, view, onChanged }: { evaluationId: number; view: CandidateEvaluationViewData; onChanged?: () => void }) {
  if (view.stage === "not_started") return null;
  return (
    <div className="space-y-4" data-testid="candidate-evaluation-status">
      {view.infoRequest && <InfoRequestForm evaluationId={evaluationId} request={view.infoRequest} onChanged={onChanged} />}
      {view.stage === "pending" && view.pendingNotice && (
        <Card className="border-2 border-blue-200 bg-blue-50/60 p-6" role="status" aria-labelledby="evaluation-pending-title">
          <div className="flex items-start gap-4">
            <span className="rounded-2xl bg-blue-700 p-3 text-white" aria-hidden="true">
              <Clock className="h-6 w-6" />
            </span>
            <div>
              <Badge className="bg-blue-100 text-blue-900">Analyse en cours</Badge>
              <h2 id="evaluation-pending-title" className="mt-2 text-xl font-black text-slate-950">
                {view.pendingNotice.title}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">{view.pendingNotice.body}</p>
            </div>
          </div>
        </Card>
      )}
      {view.report && <EvaluationReportView report={view.report} />}
    </div>
  );
}

function InfoRequestForm({ evaluationId, request, onChanged }: { evaluationId: number; request: NonNullable<CandidateEvaluationViewData["infoRequest"]>; onChanged?: () => void }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const respond = trpc.evaluationValidation.respondToInfoRequest.useMutation({
    onSuccess: () => {
      toast.success("Merci, vos réponses ont été transmises à notre équipe.");
      onChanged?.();
    },
    onError: (error: { message?: string }) => toast.error(error.message || "Envoi impossible pour le moment."),
  });
  const filled = request.items.some((item) => (answers[item.id] ?? "").trim()) || note.trim().length > 0;

  return (
    <Card className="border-2 border-amber-300 bg-amber-50 p-6" role="region" aria-labelledby="evaluation-info-title">
      <div className="flex items-start gap-4">
        <span className="rounded-2xl bg-amber-600 p-3 text-white" aria-hidden="true">
          <MailQuestion className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-800">Action requise</p>
          <h2 id="evaluation-info-title" className="mt-1 text-xl font-black text-slate-950">
            Informations complémentaires demandées
          </h2>
          {request.message && <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-800">{request.message}</p>}
          <form
            className="mt-4 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!filled || respond.isPending) return;
              respond.mutate({ evaluationId, answers: request.items.map((item) => ({ id: item.id, answer: (answers[item.id] ?? "").trim() })).filter((entry) => entry.answer), note: note.trim() });
            }}
          >
            {request.items.map((item) => (
              <label key={item.id} className="block text-sm font-medium text-slate-800">
                {item.label}
                <Textarea value={answers[item.id] ?? ""} onChange={(event) => setAnswers((current) => ({ ...current, [item.id]: event.target.value }))} maxLength={2000} rows={3} className="mt-1 bg-white" />
              </label>
            ))}
            <label className="block text-sm font-medium text-slate-800">
              Précisions (facultatif)
              <Textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={2000} rows={2} className="mt-1 bg-white" />
            </label>
            <p className="text-xs text-amber-900">N’écrivez ici ni numéro de passeport, ni coordonnées bancaires : les documents se déposent dans votre espace sécurisé.</p>
            <Button type="submit" disabled={!filled || respond.isPending} className="bg-amber-700 text-white hover:bg-amber-800">
              {respond.isPending ? "Envoi…" : "Envoyer mes réponses"}
            </Button>
          </form>
        </div>
      </div>
    </Card>
  );
}
