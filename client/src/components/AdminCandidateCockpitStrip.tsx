import { AlertTriangle, CheckCircle2, ChevronRight, Gauge } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type Cockpit = {
  stage: string;
  stageLabel: string;
  nextAction: {
    key: string;
    label: string;
    description: string;
    urgency: "high" | "normal" | "low";
    tab?: "evaluation" | "payments" | "documents" | "overview" | "messages";
  };
  blockers: Array<{ code: string; message: string; tab?: string }>;
  checklist: Array<{ key: string; label: string; done: boolean }>;
  progressPercent: number;
  canForceActions?: string[];
};

const URGENCY_STYLE = {
  high: "border-rose-200 bg-rose-50 text-rose-950",
  normal: "border-amber-200 bg-amber-50 text-amber-950",
  low: "border-slate-200 bg-slate-50 text-slate-900",
} as const;

export type CockpitTreatTarget = {
  key: string;
  tab: NonNullable<Cockpit["nextAction"]["tab"]>;
  label: string;
};

export default function AdminCandidateCockpitStrip({
  cockpit,
  onOpenTab,
  onTreatNow,
}: {
  cockpit: Cockpit;
  /** @deprecated Préférez onTreatNow — conservé pour les écrans déjà branchés. */
  onOpenTab?: (tab: NonNullable<Cockpit["nextAction"]["tab"]>) => void;
  /** Action réelle « Traiter maintenant » (ne doit jamais être un no-op). */
  onTreatNow?: (target: CockpitTreatTarget) => void;
}) {
  const treatTarget: CockpitTreatTarget = {
    key: cockpit.nextAction.key,
    tab: cockpit.nextAction.tab || cockpit.blockers[0]?.tab || "overview",
    label: cockpit.nextAction.label,
  };

  const handleTreat = (target: CockpitTreatTarget = treatTarget) => {
    if (onTreatNow) {
      onTreatNow(target);
      return;
    }
    if (onOpenTab) onOpenTab(target.tab);
  };

  const canTreat = Boolean(onTreatNow || onOpenTab);

  return (
    <section className={`rounded-2xl border p-4 sm:p-5 ${URGENCY_STYLE[cockpit.nextAction.urgency]}`} data-testid="candidate-cockpit-strip">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-current/20 bg-white/70">
              <Gauge className="mr-1 h-3.5 w-3.5" />
              Cockpit dossier
            </Badge>
            <Badge variant="outline" className="border-current/20 bg-white/70">{cockpit.stageLabel}</Badge>
            <Badge variant="outline" className="border-current/20 bg-white/70">
              Urgence {cockpit.nextAction.urgency === "high" ? "haute" : cockpit.nextAction.urgency === "normal" ? "normale" : "basse"}
            </Badge>
          </div>
          <h3 className="mt-3 text-lg font-black tracking-tight">{cockpit.nextAction.label}</h3>
          <p className="mt-1 text-sm leading-6 opacity-90">{cockpit.nextAction.description}</p>
        </div>
        <div className="w-full max-w-[220px] rounded-xl border border-white/70 bg-white/80 p-3">
          <div className="flex items-end justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Avancement contrôle</p>
            <strong className="text-xl text-slate-950">{cockpit.progressPercent}%</strong>
          </div>
          <Progress className="mt-2 h-2.5" value={cockpit.progressPercent} aria-label={`Avancement contrôle ${cockpit.progressPercent}%`} />
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="rounded-xl border border-white/70 bg-white/75 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Checklist de contrôle</p>
          <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {cockpit.checklist.map((item) => (
              <li key={item.key} className="flex items-center gap-2 text-sm text-slate-800">
                {item.done ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
                )}
                <span className={item.done ? "text-slate-600" : "font-medium"}>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-white/70 bg-white/75 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Bloqueurs actifs</p>
          {cockpit.blockers.length === 0 ? (
            <p className="mt-2 flex items-center gap-2 text-sm text-emerald-800">
              <CheckCircle2 className="h-4 w-4" /> Aucun bloqueur — dossier sous contrôle.
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {cockpit.blockers.slice(0, 4).map((blocker) => {
                const blockerTab = (blocker.tab || treatTarget.tab) as CockpitTreatTarget["tab"];
                return (
                  <li key={blocker.code}>
                    {canTreat ? (
                      <button
                        type="button"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                        onClick={() =>
                          handleTreat({
                            key: blocker.code,
                            tab: blockerTab,
                            label: blocker.message,
                          })
                        }
                        data-testid={`cockpit-blocker-${blocker.code}`}
                      >
                        <span className="font-medium">{blocker.message}</span>
                        <span className="mt-0.5 block text-[11px] font-semibold text-slate-500">Cliquer pour traiter →</span>
                      </button>
                    ) : (
                      <span className="text-sm font-medium text-slate-800">{blocker.message}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {canTreat ? (
            <Button
              type="button"
              size="sm"
              className="mt-3 gap-1.5 bg-slate-900 hover:bg-slate-800"
              onClick={() => handleTreat()}
              data-testid="cockpit-treat-now"
            >
              Traiter maintenant <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <p className="mt-3 text-xs font-semibold text-rose-700" data-testid="cockpit-treat-unavailable">
              Action de traitement indisponible sur cet écran.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
