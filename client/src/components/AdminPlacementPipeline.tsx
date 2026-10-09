import { useMemo, useState } from "react";
import { BriefcaseBusiness, Building2, Eye, FilePlus2, RefreshCw, Send, ShieldCheck, UserRoundCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Props = { sessionToken: string };
type ProfilePool = "eligible_evaluation" | "top_talent";
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
const poolLabels: Record<ProfilePool, string> = {
  eligible_evaluation: "File agences (éligibles)",
  top_talent: "File employeurs (meilleurs profils)",
};

export function AdminPlacementPipeline({ sessionToken }: Props) {
  const utils = trpc.useUtils();
  const [org, setOrg] = useState({ legalName: "", country: "", contactEmail: "", organizationType: "employer" as "employer" | "placement_partner", verified: false });
  const [employerAccess, setEmployerAccess] = useState({ organizationId: "", fullName: "", email: "" });
  const [issuedAccess, setIssuedAccess] = useState<{ email: string; temporaryPassword: string } | null>(null);
  const [profile, setProfile] = useState({
    candidateId: "",
    summary: "",
    targetDestination: "",
    targetProcedure: "",
    sector: "",
    yearsExperience: "",
    languagesSummary: "",
    profilePool: "eligible_evaluation" as ProfilePool,
  });
  const [submission, setSubmission] = useState({ profileId: "", organizationId: "", adminNote: "" });
  const [lockedActions, setLockedActions] = useState<Record<string, boolean>>({});
  const [accessFilter, setAccessFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [reviewNote, setReviewNote] = useState<Record<number, string>>({});
  const lockAction = (key: string) => setLockedActions((current) => ({ ...current, [key]: true }));
  const unlockAction = (key: string) => setLockedActions((current) => ({ ...current, [key]: false }));
  const listQuery = trpc.placementPortal.adminList.useQuery({ sessionToken }, { enabled: Boolean(sessionToken) });
  const accessRequestsQuery = trpc.placementPortal.adminListAccessRequests.useQuery(
    { sessionToken, status: accessFilter },
    { enabled: Boolean(sessionToken) },
  );
  const refresh = () => {
    void utils.placementPortal.adminList.invalidate({ sessionToken });
    void utils.placementPortal.adminListAccessRequests.invalidate();
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
      setProfile({ candidateId: "", summary: "", targetDestination: "", targetProcedure: "", sector: "", yearsExperience: "", languagesSummary: "", profilePool: "eligible_evaluation" });
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
        setIssuedAccess({ email: "accès créé depuis la demande", temporaryPassword: result.temporaryPassword });
      }
      toast.success(result.temporaryPassword ? "Demande approuvée — identifiants générés" : "Demande traitée");
      refresh();
    },
    onError: (error) => toast.error("Traitement impossible", { description: error.message }),
  });

  const organizations = listQuery.data?.organizations ?? [];
  const profiles = listQuery.data?.profiles ?? [];
  const submissions = listQuery.data?.submissions ?? [];
  const accessRequests = accessRequestsQuery.data?.requests ?? [];
  const verifiedOrganizations = useMemo(() => organizations.filter((row) => row.verificationStatus === "verified"), [organizations]);
  const profilesById = useMemo(() => new Map(profiles.map((row) => [row.id, row])), [profiles]);
  const selectedSubmissions = submissions.filter((row) => row.status === "selected");

  return (
    <section className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-4 shadow-sm" aria-label="Pilotage de placement international">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-black text-slate-950">
            <BriefcaseBusiness className="h-5 w-5 text-indigo-700" />
            Pilotage de placement international
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">
            Préparez des profils anonymisés après consentement, soumettez-les à des organisations vérifiées (agences ou employeurs) et examinez tout retour avant le Protocole N°02.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={listQuery.isFetching || accessRequestsQuery.isFetching} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${listQuery.isFetching || accessRequestsQuery.isFetching ? "animate-spin" : ""}`} />
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
          <p className="text-xs font-bold uppercase text-amber-700">Demandes d’accès</p>
          <p className="mt-1 text-2xl font-black text-amber-950">{accessRequests.filter((row) => row.status === "pending").length || (accessFilter === "pending" ? accessRequests.length : "—")}</p>
          <p className="text-xs text-slate-500">Validation humaine obligatoire</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-white p-3">
          <p className="text-xs font-bold uppercase text-emerald-700">Sélections → N°02</p>
          <p className="mt-1 text-2xl font-black text-emerald-950">{selectedSubmissions.length}</p>
          <p className="text-xs text-slate-500">Activer depuis la fiche 360°</p>
        </div>
      </div>

      <Card className="mt-4 border-amber-200 bg-amber-50/40" data-testid="admin-access-requests">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-amber-700" />
                Demandes d’accès publiques
              </CardTitle>
              <CardDescription>Agences et employeurs déposent une demande ; aucun accès n’est créé sans revue humaine.</CardDescription>
            </div>
            <Select value={accessFilter} onValueChange={(value) => setAccessFilter(value as typeof accessFilter)}>
              <SelectTrigger className="w-40 bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="approved">Approuvées</SelectItem>
                <SelectItem value="rejected">Refusées</SelectItem>
                <SelectItem value="all">Toutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {accessRequestsQuery.isLoading ? (
            <p className="text-sm text-slate-600">Chargement des demandes…</p>
          ) : accessRequests.length === 0 ? (
            <p className="text-sm text-slate-600">Aucune demande dans ce filtre.</p>
          ) : (
            accessRequests.slice(0, 12).map((request) => (
              <div key={request.id} className="rounded-xl border border-amber-200 bg-white p-3 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-slate-950">{request.legalName} · {request.country}</p>
                    <p className="text-xs text-slate-600">
                      {request.organizationType === "placement_partner" ? "Agence de placement" : "Employeur"} · {request.contactName} · {request.contactEmail}
                    </p>
                    {request.message && <p className="mt-2 text-slate-700">{request.message}</p>}
                  </div>
                  <Badge variant="outline">{request.status}</Badge>
                </div>
                {request.status === "pending" && (
                  <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto_auto]">
                    <Input
                      value={reviewNote[request.id] ?? ""}
                      onChange={(event) => setReviewNote({ ...reviewNote, [request.id]: event.target.value })}
                      placeholder="Note de revue (facultatif)"
                      maxLength={1000}
                    />
                    <Button
                      size="sm"
                      className="bg-emerald-700 hover:bg-emerald-800"
                      disabled={reviewAccessMutation.isPending}
                      onClick={() => reviewAccessMutation.mutate({
                        sessionToken,
                        requestId: request.id,
                        decision: "approved",
                        reviewNote: reviewNote[request.id] || undefined,
                        createOrganization: true,
                        createAccess: true,
                        contactFullName: request.contactName,
                      })}
                    >
                      Approuver + accès
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={reviewAccessMutation.isPending}
                      onClick={() => reviewAccessMutation.mutate({
                        sessionToken,
                        requestId: request.id,
                        decision: "rejected",
                        reviewNote: reviewNote[request.id] || undefined,
                        createOrganization: false,
                        createAccess: false,
                      })}
                    >
                      Refuser
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

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
                <SelectItem value="employer">Employeur international</SelectItem>
                <SelectItem value="placement_partner">Agence de placement</SelectItem>
              </SelectContent>
            </Select>
            <label className="flex gap-2 text-xs text-slate-700">
              <input type="checkbox" checked={org.verified} onChange={(event) => setOrg({ ...org, verified: event.target.checked })} />
              J’ai vérifié cette organisation avant son activation.
            </label>
            <Button
              className="w-full bg-indigo-700 hover:bg-indigo-800"
              disabled={organizationMutation.isPending || lockedActions.organization || !org.legalName || !org.country || !org.contactEmail}
              onClick={() => { lockAction("organization"); organizationMutation.mutate({ sessionToken, ...org }); }}
            >
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
            <div>
              <Label className="text-xs text-slate-600">File de profils</Label>
              <Select value={profile.profilePool} onValueChange={(value) => setProfile({ ...profile, profilePool: value as ProfilePool })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="eligible_evaluation">{poolLabels.eligible_evaluation}</SelectItem>
                  <SelectItem value="top_talent">{poolLabels.top_talent}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full bg-sky-700 hover:bg-sky-800"
              disabled={profileMutation.isPending || lockedActions.profile || !profile.candidateId || profile.summary.length < 30 || !profile.targetDestination || !profile.targetProcedure}
              onClick={() => {
                lockAction("profile");
                profileMutation.mutate({
                  sessionToken,
                  candidateId: Number(profile.candidateId),
                  summary: profile.summary,
                  targetDestination: profile.targetDestination,
                  targetProcedure: profile.targetProcedure,
                  sector: profile.sector || undefined,
                  yearsExperience: profile.yearsExperience || undefined,
                  languagesSummary: profile.languagesSummary || undefined,
                  profilePool: profile.profilePool,
                });
              }}
            >
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
              <SelectContent>
                {profiles.map((row) => (
                  <SelectItem key={row.id} value={String(row.id)}>
                    {row.profileCode} · {row.targetDestination} · {poolLabels[(row.profilePool as ProfilePool) ?? "eligible_evaluation"]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={submission.organizationId} onValueChange={(value) => setSubmission({ ...submission, organizationId: value })}>
              <SelectTrigger><SelectValue placeholder="Organisation vérifiée" /></SelectTrigger>
              <SelectContent>
                {verifiedOrganizations.map((row) => (
                  <SelectItem key={row.id} value={String(row.id)}>
                    {row.legalName} · {row.country} · {row.organizationType === "placement_partner" ? "Agence" : "Employeur"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea value={submission.adminNote} onChange={(event) => setSubmission({ ...submission, adminNote: event.target.value })} placeholder="Note interne facultative" maxLength={2000} />
            <Button
              className="w-full bg-emerald-700 hover:bg-emerald-800"
              disabled={submissionMutation.isPending || lockedActions.submission || !submission.profileId || !submission.organizationId}
              onClick={() => {
                lockAction("submission");
                submissionMutation.mutate({
                  sessionToken,
                  profileId: Number(submission.profileId),
                  organizationId: Number(submission.organizationId),
                  adminNote: submission.adminNote || undefined,
                });
              }}
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              {lockedActions.submission ? "Soumission confirmée" : "Confirmer la soumission"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-amber-100">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><Eye className="h-4 w-4 text-amber-700" />Accès partenaire</CardTitle>
            <CardDescription>Employeurs et agences : mot de passe temporaire généré une seule fois.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Select value={employerAccess.organizationId} onValueChange={(value) => setEmployerAccess({ ...employerAccess, organizationId: value })}>
              <SelectTrigger><SelectValue placeholder="Organisation vérifiée" /></SelectTrigger>
              <SelectContent>
                {verifiedOrganizations.map((row) => (
                  <SelectItem key={row.id} value={String(row.id)}>
                    {row.legalName} · {row.organizationType === "placement_partner" ? "Agence" : "Employeur"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input value={employerAccess.fullName} onChange={(event) => setEmployerAccess({ ...employerAccess, fullName: event.target.value })} placeholder="Nom du contact" maxLength={255} />
            <Input type="email" value={employerAccess.email} onChange={(event) => setEmployerAccess({ ...employerAccess, email: event.target.value })} placeholder="E-mail professionnel" maxLength={320} />
            <Button
              className="w-full bg-amber-700 hover:bg-amber-800"
              disabled={employerAccessMutation.isPending || lockedActions.employerAccess || !employerAccess.organizationId || !employerAccess.fullName || !employerAccess.email}
              onClick={() => {
                lockAction("employerAccess");
                employerAccessMutation.mutate({
                  sessionToken,
                  organizationId: Number(employerAccess.organizationId),
                  fullName: employerAccess.fullName,
                  email: employerAccess.email,
                });
              }}
            >
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

      {selectedSubmissions.length > 0 && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3" data-testid="admin-protocol-two-queue">
          <p className="font-bold text-emerald-950">Sélections partenaires → Protocole N°02</p>
          <p className="mt-1 text-sm text-emerald-900">
            Après revue humaine du retour partenaire, activez le Protocole N°02 (employeur + poste) depuis la fiche 360° du candidat concerné.
          </p>
          <ul className="mt-3 space-y-2">
            {selectedSubmissions.slice(0, 8).map((row) => {
              const profileRow = profilesById.get(row.profileId);
              return (
                <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-white p-2 text-sm">
                  <span>
                    Profil {profileRow?.profileCode ?? `#${row.profileId}`}
                    {profileRow?.candidateId ? ` · candidat #${profileRow.candidateId}` : ""}
                    {" · "}organisation #{row.organizationId}
                  </span>
                  <Badge className="bg-emerald-700 text-white">Sélectionné → ouvrir fiche 360°</Badge>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="font-bold text-slate-950">Suivis de placement récents</p>
          <Badge className="bg-slate-100 text-slate-700">{submissions.length}</Badge>
        </div>
        {submissions.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">Aucun profil n’a encore été soumis. Préparez d’abord un profil avec consentement actif.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {submissions.slice(0, 8).map((row) => {
              const profileRow = profilesById.get(row.profileId);
              return (
                <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-2 text-sm">
                  <span>
                    {profileRow?.profileCode ?? `Profil #${row.profileId}`} · Organisation #{row.organizationId}
                    {profileRow?.profilePool ? ` · ${poolLabels[(profileRow.profilePool as ProfilePool) ?? "eligible_evaluation"]}` : ""}
                  </span>
                  <Badge variant="outline">{submissionLabels[row.status] ?? row.status}</Badge>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
