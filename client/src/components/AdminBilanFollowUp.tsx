import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { DECLINE_REASONS, type DeclineReason } from "@shared/evaluationDecision";
import { MIN_DESTINATION_SAMPLE } from "@shared/bilanFollowUp";
import { Button } from "@/components/ui/button";

const when = (value: string | null) => (value ? new Date(value).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "");
const reasonLabel = (reason: string | null) => (reason && reason in DECLINE_REASONS ? DECLINE_REASONS[reason as DeclineReason] : reason ? "Autre motif" : "");

/** Bilans envoyés sans réponse ou refusés : entonnoir, motifs, taux par destination, relance manuelle (une par 24 h) et paiement en deux versements. */
export function AdminBilanFollowUp({ sessionToken }: { sessionToken: string }) {
  const utils = trpc.useUtils();
  const query = trpc.bilanFollowUp.pending.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false, refetchOnWindowFocus: false });
  const refresh = () => void utils.bilanFollowUp.pending.invalidate();
  const remind = trpc.bilanFollowUp.remind.useMutation({
    onSuccess: (result) => { toast.success(result.emailSent ? "Relance envoyée (espace client + e-mail)" : "Relance envoyée dans l'espace client", { description: result.emailSent ? undefined : "L'e-mail n'est pas parti (préférences du candidat ou service indisponible)." }); refresh(); },
    onError: (error) => toast.error(error.message),
  });
  const installments = trpc.bilanFollowUp.proposeInstallments.useMutation({
    onSuccess: (result) => { toast.success("Paiement en deux versements proposé", { description: `${result.items[0].amount} puis ${result.items[1].amount} XAF — le candidat est prévenu.` }); refresh(); },
    onError: (error) => toast.error(error.message),
  });
  const data = query.data;
  const stats = data?.stats;
  const pct = (part: number, total: number) => (total > 0 ? `${Math.round((part / total) * 100)} %` : "—");
  return (
    <div className="space-y-4" data-testid="ops-followup">
      <p className="text-sm text-slate-700">Bilans envoyés sans réponse ou refusés. Aucune relance n'est automatique : chaque envoi est un clic de votre part, limité à une relance par 24 h et par dossier, et inscrit au journal.</p>
      {query.error && <p className="text-sm text-rose-700" role="alert">{query.error.message}</p>}
      {stats && (
        <>
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-5" data-testid="followup-funnel">
            {[
              { label: "Bilans envoyés", value: stats.sent, hint: "100 %" },
              { label: "E-mail ou bilan ouvert", value: stats.viewed, hint: pct(stats.viewed, stats.sent) },
              { label: "Ouverture demandée", value: stats.opening, hint: pct(stats.opening, stats.sent) },
              { label: "Frais payés", value: stats.paid, hint: pct(stats.paid, stats.sent) },
              { label: "Refusés", value: stats.declined, hint: pct(stats.declined, stats.sent) },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-slate-200 bg-white p-3"><dt className="text-xs text-slate-600">{item.label}</dt><dd className="text-xl font-black text-slate-900">{item.value}</dd><dd className="text-xs text-slate-500">{item.hint}</dd></div>
            ))}
          </dl>
          {stats.reasons.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white p-3" data-testid="followup-reasons">
              <p className="text-sm font-semibold text-slate-900">Pourquoi ils ne valident pas</p>
              <ul className="mt-1 space-y-0.5 text-sm text-slate-800">{stats.reasons.map((item) => <li key={item.reason}>{reasonLabel(item.reason)} — <strong>{item.count}</strong> ({pct(item.count, stats.declined)})</li>)}</ul>
            </div>
          )}
          {stats.byDestination.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white" data-testid="followup-destinations">
              <table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-600"><tr><th className="p-2">Destination</th><th className="p-2">Bilans</th><th className="p-2">Ouvertures</th><th className="p-2">Payés</th><th className="p-2">Taux d'ouverture</th></tr></thead>
                <tbody>{stats.byDestination.map((row) => <tr key={row.destination} className="border-t border-slate-100"><td className="p-2 font-medium">{row.destination}</td><td className="p-2">{row.sent}</td><td className="p-2">{row.opening}</td><td className="p-2">{row.paid}</td><td className="p-2">{row.ratePercent === null ? <span className="text-xs text-slate-500">échantillon trop faible (moins de {MIN_DESTINATION_SAMPLE})</span> : `${row.ratePercent} %`}</td></tr>)}</tbody></table>
            </div>
          )}
        </>
      )}
      {data && data.items.length === 0 && <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-900" data-testid="followup-empty">Aucun bilan en attente de réponse.</p>}
      {data && data.items.length > 0 && (
        <ul className="space-y-2" data-testid="followup-list">
          {data.items.map((item) => (
            <li key={item.id} className="rounded-lg border border-slate-200 bg-white p-3" data-testid={`followup-item-${item.id}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{item.fullName} <span className="text-xs font-normal text-slate-500">{item.dossierNumber}</span></p>
                  <p className="text-xs text-slate-600">{[item.destination, item.visaType].filter(Boolean).join(" · ")} · {item.daysSinceSent === null ? "date d'envoi inconnue" : item.daysSinceSent === 0 ? "envoyé aujourd'hui" : `envoyé il y a ${item.daysSinceSent} j`} · {item.opened ? "bilan ouvert" : "pas encore ouvert"}</p>
                  {item.state === "declined" && <p className="mt-1 text-sm text-amber-900"><strong>Refusé</strong> — {reasonLabel(item.reason)}{item.comment ? ` : « ${item.comment} »` : ""}</p>}
                  {item.lastReminderAt && <p className="text-xs text-slate-500">Dernière relance le {when(item.lastReminderAt)} ({item.reminderCount} au total)</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" disabled={!item.canRemind || remind.isPending} onClick={() => { if (window.confirm(`Relancer ${item.fullName} (notification + e-mail) ?`)) remind.mutate({ sessionToken, applicationId: item.id }); }} data-testid={`followup-remind-${item.id}`}>{item.canRemind ? "Relancer" : item.candidateId ? "Relancé il y a moins de 24 h" : "Pas de compte lié"}</Button>
                  <Button type="button" size="sm" variant="outline" disabled={installments.isPending || !item.candidateId} onClick={() => { if (window.confirm(`Proposer à ${item.fullName} de payer ${item.paymentAmount.toLocaleString("fr-FR")} XAF en deux versements ?`)) installments.mutate({ sessionToken, applicationId: item.id }); }} data-testid={`followup-installments-${item.id}`}>Proposer 2 versements</Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
