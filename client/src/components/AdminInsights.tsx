import { useState } from "react";
import { CheckCircle2, Mail, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";
import { trpc } from "@/lib/trpc";
import { SOURCE_LABELS, conversionRates } from "@shared/adminInsights";
import { formatXaf } from "@shared/openingFee";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Out = inferRouterOutputs<AppRouter>["adminInsights"];
type Section = "today" | "proofs" | "funnel" | "quality" | "delays" | "matching";

const SECTIONS: Array<{ id: Section; label: string }> = [
  { id: "today", label: "Ma journée" },
  { id: "proofs", label: "Preuves à valider" },
  { id: "funnel", label: "Entonnoir et rapport" },
  { id: "quality", label: "Qualité des données" },
  { id: "delays", label: "Délais et satisfaction" },
  { id: "matching", label: "Offres et profils" },
];
const SEVERITY_CLASS = { high: "bg-rose-100 text-rose-800", medium: "bg-amber-100 text-amber-900", low: "bg-slate-100 text-slate-700" } as const;
const frTime = (value: string) => new Date(value).toLocaleString("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const Counter = ({ label, value, tone }: { label: string; value: number; tone?: "alert" }) => (
  <div className={`rounded-lg border p-3 ${value > 0 && tone === "alert" ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white"}`}>
    <p className={`text-2xl font-black ${value > 0 && tone === "alert" ? "text-rose-700" : "text-slate-900"}`}>{value}</p>
    <p className="text-xs font-semibold text-slate-600">{label}</p>
  </div>
);

function TodayPanel({ sessionToken }: { sessionToken: string }) {
  const today = trpc.adminInsights.adminToday.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false, refetchInterval: 60_000 });
  const data = today.data as Out["adminToday"] | undefined;
  const [briefId, setBriefId] = useState<number | null>(null);
  const brief = trpc.remoteSupport.adminHandover.useQuery({ sessionToken, candidateId: briefId ?? 1 }, { enabled: briefId !== null, retry: false });
  return (
    <div className="space-y-4" data-testid="insights-today">
      {today.error && <p className="text-sm text-rose-700" role="alert">{today.error.message}</p>}
      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Counter label="Messages urgents sans réponse" value={data.counters.waitingUrgent} tone="alert" />
            <Counter label="Preuves de paiement à valider" value={data.counters.proofsToCheck} tone="alert" />
            <Counter label="Accusés refusés (14 j)" value={data.counters.declinedAcknowledgements} tone="alert" />
            <Counter label="Désactivations à valider" value={data.counters.sensitiveRequests} tone="alert" />
          </div>
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-base font-black text-slate-950">Rendez-vous des prochaines 24 h</h3>
            <ul className="mt-2 space-y-2">
              {data.appointments.map((slot) => (
                <li key={slot.id} className="flex flex-wrap items-center justify-between gap-2 text-sm" data-testid={`today-slot-${slot.id}`}>
                  <span><strong>{frTime(slot.startsAt)}</strong> — {slot.candidateName}</span>
                  {slot.candidateId && <Button type="button" size="sm" variant="outline" onClick={() => setBriefId(slot.candidateId)}>Préparer le rendez-vous</Button>}
                </li>
              ))}
              {data.appointments.length === 0 && <li className="text-sm text-slate-600">Aucun rendez-vous réservé.</li>}
            </ul>
            {briefId !== null && brief.data && <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs" data-testid="today-brief">{brief.data.summary}</pre>}
          </section>
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-base font-black text-slate-950">Mes actions à faire aujourd'hui ou en retard</h3>
            <ul className="mt-2 space-y-2">
              {data.actions.map((action) => (
                <li key={action.id} className="text-sm"><strong>{action.candidateName}</strong> — {action.action}{action.overdue && <span className="ml-2 rounded bg-rose-100 px-1.5 py-0.5 text-[11px] font-bold text-rose-800">En retard</span>}</li>
              ))}
              {data.actions.length === 0 && <li className="flex items-center gap-2 text-sm font-semibold text-emerald-800"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />Rien en retard.</li>}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

function ProofsPanel({ sessionToken }: { sessionToken: string }) {
  const utils = trpc.useUtils();
  const queue = trpc.adminInsights.adminProofQueue.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false });
  const [amounts, setAmounts] = useState<Record<number, string>>({});
  const [reasons, setReasons] = useState<Record<number, string>>({});
  const validate = trpc.adminInsights.adminValidateProof.useMutation({ onSuccess: () => { toast.success("Paiement validé : le compte peut maintenant être activé."); void utils.adminInsights.adminProofQueue.invalidate(); }, onError: (error) => toast.error(error.message) });
  const rows = (queue.data ?? []) as Out["adminProofQueue"];
  return (
    <div className="space-y-3" data-testid="insights-proofs">
      <p className="text-sm text-slate-700">Preuves envoyées par les candidats dont le paiement n'est pas encore justifié. Ouvrez la preuve, saisissez le montant réellement reçu : un écart avec le montant attendu pour le profil exige un motif.</p>
      {queue.error && <p className="text-sm text-rose-700" role="alert">{queue.error.message}</p>}
      {queue.data && rows.length === 0 && <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">Aucune preuve en attente.</p>}
      {rows.map((row) => {
        const typed = amounts[row.fileId];
        const amount = typed === undefined || typed === "" ? row.expectedAmount : Number(typed);
        const differs = Number.isFinite(amount) && amount !== row.expectedAmount;
        const reason = reasons[row.fileId] ?? "";
        return (
          <article key={row.fileId} className="rounded-lg border border-slate-200 bg-white p-3 text-sm" data-testid={`proof-${row.fileId}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-bold text-slate-900">{row.fullName} <span className="font-normal text-slate-500">· {row.email}</span></p>
              <span className="flex gap-1 text-[11px] font-bold">
                {row.ageDays >= 2 && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-900">Depuis {row.ageDays} j</span>}
                {row.alreadyActive && <span className="rounded bg-rose-100 px-1.5 py-0.5 text-rose-800">Dossier déjà actif</span>}
                {row.duplicateOf.length > 0 && <span className="rounded bg-violet-100 px-1.5 py-0.5 text-violet-800">Même fichier chez {row.duplicateOf.length} autre(s) compte(s)</span>}
              </span>
            </div>
            <p className="mt-1 text-slate-700">Montant attendu : <strong>{formatXaf(row.expectedAmount)}</strong>{row.url && <> · <a className="font-semibold text-blue-700 underline" href={row.url} target="_blank" rel="noopener noreferrer">Ouvrir la preuve</a></>}</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-[10rem_1fr_auto]">
              <Input type="number" inputMode="numeric" value={typed ?? ""} placeholder={String(row.expectedAmount)} onChange={(event) => setAmounts((current) => ({ ...current, [row.fileId]: event.target.value }))} aria-label="Montant reçu (XAF)" />
              {differs ? <Input value={reason} onChange={(event) => setReasons((current) => ({ ...current, [row.fileId]: event.target.value }))} placeholder="Motif de l'écart (obligatoire)" aria-label="Motif de l'écart" /> : <span />}
              <Button type="button" className="min-h-10" disabled={row.alreadyActive || validate.isPending || !Number.isInteger(amount) || (differs && reason.trim().length < 5)} onClick={() => validate.mutate({ sessionToken, fileId: row.fileId, confirmedAmount: amount, reason: reason.trim() || null })} data-testid={`proof-validate-${row.fileId}`}>Valider le paiement</Button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function FunnelPanel({ sessionToken }: { sessionToken: string }) {
  const [days, setDays] = useState(30);
  const funnel = trpc.adminInsights.adminFunnel.useQuery({ sessionToken, days }, { enabled: Boolean(sessionToken), retry: false });
  const report = trpc.adminInsights.adminSendWeeklyReport.useMutation({ onSuccess: (result) => toast.success(result.sent ? "Rapport envoyé à votre adresse e-mail" : "Rapport préparé, mais l'e-mail n'a pas pu partir"), onError: (error) => toast.error(error.message) });
  const data = funnel.data as Out["adminFunnel"] | undefined;
  const rates = data ? conversionRates(data.stages) : [];
  const max = Math.max(1, ...(data?.stages.map((stage) => stage.count) ?? [1]));
  return (
    <div className="space-y-4" data-testid="insights-funnel">
      <div className="flex flex-wrap items-center gap-2">
        {[7, 30, 90].map((value) => <Button key={value} type="button" size="sm" variant={days === value ? "default" : "outline"} onClick={() => setDays(value)}>{value} jours</Button>)}
        <Button type="button" size="sm" variant="outline" disabled={report.isPending} onClick={() => report.mutate({ sessionToken })}><Mail className="mr-1 h-3.5 w-3.5" aria-hidden="true" />M'envoyer le rapport hebdomadaire</Button>
      </div>
      {funnel.error && <p className="text-sm text-rose-700" role="alert">{funnel.error.message}</p>}
      {data && (
        <>
          <ul className="space-y-2">
            {data.stages.map((stage, index) => (
              <li key={stage.key} className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="flex items-baseline justify-between text-sm"><strong>{stage.label}</strong><span>{stage.count}{rates[index] !== null && <span className="ml-2 text-xs text-slate-500">{rates[index]} % de l'étape précédente</span>}</span></div>
                <div className="mt-2 h-2 rounded-full bg-slate-100" aria-hidden="true"><div className="h-2 rounded-full bg-blue-600" style={{ width: `${Math.max(2, Math.round((stage.count / max) * 100))}%` }} /></div>
              </li>
            ))}
          </ul>
          <div className="grid gap-3 sm:grid-cols-2">
            <section className="rounded-lg border border-slate-200 bg-white p-3 text-sm"><h3 className="font-black">Nouveaux comptes par source</h3><ul className="mt-1">{data.sources.map((item) => <li key={item.source} className="flex justify-between"><span>{SOURCE_LABELS[item.source] ?? item.source}</span><strong>{item.accounts}</strong></li>)}</ul></section>
            <section className="rounded-lg border border-slate-200 bg-white p-3 text-sm"><h3 className="font-black">Nouveaux comptes par destination</h3><ul className="mt-1">{data.destinations.map((item) => <li key={item.destination} className="flex justify-between"><span className="capitalize">{item.destination}</span><strong>{item.accounts}</strong></li>)}</ul></section>
          </div>
        </>
      )}
    </div>
  );
}

function QualityPanel({ sessionToken }: { sessionToken: string }) {
  const quality = trpc.adminInsights.adminDataQuality.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false });
  const data = quality.data as Out["adminDataQuality"] | undefined;
  return (
    <div className="space-y-3" data-testid="insights-quality">
      {quality.error && <p className="text-sm text-rose-700" role="alert">{quality.error.message}</p>}
      {data && <p className="text-sm text-slate-700">{data.scanned} comptes contrôlés.</p>}
      {data && data.groups.length === 0 && <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">Aucune incohérence détectée.</p>}
      {data?.groups.map((group) => (
        <details key={group.code} className="rounded-lg border border-slate-200 bg-white p-3" data-testid={`quality-${group.code}`}>
          <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 text-sm font-bold text-slate-900"><span>{group.label}</span><span className={`rounded px-2 py-0.5 text-xs ${SEVERITY_CLASS[group.severity]}`}>{group.count}</span></summary>
          <p className="mt-1 text-xs text-slate-600">{group.help}</p>
          <ul className="mt-2 space-y-1 text-sm">{group.examples.map((item, index) => <li key={`${item.candidateId}-${index}`}><strong>{item.fullName}</strong> <span className="text-slate-500">· COMPTE-{String(item.candidateId).padStart(5, "0")} · {item.detail}</span></li>)}</ul>
          {group.count > group.examples.length && <p className="mt-1 text-xs text-slate-500">{group.count - group.examples.length} autre(s) non affiché(s).</p>}
        </details>
      ))}
    </div>
  );
}

function DelaysPanel({ sessionToken }: { sessionToken: string }) {
  const times = trpc.adminInsights.adminResponseTimes.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false });
  const satisfaction = trpc.adminInsights.adminSatisfaction.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false });
  const t = times.data as Out["adminResponseTimes"] | undefined;
  const s = satisfaction.data as Out["adminSatisfaction"] | undefined;
  return (
    <div className="space-y-4" data-testid="insights-delays">
      {t && (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-base font-black text-slate-950">Délai de réponse aux messages (60 jours)</h3>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Counter label="Messages traités" value={t.answered} />
            <Counter label="Sans réponse actuellement" value={t.unanswered} tone="alert" />
            <div className="rounded-lg border border-slate-200 p-3"><p className="text-2xl font-black">{t.medianHours ?? "—"}{t.medianHours !== null && " h"}</p><p className="text-xs font-semibold text-slate-600">Délai médian</p></div>
            <div className="rounded-lg border border-slate-200 p-3"><p className={`text-2xl font-black ${t.within24hPercent !== null && t.within24hPercent < 80 ? "text-rose-700" : ""}`}>{t.within24hPercent ?? "—"}{t.within24hPercent !== null && " %"}</p><p className="text-xs font-semibold text-slate-600">Réponses en moins de {t.targetHours} h</p></div>
          </div>
          <ul className="mt-3 text-sm">{t.weeks.map((week) => <li key={week.weeksAgo} className="flex justify-between border-t border-slate-100 py-1"><span>{week.weeksAgo === 0 ? "Cette semaine" : `Il y a ${week.weeksAgo} sem.`}</span><span>{week.answered} traités · médiane {week.medianHours ?? "—"} h · {week.within24hPercent ?? "—"} % sous 24 h</span></li>)}</ul>
        </section>
      )}
      {s && (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-base font-black text-slate-950">Satisfaction des candidats</h3>
          <p className="mt-1 text-xs text-slate-600">Usage interne : ces réponses ne sont jamais publiées comme témoignages.</p>
          <div className="mt-2 grid grid-cols-3 gap-3"><Counter label="Réponses" value={s.responses} /><div className="rounded-lg border border-slate-200 p-3"><p className="text-2xl font-black">{s.average ?? "—"}</p><p className="text-xs font-semibold text-slate-600">Note moyenne /10</p></div><div className="rounded-lg border border-slate-200 p-3"><p className="text-2xl font-black">{s.nps ?? "—"}</p><p className="text-xs font-semibold text-slate-600">Indice de recommandation</p></div></div>
          <ul className="mt-3 space-y-1 text-sm">{s.recent.map((row) => <li key={row.id} className="border-t border-slate-100 py-1"><strong>{row.score}/10</strong> · {row.candidateName}{row.comment ? ` — « ${row.comment} »` : ""} <span className="text-xs text-slate-500">({row.milestone === "rdv" ? "rendez-vous" : "dossier"}, {new Date(row.createdAt).toLocaleDateString("fr-FR")})</span></li>)}</ul>
        </section>
      )}
    </div>
  );
}

function MatchingPanel({ sessionToken }: { sessionToken: string }) {
  const offers = trpc.adminInsights.adminMatchableOffers.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false });
  const [offerId, setOfferId] = useState<number | null>(null);
  const match = trpc.adminInsights.adminMatchOffer.useQuery({ sessionToken, offerId: offerId ?? 1 }, { enabled: offerId !== null, retry: false });
  return (
    <div className="space-y-3" data-testid="insights-matching">
      <p className="text-sm text-slate-700">Profils anonymisés, approuvés et consentis par le candidat, classés pour une offre publiée. C'est une aide à la décision : rien n'est envoyé automatiquement, la soumission passe par le circuit de placement habituel.</p>
      <select className="h-10 w-full rounded-md border border-slate-300 bg-white px-2 text-sm" aria-label="Offre publiée" value={offerId ?? ""} onChange={(event) => setOfferId(event.target.value ? Number(event.target.value) : null)}>
        <option value="">Choisir une offre publiée…</option>
        {(offers.data ?? []).map((offer) => <option key={offer.id} value={offer.id}>{offer.reference} · {offer.title} · {offer.countryName}</option>)}
      </select>
      {match.error && <p className="text-sm text-rose-700" role="alert">{match.error.message}</p>}
      {offerId !== null && match.data && match.data.candidates.length === 0 && <p className="rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-600">Aucun profil consenti ne correspond à cette offre pour l'instant.</p>}
      {match.data?.candidates.map((candidate) => (
        <article key={candidate.profileCode} className="rounded-lg border border-slate-200 bg-white p-3 text-sm" data-testid={`match-${candidate.profileCode}`}>
          <div className="flex items-center justify-between"><strong>{candidate.profileCode}</strong><span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">{candidate.score} / 100</span></div>
          <p className="mt-1 text-slate-700">{candidate.summary}</p>
          <ul className="mt-1 text-xs text-emerald-800">{candidate.reasons.map((reason) => <li key={reason}>✓ {reason}</li>)}</ul>
          {candidate.blockers.length > 0 && <ul className="mt-1 text-xs text-amber-900">{candidate.blockers.map((blocker) => <li key={blocker}><ShieldAlert className="mr-1 inline h-3 w-3" aria-hidden="true" />{blocker}</li>)}</ul>}
        </article>
      ))}
    </div>
  );
}

/** Pilotage avancé (administration) : ma journée, preuves de paiement, entonnoir et rapport, qualité des données, délais, satisfaction, rapprochement. */
export function AdminInsights({ sessionToken }: { sessionToken: string }) {
  const [section, setSection] = useState<Section>("today");
  return (
    <div className="space-y-4" data-testid="admin-insights">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Pilotage avancé">
        {SECTIONS.map((item) => <Button key={item.id} type="button" size="sm" role="tab" aria-selected={section === item.id} variant={section === item.id ? "default" : "outline"} onClick={() => setSection(item.id)} data-testid={`insights-tab-${item.id}`}>{item.label}</Button>)}
      </div>
      {section === "today" && <TodayPanel sessionToken={sessionToken} />}
      {section === "proofs" && <ProofsPanel sessionToken={sessionToken} />}
      {section === "funnel" && <FunnelPanel sessionToken={sessionToken} />}
      {section === "quality" && <QualityPanel sessionToken={sessionToken} />}
      {section === "delays" && <DelaysPanel sessionToken={sessionToken} />}
      {section === "matching" && <MatchingPanel sessionToken={sessionToken} />}
    </div>
  );
}
