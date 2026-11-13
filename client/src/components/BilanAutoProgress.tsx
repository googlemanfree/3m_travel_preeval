import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * Frise de suivi du bilan automatisé côté candidat : dossier reçu → analyse → relecture par l'agence → bilan disponible.
 * N'affiche que des étapes (jamais d'erreur, de note ni de détail interne) ; n'affiche rien si le bilan automatisé est inactif.
 */
export default function BilanAutoProgress({ evaluationId }: { evaluationId: number }) {
  const query = trpc.evaluationValidation.myBilanProgress.useQuery({ evaluationId }, { retry: false, refetchInterval: 60_000 });
  const utils = trpc.useUtils();
  const grant = trpc.evaluationValidation.grantCvAnalysisConsent.useMutation({
    onSuccess: () => { toast.success("Merci : votre accord est enregistré, l'analyse de votre dossier reprend."); void utils.evaluationValidation.myBilanProgress.invalidate(); },
    onError: (error: { message?: string }) => toast.error(error.message || "Enregistrement impossible pour le moment."),
  });
  const progress = query.data?.progress;
  if (!progress) return null;
  return (
    <Card className="p-5" data-testid="bilan-auto-progress" aria-labelledby="bilan-progress-title">
      <h3 id="bilan-progress-title" className="text-base font-bold text-slate-950">Suivi de votre bilan</h3>
      <ol className="mt-3 space-y-2" aria-label="Étapes du bilan">
        {progress.steps.map((step) => (
          <li key={step.id} className="flex items-center gap-3 text-sm" aria-current={step.status === "en_cours" ? "step" : undefined}>
            {step.status === "fait" ? <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" /> : step.status === "en_cours" ? <Loader2 className="h-5 w-5 animate-spin text-blue-700 motion-reduce:animate-none" aria-hidden="true" /> : <Circle className="h-5 w-5 text-slate-300" aria-hidden="true" />}
            <span className={step.status === "a_venir" ? "text-slate-500" : "font-semibold text-slate-900"}>{step.label}</span>
            <span className="sr-only">{step.status === "fait" ? "terminée" : step.status === "en_cours" ? "en cours" : "à venir"}</span>
          </li>
        ))}
      </ol>
      {progress.needs === "consentement_cv" && (
        <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 p-3" data-testid="cv-consent-request">
          <p className="text-sm leading-6 text-slate-900">Pour préparer votre bilan, nous avons besoin de votre accord : votre CV et les informations de votre dossier seront lus par un traitement automatisé. Le total de la note est calculé par des règles connues de l’agence. Vous pouvez demander la correction ou la suppression de vos données à tout moment.</p>
          <Button className="mt-3" onClick={() => grant.mutate({ evaluationId, accepted: true })} disabled={grant.isPending} data-testid="cv-consent-accept">J’accepte l’analyse de mon dossier et la lecture de mon CV</Button>
        </div>
      )}
      {progress.note && <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-700" role="status">{progress.note}</p>}
    </Card>
  );
}
