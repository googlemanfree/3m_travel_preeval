import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CLIENT_DOSSIER_PHASE_GUIDE, type ClientDossierPhase } from "@shared/clientDossierPhases";

const toneByPhase: Record<Exclude<ClientDossierPhase, "follow_up">, string> = {
  created: "border-slate-200 bg-slate-50 text-slate-800",
  evaluation: "border-violet-200 bg-violet-50 text-violet-900",
  opening: "border-orange-200 bg-orange-50 text-orange-900",
  documents: "border-amber-200 bg-amber-50 text-amber-900",
  processing: "border-blue-200 bg-blue-50 text-blue-900",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-900",
  refused: "border-rose-200 bg-rose-50 text-rose-900",
};

export default function ClientPhaseGuide() {
  return (
    <section className="rounded-2xl border border-blue-100 bg-white/90 p-4 shadow-sm" aria-labelledby="client-phase-guide-title" data-testid="client-phase-guide">
      <div className="flex items-start gap-3">
        <span className="rounded-xl bg-blue-100 p-2 text-blue-700" aria-hidden="true"><HelpCircle className="h-4 w-4" /></span>
        <div>
          <h3 id="client-phase-guide-title" className="text-sm font-black text-slate-950">Comprendre les 7 phases de votre dossier</h3>
          <p className="mt-1 text-xs leading-5 text-slate-600">Survolez une phase ou utilisez la touche Tab pour comprendre ce qu’elle signifie. Les détails internes restent regroupés en étapes simples.</p>
        </div>
      </div>
      <TooltipProvider delayDuration={160}>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {CLIENT_DOSSIER_PHASE_GUIDE.map((item, index) => (
            <Tooltip key={item.phase}>
              <TooltipTrigger asChild>
                <button type="button" className={`flex min-h-10 items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-xs font-bold transition hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 ${toneByPhase[item.phase]}`} aria-label={`Expliquer la phase ${index + 1} : ${item.label}`} data-testid={`client-phase-guide-${item.phase}`}>
                  <span><span className="mr-1.5 opacity-60">{index + 1}</span>{item.label}</span>
                  <HelpCircle className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden="true" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
                <p className="font-bold">{item.label}</p>
                <p className="mt-1">{item.detail}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    </section>
  );
}
