import { useMemo, useState, type ReactNode } from "react";
import { CalendarClock, ClipboardCopy, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";
import { trpc } from "@/lib/trpc";
import {
  ACK_TEMPLATES,
  NEXT_ACTION_PRESETS,
  replyTemplatesFor,
  type ReplyLanguage,
  SLOT_CHANNELS,
  SLOT_CHANNEL_LABELS,
  SLOT_STATUS_LABELS,
  WAITING_LEVEL_LABELS,
  fillTemplate,
  whatsappLink,
  type SlotChannel,
} from "@shared/remoteSupport";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Out = inferRouterOutputs<AppRouter>["remoteSupport"];
type Section = "slots" | "waiting" | "actions" | "workload" | "handover" | "acks";

const SECTIONS: Array<{ id: Section; label: string }> = [
  { id: "slots", label: "Rendez-vous en ligne" },
  { id: "waiting", label: "Messages sans réponse" },
  { id: "actions", label: "Prochaines actions" },
  { id: "workload", label: "Charge et blocages" },
  { id: "handover", label: "Passation de dossier" },
  { id: "acks", label: "Accusés de réception" },
];
const selectClass = "mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-2 text-sm";
const Field = ({ label, children }: { label: string; children: ReactNode }) => <label className="block text-xs font-semibold text-slate-700">{label}{children}</label>;
const frDateTime = (value: string) => new Date(value).toLocaleString("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const LEVEL_CLASS = { normal: "bg-slate-100 text-slate-700", late: "bg-amber-100 text-amber-900", urgent: "bg-rose-100 text-rose-800" } as const;

type PickedCandidate = { id: number; fullName: string; email: string; phone: string | null };

/** Recherche d'un candidat par nom ou e-mail, partagée par les formulaires de l'accompagnement à distance. */
function CandidatePicker({ sessionToken, picked, onPick }: { sessionToken: string; picked: PickedCandidate | null; onPick: (value: PickedCandidate | null) => void }) {
  const [search, setSearch] = useState("");
  const found = trpc.remoteSupport.adminFindCandidate.useQuery({ sessionToken, search }, { enabled: Boolean(sessionToken) && search.trim().length >= 2 && !picked, retry: false });
  if (picked) {
    return (
      <p className="mt-1 flex items-center justify-between gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950" data-testid="remote-picked">
        <span><strong>{picked.fullName}</strong> · {picked.email}</span>
        <Button type="button" size="sm" variant="ghost" onClick={() => onPick(null)}>Changer</Button>
      </p>
    );
  }
  return (
    <div>
      <Input className="mt-1" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nom ou e-mail du candidat" aria-label="Rechercher un candidat" data-testid="remote-search" />
      <ul className="mt-1 space-y-1">
        {(found.data ?? []).map((row) => (
          <li key={row.id}><button type="button" className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-sm hover:bg-slate-50" onClick={() => onPick(row)}>{row.fullName} <span className="text-slate-500">· {row.email}</span></button></li>
        ))}
      </ul>
    </div>
  );
}

function SlotsPanel({ sessionToken }: { sessionToken: string }) {
  const utils = trpc.useUtils();
  const slots = trpc.remoteSupport.adminSlots.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false });
  const [date, setDate] = useState("");
  const [times, setTimes] = useState("09:00, 10:00, 11:00");
  const [duration, setDuration] = useState(30);
  const [channel, setChannel] = useState<SlotChannel>("video");
  const [joinUrl, setJoinUrl] = useState("");
  const [topic, setTopic] = useState("");
  const [minutes, setMinutes] = useState<Record<number, string>>({});
  const refresh = () => { void utils.remoteSupport.adminSlots.invalidate(); };
  const create = trpc.remoteSupport.adminCreateSlots.useMutation({ onSuccess: (result) => { toast.success(`${result.created} créneau(x) publié(s)`); refresh(); }, onError: (error) => toast.error(error.message) });
  const cancel = trpc.remoteSupport.adminCancelSlot.useMutation({ onSuccess: () => { toast.success("Créneau annulé"); refresh(); }, onError: (error) => toast.error(error.message) });
  const close = trpc.remoteSupport.adminCloseSlot.useMutation({ onSuccess: () => { toast.success("Rendez-vous clos"); refresh(); }, onError: (error) => toast.error(error.message) });
  const reminders = trpc.remoteSupport.adminSendDueReminders.useMutation({ onSuccess: (result) => toast.success(`${result.sent} rappel(s) envoyé(s)`), onError: (error) => toast.error(error.message) });

  const submit = () => {
    const parsed = times.split(/[,;\s]+/).filter(Boolean).map((time) => (/^\d{1,2}:\d{2}$/.test(time) ? new Date(`${date}T${time.padStart(5, "0")}:00`) : null));
    if (!date || parsed.length === 0 || parsed.some((value) => !value || Number.isNaN(value.getTime()))) { toast.error("Choisissez une date et des heures au format 09:00, 10:30."); return; }
    create.mutate({ sessionToken, startsAt: parsed.map((value) => value!.toISOString()), durationMin: duration, channel, joinUrl: joinUrl || null, topic: topic || null });
  };
  const rows = (slots.data ?? []) as Out["adminSlots"];

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="flex items-center gap-2 text-base font-black text-slate-950"><CalendarClock className="h-5 w-5" aria-hidden="true" />Publier des créneaux</h3>
        <p className="mt-1 text-sm text-slate-700">Les candidats réservent depuis leur espace. Le lien de visio n'est montré qu'à celui qui réserve ; seuls Meet, Zoom, Teams, WhatsApp, Whereby, Jitsi et Webex sont acceptés.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Field label="Date"><Input className="mt-1" type="date" value={date} onChange={(event) => setDate(event.target.value)} data-testid="slot-date" /></Field>
          <Field label="Heures (heure de votre navigateur)"><Input className="mt-1" value={times} onChange={(event) => setTimes(event.target.value)} data-testid="slot-times" /></Field>
          <Field label="Durée (minutes)"><Input className="mt-1" type="number" min={10} max={120} value={duration} onChange={(event) => setDuration(Number(event.target.value) || 30)} /></Field>
          <Field label="Canal"><select className={selectClass} value={channel} onChange={(event) => setChannel(event.target.value as SlotChannel)}>{SLOT_CHANNELS.map((item) => <option key={item} value={item}>{SLOT_CHANNEL_LABELS[item]}</option>)}</select></Field>
          <Field label={channel === "video" ? "Lien de la réunion (obligatoire)" : "Lien (facultatif)"}><Input className="mt-1" value={joinUrl} onChange={(event) => setJoinUrl(event.target.value)} placeholder="https://meet.google.com/…" data-testid="slot-link" /></Field>
          <Field label="Sujet (facultatif)"><Input className="mt-1" value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Point sur le dossier" /></Field>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" className="min-h-11" disabled={create.isPending} onClick={submit} data-testid="slot-create">Publier les créneaux</Button>
          <Button type="button" variant="outline" className="min-h-11" disabled={reminders.isPending} onClick={() => reminders.mutate({ sessionToken })}>Envoyer les rappels des prochaines 24 h</Button>
        </div>
      </section>
      {slots.error && <p className="text-sm text-rose-700" role="alert">{slots.error.message}</p>}
      <ul className="space-y-2">
        {rows.map((slot) => {
          const wa = slot.candidateName ? whatsappLink(slot.candidatePhone, `Bonjour ${slot.candidateName.split(" ")[0]}, c'est 3M Travel Agency au sujet de notre rendez-vous du ${frDateTime(slot.startsAt)}.`) : null;
          return (
            <li key={slot.id} className="rounded-lg border border-slate-200 bg-white p-3 text-sm" data-testid={`slot-${slot.id}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold text-slate-900">{frDateTime(slot.startsAt)} · {slot.durationMin} min · {SLOT_CHANNEL_LABELS[slot.channel]}</p>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-800">{SLOT_STATUS_LABELS[slot.status]}</span>
              </div>
              {slot.candidateName && <p className="mt-1 text-slate-700">Candidat : <strong>{slot.candidateName}</strong>{slot.candidateNote ? ` — « ${slot.candidateNote} »` : ""}{wa && <> · <a className="font-semibold text-emerald-700 underline" href={wa} target="_blank" rel="noopener noreferrer">WhatsApp</a></>}</p>}
              {slot.status === "booked" && (
                <div className="mt-2 space-y-2">
                  <Textarea value={minutes[slot.id] ?? ""} onChange={(event) => setMinutes((current) => ({ ...current, [slot.id]: event.target.value }))} placeholder="Compte rendu du rendez-vous (facultatif)" className="min-h-16" />
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" onClick={() => close.mutate({ sessionToken, id: slot.id, outcome: "done", minutes: minutes[slot.id] || null })}>Terminé</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => close.mutate({ sessionToken, id: slot.id, outcome: "no_show", minutes: minutes[slot.id] || null })}>Absent</Button>
                  </div>
                </div>
              )}
              {slot.minutesText && <p className="mt-2 whitespace-pre-line rounded bg-slate-50 p-2 text-xs text-slate-700">{slot.minutesText}</p>}
              {(slot.status === "open" || slot.status === "booked") && (
                <Button type="button" size="sm" variant="ghost" className="mt-2 text-rose-700" onClick={() => { if (window.confirm(slot.status === "booked" ? "Annuler ce rendez-vous réservé ? Le candidat sera prévenu." : "Retirer ce créneau ?")) cancel.mutate({ sessionToken, id: slot.id, reason: null }); }}>Annuler le créneau</Button>
              )}
            </li>
          );
        })}
        {slots.data && rows.length === 0 && <li className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-600">Aucun créneau sur la période. Publiez-en ci-dessus.</li>}
      </ul>
    </div>
  );
}

function WaitingPanel({ sessionToken }: { sessionToken: string }) {
  const utils = trpc.useUtils();
  const waiting = trpc.remoteSupport.adminWaiting.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false, refetchInterval: 60_000 });
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [langs, setLangs] = useState<Record<number, ReplyLanguage>>({});
  const reply = trpc.remoteSupport.adminReply.useMutation({ onSuccess: () => { toast.success("Réponse envoyée"); void utils.remoteSupport.adminWaiting.invalidate(); }, onError: (error) => toast.error(error.message) });
  const rows = (waiting.data ?? []) as Out["adminWaiting"];
  return (
    <div className="space-y-2" data-testid="remote-waiting">
      <p className="text-sm text-slate-700">Candidats dont le dernier message attend une réponse. Choisissez une réponse type, adaptez-la, envoyez : le candidat est prévenu dans son espace et par e-mail.</p>
      {waiting.error && <p className="text-sm text-rose-700" role="alert">{waiting.error.message}</p>}
      {waiting.data && rows.length === 0 && <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">Aucun message en attente de réponse.</p>}
      {rows.map((row) => {
        const draft = drafts[row.candidateId] ?? "";
        const lang: ReplyLanguage = langs[row.candidateId] ?? row.language;
        const templates = replyTemplatesFor(lang);
        const wa = whatsappLink(row.phone, draft || fillTemplate(templates[0].body, row.fullName));
        return (
          <article key={row.candidateId} className="rounded-lg border border-slate-200 bg-white p-3 text-sm" data-testid={`waiting-${row.candidateId}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-bold text-slate-900">{row.fullName}</p>
              <span className="flex gap-1 text-[11px] font-bold">
                {row.isHelpRequest && <span className="rounded bg-violet-100 px-1.5 py-0.5 text-violet-800">Demande d'aide</span>}
                <span className={`rounded px-1.5 py-0.5 ${LEVEL_CLASS[row.level]}`}>{WAITING_LEVEL_LABELS[row.level]} · {row.days} j</span>
              </span>
            </div>
            <p className="mt-1 whitespace-pre-line text-slate-700">« {row.lastMessage} »</p>
            <div className="mt-2 flex items-center gap-1 text-xs" role="group" aria-label="Langue de la réponse">
              <span className="text-slate-500">Langue :</span>
              {(["fr", "en"] as const).map((code) => <Button key={code} type="button" size="sm" variant={lang === code ? "default" : "outline"} className="h-7 px-2 text-xs" onClick={() => setLangs((current) => ({ ...current, [row.candidateId]: code }))} data-testid={`reply-lang-${row.candidateId}-${code}`}>{code === "fr" ? "Français" : "English"}</Button>)}
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-[14rem_1fr]">
              <select className={selectClass} aria-label="Réponse type" defaultValue="" onChange={(event) => { const template = templates.find((item) => item.id === event.target.value); if (template) setDrafts((current) => ({ ...current, [row.candidateId]: fillTemplate(template.body, row.fullName) })); }}>
                <option value="">Réponse type…</option>
                {templates.map((template) => <option key={template.id} value={template.id}>{template.label}</option>)}
              </select>
              <Textarea value={draft} onChange={(event) => setDrafts((current) => ({ ...current, [row.candidateId]: event.target.value }))} placeholder="Votre réponse" className="min-h-16" />
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button type="button" size="sm" disabled={!draft.trim() || reply.isPending} onClick={() => reply.mutate({ sessionToken, candidateId: row.candidateId, content: draft.trim() }, { onSuccess: () => setDrafts((current) => ({ ...current, [row.candidateId]: "" })) })}><Send className="mr-1 h-3.5 w-3.5" aria-hidden="true" />Envoyer</Button>
              {wa && <Button asChild size="sm" variant="outline"><a href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle className="mr-1 h-3.5 w-3.5" aria-hidden="true" />WhatsApp</a></Button>}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function ActionsPanel({ sessionToken }: { sessionToken: string }) {
  const utils = trpc.useUtils();
  const [scope, setScope] = useState<"mine" | "all">("mine");
  const actions = trpc.remoteSupport.adminActions.useQuery({ sessionToken, scope }, { enabled: Boolean(sessionToken), retry: false });
  const [picked, setPicked] = useState<PickedCandidate | null>(null);
  const [action, setAction] = useState("");
  const [dueOn, setDueOn] = useState("");
  const [candidateText, setCandidateText] = useState("");
  const refresh = () => { void utils.remoteSupport.adminActions.invalidate(); };
  const save = trpc.remoteSupport.adminSaveAction.useMutation({ onSuccess: () => { toast.success("Prochaine action enregistrée"); setAction(""); setDueOn(""); setCandidateText(""); setPicked(null); refresh(); }, onError: (error) => toast.error(error.message) });
  const resolve = trpc.remoteSupport.adminResolveAction.useMutation({ onSuccess: refresh, onError: (error) => toast.error(error.message) });
  const rows = (actions.data ?? []) as Out["adminActions"];
  const overdue = rows.filter((row) => row.overdue).length;
  return (
    <div className="space-y-4" data-testid="remote-actions">
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-base font-black text-slate-950">Définir la prochaine action d'un dossier</h3>
        <p className="mt-1 text-sm text-slate-700">Une seule prochaine action ouverte par dossier : la nouvelle remplace l'ancienne. Si vous rédigez « Étape montrée au candidat », il la voit en haut de son espace (mode pas à pas).</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Candidat"><CandidatePicker sessionToken={sessionToken} picked={picked} onPick={setPicked} /></Field>
          <Field label="Échéance (facultatif)"><Input className="mt-1" type="date" value={dueOn} onChange={(event) => setDueOn(event.target.value)} /></Field>
          <Field label="Action interne"><Input className="mt-1" list="remote-action-presets" value={action} onChange={(event) => setAction(event.target.value)} placeholder="Ex. Relancer pour les pièces manquantes" data-testid="action-text" /></Field>
          <Field label="Étape montrée au candidat (facultatif)"><Input className="mt-1" value={candidateText} onChange={(event) => setCandidateText(event.target.value)} placeholder="Ex. Envoyez la photo de votre passeport" /></Field>
        </div>
        <datalist id="remote-action-presets">{NEXT_ACTION_PRESETS.map((preset) => <option key={preset} value={preset} />)}</datalist>
        <Button type="button" className="mt-3 min-h-11" disabled={!picked || action.trim().length < 3 || save.isPending} onClick={() => picked && save.mutate({ sessionToken, candidateId: picked.id, action: action.trim(), dueOn: dueOn || null, candidateText: candidateText.trim() || null })} data-testid="action-save">Enregistrer</Button>
      </section>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant={scope === "mine" ? "default" : "outline"} onClick={() => setScope("mine")}>Mes dossiers à faire</Button>
        <Button type="button" size="sm" variant={scope === "all" ? "default" : "outline"} onClick={() => setScope("all")}>Toute l'équipe</Button>
        {overdue > 0 && <span className="rounded bg-rose-100 px-2 py-1 text-xs font-bold text-rose-800">{overdue} en retard</span>}
      </div>
      {actions.error && <p className="text-sm text-rose-700" role="alert">{actions.error.message}</p>}
      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row.id} className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm" data-testid={`next-action-${row.id}`}>
            <div>
              <p className="font-bold text-slate-900">{row.candidateName}</p>
              <p className="text-slate-700">{row.action}</p>
              <p className="text-xs text-slate-500">{row.ownerLabel ?? "Non assigné"}{row.dueOn ? ` · avant le ${new Date(row.dueOn).toLocaleDateString("fr-FR")}` : ""}{row.candidateVisible ? " · montrée au candidat" : ""}</p>
            </div>
            <div className="flex items-center gap-2">
              {row.overdue && <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[11px] font-bold text-rose-800">En retard</span>}
              {row.dueToday && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-bold text-amber-900">Aujourd'hui</span>}
              <Button type="button" size="sm" onClick={() => resolve.mutate({ sessionToken, id: row.id, outcome: "done" })}>Fait</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => resolve.mutate({ sessionToken, id: row.id, outcome: "cancelled" })}>Annuler</Button>
            </div>
          </li>
        ))}
        {actions.data && rows.length === 0 && <li className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-600">Aucune action ouverte.</li>}
      </ul>
    </div>
  );
}

const STAGE_LABELS: Record<string, string> = { new: "Nouveau", qualifying: "Qualification", waiting_customer: "Attente du candidat", documents_review: "Contrôle des pièces", payment_review: "Contrôle du paiement", processing: "Traitement", submitted: "Soumis" };

function WorkloadPanel({ sessionToken }: { sessionToken: string }) {
  const load = trpc.remoteSupport.adminWorkload.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false });
  const data = load.data as Out["adminWorkload"] | undefined;
  return (
    <div className="space-y-4" data-testid="remote-workload">
      {load.error && <p className="text-sm text-rose-700" role="alert">{load.error.message}</p>}
      {data && (
        <>
          <p className="text-sm text-slate-800"><strong>{data.totalOpen}</strong> demande(s) ouverte(s), dont <strong className="text-rose-700">{data.totalBlocked}</strong> sans activité depuis plus de {data.blockedAfterDays} jours.</p>
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-600"><tr><th className="p-2">Agent</th><th className="p-2">Ouvertes</th><th className="p-2">Bloquées</th><th className="p-2">En retard</th><th className="p-2">Actions ouvertes</th><th className="p-2">Actions en retard</th></tr></thead>
              <tbody>{data.agents.map((agent) => <tr key={String(agent.adminId)} className="border-t border-slate-100"><td className="p-2 font-semibold">{agent.label}</td><td className="p-2">{agent.open}</td><td className={`p-2 ${agent.blocked ? "font-bold text-rose-700" : ""}`}>{agent.blocked}</td><td className="p-2">{agent.overdue}</td><td className="p-2">{agent.actionsOpen}</td><td className={`p-2 ${agent.actionsOverdue ? "font-bold text-rose-700" : ""}`}>{agent.actionsOverdue}</td></tr>)}</tbody>
            </table>
          </div>
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-600"><tr><th className="p-2">Étape</th><th className="p-2">Ouvertes</th><th className="p-2">Bloquées</th></tr></thead>
              <tbody>{data.stages.map((stage) => <tr key={stage.status} className="border-t border-slate-100"><td className="p-2 font-semibold">{STAGE_LABELS[stage.status] ?? stage.status}</td><td className="p-2">{stage.open}</td><td className={`p-2 ${stage.blocked ? "font-bold text-rose-700" : ""}`}>{stage.blocked}</td></tr>)}</tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function HandoverPanel({ sessionToken }: { sessionToken: string }) {
  const [picked, setPicked] = useState<PickedCandidate | null>(null);
  const handover = trpc.remoteSupport.adminHandover.useQuery({ sessionToken, candidateId: picked?.id ?? 1 }, { enabled: Boolean(sessionToken) && Boolean(picked), retry: false });
  const copy = async () => {
    const summary = handover.data?.summary;
    if (!summary) return;
    try { await navigator.clipboard.writeText(summary); toast.success("Note de passation copiée"); } catch { toast.error("Copie impossible : sélectionnez le texte à la main."); }
  };
  return (
    <div className="space-y-3" data-testid="remote-handover">
      <p className="text-sm text-slate-700">Note générée à partir du dossier : projet, paiement, demandes, actions, rendez-vous et derniers échanges. À copier dans un message à votre collègue.</p>
      <Field label="Candidat"><CandidatePicker sessionToken={sessionToken} picked={picked} onPick={setPicked} /></Field>
      {handover.error && <p className="text-sm text-rose-700" role="alert">{handover.error.message}</p>}
      {picked && handover.data && (
        <>
          <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-900" data-testid="handover-text">{handover.data.summary}</pre>
          <Button type="button" className="min-h-11" onClick={() => { void copy(); }}><ClipboardCopy className="mr-2 h-4 w-4" aria-hidden="true" />Copier la note</Button>
        </>
      )}
    </div>
  );
}

const ACK_STATUS: Record<string, string> = { pending: "En attente", accepted: "Confirmé", declined: "Refusé", cancelled: "Annulé" };

function AcksPanel({ sessionToken }: { sessionToken: string }) {
  const utils = trpc.useUtils();
  const list = trpc.remoteSupport.adminAcknowledgements.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false });
  const [picked, setPicked] = useState<PickedCandidate | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const refresh = () => { void utils.remoteSupport.adminAcknowledgements.invalidate(); };
  const create = trpc.remoteSupport.adminCreateAcknowledgement.useMutation({ onSuccess: () => { toast.success("Accusé envoyé au candidat"); setTitle(""); setBody(""); setPicked(null); refresh(); }, onError: (error) => toast.error(error.message) });
  const cancel = trpc.remoteSupport.adminCancelAcknowledgement.useMutation({ onSuccess: refresh, onError: (error) => toast.error(error.message) });
  const rows = (list.data ?? []) as Out["adminAcknowledgements"];
  const ready = useMemo(() => Boolean(picked) && title.trim().length >= 5 && body.trim().length >= 20, [picked, title, body]);
  return (
    <div className="space-y-4" data-testid="remote-acks">
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-base font-black text-slate-950">Demander un accusé de réception à distance</h3>
        <p className="mt-1 text-sm text-slate-700">Le candidat lit le texte dans son espace, tape son nom complet et confirme : la date, le nom saisi et l'empreinte du texte sont conservés. C'est une confirmation simple, pas une signature électronique qualifiée.</p>
        <div className="mt-3 space-y-3">
          <Field label="Candidat"><CandidatePicker sessionToken={sessionToken} picked={picked} onPick={setPicked} /></Field>
          <Field label="Modèle"><select className={selectClass} defaultValue="" onChange={(event) => { const template = ACK_TEMPLATES.find((item) => item.id === event.target.value); if (template) { setTitle(template.title); setBody(template.body); } }}><option value="">Choisir un modèle…</option>{ACK_TEMPLATES.map((template) => <option key={template.id} value={template.id}>{template.title}</option>)}</select></Field>
          <Field label="Titre"><Input className="mt-1" value={title} onChange={(event) => setTitle(event.target.value)} /></Field>
          <Field label="Texte à confirmer"><Textarea className="mt-1 min-h-24" value={body} onChange={(event) => setBody(event.target.value)} /></Field>
          <Button type="button" className="min-h-11" disabled={!ready || create.isPending} onClick={() => picked && create.mutate({ sessionToken, candidateId: picked.id, title: title.trim(), body: body.trim() })} data-testid="ack-create">Envoyer au candidat</Button>
        </div>
      </section>
      {list.error && <p className="text-sm text-rose-700" role="alert">{list.error.message}</p>}
      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row.id} className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm">
            <div>
              <p className="font-bold text-slate-900">{row.candidateName} — {row.title}</p>
              <p className="text-xs text-slate-600">{ACK_STATUS[row.status]}{row.answeredAt ? ` le ${new Date(row.answeredAt).toLocaleString("fr-FR")}` : ""}{row.typedName ? ` · nom saisi : ${row.typedName}` : ""}{row.declineReason ? ` · motif : ${row.declineReason}` : ""} · empreinte {row.bodyHash.slice(0, 10)}</p>
            </div>
            {row.status === "pending" && <Button type="button" size="sm" variant="ghost" onClick={() => cancel.mutate({ sessionToken, id: row.id })}>Annuler</Button>}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Accompagnement à distance (administration) : rendez-vous en ligne, relance des messages, prochaine action, charge, passation, accusés. */
export function AdminRemoteSupport({ sessionToken }: { sessionToken: string }) {
  const [section, setSection] = useState<Section>("slots");
  return (
    <div className="space-y-4" data-testid="admin-remote-support">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Accompagnement à distance">
        {SECTIONS.map((item) => <Button key={item.id} type="button" size="sm" role="tab" aria-selected={section === item.id} variant={section === item.id ? "default" : "outline"} onClick={() => setSection(item.id)} data-testid={`remote-tab-${item.id}`}>{item.label}</Button>)}
      </div>
      {section === "slots" && <SlotsPanel sessionToken={sessionToken} />}
      {section === "waiting" && <WaitingPanel sessionToken={sessionToken} />}
      {section === "actions" && <ActionsPanel sessionToken={sessionToken} />}
      {section === "workload" && <WorkloadPanel sessionToken={sessionToken} />}
      {section === "handover" && <HandoverPanel sessionToken={sessionToken} />}
      {section === "acks" && <AcksPanel sessionToken={sessionToken} />}
    </div>
  );
}
