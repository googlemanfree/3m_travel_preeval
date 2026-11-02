import { useState } from "react";
import { Inbox } from "lucide-react";
import { toast } from "sonner";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";
import { trpc } from "@/lib/trpc";
import {
  ADMIN_SETTABLE_NEED_CANDIDATE,
  CANDIDATE_STATUS_LABELS,
  INTERVIEW_MODE_LABELS,
  INTERVIEW_STATUS_LABELS,
  INTERVIEW_STATUSES,
  NEED_STATUSES,
  NEED_STATUS_LABELS,
  SUPPORT_LABELS,
  TRI_STATE_LABELS,
  canAdvanceInterview,
  canAdvanceNeedCandidate,
  type InterviewStatus,
  type NeedCandidateStatus,
  type NeedStatus,
  type SupportState,
  type TriState,
} from "@shared/recruitment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type InterviewItem = inferRouterOutputs<AppRouter>["recruitment"]["adminInbox"]["interviews"][number];
const selectClass = "h-9 rounded-md border border-slate-300 bg-white px-2 text-sm";
const when = (value: unknown) => (value ? new Date(value as string | number | Date).toLocaleDateString("fr-FR") : "");

function NeedPanel({ sessionToken, id, onChanged }: { sessionToken: string; id: number; onChanged: () => void }) {
  const detail = trpc.recruitment.adminNeedGet.useQuery({ sessionToken, id }, { retry: false });
  const [note, setNote] = useState("");
  const [addId, setAddId] = useState("");
  const done = () => { void detail.refetch(); onChanged(); };
  const review = trpc.recruitment.adminNeedReview.useMutation({ onSuccess: () => { toast.success("Besoin mis à jour"); done(); }, onError: (e) => toast.error(e.message) });
  const update = trpc.recruitment.adminNeedCandidateUpdate.useMutation({ onSuccess: () => { toast.success("Suivi mis à jour"); done(); }, onError: (e) => toast.error(e.message) });
  const add = trpc.recruitment.adminAddCandidateToNeed.useMutation({ onSuccess: () => { toast.success("Profil ajouté au besoin"); setAddId(""); done(); }, onError: (e) => toast.error(e.message) });
  if (detail.error) return <p className="text-sm text-amber-950" role="status">{detail.error.message}</p>;
  if (!detail.data) return <p className="text-sm text-slate-600">Chargement…</p>;
  const { need, organization, candidates, history } = detail.data;
  return (
    <div className="mt-3 space-y-3 rounded-lg bg-slate-50 p-3 text-sm" data-testid="admin-need-panel">
      <p className="font-bold text-slate-950">{organization}{need.beneficiaryConfidential ? " · bénéficiaire confidentiel" : need.companyName ? ` · pour ${need.companyName}` : ""}</p>
      <p className="whitespace-pre-line text-slate-700">{need.missions}</p>
      <p className="text-xs text-slate-600">{need.workLocation ?? "—"} · {need.contractDuration ?? "—"} · {need.salaryGross ? `${need.salaryGross} ${need.salaryCurrency ?? ""}` : "rémunération non précisée"} · Exigences : {[need.requiredSkills, need.requiredQualifications, need.requiredExperience, need.requiredLanguages].filter(Boolean).join(" ; ") || "—"}</p>
      <p className="rounded-lg bg-sky-50 p-2 text-xs text-sky-950" data-testid="admin-need-international">Déclarations de l’employeur (à confirmer, aucune garantie) — Candidatures de l’étranger : <strong>{TRI_STATE_LABELS[need.foreignApplications as TriState].fr}</strong> · Sans autorisation de travail locale : <strong>{TRI_STATE_LABELS[need.noLocalWorkAuth as TriState].fr}</strong> · Accompagnement : <strong>{SUPPORT_LABELS[need.intlSupport as SupportState].fr}</strong>{need.intlSupportDetail ? ` (${need.intlSupportDetail})` : ""} · Pays de résidence examinés : {need.reviewResidenceCountries ?? "—"}</p>
      <div className="space-y-2">
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={1500} aria-label="Message ou motif" placeholder="Message à l’employeur ou motif (obligatoire pour « informations demandées », « non retenu » ou « clos »)" className="min-h-14" />
        <div className="flex flex-wrap gap-2">
          {NEED_STATUSES.filter((s) => s !== need.status).map((s) => <Button key={s} type="button" size="sm" variant="outline" disabled={review.isPending || (["needs_info", "rejected", "closed"].includes(s) && !note.trim())} onClick={() => review.mutate({ sessionToken, id, status: s, note: note || undefined })}>{NEED_STATUS_LABELS[s]}</Button>)}
        </div>
      </div>
      <div>
        <p className="font-black text-slate-950">Candidats ({candidates.length})</p>
        <ul className="mt-1 space-y-2">
          {candidates.map((c) => (
            <li key={c.id} className="rounded-lg border border-slate-200 bg-white p-2" data-testid="admin-need-candidate">
              <p className="font-semibold text-slate-950">{c.candidateName} <span className="text-xs font-normal text-slate-500">· {c.profileCode} · {c.jobTitle ?? "—"} · proposé par {c.origin === "employer" ? "l’employeur" : "3M"}</span></p>
              <p className="text-xs text-slate-600">{CANDIDATE_STATUS_LABELS[c.status as NeedCandidateStatus]} · Décision employeur : {c.employerDecision}{c.employerComment ? ` (${c.employerComment})` : ""}</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {ADMIN_SETTABLE_NEED_CANDIDATE.filter((s) => s !== c.status && canAdvanceNeedCandidate(c.status as NeedCandidateStatus, s)).map((s) => <Button key={s} type="button" size="sm" variant="outline" disabled={update.isPending} onClick={() => update.mutate({ sessionToken, id: c.id, status: s, note: note || undefined })}>{s === "candidate_contacted" ? "Soumettre au candidat" : s === "presented" ? "Présenter à l’employeur" : s === "closed" ? "Clore" : s}</Button>)}
              </div>
            </li>
          ))}
        </ul>
        <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (addId) add.mutate({ sessionToken, needId: id, cvthequeProfileId: Number(addId) }); }}>
          <Input type="number" min={1} value={addId} onChange={(e) => setAddId(e.target.value)} placeholder="N° de fiche CVthèque" aria-label="Numéro de fiche CVthèque à ajouter" className="max-w-52" />
          <Button type="submit" size="sm" variant="outline" disabled={add.isPending || !addId}>Ajouter un profil publié</Button>
        </form>
      </div>
      {history.length > 0 && <details className="text-xs text-slate-600"><summary className="cursor-pointer font-semibold">Historique ({history.length})</summary><ul className="mt-1 space-y-0.5">{history.map((h, i) => <li key={i}>{when(h.at)} · {h.actorType}{h.actorLabel ? ` (${h.actorLabel})` : ""} — {h.action}{h.note ? ` : ${h.note}` : ""}</li>)}</ul></details>}
    </div>
  );
}

function InterviewRow({ sessionToken, iv, onChanged }: { sessionToken: string; iv: InterviewItem; onChanged: () => void }) {
  const [note, setNote] = useState("");
  const [date, setDate] = useState("");
  const update = trpc.recruitment.adminInterviewUpdate.useMutation({ onSuccess: () => { toast.success("Demande mise à jour"); onChanged(); }, onError: (e) => toast.error(e.message) });
  const next = INTERVIEW_STATUSES.filter((s) => s !== iv.status && canAdvanceInterview(iv.status as InterviewStatus, s));
  return (
    <li className="rounded-xl border border-slate-200 p-3 text-sm" data-testid="admin-interview-row">
      <p className="font-bold text-slate-950">{iv.organization} → {iv.candidateName} <span className="text-xs font-normal text-slate-500">· {iv.profileCode} · {INTERVIEW_MODE_LABELS[iv.mode as keyof typeof INTERVIEW_MODE_LABELS]}</span></p>
      <p className="text-xs text-slate-600">{INTERVIEW_STATUS_LABELS[iv.status as InterviewStatus]}{iv.proposedSlots ? ` · créneaux : ${iv.proposedSlots}` : ""}{iv.message ? ` · « ${iv.message} »` : ""}</p>
      {next.length > 0 && (
        <div className="mt-2 space-y-2">
          <div className="flex flex-wrap gap-2">
            {next.includes("scheduled") && <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date de l’entretien" className="max-w-56" />}
            <Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} aria-label="Note ou motif" placeholder="Note / motif" className="max-w-xs" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {next.map((s) => <Button key={s} type="button" size="sm" variant="outline" disabled={update.isPending || (s === "scheduled" && !date)} onClick={() => update.mutate({ sessionToken, id: iv.id, status: s, note: note || undefined, scheduledAt: s === "scheduled" && date ? new Date(date).toISOString() : undefined })}>{INTERVIEW_STATUS_LABELS[s]}</Button>)}
          </div>
        </div>
      )}
    </li>
  );
}

/** Boîte de réception admin : besoins déposés, candidats à soumettre, demandes d'entretien et notifications. L'administration garde la main sur chaque étape. */
export function AdminRecruitmentInbox({ sessionToken }: { sessionToken: string }) {
  const [status, setStatus] = useState<"" | NeedStatus>("");
  const [openId, setOpenId] = useState<number | null>(null);
  const inbox = trpc.recruitment.adminInbox.useQuery({ sessionToken, status: status || undefined }, { enabled: Boolean(sessionToken), retry: false });
  const notifications = trpc.recruitment.adminNotifications.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false });
  const needs = inbox.data?.needs ?? [];
  const pending = needs.filter((n) => n.status === "received" || n.status === "under_review").length;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5" aria-labelledby="admin-recruitment-title" data-testid="admin-recruitment-inbox">
      <h2 id="admin-recruitment-title" className="flex items-center gap-2 text-lg font-black text-slate-950"><Inbox className="h-5 w-5 text-sky-700" aria-hidden="true" />Besoins, présentations et entretiens{pending > 0 && <span className="rounded-full bg-rose-600 px-2 py-0.5 text-xs text-white">{pending} à examiner</span>}</h2>
      <p className="mt-1 text-sm text-slate-600">Vérifiez l’offre et l’employeur avant de soumettre un candidat. Ni « visa garanti », ni « admissible », ni « emploi garanti » ne doivent être communiqués : les réponses sur les candidatures de l’étranger sont des déclarations à confirmer.</p>
      {inbox.error && <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950" role="status">{inbox.error.message}</p>}
      {(notifications.data ?? []).filter((n) => !n.read).length > 0 && <ul className="mt-3 space-y-1">{(notifications.data ?? []).slice(0, 5).map((n) => <li key={n.id} className="rounded-lg bg-sky-50 p-2 text-xs text-sky-950"><strong>{n.title}</strong> — {n.message}</li>)}</ul>}
      <div className="mt-3 flex items-center gap-2"><label className="text-sm font-semibold text-slate-800" htmlFor="recruitment-status-filter">Statut</label><select id="recruitment-status-filter" value={status} onChange={(e) => setStatus(e.target.value as "" | NeedStatus)} className={selectClass}><option value="">Tous</option>{NEED_STATUSES.map((s) => <option key={s} value={s}>{NEED_STATUS_LABELS[s]}</option>)}</select></div>
      <ul className="mt-3 space-y-2">
        {needs.map((n) => (
          <li key={n.id} className="rounded-xl border border-slate-200 p-3" data-testid="admin-need-row">
            <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-bold text-slate-950">{n.title} <span className="text-sm font-normal text-slate-500">· {n.organization} · {n.country} · {when(n.createdAt)}</span></p><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold">{NEED_STATUS_LABELS[n.status as NeedStatus]}</span></div>
            <p className="text-xs text-slate-600">{n.candidatesCount} candidat(s) · Candidatures de l’étranger : {TRI_STATE_LABELS[n.foreignApplications as TriState].fr} · Sans autorisation locale : {TRI_STATE_LABELS[n.noLocalWorkAuth as TriState].fr}</p>
            <button type="button" onClick={() => setOpenId(openId === n.id ? null : n.id)} className="mt-1 text-sm font-bold text-sky-800 underline underline-offset-2">{openId === n.id ? "Fermer" : "Examiner"}</button>
            {openId === n.id && <NeedPanel sessionToken={sessionToken} id={n.id} onChanged={() => void inbox.refetch()} />}
          </li>
        ))}
        {!inbox.isLoading && needs.length === 0 && !inbox.error && <li className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">Aucun besoin dans cet état.</li>}
      </ul>
      <h3 className="mt-5 font-black text-slate-950">Demandes d’entretien</h3>
      <ul className="mt-2 space-y-2">
        {(inbox.data?.interviews ?? []).map((iv) => <InterviewRow key={`${iv.id}-${iv.status}`} sessionToken={sessionToken} iv={iv} onChanged={() => void inbox.refetch()} />)}
        {!inbox.isLoading && (inbox.data?.interviews ?? []).length === 0 && !inbox.error && <li className="text-sm text-slate-600">Aucune demande d’entretien.</li>}
      </ul>
    </section>
  );
}
