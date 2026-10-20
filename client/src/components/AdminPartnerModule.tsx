import { useMemo, useState } from "react";
import { BellRing, Building2, FileCheck2, History, Link2, MailPlus, Search } from "lucide-react";
import { toast } from "sonner";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";
import { trpc } from "@/lib/trpc";
import {
  PARTNER_CATEGORIES,
  PARTNER_CATEGORY_LABELS,
  PARTNER_INTERACTION_KINDS,
  PARTNER_RELATIONSHIP_STATUSES,
  PARTNER_STATUS_LABELS,
  canDisplayPartnerPublicly,
  type PartnerCategory,
  type PartnerRelationshipStatus,
} from "@shared/partnerModule";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Props = { sessionToken: string };
type PartnerRow = inferRouterOutputs<AppRouter>["partnerModule"]["adminPartnerOverview"][number];

const STATUS_TONE: Record<PartnerRelationshipStatus, string> = {
  prospect: "bg-slate-100 text-slate-800",
  contacted: "bg-sky-100 text-sky-900",
  in_verification: "bg-amber-100 text-amber-900",
  validated: "bg-indigo-100 text-indigo-900",
  active: "bg-emerald-100 text-emerald-900",
  suspended: "bg-rose-100 text-rose-900",
};
const KIND_LABEL: Record<string, string> = { note: "Note", call: "Appel", email: "E-mail", meeting: "Rendez-vous", status_change: "Statut", invitation: "Invitation", document: "Document" };
const toLocalInput = (value: string | Date | null | undefined) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
const formatDate = (value: string | Date | null | undefined) => (value ? new Date(value).toLocaleDateString("fr-FR") : "—");

function PartnerDetail({ partner, sessionToken, onChanged }: { partner: PartnerRow; sessionToken: string; onChanged: () => void }) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    category: partner.category as PartnerCategory,
    relationshipStatus: partner.relationshipStatus as PartnerRelationshipStatus,
    primaryContactName: partner.primaryContactName ?? "",
    primaryContactEmail: partner.primaryContactEmail ?? "",
    primaryContactPhone: partner.primaryContactPhone ?? "",
    primaryContactRole: partner.primaryContactRole ?? "",
    specialties: partner.specialties ?? "",
    operatingCountries: partner.operatingCountries ?? "",
    ownerAdminLabel: partner.ownerAdminLabel ?? "",
    nextFollowUp: toLocalInput(partner.nextFollowUpAt),
    publicDisplayConsent: partner.publicDisplayConsent,
    mandateCompany: partner.mandateCompany ?? "",
    mandateConfidential: partner.mandateConfidential,
    internalNote: partner.internalNote ?? "",
  });
  const [interaction, setInteraction] = useState({ kind: "note" as (typeof PARTNER_INTERACTION_KINDS)[number], summary: "", followUp: "" });
  const [invite, setInvite] = useState({ fullName: "", email: "", role: "manager" as "reader" | "manager", hours: 72 });
  const [issuedLink, setIssuedLink] = useState<string | null>(null);
  const interactions = trpc.partnerModule.adminPartnerInteractions.useQuery({ sessionToken, organizationId: partner.organizationId });
  const invitations = trpc.partnerModule.adminListInvitations.useQuery({ sessionToken, organizationId: partner.organizationId });
  const refreshAll = () => { void utils.partnerModule.adminPartnerInteractions.invalidate(); void utils.partnerModule.adminListInvitations.invalidate(); onChanged(); };
  const save = trpc.partnerModule.adminPartnerSaveProfile.useMutation({
    onSuccess: () => { toast.success("Fiche partenaire enregistrée"); refreshAll(); },
    onError: (error) => toast.error("Fiche non enregistrée", { description: error.message }),
  });
  const addInteraction = trpc.partnerModule.adminPartnerAddInteraction.useMutation({
    onSuccess: () => { setInteraction({ kind: "note", summary: "", followUp: "" }); toast.success("Échange enregistré"); refreshAll(); },
    onError: (error) => toast.error("Échange non enregistré", { description: error.message }),
  });
  const createInvitation = trpc.partnerModule.adminCreateInvitation.useMutation({
    onSuccess: (result) => {
      setIssuedLink(result.link);
      setInvite({ fullName: "", email: "", role: "manager", hours: 72 });
      toast.success(result.emailSent ? "Invitation envoyée par e-mail" : "Invitation créée — e-mail non envoyé : copiez le lien");
      refreshAll();
    },
    onError: (error) => toast.error("Invitation non créée", { description: error.message }),
  });
  const revoke = trpc.partnerModule.adminRevokeInvitation.useMutation({ onSuccess: refreshAll, onError: (error) => toast.error(error.message) });
  const openDocument = async () => {
    try {
      const result = await utils.partnerModule.adminAuthorizationDocumentUrl.fetch({ sessionToken, organizationId: partner.organizationId });
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error("Justificatif indisponible", { description: error instanceof Error ? error.message : "" });
    }
  };
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((current) => ({ ...current, [key]: value }));
  const displayAllowed = canDisplayPartnerPublicly({ relationshipStatus: form.relationshipStatus, publicDisplayConsent: form.publicDisplayConsent });

  return (
    <div className="mt-3 space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-4" data-testid="admin-partner-detail">
      <form
        className="grid gap-3 md:grid-cols-3"
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate({
            sessionToken,
            organizationId: partner.organizationId,
            category: form.category,
            relationshipStatus: form.relationshipStatus,
            primaryContactName: form.primaryContactName,
            primaryContactEmail: form.primaryContactEmail,
            primaryContactPhone: form.primaryContactPhone,
            primaryContactRole: form.primaryContactRole,
            specialties: form.specialties,
            operatingCountries: form.operatingCountries,
            ownerAdminLabel: form.ownerAdminLabel,
            nextFollowUpAt: form.nextFollowUp ? new Date(form.nextFollowUp).toISOString() : null,
            publicDisplayConsent: form.publicDisplayConsent,
            mandateCompany: form.mandateCompany,
            mandateConfidential: form.mandateConfidential,
            internalNote: form.internalNote,
          });
        }}
      >
        <label className="text-sm font-semibold">Statut de la relation
          <select value={form.relationshipStatus} onChange={(event) => set("relationshipStatus", event.target.value as PartnerRelationshipStatus)} className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-2 text-sm">
            {PARTNER_RELATIONSHIP_STATUSES.map((status) => <option key={status} value={status}>{PARTNER_STATUS_LABELS[status].fr}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold">Catégorie
          <select value={form.category} onChange={(event) => set("category", event.target.value as PartnerCategory)} className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-2 text-sm">
            {PARTNER_CATEGORIES.map((category) => <option key={category} value={category}>{PARTNER_CATEGORY_LABELS[category].fr}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold">Responsable 3M
          <Input value={form.ownerAdminLabel} onChange={(event) => set("ownerAdminLabel", event.target.value)} maxLength={160} className="mt-1" placeholder="Nom ou e-mail du responsable" />
        </label>
        <label className="text-sm font-semibold">Interlocuteur
          <Input value={form.primaryContactName} onChange={(event) => set("primaryContactName", event.target.value)} maxLength={255} className="mt-1" />
        </label>
        <label className="text-sm font-semibold">Fonction
          <Input value={form.primaryContactRole} onChange={(event) => set("primaryContactRole", event.target.value)} maxLength={160} className="mt-1" />
        </label>
        <label className="text-sm font-semibold">E-mail
          <Input type="email" value={form.primaryContactEmail} onChange={(event) => set("primaryContactEmail", event.target.value)} maxLength={320} className="mt-1" />
        </label>
        <label className="text-sm font-semibold">Téléphone
          <Input value={form.primaryContactPhone} onChange={(event) => set("primaryContactPhone", event.target.value)} maxLength={64} className="mt-1" />
        </label>
        <label className="text-sm font-semibold">Spécialités
          <Input value={form.specialties} onChange={(event) => set("specialties", event.target.value)} maxLength={2000} className="mt-1" placeholder="Santé, BTP, hôtellerie…" />
        </label>
        <label className="text-sm font-semibold">Pays d’intervention
          <Input value={form.operatingCountries} onChange={(event) => set("operatingCountries", event.target.value)} maxLength={2000} className="mt-1" />
        </label>
        <label className="text-sm font-semibold">Prochaine relance
          <Input type="datetime-local" value={form.nextFollowUp} onChange={(event) => set("nextFollowUp", event.target.value)} className="mt-1" />
        </label>
        {partner.category !== "employer" && (
          <>
            <label className="text-sm font-semibold md:col-span-2">Entreprise bénéficiaire / mandat (confidentiel, visible de l’administration seulement)
              <Input value={form.mandateCompany} onChange={(event) => set("mandateCompany", event.target.value)} maxLength={255} className="mt-1" />
            </label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.mandateConfidential} onChange={(event) => set("mandateConfidential", event.target.checked)} />Informations de mandat confidentielles</label>
          </>
        )}
        <label className="text-sm font-semibold md:col-span-3">Note interne
          <Textarea value={form.internalNote} onChange={(event) => set("internalNote", event.target.value)} maxLength={4000} className="mt-1 min-h-20" />
        </label>
        <div className="md:col-span-3 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.publicDisplayConsent} onChange={(event) => set("publicDisplayConsent", event.target.checked)} data-testid="partner-display-consent" />Autorisation écrite d’afficher le nom et le logo reçue</label>
          <span className={`text-xs font-semibold ${displayAllowed ? "text-emerald-700" : "text-slate-500"}`} data-testid="partner-display-state">
            {displayAllowed ? "Affichage public autorisé (statut actif + autorisation)." : "Aucun affichage public : il faut le statut « Actif » ET l’autorisation écrite."}
          </span>
          <Button type="submit" disabled={save.isPending} aria-busy={save.isPending} className="ml-auto bg-indigo-700 text-white hover:bg-indigo-800">{save.isPending ? "Enregistrement…" : "Enregistrer la fiche"}</Button>
        </div>
      </form>

      {partner.hasAuthorizationDocument && (
        <p className="flex flex-wrap items-center gap-2 text-sm"><FileCheck2 className="h-4 w-4 text-emerald-700" aria-hidden="true" />Justificatif d’autorisation joint : {partner.authorizationDocumentName}
          <Button type="button" size="sm" variant="outline" onClick={() => void openDocument()}>Ouvrir (lien temporaire)</Button></p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <section aria-label="Invitations">
          <p className="flex items-center gap-2 font-bold"><MailPlus className="h-4 w-4 text-indigo-700" aria-hidden="true" />Inviter un utilisateur</p>
          {partner.verificationStatus !== "verified" && <p className="mt-1 rounded-md bg-amber-50 p-2 text-xs text-amber-900">L’organisation n’est pas encore vérifiée : les invitations restent bloquées jusqu’à la vérification.</p>}
          <form className="mt-2 grid gap-2 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); createInvitation.mutate({ sessionToken, organizationId: partner.organizationId, fullName: invite.fullName, email: invite.email, role: invite.role, hours: invite.hours }); }}>
            <Input required placeholder="Nom complet" value={invite.fullName} onChange={(event) => setInvite((c) => ({ ...c, fullName: event.target.value }))} aria-label="Nom complet de l’invité" />
            <Input required type="email" placeholder="E-mail professionnel" value={invite.email} onChange={(event) => setInvite((c) => ({ ...c, email: event.target.value }))} aria-label="E-mail de l’invité" />
            <select value={invite.role} onChange={(event) => setInvite((c) => ({ ...c, role: event.target.value as "reader" | "manager" }))} aria-label="Rôle" className="h-10 rounded-md border border-slate-300 bg-white px-2 text-sm"><option value="manager">Gestionnaire</option><option value="reader">Lecteur</option></select>
            <select value={invite.hours} onChange={(event) => setInvite((c) => ({ ...c, hours: Number(event.target.value) }))} aria-label="Durée de validité" className="h-10 rounded-md border border-slate-300 bg-white px-2 text-sm"><option value={24}>Valable 24 h</option><option value={72}>Valable 72 h</option><option value={168}>Valable 7 jours</option></select>
            <Button type="submit" disabled={createInvitation.isPending || partner.verificationStatus !== "verified"} className="sm:col-span-2 bg-indigo-700 text-white hover:bg-indigo-800">Envoyer le lien personnel</Button>
          </form>
          {issuedLink && <p className="mt-2 break-all rounded-md border border-indigo-200 bg-indigo-50 p-2 text-xs" role="status"><Link2 className="mr-1 inline h-3 w-3" aria-hidden="true" />{issuedLink} <button type="button" className="ml-2 font-bold underline" onClick={() => { void navigator.clipboard?.writeText(issuedLink); toast.success("Lien copié"); }}>Copier</button></p>}
          <ul className="mt-3 space-y-1 text-sm">
            {(invitations.data ?? []).map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded bg-white p-2"><span>{item.fullName} · {item.email}</span><span className="flex items-center gap-2 text-xs text-slate-600">{item.state === "valid" ? "En attente" : item.state === "used" ? "Activée" : item.state === "revoked" ? "Révoquée" : "Expirée"} · {formatDate(item.expiresAt)}{item.state === "valid" && <Button size="sm" variant="ghost" onClick={() => revoke.mutate({ sessionToken, invitationId: item.id })}>Révoquer</Button>}</span></li>
            ))}
          </ul>
        </section>

        <section aria-label="Historique des échanges">
          <p className="flex items-center gap-2 font-bold"><History className="h-4 w-4 text-indigo-700" aria-hidden="true" />Historique et relances</p>
          <form className="mt-2 grid gap-2 sm:grid-cols-3" onSubmit={(event) => { event.preventDefault(); addInteraction.mutate({ sessionToken, organizationId: partner.organizationId, kind: interaction.kind, summary: interaction.summary, followUpAt: interaction.followUp ? new Date(interaction.followUp).toISOString() : null }); }}>
            <select value={interaction.kind} onChange={(event) => setInteraction((c) => ({ ...c, kind: event.target.value as typeof c.kind }))} aria-label="Type d’échange" className="h-10 rounded-md border border-slate-300 bg-white px-2 text-sm">{PARTNER_INTERACTION_KINDS.filter((kind) => !["status_change", "invitation", "document"].includes(kind)).map((kind) => <option key={kind} value={kind}>{KIND_LABEL[kind]}</option>)}</select>
            <Input type="datetime-local" value={interaction.followUp} onChange={(event) => setInteraction((c) => ({ ...c, followUp: event.target.value }))} aria-label="Prochaine relance" className="sm:col-span-2" />
            <Textarea required minLength={3} maxLength={4000} value={interaction.summary} onChange={(event) => setInteraction((c) => ({ ...c, summary: event.target.value }))} placeholder="Résumé de l’échange" aria-label="Résumé de l’échange" className="sm:col-span-3 min-h-16" />
            <Button type="submit" disabled={addInteraction.isPending} className="sm:col-span-3 bg-slate-800 text-white hover:bg-slate-900">Ajouter à l’historique</Button>
          </form>
          <ul className="mt-3 max-h-64 space-y-1 overflow-y-auto text-sm">
            {(interactions.data ?? []).map((item) => (
              <li key={item.id} className="rounded bg-white p-2"><p className="text-xs text-slate-500">{KIND_LABEL[item.kind] ?? item.kind} · {new Date(item.createdAt).toLocaleString("fr-FR")} · {item.createdByLabel ?? "—"}{item.followUpAt ? ` · relance ${formatDate(item.followUpAt)}` : ""}</p><p className="mt-0.5 whitespace-pre-line text-slate-800">{item.summary}</p></li>
            ))}
            {(interactions.data ?? []).length === 0 && <li className="text-slate-500">Aucun échange enregistré.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}

/** Module admin « Entreprises & partenaires » : suivi relationnel, invitations, historique. Réutilise le pilotage de placement existant. */
export function AdminPartnerModule({ sessionToken }: Props) {
  const overview = trpc.partnerModule.adminPartnerOverview.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false });
  const [statusFilter, setStatusFilter] = useState<"all" | PartnerRelationshipStatus>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | PartnerCategory>("all");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);
  const rows = overview.data ?? [];
  const now = Date.now();
  const filtered = useMemo(() => rows.filter((row) => (statusFilter === "all" || row.relationshipStatus === statusFilter) && (categoryFilter === "all" || row.category === categoryFilter) && (!search.trim() || `${row.legalName} ${row.country} ${row.specialties ?? ""} ${row.primaryContactName ?? ""}`.toLowerCase().includes(search.trim().toLowerCase()))), [rows, statusFilter, categoryFilter, search]);
  const counts = PARTNER_RELATIONSHIP_STATUSES.map((status) => [status, rows.filter((row) => row.relationshipStatus === status).length] as const);
  const dueFollowUps = rows.filter((row) => row.nextFollowUpAt && new Date(row.nextFollowUpAt).getTime() <= now + 7 * 86_400_000).length;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5" aria-labelledby="admin-partner-module-title" data-testid="admin-partner-module">
      <h2 id="admin-partner-module-title" className="flex items-center gap-2 text-lg font-black text-slate-950"><Building2 className="h-5 w-5 text-indigo-700" aria-hidden="true" />Entreprises &amp; partenaires — suivi</h2>
      <p className="mt-1 text-sm text-slate-600">Employeurs, cabinets et agences : statut de la relation, interlocuteur, responsable 3M, historique, relances et invitations. Une inscription seule n’affiche jamais une entreprise comme « partenaire officiel ».</p>
      {overview.error && <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950" role="status">{overview.error.message}</p>}
      <div className="mt-3 flex flex-wrap gap-2" aria-label="Répartition par statut">
        {counts.map(([status, count]) => <button key={status} type="button" onClick={() => setStatusFilter(statusFilter === status ? "all" : status)} aria-pressed={statusFilter === status} className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_TONE[status]} ${statusFilter === status ? "ring-2 ring-indigo-600" : ""}`}>{PARTNER_STATUS_LABELS[status].fr} · {count}</button>)}
        {dueFollowUps > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-900"><BellRing className="h-3 w-3" aria-hidden="true" />{dueFollowUps} relance(s) à faire sous 7 jours</span>}
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]">
        <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher une entreprise, un pays, une spécialité…" aria-label="Rechercher un partenaire" className="pl-9" /></div>
        <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as typeof categoryFilter)} aria-label="Filtrer par catégorie" className="h-10 rounded-md border border-slate-300 bg-white px-2 text-sm"><option value="all">Toutes les catégories</option>{PARTNER_CATEGORIES.map((category) => <option key={category} value={category}>{PARTNER_CATEGORY_LABELS[category].fr}</option>)}</select>
      </div>
      <ul className="mt-4 space-y-2">
        {filtered.map((row) => (
          <li key={row.organizationId} className="rounded-xl border border-slate-200 p-3">
            <button type="button" className="flex w-full flex-wrap items-center justify-between gap-2 text-left" aria-expanded={openId === row.organizationId} onClick={() => setOpenId(openId === row.organizationId ? null : row.organizationId)}>
              <span><span className="font-bold text-slate-950">{row.legalName}</span> <span className="text-sm text-slate-600">· {row.country} · {PARTNER_CATEGORY_LABELS[row.category].fr}</span></span>
              <span className="flex flex-wrap items-center gap-2 text-xs">
                <span className={`rounded-full px-2 py-0.5 font-bold ${STATUS_TONE[row.relationshipStatus]}`}>{PARTNER_STATUS_LABELS[row.relationshipStatus].fr}</span>
                <span className="text-slate-600">{row.accountsCount} utilisateur(s){row.pendingInvitations ? ` · ${row.pendingInvitations} invitation(s)` : ""}</span>
                {row.nextFollowUpAt && <span className={new Date(row.nextFollowUpAt).getTime() <= now ? "font-bold text-rose-700" : "text-slate-600"}>relance {formatDate(row.nextFollowUpAt)}</span>}
                {row.ownerAdminLabel && <span className="text-slate-500">resp. {row.ownerAdminLabel}</span>}
              </span>
            </button>
            {openId === row.organizationId && <PartnerDetail partner={row} sessionToken={sessionToken} onChanged={() => void overview.refetch()} />}
          </li>
        ))}
        {!overview.isLoading && filtered.length === 0 && <li className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">Aucun partenaire ne correspond à ces filtres.</li>}
      </ul>
    </section>
  );
}
