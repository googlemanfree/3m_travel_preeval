import { useMemo, useState } from "react";
import { BriefcaseBusiness, Building2, Download, Eye, FilePlus2, IdCard, RefreshCw, Search, Send, ShieldCheck, UserRoundCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { POST_SELECTION_LABELS, POST_SELECTION_STAGES, nextPostSelectionStage, resolvePostSelectionStage, type PostSelectionStage } from "@shared/talentCorridor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Props = {
  sessionToken: string;
  /** Ouvre la fiche 360° admin (référence online_* / agency_*). */
  onOpenCandidate?: (adminCandidateRef: string) => void;
};
const submissionLabels: Record<string, string> = {
  submitted: "Soumis",
  under_review: "En revue",
  shortlisted: "Présélectionné",
  selected: "Sélectionné",
  not_selected: "Non retenu",
  documents_requested: "Pièces demandées",
  procedure_ready: "Procédure à ouvrir",
  withdrawn: "Retiré",
};
const accessRequestLabels: Record<string, string> = {
  pending: "En attente",
  under_review: "En examen",
  approved: "Approuvée",
  rejected: "Refusée",
};

export function AdminPlacementPipeline({ sessionToken, onOpenCandidate }: Props) {
  const utils = trpc.useUtils();
  const [org, setOrg] = useState({ legalName: "", country: "", contactEmail: "", organizationType: "employer" as "employer" | "placement_partner", verified: false });
  const [employerAccess, setEmployerAccess] = useState({ organizationId: "", fullName: "", email: "" });
  const [issuedAccess, setIssuedAccess] = useState<{ email: string; temporaryPassword: string } | null>(null);
  const [profile, setProfile] = useState({ candidateId: "", summary: "", targetDestination: "", targetProcedure: "", sector: "", yearsExperience: "", languagesSummary: "" });
  const [candidatePickerSearch, setCandidatePickerSearch] = useState("");
  const [submission, setSubmission] = useState({ profileId: "", organizationId: "", adminNote: "" });
  const [reviewNotes, setReviewNotes] = useState<Record<number, string>>({});
  const [lockedActions, setLockedActions] = useState<Record<string, boolean>>({});
  const [postSelectionSearch, setPostSelectionSearch] = useState("");
  const [postSelectionFilter, setPostSelectionFilter] = useState<"all" | PostSelectionStage>("all");
  const [postSelectionSort, setPostSelectionSort] = useState<"recent" | "stage" | "organization">("recent");
  const [selectedSubmissionIds, setSelectedSubmissionIds] = useState<Set<number>>(new Set());
  const lockAction = (key: string) => setLockedActions((current) => ({ ...current, [key]: true }));
  const unlockAction = (key: string) => setLockedActions((current) => ({ ...current, [key]: false }));
  const listQuery = trpc.placementPortal.adminList.useQuery({ sessionToken }, { enabled: Boolean(sessionToken) });
  const consentedQuery = trpc.placementPortal.adminListConsentedCandidates.useQuery({ sessionToken }, { enabled: Boolean(sessionToken) });
  const refresh = () => {
    void utils.placementPortal.adminList.invalidate({ sessionToken });
    void utils.placementPortal.adminListConsentedCandidates.invalidate({ sessionToken });
  };
  const organizationMutation = trpc.placementPortal.adminCreateOrganization.useMutation({
    onSuccess: () => {
      toast.success("Organisation enregistrée", { description: "Elle ne reçoit aucun profil tant qu’elle n’est pas vérifiée." });
      setOrg({ legalName: "", country: "", contactEmail: "", organizationType: "employer", verified: false });
      refresh();
    },
    onError: (error) => { unlockAction("organization"); toast.error(error.message); },
  });
  const profileMutation = trpc.placementPortal.adminCreateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profil anonymisé préparé");
      setProfile({ candidateId: "", summary: "", targetDestination: "", targetProcedure: "", sector: "", yearsExperience: "", languagesSummary: "" });
      refresh();
    },
    onError: (error) => { unlockAction("profile"); toast.error("Profil non créé", { description: error.message }); },
  });
  const submissionMutation = trpc.placementPortal.adminSubmitProfile.useMutation({
    onSuccess: () => {
      toast.success("Profil soumis", { description: "La soumission est journalisée. Aucun candidat n’est notifié automatiquement." });
      setSubmission({ profileId: "", organizationId: "", adminNote: "" });
      refresh();
    },
    onError: (error) => { unlockAction("submission"); toast.error("Soumission impossible", { description: error.message }); },
  });
  const employerAccessMutation = trpc.placementPortal.adminCreateEmployerAccess.useMutation({
    onSuccess: (result) => {
      setIssuedAccess({ email: employerAccess.email, temporaryPassword: result.temporaryPassword });
      setEmployerAccess({ organizationId: "", fullName: "", email: "" });
      toast.success("Accès partenaire généré", { description: "Remettez-le manuellement après vérification de l’organisation." });
    },
    onError: (error) => { unlockAction("employerAccess"); toast.error("Accès non créé", { description: error.message }); },
  });
  const reviewAccessMutation = trpc.placementPortal.adminReviewAccessRequest.useMutation({
    onSuccess: (result) => {
      if (result.temporaryPassword) {
        setIssuedAccess({ email: result.contactEmail, temporaryPassword: result.temporaryPassword });
        toast.success("Demande approuvée — identifiants générés", { description: "Remettez le mot de passe temporaire par un canal approuvé." });
      } else if (result.status === "approved") {
        toast.success("Demande approuvée", { description: "Organisation créée. Générez l’accès dans la carte Accès partenaire si besoin." });
      } else if (result.status === "rejected") {
        toast.success("Demande refusée");
      } else {
        toast.success("Demande marquée en examen");
      }
      refresh();
    },
    onError: (error) => toast.error("Revue impossible", { description: error.message }),
  });
  const advanceMutation = trpc.placementPortal.adminAdvancePostSelection.useMutation({
    onSuccess: (result) => {
      toast.success(result.message);
      if (result.openProtocolTwo) {
        if (result.adminCandidateRef && onOpenCandidate) {
          onOpenCandidate(result.adminCandidateRef);
          toast.info("Fiche 360° ouverte — activez le Protocole N°02 (employeur + poste).");
        } else if (result.candidateId) {
          toast.info(`Ouvrez la fiche 360° du candidat #${result.candidateId} pour activer le Protocole N°02.`);
        }
      }
      refresh();
    },
    onError: (error) => toast.error("Avancement impossible", { description: error.message }),
  });

  const organizations = listQuery.data?.organizations ?? [];
  const profiles = listQuery.data?.profiles ?? [];
  const submissions = listQuery.data?.submissions ?? [];
  const accessRequests = listQuery.data?.accessRequests ?? [];
  const consentedCandidates = consentedQuery.data?.candidates ?? [];
  const filteredConsentedCandidates = useMemo(() => {
    const q = candidatePickerSearch.trim().toLocaleLowerCase("fr-FR");
    if (!q) return consentedCandidates;
    return consentedCandidates.filter((row) =>
      [row.fullName, row.email, row.destination, String(row.candidateId), row.adminCandidateRef ?? ""]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase("fr-FR").includes(q)),
    );
  }, [candidatePickerSearch, consentedCandidates]);
  const selectedConsented = consentedCandidates.find((row) => String(row.candidateId) === profile.candidateId);
  const openAccessRequests = useMemo(
    () => accessRequests.filter((row) => row.status === "pending" || row.status === "under_review"),
    [accessRequests],
  );
  const verifiedOrganizations = useMemo(() => organizations.filter((row) => row.verificationStatus === "verified"), [organizations]);
  const profilesById = useMemo(() => new Map(profiles.map((row) => [row.id, row])), [profiles]);
  const orgsById = useMemo(() => new Map(organizations.map((row) => [row.id, row])), [organizations]);

  const postSelectionItems = useMemo(() => {
    const normalizedSearch = postSelectionSearch.trim().toLocaleLowerCase("fr-FR");
    const items = submissions
      .map((row) => {
        const stage = resolvePostSelectionStage({
          status: row.status,
          adminPipelineStage: (row as { adminPipelineStage?: string | null }).adminPipelineStage,
        });
        if (!stage) return null;
        return { row, stage };
      })
      .filter((value): value is { row: (typeof submissions)[number]; stage: PostSelectionStage } => Boolean(value));
    const filtered = items.filter(({ row, stage }) => {
      const profileRow = profilesById.get(row.profileId);
      const orgRow = orgsById.get(row.organizationId);
      const haystack = [profileRow?.profileCode, profileRow?.candidateId, orgRow?.legalName, stage, row.status].filter(Boolean).join(" ").toLocaleLowerCase("fr-FR");
      return (postSelectionFilter === "all" || stage === postSelectionFilter) && (!normalizedSearch || haystack.includes(normalizedSearch));
    });
    return filtered.sort((a, b) => {
      if (postSelectionSort === "stage") return POST_SELECTION_STAGES.indexOf(a.stage) - POST_SELECTION_STAGES.indexOf(b.stage);
      if (postSelectionSort === "organization") return String(orgsById.get(a.row.organizationId)?.legalName ?? "").localeCompare(String(orgsById.get(b.row.organizationId)?.legalName ?? ""), "fr");
      return Number(b.row.id) - Number(a.row.id);
    });
  }, [orgsById, postSelectionFilter, postSelectionSearch, postSelectionSort, profilesById, submissions]);

  const byStage = useMemo(() => {
    const map = Object.fromEntries(POST_SELECTION_STAGES.map((stage) => [stage, [] as typeof postSelectionItems])) as Record<PostSelectionStage, typeof postSelectionItems>;
    for (const item of postSelectionItems) map[item.stage].push(item);
    return map;
  }, [postSelectionItems]);

  const filteredSubmissionIds = postSelectionItems.map(({ row }) => row.id);
  const allFilteredSelected = filteredSubmissionIds.length > 0 && filteredSubmissionIds.every((id) => selectedSubmissionIds.has(id));
  const toggleSubmission = (id: number) => setSelectedSubmissionIds((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const toggleAllFiltered = () => setSelectedSubmissionIds((current) => {
    const next = new Set(current);
    if (allFilteredSelected) filteredSubmissionIds.forEach((id) => next.delete(id));
    else filteredSubmissionIds.forEach((id) => next.add(id));
    return next;
  });
  const exportSelectedCsv = () => {
    const safe = (value: unknown) => {
      const text = String(value ?? "").replace(/\r?\n/g, " ").trim();
      return /^[=+\-@]/.test(text) ? `'${text}` : text;
    };
    const selected = postSelectionItems.filter(({ row }) => selectedSubmissionIds.has(row.id));
    const lines = [
      ["Profil", "Organisation", "Étape", "Statut", "Destination", "Procédure"],
      ...selected.map(({ row, stage }) => {
        const profileRow = profilesById.get(row.profileId);
        const orgRow = orgsById.get(row.organizationId);
        return [profileRow?.profileCode ?? `Profil #${row.profileId}`, orgRow?.legalName ?? `Organisation #${row.organizationId}`, POST_SELECTION_LABELS[stage].fr, row.status, profileRow?.targetDestination, profileRow?.targetProcedure].map(safe);
      }),
    ].map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";"));
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `3m-profils-post-selection-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`${selected.length} profil(s) exporté(s)`, { description: "Export limité aux champs opérationnels et aux profils déjà filtrés." });
  };

  return (
    <section className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-4 shadow-sm" aria-label="Pilotage de placement international">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-black text-slate-950">
            <BriefcaseBusiness className="h-5 w-5 text-indigo-700" />
            Pilotage de placement international
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">
            Gestion admin des candidatures — Test décisif : sélectionner un CV consentant → préparer le profil → soumettre à un partenaire vérifié → enregistrer la preuve d’envoi → recevoir le retour dans le bon dossier → ouvrir la procédure. Aucun profil n’est présenté sans examen préalable par 3M.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={listQuery.isFetching} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${listQuery.isFetching ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

      <ol className="mt-4 grid gap-2 rounded-xl border border-indigo-100 bg-white/90 p-3 text-xs sm:grid-cols-5" data-testid="placement-traceability-steps" aria-label="Chaîne de traçabilité des candidatures">
        {[
          { n: "1", t: "Consentement + CV" },
          { n: "2", t: "Profil anonymisé" },
          { n: "3", t: "Envoi partenaire" },
          { n: "4", t: "Retour / décision" },
          { n: "5", t: "Procédure 3M" },
        ].map((step) => (
          <li key={step.n} className="flex items-center gap-2 rounded-lg bg-indigo-50/80 px-2.5 py-2 font-semibold text-indigo-950">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-700 text-[11px] text-white">{step.n}</span>
            {step.t}
          </li>
        ))}
      </ol>

      <div className="mt-4 grid gap-3 md:grid-cols-5">
        <div className="rounded-xl border border-violet-100 bg-white p-3">
          <p className="text-xs font-bold uppercase text-violet-700">Inscriptions</p>
          <p className="mt-1 text-2xl font-black text-violet-950">{openAccessRequests.length}</p>
          <p className="text-xs text-slate-500">À examiner</p>
        </div>
        <div className="rounded-xl border border-indigo-100 bg-white p-3">
          <p className="text-xs font-bold uppercase text-indigo-700">Organisations</p>
          <p className="mt-1 text-2xl font-black text-indigo-950">{organizations.length}</p>
          <p className="text-xs text-slate-500">{verifiedOrganizations.length} vérifiée(s)</p>
        </div>
        <div className="rounded-xl border border-sky-100 bg-white p-3">
          <p className="text-xs font-bold uppercase text-sky-700">Profils anonymisés</p>
          <p className="mt-1 text-2xl font-black text-sky-950">{profiles.length}</p>
          <p className="text-xs text-slate-500">Consentement candidat requis</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-white p-3">
          <p className="text-xs font-bold uppercase text-amber-700">Post-sélection</p>
          <p className="mt-1 text-2xl font-black text-amber-950">{postSelectionItems.length}</p>
          <p className="text-xs text-slate-500">Contrat · invitation · N°02</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-white p-3">
          <p className="text-xs font-bold uppercase text-emerald-700">Procédures prêtes</p>
          <p className="mt-1 text-2xl font-black text-emerald-950">{byStage.procedure_ready.length}</p>
          <p className="text-xs text-slate-500">Décision humaine obligatoire</p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50/60 p-4" data-testid="admin-partner-access-requests">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 font-bold text-violet-950"><IdCard className="h-4 w-4" />Demandes d’identification partenaires</p>
            <p className="mt-1 text-sm text-violet-900">Examinez l’identité légale, puis approuvez avec vérification et génération d’accès si l’organisation est confirmée.</p>
          </div>
          <Badge className="bg-violet-100 text-violet-900">{openAccessRequests.length} ouverte(s)</Badge>
        </div>
        {issuedAccess && (
          <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950" role="alert">
            <p className="font-bold">Identifiants à remettre maintenant</p>
            <p className="mt-1">{issuedAccess.email}</p>
            <code className="mt-2 block select-all rounded bg-white p-2 font-mono text-sm">{issuedAccess.temporaryPassword}</code>
          </div>
        )}
        {openAccessRequests.length === 0 ? (
          <p className="mt-3 rounded-lg bg-white/80 p-3 text-sm text-slate-600">Aucune demande d’inscription en attente.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {openAccessRequests.slice(0, 12).map((row) => (
              <li key={row.id} className="rounded-xl border border-violet-100 bg-white p-3 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-slate-950">{row.legalName}</p>
                    <p className="text-slate-600">
                      {row.organizationType === "placement_partner" ? "Agence de placement" : "Employeur"} · {row.country}
                      {row.city ? ` · ${row.city}` : ""}
                    </p>
                    <p className="mt-1 text-slate-700">{row.contactFullName} · {row.contactRole}</p>
                    <p className="text-slate-600">{row.contactEmail} · {row.contactPhone}</p>
                    {row.registrationNumber && <p className="text-xs text-slate-500">Enregistrement : {row.registrationNumber}</p>}
                    {(row.sectors || row.targetMarkets) && (
                      <p className="mt-1 text-xs text-slate-500">
                        {[row.sectors, row.targetMarkets].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    <p className="mt-2 whitespace-pre-wrap text-slate-700">{row.message}</p>
                  </div>
                  <Badge variant="outline">{accessRequestLabels[row.status] ?? row.status}</Badge>
                </div>
                <Textarea
                  className="mt-3"
                  value={reviewNotes[row.id] ?? ""}
                  onChange={(event) => setReviewNotes((current) => ({ ...current, [row.id]: event.target.value }))}
                  placeholder="Note de revue interne (facultatif)"
                  maxLength={2000}
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={reviewAccessMutation.isPending}
                    onClick={() => reviewAccessMutation.mutate({ sessionToken, requestId: row.id, decision: "under_review", reviewNote: reviewNotes[row.id] || undefined })}
                  >
                    Marquer en examen
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-rose-300 text-rose-800"
                    disabled={reviewAccessMutation.isPending}
                    onClick={() => reviewAccessMutation.mutate({ sessionToken, requestId: row.id, decision: "rejected", reviewNote: reviewNotes[row.id] || undefined })}
                  >
                    Refuser
                  </Button>
                  <Button
                    size="sm"
                    className="bg-indigo-700 hover:bg-indigo-800"
                    disabled={reviewAccessMutation.isPending}
                    onClick={() => reviewAccessMutation.mutate({ sessionToken, requestId: row.id, decision: "approved", markVerified: true, createAccess: false, reviewNote: reviewNotes[row.id] || undefined })}
                  >
                    Approuver (org vérifiée)
                  </Button>
                  <Button
                    size="sm"
                    className="bg-amber-700 hover:bg-amber-800"
                    disabled={reviewAccessMutation.isPending}
                    onClick={() => reviewAccessMutation.mutate({ sessionToken, requestId: row.id, decision: "approved", markVerified: true, createAccess: true, reviewNote: reviewNotes[row.id] || undefined })}
                  >
                    Approuver + générer accès
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4" data-testid="admin-post-selection-kanban">
        <p className="font-bold text-emerald-950">File post-sélection — procédure administrative 3M</p>
        <p className="mt-1 text-sm text-emerald-900">
          Après sélection partenaire : confirmer contrat + lettre d’invitation, ouvrir le Protocole N°02 sur la fiche 360°, puis engager la procédure visa.
        </p>
        <div className="mt-4 grid gap-2 rounded-xl border border-emerald-200 bg-white/80 p-3 md:grid-cols-[minmax(0,1fr)_auto_auto]" aria-label="Recherche et tri de la file post-sélection">
          <label className="relative block">
            <span className="sr-only">Rechercher un profil ou une organisation</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <Input value={postSelectionSearch} onChange={(event) => setPostSelectionSearch(event.target.value)} placeholder="Rechercher profil, candidat ou organisation…" className="h-10 bg-white pl-9" />
          </label>
          <Select value={postSelectionFilter} onValueChange={(value) => setPostSelectionFilter(value as "all" | PostSelectionStage)}>
            <SelectTrigger className="h-10 min-w-44 bg-white" aria-label="Filtrer par étape"><SelectValue placeholder="Toutes les étapes" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Toutes les étapes</SelectItem>{POST_SELECTION_STAGES.map((stage) => <SelectItem key={stage} value={stage}>{POST_SELECTION_LABELS[stage].fr}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={postSelectionSort} onValueChange={(value) => setPostSelectionSort(value as "recent" | "stage" | "organization")}>
            <SelectTrigger className="h-10 min-w-44 bg-white" aria-label="Trier la file"><SelectValue placeholder="Tri" /></SelectTrigger>
            <SelectContent><SelectItem value="recent">Plus récents</SelectItem><SelectItem value="stage">Par étape</SelectItem><SelectItem value="organization">Par organisation</SelectItem></SelectContent>
          </Select>
        </div>
        <p className="mt-2 text-xs font-semibold text-emerald-900" aria-live="polite">{postSelectionItems.length} dossier(s) correspondent aux critères.</p>
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-emerald-100 bg-white p-2">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700"><input type="checkbox" checked={allFilteredSelected} onChange={toggleAllFiltered} disabled={!filteredSubmissionIds.length} /> Sélectionner les résultats filtrés</label>
          <span className="text-xs text-slate-500">{selectedSubmissionIds.size} sélectionné(s)</span>
          <Button type="button" size="sm" variant="outline" className="ml-auto gap-2" disabled={!selectedSubmissionIds.size} onClick={exportSelectedCsv}><Download className="h-4 w-4" /> Exporter CSV</Button>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-4">
          {POST_SELECTION_STAGES.map((stage) => (
            <div key={stage} className="rounded-xl border border-emerald-100 bg-white p-3">
              <p className="text-xs font-black uppercase tracking-wide text-emerald-800">{POST_SELECTION_LABELS[stage].fr}</p>
              <p className="mt-1 text-[11px] leading-4 text-slate-500">{POST_SELECTION_LABELS[stage].hint}</p>
              <ul className="mt-3 space-y-2">
                {byStage[stage].length === 0 && <li className="text-xs text-slate-500">Aucun dossier</li>}
                {(byStage[stage].length > 6 ? byStage[stage].slice(0, 6) : byStage[stage]).map(({ row, stage: currentStage }) => {
                  const profileRow = profilesById.get(row.profileId);
                  const orgRow = orgsById.get(row.organizationId);
                  const next = nextPostSelectionStage(currentStage);
                  const consented = consentedCandidates.find((item) => item.candidateId === profileRow?.candidateId);
                  return (
                    <li key={row.id} className="rounded-lg border border-slate-200 p-2 text-xs">
                      <label className="flex items-start gap-2"><input type="checkbox" checked={selectedSubmissionIds.has(row.id)} onChange={() => toggleSubmission(row.id)} aria-label={`Sélectionner ${profileRow?.profileCode ?? `profil ${row.id}`}`} /><span><p className="font-semibold text-slate-900">{profileRow?.profileCode ?? `Profil #${row.profileId}`}</p>
                      <p className="text-slate-600">{orgRow?.legalName ?? `Org #${row.organizationId}`}</p>
                      {consented ? <p className="text-slate-500">{consented.fullName}</p> : profileRow?.candidateId ? <p className="text-slate-500">Candidat #{profileRow.candidateId}</p> : null}</span></label>
                      <div className="mt-2 grid gap-1">
                        {consented?.adminCandidateRef && onOpenCandidate && (
                          <Button size="sm" variant="outline" className="h-8 w-full text-[11px]" onClick={() => onOpenCandidate(consented.adminCandidateRef!)}>
                            <Eye className="mr-1 h-3 w-3" /> Fiche 360°
                          </Button>
                        )}
                        {next && (
                          <Button
                            size="sm"
                            className="h-8 w-full bg-emerald-700 text-[11px] hover:bg-emerald-800"
                            disabled={advanceMutation.isPending}
                            onClick={() => advanceMutation.mutate({ sessionToken, submissionId: row.id })}
                          >
                            → {POST_SELECTION_LABELS[next].fr}
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
                {byStage[stage].length > 6 && (
                  <li className="text-[11px] font-semibold text-emerald-800">+ {byStage[stage].length - 6} autre(s)</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="border-indigo-100">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><Building2 className="h-4 w-4 text-indigo-700" />Organisation partenaire</CardTitle>
            <CardDescription>Créez l’organisation, puis confirmez sa vérification.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input value={org.legalName} onChange={(event) => setOrg({ ...org, legalName: event.target.value })} placeholder="Raison sociale" maxLength={255} />
            <Input value={org.country} onChange={(event) => setOrg({ ...org, country: event.target.value })} placeholder="Pays" maxLength={100} />
            <Input value={org.contactEmail} onChange={(event) => setOrg({ ...org, contactEmail: event.target.value })} placeholder="E-mail professionnel" type="email" maxLength={320} />
            <Select value={org.organizationType} onValueChange={(value) => setOrg({ ...org, organizationType: value as "employer" | "placement_partner" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="employer">Employeur</SelectItem>
                <SelectItem value="placement_partner">Agence de placement</SelectItem>
              </SelectContent>
            </Select>
            <label className="flex gap-2 text-xs text-slate-700">
              <input type="checkbox" checked={org.verified} onChange={(event) => setOrg({ ...org, verified: event.target.checked })} />
              J’ai vérifié cette organisation avant son activation.
            </label>
            <Button className="w-full bg-indigo-700 hover:bg-indigo-800" disabled={organizationMutation.isPending || lockedActions.organization || !org.legalName || !org.country || !org.contactEmail} onClick={() => { lockAction("organization"); organizationMutation.mutate({ sessionToken, ...org }); }}>
              {organizationMutation.isPending ? "Enregistrement…" : lockedActions.organization ? "Organisation enregistrée" : "Enregistrer l’organisation"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-sky-100">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><UserRoundCheck className="h-4 w-4 text-sky-700" />Profil autorisé</CardTitle>
            <CardDescription>Le candidat doit avoir accordé son consentement dans son espace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input value={candidatePickerSearch} onChange={(event) => setCandidatePickerSearch(event.target.value)} placeholder="Rechercher un candidat consentant…" maxLength={120} aria-label="Filtrer les candidats consentants" />
            <Select value={profile.candidateId || undefined} onValueChange={(value) => setProfile({ ...profile, candidateId: value })}>
              <SelectTrigger data-testid="placement-consented-candidate"><SelectValue placeholder={consentedQuery.isLoading ? "Chargement…" : "Choisir un candidat consentant"} /></SelectTrigger>
              <SelectContent>
                {filteredConsentedCandidates.map((row) => (
                  <SelectItem key={row.candidateId} value={String(row.candidateId)}>
                    {row.fullName} · {row.email}{row.destination ? ` · ${row.destination}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedConsented && (
              <p className="rounded-lg bg-sky-50 px-2 py-1.5 text-[11px] text-sky-900">
                Consentement actif{selectedConsented.consentGrantedAt ? ` · ${new Date(selectedConsented.consentGrantedAt).toLocaleDateString("fr-FR")}` : ""}.
                {selectedConsented.adminCandidateRef && onOpenCandidate && (
                  <>
                    {" "}
                    <button type="button" className="font-semibold underline-offset-2 hover:underline" onClick={() => onOpenCandidate(selectedConsented.adminCandidateRef!)}>
                      Ouvrir la fiche 360°
                    </button>
                  </>
                )}
              </p>
            )}
            <Textarea value={profile.summary} onChange={(event) => setProfile({ ...profile, summary: event.target.value })} placeholder="Résumé professionnel anonymisé" maxLength={2000} />
            <Input value={profile.targetDestination} onChange={(event) => setProfile({ ...profile, targetDestination: event.target.value })} placeholder="Destination ciblée" maxLength={100} />
            <Input value={profile.targetProcedure} onChange={(event) => setProfile({ ...profile, targetProcedure: event.target.value })} placeholder="Procédure" maxLength={100} />
            <Input value={profile.sector} onChange={(event) => setProfile({ ...profile, sector: event.target.value })} placeholder="Secteur (facultatif)" maxLength={150} />
            <Input value={profile.yearsExperience} onChange={(event) => setProfile({ ...profile, yearsExperience: event.target.value })} placeholder="Expérience (facultatif)" maxLength={150} />
            <Input value={profile.languagesSummary} onChange={(event) => setProfile({ ...profile, languagesSummary: event.target.value })} placeholder="Langues (facultatif)" maxLength={255} />
            <Button className="w-full bg-sky-700 hover:bg-sky-800" disabled={profileMutation.isPending || lockedActions.profile || !profile.candidateId || profile.summary.length < 30 || !profile.targetDestination || !profile.targetProcedure} onClick={() => { lockAction("profile"); profileMutation.mutate({ sessionToken, candidateId: Number(profile.candidateId), summary: profile.summary, targetDestination: profile.targetDestination, targetProcedure: profile.targetProcedure, sector: profile.sector || undefined, yearsExperience: profile.yearsExperience || undefined, languagesSummary: profile.languagesSummary || undefined }); }}>
              <FilePlus2 className="mr-2 h-4 w-4" />
              {lockedActions.profile ? "Profil préparé" : "Préparer le profil"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-emerald-100">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><Send className="h-4 w-4 text-emerald-700" />Soumission contrôlée</CardTitle>
            <CardDescription>Limité aux organisations vérifiées et aux consentements actifs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Select value={submission.profileId} onValueChange={(value) => setSubmission({ ...submission, profileId: value })}>
              <SelectTrigger><SelectValue placeholder="Choisir un profil" /></SelectTrigger>
              <SelectContent>{profiles.map((row) => <SelectItem key={row.id} value={String(row.id)}>{row.profileCode} · {row.targetDestination}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={submission.organizationId} onValueChange={(value) => setSubmission({ ...submission, organizationId: value })}>
              <SelectTrigger><SelectValue placeholder="Organisation vérifiée" /></SelectTrigger>
              <SelectContent>{verifiedOrganizations.map((row) => <SelectItem key={row.id} value={String(row.id)}>{row.legalName} · {row.country}</SelectItem>)}</SelectContent>
            </Select>
            <Textarea value={submission.adminNote} onChange={(event) => setSubmission({ ...submission, adminNote: event.target.value })} placeholder="Note interne facultative" maxLength={2000} />
            <Button className="w-full bg-emerald-700 hover:bg-emerald-800" disabled={submissionMutation.isPending || lockedActions.submission || !submission.profileId || !submission.organizationId} onClick={() => { lockAction("submission"); submissionMutation.mutate({ sessionToken, profileId: Number(submission.profileId), organizationId: Number(submission.organizationId), adminNote: submission.adminNote || undefined }); }}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              {lockedActions.submission ? "Soumission confirmée" : "Confirmer la soumission"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-amber-100">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><Eye className="h-4 w-4 text-amber-700" />Accès partenaire</CardTitle>
            <CardDescription>Employeur ou agence de placement vérifié(e). Un mot de passe temporaire est généré une seule fois.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Select value={employerAccess.organizationId} onValueChange={(value) => setEmployerAccess({ ...employerAccess, organizationId: value })}>
              <SelectTrigger><SelectValue placeholder="Organisation vérifiée" /></SelectTrigger>
              <SelectContent>{verifiedOrganizations.map((row) => <SelectItem key={row.id} value={String(row.id)}>{row.legalName} · {row.organizationType === "placement_partner" ? "Agence" : "Employeur"}</SelectItem>)}</SelectContent>
            </Select>
            <Input value={employerAccess.fullName} onChange={(event) => setEmployerAccess({ ...employerAccess, fullName: event.target.value })} placeholder="Nom du contact partenaire" maxLength={255} />
            <Input type="email" value={employerAccess.email} onChange={(event) => setEmployerAccess({ ...employerAccess, email: event.target.value })} placeholder="E-mail professionnel" maxLength={320} />
            <Button className="w-full bg-amber-700 hover:bg-amber-800" disabled={employerAccessMutation.isPending || lockedActions.employerAccess || !employerAccess.organizationId || !employerAccess.fullName || !employerAccess.email} onClick={() => { lockAction("employerAccess"); employerAccessMutation.mutate({ sessionToken, organizationId: Number(employerAccess.organizationId), fullName: employerAccess.fullName, email: employerAccess.email }); }}>
              {lockedActions.employerAccess ? "Accès déjà généré" : "Générer l’accès vérifié"}
            </Button>
            {issuedAccess && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950" role="alert">
                <p className="font-bold">Identifiants à remettre maintenant</p>
                <p className="mt-1">{issuedAccess.email}</p>
                <code className="mt-2 block select-all rounded bg-white p-2 font-mono text-sm">{issuedAccess.temporaryPassword}</code>
                <p className="mt-2">Copiez-le puis remettez-le par un canal approuvé. Il ne sera plus affiché après actualisation.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="font-bold text-slate-950">Suivis de placement récents</p>
          <Badge className="bg-slate-100 text-slate-700">{submissions.length}</Badge>
        </div>
        {submissions.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">Aucun profil n’a encore été soumis. Préparez d’abord un profil avec consentement actif.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {submissions.slice(0, 8).map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-2 text-sm">
                <span>Profil #{row.profileId} · Organisation #{row.organizationId}</span>
                <Badge variant="outline">{submissionLabels[row.status] ?? row.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
