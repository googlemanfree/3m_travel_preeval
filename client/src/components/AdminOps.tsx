import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";
import { trpc } from "@/lib/trpc";
import { OUTCOME_LABELS, MIN_OUTCOME_SAMPLE, type OutcomeKind } from "@shared/adminOps";
import { formatXaf } from "@shared/openingFee";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Out = inferRouterOutputs<AppRouter>["adminOps"];
type Section = "checks" | "schedule" | "outcomes" | "assign" | "health";
const SECTIONS: Array<{ id: Section; label: string }> = [
  { id: "checks", label: "Pièces et échéances" },
  { id: "schedule", label: "Échéancier de paiement" },
  { id: "outcomes", label: "Résultats réels" },
  { id: "assign", label: "Affectation" },
  { id: "health", label: "Santé du système" },
];
const selectClass = "mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-2 text-sm";
const Field = ({ label, children }: { label: string; children: ReactNode }) => <label className="block text-xs font-semibold text-slate-700">{label}{children}</label>;
type Picked = { id: number; fullName: string; email: string; phone: string | null };

function CandidatePicker({ sessionToken, picked, onPick }: { sessionToken: string; picked: Picked | null; onPick: (value: Picked | null) => void }) {
  const [search, setSearch] = useState("");
  const found = trpc.remoteSupport.adminFindCandidate.useQuery({ sessionToken, search }, { enabled: Boolean(sessionToken) && search.trim().length >= 2 && !picked, retry: false });
  if (picked) return <p className="mt-1 flex items-center justify-between gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950"><span><strong>{picked.fullName}</strong> · {picked.email}</span><Button type="button" size="sm" variant="ghost" onClick={() => onPick(null)}>Changer</Button></p>;
  return (
    <div>
      <Input className="mt-1" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nom ou e-mail du candidat" aria-label="Rechercher un candidat" />
      <ul className="mt-1 space-y-1">{(found.data ?? []).map((row) => <li key={row.id}><button type="button" className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-sm hover:bg-slate-50" onClick={() => onPick(row)}>{row.fullName} <span className="text-slate-500">· {row.email}</span></button></li>)}</ul>
    </div>
  );
}

function ChecksPanel({ sessionToken }: { sessionToken: string }) {
  const checks = trpc.adminOps.adminDocumentChecks.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false });
  const due = trpc.adminOps.adminScheduleList.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false });
  const notifyPassport = trpc.adminOps.adminNotifyPassport.useMutation({ onSuccess: (result) => toast.success(result.emailSent ? "Candidat prévenu par e-mail et dans son espace" : "Candidat prévenu dans son espace (e-mail non envoyé)"), onError: (error) => toast.error(error.message) });
  const data = checks.data as Out["adminDocumentChecks"] | undefined;
  const dueItems = ((due.data as Out["adminScheduleList"] | undefined)?.items ?? []);
  return (
    <div className="space-y-4" data-testid="ops-checks">
      <p className="text-sm text-slate-700">Contrôle des passeports saisis par les agents (validité insuffisante, nom ou date de naissance différents de la fiche), offres qui se terminent dans 7 jours et échéances de paiement proches. Un signalement est une aide : l'agent décide.</p>
      {checks.error && <p className="text-sm text-rose-700" role="alert">{checks.error.message}</p>}
      {data && (
        <>
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-base font-black text-slate-950">Passeports à surveiller ({data.passports.length}) <span className="text-xs font-normal text-slate-500">· {data.checked} contrôlés</span></h3>
            <ul className="mt-2 space-y-2">
              {data.passports.map((item) => (
                <li key={item.candidateId} className="flex flex-wrap items-center justify-between gap-2 text-sm" data-testid={`passport-${item.candidateId}`}>
                  <span><strong>{item.fullName}</strong> — <span className={item.status === "expired" ? "font-bold text-rose-700" : "text-amber-900"}>{item.message}</span></span>
                  <Button type="button" size="sm" variant="outline" disabled={notifyPassport.isPending} onClick={() => notifyPassport.mutate({ sessionToken, candidateId: item.candidateId })}>Prévenir le candidat</Button>
                </li>
              ))}
              {data.passports.length === 0 && <li className="text-sm font-semibold text-emerald-800">Aucun passeport à risque parmi ceux saisis.</li>}
            </ul>
          </section>
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-base font-black text-slate-950">Identité différente de la fiche ({data.discrepancies.length})</h3>
            <ul className="mt-2 space-y-1 text-sm">{data.discrepancies.map((item) => <li key={item.candidateId}><strong>{item.fullName}</strong> <span className="text-slate-500">· COMPTE-{String(item.candidateId).padStart(5, "0")}</span><ul className="ml-4 list-disc text-xs text-slate-700">{item.items.map((message) => <li key={message}>{message}</li>)}</ul></li>)}{data.discrepancies.length === 0 && <li className="font-semibold text-emerald-800">Aucun écart détecté.</li>}</ul>
          </section>
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-base font-black text-slate-950">Offres qui se terminent dans 7 jours ({data.offersClosingSoon.length})</h3>
            <ul className="mt-2 space-y-1 text-sm">{data.offersClosingSoon.map((offer) => <li key={offer.id}>{offer.reference} · {offer.title} — jusqu'au {offer.deadline ? new Date(offer.deadline).toLocaleDateString("fr-FR") : "?"}</li>)}{data.offersClosingSoon.length === 0 && <li className="text-slate-600">Aucune.</li>}</ul>
          </section>
        </>
      )}
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-base font-black text-slate-950">Échéances de paiement dans les 14 jours ou en retard ({dueItems.length})</h3>
        <ul className="mt-2 space-y-1 text-sm">{dueItems.map((item) => <li key={item.id}><strong>{item.candidateName}</strong> — {item.label} · {formatXaf(item.amount, item.currency)} · {new Date(item.dueOn).toLocaleDateString("fr-FR")}{item.overdue && <span className="ml-2 rounded bg-rose-100 px-1.5 py-0.5 text-[11px] font-bold text-rose-800">En retard</span>}</li>)}{dueItems.length === 0 && <li className="text-slate-600">Aucune.</li>}</ul>
      </section>
    </div>
  );
}

function SchedulePanel({ sessionToken }: { sessionToken: string }) {
  const utils = trpc.useUtils();
  const [picked, setPicked] = useState<Picked | null>(null);
  const [rows, setRows] = useState([{ label: "Acompte", amount: "", dueOn: "" }]);
  const list = trpc.adminOps.adminScheduleList.useQuery({ sessionToken, candidateId: picked?.id }, { enabled: Boolean(sessionToken) && Boolean(picked), retry: false });
  const refresh = () => { void utils.adminOps.adminScheduleList.invalidate(); };
  const create = trpc.adminOps.adminScheduleCreate.useMutation({ onSuccess: () => { toast.success("Échéancier enregistré"); setRows([{ label: "Acompte", amount: "", dueOn: "" }]); refresh(); }, onError: (error) => toast.error(error.message) });
  const setStatus = trpc.adminOps.adminScheduleSetStatus.useMutation({ onSuccess: () => { toast.success("Échéance mise à jour"); refresh(); }, onError: (error) => toast.error(error.message) });
  const remind = trpc.adminOps.adminScheduleRemind.useMutation({ onSuccess: (result) => toast.success(result.emailSent ? "Rappel envoyé" : "Rappel enregistré dans l'espace du candidat"), onError: (error) => toast.error(error.message) });
  const data = list.data as Out["adminScheduleList"] | undefined;
  const valid = picked && rows.every((row) => row.label.trim().length >= 2 && Number.isInteger(Number(row.amount)) && Number(row.amount) >= 100 && /^\d{4}-\d{2}-\d{2}$/.test(row.dueOn));
  const markPaid = (id: number) => {
    const paidOn = window.prompt("Date de réception (AAAA-MM-JJ) :", new Date().toISOString().slice(0, 10));
    const note = paidOn ? window.prompt("Référence du paiement ou de la preuve :") : null;
    if (paidOn && note) setStatus.mutate({ sessionToken, id, status: "paid", paidOn, note });
  };
  return (
    <div className="space-y-4" data-testid="ops-schedule">
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-base font-black text-slate-950">Échéancier d'un candidat</h3>
        <p className="mt-1 text-sm text-slate-700">Vous saisissez les échéances (libellé, montant, date) : aucune règle n'est imposée. Le candidat voit son échéancier dans son espace ; un paiement n'est « reçu » que par vous, avec sa date et sa référence.</p>
        <div className="mt-3"><Field label="Candidat"><CandidatePicker sessionToken={sessionToken} picked={picked} onPick={setPicked} /></Field></div>
        {picked && (
          <>
            <div className="mt-3 space-y-2">
              {rows.map((row, index) => (
                <div key={index} className="grid gap-2 sm:grid-cols-[1fr_9rem_10rem_auto]">
                  <Input value={row.label} aria-label={`Libellé ${index + 1}`} onChange={(event) => setRows((current) => current.map((item, position) => (position === index ? { ...item, label: event.target.value } : item)))} />
                  <Input type="number" inputMode="numeric" value={row.amount} placeholder="Montant XAF" aria-label={`Montant ${index + 1}`} onChange={(event) => setRows((current) => current.map((item, position) => (position === index ? { ...item, amount: event.target.value } : item)))} />
                  <Input type="date" value={row.dueOn} aria-label={`Échéance ${index + 1}`} onChange={(event) => setRows((current) => current.map((item, position) => (position === index ? { ...item, dueOn: event.target.value } : item)))} />
                  {rows.length > 1 && <Button type="button" size="sm" variant="ghost" onClick={() => setRows((current) => current.filter((_, position) => position !== index))}>Retirer</Button>}
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" disabled={rows.length >= 12} onClick={() => setRows((current) => [...current, { label: `Échéance ${current.length + 1}`, amount: "", dueOn: "" }])}>Ajouter une échéance</Button>
              <Button type="button" className="min-h-10" disabled={!valid || create.isPending} onClick={() => picked && create.mutate({ sessionToken, candidateId: picked.id, items: rows.map((row) => ({ label: row.label.trim(), amount: Number(row.amount), dueOn: row.dueOn })) })} data-testid="schedule-create">Enregistrer l'échéancier</Button>
            </div>
          </>
        )}
      </section>
      {data?.summary && <p className="text-sm text-slate-800">Total {formatXaf(data.summary.total)} · reçu {formatXaf(data.summary.paid)} · reste {formatXaf(data.summary.remaining)}{data.summary.overdueCount > 0 && <strong className="ml-2 text-rose-700">{data.summary.overdueCount} en retard ({formatXaf(data.summary.overdueAmount)})</strong>}</p>}
      <ul className="space-y-2">
        {(data?.items ?? []).map((item) => (
          <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm" data-testid={`schedule-${item.id}`}>
            <span><strong>{item.label}</strong> · {formatXaf(item.amount, item.currency)} · {new Date(item.dueOn).toLocaleDateString("fr-FR")} · <em>{{ pending: "à régler", paid: `reçu le ${item.paidOn ? new Date(item.paidOn).toLocaleDateString("fr-FR") : ""}`, waived: "dispensé", cancelled: "annulé" }[item.status]}</em>{item.overdue && <span className="ml-2 rounded bg-rose-100 px-1.5 py-0.5 text-[11px] font-bold text-rose-800">En retard</span>}</span>
            <span className="flex flex-wrap gap-1">
              {item.status === "pending" && <><Button type="button" size="sm" onClick={() => markPaid(item.id)}>Reçu</Button><Button type="button" size="sm" variant="outline" onClick={() => remind.mutate({ sessionToken, id: item.id })}>Rappeler</Button><Button type="button" size="sm" variant="ghost" onClick={() => { const note = window.prompt("Motif de la dispense :"); if (note) setStatus.mutate({ sessionToken, id: item.id, status: "waived", note }); }}>Dispenser</Button><Button type="button" size="sm" variant="ghost" onClick={() => setStatus.mutate({ sessionToken, id: item.id, status: "cancelled", note: null })}>Annuler</Button></>}
              {item.status !== "pending" && <Button type="button" size="sm" variant="ghost" onClick={() => { if (window.confirm("Remettre cette échéance « à régler » ?")) setStatus.mutate({ sessionToken, id: item.id, status: "pending", note: null }); }}>Rétablir</Button>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function OutcomesPanel({ sessionToken }: { sessionToken: string }) {
  const utils = trpc.useUtils();
  const outcomes = trpc.adminOps.adminOutcomes.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false });
  const [picked, setPicked] = useState<Picked | null>(null);
  const [destination, setDestination] = useState("");
  const [visaType, setVisaType] = useState("");
  const [outcome, setOutcome] = useState<OutcomeKind>("accepted");
  const [decidedOn, setDecidedOn] = useState("");
  const [reason, setReason] = useState("");
  const refresh = () => { void utils.adminOps.adminOutcomes.invalidate(); };
  const record = trpc.adminOps.adminRecordOutcome.useMutation({ onSuccess: () => { toast.success("Résultat enregistré"); setPicked(null); setReason(""); refresh(); }, onError: (error) => toast.error(error.message) });
  const voidOutcome = trpc.adminOps.adminVoidOutcome.useMutation({ onSuccess: () => { toast.success("Saisie annulée"); refresh(); }, onError: (error) => toast.error(error.message) });
  const data = outcomes.data as Out["adminOutcomes"] | undefined;
  const ready = picked && destination.trim().length >= 2 && visaType.trim().length >= 2 && (outcome !== "refused" || reason.trim().length >= 3);
  return (
    <div className="space-y-4" data-testid="ops-outcomes">
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-base font-black text-slate-950">Enregistrer l'issue d'un dossier</h3>
        <p className="mt-1 text-sm text-slate-700">Base honnête pour mesurer les résultats : seules les décisions réelles comptent. Aucun pourcentage n'est calculé avant {MIN_OUTCOME_SAMPLE} décisions par destination et visa.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Candidat"><CandidatePicker sessionToken={sessionToken} picked={picked} onPick={setPicked} /></Field>
          <Field label="Issue"><select className={selectClass} value={outcome} onChange={(event) => setOutcome(event.target.value as OutcomeKind)}>{(Object.keys(OUTCOME_LABELS) as OutcomeKind[]).map((key) => <option key={key} value={key}>{OUTCOME_LABELS[key]}</option>)}</select></Field>
          <Field label="Destination"><Input className="mt-1" value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="Canada" /></Field>
          <Field label="Type de visa"><Input className="mt-1" value={visaType} onChange={(event) => setVisaType(event.target.value)} placeholder="Travail" /></Field>
          <Field label="Date de décision (facultatif)"><Input className="mt-1" type="date" value={decidedOn} onChange={(event) => setDecidedOn(event.target.value)} /></Field>
          {outcome === "refused" && <Field label="Motif du refus (obligatoire)"><Input className="mt-1" value={reason} onChange={(event) => setReason(event.target.value)} /></Field>}
        </div>
        <Button type="button" className="mt-3 min-h-10" disabled={!ready || record.isPending} onClick={() => picked && record.mutate({ sessionToken, candidateId: picked.id, destination: destination.trim(), visaType: visaType.trim(), outcome, decidedOn: decidedOn || null, refusalReason: reason.trim() || null })} data-testid="outcome-save">Enregistrer</Button>
      </section>
      {data && (
        <>
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white"><table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-600"><tr><th className="p-2">Destination</th><th className="p-2">Visa</th><th className="p-2">Accordés</th><th className="p-2">Refusés</th><th className="p-2">Retirés</th><th className="p-2">Taux d'accord</th></tr></thead>
            <tbody>{data.stats.map((stat) => <tr key={`${stat.destination}-${stat.visaType}`} className="border-t border-slate-100" data-testid={`outcome-stat-${stat.destination}`}><td className="p-2 font-semibold">{stat.destination}</td><td className="p-2">{stat.visaType}</td><td className="p-2">{stat.accepted}</td><td className="p-2">{stat.refused}</td><td className="p-2">{stat.withdrawn}</td><td className="p-2">{stat.ratePercent !== null ? `${stat.ratePercent} %` : <span className="text-xs text-slate-500">effectif trop faible ({stat.decided}/{MIN_OUTCOME_SAMPLE})</span>}</td></tr>)}</tbody>
          </table></div>
          {data.reasons.length > 0 && <p className="text-sm text-slate-800"><strong>Motifs de refus les plus fréquents :</strong> {data.reasons.map((item) => `${item.reason} (${item.count})`).join(" · ")}</p>}
          <ul className="space-y-1 text-sm">{data.recent.map((row) => <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 py-1"><span><strong>{row.candidateName}</strong> — {row.destination} · {row.visaType} · {row.outcomeLabel}{row.refusalReason ? ` (${row.refusalReason})` : ""}</span><Button type="button" size="sm" variant="ghost" onClick={() => { if (window.confirm("Annuler cette saisie ?")) voidOutcome.mutate({ sessionToken, id: row.id }); }}>Annuler la saisie</Button></li>)}</ul>
        </>
      )}
    </div>
  );
}

function AssignPanel({ sessionToken }: { sessionToken: string }) {
  const utils = trpc.useUtils();
  const preview = trpc.adminOps.adminAssignmentPreview.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false });
  const assign = trpc.adminOps.adminAutoAssign.useMutation({ onSuccess: (result) => { toast.success(`${result.assigned} dossier(s) affecté(s)`); void utils.adminOps.adminAssignmentPreview.invalidate(); }, onError: (error) => toast.error(error.message) });
  const data = preview.data as Out["adminAssignmentPreview"] | undefined;
  return (
    <div className="space-y-3" data-testid="ops-assign">
      <p className="text-sm text-slate-700">Chaque dossier non assigné va à l'agent actif le moins chargé (accompagnement et procédures). Aperçu avant exécution ; chaque affectation est inscrite à l'historique du dossier. La spécialité par destination n'est pas enregistrée : elle n'entre pas dans le calcul.</p>
      {preview.error && <p className="text-sm text-rose-700" role="alert">{preview.error.message}</p>}
      {data && (
        <>
          <p className="text-sm font-semibold text-slate-900">{data.unassigned} dossier(s) non assigné(s) · {data.plan} à affecter maintenant</p>
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-600"><tr><th className="p-2">Agent</th><th className="p-2">Dossiers ouverts</th><th className="p-2">Recevra</th></tr></thead><tbody>{data.agents.map((agent) => <tr key={agent.id} className="border-t border-slate-100"><td className="p-2 font-semibold">{agent.label}</td><td className="p-2">{agent.open}</td><td className="p-2">+{agent.willReceive}</td></tr>)}</tbody></table></div>
          {data.agents.length === 0 && <p className="text-sm text-amber-900">Aucun agent actif de type accompagnement ou procédures.</p>}
          <Button type="button" className="min-h-10" disabled={data.plan === 0 || assign.isPending} onClick={() => { if (window.confirm(`Affecter ${data.plan} dossier(s) maintenant ?`)) assign.mutate({ sessionToken }); }} data-testid="auto-assign">Affecter automatiquement</Button>
        </>
      )}
    </div>
  );
}

function HealthPanel({ sessionToken }: { sessionToken: string }) {
  const health = trpc.adminOps.adminSystemHealth.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false });
  const data = health.data as Out["adminSystemHealth"] | undefined;
  return (
    <div className="space-y-3" data-testid="ops-health">
      {health.error && <p className="text-sm text-rose-700" role="alert">{health.error.message}</p>}
      {data && (
        <>
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">Base de données joignable.</p>
          {data.missingMigrations.length === 0
            ? <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">Toutes les migrations 0088 à 0095 sont appliquées.</p>
            : <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-950" role="alert"><p className="font-bold">Migrations à appliquer (tables manquantes) :</p><ul className="mt-1 list-disc pl-5">{data.missingMigrations.map((entry) => <li key={entry.migration}>{entry.migration} — {entry.tables.join(", ")}</li>)}</ul></div>}
          <p className={`rounded-lg border p-3 text-sm ${data.openEmailIncidents > 0 ? "border-amber-300 bg-amber-50 text-amber-950" : "border-slate-200 bg-white text-slate-800"}`}>{data.openEmailIncidents > 0 ? `${data.openEmailIncidents} incident(s) d'envoi d'e-mails ouvert(s) : voir l'onglet E-mails.` : "Aucun incident d'envoi d'e-mails ouvert."}</p>
          <p className={`rounded-lg border p-3 text-sm ${data.scheduler.automaticReminders ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-300 bg-amber-50 text-amber-950"}`}>Relances automatiques : {data.scheduler.automaticReminders ? "actives." : `éteintes (mode « ${data.scheduler.mode} »). Les ${data.scheduler.jobs} tâches planifiées ne partent pas seules ; le mode se règle par la variable SCHEDULED_JOBS_MODE de l'hébergement.`}</p>
          <p className="text-xs text-slate-500">Cet écran se met à jour à l'ouverture. Une alerte en temps réel (site ou e-mails hors service) demande un outil de surveillance externe : ce contrôle ne s'exécute pas tout seul.</p>
        </>
      )}
    </div>
  );
}

/** Outils d'administration : pièces et échéances, échéancier de paiement, résultats réels, affectation automatique, santé du système. */
export function AdminOps({ sessionToken }: { sessionToken: string }) {
  const [section, setSection] = useState<Section>("checks");
  return (
    <div className="space-y-4" data-testid="admin-ops">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Outils d'administration">
        {SECTIONS.map((item) => <Button key={item.id} type="button" size="sm" role="tab" aria-selected={section === item.id} variant={section === item.id ? "default" : "outline"} onClick={() => setSection(item.id)} data-testid={`ops-tab-${item.id}`}>{item.label}</Button>)}
      </div>
      {section === "checks" && <ChecksPanel sessionToken={sessionToken} />}
      {section === "schedule" && <SchedulePanel sessionToken={sessionToken} />}
      {section === "outcomes" && <OutcomesPanel sessionToken={sessionToken} />}
      {section === "assign" && <AssignPanel sessionToken={sessionToken} />}
      {section === "health" && <HealthPanel sessionToken={sessionToken} />}
    </div>
  );
}
