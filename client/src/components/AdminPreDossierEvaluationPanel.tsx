import React from "react";
import { useState } from "react";
import { EvaluationDeclarationBadge } from "@/components/EvaluationDeclarationBadge";
import { Button } from "@/components/ui/button";
import type { EvaluationDeclarationStatus } from "@shared/evaluationDeclaration";

type Props = {
  status?: EvaluationDeclarationStatus | null;
  declaredAt?: Date | string | null;
  reviewedAt?: Date | string | null;
  reviewedBy?: string | null;
  reviewNote?: string | null;
  onReview?: (decision: "validate" | "refuse" | "request_correction", note?: string) => void;
  isReviewing?: boolean;
  onDeliver?: (subject: string, message: string) => void;
  isDelivering?: boolean;
};

export function AdminPreDossierEvaluationPanel({ status, declaredAt, reviewedAt, reviewedBy, reviewNote, onReview, isReviewing = false, onDeliver, isDelivering = false }: Props) {
  const [note, setNote] = useState("");
  const [deliverySubject, setDeliverySubject] = useState("Votre évaluation 3M Travel & Services");
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const [deliveryConfirmed, setDeliveryConfirmed] = useState(false);
  const pending = status === "pending_validation" || status === "refused";
  const validated = status === "validated";
  return (
    <section className="rounded-xl border border-violet-200 bg-violet-50/70 p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-violet-800">Compte avant ouverture de dossier</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <h4 className="text-lg font-bold text-slate-900">Évaluation {validated ? "vérifiée" : pending ? "à vérifier" : "en cours"}</h4>
        <EvaluationDeclarationBadge status={status} />
      </div>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">
        {pending
          ? "Le candidat indique avoir déjà reçu son évaluation. Vérifiez l’e-mail ou le bilan avant toute ouverture de dossier."
          : validated
            ? "L’évaluation externe a été vérifiée manuellement. L’ouverture du dossier reste soumise aux autres contrôles de l’agence."
          : "Le candidat n’a pas encore indiqué avoir reçu une évaluation. Le compte reste disponible pour le suivi et les relances avant l’ouverture du dossier."}
      </p>
      {declaredAt && <p className="mt-3 text-xs font-medium text-violet-800">Déclaration enregistrée le {new Date(declaredAt).toLocaleString("fr-FR")}</p>}
      {reviewedAt && <p className="mt-2 text-xs font-medium text-violet-800">Dernière décision : {new Date(reviewedAt).toLocaleString("fr-FR")}{reviewedBy ? ` par ${reviewedBy}` : ""}</p>}
      {reviewNote && <p className="mt-2 rounded-lg bg-white/70 p-3 text-sm text-slate-700">Note de vérification : {reviewNote}</p>}
      {pending && onReview && (
        <div className="mt-4 border-t border-violet-200 pt-4">
          <label htmlFor="evaluation-review-note" className="text-sm font-semibold text-slate-800">Note de décision</label>
          <textarea id="evaluation-review-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} placeholder="Obligatoire pour demander un complément ou refuser la déclaration." className="mt-2 min-h-20 w-full rounded-md border border-violet-200 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-600" />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" disabled={isReviewing} onClick={() => onReview("validate", note)} className="bg-emerald-700 hover:bg-emerald-800">Valider l’évaluation</Button>
            <Button type="button" size="sm" variant="outline" disabled={isReviewing || !note.trim()} onClick={() => onReview("request_correction", note)}>Demander un complément</Button>
            <Button type="button" size="sm" variant="destructive" disabled={isReviewing || !note.trim()} onClick={() => onReview("refuse", note)}>Refuser la déclaration</Button>
          </div>
        </div>
      )}
      {onDeliver && (
        <div className="mt-4 border-t border-violet-200 pt-4">
          <p className="text-sm font-semibold text-slate-800">Saisir et envoyer l’évaluation manuellement</p>
          <p className="mt-1 text-sm leading-6 text-slate-700">Saisissez le bilan directement ici. L’envoi est réalisé par un conseiller habilité, ajouté à l’espace client et envoyé par e-mail si la délivrabilité est disponible. Aucun traitement IA n’est nécessaire.</p>
          <label htmlFor="evaluation-delivery-subject" className="mt-3 block text-sm font-semibold text-slate-800">Objet</label>
          <input id="evaluation-delivery-subject" value={deliverySubject} onChange={(event) => setDeliverySubject(event.target.value)} maxLength={255} className="mt-1 w-full rounded-md border border-violet-200 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-600" />
          <label htmlFor="evaluation-delivery-message" className="mt-3 block text-sm font-semibold text-slate-800">Évaluation validée</label>
          <textarea id="evaluation-delivery-message" value={deliveryMessage} onChange={(event) => setDeliveryMessage(event.target.value)} minLength={20} maxLength={12000} placeholder="Saisissez ou collez l’évaluation validée à remettre au candidat…" className="mt-1 min-h-32 w-full rounded-md border border-violet-200 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-600" />
          <label className="mt-3 flex items-start gap-2 text-sm text-slate-800">
            <input type="checkbox" checked={deliveryConfirmed} onChange={(event) => setDeliveryConfirmed(event.target.checked)} className="mt-1 rounded border-violet-300 text-violet-700" />
            <span>J’ai vérifié le contenu et confirme la remise dans l’espace client et par e-mail.</span>
          </label>
          <Button type="button" size="sm" disabled={isDelivering || !deliveryConfirmed || deliverySubject.trim().length < 5 || deliveryMessage.trim().length < 20} onClick={() => onDeliver(deliverySubject.trim(), deliveryMessage.trim())} className="mt-3 bg-violet-700 hover:bg-violet-800">
                          {isDelivering ? "Envoi en cours…" : "Envoyer l’évaluation au client"}

          </Button>
        </div>
      )}
    </section>
  );
}
