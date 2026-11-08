import { useMemo, useState } from "react";
import { BadgeCheck, ExternalLink, FileSignature, Loader2, MailPlus, PauseCircle, Send, UserRoundCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  PARTNERSHIP_KIND_LABELS,
  PARTNERSHIP_STATUSES,
  PARTNERSHIP_STATUS_LABELS,
  PARTNERSHIP_TERMS_LIMITS,
  formatCommissionRate,
  partnershipTermsProblem,
  type PartnershipStatus,
} from "@shared/partnershipProgram";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = { sessionToken: string };

const TONE: Record<PartnershipStatus, string> = {
  submitted: "bg-sky-100 text-sky-900",
  in_review: "bg-amber-100 text-amber-900",
  protocol_issued: "bg-indigo-100 text-indigo-900",
  partner_signed: "bg-violet-100 text-violet-900",
  active: "bg-emerald-100 text-emerald-900",
  rejected: "bg-slate-200 text-slate-700",
  suspended: "bg-rose-100 text-rose-900",
};
const formatDate = (value: string | Date | null | undefined) => (value ? new Date(value).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "—");
const bpsFromPercent = (value: string) => Math.round(Number.parseFloat(value.replace(",", ".")) * 100);

function Detail({ id, sessionToken, onChanged }: { id: number; sessionToken: string; onChanged: () => void }) {
  const utils = trpc.useUtils();
  const detail = trpc.partnership.adminGet.useQuery({ sessionToken, id }, { retry: false });
  const limits = PARTNERSHIP_TERMS_LIMITS;
  const [terms, setTerms] = useState({
    percent: String(limits.commissionBps.proposed / 100),
    termMonths: String(limits.termMonths.proposed),
    attributionMonths: String(limits.attributionMonths.proposed),
    paymentDelayDays: String(limits.paymentDelayDays.proposed),
    territory: "",
    note: "",
  });
  const [reason, setReason] = useState("");
  const [lastLink, setLastLink] = useState<string | null>(null);
  const refresh = () => { void utils.partnership.adminGet.invalidate({ sessionToken, id }); onChanged(); };
  const fail = (error: { message: string }) => toast.error(error.message);

  const setStatus = trpc.partnership.adminSetStatus.useMutation({ onSuccess: () => { toast.success("Statut mis à jour."); setReason(""); refresh(); }, onError: fail });
  const issue = trpc.partnership.adminIssueProtocol.useMutation({
    onSuccess: (result) => { setLastLink(result.link); toast.success(result.emailSent ? "Protocole émis et lien envoyé par e-mail." : "Protocole émis, mais l’e-mail n’a pas pu partir : copiez le lien ci-dessous."); refresh(); },
    onError: fail,
  });
  const resend = trpc.partnership.adminResendLink.useMutation({
    onSuccess: (result) => { setLastLink(result.link); toast.success(result.emailSent ? "Nouveau lien envoyé." : "Nouveau lien créé, e-mail non envoyé : copiez le lien."); refresh(); },
    onError: fail,
  });
  const countersign = trpc.partnership.adminCountersign.useMutation({
    onSuccess: (result) => { toast.success(result.emailSent ? `Partenaire activé (code ${result.referralCode}). E-mail envoyé.` : `Partenaire activé (code ${result.referralCode}). E-mail non envoyé.`); refresh(); },
    onError: fail,
  });
  const openPdf = async () => {
    try {
      const result = await utils.partnership.adminPdfUrl.fetch({ sessionToken, id });
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      fail({ message: error instanceof Error ? error.message : "Le PDF n’est pas disponible." });
    }
  };

  const row = detail.data;
  if (detail.isLoading) return <p className="flex items-center gap-2 p-4 text-sm text-slate-600"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Chargement…</p>;
  if (!row) return <p className="p-4 text-sm text-rose-700" role="alert">{detail.error?.message ?? "Dossier introuvable."}</p>;

  const agency = row.kind === "travel_agency";
  const draftTerms = {
    commissionRateBps: bpsFromPercent(terms.percent),
    termMonths: Number.parseInt(terms.termMonths, 10),
    attributionMonths: Number.parseInt(terms.attributionMonths, 10),
    paymentDelayDays: Number.parseInt(terms.paymentDelayDays, 10),
    territory: terms.territory.trim() || row.country,
  };
  const problem = partnershipTermsProblem(draftTerms);
  const canIssue = ["submitted", "in_review", "protocol_issued"].includes(row.status);
  const busy = setStatus.isPending || issue.isPending || resend.isPending || countersign.isPending;

  return (
    <div className="space-y-5 p-4" data-testid="admin-partnership-detail">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-black text-slate-950">{row.reference}</span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${TONE[row.status]}`}>{PARTNERSHIP_STATUS_LABELS[row.status].fr}</span>
        <span className="text-xs text-slate-500">{PARTNERSHIP_KIND_LABELS[row.kind].fr} · reçu le {formatDate(row.createdAt)}</span>
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        {([
          [agency ? "Agence" : "Nom", agency ? row.companyName : row.contactName],
          [agency ? "Représentant" : "Contact", `${row.contactName}${row.representativeRole ? ` (${row.representativeRole})` : ""}`],
          ["E-mail", row.email],
          ["Téléphone", row.phone],
          ["Pays / ville", [row.country, row.city].filter(Boolean).join(" / ")],
          ...(agency ? [["Immatriculation", row.legalRegistration], ["Identifiant fiscal", row.taxId], ["Licence", row.licenceNumber], ["Site", row.website], ["Années d’activité", row.yearsActive]] : []),
          ["Canaux", row.channels], ["Volume estimé / mois", row.volumeBand],
        ] as Array<[string, string | number | null | undefined]>).map(([label, value]) => (
          <div key={label}><dt className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</dt><dd className="break-words text-slate-900">{value || "—"}</dd></div>
        ))}
      </dl>
      {row.message ? <p className="whitespace-pre-line rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800">{row.message}</p> : null}
      {agency ? <p className="text-xs text-amber-800">À vérifier avant d’émettre le protocole : l’existence de l’agence au registre du pays et la qualité du représentant.</p> : <p className="text-xs text-amber-800">À vérifier avant d’émettre le protocole : l’identité de la personne et l’absence de conflit d’intérêts.</p>}

      {row.commissionRateBps ? (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-950">
          Conditions émises : commission <strong>{formatCommissionRate(row.commissionRateBps)}</strong> · durée {row.termMonths} mois · attribution {row.attributionMonths} mois · versement {row.paymentDelayDays} j · territoire « {row.territory} ».
          {row.protocolIssuedAt ? <> Émis le {formatDate(row.protocolIssuedAt)} par {row.protocolIssuedBy}.</> : null}
          {row.protocolFingerprint ? <p className="mt-1 break-all font-mono text-[11px] text-indigo-800">Empreinte SHA-256 : {row.protocolFingerprint}</p> : null}
        </div>
      ) : null}

      {row.status === "partner_signed" ? (
        <div className="rounded-lg border border-violet-200 bg-violet-50 p-3 text-sm text-violet-950">
          Signé par <strong>{row.partnerSignatureName}</strong> le {formatDate(row.partnerSignedAt)} (IP {row.partnerSignatureIp ?? "—"}). Vérifiez l’exemplaire, puis contresignez : le partenaire devient actif et son suivi de parrainage est créé au taux convenu.
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={openPdf} className="min-h-10"><ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />Voir l’exemplaire signé</Button>
            <Button type="button" onClick={() => { if (window.confirm(`Contresigner le protocole ${row.reference} au nom de 3M ? Le partenaire sera activé et son code envoyé.`)) countersign.mutate({ sessionToken, id }); }} disabled={busy} className="min-h-10" data-testid="admin-partnership-countersign"><BadgeCheck className="mr-2 h-4 w-4" aria-hidden="true" />Contresigner et activer</Button>
          </div>
        </div>
      ) : null}

      {row.status === "active" ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">
          Actif depuis le {formatDate(row.countersignedAt)} (contresigné par {row.countersignedBy}). Code de parrainage : <strong className="font-mono">{row.referralCode}</strong>.
          <div className="mt-3"><Button type="button" variant="outline" onClick={openPdf} className="min-h-10"><ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />Exemplaire signé par les deux parties</Button></div>
        </div>
      ) : null}

      {row.status === "rejected" && row.rejectionReason ? <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">Motif du refus : {row.rejectionReason}</p> : null}

      {canIssue ? (
        <div className="space-y-3 rounded-xl border border-slate-200 p-4">
          <p className="flex items-center gap-2 font-black text-slate-950"><FileSignature className="h-4 w-4 text-blue-800" aria-hidden="true" />{row.status === "protocol_issued" ? "Ré-émettre le protocole (nouvelles conditions)" : "Émettre le protocole d’accord"}</p>
          <p className="text-xs leading-5 text-slate-600">Les conditions sont écrites dans le protocole que le partenaire signera. Le taux proposé reprend celui du programme ambassadeur actuel ; ajustez-le selon le partenaire. Ré-émettre invalide le lien précédent.</p>
          <div className="grid gap-3 sm:grid-cols-4">
            <div><Label htmlFor="t-rate">Commission (%)</Label><Input id="t-rate" value={terms.percent} onChange={(e) => setTerms({ ...terms, percent: e.target.value })} inputMode="decimal" className="mt-1" data-testid="admin-partnership-rate" /></div>
            <div><Label htmlFor="t-term">Durée (mois)</Label><Input id="t-term" value={terms.termMonths} onChange={(e) => setTerms({ ...terms, termMonths: e.target.value.replace(/\D/g, "") })} inputMode="numeric" className="mt-1" /></div>
            <div><Label htmlFor="t-attr">Attribution (mois)</Label><Input id="t-attr" value={terms.attributionMonths} onChange={(e) => setTerms({ ...terms, attributionMonths: e.target.value.replace(/\D/g, "") })} inputMode="numeric" className="mt-1" /></div>
            <div><Label htmlFor="t-delay">Versement (jours)</Label><Input id="t-delay" value={terms.paymentDelayDays} onChange={(e) => setTerms({ ...terms, paymentDelayDays: e.target.value.replace(/\D/g, "") })} inputMode="numeric" className="mt-1" /></div>
          </div>
          <div><Label htmlFor="t-terr">Territoire ou zone d’intervention</Label><Input id="t-terr" value={terms.territory} onChange={(e) => setTerms({ ...terms, territory: e.target.value })} placeholder={row.country} maxLength={200} className="mt-1" /></div>
          <div><Label htmlFor="t-note">Note interne (facultatif)</Label><Textarea id="t-note" value={terms.note} onChange={(e) => setTerms({ ...terms, note: e.target.value })} rows={2} maxLength={1000} className="mt-1" /></div>
          {problem ? <p className="text-sm font-semibold text-rose-700" role="alert">{problem}</p> : null}
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={Boolean(problem) || busy} onClick={() => issue.mutate({ sessionToken, id, terms: draftTerms, note: terms.note || undefined })} className="min-h-10" data-testid="admin-partnership-issue">
              {issue.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="mr-2 h-4 w-4" aria-hidden="true" />}Émettre et envoyer le lien
            </Button>
            {row.status === "protocol_issued" ? <Button type="button" variant="outline" disabled={busy} onClick={() => resend.mutate({ sessionToken, id })} className="min-h-10"><MailPlus className="mr-2 h-4 w-4" aria-hidden="true" />Renvoyer un lien (mêmes conditions)</Button> : null}
          </div>
          {lastLink ? <p className="break-all rounded-lg bg-slate-50 p-2 font-mono text-xs text-slate-700">Lien de signature : {lastLink}</p> : null}
        </div>
      ) : null}

      {row.status === "submitted" ? (
        <Button type="button" variant="outline" disabled={busy} onClick={() => setStatus.mutate({ sessionToken, id, status: "in_review" })} className="min-h-10"><UserRoundCheck className="mr-2 h-4 w-4" aria-hidden="true" />Passer en vérification</Button>
      ) : null}

      {["submitted", "in_review", "protocol_issued", "partner_signed", "active"].includes(row.status) ? (
        <div className="space-y-2 rounded-xl border border-rose-200 bg-rose-50/50 p-4">
          <Label htmlFor="t-reason">Motif (obligatoire pour refuser ou suspendre)</Label>
          <Input id="t-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} placeholder="Ex. : immatriculation introuvable au registre" />
          <div className="flex flex-wrap gap-2">
            {["submitted", "in_review", "protocol_issued"].includes(row.status) ? <Button type="button" variant="outline" disabled={busy || reason.trim().length < 5} onClick={() => setStatus.mutate({ sessionToken, id, status: "rejected", note: reason.trim() })} className="min-h-10"><XCircle className="mr-2 h-4 w-4" aria-hidden="true" />Refuser la candidature</Button> : null}
            {["partner_signed", "active"].includes(row.status) ? <Button type="button" variant="outline" disabled={busy || reason.trim().length < 5} onClick={() => setStatus.mutate({ sessionToken, id, status: "suspended", note: reason.trim() })} className="min-h-10"><PauseCircle className="mr-2 h-4 w-4" aria-hidden="true" />Suspendre (coupe le suivi de commission)</Button> : null}
          </div>
        </div>
      ) : null}

      {row.hasProtocol && row.protocolText ? (
        <details className="rounded-lg border border-slate-200 p-3 text-sm">
          <summary className="cursor-pointer font-bold text-slate-900">Texte exact du protocole émis</summary>
          <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap text-xs leading-5 text-slate-700">{row.protocolText}</pre>
        </details>
      ) : null}

      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Historique</p>
        <ul className="mt-2 space-y-1.5 text-sm">
          {row.events.map((event) => (
            <li key={event.id} className="rounded-lg bg-slate-50 px-3 py-2"><span className="font-semibold text-slate-900">{formatDate(event.createdAt)}</span> — {event.summary}{event.actor ? <span className="text-slate-500"> ({event.actor})</span> : null}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Console du programme de partenariat : file de traitement, émission du protocole, contresignature, suspension. */
export function AdminPartnership({ sessionToken }: Props) {
  const [status, setStatus] = useState<PartnershipStatus | "">("");
  const [selected, setSelected] = useState<number | null>(null);
  const utils = trpc.useUtils();
  const list = trpc.partnership.adminList.useQuery({ sessionToken, status: status || undefined }, { retry: false, refetchOnWindowFocus: false });
  const counts = trpc.partnership.adminCounts.useQuery({ sessionToken }, { retry: false, refetchOnWindowFocus: false });
  const onChanged = () => { void utils.partnership.adminList.invalidate(); void utils.partnership.adminCounts.invalidate(); };
  const rows = useMemo(() => list.data ?? [], [list.data]);
  const notReady = list.error?.message?.includes("migration 0098");

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="admin-partnership-title" data-testid="admin-partnership">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="admin-partnership-title" className="text-xl font-black text-slate-950">Partenariats : agences de voyage et particuliers</h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">Candidatures reçues sur /partenariat, protocole d’accord (émission, signature en ligne, contresignature) et activation du suivi de parrainage. Aucune commission n’est due avant la contresignature.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-bold">
          <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-900">À examiner : {counts.data?.toReview ?? "…"}</span>
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-indigo-900">Attente de signature : {counts.data?.awaitingSignature ?? "…"}</span>
          <span className="rounded-full bg-violet-100 px-3 py-1 text-violet-900">À contresigner : {counts.data?.toCountersign ?? "…"}</span>
        </div>
      </div>

      {notReady ? <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="alert">Le programme de partenariat n’est pas encore activé : la migration 0098 doit être appliquée.</p> : null}

      <div className="mt-4 flex items-center gap-2">
        <Label htmlFor="partnership-status-filter" className="text-sm">Statut</Label>
        <select id="partnership-status-filter" value={status} onChange={(e) => setStatus(e.target.value as PartnershipStatus | "")} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm">
          <option value="">Tous</option>
          {PARTNERSHIP_STATUSES.map((value) => <option key={value} value={value}>{PARTNERSHIP_STATUS_LABELS[value].fr}</option>)}
        </select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="p-3">Référence</th><th className="p-3">Partenaire</th><th className="p-3">Profil</th><th className="p-3">Pays</th><th className="p-3">Statut</th><th className="p-3">Commission</th><th className="p-3">Reçu le</th></tr></thead>
          <tbody>
            {list.isLoading ? <tr><td colSpan={7} className="p-4 text-slate-500">Chargement…</td></tr> : rows.length === 0 ? <tr><td colSpan={7} className="p-4 text-slate-500">Aucun dossier.</td></tr> : rows.map((row) => (
              <tr key={row.id} className={`cursor-pointer border-t border-slate-100 hover:bg-slate-50 ${selected === row.id ? "bg-blue-50" : ""}`} onClick={() => setSelected(selected === row.id ? null : row.id)} data-testid={`admin-partnership-row-${row.id}`}>
                <td className="p-3 font-bold">{row.reference}</td>
                <td className="p-3">{row.partnerName}<span className="block text-xs text-slate-500">{row.email}</span></td>
                <td className="p-3">{PARTNERSHIP_KIND_LABELS[row.kind].fr}</td>
                <td className="p-3">{row.country}</td>
                <td className="p-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${TONE[row.status]}`}>{row.statusLabel}</span></td>
                <td className="p-3">{row.commissionRate ?? "—"}</td>
                <td className="p-3">{new Date(row.createdAt).toLocaleDateString("fr-FR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected ? <div className="mt-4 rounded-xl border border-slate-200"><Detail key={selected} id={selected} sessionToken={sessionToken} onChanged={onChanged} /></div> : null}
    </section>
  );
}
