import { useState } from "react";
import { Bell, ClipboardList, Plus } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  INTERNATIONAL_FIELDS_NOTICE,
  INTERVIEW_MODES,
  INTERVIEW_MODE_LABELS,
  INTERVIEW_STATUS_LABELS,
  NEED_STATUS_LABELS,
  SALARY_PERIODS,
  SALARY_PERIOD_LABELS,
  SUPPORT_LABELS,
  SUPPORT_VALUES,
  TRI_STATE_LABELS,
  TRI_STATE_VALUES,
  type NeedStatus,
  type SupportState,
  type TriState,
} from "@shared/recruitment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const selectClass = "mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-2 text-sm";
const fieldClass = "text-sm font-semibold text-slate-800";
const when = (value: unknown) => (value ? new Date(value as string | number | Date).toLocaleDateString("fr-FR") : "");

type NeedDraft = {
  title: string; companyName: string; beneficiaryConfidential: boolean; missions: string; country: string; workLocation: string;
  salaryGross: string; salaryCurrency: string; salaryPeriod: "" | (typeof SALARY_PERIODS)[number]; contractDuration: string;
  requiredSkills: string; requiredQualifications: string; requiredExperience: string; requiredLanguages: string; recognitionsRequired: string;
  foreignApplications: TriState; noLocalWorkAuth: TriState; reviewResidenceCountries: string; intlSupport: SupportState; intlSupportDetail: string;
};
const emptyNeed: NeedDraft = {
  title: "", companyName: "", beneficiaryConfidential: false, missions: "", country: "", workLocation: "", salaryGross: "", salaryCurrency: "", salaryPeriod: "", contractDuration: "",
  requiredSkills: "", requiredQualifications: "", requiredExperience: "", requiredLanguages: "", recognitionsRequired: "",
  foreignApplications: "tbc", noLocalWorkAuth: "tbc", reviewResidenceCountries: "", intlSupport: "to_specify", intlSupportDetail: "",
};

/** Formulaire de dépôt d'un besoin ou de proposition d'un poste pour un profil. Les champs internationaux sont des déclarations, jamais une garantie. */
export function NeedForm({ sessionToken, profileCode, onDone, onCancel }: { sessionToken: string; profileCode?: string; onDone: () => void; onCancel: () => void }) {
  const utils = trpc.useUtils();
  const [draft, setDraft] = useState<NeedDraft>(emptyNeed);
  const set = <K extends keyof NeedDraft>(key: K, value: NeedDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const create = trpc.recruitment.needCreate.useMutation({
    onSuccess: () => { toast.success("Besoin transmis à 3M", { description: "3M l’examine avant toute présentation de candidat." }); void utils.recruitment.needList.invalidate(); void utils.recruitment.notificationList.invalidate(); onDone(); },
    onError: (error) => toast.error("Besoin non transmis", { description: error.message }),
  });
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    create.mutate({
      sessionToken,
      profileCode,
      title: draft.title,
      companyName: draft.companyName || undefined,
      beneficiaryConfidential: draft.beneficiaryConfidential,
      missions: draft.missions,
      country: draft.country,
      workLocation: draft.workLocation || undefined,
      salaryGross: draft.salaryGross ? Number(draft.salaryGross) : undefined,
      salaryCurrency: draft.salaryCurrency || undefined,
      salaryPeriod: draft.salaryPeriod || undefined,
      contractDuration: draft.contractDuration || undefined,
      requiredSkills: draft.requiredSkills || undefined,
      requiredQualifications: draft.requiredQualifications || undefined,
      requiredExperience: draft.requiredExperience || undefined,
      requiredLanguages: draft.requiredLanguages || undefined,
      recognitionsRequired: draft.recognitionsRequired || undefined,
      foreignApplications: draft.foreignApplications,
      noLocalWorkAuth: draft.noLocalWorkAuth,
      reviewResidenceCountries: draft.reviewResidenceCountries || undefined,
      intlSupport: draft.intlSupport,
      intlSupportDetail: draft.intlSupportDetail || undefined,
    });
  };
  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-indigo-200 bg-white p-4" data-testid="need-form" aria-label={profileCode ? `Proposer un poste pour la fiche ${profileCode}` : "Déposer un besoin de recrutement"}>
      <p className="font-black text-slate-950">{profileCode ? `Proposer un poste — fiche ${profileCode}` : "Déposer un besoin de recrutement"}</p>
      <p className="text-sm text-slate-600">3M vérifie l’offre et l’employeur, puis confirme l’intérêt du candidat avant toute mise en relation. Aucune coordonnée du candidat n’est communiquée par ce formulaire.</p>
      <div className="grid gap-3 md:grid-cols-2">
        <label className={`${fieldClass} md:col-span-2`}>Intitulé du poste *<Input value={draft.title} onChange={(e) => set("title", e.target.value)} maxLength={200} required className="mt-1" /></label>
        <label className={fieldClass}>Entreprise bénéficiaire<Input value={draft.companyName} onChange={(e) => set("companyName", e.target.value)} maxLength={255} className="mt-1" placeholder="Si différente de votre organisation" /></label>
        <label className="flex items-end gap-2 pb-2 text-sm text-slate-800"><input type="checkbox" checked={draft.beneficiaryConfidential} onChange={(e) => set("beneficiaryConfidential", e.target.checked)} />Identité du bénéficiaire confidentielle (non communiquée aux candidats)</label>
        <label className={`${fieldClass} md:col-span-2`}>Missions *<Textarea value={draft.missions} onChange={(e) => set("missions", e.target.value)} maxLength={4000} required className="mt-1 min-h-24" /></label>
        <label className={fieldClass}>Pays du poste *<Input value={draft.country} onChange={(e) => set("country", e.target.value)} maxLength={120} required className="mt-1" /></label>
        <label className={fieldClass}>Lieu de travail<Input value={draft.workLocation} onChange={(e) => set("workLocation", e.target.value)} maxLength={200} className="mt-1" /></label>
        <label className={fieldClass}>Rémunération brute<Input type="number" min={0} value={draft.salaryGross} onChange={(e) => set("salaryGross", e.target.value)} className="mt-1" /></label>
        <div className="grid grid-cols-2 gap-2">
          <label className={fieldClass}>Devise<Input value={draft.salaryCurrency} onChange={(e) => set("salaryCurrency", e.target.value)} maxLength={8} className="mt-1" placeholder="EUR" /></label>
          <label className={fieldClass}>Période<select value={draft.salaryPeriod} onChange={(e) => set("salaryPeriod", e.target.value as NeedDraft["salaryPeriod"])} className={selectClass}><option value="">—</option>{SALARY_PERIODS.map((p) => <option key={p} value={p}>{SALARY_PERIOD_LABELS[p]}</option>)}</select></label>
        </div>
        <label className={fieldClass}>Durée du contrat<Input value={draft.contractDuration} onChange={(e) => set("contractDuration", e.target.value)} maxLength={120} className="mt-1" placeholder="CDI, 12 mois…" /></label>
        <label className={fieldClass}>Expérience requise<Input value={draft.requiredExperience} onChange={(e) => set("requiredExperience", e.target.value)} maxLength={300} className="mt-1" /></label>
        <label className={fieldClass}>Compétences recherchées<Textarea value={draft.requiredSkills} onChange={(e) => set("requiredSkills", e.target.value)} maxLength={1500} className="mt-1 min-h-16" /></label>
        <label className={fieldClass}>Qualifications<Textarea value={draft.requiredQualifications} onChange={(e) => set("requiredQualifications", e.target.value)} maxLength={1500} className="mt-1 min-h-16" /></label>
        <label className={fieldClass}>Langues<Input value={draft.requiredLanguages} onChange={(e) => set("requiredLanguages", e.target.value)} maxLength={300} className="mt-1" /></label>
        <label className={fieldClass}>Reconnaissances ou équivalences éventuelles<Input value={draft.recognitionsRequired} onChange={(e) => set("recognitionsRequired", e.target.value)} maxLength={1500} className="mt-1" /></label>
      </div>
      <fieldset className="space-y-3 rounded-xl border border-sky-200 bg-sky-50 p-3" data-testid="need-international-fields">
        <legend className="px-1 text-sm font-black text-sky-950">Candidats résidant à l’étranger</legend>
        <p className="text-xs leading-5 text-sky-950">{INTERNATIONAL_FIELDS_NOTICE}</p>
        <div className="grid gap-3 md:grid-cols-3">
          <label className={fieldClass}>Candidatures depuis l’étranger acceptées ?<select value={draft.foreignApplications} onChange={(e) => set("foreignApplications", e.target.value as TriState)} className={selectClass}>{TRI_STATE_VALUES.map((v) => <option key={v} value={v}>{TRI_STATE_LABELS[v].fr}</option>)}</select></label>
          <label className={fieldClass}>Candidats sans autorisation de travail locale acceptés ?<select value={draft.noLocalWorkAuth} onChange={(e) => set("noLocalWorkAuth", e.target.value as TriState)} className={selectClass}>{TRI_STATE_VALUES.map((v) => <option key={v} value={v}>{TRI_STATE_LABELS[v].fr}</option>)}</select></label>
          <label className={fieldClass}>Accompagnement international prévu ?<select value={draft.intlSupport} onChange={(e) => set("intlSupport", e.target.value as SupportState)} className={selectClass}>{SUPPORT_VALUES.map((v) => <option key={v} value={v}>{SUPPORT_LABELS[v].fr}</option>)}</select></label>
          <label className={`${fieldClass} md:col-span-3`}>Pays de résidence des candidats que vous examinez<Input value={draft.reviewResidenceCountries} onChange={(e) => set("reviewResidenceCountries", e.target.value)} maxLength={1500} className="mt-1" placeholder="Ex. : Cameroun, Sénégal, Côte d’Ivoire" /></label>
          <label className={`${fieldClass} md:col-span-3`}>Précisions sur l’accompagnement (démarches, logement, transport…)<Textarea value={draft.intlSupportDetail} onChange={(e) => set("intlSupportDetail", e.target.value)} maxLength={1500} className="mt-1 min-h-16" /></label>
        </div>
      </fieldset>
      <div className="flex gap-2"><Button type="submit" className="bg-indigo-700 text-white hover:bg-indigo-800" disabled={create.isPending}>{create.isPending ? "Envoi…" : "Transmettre à 3M"}</Button><Button type="button" variant="outline" onClick={onCancel}>Annuler</Button></div>
    </form>
  );
}

/** Demande d'entretien : transmise à l'administration, qui vérifie l'offre et l'intérêt du candidat avant de programmer. */
export function InterviewForm({ sessionToken, profileCode, onDone, onCancel }: { sessionToken: string; profileCode: string; onDone: () => void; onCancel: () => void }) {
  const utils = trpc.useUtils();
  const needs = trpc.recruitment.needList.useQuery({ sessionToken }, { retry: false });
  const [needId, setNeedId] = useState("");
  const [slots, setSlots] = useState("");
  const [mode, setMode] = useState<(typeof INTERVIEW_MODES)[number]>("undecided");
  const [message, setMessage] = useState("");
  const request = trpc.recruitment.interviewRequest.useMutation({
    onSuccess: () => { toast.success("Demande d’entretien transmise à 3M"); void utils.recruitment.interviewList.invalidate(); onDone(); },
    onError: (error) => toast.error("Demande non transmise", { description: error.message }),
  });
  return (
    <form className="space-y-3 rounded-xl border border-indigo-200 bg-white p-4" data-testid="interview-form" aria-label={`Demander un entretien pour la fiche ${profileCode}`}
      onSubmit={(event) => { event.preventDefault(); request.mutate({ sessionToken, profileCode, needId: needId ? Number(needId) : undefined, proposedSlots: slots || undefined, mode, message: message || undefined }); }}>
      <p className="font-black text-slate-950">Demander un entretien — fiche {profileCode}</p>
      <p className="text-sm text-slate-600">3M vérifie votre offre, confirme l’intérêt du candidat puis programme l’entretien. Le candidat n’est jamais contacté directement par ce formulaire.</p>
      <label className={fieldClass}>Besoin concerné
        <select value={needId} onChange={(e) => setNeedId(e.target.value)} className={selectClass}><option value="">Aucun besoin lié (3M vous demandera des précisions)</option>{(needs.data ?? []).filter((n) => !["closed", "rejected"].includes(n.status)).map((n) => <option key={n.id} value={n.id}>{n.title} — {n.country}</option>)}</select>
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={fieldClass}>Créneaux proposés<Input value={slots} onChange={(e) => setSlots(e.target.value)} maxLength={500} className="mt-1" placeholder="Ex. : lundi ou mardi après-midi" /></label>
        <label className={fieldClass}>Mode<select value={mode} onChange={(e) => setMode(e.target.value as typeof mode)} className={selectClass}>{INTERVIEW_MODES.map((m) => <option key={m} value={m}>{INTERVIEW_MODE_LABELS[m]}</option>)}</select></label>
      </div>
      <label className={fieldClass}>Message pour 3M<Textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} className="mt-1 min-h-16" /></label>
      <div className="flex gap-2"><Button type="submit" className="bg-indigo-700 text-white hover:bg-indigo-800" disabled={request.isPending}>{request.isPending ? "Envoi…" : "Envoyer la demande"}</Button><Button type="button" variant="outline" onClick={onCancel}>Annuler</Button></div>
    </form>
  );
}

function NeedDetail({ sessionToken, id, onClose }: { sessionToken: string; id: number; onClose: () => void }) {
  const utils = trpc.useUtils();
  const detail = trpc.recruitment.needGet.useQuery({ sessionToken, id }, { retry: false });
  const decide = trpc.recruitment.employerDecision.useMutation({
    onSuccess: () => { toast.success("Décision enregistrée"); void utils.recruitment.needGet.invalidate(); },
    onError: (error) => toast.error("Décision impossible", { description: error.message }),
  });
  if (detail.error) return <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950" role="status">{detail.error.message}</p>;
  if (!detail.data) return <p className="text-sm text-slate-600" role="status">Chargement…</p>;
  const { need, candidates, history, adminMessage } = detail.data;
  return (
    <div className="space-y-3 rounded-xl border border-indigo-200 bg-white p-4" data-testid="need-detail">
      <div className="flex items-start justify-between gap-2"><div><p className="font-black text-slate-950">{need.title}</p><p className="text-xs text-slate-500">{need.country} · {NEED_STATUS_LABELS[need.status as NeedStatus]}</p></div><Button type="button" size="sm" variant="ghost" onClick={onClose}>Fermer</Button></div>
      {adminMessage && <p className="rounded-lg bg-amber-50 p-2 text-sm text-amber-950" role="status">Message de 3M : {adminMessage}</p>}
      <p className="whitespace-pre-line text-sm leading-6 text-slate-700">{need.missions}</p>
      <p className="text-xs text-slate-600">Candidatures de l’étranger : {TRI_STATE_LABELS[need.foreignApplications as TriState].fr} · Sans autorisation locale : {TRI_STATE_LABELS[need.noLocalWorkAuth as TriState].fr} · Accompagnement : {SUPPORT_LABELS[need.intlSupport as SupportState].fr}</p>
      <p className="text-xs text-slate-500">{INTERNATIONAL_FIELDS_NOTICE}</p>
      <div>
        <p className="text-sm font-black text-slate-950">Candidats suivis pour ce besoin</p>
        <ul className="mt-2 space-y-2">
          {candidates.map((c) => (
            <li key={c.id} className="rounded-lg border border-slate-200 p-3 text-sm" data-testid="need-candidate">
              <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-bold text-slate-950">{c.available ? `${c.jobTitle ?? "Profil"} · ${c.profileCode}` : "Profil plus disponible"}</span><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold">{c.statusLabel}</span></div>
              {c.canDecide && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button type="button" size="sm" disabled={decide.isPending} onClick={() => decide.mutate({ sessionToken, needCandidateId: c.id, decision: "selected" })}>Retenir</Button>
                  <Button type="button" size="sm" variant="outline" disabled={decide.isPending} onClick={() => decide.mutate({ sessionToken, needCandidateId: c.id, decision: "on_hold" })}>En attente</Button>
                  <Button type="button" size="sm" variant="outline" disabled={decide.isPending} onClick={() => decide.mutate({ sessionToken, needCandidateId: c.id, decision: "not_selected" })}>Ne pas retenir</Button>
                </div>
              )}
            </li>
          ))}
          {candidates.length === 0 && <li className="text-sm text-slate-600">Aucun candidat suivi pour l’instant. Proposez un profil depuis la CVthèque.</li>}
        </ul>
      </div>
      {history.length > 0 && <details className="text-xs text-slate-600"><summary className="cursor-pointer font-semibold">Historique</summary><ul className="mt-1 space-y-0.5">{history.map((h, i) => <li key={i}>{when(h.at)} — {h.action}</li>)}</ul></details>}
    </div>
  );
}

/** Onglet « Besoins » de l'espace partenaire. */
export function PartnerNeeds({ sessionToken }: { sessionToken: string }) {
  const needs = trpc.recruitment.needList.useQuery({ sessionToken }, { retry: false });
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  return (
    <section className="space-y-4" data-testid="partner-needs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-black text-slate-950"><ClipboardList className="h-5 w-5 text-indigo-700" aria-hidden="true" />Mes besoins de recrutement</p>
        {!creating && <Button type="button" className="bg-indigo-700 text-white hover:bg-indigo-800" onClick={() => setCreating(true)}><Plus className="mr-1 h-4 w-4" aria-hidden="true" />Déposer un besoin</Button>}
      </div>
      {creating && <NeedForm sessionToken={sessionToken} onDone={() => setCreating(false)} onCancel={() => setCreating(false)} />}
      {needs.error && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950" role="status">{needs.error.message}</p>}
      <ul className="grid gap-3 lg:grid-cols-2">
        {(needs.data ?? []).map((need) => (
          <li key={need.id} className="rounded-xl border border-slate-200 bg-white p-4" data-testid="need-row">
            <p className="font-black text-slate-950">{need.title}</p>
            <p className="text-xs text-slate-500">{need.country} · déposé le {when(need.createdAt)}</p>
            <p className="mt-1 text-sm text-slate-700">{NEED_STATUS_LABELS[need.status as NeedStatus]} · {need.candidatesCount} candidat(s) suivi(s)</p>
            <button type="button" onClick={() => setOpenId(openId === need.id ? null : need.id)} className="mt-2 text-sm font-bold text-indigo-800 underline underline-offset-2">{openId === need.id ? "Masquer le suivi" : "Voir le suivi"}</button>
          </li>
        ))}
      </ul>
      {!needs.isLoading && !needs.error && (needs.data ?? []).length === 0 && !creating && <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">Aucun besoin déposé. Décrivez un poste : 3M l’examine puis vous présente des profils adaptés.</p>}
      {openId && <NeedDetail sessionToken={sessionToken} id={openId} onClose={() => setOpenId(null)} />}
    </section>
  );
}

/** Onglet « Suivi » : demandes d'entretien et notifications. Aucune notification ne contient de pièce ni de donnée sensible. */
export function PartnerTracking({ sessionToken }: { sessionToken: string }) {
  const utils = trpc.useUtils();
  const interviews = trpc.recruitment.interviewList.useQuery({ sessionToken }, { retry: false });
  const notifications = trpc.recruitment.notificationList.useQuery({ sessionToken }, { retry: false });
  const markRead = trpc.recruitment.notificationsMarkRead.useMutation({ onSuccess: () => void utils.recruitment.notificationList.invalidate() });
  const unread = (notifications.data ?? []).filter((n) => !n.read).length;
  return (
    <section className="space-y-4" data-testid="partner-tracking">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-2"><p className="flex items-center gap-2 font-black text-slate-950"><Bell className="h-5 w-5 text-indigo-700" aria-hidden="true" />Notifications {unread > 0 && <span className="rounded-full bg-rose-600 px-2 py-0.5 text-xs text-white">{unread}</span>}</p>{unread > 0 && <Button type="button" size="sm" variant="outline" onClick={() => markRead.mutate({ sessionToken })}>Tout marquer comme lu</Button>}</div>
        <ul className="mt-2 space-y-2">
          {(notifications.data ?? []).map((n) => <li key={n.id} className={`rounded-lg p-2 text-sm ${n.read ? "bg-slate-50 text-slate-700" : "bg-indigo-50 text-indigo-950"}`}><p className="font-bold">{n.title} <span className="text-xs font-normal text-slate-500">{when(n.createdAt)}</span></p><p>{n.message}</p></li>)}
          {!notifications.isLoading && (notifications.data ?? []).length === 0 && <li className="text-sm text-slate-600">Aucune notification.</li>}
        </ul>
        {notifications.error && <p className="mt-2 text-sm text-amber-950" role="status">{notifications.error.message}</p>}
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="font-black text-slate-950">Demandes d’entretien</p>
        <ul className="mt-2 space-y-2">
          {(interviews.data ?? []).map((iv) => <li key={iv.id} className="rounded-lg border border-slate-200 p-3 text-sm" data-testid="interview-row"><p className="font-bold text-slate-950">{iv.jobTitle ?? "Profil"} · {iv.profileCode}</p><p className="text-slate-700">{INTERVIEW_STATUS_LABELS[iv.status]}{iv.scheduledAt ? ` — ${new Date(iv.scheduledAt).toLocaleString("fr-FR")}` : ""} · {INTERVIEW_MODE_LABELS[iv.mode]}</p></li>)}
          {!interviews.isLoading && (interviews.data ?? []).length === 0 && <li className="text-sm text-slate-600">Aucune demande d’entretien.</li>}
        </ul>
        {interviews.error && <p className="mt-2 text-sm text-amber-950" role="status">{interviews.error.message}</p>}
      </div>
    </section>
  );
}
