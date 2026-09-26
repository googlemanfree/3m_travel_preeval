import { useState } from "react";
import { CheckCircle2, Circle, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { buildWelcomeSteps } from "@/lib/documentChecklist";

const STORAGE_KEY = "3m-welcome-journey-dismissed";

const readDismissed = (): boolean => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
};

type Props = {
  evaluationRequired: boolean;
  checklistMissing: number;
  checklistTotal: number;
  paymentConfirmed: boolean;
  agreementSigned: boolean;
  /** Ancienneté du compte en jours : l'accueil ne s'affiche que les premières semaines. */
  accountAgeDays: number;
};

/**
 * « Votre parcours en 3 étapes » : accueil des nouveaux candidats, cochant ce qui est réellement fait. Disparaît de lui-même une fois
 * les trois étapes terminées, après quelques semaines, ou quand le candidat le ferme (mémorisé sur cet appareil seulement).
 */
export default function WelcomeJourneyCard({ evaluationRequired, checklistMissing, checklistTotal, paymentConfirmed, agreementSigned, accountAgeDays }: Props) {
  const [dismissed, setDismissed] = useState(readDismissed);
  const steps = buildWelcomeSteps({ evaluationRequired, checklistMissing, checklistTotal, paymentConfirmed, agreementSigned });
  const doneCount = steps.filter((step) => step.done).length;
  if (dismissed || accountAgeDays > 30 || doneCount === steps.length) return null;
  const current = steps.find((step) => !step.done);

  const dismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* stockage indisponible : la carte se referme pour cette visite seulement */
    }
  };

  return (
    <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 via-white to-sky-50 p-5" data-testid="welcome-journey" role="region" aria-labelledby="welcome-journey-title">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">Bienvenue chez 3M Travel &amp; Services</p>
          <h2 id="welcome-journey-title" className="mt-1 text-lg font-black text-slate-950">Votre parcours en 3 étapes · {doneCount} sur {steps.length}</h2>
        </div>
        <button type="button" onClick={dismiss} aria-label="Fermer l’accueil" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" data-testid="welcome-dismiss"><X className="h-4 w-4" aria-hidden="true" /></button>
      </div>
      <ol className="mt-3 grid gap-2 sm:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.id} data-testid="welcome-step" data-done={step.done} data-current={current?.id === step.id} className={`rounded-xl border p-3 text-sm ${step.done ? "border-emerald-200 bg-emerald-50" : current?.id === step.id ? "border-indigo-300 bg-white shadow-sm" : "border-slate-200 bg-white/70"}`}>
            <p className="flex items-center gap-2 font-bold text-slate-900">
              {step.done ? <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" /> : <Circle className="h-4 w-4 text-slate-400" aria-hidden="true" />}
              {index + 1}. {step.title}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-600">{step.detail}</p>
          </li>
        ))}
      </ol>
    </Card>
  );
}
