import { useEffect, useMemo, useState } from "react";
import { Building2, CheckCircle2, IdCard, LockKeyhole, Send } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { CORRIDOR_ROUTES } from "@shared/talentCorridor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export type PartnerOrganizationType = "placement_partner" | "employer";

type Props = {
  defaultOrganizationType?: PartnerOrganizationType;
  lockOrganizationType?: boolean;
  compact?: boolean;
  /** Appelé seulement quand l’utilisateur choisit d’aller vers la connexion après succès. */
  onContinueToLogin?: () => void;
};

const draftKey = "3m-placement-partner-request-draft";

const emptyForm = (organizationType: PartnerOrganizationType) => ({
  organizationType,
  legalName: "",
  registrationNumber: "",
  country: "",
  city: "",
  website: "",
  contactFullName: "",
  contactEmail: "",
  contactPhone: "",
  contactRole: "",
  sectors: "",
  targetMarkets: "",
  message: "",
  acknowledgeReview: false,
  acknowledgeCharter: false,
});

type FormState = ReturnType<typeof emptyForm>;

function readDraft(organizationType: PartnerOrganizationType): FormState {
  const base = emptyForm(organizationType);
  try {
    const raw = JSON.parse(localStorage.getItem(draftKey) || "null") as Partial<FormState> | null;
    if (!raw || typeof raw !== "object") return base;
    return {
      ...base,
      ...raw,
      organizationType: organizationType,
      acknowledgeReview: false,
      acknowledgeCharter: false,
    };
  } catch {
    return base;
  }
}

export function B2bPartnerRegistrationForm({
  defaultOrganizationType = "employer",
  lockOrganizationType = false,
  compact = false,
  onContinueToLogin,
}: Props) {
  const { t } = useLanguage();
  const [form, setForm] = useState(() => readDraft(defaultOrganizationType));
  const [submittedId, setSubmittedId] = useState<number | null>(null);
  const requiresLicence = form.organizationType === "placement_partner";
  const filledCount = useMemo(
    () => [
      form.legalName,
      form.registrationNumber,
      form.country,
      form.contactFullName,
      form.contactEmail,
      form.contactPhone,
      form.contactRole,
      form.message,
    ].filter((value) => value.trim()).length,
    [form],
  );
  const hasErrors = useMemo(() => (
    form.legalName.trim().length < 2
    || form.country.trim().length < 2
    || form.contactFullName.trim().length < 2
    || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)
    || form.contactPhone.trim().length < 6
    || form.contactRole.trim().length < 2
    || form.message.trim().length < 20
    || (requiresLicence && form.registrationNumber.trim().length < 2)
    || !form.acknowledgeReview
    || !form.acknowledgeCharter
  ), [form, requiresLicence]);
  useEffect(() => {
    const { acknowledgeReview: _ack, acknowledgeCharter: _charter, ...draft } = form;
    localStorage.setItem(draftKey, JSON.stringify(draft));
  }, [form]);
  const requestAccess = trpc.placementPortal.requestPartnerAccess.useMutation({
    onSuccess: (result) => {
      setSubmittedId(result.requestId || 1);
      setForm(emptyForm(defaultOrganizationType));
      localStorage.removeItem(draftKey);
      toast.success(t("Demande d’accès enregistrée", "Access request recorded"), { description: result.message });
    },
    onError: (error) => toast.error(t("Inscription non enregistrée", "Registration not saved"), { description: error.message }),
  });

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (requiresLicence && form.registrationNumber.trim().length < 2) {
      toast.error(t("Licence requise", "Licence required"), {
        description: t(
          "Indiquez le numéro d’enregistrement ou de licence de placement pour permettre la vérification légale.",
          "Provide the registration or placement-licence number so we can verify legal standing.",
        ),
      });
      return;
    }
    if (!form.acknowledgeReview) {
      toast.error(t("Confirmation requise", "Confirmation required"), {
        description: t("Confirmez que les informations d’identification sont exactes.", "Confirm that the identification details are accurate."),
      });
      return;
    }
    if (!form.acknowledgeCharter) {
      toast.error(t("Charte partenaire requise", "Partner charter required"), {
        description: t(
          "Acceptez la charte : aucune facturation au candidat et confidentialité des profils.",
          "Accept the charter: no billing of candidates and confidentiality of profiles.",
        ),
      });
      return;
    }
    requestAccess.mutate({
      organizationType: form.organizationType,
      legalName: form.legalName,
      registrationNumber: form.registrationNumber.trim() || undefined,
      country: form.country,
      city: form.city || undefined,
      website: form.website || undefined,
      contactFullName: form.contactFullName,
      contactEmail: form.contactEmail,
      contactPhone: form.contactPhone,
      contactRole: form.contactRole,
      sectors: form.sectors || undefined,
      targetMarkets: form.targetMarkets || undefined,
      message: form.message,
      acknowledgeCharter: true,
    });
  };

  if (submittedId) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 text-emerald-950" role="status" data-testid="b2b-registration-success">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
          <div>
            <p className="font-black">{t("Identification reçue — examen en cours", "Identification received — under review")}</p>
            <p className="mt-1 text-sm leading-6 text-emerald-900">
              {t(
                "Votre organisation sera vérifiée manuellement par 3M TRAVEL AGENCY. Les identifiants de connexion sont remis uniquement après validation, par un canal approuvé. Aucun profil candidat n’est visible avant cette étape.",
                "Your organisation will be manually verified by 3M TRAVEL AGENCY. Sign-in credentials are issued only after validation, via an approved channel. No candidate profile is visible before that step.",
              )}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {onContinueToLogin && (
                <Button type="button" className="bg-indigo-700 text-white hover:bg-indigo-800" onClick={onContinueToLogin}>
                  <LockKeyhole className="mr-2 h-4 w-4" />
                  {t("Aller à la connexion", "Go to sign in")}
                </Button>
              )}
              <Button type="button" variant="outline" className="border-emerald-300 bg-white" onClick={() => setSubmittedId(null)}>
                {t("Envoyer une autre demande", "Submit another request")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const organizationTypeLabel = form.organizationType === "placement_partner"
    ? t("Agence de placement", "Placement agency")
    : t("Employeur international", "International employer");

  return (
    <form onSubmit={submit} className="space-y-5" aria-labelledby="b2b-registration-title" data-testid="b2b-registration-form">
      <div>
        <h2 id="b2b-registration-title" className="flex items-center gap-2 text-xl font-black text-[#071b3d]">
          <IdCard className="h-5 w-5 text-indigo-700" />
          {t("Identification à l’inscription", "Registration identification")}
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          {t(
            "Renseignez l’identité légale de votre organisation et le contact responsable. L’accès au portail n’est créé qu’après vérification humaine.",
            "Provide your organisation’s legal identity and the responsible contact. Portal access is created only after human verification.",
          )}
        </p>
        <p className="mt-2 text-xs font-semibold text-indigo-900" data-testid="b2b-access-terms">
          {t(
            "Accès sans frais d’inscription · vérification manuelle sous quelques jours ouvrés (confirmée par écrit).",
            "No registration fee · manual verification within a few business days (confirmed in writing).",
          )}
        </p>
      </div>

      <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-3" aria-live="polite">
        <div className="flex items-center justify-between gap-3 text-xs font-bold text-indigo-950">
          <span>{t("Préparation de la demande", "Request preparation")}</span>
          <span>{filledCount}/8 {t("champs renseignés", "fields completed")}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-indigo-100">
          <div className="h-full rounded-full bg-indigo-700 transition-[width] duration-200" style={{ width: `${(filledCount / 8) * 100}%` }} />
        </div>
        <p className="mt-2 text-[11px] font-medium text-indigo-900/80">{t("Brouillon sauvegardé automatiquement sur cet appareil (sans mot de passe).", "Draft saved automatically on this device (no password).")}</p>
      </div>

      <fieldset className="space-y-3">
        <legend className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-700">
          <Building2 className="h-4 w-4 text-indigo-700" />
          {t("Organisation", "Organisation")}
        </legend>
        <div className={`grid gap-3 ${compact ? "" : "md:grid-cols-2"}`}>
          {lockOrganizationType ? (
            <div className="text-sm font-semibold text-slate-800" data-testid="b2b-organization-type-locked">
              {t("Type d’organisation", "Organisation type")}
              <p className="mt-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-900">
                {organizationTypeLabel}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500">
                {form.organizationType === "placement_partner"
                  ? t(
                      "Formulaire dédié aux agences. Les employeurs utilisent le portail employeurs.",
                      "Form dedicated to agencies. Employers use the employer portal.",
                    )
                  : t(
                      "Formulaire dédié aux employeurs. Les agences utilisent le portail agences de placement.",
                      "Form dedicated to employers. Agencies use the placement-agency portal.",
                    )}
                {" "}
                <a
                  href={form.organizationType === "placement_partner" ? CORRIDOR_ROUTES.employersRegister : CORRIDOR_ROUTES.agenciesRegister}
                  className="font-semibold text-indigo-700 underline-offset-2 hover:underline"
                >
                  {form.organizationType === "placement_partner"
                    ? t("Aller au portail employeurs", "Go to employer portal")
                    : t("Aller au portail agences", "Go to agency portal")}
                </a>
              </p>
            </div>
          ) : (
            <label className="text-sm font-semibold text-slate-800">
              {t("Type d’organisation", "Organisation type")}
              <Select
                value={form.organizationType}
                onValueChange={(value) => update("organizationType", value as PartnerOrganizationType)}
              >
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="placement_partner">{t("Agence de placement", "Placement agency")}</SelectItem>
                  <SelectItem value="employer">{t("Employeur international", "International employer")}</SelectItem>
                </SelectContent>
              </Select>
            </label>
          )}
          <label className="text-sm font-semibold text-slate-800">
            {t("Raison sociale", "Legal name")} *
            <Input required maxLength={255} value={form.legalName} onChange={(event) => update("legalName", event.target.value)} className="mt-1" autoComplete="organization" />
          </label>
          <label className="text-sm font-semibold text-slate-800">
            {t("N° d’enregistrement / licence", "Registration / licence no.")}{requiresLicence ? " *" : ""}
            <Input
              required={requiresLicence}
              maxLength={120}
              value={form.registrationNumber}
              onChange={(event) => update("registrationNumber", event.target.value)}
              className="mt-1"
              placeholder="RCCM, licence…"
              aria-required={requiresLicence}
              data-testid="b2b-registration-number"
            />
            {requiresLicence && (
              <span className="mt-1 block text-xs font-medium text-slate-500">
                {t(
                  "Obligatoire pour vérifier l’existence légale et le droit d’exercer le placement.",
                  "Required to verify legal existence and the right to operate as a placement agency.",
                )}
              </span>
            )}
          </label>
          <label className="text-sm font-semibold text-slate-800">
            {t("Pays d’activité", "Country of activity")} *
            <Input required maxLength={120} value={form.country} onChange={(event) => update("country", event.target.value)} className="mt-1" autoComplete="country-name" />
          </label>
          <label className="text-sm font-semibold text-slate-800">
            {t("Ville", "City")}
            <Input maxLength={120} value={form.city} onChange={(event) => update("city", event.target.value)} className="mt-1" autoComplete="address-level2" />
          </label>
          <label className="text-sm font-semibold text-slate-800">
            {t("Site web", "Website")}
            <Input maxLength={320} value={form.website} onChange={(event) => update("website", event.target.value)} className="mt-1" placeholder="https://" autoComplete="url" />
          </label>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-black uppercase tracking-wide text-slate-700">{t("Contact responsable", "Responsible contact")}</legend>
        <div className={`grid gap-3 ${compact ? "" : "md:grid-cols-2"}`}>
          <label className="text-sm font-semibold text-slate-800">
            {t("Nom complet", "Full name")} *
            <Input required maxLength={255} value={form.contactFullName} onChange={(event) => update("contactFullName", event.target.value)} className="mt-1" autoComplete="name" />
          </label>
          <label className="text-sm font-semibold text-slate-800">
            {t("Fonction", "Role")} *
            <Input required maxLength={160} value={form.contactRole} onChange={(event) => update("contactRole", event.target.value)} className="mt-1" placeholder={t("Directeur RH, responsable placement…", "HR director, placement lead…")} autoComplete="organization-title" />
          </label>
          <label className="text-sm font-semibold text-slate-800">
            {t("E-mail professionnel", "Business email")} *
            <Input required type="email" maxLength={320} value={form.contactEmail} onChange={(event) => update("contactEmail", event.target.value)} className="mt-1" autoComplete="email" />
          </label>
          <label className="text-sm font-semibold text-slate-800">
            {t("Téléphone professionnel", "Business phone")} *
            <Input required type="tel" maxLength={64} value={form.contactPhone} onChange={(event) => update("contactPhone", event.target.value)} className="mt-1" autoComplete="tel" />
          </label>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-black uppercase tracking-wide text-slate-700">{t("Besoin de recrutement", "Recruitment need")}</legend>
        <div className={`grid gap-3 ${compact ? "" : "md:grid-cols-2"}`}>
          <label className="text-sm font-semibold text-slate-800">
            {t("Secteurs / métiers ciblés", "Target sectors / roles")}
            <Input maxLength={255} value={form.sectors} onChange={(event) => update("sectors", event.target.value)} className="mt-1" placeholder={t("Santé, BTP, hôtellerie…", "Healthcare, construction, hospitality…")} />
          </label>
          <label className="text-sm font-semibold text-slate-800">
            {t("Marchés / pays de placement", "Placement markets / countries")}
            <Input maxLength={255} value={form.targetMarkets} onChange={(event) => update("targetMarkets", event.target.value)} className="mt-1" placeholder={t("Canada, UE, Golfe…", "Canada, EU, Gulf…")} />
          </label>
          <label className={`text-sm font-semibold text-slate-800 ${compact ? "" : "md:col-span-2"}`}>
            {t("Présentation et besoins", "Introduction and needs")} *
            <Textarea
              required
              minLength={20}
              maxLength={3000}
              value={form.message}
              onChange={(event) => update("message", event.target.value)}
              className="mt-1 min-h-28"
              placeholder={t(
                "Décrivez votre activité, les volumes envisagés et le cadre réglementaire applicable.",
                "Describe your activity, expected volumes and the applicable regulatory framework.",
              )}
            />
          </label>
        </div>
      </fieldset>

      <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
        <input
          type="checkbox"
          className="mt-1"
          checked={form.acknowledgeReview}
          onChange={(event) => update("acknowledgeReview", event.target.checked)}
        />
        <span>
          {t(
            "Je confirme que les informations d’identification sont exactes et j’accepte que l’accès soit créé uniquement après vérification manuelle par 3M TRAVEL AGENCY. Aucun mot de passe n’est choisi à cette étape.",
            "I confirm that the identification details are accurate and accept that access is created only after manual verification by 3M TRAVEL AGENCY. No password is chosen at this step.",
          )}
        </span>
      </label>

      <label className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-sm text-slate-800" data-testid="b2b-partner-charter">
        <input
          type="checkbox"
          className="mt-1"
          checked={form.acknowledgeCharter}
          onChange={(event) => update("acknowledgeCharter", event.target.checked)}
        />
        <span>
          {t(
            "J’accepte la charte partenaire : aucune facturation au candidat pour l’accès au vivier 3M, confidentialité des profils anonymisés, et aucune promesse de visa ou d’emploi faite au nom de 3M TRAVEL AGENCY.",
            "I accept the partner charter: no billing of candidates for access to the 3M pool, confidentiality of anonymised profiles, and no visa or job promise made in the name of 3M TRAVEL AGENCY.",
          )}
        </span>
      </label>

      <Button type="submit" disabled={requestAccess.isPending || hasErrors} className="min-h-11 w-full bg-indigo-700 text-white hover:bg-indigo-800">
        <Send className="mr-2 h-4 w-4" />
        {requestAccess.isPending ? t("Enregistrement…", "Saving…") : t("Soumettre mon identification", "Submit my identification")}
      </Button>
    </form>
  );
}
