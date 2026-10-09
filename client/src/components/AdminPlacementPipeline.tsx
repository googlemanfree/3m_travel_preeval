import { useMemo, useState } from "react";
import { BriefcaseBusiness, Building2, Eye, FilePlus2, RefreshCw, Search, Send, ShieldCheck, UserRoundCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { POST_SELECTION_LABELS, POST_SELECTION_STAGES, nextPostSelectionStage, resolvePostSelectionStage, type PostSelectionStage } from "@shared/talentCorridor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Props = { sessionToken: string };
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

export function AdminPlacementPipeline({ sessionToken }: Props) {
  const utils = trpc.useUtils();
  const [org, setOrg] = useState({ legalName: "", country: "", contactEmail: "", organizationType: "employer" as "employer" | "placement_partner", verified: false });
  const [employerAccess, setEmployerAccess] = useState({ organizationId: "", fullName: "", email: "" });
  const [issuedAccess, setIssuedAccess] = useState<{ email: string; temporaryPassword: string } | null>(null);
  const [profile, setProfile] = useState({ candidateId: "", summary: "", targetDestination: "", targetProcedure: "", sector: "", yearsExperience: "", languagesSummary: "" });
  const [submission, setSubmission] = useState({ profileId: "", organizationId: "", adminNote: "" });
  const [lockedActions, setLockedActions] = useState<Record<string, boolean>>({});
  const [postSelectionSearch, setPostSelectionSearch] = useState("");
  const [postSelectionFilter, setPostSelectionFilter] = useState<"all" | PostSelectionStage>("all");
  const [postSelectionSort, setPostSelectionSort] = useState<"recent" | "stage" | "organization">("recent");
  const lockAction = (key: string) => setLockedActions((current) => ({ ...current, [key]: true }));
  const unlockAction = (key: string) => setLockedActions((current) => ({ ...current, [key]: false }));
  const listQuery = trpc.placementPortal.adminList.useQuery({ sessionToken }, { enabled: Boolean(sessionToken) });
  const refresh = () => void utils.placementPortal.adminList.invalidate({ sessionToken });
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
  const advanceMutation = trpc.placementPortal.adminAdvancePostSelection.useMutation({
    onSuccess: (result) => {
      toast.success(result.message);
      if (result.openProtocolTwo && result.candidateId) {
        toast.info(`Ouvrir la fiche 360° du candidat #${result.candidateId} pour activer le Protocole N°02.`);
      }
      refresh();
    },
    onError: (error) => toast.error("Avancement impossible", { description: error.message }),
  });

  const organizations = listQuery.data?.organizations ?? [];
  const profiles = listQuery.data?.profiles ?? [];
  const submissions = listQuery.data?.submissions ?? [];
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

  return (
    <section className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-4 shadow-sm" aria-label="Pilotage de placement international">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-black text-slate-950">
            <BriefcaseBusiness className="h-5 w-5 text-indigo-700" />
            Pilotage de placement international
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">
            Préparez des profils anonymisés après consentement, soumettez-les à des organisations vérifiées, puis avancez la file post-sélection (contrat, invitation, Protocole N°02, procédure).
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={listQuery.isFetching} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${listQuery.isFetching ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
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
        <div className="mt-4 grid gap-3 lg:grid-cols-4">
          {POST_SELECTION_STAGES.map((stage) => (
            <div key={stage} className="rounded-xl border border-emerald-100 bg-white p-3">
              <p className="text-xs font-black uppercase tracking-wide text-emerald-800">{POST_SELECTION_LABELS[stage].fr}</p>
              <p className="mt-1 text-[11px] leading-4 text-slate-500">{POST_SELECTION_LABELS[stage].hint}</p>
              <ul className="mt-3 space-y-2">
                {byStage[stage].length === 0 && <li className="text-xs text-slate-500">Aucun dossier</li>}
                {byStage[stage].slice(0, 6).map(({ row, stage: currentStage }) => {
                  const profileRow = profilesById.get(row.profileId);
                  const orgRow = orgsById.get(row.organizationId);
                  const next = nextPostSelectionStage(currentStage);
                  return (
                    <li key={row.id} className="rounded-lg border border-slate-200 p-2 text-xs">
                      <p className="font-semibold text-slate-900">{profileRow?.profileCode ?? `Profil #${row.profileId}`}</p>
                      <p className="text-slate-600">{orgRow?.legalName ?? `Org #${row.organizationId}`}</p>
                      {profileRow?.candidateId && <p className="text-slate-500">Candidat #{profileRow.candidateId}</p>}
                      {next && (
                        <Button
                          size="sm"
                          className="mt-2 h-8 w-full bg-emerald-700 text-[11px] hover:bg-emerald-800"
                          disabled={advanceMutation.isPending}
                          onClick={() => advanceMutation.mutate({ sessionToken, submissionId: row.id })}
                        >
                          → {POST_SELECTION_LABELS[next].fr}
                        </Button>
                      )}
                    </li>
                  );
                })}
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
            <Input value={profile.candidateId} onChange={(event) => setProfile({ ...profile, candidateId: event.target.value })} placeholder="Identifiant candidat" inputMode="numeric" maxLength={20} />
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
