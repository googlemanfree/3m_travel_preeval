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
  onOpenEditor?: () => void;
  onOfflineValidate?: (channel: "appel" | "agence" | "email", note?: string) => void;
  isOfflineValidating?: boolean;
};

export function AdminPreDossierEvaluationPanel({ status, declaredAt, reviewedAt, reviewedBy, reviewNote, onReview, isReviewing = false, onOpenEditor, onOfflineValidate, isOfflineValidating = false }: Props) {
  const [note, setNote] = useState("");
  const [offlineOpen, setOfflineOpen] = useState(false);
  const [offlineChannel, setOfflineChannel] = useState<"appel" | "agence" | "email">("appel");
  const [offlineNote, setOfflineNote] = useState("");
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
      {onOfflineValidate && (
        <div className="mt-4 flex flex-col gap-3 border-t border-violet-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">Évaluation réalisée hors ligne</p>
            <p className="mt-1 text-sm leading-6 text-slate-700">Validez simplement une évaluation faite par téléphone, en agence ou par e-mail. Le conseiller et la date sont tracés, sans envoyer de bilan.</p>
          </div>
          <Button type="button" variant="outline" onClick={() => setOfflineOpen(true)} className="shrink-0 border-emerald-300 text-emerald-800 hover:bg-emerald-50">Valider l’évaluation hors ligne</Button>
        </div>
      )}
      {onOpenEditor && (
        <div className="mt-4 flex flex-col gap-3 border-t border-violet-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">Saisir et envoyer l’évaluation manuellement</p>
            <p className="mt-1 text-sm leading-6 text-slate-700">Ouvrez l’espace de préparation complet pour rédiger, enregistrer le brouillon, prévisualiser le PDF et contrôler SMTP avant toute diffusion.</p>
          </div>
          <Button type="button" onClick={onOpenEditor} className="shrink-0 bg-blue-700 text-white hover:bg-blue-800">Ouvrir l’espace de préparation</Button>
        </div>
      )}
      {offlineOpen && onOfflineValidate && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-white p-4" role="dialog" aria-label="Validation de l’évaluation hors ligne">
          <p className="text-sm font-semibold text-slate-900">Canal de l’évaluation</p>
          <select className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm" value={offlineChannel} onChange={(event) => setOfflineChannel(event.target.value as "appel" | "agence" | "email")}>
            <option value="appel">Appel téléphonique</option>
            <option value="agence">Bureau en agence</option>
            <option value="email">E-mail</option>
          </select>
          <textarea className="mt-2 min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" maxLength={1000} value={offlineNote} onChange={(event) => setOfflineNote(event.target.value)} placeholder="Note du conseiller (facultatif)" />
          <div className="mt-3 flex gap-2">
            <Button type="button" variant="outline" onClick={() => setOfflineOpen(false)}>Annuler</Button>
            <Button type="button" disabled={isOfflineValidating} onClick={() => onOfflineValidate(offlineChannel, offlineNote.trim() || undefined)} className="bg-emerald-700 hover:bg-emerald-800">{isOfflineValidating ? "Validation…" : "Confirmer la validation hors ligne"}</Button>
          </div>
        </div>
      )}
    </section>
  );
}
