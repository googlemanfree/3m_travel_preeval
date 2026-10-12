import React from "react";
import { CheckCircle2, ClipboardList, FilePlus2, Send } from "lucide-react";
import { PACK_QUEUE_LABELS, type PackQueueKey, type PackWorkQueue } from "@/lib/adminPackWorkQueue";

const KEYS: PackQueueKey[] = ["pack_ready", "pack_incomplete", "pack_missing"];

const STYLES: Record<PackQueueKey, { idle: string; active: string; icon: React.ReactNode }> = {
  pack_ready: {
    idle: "border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100",
    active: "border-emerald-700 bg-emerald-700 text-white",
    icon: <Send className="h-4 w-4" aria-hidden="true" />,
  },
  pack_incomplete: {
    idle: "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100",
    active: "border-amber-700 bg-amber-700 text-white",
    icon: <ClipboardList className="h-4 w-4" aria-hidden="true" />,
  },
  pack_missing: {
    idle: "border-sky-200 bg-sky-50 text-sky-900 hover:bg-sky-100",
    active: "border-sky-700 bg-sky-700 text-white",
    icon: <FilePlus2 className="h-4 w-4" aria-hidden="true" />,
  },
};

const PREVIEW_LIMIT = 5;

/** File opérable des packs candidature admin — un clic filtre la liste ; aucune action automatique. */
export default function ApplicationPackWorkQueue({
  queue,
  active,
  onSelect,
}: {
  queue: PackWorkQueue;
  active: PackQueueKey | null;
  onSelect: (key: PackQueueKey | null) => void;
}) {
  const total = queue.entries.length;
  const shown = queue.entries.filter((entry) => active === null || entry.key === active).slice(0, PREVIEW_LIMIT);
  return (
    <section
      aria-labelledby="pack-work-queue-title"
      className="mb-4 rounded-xl border border-sky-200 bg-gradient-to-br from-white to-sky-50/40 p-4 shadow-sm"
      data-testid="application-pack-work-queue"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="pack-work-queue-title" className="text-sm font-black text-sky-950">
            Packs candidature{total > 0 ? ` · ${total}` : ""}
          </h2>
          <p className="mt-0.5 text-[11px] text-slate-600">Automatisation de priorisation — l’admin prépare et postule ; rien n’est envoyé sans validation.</p>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer par état du pack candidature">
          {KEYS.map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={active === key}
              disabled={queue.counts[key] === 0}
              onClick={() => onSelect(active === key ? null : key)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition disabled:cursor-default disabled:opacity-50 ${active === key ? STYLES[key].active : STYLES[key].idle}`}
            >
              {STYLES[key].icon} {PACK_QUEUE_LABELS[key]} ({queue.counts[key]})
            </button>
          ))}
        </div>
      </div>
      {total === 0 ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-slate-600">
          <CheckCircle2 className="h-4 w-4 text-slate-400" aria-hidden="true" />
          Aucun pack à prioriser : pas de CV source exploitable ou dossiers déjà convertis.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-sky-100 text-sm">
          {shown.map((entry) => (
            <li key={`${entry.key}-${entry.evaluationId}`} className="flex flex-wrap items-baseline justify-between gap-x-4 py-1.5">
              <span className="font-semibold text-slate-900">
                {entry.name}
                {entry.destination ? <span className="font-normal text-slate-500"> · {entry.destination}</span> : null}
              </span>
              <span className="text-xs text-slate-600">{entry.detail}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
