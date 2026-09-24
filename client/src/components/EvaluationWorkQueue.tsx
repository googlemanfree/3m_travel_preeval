import React from "react";
import { AlertTriangle, CheckCircle2, Clock, MailQuestion } from "lucide-react";
import { WORK_QUEUE_LABELS, type WorkQueue, type WorkQueueKey } from "@/lib/adminWorkQueue";

const KEYS: WorkQueueKey[] = ["overdue", "due_today", "info_stale"];

const STYLES: Record<WorkQueueKey, { idle: string; active: string; icon: React.ReactNode }> = {
  overdue: { idle: "border-red-200 bg-red-50 text-red-900 hover:bg-red-100", active: "border-red-700 bg-red-700 text-white", icon: <AlertTriangle className="h-4 w-4" aria-hidden="true" /> },
  due_today: { idle: "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100", active: "border-amber-700 bg-amber-700 text-white", icon: <Clock className="h-4 w-4" aria-hidden="true" /> },
  info_stale: { idle: "border-violet-200 bg-violet-50 text-violet-900 hover:bg-violet-100", active: "border-violet-700 bg-violet-700 text-white", icon: <MailQuestion className="h-4 w-4" aria-hidden="true" /> },
};

const PREVIEW_LIMIT = 5;

/** Accès rapide à ce qui risque d'être oublié ; un clic filtre la liste ci-dessous. */
export default function EvaluationWorkQueue({ queue, active, onSelect, loading }: { queue: WorkQueue; active: WorkQueueKey | null; onSelect: (key: WorkQueueKey | null) => void; loading?: boolean }) {
  const total = queue.entries.length;
  const shown = queue.entries.filter((entry) => active === null || entry.key === active).slice(0, PREVIEW_LIMIT);
  return (
    <section aria-labelledby="work-queue-title" className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm" data-testid="evaluation-work-queue">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="work-queue-title" className="text-sm font-black text-slate-900">À traiter aujourd’hui{!loading && total > 0 ? ` · ${total}` : ""}</h2>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer les évaluations à traiter">
          {KEYS.map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={active === key}
              disabled={queue.counts[key] === 0}
              onClick={() => onSelect(active === key ? null : key)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition disabled:cursor-default disabled:opacity-50 ${active === key ? STYLES[key].active : STYLES[key].idle}`}
            >
              {STYLES[key].icon} {WORK_QUEUE_LABELS[key]} ({queue.counts[key]})
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <p className="mt-3 text-xs text-slate-500">Chargement des statuts de validation…</p>
      ) : total === 0 ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-emerald-800"><CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Rien d’en retard : aucune échéance dépassée, aucun complément sans réponse.</p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100 text-sm">
          {shown.map((entry) => (
            <li key={`${entry.key}-${entry.evaluationId}`} className="flex flex-wrap items-baseline justify-between gap-x-4 py-1.5">
              <span className="font-semibold text-slate-900">{entry.name}{entry.destination ? <span className="font-normal text-slate-500"> · {entry.destination}</span> : null}</span>
              <span className="text-xs text-slate-600">{entry.detail}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
