import { useMemo, useState } from "react";
import { toDataURL } from "qrcode";
import { Bell, Building2, BriefcaseBusiness, Download, LockKeyhole, LogOut, Share2, ShieldCheck, Star, UserRoundCog, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const sessionKey = "3m_placement_employer_session";
type Decision = "under_review" | "shortlisted" | "selected" | "not_selected" | "documents_requested";

export default function EmployerPortal() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [needsTwoFactor, setNeedsTwoFactor] = useState(false);
  const [sessionToken, setSessionToken] = useState(() => sessionStorage.getItem(sessionKey) ?? "");
  const [organization, setOrganization] = useState<{ name: string; country: string } | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [favoriteNotes, setFavoriteNotes] = useState<Record<number, string>>({});
  const [shareRecipient, setShareRecipient] = useState<Record<number, string>>({});
  const [decisions, setDecisions] = useState<Record<number, Decision>>({});
  const [sector, setSector] = useState("all");
  const [language, setLanguage] = useState("all");
  const [country, setCountry] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const utils = trpc.useUtils();

  const login = trpc.placementPortal.employerLogin.useMutation({
    onSuccess: result => {
      sessionStorage.setItem(sessionKey, result.sessionToken);
      setSessionToken(result.sessionToken);
      setOrganization(result.organization);
      setNeedsTwoFactor(false);
      setTwoFactorCode("");
      toast.success(t("Accès organisation vérifié.", "Verified organisation access."));
    },
    onError: error => {
      if (error.message.includes("TOTP_REQUIRED")) {
        setNeedsTwoFactor(true);
        toast.info(t("Saisissez votre code d’authentification à six chiffres.", "Enter your six-digit authentication code."));
      } else toast.error(t("Connexion refusée", "Login denied"), { description: error.message });
    },
  });
  const profiles = trpc.placementPortal.employerProfiles.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false });
  const collaborators = trpc.placementPortal.employerCollaborators.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false });
  const notifications = trpc.placementPortal.employerNotifications.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false });
  const totpStatus = trpc.placementPortal.employerTwoFactorStatus.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false });
  const decision = trpc.placementPortal.employerRecordDecision.useMutation({
    onSuccess: async result => { toast.success(result.message); await utils.placementPortal.employerProfiles.invalidate(); },
    onError: error => toast.error(t("Retour non enregistré", "Feedback not recorded"), { description: error.message }),
  });
  const favorite = trpc.placementPortal.employerToggleFavorite.useMutation({
    onSuccess: async () => { await utils.placementPortal.employerProfiles.invalidate(); },
    onError: error => toast.error(t("Favori non mis à jour", "Favourite not updated"), { description: error.message }),
  });
  const saveFavoriteNote = trpc.placementPortal.employerUpdateFavoriteNote.useMutation({
    onSuccess: async () => { await utils.placementPortal.employerProfiles.invalidate(); toast.success(t("Note privée enregistrée", "Private note saved")); },
    onError: error => toast.error(t("Note non enregistrée", "Note not saved"), { description: error.message }),
  });
  const shareFavorite = trpc.placementPortal.employerShareFavorite.useMutation({
    onSuccess: async result => { toast.success(t(result.message, "Favourite shared with your organisation.")); await utils.placementPortal.employerProfiles.invalidate(); },
    onError: error => toast.error(t("Partage non effectué", "Share not completed"), { description: error.message }),
  });
  const revokeShare = trpc.placementPortal.employerRevokeFavoriteShare.useMutation({
    onSuccess: async result => { toast.success(t(result.message, "Share revoked.")); await utils.placementPortal.employerProfiles.invalidate(); await utils.placementPortal.employerNotifications.invalidate(); },
    onError: error => toast.error(t("Révocation impossible", "Cannot revoke share"), { description: error.message }),
  });
  const markNotificationRead = trpc.placementPortal.employerMarkNotificationRead.useMutation({ onSuccess: async () => { await utils.placementPortal.employerNotifications.invalidate(); } });
  const setCollaboratorRole = trpc.placementPortal.employerSetCollaboratorRole.useMutation({
    onSuccess: async () => { toast.success(t("Rôle collaborateur mis à jour", "Collaborator role updated")); await utils.placementPortal.employerCollaborators.invalidate(); },
    onError: error => toast.error(t("Rôle non modifié", "Role not updated"), { description: error.message }),
  });
  const exportFavorites = trpc.placementPortal.employerExportFavorites.useMutation({
    onSuccess: ({ csv, filename, count }) => {
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(t(`${count} favori(s) exporté(s)`, `${count} favourite(s) exported`));
    },
    onError: error => toast.error(t("Export indisponible", "Export unavailable"), { description: error.message }),
  });
  const beginTotp = trpc.placementPortal.employerBeginTwoFactorEnrollment.useMutation({
    onSuccess: async result => {
      setQrDataUrl(await toDataURL(result.otpAuthUri, { margin: 1, width: 220 }));
      toast.info(t("Scannez le QR code puis confirmez avec le code affiché par votre application.", "Scan the QR code, then confirm with the code shown by your app."));
    },
    onError: error => toast.error(t("Configuration 2FA impossible", "Cannot set up 2FA"), { description: error.message }),
  });
  const confirmTotp = trpc.placementPortal.employerConfirmTwoFactorEnrollment.useMutation({
    onSuccess: async result => {
      setRecoveryCodes(result.recoveryCodes);
      setQrDataUrl("");
      setTwoFactorCode("");
      await utils.placementPortal.employerTwoFactorStatus.invalidate();
      toast.success(t("2FA activée. Conservez les codes de récupération hors ligne.", "2FA enabled. Store recovery codes offline."));
    },
    onError: error => toast.error(t("Code 2FA invalide", "Invalid 2FA code"), { description: error.message }),
  });

  const availableProfiles = profiles.data ?? [];
  const isManager = collaborators.data?.currentRole === "manager";
  const unreadNotifications = (notifications.data ?? []).filter(notification => !notification.readAt);
  const sectors = useMemo(() => Array.from(new Set(availableProfiles.map(row => row.profile.sector).filter(Boolean))), [availableProfiles]);
  const countries = useMemo(() => Array.from(new Set(availableProfiles.map(row => row.profile.targetDestination).filter(Boolean))), [availableProfiles]);
  const languages = useMemo(() => Array.from(new Set(availableProfiles.flatMap(row => (row.profile.languagesSummary || "").split(/[,;/]/).map(item => item.trim()).filter(Boolean)))), [availableProfiles]);
  const filteredProfiles = availableProfiles.filter(row =>
    (sector === "all" || row.profile.sector === sector) &&
    (country === "all" || row.profile.targetDestination === country) &&
    (language === "all" || (row.profile.languagesSummary || "").toLowerCase().includes(language.toLowerCase())) &&
    (availability === "all" || row.status === "submitted") &&
    (!favoritesOnly || row.isFavorite || row.sharedWithMe),
  );

  if (!sessionToken) {
    return <main className="min-h-screen bg-slate-950 px-4 py-16"><div className="mx-auto max-w-lg space-y-4">
      <Card className="border-slate-700 bg-white"><CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-indigo-700" />{t("Portail employeur vérifié", "Verified employer portal")}</CardTitle><CardDescription>{t("Accès réservé aux organisations vérifiées par 3M Travel & Services.", "Access is reserved for organisations verified by 3M Travel & Services.")}</CardDescription></CardHeader><CardContent className="space-y-3">
        <Input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder={t("E-mail professionnel", "Business email")} />
        <Input type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder={t("Mot de passe remis par 3M", "Password issued by 3M")} />
        {needsTwoFactor && <Input inputMode="numeric" autoComplete="one-time-code" value={twoFactorCode} onChange={event => setTwoFactorCode(event.target.value)} placeholder={t("Code 2FA ou récupération", "2FA or recovery code")} />}
        <Button className="w-full bg-indigo-700 hover:bg-indigo-800" disabled={login.isPending || !email || !password || (needsTwoFactor && !twoFactorCode)} onClick={() => login.mutate({ email, password, twoFactorCode: twoFactorCode || undefined })}><LockKeyhole className="mr-2 h-4 w-4" />{login.isPending ? t("Vérification…", "Verifying…") : t("Se connecter", "Sign in")}</Button>
        <p className="text-xs leading-5 text-slate-500">{t("Ce portail ne présente que des profils anonymisés dont le partage a été autorisé. Aucun document personnel ni contact candidat n’est affiché.", "This portal displays only anonymised profiles whose sharing was authorised. No personal document or candidate contact is displayed.")}</p>
      </CardContent></Card>
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><p className="font-bold">{t("Indicateurs publics", "Public indicators")}</p><p className="mt-1">{t("Les volumes de profils vérifiés, taux de placement et délais moyens ne sont pas publiés tant qu’une série de données vérifiable, datée et méthodologiquement définie n’est pas disponible.", "Verified profile volumes, placement rates and average times are not published until a verifiable, dated and methodologically defined data series is available.")}</p></section>
    </div></main>;
  }

  return <main className="min-h-screen bg-slate-50 px-4 py-10"><div className="mx-auto max-w-5xl space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-950 p-5 text-white"><div><p className="text-xs font-bold uppercase tracking-wider text-indigo-200">{t("Organisation vérifiée", "Verified organisation")}</p><h1 className="mt-1 text-2xl font-black">{organization?.name ?? t("Portail employeur", "Employer portal")}</h1><p className="mt-1 text-sm text-slate-300">{organization?.country ?? ""} · {t("Retours soumis à validation 3M", "Feedback subject to 3M review")}</p></div><Button variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white" onClick={() => { sessionStorage.removeItem(sessionKey); setSessionToken(""); setOrganization(null); }}><LogOut className="mr-2 h-4 w-4" />{t("Déconnexion", "Sign out")}</Button></header>
    <section className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-950"><p className="flex items-center gap-2 font-bold"><ShieldCheck className="h-4 w-4" />{t("Règle de confidentialité", "Privacy rule")}</p><p className="mt-1">{t("Les décisions enregistrées ici sont des retours de sélection. 3M les examine avant toute communication ou transmission de pièces au candidat.", "Decisions recorded here are selection feedback. 3M reviews them before any communication or document transfer to a candidate.")}</p></section>
    <section className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-bold text-slate-900">{t("Authentification à deux facteurs", "Two-factor authentication")}</p><p className="text-sm text-slate-600">{totpStatus.data?.enabled ? t("Protection 2FA active pour les nouvelles connexions.", "2FA protection is active for new sign-ins.") : t("Configurez une application d’authentification pour protéger les prochaines connexions.", "Set up an authenticator app to protect future sign-ins.")}</p></div>{!totpStatus.data?.enabled && !qrDataUrl && <Button variant="outline" onClick={() => beginTotp.mutate({ sessionToken })}>{t("Configurer 2FA", "Set up 2FA")}</Button>}</div>{qrDataUrl && <div className="mt-4 grid gap-3 sm:grid-cols-[220px_1fr]"><img src={qrDataUrl} alt={t("QR code de configuration 2FA", "2FA setup QR code")} className="h-[220px] w-[220px] border bg-white p-2" /><div className="space-y-3"><Input inputMode="numeric" autoComplete="one-time-code" value={twoFactorCode} onChange={event => setTwoFactorCode(event.target.value)} placeholder={t("Code à six chiffres", "Six-digit code")} /><Button disabled={!twoFactorCode || confirmTotp.isPending} onClick={() => confirmTotp.mutate({ sessionToken, code: twoFactorCode })}>{t("Confirmer et générer les codes", "Confirm and generate codes")}</Button></div></div>}{recoveryCodes.length > 0 && <div className="mt-4 border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><p className="font-bold">{t("Codes de récupération — conservez-les hors ligne", "Recovery codes — store offline")}</p><p className="mt-1">{recoveryCodes.join(" · ")}</p></div>}</section>
    <section className="grid gap-4 lg:grid-cols-2"><div className="rounded-xl border border-slate-200 bg-white p-4"><p className="flex items-center gap-2 font-bold text-slate-900"><Bell className="h-4 w-4 text-indigo-700" />{t("Notifications internes", "Internal notifications")} {unreadNotifications.length > 0 && <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-800">{unreadNotifications.length}</span>}</p><div className="mt-3 space-y-2">{(notifications.data ?? []).slice(0, 5).map(notification => <div key={notification.id} className={`flex items-start justify-between gap-3 rounded-lg p-2 text-sm ${notification.readAt ? "bg-slate-50 text-slate-600" : "bg-indigo-50 text-indigo-950"}`}><span>{notification.message}</span>{!notification.readAt && <Button size="sm" variant="ghost" onClick={() => markNotificationRead.mutate({ sessionToken, notificationId: notification.id })}>{t("Lu", "Read")}</Button>}</div>)}{(notifications.data ?? []).length === 0 && <p className="text-sm text-slate-500">{t("Aucune notification interne.", "No internal notifications.")}</p>}</div></div><div className="rounded-xl border border-slate-200 bg-white p-4"><p className="flex items-center gap-2 font-bold text-slate-900"><UserRoundCog className="h-4 w-4 text-indigo-700" />{t("Collaborateurs", "Collaborators")}</p><p className="mt-1 text-xs text-slate-500">{isManager ? t("Vous êtes gestionnaire : vous pouvez partager, révoquer et définir les rôles.", "You are a manager: you can share, revoke and set roles.") : t("Vous êtes lecteur : les partages reçus sont consultables, sans action de gestion.", "You are a reader: received shares are viewable without management actions.")}</p><div className="mt-3 space-y-2">{(collaborators.data?.collaborators ?? []).map(collaborator => <div key={collaborator.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 p-2 text-sm"><span>{collaborator.fullName}</span><Select value={collaborator.collaborationRole} disabled={!isManager || setCollaboratorRole.isPending} onValueChange={value => setCollaboratorRole.mutate({ sessionToken, collaboratorId: collaborator.id, role: value as "reader" | "manager" })}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="reader">{t("Lecteur", "Reader")}</SelectItem><SelectItem value="manager">{t("Gestionnaire", "Manager")}</SelectItem></SelectContent></Select></div>)}</div></div></section>
    {profiles.isLoading ? <p className="py-10 text-center text-slate-500">{t("Chargement des profils autorisés…", "Loading authorised profiles…")}</p> : profiles.error ? <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800">{t("Votre session n’est plus valide. Reconnectez-vous.", "Your session is no longer valid. Please sign in again.")}</p> : <>
      <section className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-6"><Select value={sector} onValueChange={setSector}><SelectTrigger><SelectValue placeholder={t("Métier / secteur", "Role / sector")} /></SelectTrigger><SelectContent><SelectItem value="all">{t("Tous les secteurs", "All sectors")}</SelectItem>{sectors.map(value => <SelectItem key={value} value={value!}>{value}</SelectItem>)}</SelectContent></Select><Select value={language} onValueChange={setLanguage}><SelectTrigger><SelectValue placeholder={t("Langue", "Language")} /></SelectTrigger><SelectContent><SelectItem value="all">{t("Toutes les langues", "All languages")}</SelectItem>{languages.map(value => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select><Select value={country} onValueChange={setCountry}><SelectTrigger><SelectValue placeholder={t("Pays cible", "Target country")} /></SelectTrigger><SelectContent><SelectItem value="all">{t("Tous les pays cibles", "All target countries")}</SelectItem>{countries.map(value => <SelectItem key={value} value={value!}>{value}</SelectItem>)}</SelectContent></Select><Select value={availability} onValueChange={setAvailability}><SelectTrigger><SelectValue placeholder={t("Disponibilité", "Availability")} /></SelectTrigger><SelectContent><SelectItem value="all">{t("Toutes disponibilités", "All availability")}</SelectItem><SelectItem value="submitted">{t("Disponible pour examen", "Available for review")}</SelectItem></SelectContent></Select><Button variant={favoritesOnly ? "default" : "outline"} onClick={() => setFavoritesOnly(value => !value)}><Star className="mr-2 h-4 w-4" />{t("Favoris", "Favourites")}</Button><Button variant="outline" disabled={exportFavorites.isPending} onClick={() => exportFavorites.mutate({ sessionToken })}><Download className="mr-2 h-4 w-4" />{t("Exporter favoris", "Export favourites")}</Button></section>
      <p className="text-sm text-slate-600">{filteredProfiles.length} {t("profil(s) autorisé(s) selon les filtres sélectionnés.", "authorised profile(s) matching the selected filters.")}</p>
      <div className="grid gap-4 md:grid-cols-2">{filteredProfiles.map(row => <Card key={row.submissionId} className="border-slate-200"><CardHeader><div className="flex items-center justify-between gap-2"><CardTitle className="flex items-center gap-2 text-base"><BriefcaseBusiness className="h-4 w-4 text-indigo-700" />{row.profile.code}</CardTitle><Button size="icon" variant="ghost" aria-label={row.isFavorite ? t("Retirer des favoris", "Remove from favourites") : t("Ajouter aux favoris", "Add to favourites")} onClick={() => favorite.mutate({ sessionToken, submissionId: row.submissionId })}><Star className={`h-4 w-4 ${row.isFavorite ? "fill-amber-400 text-amber-500" : "text-slate-500"}`} /></Button></div><CardDescription>{row.profile.targetDestination} · {row.profile.targetProcedure}</CardDescription></CardHeader><CardContent className="space-y-3"><p className="text-sm leading-6 text-slate-700">{row.profile.summary}</p><div className="grid grid-cols-2 gap-2 text-xs"><span className="rounded bg-slate-100 p-2">{t("Secteur", "Sector")} : {row.profile.sector || t("Non précisé", "Not specified")}</span><span className="rounded bg-slate-100 p-2">{t("Expérience", "Experience")} : {row.profile.yearsExperience || t("Non précisée", "Not specified")}</span><span className="col-span-2 rounded bg-slate-100 p-2">{t("Langues", "Languages")} : {row.profile.languagesSummary || t("Non précisées", "Not specified")}</span></div>
        {row.sharedWithMe && <p className="rounded bg-indigo-50 p-2 text-xs text-indigo-800">{t(`Partagé par ${row.sharedWithMe.sharedByName}`, `Shared by ${row.sharedWithMe.sharedByName}`)}</p>}
        {row.isFavorite && <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3"><Textarea value={favoriteNotes[row.submissionId] ?? row.privateNote ?? ""} onChange={event => setFavoriteNotes({ ...favoriteNotes, [row.submissionId]: event.target.value })} placeholder={t("Note privée de votre organisation", "Private note for your organisation")} /><Button size="sm" variant="outline" disabled={saveFavoriteNote.isPending} onClick={() => saveFavoriteNote.mutate({ sessionToken, submissionId: row.submissionId, note: favoriteNotes[row.submissionId] ?? row.privateNote ?? "" })}>{t("Enregistrer la note privée", "Save private note")}</Button>{isManager && <div className="grid gap-2 sm:grid-cols-[1fr_auto]"><Select value={shareRecipient[row.submissionId] ?? "none"} onValueChange={value => setShareRecipient({ ...shareRecipient, [row.submissionId]: value })}><SelectTrigger><SelectValue placeholder={t("Partager avec un collaborateur", "Share with a collaborator")} /></SelectTrigger><SelectContent><SelectItem value="none">{t("Choisir un collaborateur", "Choose a collaborator")}</SelectItem>{(collaborators.data?.collaborators ?? []).map(collaborator => <SelectItem key={collaborator.id} value={String(collaborator.id)}>{collaborator.fullName}</SelectItem>)}</SelectContent></Select><Button size="sm" variant="outline" disabled={shareFavorite.isPending || !shareRecipient[row.submissionId] || shareRecipient[row.submissionId] === "none"} onClick={() => shareFavorite.mutate({ sessionToken, submissionId: row.submissionId, recipientEmployerAccountId: Number(shareRecipient[row.submissionId]) })}><Share2 className="mr-2 h-4 w-4" />{t("Partager", "Share")}</Button></div>}{row.outgoingShares.map(share => <div key={share.shareId} className="flex items-center justify-between rounded bg-white px-2 py-1 text-xs text-slate-700"><span>{t(`Partagé avec ${share.recipientName}`, `Shared with ${share.recipientName}`)}</span>{isManager && <Button size="sm" variant="ghost" onClick={() => revokeShare.mutate({ sessionToken, shareId: share.shareId })}><X className="mr-1 h-3 w-3" />{t("Révoquer", "Revoke")}</Button>}</div>)}</div>}
        <Select value={decisions[row.submissionId] ?? row.status} onValueChange={value => setDecisions({ ...decisions, [row.submissionId]: value as Decision })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="under_review">{t("En revue", "Under review")}</SelectItem><SelectItem value="shortlisted">{t("Présélectionné", "Shortlisted")}</SelectItem><SelectItem value="selected">{t("Sélectionné", "Selected")}</SelectItem><SelectItem value="not_selected">{t("Non retenu", "Not selected")}</SelectItem><SelectItem value="documents_requested">{t("Pièces à demander", "Documents requested")}</SelectItem></SelectContent></Select><Textarea value={notes[row.submissionId] ?? ""} onChange={event => setNotes({ ...notes, [row.submissionId]: event.target.value })} placeholder={t("Commentaire pour l’équipe 3M (facultatif)", "Comment for the 3M team (optional)")} /><Button className="w-full bg-indigo-700 hover:bg-indigo-800" disabled={decision.isPending} onClick={() => decision.mutate({ sessionToken, submissionId: row.submissionId, decision: decisions[row.submissionId] ?? "under_review", note: notes[row.submissionId] || undefined })}>{t("Enregistrer le retour", "Save feedback")}</Button></CardContent></Card>)}{filteredProfiles.length === 0 && <p className="col-span-2 rounded-xl border border-dashed border-slate-300 p-6 text-center text-slate-600">{t("Aucun profil autorisé ne correspond aux filtres sélectionnés.", "No authorised profile matches the selected filters.")}</p>}</div>
    </>}</div></main>;
}
