import React from "react";
import { EvaluationDeclarationBadge } from "@/components/EvaluationDeclarationBadge";
import type { EvaluationDeclarationStatus } from "@shared/evaluationDeclaration";

type Props = {
  status?: EvaluationDeclarationStatus | null;
  declaredAt?: Date | string | null;
};

export function AdminPreDossierEvaluationPanel({ status, declaredAt }: Props) {
  const declared = status === "declared_complete";
  return (
    <section className="rounded-xl border border-violet-200 bg-violet-50/70 p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-violet-800">Compte avant ouverture de dossier</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <h4 className="text-lg font-bold text-slate-900">Évaluation {declared ? "déclarée comme reçue" : "en cours"}</h4>
        <EvaluationDeclarationBadge status={status} />
      </div>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">
        {declared
          ? "Le candidat indique avoir déjà reçu son évaluation. Vérifiez l’e-mail ou le bilan avant de rattacher le compte à un dossier actif."
          : "Le candidat n’a pas encore indiqué avoir reçu une évaluation. Le compte reste disponible pour le suivi et les relances avant l’ouverture du dossier."}
      </p>
      {declaredAt && <p className="mt-3 text-xs font-medium text-violet-800">Déclaration enregistrée le {new Date(declaredAt).toLocaleString("fr-FR")}</p>}
    </section>
  );
}
