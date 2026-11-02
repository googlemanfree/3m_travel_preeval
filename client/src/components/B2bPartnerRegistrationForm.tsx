import { useEffect, useMemo, useRef, useState } from "react";
import { Building2, CheckCircle2, FileUp, IdCard, Loader2, LockKeyhole, Send } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { CORRIDOR_ROUTES } from "@shared/talentCorridor";
import { AUTHORIZATION_DOCUMENT_MAX_BYTES, PARTNER_CATEGORIES, PARTNER_CATEGORY_LABELS, defaultCategoryForOrganizationType, isIntermediaryCategory, organizationTypeForCategory, type PartnerCategory } from "@shared/partnerModule";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { PrivacyNotice } from "@/components/PrivacyNotice";

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
  partnerCategory: defaultCategoryForOrganizationType(organizationType) as PartnerCategory,
  mandateCompany: "",
  mandateConfidential: false,
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
      // Une catégorie enregistrée dans un ancien brouillon n'est reprise que si elle correspond au type d'organisation demandé.
      partnerCategory: raw.partnerCategory && PARTNER_CATEGORIES.includes(raw.partnerCategory) && organizationTypeForCategory(raw.partnerCategory) === organizationType ? raw.partnerCategory : base.partnerCategory,
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
  const [validationMessage, setValidationMessage] = useState("");
  const [draftStatus, setDraftStatus] = useState<"idle" | "saving" | "saved">("idle");
  const skipNextDraftSave = useRef(false);
  const [authorizationFile, setAuthorizationFile] = useState<File | null>(null);
  const pendingAuthorizationFile = useRef<File | null>(null);
  const requiresLicence = form.organizationType === "placement_partner";
  const isIntermediary = isIntermediaryCategory(form.partnerCategory);
  const allowedCategories = lockOrganizationType ? PARTNER_CATEGORIES.filter((category) => organizationTypeForCategory(category) === defaultOrganizationType) : PARTNER_CATEGORIES;
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
    || (isIntermediary && !form.mandateCompany.trim() && !form.mandateConfidential)
    || !form.acknowledgeReview
    || !form.acknowledgeCharter
  ), [form, requiresLicence, isIntermediary]);
  useEffect(() => {
    if (skipNextDraftSave.current) {
      skipNextDraftSave.current = false;
      return;
    }
    const { acknowledgeReview: _ack, acknowledgeCharter: _charter, ...draft } = form;
    setDraftStatus("saving");
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify({ savedAt: Date.now(), ...draft }));
        setDraftStatus("saved");
      } catch {
        setDraftStatus("idle");
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [form]);
  const uploadAuthorization = trpc.partnerModule.uploadAuthorizationDocument.useMutation();
  const attachAuthorization = async (requestId: number, uploadToken: string, file: File) => {
    try {
      const buffer = new Uint8Array(await file.arrayBuffer());
      let binary = "";
      for (let index = 0; index < buffer.length; index += 0x8000) binary += String.fromCharCode.apply(null, Array.from(buffer.subarray(index, index + 0x8000)));
      await uploadAuthorization.mutateAsync({ requestId, uploadToken, fileName: file.name, fileBase64: btoa(binary) });
      toast.success(t("Justificatif joint à votre demande", "Supporting document attached to your request"));
    } catch (error) {
      toast.warning(t("Justificatif non joint", "Document not attached"), {
        description: error instanceof Error ? error.message : t("Envoyez-le par e-mail à 3M TRAVEL AGENCY.", "Please email it to 3M TRAVEL AGENCY."),
      });
    }
  };
  const requestAccess = trpc.placementPortal.requestPartnerAccess.useMutation({
    onSuccess: (result) => {
      const file = pendingAuthorizationFile.current;
      pendingAuthorizationFile.current = null;
      if (file && result.requestId && result.uploadToken) void attachAuthorization(result.requestId, result.uploadToken, file);
      setAuthorizationFile(null);
      setSubmittedId(result.requestId || 1);
      skipNextDraftSave.current = true;
      setForm(emptyForm(defaultOrganizationType));
      setValidationMessage("");
      localStorage.removeItem(draftKey);
      toast.success(t("Demande d’accès enregistrée", "Access request recorded"), { description: result.message });
    },
    onError: (error) => {
      setValidationMessage(error.message);
      toast.error(t("Inscription non enregistrée", "Registration not saved"), { description: error.message });
    },
  });

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setValidationMessage("");
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (requiresLicence && form.registrationNumber.trim().length < 2) {
      setValidationMessage(t("Indiquez le numéro d’enregistrement ou de licence requis.", "Enter the required registration or licence number."));
      toast.error(t("Licence requise", "Licence required"), {
        description: t(
          "Indiquez le numéro d’enregistrement ou de licence de placement pour permettre la vérification légale.",
          "Provide the registration or placement-licence number so we can verify legal standing.",
        ),
      });
      return;
    }
    if (!form.acknowledgeReview) {
      setValidationMessage(t("Confirmez l’exactitude des informations d’identification.", "Confirm that the identification details are accurate."));
      toast.error(t("Confirmation requise", "Confirmation required"), {
        description: t("Confirmez que les informations d’identification sont exactes.", "Confirm that the identification details are accurate."),
      });
      return;
    }
    if (!form.acknowledgeCharter) {
      setValidationMessage(t("Acceptez la charte partenaire avant l’envoi.", "Accept the partner charter before submitting."));
      toast.error(t("Charte partenaire requise", "Partner charter required"), {
        description: t(
          "Acceptez la charte : aucune facturation au candidat et confidentialité des profils.",
          "Accept the charter: no billing of candidates and confidentiality of profiles.",
        ),
      });
      return;
    }
    if (hasErrors) {
      setValidationMessage(t("Vérifiez les champs obligatoires et le format de l’e-mail avant l’envoi.", "Check the required fields and email format before submitting."));
      return;
    }
    setValidationMessage("");
    pendingAuthorizationFile.current = authorizationFile;
    requestAccess.mutate({
      partnerCategory: form.partnerCategory,
      mandateCompany: form.mandateCompany.trim() || undefined,
      mandateConfidential: isIntermediary ? form.mandateConfidential : undefined,
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
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 text-emerald-950" role="status" aria-live="polite" aria-atomic="true" data-testid="b2b-registration-success">
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
    <form onSubmit={submit} noValidate className="space-y-5" aria-labelledby="b2b-registration-title" data-testid="b2b-registration-form">
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

      <PrivacyNotice notice="partner_registration" />

      <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-3" aria-live="polite">
        <div className="flex items-center justify-between gap-3 text-xs font-bold text-indigo-950">
          <span>{t("Préparation de la demande", "Request preparation")}</span>
          <span>{filledCount}/8 {t("champs renseignés", "fields completed")}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-indigo-100">
          <div className="h-full rounded-full bg-indigo-700 transition-[width] duration-200" style={{ width: `${(filledCount / 8) * 100}%` }} />
        </div>
        <p className="mt-2 text-[11px] font-medium text-indigo-900/80" role="status" aria-live="polite" data-testid="b2b-draft-status">
          {draftStatus === "saving"
            ? t("Sauvegarde du brouillon…", "Saving draft…")
            : draftStatus === "saved"
              ? t("Brouillon sauvegardé automatiquement sur cet appareil (sans mot de passe).", "Draft saved automatically on this device (no password).")
              : t("Brouillon local prêt à être sauvegardé.", "Local draft ready to be saved.")}
        </p>
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
                value={form.partnerCategory}
                onValueChange={(value) => { update("partnerCategory", value as PartnerCategory); update("organizationType", organizationTypeForCategory(value as PartnerCategory)); }}
              >
                <SelectTrigger className="mt-1" data-testid="b2b-category-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {allowedCategories.map((category) => <SelectItem key={category} value={category}>{t(PARTNER_CATEGORY_LABELS[category].fr, PARTNER_CATEGORY_LABELS[category].en)}</SelectItem>)}
                </SelectContent>
              </Select>
              <span className="mt-1 block text-xs font-medium text-slate-500">{t(PARTNER_CATEGORY_LABELS[form.partnerCategory].hintFr, PARTNER_CATEGORY_LABELS[form.partnerCategory].hintEn)}</span>
            </label>
          )}
          {lockOrganizationType && allowedCategories.length > 1 && (
            <label className="text-sm font-semibold text-slate-800">
              {t("Votre activité", "Your activity")}
              <Select value={form.partnerCategory} onValueChange={(value) => update("partnerCategory", value as PartnerCategory)}>
                <SelectTrigger className="mt-1" data-testid="b2b-category-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {allowedCategories.map((category) => <SelectItem key={category} value={category}>{t(PARTNER_CATEGORY_LABELS[category].fr, PARTNER_CATEGORY_LABELS[category].en)}</SelectItem>)}
                </SelectContent>
              </Select>
              <span className="mt-1 block text-xs font-medium text-slate-500">{t(PARTNER_CATEGORY_LABELS[form.partnerCategory].hintFr, PARTNER_CATEGORY_LABELS[form.partnerCategory].hintEn)}</span>
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

      {isIntermediary && (
        <fieldset className="space-y-3" data-testid="b2b-mandate-fieldset">
          <legend className="text-sm font-black uppercase tracking-wide text-slate-700">{t("Mandat et entreprises bénéficiaires", "Mandate and beneficiary companies")}</legend>
          <label className="block text-sm font-semibold text-slate-800">
            {t("Entreprise bénéficiaire ou mandat", "Beneficiary company or mandate")}{form.mandateConfidential ? "" : " *"}
            <Input maxLength={255} value={form.mandateCompany} onChange={(event) => update("mandateCompany", event.target.value)} className="mt-1" placeholder={t("Nom de l’entreprise pour laquelle vous recrutez, ou référence du mandat", "Name of the company you recruit for, or mandate reference")} data-testid="b2b-mandate-company" />
          </label>
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.mandateConfidential} onChange={(event) => update("mandateConfidential", event.target.checked)} className="mt-1 h-4 w-4" data-testid="b2b-mandate-confidential" />
            <span>{t("Ces informations sont confidentielles : je les communiquerai directement à 3M TRAVEL AGENCY. Elles ne seront visibles que de l’administration.", "This information is confidential: I will share it directly with 3M TRAVEL AGENCY. It will only be visible to the administration.")}</span>
          </label>
          <label className="block text-sm font-semibold text-slate-800">
            <span className="flex items-center gap-2"><FileUp className="h-4 w-4 text-indigo-700" aria-hidden="true" />{t("Justificatif d’autorisation (licence, agrément, mandat)", "Authorisation document (licence, approval, mandate)")}</span>
            <input type="file" accept="application/pdf,image/jpeg,image/png" onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              if (file && file.size > AUTHORIZATION_DOCUMENT_MAX_BYTES) {
                setValidationMessage(t("Le justificatif doit peser moins de 5 Mo.", "The document must be under 5 MB."));
                event.target.value = "";
                setAuthorizationFile(null);
                return;
              }
              setValidationMessage("");
              setAuthorizationFile(file);
            }} className="mt-1 block w-full text-sm" data-testid="b2b-authorization-file" />
            <span className="mt-1 block text-xs font-medium text-slate-500">{t("PDF, JPEG ou PNG, 5 Mo au plus. Le fichier est stocké de façon privée et lu uniquement par l’administration.", "PDF, JPEG or PNG, up to 5 MB. The file is stored privately and read only by the administration.")}</span>
          </label>
        </fieldset>
      )}

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
        {typeof window !== "undefined" && new URLSearchParams(window.location.search).get("intent") === "need" && (
          <p className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-950" data-testid="b2b-need-intent">{t("Vous souhaitez transmettre un besoin : décrivez-le ci-dessous (postes, pays, volumes). Une fois votre organisation vérifiée, vous pourrez déposer et suivre vos besoins depuis votre espace.", "You want to submit a need: describe it below (roles, countries, volumes). Once your organisation is verified, you can submit and follow your needs from your workspace.")}</p>
        )}
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

      {validationMessage && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-semibold leading-5 text-rose-900" role="alert" aria-live="assertive" data-testid="b2b-registration-validation">
          {validationMessage}
        </p>
      )}

      <Button type="submit" disabled={requestAccess.isPending} aria-busy={requestAccess.isPending} className="min-h-11 w-full bg-indigo-700 text-white hover:bg-indigo-800">
        {requestAccess.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Send className="mr-2 h-4 w-4" aria-hidden="true" />}
        {requestAccess.isPending ? t("Enregistrement…", "Saving…") : t("Soumettre mon identification", "Submit my identification")}
      </Button>
    </form>
  );
}
