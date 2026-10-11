import { CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ClientSpaceChange } from "@/lib/clientSpaceSync";

type Props = {
  change: ClientSpaceChange;
  onDismiss: () => void;
};

/** Alerte inline, distincte des toasts, affichée uniquement après un changement détecté. */
export default function ClientDossierStepAlert({ change, onDismiss }: Props) {
  return (
    <section
      className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm"
      data-testid="client-dossier-step-alert"
      role="status"
      aria-live="polite"
      aria-labelledby="client-dossier-step-alert-title"
    >
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p id="client-dossier-step-alert-title" className="font-bold text-emerald-950">Votre dossier vient d’avancer</p>
          <p className="mt-1 text-sm font-semibold text-emerald-900">{change.title}</p>
          {change.description && <p className="mt-1 text-sm text-emerald-800">{change.description}</p>}
          <p className="mt-2 text-xs text-emerald-800">Consultez la prochaine action dans votre parcours. Aucune action n’est enregistrée par cette alerte.</p>
        </div>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-emerald-800 hover:bg-emerald-100" onClick={onDismiss} aria-label="Fermer l’alerte de progression">
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </section>
  );
}
