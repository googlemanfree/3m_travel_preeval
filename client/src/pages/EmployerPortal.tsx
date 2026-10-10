import { useEffect, useMemo, useState } from "react";
import { toDataURL } from "qrcode";
import { Bell, Building2, BriefcaseBusiness, CheckCircle2, ClipboardCheck, Download, IdCard, LockKeyhole, LogOut, RefreshCw, Share2, ShieldCheck, Star, UserRoundCog, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { B2bPartnerRegistrationForm, type PartnerOrganizationType } from "@/components/B2bPartnerRegistrationForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const sessionKey = "3m_placement_employer_session";
const orgKey = "3m_placement_employer_org";
type Decision = "under_review" | "shortlisted" | "selected" | "not_selected" | "documents_requested";
type CollaborationAuditAction = "all" | "favorite_shared" | "favorite_share_revoked" | "collaborator_promoted" | "collaborator_role_reader" | "collaborator_suspended" | "collaborator_reactivated" | "collaborator_suspension_reviewed";
type CollaborationAuditRange = "7d" | "30d" | "all";
type AuthTab = "login" | "register";
type WorkspaceTab = "profiles" | "team" | "security";
type PortalOrganization = { name: string; country: string; organizationType: PartnerOrganizationType };

function readPortalDefaults(): { tab: AuthTab; organizationType: PartnerOrganizationType } {
  if (typeof window === "undefined") return { tab: "login", organizationType: "employer" };
  const params = new URLSearchParams(window.location.search);
  const portal = params.get("portal");
  const tabParam = params.get("tab");
  const organizationType: PartnerOrganizationType = portal === "placement_partner" ? "placement_partner" : "employer";
  const tab: AuthTab = tabParam === "register" || tabParam === "inscription" ? "register" : tabParam === "login" ? "login" : "login";
  return { tab, organizationType };
}

function readStoredOrganization(): PortalOrganization | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(orgKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PortalOrganization>;
    if (!parsed?.name) return null;
    return {
      name: parsed.name,
      country: parsed.country ?? "",
      organizationType: parsed.organizationType === "placement_partner" ? "placement_partner" : "employer",
    };
  } catch {
    return null;
  }
}

export default function EmployerPortal() {
  const { t } = useLanguage();
  const portalDefaults = useMemo(() => readPortalDefaults(), []);
  const [authTab, setAuthTab] = useState<AuthTab>(portalDefaults.tab);
  const selectAuthTab = (tab: AuthTab) => {
    setAuthTab(tab);
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  };
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [needsTwoFactor, setNeedsTwoFactor] = useState(false);
  const [sessionToken, setSessionToken] = useState(() => sessionStorage.getItem(sessionKey) ?? "");
  const [organization, setOrganization] = useState<PortalOrganization | null>(() => readStoredOrganization());
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>("profiles");
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
  const [auditAction, setAuditAction] = useState<CollaborationAuditAction>("all");
  const [auditRange, setAuditRange] = useState<CollaborationAuditRange>("30d");
  const [auditActor, setAuditActor] = useState("all");
  const [auditTarget, setAuditTarget] = useState("all");
  const [reviewingCollaborator, setReviewingCollaborator] = useState<{ id: number; fullName: string } | null>(null);
  const [loginDraftSaved, setLoginDraftSaved] = useState(false);
  const utils = trpc.useUtils();
  const isAgencyPortal = portalDefaults.organizationType === "placement_partner" || organization?.organizationType === "placement_partner";
  const persistOrganization = (next: PortalOrganization | null) => {
    setOrganization(next);
    if (typeof window === "undefined") return;
    if (next) sessionStorage.setItem(orgKey, JSON.stringify(next));
    else sessionStorage.removeItem(orgKey);
  };

  useEffect(() => {
    try {
      const draft = JSON.parse(localStorage.getItem("3m-employer-login-draft") || "null") as { email?: string } | null;
      if (draft?.email) setEmail(draft.email);
    } catch { /* brouillon local facultatif */ }
  }, []);
  useEffect(() => {
    if (!email && !password) return;
    localStorage.setItem("3m-employer-login-draft", JSON.stringify({ email }));
    setLoginDraftSaved(true);
  }, [email, password]);

  const login = trpc.placementPortal.employerLogin.useMutation({
    onSuccess: result => {
      sessionStorage.setItem(sessionKey, result.sessionToken);
      setSessionToken(result.sessionToken);
      persistOrganization({
        name: result.organization.name,
        country: result.organization.country,
        organizationType: result.organization.organizationType === "placement_partner" ? "placement_partner" : "employer",
      });
      setWorkspaceTab("profiles");
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
  const sessionInfo = trpc.placementPortal.employerSessionInfo.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false });
  useEffect(() => {
    if (!sessionInfo.data?.organization) return;
    persistOrganization({
      name: sessionInfo.data.organization.name,
      country: sessionInfo.data.organization.country,
      organizationType: sessionInfo.data.organization.organizationType === "placement_partner" ? "placement_partner" : "employer",
    });
  }, [sessionInfo.data?.organization]);
  const profiles = trpc.placementPortal.employerProfiles.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false });
  const collaborators = trpc.placementPortal.employerCollaborators.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false });
  const notifications = trpc.placementPortal.employerNotifications.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false });
  const totpStatus = trpc.placementPortal.employerTwoFactorStatus.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false });
  const auditFilters = useMemo(() => ({
    sessionToken,
    action: auditAction === "all" ? undefined : auditAction,
    actorEmployerAccountId: auditActor === "all" ? undefined : Number(auditActor),
    targetEmployerAccountId: auditTarget === "all" ? undefined : Number(auditTarget),
    range: auditRange,
    limit: 50,
  }), [auditAction, auditActor, auditRange, auditTarget, sessionToken]);
  const collaborationActivity = trpc.placementPortal.employerCollaborationActivity.useQuery(auditFilters, { enabled: Boolean(sessionToken) && collaborators.data?.currentRole === "manager", retry: false });
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
  const markAllNotificationsRead = trpc.placementPortal.employerMarkAllNotificationsRead.useMutation({ onSuccess: async () => { await utils.placementPortal.employerNotifications.invalidate(); toast.success(t("Notifications marquées comme lues", "Notifications marked as read")); } });
  const setCollaboratorRole = trpc.placementPortal.employerSetCollaboratorRole.useMutation({
    onSuccess: async () => { toast.success(t("Rôle collaborateur mis à jour", "Collaborator role updated")); await Promise.all([utils.placementPortal.employerCollaborators.invalidate(), utils.placementPortal.employerCollaborationActivity.invalidate()]); },
    onError: error => toast.error(t("Rôle non modifié", "Role not updated"), { description: error.message }),
  });
  const setCollaboratorAccess = trpc.placementPortal.employerSetCollaboratorAccess.useMutation({
    onSuccess: async result => { toast.success(result.status === "active" ? t("Accès réactivé", "Access reactivated") : t("Accès suspendu", "Access suspended")); await Promise.all([utils.placementPortal.employerCollaborators.invalidate(), utils.placementPortal.employerCollaborationActivity.invalidate()]); },
    onError: error => toast.error(t("Accès non modifié", "Access not updated"), { description: error.message }),
  });
  const reviewSuspendedCollaborator = trpc.placementPortal.employerReviewSuspendedCollaborator.useMutation({
    onSuccess: async result => {
      setReviewingCollaborator(null);
      toast.success(result.status === "active" ? t("Accès réactivé après révision manuelle", "Access reactivated after manual review") : t("Suspension confirmée après révision manuelle", "Suspension confirmed after manual review"));
      await Promise.all([utils.placementPortal.employerCollaborators.invalidate(), utils.placementPortal.employerCollaborationActivity.invalidate()]);
    },
    onError: error => toast.error(t("Révision non enregistrée", "Review not recorded"), { description: error.message }),
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
  const exportCollaborationActivity = trpc.placementPortal.employerExportCollaborationActivity.useMutation({
    onSuccess: ({ csv, filename, count }) => {
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(t(`${count} événement(s) exporté(s)`, `${count} event(s) exported`));
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
  const suspendedCollaborators = (collaborators.data?.collaborators ?? []).filter(collaborator => collaborator.status === "suspended");
  const collaborationActionLabel = (action: string) => {
    const labels: Record<string, [string, string]> = {
      favorite_shared: ["Favori partagé", "Favourite shared"],
      favorite_share_revoked: ["Partage révoqué", "Share revoked"],
      collaborator_promoted: ["Rôle gestionnaire attribué", "Manager role assigned"],
      collaborator_role_reader: ["Rôle lecteur attribué", "Reader role assigned"],
      collaborator_suspended: ["Accès suspendu", "Access suspended"],
      collaborator_reactivated: ["Accès réactivé", "Access reactivated"],
      collaborator_suspension_reviewed: ["Suspension revue manuellement", "Suspension manually reviewed"],
    };
    const [fr, en] = labels[action] ?? ["Action de gouvernance", "Governance action"];
    return t(fr, en);
  };

  if (!sessionToken) {
    return (
      <main className="reveal-on-scroll bg-[radial-gradient(circle_at_top_right,_rgba(135,185,255,0.28),_transparent_28rem),linear-gradient(145deg,_#071b3d_0%,_#0b2f6f_100%)] px-4 py-10 sm:py-14">
        <div className={`mx-auto space-y-4 ${authTab === "register" ? "max-w-3xl" : "max-w-lg"}`}>
          <div className="rounded-2xl border border-white/25 bg-white/10 p-1 text-white backdrop-blur">
            <div className="grid grid-cols-2 gap-1" role="tablist" aria-label={t("Connexion ou inscription partenaire", "Partner sign-in or registration")}>
              <button type="button" role="tab" data-testid="employer-auth-tab-login" aria-selected={authTab === "login"} className={`min-h-11 rounded-xl px-3 text-sm font-black transition ${authTab === "login" ? "bg-white text-[#071b3d]" : "text-blue-100 hover:bg-white/10"}`} onClick={() => selectAuthTab("login")}>
                <span className="inline-flex items-center gap-2"><LockKeyhole className="h-4 w-4" />{t("Connexion", "Sign in")}</span>
              </button>
              <button type="button" role="tab" data-testid="employer-auth-tab-register" aria-selected={authTab === "register"} className={`min-h-11 rounded-xl px-3 text-sm font-black transition ${authTab === "register" ? "bg-amber-300 text-[#071b3d]" : "text-blue-100 hover:bg-white/10"}`} onClick={() => selectAuthTab("register")}>
                <span className="inline-flex items-center gap-2"><IdCard className="h-4 w-4" />{t("Inscription", "Register")}</span>
              </button>
            </div>
          </div>

          {authTab === "login" ? (
            <Card className="premium-surface overflow-hidden border-blue-100" data-testid="partner-auth-login">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#071b3d]">
                  {isAgencyPortal ? <BriefcaseBusiness className="h-5 w-5 text-[#1463ff]" /> : <Building2 className="h-5 w-5 text-[#1463ff]" />}
                  {isAgencyPortal
                    ? t("Espace agence de placement", "Placement agency workspace")
                    : t("Portail employeur vérifié", "Verified employer portal")}
                </CardTitle>
                <CardDescription>
                  {isAgencyPortal
                    ? t("Connexion réservée aux agences déjà vérifiées. Les identifiants sont remis par 3M après examen de votre inscription.", "Sign-in is reserved for already verified agencies. Credentials are issued by 3M after your registration is reviewed.")
                    : t("Connexion réservée aux organisations déjà vérifiées. Les identifiants sont remis par 3M après examen de votre inscription.", "Sign-in is reserved for already verified organisations. Credentials are issued by 3M after your registration is reviewed.")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <Input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder={t("E-mail professionnel", "Business email")} maxLength={320} autoComplete="username" className="pr-10" />
                  {email.trim() && <CheckCircle2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600" aria-label={t("E-mail renseigné", "Email entered")} />}
                </div>
                <div className="relative">
                  <Input type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder={t("Mot de passe remis par 3M", "Password issued by 3M")} maxLength={128} autoComplete="current-password" className="pr-10" />
                  {password && <CheckCircle2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600" aria-label={t("Mot de passe renseigné", "Password entered")} />}
                </div>
                {needsTwoFactor && <Input inputMode="numeric" autoComplete="one-time-code" value={twoFactorCode} onChange={event => setTwoFactorCode(event.target.value)} placeholder={t("Code 2FA ou récupération", "2FA or recovery code")} maxLength={32} />}
                <p className="flex items-center gap-2 text-xs font-semibold text-slate-600" aria-live="polite">
                  <span className={`h-2 w-2 rounded-full ${email.trim() && password ? "bg-emerald-500" : "bg-amber-400"}`} aria-hidden="true" />
                  {!email.trim()
                    ? t("L’e-mail professionnel est requis.", "Business email is required.")
                    : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
                      ? t("Vérifiez le format de l’e-mail.", "Check the email format.")
                      : !password
                        ? t("Le mot de passe est requis.", "Password is required.")
                        : t("Formulaire prêt pour la vérification.", "Form ready for verification.")}
                </p>
                {loginDraftSaved && <p className="text-[11px] text-slate-500">{t("Brouillon de connexion sauvegardé sur cet appareil.", "Login draft saved on this device.")}</p>}
                {login.error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-950" role="alert" data-testid="partner-login-help">
                  <p className="font-black">{t("Connexion non aboutie — vérifiez vos identifiants ou contactez 3M.", "Sign-in was not completed — check your credentials or contact 3M.")}</p>
                  <p className="mt-1">{isAgencyPortal ? t("Pour une agence, l’accès doit d’abord être approuvé par notre équipe. Si votre organisation est déjà vérifiée, utilisez les identifiants remis par 3M.", "For an agency, access must first be approved by our team. If your organisation is already verified, use the credentials issued by 3M.") : t("Pour un employeur, l’accès doit d’abord être approuvé par notre équipe. Si votre organisation est déjà vérifiée, utilisez les identifiants remis par 3M.", "For an employer, access must first be approved by our team. If your organisation is already verified, use the credentials issued by 3M.")}</p>
                  <a href={isAgencyPortal ? "/agences-placement#inscription-agence" : "/employeurs?tab=register"} className="mt-2 inline-flex font-bold text-rose-900 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-700 focus-visible:ring-offset-2">{t("Demander ou vérifier un accès", "Request or verify access")}</a>
                </div>}
                {login.isPending && <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs font-bold text-blue-950" role="status" aria-live="polite" data-testid="partner-login-loading">
                  <RefreshCw className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                  {isAgencyPortal ? t("Vérification de l’accès agence en cours…", "Verifying agency access…") : t("Vérification de l’organisation en cours…", "Verifying organisation…")}
                </div>}
                <Button className="premium-action w-full text-white hover:text-white" disabled={login.isPending || !email || !password || (needsTwoFactor && !twoFactorCode)} onClick={() => login.mutate({ email, password, twoFactorCode: twoFactorCode || undefined })} aria-busy={login.isPending}>
                  {login.isPending ? <RefreshCw className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <LockKeyhole className="mr-2 h-4 w-4" aria-hidden="true" />}{login.isPending ? t("Vérification…", "Verifying…") : t("Se connecter", "Sign in")}
                </Button>
                <p className="text-xs leading-5 text-slate-500">{t("Pas encore d’accès ? Utilisez l’onglet Inscription pour identifier votre organisation.", "No access yet? Use the Register tab to identify your organisation.")}</p>
                <p className="text-xs leading-5 text-slate-500">{t("Ce portail ne présente que des profils anonymisés dont le partage a été autorisé. Aucun document personnel ni contact candidat n’est affiché.", "This portal displays only anonymised profiles whose sharing was authorised. No personal document or candidate contact is displayed.")}</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="premium-surface overflow-hidden border-blue-100">
              <CardContent className="p-5 sm:p-6">
                <B2bPartnerRegistrationForm
                  defaultOrganizationType={portalDefaults.organizationType}
                  onContinueToLogin={() => selectAuthTab("login")}
                />
                <p className="mt-4 text-center text-xs text-slate-500">
                  {t("Agence de placement ?", "Placement agency?")}{" "}
                  <a href="/agences-placement#inscription-agence" className="font-semibold text-indigo-700 underline-offset-2 hover:underline">{t("Formulaire dédié agences", "Dedicated agency form")}</a>
                </p>
              </CardContent>
            </Card>
          )}

          <section className="rounded-xl border border-white/25 bg-white/95 p-4 text-sm text-[#071b3d]">
            <p className="font-bold">{t("Indicateurs publics", "Public indicators")}</p>
            <p className="mt-1 text-slate-600">{t("Les volumes de profils vérifiés, taux de placement et délais moyens ne sont pas publiés tant qu’une série de données vérifiable, datée et méthodologiquement définie n’est pas disponible.", "Verified profile volumes, placement rates and average times are not published until a verifiable, dated and methodologically defined data series is available.")}</p>
          </section>
        </div>
      </main>
    );
  }

  return <main className="min-h-screen bg-slate-50 px-4 py-10" data-testid="partner-workspace"><div className="mx-auto max-w-5xl space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-950 p-5 text-white">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-indigo-200">
          {isAgencyPortal ? t("Agence de placement vérifiée", "Verified placement agency") : t("Organisation vérifiée", "Verified organisation")}
        </p>
        <h1 className="mt-1 text-2xl font-black">{organization?.name ?? (isAgencyPortal ? t("Espace agence", "Agency workspace") : t("Portail employeur", "Employer portal"))}</h1>
        <p className="mt-1 text-sm text-slate-300">{organization?.country ?? ""} · {t("Retours soumis à validation 3M", "Feedback subject to 3M review")}</p>
      </div>
      <Button variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white" onClick={() => { sessionStorage.removeItem(sessionKey); persistOrganization(null); setSessionToken(""); }}>
        <LogOut className="mr-2 h-4 w-4" />{t("Déconnexion", "Sign out")}
      </Button>
    </header>
    <section className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-950">
      <p className="flex items-center gap-2 font-bold"><ShieldCheck className="h-4 w-4" />{t("Règle de confidentialité", "Privacy rule")}</p>
      <p className="mt-1">{t("Les décisions enregistrées ici sont des retours de sélection. 3M les examine avant toute communication ou transmission de pièces au candidat.", "Decisions recorded here are selection feedback. 3M reviews them before any communication or document transfer to a candidate.")}</p>
    </section>
    <nav className="grid grid-cols-3 gap-1 rounded-2xl border border-slate-200 bg-white p-1" role="tablist" aria-label={t("Sections de l’espace partenaire", "Partner workspace sections")}>
      {([
        ["profiles", t("Profils", "Profiles"), BriefcaseBusiness],
        ["team", t("Équipe", "Team"), UserRoundCog],
        ["security", t("Sécurité", "Security"), LockKeyhole],
      ] as const).map(([id, label, Icon]) => (
        <button
          key={id}
          type="button"
          role="tab"
          data-testid={`partner-tab-${id}`}
          aria-selected={workspaceTab === id}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-black transition ${workspaceTab === id ? "bg-[#0f2460] text-white" : "text-slate-600 hover:bg-slate-50"}`}
          onClick={() => setWorkspaceTab(id)}
        >
          <Icon className="h-4 w-4" />{label}
        </button>
      ))}
    </nav>
    {workspaceTab === "security" && <section className="rounded-xl border border-slate-200 bg-white p-4" data-testid="partner-security-panel"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-bold text-slate-900">{t("Authentification à deux facteurs", "Two-factor authentication")}</p><p className="text-sm text-slate-600">{totpStatus.data?.enabled ? t("Protection 2FA active pour les nouvelles connexions.", "2FA protection is active for new sign-ins.") : t("Configurez une application d’authentification pour protéger les prochaines connexions.", "Set up an authenticator app to protect future sign-ins.")}</p></div>{!totpStatus.data?.enabled && !qrDataUrl && <Button variant="outline" onClick={() => beginTotp.mutate({ sessionToken })}>{t("Configurer 2FA", "Set up 2FA")}</Button>}</div>{qrDataUrl && <div className="mt-4 grid gap-3 sm:grid-cols-[220px_1fr]"><img src={qrDataUrl} alt={t("QR code de configuration 2FA", "2FA setup QR code")} className="h-[220px] w-[220px] border bg-white p-2" /><div className="space-y-3"><Input inputMode="numeric" autoComplete="one-time-code" value={twoFactorCode} onChange={event => setTwoFactorCode(event.target.value)} placeholder={t("Code à six chiffres", "Six-digit code")} maxLength={32} /><Button disabled={!twoFactorCode || confirmTotp.isPending} onClick={() => confirmTotp.mutate({ sessionToken, code: twoFactorCode })}>{t("Confirmer et générer les codes", "Confirm and generate codes")}</Button></div></div>}{recoveryCodes.length > 0 && <div className="mt-4 border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><p className="font-bold">{t("Codes de récupération — conservez-les hors ligne", "Recovery codes — store offline")}</p><p className="mt-1">{recoveryCodes.join(" · ")}</p></div>}</section>}
    {workspaceTab === "team" && <section className="grid gap-4 lg:grid-cols-2" data-testid="partner-team-panel">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3"><p className="flex items-center gap-2 font-bold text-slate-900"><Bell className="h-4 w-4 text-indigo-700" />{t("Notifications internes", "Internal notifications")} {unreadNotifications.length > 0 && <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-800">{unreadNotifications.length}</span>}</p>{unreadNotifications.length > 0 && <Button size="sm" variant="outline" disabled={markAllNotificationsRead.isPending} onClick={() => markAllNotificationsRead.mutate({ sessionToken })}>{t("Tout marquer comme lu", "Mark all as read")}</Button>}</div>
        <p className="mt-1 text-xs text-slate-500">{t("Les notifications sont privées à leur destinataire et ne contiennent pas de données candidates sensibles.", "Notifications are private to their recipient and contain no sensitive candidate data.")}</p>
        <div className="mt-3 space-y-2">{(notifications.data ?? []).slice(0, 5).map(notification => <div key={notification.id} className={`flex items-start justify-between gap-3 rounded-lg p-2 text-sm ${notification.readAt ? "bg-slate-50 text-slate-600" : "border border-indigo-200 bg-indigo-50 font-medium text-indigo-950"}`}><span>{notification.message}</span>{!notification.readAt && <Button size="sm" variant="ghost" onClick={() => markNotificationRead.mutate({ sessionToken, notificationId: notification.id })}>{t("Marquer comme lue", "Mark as read")}</Button>}</div>)}{(notifications.data ?? []).length === 0 && <p className="text-sm text-slate-500">{t("Aucune notification interne.", "No internal notifications.")}</p>}</div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><p className="flex items-center gap-2 font-bold text-slate-900"><UserRoundCog className="h-4 w-4 text-indigo-700" />{t("Collaborateurs", "Collaborators")}</p>{isManager && <Button size="sm" variant="outline" disabled={exportCollaborationActivity.isPending} onClick={() => exportCollaborationActivity.mutate({ sessionToken })}><Download className="mr-2 h-4 w-4" />{t("Exporter le journal", "Export activity")}</Button>}</div>
        <p className="mt-1 text-xs text-slate-500">{isManager ? t("Les gestionnaires peuvent administrer les rôles et accès. Une suspension révoque immédiatement la session sans supprimer le compte.", "Managers can administer roles and access. A suspension immediately revokes the session without deleting the account.") : t("Les lecteurs peuvent consulter les partages reçus, sans action de gestion ni accès aux notes privées.", "Readers can view received shares, without management actions or access to private notes.")}</p>
        <div className="mt-3 space-y-2">{(collaborators.data?.collaborators ?? []).map(collaborator => <div key={collaborator.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 p-2 text-sm"><span>{collaborator.fullName} <span className={collaborator.status === "active" ? "text-emerald-700" : "text-amber-700"}>· {collaborator.status === "active" ? t("Actif", "Active") : t("Suspendu", "Suspended")}</span></span><div className="flex items-center gap-2"><Select value={collaborator.collaborationRole} disabled={!isManager || collaborator.status !== "active" || setCollaboratorRole.isPending} onValueChange={value => setCollaboratorRole.mutate({ sessionToken, collaboratorId: collaborator.id, role: value as "reader" | "manager" })}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="reader">{t("Lecteur", "Reader")}</SelectItem><SelectItem value="manager">{t("Gestionnaire", "Manager")}</SelectItem></SelectContent></Select>{isManager && <Button size="sm" variant="outline" disabled={setCollaboratorAccess.isPending} onClick={() => setCollaboratorAccess.mutate({ sessionToken, collaboratorId: collaborator.id, active: collaborator.status !== "active" })}>{collaborator.status === "active" ? t("Suspendre", "Suspend") : t("Réactiver", "Reactivate")}</Button>}</div></div>)}</div>
      </div>
      {isManager && <>
      <div className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="flex items-center gap-2 font-bold text-slate-900"><ClipboardCheck className="h-4 w-4 text-indigo-700" />{t("Révision manuelle des accès suspendus", "Manual review of suspended access")}</p><p className="mt-1 text-xs text-slate-500">{t("Chaque décision est prise par un gestionnaire, enregistrée dans le journal, et ne supprime aucun compte.", "Each decision is made by a manager, recorded in the audit log, and never deletes an account.")}</p></div><span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900">{suspendedCollaborators.length} {t("à revoir", "to review")}</span></div>
        <div className="mt-3 space-y-2">{suspendedCollaborators.map(collaborator => <div key={collaborator.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3"><div><p className="font-medium text-amber-950">{collaborator.fullName}</p><p className="text-xs text-amber-900">{collaborator.collaborationRole === "manager" ? t("Gestionnaire suspendu", "Suspended manager") : t("Lecteur suspendu", "Suspended reader")}</p></div><Button size="sm" variant="outline" className="border-amber-300 bg-white" onClick={() => setReviewingCollaborator({ id: collaborator.id, fullName: collaborator.fullName })}>{t("Réviser l’accès", "Review access")}</Button></div>)}{suspendedCollaborators.length === 0 && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{t("Aucun accès suspendu ne nécessite de révision.", "No suspended access requires review.")}</p>}</div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-2">
        <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-bold text-slate-900">{t("Journal d’activité filtrable", "Filterable activity log")}</p><p className="mt-1 text-xs text-slate-500">{t("Les filtres restent limités à votre organisation et aux métadonnées de gouvernance : aucun document, contact ou note privée n’est affiché.", "Filters remain limited to your organisation and governance metadata: no document, contact, or private note is displayed.")}</p></div><Button size="sm" variant="outline" disabled={collaborationActivity.isFetching} onClick={() => collaborationActivity.refetch()}><RefreshCw className={`mr-2 h-4 w-4 ${collaborationActivity.isFetching ? "animate-spin" : ""}`} />{t("Actualiser", "Refresh")}</Button></div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2"><Select value={auditRange} onValueChange={value => setAuditRange(value as CollaborationAuditRange)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="7d">{t("7 derniers jours", "Last 7 days")}</SelectItem><SelectItem value="30d">{t("30 derniers jours", "Last 30 days")}</SelectItem><SelectItem value="all">{t("Tout l’historique", "All history")}</SelectItem></SelectContent></Select><Select value={auditAction} onValueChange={value => setAuditAction(value as CollaborationAuditAction)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{t("Toutes les actions", "All actions")}</SelectItem><SelectItem value="favorite_shared">{t("Favoris partagés", "Favourites shared")}</SelectItem><SelectItem value="favorite_share_revoked">{t("Partages révoqués", "Shares revoked")}</SelectItem><SelectItem value="collaborator_promoted">{t("Promotions gestionnaire", "Manager promotions")}</SelectItem><SelectItem value="collaborator_role_reader">{t("Rôles lecteur", "Reader roles")}</SelectItem><SelectItem value="collaborator_suspended">{t("Accès suspendus", "Access suspended")}</SelectItem><SelectItem value="collaborator_reactivated">{t("Accès réactivés", "Access reactivated")}</SelectItem><SelectItem value="collaborator_suspension_reviewed">{t("Suspensions revues", "Suspensions reviewed")}</SelectItem></SelectContent></Select><Select value={auditActor} onValueChange={setAuditActor}><SelectTrigger><SelectValue placeholder={t("Auteur", "Actor")} /></SelectTrigger><SelectContent><SelectItem value="all">{t("Tous les auteurs", "All actors")}</SelectItem>{(collaborators.data?.collaborators ?? []).map(collaborator => <SelectItem key={collaborator.id} value={String(collaborator.id)}>{collaborator.fullName}</SelectItem>)}</SelectContent></Select><Select value={auditTarget} onValueChange={setAuditTarget}><SelectTrigger><SelectValue placeholder={t("Cible", "Target")} /></SelectTrigger><SelectContent><SelectItem value="all">{t("Toutes les cibles", "All targets")}</SelectItem>{(collaborators.data?.collaborators ?? []).map(collaborator => <SelectItem key={collaborator.id} value={String(collaborator.id)}>{collaborator.fullName}</SelectItem>)}</SelectContent></Select></div>
        <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">{collaborationActivity.isLoading ? <p className="text-sm text-slate-500">{t("Chargement du journal…", "Loading activity log…")}</p> : collaborationActivity.error ? <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{t("Le journal ne peut pas être chargé pour le moment.", "The activity log cannot be loaded at this time.")}</p> : (collaborationActivity.data?.events ?? []).map(event => <div key={event.id} className="rounded-lg bg-slate-50 p-2 text-sm"><p className="font-medium text-slate-900">{collaborationActionLabel(event.action)}</p><p className="mt-1 text-xs text-slate-600">{event.actorName} {event.targetName ? `→ ${event.targetName}` : ""} · {new Date(event.createdAt).toLocaleString()}</p></div>)}{!collaborationActivity.isLoading && !collaborationActivity.error && (collaborationActivity.data?.events ?? []).length === 0 && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{t("Aucun événement ne correspond aux filtres sélectionnés.", "No event matches the selected filters.")}</p>}</div>
      </div>
      </>}
      <AlertDialog open={Boolean(reviewingCollaborator)} onOpenChange={open => { if (!open && !reviewSuspendedCollaborator.isPending) setReviewingCollaborator(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t("Confirmer la révision d’accès", "Confirm access review")}</AlertDialogTitle><AlertDialogDescription>{t(`Décidez manuellement du maintien ou de la réactivation de l’accès de ${reviewingCollaborator?.fullName ?? "ce collaborateur"}. La décision sera journalisée ; aucune donnée candidate ni note privée ne sera ajoutée.`, `Manually decide whether to keep or reactivate access for ${reviewingCollaborator?.fullName ?? "this collaborator"}. The decision will be logged; no candidate data or private note will be added.`)}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={reviewSuspendedCollaborator.isPending}>{t("Annuler", "Cancel")}</AlertDialogCancel><Button variant="outline" disabled={reviewSuspendedCollaborator.isPending} onClick={() => reviewingCollaborator && reviewSuspendedCollaborator.mutate({ sessionToken, collaboratorId: reviewingCollaborator.id, decision: "keep_suspended" })}>{t("Conserver la suspension", "Keep suspended")}</Button><AlertDialogAction disabled={reviewSuspendedCollaborator.isPending} onClick={event => { event.preventDefault(); if (reviewingCollaborator) reviewSuspendedCollaborator.mutate({ sessionToken, collaboratorId: reviewingCollaborator.id, decision: "reactivate" }); }}>{t("Réactiver l’accès", "Reactivate access")}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </section>}
    {workspaceTab === "profiles" && (profiles.isLoading ? <p className="py-10 text-center text-slate-500">{t("Chargement des profils autorisés…", "Loading authorised profiles…")}</p> : profiles.error ? <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800">{t("Votre session n’est plus valide. Reconnectez-vous.", "Your session is no longer valid. Please sign in again.")}</p> : <div className="space-y-4" data-testid="partner-profiles-panel">
      <section className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-6"><Select value={sector} onValueChange={setSector}><SelectTrigger><SelectValue placeholder={t("Métier / secteur", "Role / sector")} /></SelectTrigger><SelectContent><SelectItem value="all">{t("Tous les secteurs", "All sectors")}</SelectItem>{sectors.map(value => <SelectItem key={value} value={value!}>{value}</SelectItem>)}</SelectContent></Select><Select value={language} onValueChange={setLanguage}><SelectTrigger><SelectValue placeholder={t("Langue", "Language")} /></SelectTrigger><SelectContent><SelectItem value="all">{t("Toutes les langues", "All languages")}</SelectItem>{languages.map(value => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select><Select value={country} onValueChange={setCountry}><SelectTrigger><SelectValue placeholder={t("Pays cible", "Target country")} /></SelectTrigger><SelectContent><SelectItem value="all">{t("Tous les pays cibles", "All target countries")}</SelectItem>{countries.map(value => <SelectItem key={value} value={value!}>{value}</SelectItem>)}</SelectContent></Select><Select value={availability} onValueChange={setAvailability}><SelectTrigger><SelectValue placeholder={t("Disponibilité", "Availability")} /></SelectTrigger><SelectContent><SelectItem value="all">{t("Toutes disponibilités", "All availability")}</SelectItem><SelectItem value="submitted">{t("Disponible pour examen", "Available for review")}</SelectItem></SelectContent></Select><Button variant={favoritesOnly ? "default" : "outline"} onClick={() => setFavoritesOnly(value => !value)}><Star className="mr-2 h-4 w-4" />{t("Favoris", "Favourites")}</Button><Button variant="outline" disabled={exportFavorites.isPending} onClick={() => exportFavorites.mutate({ sessionToken })}><Download className="mr-2 h-4 w-4" />{t("Exporter favoris", "Export favourites")}</Button></section>
      <p className="text-sm text-slate-600">{filteredProfiles.length} {t("profil(s) autorisé(s) selon les filtres sélectionnés.", "authorised profile(s) matching the selected filters.")}</p>
      <div className="grid gap-4 md:grid-cols-2">{filteredProfiles.map(row => <Card key={row.submissionId} className="border-slate-200"><CardHeader><div className="flex items-center justify-between gap-2"><CardTitle className="flex items-center gap-2 text-base"><BriefcaseBusiness className="h-4 w-4 text-indigo-700" />{row.profile.code}</CardTitle><Button size="icon" variant="ghost" aria-label={row.isFavorite ? t("Retirer des favoris", "Remove from favourites") : t("Ajouter aux favoris", "Add to favourites")} onClick={() => favorite.mutate({ sessionToken, submissionId: row.submissionId })}><Star className={`h-4 w-4 ${row.isFavorite ? "fill-amber-400 text-amber-500" : "text-slate-500"}`} /></Button></div><CardDescription>{row.profile.targetDestination} · {row.profile.targetProcedure}</CardDescription></CardHeader><CardContent className="space-y-3"><p className="text-sm leading-6 text-slate-700">{row.profile.summary}</p><div className="grid grid-cols-2 gap-2 text-xs"><span className="rounded bg-slate-100 p-2">{t("Secteur", "Sector")} : {row.profile.sector || t("Non précisé", "Not specified")}</span><span className="rounded bg-slate-100 p-2">{t("Expérience", "Experience")} : {row.profile.yearsExperience || t("Non précisée", "Not specified")}</span><span className="col-span-2 rounded bg-slate-100 p-2">{t("Langues", "Languages")} : {row.profile.languagesSummary || t("Non précisées", "Not specified")}</span></div>
        {row.sharedWithMe && <p className="rounded bg-indigo-50 p-2 text-xs text-indigo-800">{t(`Partagé par ${row.sharedWithMe.sharedByName}`, `Shared by ${row.sharedWithMe.sharedByName}`)}</p>}
        {row.isFavorite && <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3"><Textarea value={favoriteNotes[row.submissionId] ?? row.privateNote ?? ""} onChange={event => setFavoriteNotes({ ...favoriteNotes, [row.submissionId]: event.target.value })} placeholder={t("Note privée de votre organisation", "Private note for your organisation")} maxLength={2000} /><Button size="sm" variant="outline" disabled={saveFavoriteNote.isPending} onClick={() => saveFavoriteNote.mutate({ sessionToken, submissionId: row.submissionId, note: favoriteNotes[row.submissionId] ?? row.privateNote ?? "" })}>{t("Enregistrer la note privée", "Save private note")}</Button>{isManager && <div className="grid gap-2 sm:grid-cols-[1fr_auto]"><Select value={shareRecipient[row.submissionId] ?? "none"} onValueChange={value => setShareRecipient({ ...shareRecipient, [row.submissionId]: value })}><SelectTrigger><SelectValue placeholder={t("Partager avec un collaborateur", "Share with a collaborator")} /></SelectTrigger><SelectContent><SelectItem value="none">{t("Choisir un collaborateur", "Choose a collaborator")}</SelectItem>{(collaborators.data?.collaborators ?? []).map(collaborator => <SelectItem key={collaborator.id} value={String(collaborator.id)}>{collaborator.fullName}</SelectItem>)}</SelectContent></Select><Button size="sm" variant="outline" disabled={shareFavorite.isPending || !shareRecipient[row.submissionId] || shareRecipient[row.submissionId] === "none"} onClick={() => shareFavorite.mutate({ sessionToken, submissionId: row.submissionId, recipientEmployerAccountId: Number(shareRecipient[row.submissionId]) })}><Share2 className="mr-2 h-4 w-4" />{t("Partager", "Share")}</Button></div>}{row.outgoingShares.map(share => <div key={share.shareId} className="flex items-center justify-between rounded bg-white px-2 py-1 text-xs text-slate-700"><span>{t(`Partagé avec ${share.recipientName}`, `Shared with ${share.recipientName}`)}</span>{isManager && <Button size="sm" variant="ghost" onClick={() => revokeShare.mutate({ sessionToken, shareId: share.shareId })}><X className="mr-1 h-3 w-3" />{t("Révoquer", "Revoke")}</Button>}</div>)}</div>}
        <Select value={decisions[row.submissionId] ?? row.status} onValueChange={value => setDecisions({ ...decisions, [row.submissionId]: value as Decision })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="under_review">{t("En revue", "Under review")}</SelectItem><SelectItem value="shortlisted">{t("Présélectionné", "Shortlisted")}</SelectItem><SelectItem value="selected">{t("Sélectionné", "Selected")}</SelectItem><SelectItem value="not_selected">{t("Non retenu", "Not selected")}</SelectItem><SelectItem value="documents_requested">{t("Pièces à demander", "Documents requested")}</SelectItem></SelectContent></Select><Textarea value={notes[row.submissionId] ?? ""} onChange={event => setNotes({ ...notes, [row.submissionId]: event.target.value })} placeholder={t("Commentaire pour l’équipe 3M (facultatif)", "Comment for the 3M team (optional)")} maxLength={2000} /><Button className="w-full bg-indigo-700 hover:bg-indigo-800" disabled={decision.isPending} onClick={() => decision.mutate({ sessionToken, submissionId: row.submissionId, decision: decisions[row.submissionId] ?? "under_review", note: notes[row.submissionId] || undefined })}>{t("Enregistrer le retour", "Save feedback")}</Button></CardContent></Card>)}{filteredProfiles.length === 0 && <p className="col-span-2 rounded-xl border border-dashed border-slate-300 p-6 text-center text-slate-600">{t("Aucun profil autorisé ne correspond aux filtres sélectionnés. Les profils apparaissent après vérification et partage par 3M.", "No authorised profile matches the selected filters. Profiles appear after 3M verification and sharing.")}</p>}</div>
    </div>)}</div></main>;
}
