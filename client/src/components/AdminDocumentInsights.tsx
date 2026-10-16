import React from "react";
import { trpc } from "@/lib/trpc";

/** Pilotage des pièces : motifs de renvoi les plus fréquents et délai moyen de vérification (90 derniers jours). */
export function AdminDocumentInsightsCard({ sessionToken }: { sessionToken: string }) {
  const query = trpc.adminDocumentInsights.stats.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false, staleTime: 60_000 });
  const data = query.data;
  if (!data || (data.totalRejected === 0 && data.averageVerificationHours === null)) return null;
  const top = data.reasons.slice(0, 5);
  const max = Math.max(1, ...top.map((reason) => reason.count));
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4" aria-labelledby="doc-insights-title" data-testid="document-insights">
      <h4 id="doc-insights-title" className="text-sm font-semibold text-slate-900">Pilotage des pièces · {data.windowDays} derniers jours</h4>
      <div className="mt-2 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs text-slate-500">Délai moyen de vérification</p>
          <p className="text-lg font-bold text-slate-900" data-testid="insight-average-hours">
            {data.averageVerificationHours === null ? "Non mesurable" : data.averageVerificationHours < 48 ? `${data.averageVerificationHours} h` : `${Math.round(data.averageVerificationHours / 24)} j`}
          </p>
          <p className="text-[11px] text-slate-500">sur {data.verifiedSampleSize} pièce(s) décidée(s)</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Pièces renvoyées : {data.totalRejected}</p>
          <ul className="mt-1 space-y-1" data-testid="insight-reasons">
            {top.map((reason) => (
              <li key={reason.code} className="text-xs text-slate-700">
                <div className="flex justify-between"><span>{reason.label}</span><span className="font-semibold">{reason.count}</span></div>
                <div className="h-1.5 rounded-full bg-slate-100" aria-hidden="true"><div className="h-full rounded-full bg-rose-500" style={{ width: `${Math.round((reason.count / max) * 100)}%` }} /></div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/** Signale les pièces de même catégorie et de même taille dans un dossier : indice, pas preuve. */
export function AdminDuplicateFilesNotice({ sessionToken, candidateId }: { sessionToken: string; candidateId: number }) {
  const enabled = Boolean(sessionToken) && candidateId > 0;
  const query = trpc.adminDocumentInsights.duplicates.useQuery({ sessionToken, candidateId }, { enabled, retry: false });
  const groups = query.data?.groups ?? [];
  if (!enabled || groups.length === 0) return null;
  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900" data-testid="duplicate-files-notice" aria-label="Pièces possiblement en double">
      <p className="font-semibold">Pièces possiblement envoyées en double</p>
      <ul className="mt-1 space-y-1">
        {groups.map((group) => (
          <li key={`${group.fileType}-${group.sizeBytes}`}>
            {group.fileType} : {group.fileNames.join(" · ")}
            {group.resentAfterRejection ? " — une pièce rejetée semble renvoyée sans modification." : ""}
          </li>
        ))}
      </ul>
      <p className="mt-1 text-amber-800">Rapprochement par catégorie et taille : à confirmer en ouvrant les pièces.</p>
    </section>
  );
}
