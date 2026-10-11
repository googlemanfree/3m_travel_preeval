import { describeClientDossierPhase } from "@shared/clientDossierPhases";
import { describeDossierProgress } from "@shared/dossierProgress";
import { Progress } from "@/components/ui/progress";

type Props = {
  dossierStatus?: string | null;
  destination?: string | null;
  visaType?: string | null;
  procedureLabel?: string | null;
  evaluationStatus?: string | null;
  paymentConfirmed?: boolean;
  className?: string;
};

/**
 * Jauge unique côté client : phase stable + prochaine action parcours.
 * N’affiche aucun micro-statut technique.
 */
export default function ClientPhaseGauge({
  dossierStatus,
  destination,
  visaType,
  procedureLabel,
  evaluationStatus,
  paymentConfirmed,
  className,
}: Props) {
  const phase = describeClientDossierPhase(dossierStatus);
  const progress = describeDossierProgress({
    destination,
    visaType,
    procedureLabel,
    dossierStatus,
    evaluationStatus,
    milestones: { paymentConfirmed },
  });

  return (
    <section className={className} data-testid="client-phase-gauge" aria-label="Avancement de votre dossier">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Statut</p>
          <h3 className="mt-1 text-xl font-black text-slate-950">{phase.label}</h3>
          <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">{phase.detail}</p>
        </div>
        <p className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-800">{progress.percent}%</p>
      </div>
      <Progress className="mt-4 h-2.5" value={progress.percent} />
      {!progress.refused && progress.stepLabel ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Étape en cours</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {progress.stepNumber}/{progress.stepCount} · {progress.stepLabel}
            </p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-amber-800">Prochaine action</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {progress.nextStepLabel || "Suivre les indications de l’agence"}
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm font-medium text-slate-700">{phase.detail}</p>
      )}
    </section>
  );
}
