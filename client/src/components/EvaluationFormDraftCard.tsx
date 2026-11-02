import React from "react";
import { ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { applyFormBilanDraft, type FormBilanDraft } from "@shared/evaluationFromForm";
import type { AdminEvaluationVersion } from "@shared/evaluationValidation";

type Props = { formDraft: FormBilanDraft; value: AdminEvaluationVersion; onChange: (next: AdminEvaluationVersion) => void; readOnly: boolean };

/**
 * Bilan préparé depuis le formulaire du candidat. Pour les études, les séjours, l'e-Visa et l'installation, les réponses du formulaire
 * (adaptées au pays et au visa choisis) suffisent à préparer le bilan : un clic remplit les rubriques encore vides, sans toucher aux
 * notes ni à ce que l'administrateur a déjà écrit.
 */
export default function EvaluationFormDraftCard({ formDraft, value, onChange, readOnly }: Props) {
  const { completeness } = formDraft;
  const apply = () => {
    const { version, filled } = applyFormBilanDraft(value, formDraft);
    if (filled.length === 0) { toast.info("Rien à ajouter : les rubriques du bilan sont déjà remplies."); return; }
    onChange(version);
    toast.success(`Bilan pré-rempli depuis le formulaire : ${filled.join(", ")}. Relisez, notez les critères, puis enregistrez.`);
  };
  return (
    <section className="mb-4 rounded-lg border border-sky-200 bg-sky-50 p-4" data-testid="form-draft-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h4 className="flex items-center gap-2 text-sm font-bold text-sky-950"><ClipboardList className="h-4 w-4" aria-hidden="true" />Formulaire du candidat · {formDraft.programLabel}{formDraft.countryName ? ` · ${formDraft.countryName}` : ""}</h4>
          <p className="mt-1 text-xs text-sky-900">
            Renseigné à <strong>{completeness.percent} %</strong> ({completeness.answered}/{completeness.total} réponses).{" "}
            {formDraft.ready
              ? "Les réponses obligatoires sont là : le formulaire suffit à préparer ce bilan, sans CV ni analyse supplémentaire."
              : `Réponses obligatoires manquantes : ${completeness.missingRequired.slice(0, 5).join(" ; ")}${completeness.missingRequired.length > 5 ? "…" : ""}. Relancez le candidat avant de publier.`}
          </p>
          <p className="mt-1 text-xs text-sky-800">
            {formDraft.strengths.length} atout(s) · {formDraft.improvements.length} point(s) à renforcer · {formDraft.actionPlan.length} action(s) · {formDraft.requiredDocuments.length} pièce(s). Les notes restent les vôtres.
          </p>
        </div>
        <Button type="button" size="sm" className="bg-sky-700 hover:bg-sky-800" disabled={readOnly} onClick={apply} data-testid="form-draft-apply">
          Pré-remplir le bilan
        </Button>
      </div>
    </section>
  );
}
