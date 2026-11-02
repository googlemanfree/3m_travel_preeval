import React from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

const tone = { high: "border-rose-200 bg-rose-50", medium: "border-amber-200 bg-amber-50", info: "border-slate-200 bg-slate-50" } as const;

/** Passage en revue de tous les dossiers : incohérences repérées, avec correction en un clic pour celles qui se corrigent sans risque. */
export function AdminConsistency({ sessionToken }: { sessionToken: string }) {
  const utils = trpc.useUtils();
  const query = trpc.consistency.scan.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false, refetchOnWindowFocus: false });
  const fix = trpc.consistency.fix.useMutation({
    onSuccess: (result) => { toast.success(`${result.fixed} dossier(s) corrigé(s)`); void utils.consistency.scan.invalidate(); },
    onError: (error) => toast.error(error.message),
  });
  const data = query.data;
  const total = data?.issues.reduce((sum, issue) => sum + (issue.severity === "info" ? 0 : issue.count), 0) ?? 0;
  return (
    <div className="space-y-3" data-testid="ops-consistency">
      <p className="text-sm text-slate-700">Tous les dossiers sont parcourus (en ligne et agence). Une correction automatique n'est proposée que si elle ne touche ni pièces, ni paiements, ni messages.</p>
      {query.error && <p className="text-sm text-rose-700" role="alert">{query.error.message}</p>}
      {data && (
        <>
          <p className={`rounded-lg border p-3 text-sm font-semibold ${total === 0 ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-950"}`} data-testid="consistency-summary">{data.checked} dossier(s) contrôlé(s) — {total === 0 ? "aucune incohérence à traiter." : `${total} incohérence(s) à traiter.`}</p>
          <ul className="space-y-2">
            {data.issues.map((issue) => (
              <li key={issue.code} className={`rounded-lg border p-3 ${tone[issue.severity]}`} data-testid={`consistency-${issue.code}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1"><p className="text-sm font-bold text-slate-900">{issue.label} <span className="font-black">({issue.count})</span></p><p className="text-xs text-slate-700">{issue.explanation}</p></div>
                  {issue.fixable && issue.count > 0 && <Button type="button" size="sm" disabled={fix.isPending} onClick={() => { if (window.confirm(`Corriger ${issue.count} dossier(s) ?`)) fix.mutate({ sessionToken, target: "bilan_sent_status_mismatch" }); }} data-testid={`consistency-fix-${issue.code}`}>Corriger</Button>}
                </div>
                {issue.count > 0 && <ul className="mt-2 space-y-0.5 text-xs text-slate-800">{issue.rows.slice(0, 8).map((row) => <li key={`${issue.code}-${row.id}`}><strong>{row.label}</strong> — {row.detail}</li>)}{issue.count > 8 && <li className="text-slate-500">… et {issue.count - 8} autre(s)</li>}</ul>}
              </li>
            ))}
          </ul>
          <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm" data-testid="consistency-activation">
            <p className="font-semibold text-slate-900">Activations sans preuve de paiement</p>
            <p className="text-xs text-slate-600">{data.activationGuard} Vous pouvez lancer le retrait tout de suite (super administrateur).</p>
            <Button type="button" size="sm" variant="outline" className="mt-2" disabled={fix.isPending} onClick={() => { if (window.confirm("Retirer maintenant l'activation des comptes sans preuve de paiement ? (réactivables)")) fix.mutate({ sessionToken, target: "activations_without_payment" }); }} data-testid="consistency-fix-activations">Retirer maintenant</Button>
          </div>
        </>
      )}
    </div>
  );
}
