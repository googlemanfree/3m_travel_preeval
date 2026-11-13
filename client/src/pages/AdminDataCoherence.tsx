import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { getAdminSessionToken } from "@/lib/adminSession";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const TONE: Record<string, string> = { erreur: "bg-red-100 text-red-900", avertissement: "bg-amber-100 text-amber-900", info: "bg-slate-100 text-slate-800" };
const SOURCE: Record<string, string> = { evaluation: "Évaluation", candidat: "Compte candidat", dossier: "Dossier" };

export default function AdminDataCoherence() {
  const sessionToken = getAdminSessionToken();
  const [, setLocation] = useLocation();
  const enabled = Boolean(sessionToken);
  if (!sessionToken) setTimeout(() => setLocation("/admin/login"), 0);
  const utils = trpc.useUtils();
  const report = trpc.adminDataCoherence.report.useQuery({ sessionToken }, { enabled, retry: false });
  const [showPreview, setShowPreview] = useState(false);
  const preview = trpc.adminDataCoherence.preview.useQuery({ sessionToken }, { enabled: enabled && showPreview, retry: false });
  const batches = trpc.adminDataCoherence.batches.useQuery({ sessionToken }, { enabled, retry: false });
  const refresh = () => { void utils.adminDataCoherence.report.invalidate(); void utils.adminDataCoherence.preview.invalidate(); void utils.adminDataCoherence.batches.invalidate(); };
  const apply = trpc.adminDataCoherence.applyBatch.useMutation({ onSuccess: (result) => { toast.success(`${result.applied} correction(s) appliquée(s) — lot ${result.batchId.slice(0, 8)}.`); setShowPreview(false); refresh(); }, onError: (error) => toast.error(error.message) });
  const revert = trpc.adminDataCoherence.revert.useMutation({ onSuccess: (result) => { toast.success(`${result.restored} valeur(s) restaurée(s), ${result.skipped} laissée(s) (modifiées depuis).`); refresh(); }, onError: (error) => toast.error(error.message) });

  const data = report.data;
  return (
    <main className="mx-auto max-w-6xl space-y-5 px-4 py-6" aria-labelledby="coherence-title">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 id="coherence-title" className="text-2xl font-black text-slate-950">Cohérence des données</h1>
          <p className="mt-1 text-sm text-slate-600">Pays, zone, type de visa, projet, âge, expérience, diplôme et coordonnées. Les corrections automatiques ne touchent que le pays, la zone et le code de visa des évaluations ; tout le reste est signalé pour correction humaine.</p>
        </div>
        <Button variant="outline" onClick={refresh}><RefreshCw className="mr-2 h-4 w-4" />Actualiser</Button>
      </header>

      {report.isLoading && <p className="text-sm text-slate-500">Analyse en cours…</p>}
      {report.error && <Card className="p-4 text-sm text-red-800" role="alert">Analyse impossible : {report.error.message}</Card>}

      {data && (
        <>
          <Card className="grid gap-3 p-4 text-sm sm:grid-cols-4">
            <div><p className="text-xs text-slate-500">Évaluations analysées</p><p className="text-2xl font-black">{data.scanned.evaluations}</p></div>
            <div><p className="text-xs text-slate-500">Comptes analysés</p><p className="text-2xl font-black">{data.scanned.candidates}</p></div>
            <div><p className="text-xs text-slate-500">Dossiers analysés</p><p className="text-2xl font-black">{data.scanned.applications}</p></div>
            <div><p className="text-xs text-slate-500">Fiches avec anomalie</p><p className="text-2xl font-black">{data.rowsWithIssues}</p></div>
          </Card>

          <Card className="space-y-3 p-4">
            <h2 className="font-bold text-slate-950">Anomalies par type</h2>
            {data.byCode.length === 0 && <p className="flex items-center gap-2 text-sm text-emerald-800"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />Aucune anomalie détectée.</p>}
            <ul className="space-y-3">
              {data.byCode.map((entry) => (
                <li key={entry.code} className="rounded-md border border-slate-200 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900">{entry.label}</p>
                    <span className="flex items-center gap-2"><Badge className={TONE[entry.severity]}>{entry.severity}</Badge><strong>{entry.count}</strong></span>
                  </div>
                  <ul className="mt-2 space-y-1 text-xs text-slate-600">
                    {entry.samples.map((sample, index) => <li key={index}>{SOURCE[sample.source] ?? sample.source} n° {sample.id}{sample.reference ? ` (${sample.reference})` : ""} — {sample.message}</li>)}
                  </ul>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="space-y-3 p-4">
            <h2 className="font-bold text-slate-950">Corrections automatiques proposées</h2>
            <p className="text-sm text-slate-700">{data.fixable.changes} correction(s) sur {data.fixable.rows} évaluation(s) : orthographe du pays, zone de destination et code de visa déduits du pays et du projet.</p>
            {data.fixable.changes > 0 && <Button variant="outline" onClick={() => setShowPreview(true)}>Voir l'aperçu</Button>}
            {showPreview && preview.data && (
              <div className="space-y-2">
                <ul className="max-h-72 space-y-1 overflow-auto text-xs" aria-label="Aperçu des corrections">
                  {preview.data.shown.map((change, index) => <li key={index}>Évaluation n° {change.rowId} · {change.field} : « {change.oldValue ?? "vide"} » → « {change.newValue} »</li>)}
                </ul>
                {preview.data.truncated && <p className="flex items-center gap-1 text-xs text-amber-800"><AlertTriangle className="h-3 w-3" aria-hidden="true" />Aperçu limité à 200 lignes sur {preview.data.total}.</p>}
                <Button onClick={() => { if (window.confirm(`Appliquer ${preview.data!.total} correction(s) ? Elles sont journalisées et annulables.`)) apply.mutate({ sessionToken, expectedChanges: preview.data!.total, confirm: "APPLIQUER" }); }} disabled={apply.isPending}>Appliquer les {preview.data.total} corrections</Button>
              </div>
            )}
          </Card>

          <Card className="space-y-2 p-4">
            <h2 className="font-bold text-slate-950">Lots appliqués</h2>
            {(batches.data ?? []).length === 0 && <p className="text-sm text-slate-600">Aucun lot appliqué.</p>}
            <ul className="space-y-2 text-sm">
              {(batches.data ?? []).map((batch) => (
                <li key={batch.batchId} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 p-2">
                  <span>{new Date(batch.createdAt).toLocaleString("fr-FR")} · {batch.actor} · {batch.changes} correction(s){batch.reverted >= batch.changes ? " · annulé" : batch.reverted > 0 ? ` · ${batch.reverted} annulée(s)` : ""}</span>
                  {batch.reverted < batch.changes && <Button size="sm" variant="outline" onClick={() => { if (window.confirm("Annuler ce lot et restaurer les anciennes valeurs (sauf celles modifiées depuis) ?")) revert.mutate({ sessionToken, batchId: batch.batchId, confirm: "ANNULER" }); }}>Annuler ce lot</Button>}
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </main>
  );
}
