import React, { useState } from "react";
import { CheckCircle2, FolderOpen, MessageCircleQuestion, Phone } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { clientSpacePolling } from "@/lib/clientSpaceSync";
import { DECISION_DISCLAIMER, DECLINE_REASONS, WHY_OPEN_NOW, type DeclineReason } from "@shared/evaluationDecision";
import { Button } from "@/components/ui/button";

const selectClass = "mt-1 h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-base";

/** Sous le bilan : « Je valide et j'ouvre mon dossier » (ou « Je ne valide pas »), avec les vraies raisons de ne pas attendre. */
export function ClientBilanDecision({ enabled = true }: { enabled?: boolean }) {
  const utils = trpc.useUtils();
  const query = trpc.evaluationDecision.myDecision.useQuery(undefined, { enabled, ...clientSpacePolling(), retry: 1 });
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState<DeclineReason | "">("");
  const [comment, setComment] = useState("");
  const refresh = () => {
    void utils.evaluationDecision.myDecision.invalidate();
    void utils.candidate.getClientDashboardSummary.invalidate();
  };
  const accept = trpc.evaluationDecision.accept.useMutation({
    onSuccess: () => { toast.success("Merci ! L'ouverture de votre dossier est demandée.", { description: "Votre conseiller est prévenu. Prochaine étape : les frais d'ouverture, puis le dépôt de vos pièces." }); setDeclining(false); refresh(); },
    onError: (error) => toast.error(error.message),
  });
  const decline = trpc.evaluationDecision.decline.useMutation({
    onSuccess: () => { toast.success("Votre réponse est transmise.", { description: "Un conseiller reviendra vers vous. Vous pouvez valider votre bilan à tout moment." }); setDeclining(false); refresh(); },
    onError: (error) => toast.error(error.message),
  });
  // Une question avant de valider : on amène le candidat à la prise de rendez-vous en ligne de la même page, sinon au formulaire de contact.
  const talkToAdvisor = () => {
    const target = document.querySelector('[data-testid="client-remote-support"]');
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    else window.location.assign("/contact");
  };
  const data = query.data;
  if (!enabled || !data || !data.sent) return null;
  const busy = accept.isPending || decline.isPending;

  if (data.decision === "accepted" || data.opening) {
    return (
      <section className="border-t border-emerald-100 bg-emerald-50 px-5 py-4" data-testid="bilan-decision-accepted" aria-label="Ouverture du dossier demandée">
        <p className="flex items-start gap-2 font-bold text-emerald-950"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />Vous avez validé votre bilan : l'ouverture de votre dossier est demandée.</p>
        <p className="mt-1 text-sm text-emerald-900">Suivez maintenant l'étape « frais d'ouverture » puis déposez vos pièces depuis cet espace. Votre conseiller vous accompagne.</p>
      </section>
    );
  }

  return (
    <section className="space-y-4 border-t border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-5 py-5" data-testid="bilan-decision" aria-labelledby="bilan-decision-title">
      <div>
        <h3 id="bilan-decision-title" className="text-lg font-black text-slate-900">Et maintenant ? Ouvrez votre dossier pour avancer</h3>
        <p className="mt-1 text-sm text-slate-700">Votre bilan est prêt. Si vous êtes d'accord, la suite démarre en un clic.</p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2" data-testid="bilan-why-open">
        {WHY_OPEN_NOW.map((item) => (
          <li key={item.title} className="rounded-xl border border-blue-100 bg-white p-3 text-sm shadow-sm">
            <strong className="block text-slate-900">{item.title}</strong>
            <span className="text-slate-700">{item.text}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" size="lg" className="min-h-12 bg-blue-700 px-6 text-base font-bold hover:bg-blue-800" disabled={busy} onClick={() => accept.mutate()} data-testid="bilan-accept">
          <FolderOpen className="mr-2 h-5 w-5" aria-hidden="true" />{accept.isPending ? "Ouverture en cours…" : "Je valide et j'ouvre mon dossier"}
        </Button>
        <Button type="button" variant="ghost" className="min-h-12 text-blue-800" onClick={talkToAdvisor} data-testid="bilan-talk">
          <Phone className="mr-2 h-4 w-4" aria-hidden="true" />Parler à mon conseiller
        </Button>
        {!declining && (
          <Button type="button" variant="outline" className="min-h-12" disabled={busy} onClick={() => setDeclining(true)} data-testid="bilan-decline-open">
            <MessageCircleQuestion className="mr-2 h-4 w-4" aria-hidden="true" />Je ne valide pas
          </Button>
        )}
      </div>
      {data.decision === "declined" && !declining && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950" data-testid="bilan-decision-declined">Votre réponse a été transmise à l'équipe{data.reason ? ` (« ${DECLINE_REASONS[data.reason as DeclineReason] ?? ""} »)` : ""}. Un conseiller reviendra vers vous. Vous pouvez valider votre bilan à tout moment avec le bouton ci-dessus.</p>
      )}
      {declining && (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4" data-testid="bilan-decline-form">
          <label className="block text-sm font-semibold text-slate-800">Pourquoi ne validez-vous pas pour l'instant ?
            <select className={selectClass} value={reason} onChange={(event) => setReason(event.target.value as DeclineReason | "")} data-testid="bilan-decline-reason">
              <option value="">Choisissez une réponse…</option>
              {(Object.keys(DECLINE_REASONS) as DeclineReason[]).map((key) => <option key={key} value={key}>{DECLINE_REASONS[key]}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold text-slate-800">Un mot pour votre conseiller (facultatif)
            <textarea className="mt-1 min-h-20 w-full rounded-lg border border-slate-300 p-3 text-base" maxLength={500} value={comment} onChange={(event) => setComment(event.target.value)} data-testid="bilan-decline-comment" />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={!reason || busy} onClick={() => reason && decline.mutate({ reason, comment: comment.trim() || null })} data-testid="bilan-decline-send">{decline.isPending ? "Envoi…" : "Envoyer ma réponse"}</Button>
            <Button type="button" variant="ghost" disabled={busy} onClick={() => setDeclining(false)}>Annuler</Button>
          </div>
        </div>
      )}
      <p className="text-xs text-slate-500">{DECISION_DISCLAIMER}</p>
    </section>
  );
}
