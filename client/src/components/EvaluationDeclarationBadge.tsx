import React from "react";
import type { EvaluationDeclarationStatus } from "@shared/evaluationDeclaration";

/** `bilanSent` : le bilan a déjà été envoyé ; on l'affiche en grand pour ne jamais refaire une évaluation déjà faite. */
export function EvaluationDeclarationBadge({ status, bilanSent = false }: { status?: EvaluationDeclarationStatus | null; bilanSent?: boolean }) {
  const config = bilanSent || status === "validated"
    ? { label: "PROFIL ÉVALUÉ", ariaLabel: bilanSent ? "Profil évalué : bilan déjà envoyé" : "Profil évalué : évaluation validée par l’équipe", classes: "bg-emerald-600 text-white ring-1 ring-emerald-700" }
    : status === "pending_validation"
      ? { label: "Vérification requise", ariaLabel: "Évaluation déclarée en attente de vérification", classes: "bg-amber-50 text-amber-800" }
      : status === "refused"
        ? { label: "Complément requis", ariaLabel: "Évaluation non validée, complément requis", classes: "bg-rose-50 text-rose-800" }
        : { label: "Évaluation en cours", ariaLabel: "Évaluation en cours", classes: "bg-slate-100 text-slate-700" };
  return (
    <span
      aria-label={config.ariaLabel}
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${config.classes}`}
      data-testid={bilanSent || status === "validated" ? "profile-evaluated-badge" : undefined}
    >
      {config.label}
    </span>
  );
}
