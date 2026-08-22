import React from "react";
import type { EvaluationDeclarationStatus } from "@shared/evaluationDeclaration";

export function EvaluationDeclarationBadge({ status }: { status?: EvaluationDeclarationStatus | null }) {
  const declared = status === "declared_complete";
  return (
    <span
      aria-label={declared ? "Évaluation déclarée comme reçue" : "Évaluation en cours"}
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${declared ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}
    >
      {declared ? "Évaluation déclarée" : "Évaluation en cours"}
    </span>
  );
}
