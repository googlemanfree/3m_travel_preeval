import { useState } from "react";
import { ChevronDown, ChevronRight, ClipboardList } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { trpc } from "@/lib/trpc";
import { CHANGE_KIND_LABELS, DESK_THRESHOLDS, type ChangeKind } from "@shared/flightFollowUps";
import { formatHours } from "@shared/delayStats";

// Libellés du comptoir (ceux de la file des demandes), pas ceux lus par le client.
const DESK_STATUS_LABELS: Record<string, string> = { pending_review: "À traiter", assigned: "Affectée", needs_info: "Informations requises", revalidated: "Tarif revalidé", awaiting_payment: "En attente de paiement" };

const stat = (label: string, value: number | null, count: number) => (
  <div className="rounded-xl bg-slate-50 p-3"><dt className="text-[11px] font-semibold text-slate-500">{label}</dt><dd className="text-xl font-black text-slate-950">{value === null ? "—" : formatHours(value)}</dd><p className="text-[10px] text-slate-500">{count} demande{count > 1 ? "s" : ""}{count > 0 && count < 5 ? " · indicatif" : ""}</p></div>
);

/**
 * Suivi du comptoir des vols : délais médians réels (depuis l'historique), demandes qui attendent une action, et demandes de modification
 * ou d'annulation des clients à traiter. Les seuils d'alerte sont internes : ce ne sont pas des engagements affichés au public.
 */
export default function FlightDeskOverview({ sessionToken, onOpen }: { sessionToken: string; onOpen?: (requestId: number) => void }) {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState(90);
  const query = trpc.flightFollowUp.deskOverview.useQuery({ sessionToken, days }, { enabled: Boolean(sessionToken), refetchInterval: 60_000, retry: 1 });
  const resolve = trpc.flightFollowUp.resolveChange.useMutation({
    onSuccess: (result) => { void utils.flightFollowUp.deskOverview.invalidate(); toast({ title: result.alreadyHandled ? "Déjà traitée" : "Demande traitée", description: result.notified ? "Le client a été prévenu par e-mail." : "Le client n’a pas pu être prévenu par e-mail : contactez-le." }); },
    onError: (error) => toast({ title: "Action impossible", description: error.message, variant: "destructive" }),
  });
  const data = query.data;
  const attention = (data?.stale.length ?? 0) + (data?.openChanges.length ?? 0);
  const pct = (part: number, whole: number) => (whole > 0 ? `${Math.round((part / whole) * 100)} %` : "—");

  return (
    <Card className="border-0 p-5 shadow-sm" data-testid="flight-desk-overview">
      <button type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 text-left">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-black text-slate-900"><ClipboardList className="h-5 w-5 text-blue-600" aria-hidden="true" />Suivi du comptoir</h2>
          <p className="mt-1 text-sm text-slate-600" data-testid="desk-summary">{query.isLoading ? "Chargement…" : query.error ? "Suivi indisponible pour le moment." : attention > 0 ? `${attention} élément${attention > 1 ? "s" : ""} demande${attention > 1 ? "nt" : ""} une action.` : "Rien en attente : tout est à jour."}</p>
        </div>
        {open ? <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" /> : <ChevronRight className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />}
      </button>

      {open && data && (
        <div className="mt-4 space-y-5">
          <dl className="grid gap-2 sm:grid-cols-3" data-testid="desk-stats">
            {stat("Première réponse (médiane)", data.stats.firstResponseMedianHours, data.stats.firstResponseCount)}
            {stat("Paiement confirmé (médiane)", data.stats.paymentApprovalMedianHours, data.stats.paymentApprovalCount)}
            {stat("Billet émis (médiane)", data.stats.issuanceMedianHours, data.stats.issuanceCount)}
          </dl>
          <div className="-mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
            <span>Mesurés depuis la création de la demande, d’après l’historique réel. Période :</span>
            <select aria-label="Période du suivi" value={days} onChange={(event) => setDays(Number(event.target.value))} className="rounded-md border border-slate-300 bg-white px-1.5 py-0.5 text-xs text-slate-800">{[30, 90, 365].map((value) => <option key={value} value={value}>{value} jours</option>)}</select>
          </div>

          <section aria-label="Entonnoir des demandes" data-testid="desk-funnel">
            <h3 className="text-sm font-black text-slate-900">Où les demandes s’arrêtent</h3>
            <table className="mt-2 w-full text-sm">
              <thead><tr className="border-b border-slate-200 text-left text-xs text-slate-500"><th className="py-1.5 font-semibold">Étape</th><th className="py-1.5 text-right font-semibold">Demandes</th><th className="py-1.5 text-right font-semibold">Part des demandes reçues</th></tr></thead>
              <tbody>
                {([["Demandes reçues", data.funnel.total.created], ["Tarif revalidé ou règlement demandé", data.funnel.total.quoted], ["Paiement confirmé", data.funnel.total.paid], ["Billet émis", data.funnel.total.issued], ["Annulées", data.funnel.total.cancelled]] as const).map(([label, count]) => (
                  <tr key={label} className="border-b border-slate-100" data-testid="funnel-row"><td className="py-1.5 text-slate-800">{label}</td><td className="py-1.5 text-right font-bold text-slate-950">{count}</td><td className="py-1.5 text-right text-slate-600">{label === "Demandes reçues" ? "" : pct(count, data.funnel.total.created)}</td></tr>
                ))}
              </tbody>
            </table>
            {data.funnel.total.created < 5 && <p className="mt-1 text-[11px] text-amber-800">Moins de 5 demandes sur la période : les pourcentages ne sont qu’indicatifs.</p>}
            {Object.keys(data.funnel.openByStatus).length > 0 && <p className="mt-2 text-xs text-slate-700" data-testid="funnel-open">En cours : {Object.entries(data.funnel.openByStatus).map(([status, count]) => `${count} ${DESK_STATUS_LABELS[status] ?? status}`).join(" · ")}.</p>}
            {data.funnel.months.length > 1 && (
              <table className="mt-3 w-full text-xs" data-testid="funnel-months">
                <thead><tr className="border-b border-slate-200 text-left text-slate-500"><th className="py-1 font-semibold">Mois</th><th className="py-1 text-right font-semibold">Reçues</th><th className="py-1 text-right font-semibold">Devis</th><th className="py-1 text-right font-semibold">Payées</th><th className="py-1 text-right font-semibold">Émises</th></tr></thead>
                <tbody>{data.funnel.months.slice(0, 12).map((month) => <tr key={month.month} className="border-b border-slate-100"><td className="py-1 font-mono">{month.month}</td><td className="py-1 text-right">{month.created}</td><td className="py-1 text-right">{month.quoted}</td><td className="py-1 text-right">{month.paid}</td><td className="py-1 text-right">{month.issued}</td></tr>)}</tbody>
              </table>
            )}
          </section>

          <section aria-label="Options de réservation" data-testid="desk-options">
            <h3 className="text-sm font-black text-slate-900">Options de réservation suivies</h3>
            {data.options.length === 0 ? <p className="mt-1 text-sm text-slate-600">Aucune échéance d’option saisie.</p> : (
              <ul className="mt-2 divide-y divide-slate-100">
                {data.options.map((option) => { const hoursLeft = (new Date(option.deadline).getTime() - Date.now()) / 3_600_000; return (
                  <li key={option.requestId} className="flex flex-wrap items-center gap-2 py-2 text-sm" data-testid="option-row">
                    <button type="button" onClick={() => onOpen?.(option.requestId)} className="font-mono font-bold text-blue-700 hover:underline">{option.requestRef}</button>
                    <span className="text-slate-800">{new Date(option.deadline).toLocaleString("fr-FR")}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${hoursLeft <= data.optionAlertHours ? "bg-rose-100 text-rose-900" : "bg-slate-100 text-slate-700"}`}>{hoursLeft <= 0 ? "expirée" : `dans ${Math.max(1, Math.round(hoursLeft))} h`}</span>
                  </li>
                ); })}
              </ul>
            )}
          </section>

          <section aria-label="Demandes à traiter" data-testid="desk-stale">
            <h3 className="text-sm font-black text-slate-900">À traiter maintenant</h3>
            {data.stale.length === 0 ? <p className="mt-1 text-sm text-slate-600">Aucune demande en retard (seuils internes : réponse {DESK_THRESHOLDS.firstResponseHours} h, paiement à vérifier {DESK_THRESHOLDS.paymentCheckHours} h).</p> : (
              <ul className="mt-2 divide-y divide-slate-100">
                {data.stale.map((item) => (
                  <li key={`${item.requestId}-${item.reason}`} className="flex flex-wrap items-center gap-2 py-2 text-sm" data-testid="stale-row">
                    <button type="button" onClick={() => onOpen?.(item.requestId)} className="font-mono font-bold text-blue-700 hover:underline">{item.requestRef}</button>
                    <span className="text-slate-800">{item.label}</span>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900">{item.hours} h</span>
                    <span className="text-xs text-slate-500">{item.assignedAgentEmail ? `Affectée à ${item.assignedAgentEmail}` : "Non affectée"}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-label="Demandes de modification" data-testid="desk-changes">
            <h3 className="text-sm font-black text-slate-900">Demandes de modification ou d’annulation</h3>
            {data.openChanges.length === 0 ? <p className="mt-1 text-sm text-slate-600">Aucune demande ouverte.</p> : (
              <ul className="mt-2 space-y-2">
                {data.openChanges.map((change) => (
                  <li key={change.historyId} className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm" data-testid="change-row">
                    <p><button type="button" onClick={() => onOpen?.(change.requestId)} className="font-mono font-bold text-blue-700 hover:underline">{change.requestRef}</button> · <strong>{CHANGE_KIND_LABELS[change.kind as ChangeKind] ?? "Autre demande"}</strong> · {new Date(change.createdAt).toLocaleString("fr-FR")}</p>
                    <p className="mt-1 whitespace-pre-line text-slate-800">{change.message}</p>
                    <button type="button" disabled={resolve.isPending} onClick={() => { const note = window.prompt("Réponse à envoyer au client (conditions de la compagnie, frais, nouvelle date…). Laissez vide pour simplement clore.") ?? null; if (note !== null) resolve.mutate({ sessionToken, requestId: change.requestId, historyId: change.historyId, note }); }} className="mt-2 min-h-10 rounded-lg bg-slate-900 px-3 text-xs font-black text-white disabled:opacity-60" data-testid="resolve-change">Marquer comme traitée</button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </Card>
  );
}
