import React from "react";
import type { EvaluationDeclarationStatus } from "@shared/evaluationDeclaration";

export function EvaluationDeclarationBadge({ status }: { status?: EvaluationDeclarationStatus | null }) {
  const config = status === "validated"
    ? { label: "Évaluation validée", ariaLabel: "Évaluation validée par l’équipe", classes: "bg-emerald-50 text-emerald-800" }
    : status === "pending_validation"
      ? { label: "Vérification requise", ariaLabel: "Évaluation déclarée en attente de vérification", classes: "bg-amber-50 text-amber-800" }
      : status === "refused"
        ? { label: "Complément requis", ariaLabel: "Évaluation non validée, complément requis", classes: "bg-rose-50 text-rose-800" }
        : { label: "Évaluation en cours", ariaLabel: "Évaluation en cours", classes: "bg-slate-100 text-slate-700" };
  return (
    <span
      aria-label={config.ariaLabel}
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${config.classes}`}
    >
      {config.label}
    </span>
  );
}
