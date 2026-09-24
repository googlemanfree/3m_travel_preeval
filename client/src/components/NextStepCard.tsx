import React from "react";
import { ArrowRight, CheckCircle2, Clock, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { NextStep } from "@/lib/nextStep";

const TONES: Record<NextStep["tone"], { card: string; badge: string; icon: React.ReactNode }> = {
  action: { card: "border-blue-300 bg-gradient-to-r from-blue-50 via-white to-indigo-50", badge: "text-blue-800", icon: <Compass className="h-6 w-6" aria-hidden="true" /> },
  info: { card: "border-slate-200 bg-white", badge: "text-slate-600", icon: <Clock className="h-6 w-6" aria-hidden="true" /> },
  done: { card: "border-emerald-200 bg-emerald-50/60", badge: "text-emerald-800", icon: <CheckCircle2 className="h-6 w-6" aria-hidden="true" /> },
};

/** Une seule action claire, en tête de la vue d'ensemble. */
export default function NextStepCard({ step, onAct }: { step: NextStep; onAct: (step: NextStep) => void }) {
  const tone = TONES[step.tone];
  return (
    <section className={`rounded-2xl border-2 p-5 shadow-sm ${tone.card}`} aria-labelledby="next-step-title" data-testid="next-step-card" data-step={step.id}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className={`rounded-2xl bg-white p-3 shadow-sm ${tone.badge}`}>{tone.icon}</span>
          <div>
            <p className={`text-xs font-black uppercase tracking-[0.16em] ${tone.badge}`}>Votre prochaine étape · {step.eyebrow}</p>
            <h2 id="next-step-title" className="mt-1 text-xl font-black text-slate-950">{step.title}</h2>
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-700">{step.description}</p>
          </div>
        </div>
        {step.actionLabel && (
          <Button type="button" onClick={() => onAct(step)} className="h-12 shrink-0 bg-blue-800 px-5 text-white hover:bg-blue-900">
            {step.actionLabel} <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </div>
    </section>
  );
}
