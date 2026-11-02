import { Button } from "@/components/ui/button";
import { OFFICIAL_CONSULAR_PORTALS } from "@/data/officialConsularPortals";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getEvaluationDocumentRequirements } from "@/data/evaluationDocumentCatalogue";
import { trpc } from "@/lib/trpc";
import { describeFormError } from "@/lib/formErrors";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import { useLocation } from "wouter";
import { useCandidateAuth } from "@/hooks/useCandidateAuth";
import { CheckCircle2, ChevronLeft, ChevronRight, ClipboardList, FileText, LoaderCircle, MailCheck, MessageCircleMore, Pencil, ShieldCheck, Sparkles, UploadCloud } from "lucide-react";
import { CountrySelect } from "@/components/CountryPicker";
import { DynamicFormSections } from "@/components/DynamicFormSections";
import { DynamicProjectChoice } from "@/components/DynamicProjectChoice";
import { useFormOverrides } from "@/hooks/useFormOverrides";
import { resolveDynamicForm, visibleSections } from "@shared/dynamicForm";
import { getCandidateDestinationOption } from "@shared/candidateDestinationOptions";
import { DOCUMENT_VAULT_POLICY } from "@shared/documentVaultPolicy";
import {
  STUDY_CYCLE_LABELS,
  STUDY_CYCLE_OPTIONS,
  VISITOR_STATUS_LABELS,
  VISITOR_STATUS_OPTIONS,
  multiProjectEvaluationGap,
  normalizePublicEvaluationProject,
  type StudyCycle,
  type VisitorStatus,
} from "@shared/evaluationFormRequirements";

/** Analytics anonymes (gtag) — pas de données personnelles. */
function trackEvent(eventName: string, params?: Record<string, unknown>) {
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag === "function") gtag("event", eventName, params);
}

type ProjectType = "travail" | "etudes" | "tourisme";

type EvaluationDocumentType =
  | "passport"
  | "cv"
  | "diploma"
  | "certificate"
  | "bank_statement"
  | "language_test"
  | "educational_transcript"
  | "other";

type FormData = {
  fullName: string;
  email: string;
  whatsappPhone: string;
  age?: number;
  nationality: string;
  destinationCountry: string;
  projectType: ProjectType;
  sector?: string;
  yearsOfExperience?: number;
  educationLevel?: string;
  studyCycle?: StudyCycle | "";
  diplomaLevel?: string;
  languages?: string;
  financialGuarantee?: string;
  visitReason?: string;
  visitorStatus?: VisitorStatus | "";
  travelHistory?: string;
  socialTies?: string;
  transcriptAvailable?: boolean;
  cvLink?: string;
  canadaLanguageTest?: string;
  canadaStudyPlan?: string;
  luxEmployerStatus?: "aucun" | "candidatures" | "contact" | "offre";
  luxAademStatus?: string;
  franceProjectStatus?: string;
  belgiumRegion?: string;
  germanyLanguageLevel?: string;
  germanyRecognitionStatus?: string;
  geminiAnalysisConsent?: boolean;
};

type DynamicResponse = { question: string; answer: string };

type CountryOption = { value: string; label: string; flag: string; hint: string };

const STEPS = [
  { label: "Projet", description: "Pays et objectif — commencez ici" },
  { label: "Profil", description: "Vos coordonnées de contact" },
  { label: "Critères", description: "Questions ciblées" },
  { label: "Documents", description: "Pièces à préparer" },
  { label: "Récapitulatif", description: "Vérifiez avant envoi" },
];


const COUNTRIES_BY_PROJECT: Record<ProjectType, CountryOption[]> = {
  travail: [
    { value: "Canada", label: "Canada", flag: "🇨🇦", hint: "Permis de travail et mobilité qualifiée" },
    { value: "Luxembourg", label: "Luxembourg", flag: "🇱🇺", hint: "Emploi et autorisation de travail" },
    { value: "France", label: "France", flag: "🇫🇷", hint: "Mobilité professionnelle" },
    { value: "Belgique", label: "Belgique", flag: "🇧🇪", hint: "Travail et séjour professionnel" },
    { value: "Allemagne", label: "Allemagne", flag: "🇩🇪", hint: "Emploi qualifié" },
    { value: "Autre pays", label: "Autre pays", flag: "🌍", hint: "Qualification humaine" },
  ],
  etudes: [
    { value: "Canada", label: "Canada", flag: "🇨🇦", hint: "Admission et permis d’études" },
    { value: "France", label: "France", flag: "🇫🇷", hint: "Études supérieures" },
    { value: "Belgique", label: "Belgique", flag: "🇧🇪", hint: "Admission et séjour étudiant" },
    { value: "Allemagne", label: "Allemagne", flag: "🇩🇪", hint: "Études et ressources" },
    { value: "Luxembourg", label: "Luxembourg", flag: "🇱🇺", hint: "Admission et séjour" },
    { value: "Autre pays", label: "Autre pays", flag: "🌍", hint: "Qualification humaine" },
  ],
  tourisme: [
    { value: "Canada", label: "Canada", flag: "🇨🇦", hint: "Visite, famille ou tourisme" },
    { value: "France", label: "France", flag: "🇫🇷", hint: "Court séjour Schengen" },
    { value: "Belgique", label: "Belgique", flag: "🇧🇪", hint: "Court séjour Schengen" },
    { value: "Allemagne", label: "Allemagne", flag: "🇩🇪", hint: "Court séjour Schengen" },
    { value: "Royaume-Uni", label: "Royaume-Uni", flag: "🇬🇧", hint: "Visitor visa" },
    { value: "Autre pays", label: "Autre pays", flag: "🌍", hint: "Qualification humaine" },
  ],
};

const COUNTRY_GUIDANCE: Record<string, string> = {
  Canada: "Les exigences varient selon le programme : langue, niveau d’études, expérience, admission ou situation professionnelle peuvent être examinés.",
  Luxembourg: "Les éléments liés à l’employeur, aux qualifications et aux autorisations applicables doivent être vérifiés par un conseiller.",
  France: "Le type de séjour, l’admission ou l’employeur et les ressources à justifier dépendent de votre situation.",
  Belgique: "La région, l’établissement ou l’employeur peuvent modifier la procédure et les pièces attendues.",
  Allemagne: "Le métier, la qualification, la langue et l’existence d’un employeur sont examinés séparément.",
  "Royaume-Uni": "La procédure est distincte de Schengen et doit être confirmée sur la source officielle correspondante.",
  "Autre pays": "Un conseiller qualifiera votre objectif et vous orientera vers les sources officielles pertinentes.",
};

const OFFICIAL_SOURCE_KEY_BY_COUNTRY: Record<string, keyof typeof OFFICIAL_CONSULAR_PORTALS> = {
  Canada: "canada",
  France: "france",
  Belgique: "belgique",
  Allemagne: "allemagne",
  Luxembourg: "luxembourg",
  "Royaume-Uni": "royaume-uni",
};

export function categoryForCountry(country: string): "schengen" | "canada" | "autre" {
  if (country === "Canada") return "canada";
  if (["France", "Belgique", "Allemagne", "Luxembourg"].includes(country)) return "schengen";
  return "autre";
}

export function visaTypeFor(project: ProjectType, country: string): string {
  if (country === "Canada") return project === "travail" ? "canada_travail" : project === "etudes" ? "canada_etude" : "canada_tourisme";
  if (categoryForCountry(country) === "schengen") return `schengen_${project === "etudes" ? "etude" : project}`;
  return "autre";
}

export function SimpleMultiProjectForm() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, candidate } = useCandidateAuth();
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  const rawProjectParam = searchParams.get("project");
  const projectParam = normalizePublicEvaluationProject(rawProjectParam);
  const destinationParam = searchParams.get("destination") || "";
  const canonicalDestinationParam = destinationParam ? (getCandidateDestinationOption(destinationParam)?.name ?? destinationParam) : "";
  const isPostRegistrationOnboarding = searchParams.get("onboarding") === "evaluation";
  const initialProject = projectParam ?? "travail";
  const [currentStep, setCurrentStep] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState<{ done: number; total: number } | null>(null);
  const [isSuccessVisible, setIsSuccessVisible] = React.useState(false);
  const [contactTouched, setContactTouched] = React.useState({ email: false, whatsappPhone: false });
  const [formData, setFormData] = React.useState<FormData>({ fullName: "", email: "", whatsappPhone: "", nationality: "", destinationCountry: canonicalDestinationParam, projectType: initialProject, studyCycle: "", visitorStatus: "", transcriptAvailable: false, geminiAnalysisConsent: false });
  const [selectedDocuments, setSelectedDocuments] = React.useState<Array<{ file: File; documentType: EvaluationDocumentType }>>([]);
  const [selectedDocumentType, setSelectedDocumentType] = React.useState<EvaluationDocumentType>(initialProject === "travail" ? "cv" : initialProject === "etudes" ? "diploma" : "other");
  const [uploadedDocumentCount, setUploadedDocumentCount] = React.useState(0);
  const [submittedDossierCode, setSubmittedDossierCode] = React.useState<string | null>(null);
  const [submittedReviewDeadline, setSubmittedReviewDeadline] = React.useState<string | null>(null);
  const [hasTrackedStart, setHasTrackedStart] = React.useState(false);
  const [orientationPreview, setOrientationPreview] = React.useState<null | { summary: string; strengths: string[]; gapsToClarify: string[]; documentPriorities: string[]; advisorQuestions: string[]; alternatives: Array<{ country: string; rationale: string; checks: string[] }>; disclaimer: string }>(null);
  const [dynamicResponses, setDynamicResponses] = React.useState<DynamicResponse[]>([]);
  // Visa ou programme, domaine et réponses propres au parcours : le formulaire se recompose à chaque choix, sans jamais effacer une réponse.
  const [programId, setProgramId] = React.useState("");
  const [domainId, setDomainId] = React.useState("");
  const [programAnswers, setProgramAnswers] = React.useState<Record<string, string>>({});
  const formOverrides = useFormOverrides();
  const dynamicForm = React.useMemo(() => resolveDynamicForm({ country: formData.destinationCountry, projectType: formData.projectType, programId, domainId, overrides: formOverrides }), [formData.destinationCountry, formData.projectType, programId, domainId, formOverrides]);
  // Les questions de profil (études, expérience, langues) et celles déjà posées par les critères ci-dessous ne sont pas répétées.
  const PUBLIC_COVERED_KEYS = React.useMemo(() => new Set(["studyLevel", "programName", "fundingPlan", "targetJob", "relevantExperience", "visitorStatus", "returnTies", "travelHistory", "stayPurpose"]), []);
  const programSections = React.useMemo(() => visibleSections(dynamicForm, programAnswers)
    .filter((section) => section.id !== "education" && section.id !== "experience" && section.id !== "languages" && (section.id !== "program" || Boolean(programId)))
    .map((section) => ({ ...section, fields: section.fields.filter((field) => !PUBLIC_COVERED_KEYS.has(field.key)) }))
    .filter((section) => section.fields.length > 0), [dynamicForm, programAnswers, programId, PUBLIC_COVERED_KEYS]);
  const visibleProgramAnswers = () => Object.fromEntries(programSections.flatMap((section) => section.fields).filter((field) => (programAnswers[field.key] ?? "").trim()).map((field) => [field.key, programAnswers[field.key].trim()]));

  const isEmailValid = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  const isWhatsappValid = (value: string) => { const digits = value.replace(/\D/g, ""); return digits.length >= 8 && digits.length <= 15; };
  const emailError = contactTouched.email && formData.email.length > 0 && !isEmailValid(formData.email);
  const whatsappError = contactTouched.whatsappPhone && formData.whatsappPhone.length > 0 && !isWhatsappValid(formData.whatsappPhone);
  const requirements = formData.destinationCountry ? getEvaluationDocumentRequirements(formData.destinationCountry, formData.projectType) : [];
  const officialSourceKey = formData.destinationCountry ? OFFICIAL_SOURCE_KEY_BY_COUNTRY[formData.destinationCountry] : undefined;
  const officialPortal = officialSourceKey ? OFFICIAL_CONSULAR_PORTALS[officialSourceKey] : undefined;
  const progress = Math.round(((currentStep + 1) / STEPS.length) * 100);

  const markEvaluationStarted = React.useCallback(() => {
    if (hasTrackedStart) return;
    trackEvent("evaluation_started", {
      project_type: formData.projectType,
      destination: formData.destinationCountry || "unset",
      event_category: "public_evaluation",
    });
    setHasTrackedStart(true);
  }, [formData.destinationCountry, formData.projectType, hasTrackedStart]);

  React.useEffect(() => {
    if (projectParam) setFormData((prev) => ({ ...prev, projectType: projectParam }));
    if (canonicalDestinationParam) setFormData((prev) => ({ ...prev, destinationCountry: canonicalDestinationParam }));
  }, [canonicalDestinationParam, projectParam]);

  React.useEffect(() => {
    if (!isPostRegistrationOnboarding || !candidate) return;
    setFormData((previous) => ({
      ...previous,
      fullName: previous.fullName || candidate.fullName,
      email: previous.email || candidate.email,
    }));
  }, [candidate?.email, candidate?.fullName, isPostRegistrationOnboarding]);

  const submitEvaluation = trpc.evaluation.submitEvaluation.useMutation({ onError: (error: { message?: string }) => toast.error("Votre évaluation n’a pas été envoyée", { description: describeFormError(error) }) });
  const uploadSupportingDocument = trpc.evaluation.uploadSupportingDocument.useMutation();
  const previewGeminiOrientation = trpc.evaluation.geminiOrientationPreview.useMutation({ onSuccess: (data) => {
    setOrientationPreview(data);
    setDynamicResponses((previous) => data.advisorQuestions.map((question) => ({ question, answer: previous.find((response) => response.question === question)?.answer ?? "" })));
  }, onError: (error: { message?: string }) => toast.error(error.message || "Les questions personnalisées sont indisponibles. Vous pouvez poursuivre avec le questionnaire standard.") });

  const update = (name: keyof FormData, value: string) => {
    markEvaluationStarted();
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const onTextChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => update(event.target.name as keyof FormData, event.target.value);

  const requirementSnapshot = () => {
    const hasCvDocument = selectedDocuments.some((item) => item.documentType === "cv");
    const hasDiplomaDocument = selectedDocuments.some((item) => item.documentType === "diploma");
    const hasTranscriptDocument = selectedDocuments.some((item) => item.documentType === "educational_transcript");
    return {
      projectType: formData.projectType,
      sector: formData.sector,
      yearsOfExperience: formData.yearsOfExperience === undefined || formData.yearsOfExperience === null || String(formData.yearsOfExperience) === ""
        ? null
        : Number(formData.yearsOfExperience),
      languages: formData.languages,
      educationLevel: formData.educationLevel,
      studyCycle: formData.studyCycle,
      diplomaLevel: formData.diplomaLevel || formData.educationLevel,
      financialGuarantee: formData.financialGuarantee,
      visitReason: formData.visitReason,
      visitorStatus: formData.visitorStatus,
      cvLink: formData.cvLink,
      hasCvDocument,
      hasDiplomaDocument,
      hasTranscriptDocument,
      transcriptAvailable: Boolean(formData.transcriptAvailable) || hasTranscriptDocument,
      cvAvailable: hasCvDocument || Boolean(formData.cvLink?.trim()),
    };
  };

  const validateStep = (step: number) => {
    // Étape 0 = Projet (conversion) : destination d’abord, contact ensuite.
    if (step === 0 && !formData.destinationCountry) {
      toast.error("Sélectionnez le pays de destination afin d’afficher la checklist adaptée.");
      return false;
    }
    if (step === 1) {
      setContactTouched({ email: true, whatsappPhone: true });
      if (!formData.fullName || !formData.email || !formData.whatsappPhone || !formData.nationality || !isEmailValid(formData.email) || !isWhatsappValid(formData.whatsappPhone)) {
        toast.error("Complétez vos coordonnées avec un e-mail et un WhatsApp valides.");
        return false;
      }
    }
    if (step === 2) {
      const gap = multiProjectEvaluationGap(requirementSnapshot(), "criteria");
      if (gap) {
        toast.error(gap);
        return false;
      }
      const missingProgramFields = programId ? programSections.flatMap((section) => section.fields).filter((field) => field.required && !(programAnswers[field.key] ?? "").trim()) : [];
      if (missingProgramFields.length) {
        toast.error(`Complétez les questions de votre parcours : ${missingProgramFields.map((field) => field.label).join(", ")}.`);
        return false;
      }
    }
    if (step === 3) {
      const gap = multiProjectEvaluationGap(requirementSnapshot(), "documents");
      if (gap) {
        toast.error(gap);
        return false;
      }
    }
    return true;
  };

  const next = () => {
    markEvaluationStarted();
    if (validateStep(currentStep)) setCurrentStep((step) => Math.min(step + 1, STEPS.length - 1));
  };
  const previous = () => setCurrentStep((step) => Math.max(step - 1, 0));

  const addDocuments = (files: FileList | null) => {
    if (!files) return;
    markEvaluationStarted();
    const accepted = Array.from(files).filter((file) => ["application/pdf", "image/jpeg", "image/png"].includes(file.type) && file.size <= 10 * 1024 * 1024).slice(0, Math.max(0, 5 - selectedDocuments.length));
    if (accepted.length !== files.length) toast.message("Seuls 5 fichiers PDF, JPG ou PNG de 10 Mo maximum peuvent être ajoutés.");
    setSelectedDocuments((previous) => [...previous, ...accepted.map((file) => ({ file, documentType: selectedDocumentType }))]);
  };
  const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("Lecture du fichier impossible")); reader.readAsDataURL(file); });

  const formatReviewDeadline = (value: unknown): string | null => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(String(value));
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateStep(0) || !validateStep(1) || !validateStep(2) || !validateStep(3)) return;
    setIsSubmitting(true);
    try {
      const requirementsPayload = requirementSnapshot();
      const created = await submitEvaluation.mutateAsync({
        ...formData,
        studyCycle: formData.studyCycle || undefined,
        visitorStatus: formData.visitorStatus || undefined,
        age: formData.age ? Number(formData.age) : undefined,
        yearsOfExperience: requirementsPayload.yearsOfExperience ?? undefined,
        destinationCategory: categoryForCountry(formData.destinationCountry),
        dynamicResponses: dynamicResponses.filter((response) => response.answer.trim()).slice(0, 12),
        programId: programId || undefined,
        domainId: dynamicForm.domain?.id,
        projectAnswers: visibleProgramAnswers(),
        cvAvailable: requirementsPayload.cvAvailable,
        hasCvDocument: requirementsPayload.hasCvDocument,
        hasDiplomaDocument: requirementsPayload.hasDiplomaDocument,
        hasTranscriptDocument: requirementsPayload.hasTranscriptDocument,
        transcriptAvailable: requirementsPayload.transcriptAvailable,
        diplomaLevel: requirementsPayload.diplomaLevel || undefined,
      });
      let uploaded = 0;
      const failedDocuments: string[] = [];
      for (const item of selectedDocuments) {
        setUploadProgress({ done: uploaded + failedDocuments.length, total: selectedDocuments.length });
        try {
        await uploadSupportingDocument.mutateAsync({ evaluationId: created.evaluationId, email: formData.email, uploadToken: created.documentUploadToken, documentType: item.documentType, fileName: item.file.name, mimeType: item.file.type as "application/pdf" | "image/jpeg" | "image/png", sizeBytes: item.file.size, fileBase64: await readFileAsDataUrl(item.file) });
        uploaded += 1;
        } catch (uploadError) {
          // L'évaluation est déjà enregistrée : un document refusé ne doit ni la bloquer ni passer inaperçu.
          failedDocuments.push(item.file.name);
          toast.warning(`Document non envoyé : ${item.file.name}`, { description: describeFormError(uploadError) });
        }
      }
      setUploadProgress(null);
      if (failedDocuments.length > 0) toast.info("Votre évaluation est bien enregistrée. Vous pourrez ajouter les documents manquants depuis votre espace ou en répondant à notre e-mail.");
      setUploadedDocumentCount(uploaded);
      setSubmittedDossierCode(typeof created.dossierCode === "string" && created.dossierCode.trim() ? created.dossierCode.trim() : null);
      setSubmittedReviewDeadline(formatReviewDeadline(created.reviewDeadline));
      trackEvent("evaluation_completed", {
        project_type: formData.projectType,
        destination: formData.destinationCountry || "unset",
        has_documents: uploaded > 0,
        event_category: "public_evaluation",
      });
      toast.success("Évaluation soumise avec succès. Vérifiez votre e-mail.");
      setIsSuccessVisible(true);
    } finally { setIsSubmitting(false); setUploadProgress(null); }
  };

  const requestOrientationPreview = () => {
    if (!formData.geminiAnalysisConsent) { toast.message("Confirmez votre accord avant de demander des questions adaptées."); return; }
    previewGeminiOrientation.mutate({ destinationCountry: formData.destinationCountry, projectType: formData.projectType, nationality: formData.nationality, age: formData.age ? Number(formData.age) : undefined, sector: formData.sector, yearsOfExperience: formData.yearsOfExperience ? Number(formData.yearsOfExperience) : undefined, educationLevel: formData.educationLevel, languages: formData.languages, financialGuarantee: formData.financialGuarantee, countryDetails: { canadaLanguageTest: formData.canadaLanguageTest || "", canadaStudyPlan: formData.canadaStudyPlan || "", luxEmployerStatus: formData.luxEmployerStatus || "", luxAademStatus: formData.luxAademStatus || "", franceProjectStatus: formData.franceProjectStatus || "", belgiumRegion: formData.belgiumRegion || "", germanyLanguageLevel: formData.germanyLanguageLevel || "", germanyRecognitionStatus: formData.germanyRecognitionStatus || "", ...Object.fromEntries(dynamicResponses.flatMap((response, index) => [[`question_complementaire_${index + 1}`, response.question], [`reponse_complementaire_${index + 1}`, response.answer]])) }, consent: true });
  };

  const summary = `Bonjour 3M TRAVEL AGENCY, voici mon projet :\n- Nom : ${formData.fullName || "Non renseigné"}\n- Destination : ${formData.destinationCountry || "Non renseignée"}\n- Projet : ${formData.projectType}\n- Secteur / filière : ${formData.sector || "Non renseigné"}`;
  const evaluationReturnPath = `/?project=${formData.projectType || initialProject}#evaluation-multi`;

  return (
    <motion.div className="w-full max-w-2xl mx-auto" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
      <Card className="premium-form-surface border border-slate-100 bg-white p-5 shadow-xl sm:p-8">
        <div className="mb-7">
          <div className="flex items-end justify-between gap-3"><div><h2 className="premium-section-title text-2xl">Évaluation guidée</h2><p className="premium-copy mt-1 text-sm">Sans compte pour démarrer — projet, destination, nationalité et contact. Le compte sert ensuite au suivi et aux documents confidentiels.</p></div><span className="text-sm font-bold text-blue-800">{progress}%</span></div>
          <p
            className="mt-3 rounded-xl border border-blue-100 bg-blue-50/80 px-3 py-2 text-xs leading-5 text-blue-950"
            data-testid="evaluation-indicative-sla"
            role="status"
          >
            <strong>Délai indicatif :</strong> un conseiller répond sous environ <strong>24 heures ouvrées</strong> après soumission
            (jours ouvrés Yaoundé, lun–ven hors jours fériés). Il s’agit d’un <strong>accusé ou d’une première réponse humaine</strong> — pas d’une décision de visa.
            Canal principal : e-mail ; WhatsApp Yaoundé si besoin.
          </p>
          {!isAuthenticated && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950" role="status" data-testid="evaluation-guest-start">
              <strong>Accessible sans compte.</strong> Remplissez ce premier formulaire court. Créez un compte seulement si vous souhaitez enregistrer le dossier, suivre le statut ou déposer des pièces sensibles.
            </div>
          )}
          {isPostRegistrationOnboarding && <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-950" role="status"><strong>Votre compte est activé.</strong> Complétez maintenant cette évaluation préparatoire ; elle organise les informations utiles, mais ne remplace pas un formulaire consulaire officiel ni une décision.</div>}
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Progression de l’évaluation" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
            <motion.div className="h-full rounded-full bg-gradient-to-r from-[#0B2A52] via-blue-700 to-[#D8A928]" initial={false} animate={{ width: `${progress}%` }} transition={{ duration: 0.32, ease: "easeOut" }} />
          </div>
          <ol className="mt-4 grid grid-cols-5 gap-1" aria-label="Étapes de l’évaluation">
            {STEPS.map((step, index) => <li key={step.label} className="text-center"><span className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${index < currentStep ? "bg-emerald-700 text-white" : index === currentStep ? "bg-[#0B2A52] text-white ring-4 ring-blue-100" : "bg-slate-100 text-slate-500"}`}>{index < currentStep ? <CheckCircle2 className="h-4 w-4" /> : index + 1}</span><span className="mt-1 block text-[10px] font-bold text-slate-600 sm:text-xs">{step.label}</span></li>)}
          </ol>
        </div>

        {isSuccessVisible ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center" role="status" aria-live="polite" data-testid="evaluation-submit-success">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" aria-hidden="true" />
            <h3 className="mt-3 text-xl font-black text-emerald-950">Votre évaluation a été transmise</h3>
            {submittedDossierCode ? (
              <p className="mt-3 inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2 font-mono text-sm font-bold text-emerald-950">
                Réf. {submittedDossierCode}
              </p>
            ) : null}
            <p className="mt-3 text-sm leading-6 text-emerald-900">
              Un conseiller examine vos éléments. {uploadedDocumentCount > 0 ? `${uploadedDocumentCount} pièce(s) ont été ajoutée(s) pour vérification. ` : ""}
              Vérifiez votre e-mail : un accusé de réception confirme l’enregistrement.
            </p>
            <div
              className="mx-auto mt-5 max-w-md rounded-2xl border border-emerald-300 bg-white p-4 text-left"
              data-testid="evaluation-next-steps"
            >
              <h4 className="text-sm font-black text-emerald-950">Prochaine étape</h4>
              <dl className="mt-3 space-y-3 text-sm text-emerald-950">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-emerald-700">Délai de réponse attendu</dt>
                  <dd className="mt-1 leading-6">
                    {submittedReviewDeadline
                      ? <>Réponse d’un conseiller sous environ 24 h ouvrées (cible interne : avant le {submittedReviewDeadline}).</>
                      : <>Réponse d’un conseiller sous environ 24 heures ouvrées.</>}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-emerald-700">Mode de contact</dt>
                  <dd className="mt-1 leading-6">
                    Principalement par <strong>e-mail</strong> (accusé puis avis). WhatsApp reste disponible pour une question urgente au conseiller.
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-emerald-700">Où retrouver le suivi</dt>
                  <dd className="mt-1 leading-6">
                    {isAuthenticated
                      ? <>Dans <strong>Mon espace</strong> (vue d’ensemble), avec la référence ci-dessus.</>
                      : <>Après création de compte, dans <strong>Mon espace</strong> — la référence ci-dessus permet de rattacher la demande.</>}
                  </dd>
                </div>
              </dl>
            </div>
            <ol className="mx-auto mt-4 max-w-md space-y-2 text-left text-sm text-emerald-950">
              <li className="flex gap-2"><span className="font-black text-emerald-700">1.</span><span>{isAuthenticated ? <>Ouvrez <strong>Mon espace</strong> pour suivre le statut d’examen.</> : <>Créez un compte pour enregistrer le dossier et suivre le statut dans <strong>Mon espace</strong>.</>}</span></li>
              <li className="flex gap-2"><span className="font-black text-emerald-700">2.</span><span>Répondez aux notifications ou demandes de complément si elles apparaissent.</span></li>
              <li className="flex gap-2"><span className="font-black text-emerald-700">3.</span><span>Cette pré-évaluation ne constitue pas une décision de visa, d’admission ou d’emploi.</span></li>
            </ol>
            <div className="mt-5 flex flex-col items-stretch justify-center gap-2 sm:flex-row sm:items-center">
              {isAuthenticated ? (
                <Button
                  type="button"
                  className="bg-[#0B2A52] text-white hover:bg-[#163d73]"
                  onClick={() => setLocation("/mon-espace?section=overview")}
                >
                  Suivre ma demande dans Mon espace
                </Button>
              ) : (
                <Button
                  type="button"
                  className="bg-[#0B2A52] text-white hover:bg-[#163d73]"
                  data-testid="evaluation-create-account-after-submit"
                  onClick={() => setLocation(`/register?from=${encodeURIComponent(evaluationReturnPath)}`)}
                >
                  Créer un compte pour suivre mon dossier
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                className="border-emerald-300 bg-white text-emerald-900 hover:bg-emerald-100"
                onClick={() => window.open(`https://wa.me/237698104832?text=${encodeURIComponent(`Bonjour 3M TRAVEL AGENCY, mon évaluation ${submittedDossierCode || ""} vient d’être transmise.`.trim())}`, "_blank")}
              >
                <MessageCircleMore className="mr-2 h-4 w-4" />WhatsApp conseiller
              </Button>
            </div>
            <Button
              type="button"
              variant="ghost"
              className="mt-3 text-emerald-900 hover:bg-emerald-100"
              onClick={() => {
                setIsSuccessVisible(false);
                setSubmittedDossierCode(null);
                setSubmittedReviewDeadline(null);
                setCurrentStep(0);
                setSelectedDocuments([]);
                setUploadedDocumentCount(0);
              }}
            >
              Envoyer une autre évaluation
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <AnimatePresence mode="wait" initial={false}>
              <motion.section key={currentStep} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.2, ease: "easeOut" }} aria-labelledby={`evaluation-step-${currentStep}`}>
                <h3 id={`evaluation-step-${currentStep}`} className="mb-1 text-lg font-black text-slate-950">{STEPS[currentStep].label}</h3><p className="mb-5 text-sm text-slate-600">{STEPS[currentStep].description}</p>
                {currentStep === 0 && <div className="space-y-5">
                  <Field label="Type de projet *"><Select value={formData.projectType} onValueChange={(value) => {
                    const next = value as ProjectType;
                    setFormData((prev) => ({ ...prev, projectType: next, destinationCountry: "", studyCycle: "", visitorStatus: "", sector: "", yearsOfExperience: undefined, educationLevel: "", languages: "", visitReason: "", diplomaLevel: "", transcriptAvailable: false }));
                    setProgramId("");
                    setSelectedDocumentType(next === "travail" ? "cv" : next === "etudes" ? "diploma" : "other");
                    setSelectedDocuments([]);
                  }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="travail">Travail / professionnel</SelectItem><SelectItem value="etudes">Études</SelectItem><SelectItem value="tourisme">Tourisme / visite</SelectItem></SelectContent></Select></Field>
                  {formData.projectType === "travail" && <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-700" data-testid="eval-hint-travail">Évaluation <strong>visa travail</strong> : profil professionnel complet + <strong>CV actualisé obligatoire</strong>.</p>}
                  {formData.projectType === "etudes" && <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-700" data-testid="eval-hint-etudes">Évaluation <strong>visa études</strong> : historique scolaire, <strong>diplômes</strong>, <strong>relevés de notes</strong> et <strong>cycle visé</strong> obligatoires.</p>}
                  {formData.projectType === "tourisme" && <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-700" data-testid="eval-hint-tourisme">Évaluation <strong>visa visiteurs</strong> : formulaire simple — statut (chef d’entreprise, employé ou particulier) + motif du séjour.</p>}
                  <Field label="Pays de destination *"><CountrySelect id="home-evaluation-destination" ariaLabel="Pays de destination" placeholder="Sélectionner un pays" value={formData.destinationCountry === "Autre pays" ? "" : formData.destinationCountry} priority={COUNTRIES_BY_PROJECT[formData.projectType].filter((country) => country.value !== "Autre pays").map((country) => country.value)} onChange={(country) => update("destinationCountry", country)} /></Field>
                  {formData.destinationCountry && <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-950"><strong>Repère pour {formData.destinationCountry} :</strong> {COUNTRY_GUIDANCE[formData.destinationCountry] ?? COUNTRY_GUIDANCE["Autre pays"]}</div>}
                  {officialPortal && <a href={officialPortal.url} target="_blank" rel="noreferrer" className="inline-flex rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-bold text-blue-900 underline underline-offset-2 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">Consulter le portail institutionnel : {officialPortal.label} ↗</a>}
                  {formData.destinationCountry && <DynamicProjectChoice form={dynamicForm} projectKind={formData.projectType} programId={programId} domainId={domainId} showKind={false} onKind={() => undefined} onProgram={setProgramId} onDomain={setDomainId} />}
                  <p className="text-sm leading-6 text-slate-600">Ensuite : vos coordonnées, puis les critères et documents utiles — sans engagement de résultat.</p>
                </div>}
                {currentStep === 1 && <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Nom complet *"><Input name="fullName" value={formData.fullName} onChange={onTextChange} placeholder="Jean Dupont" maxLength={255} /></Field>
                  <Field label="Nationalité *"><Input name="nationality" value={formData.nationality} onChange={onTextChange} placeholder="Camerounaise" maxLength={100} /></Field>
                  <Field label="E-mail *" hint={emailError ? "Saisissez une adresse e-mail valide." : undefined}><Input name="email" type="email" value={formData.email} onChange={onTextChange} onBlur={() => setContactTouched((prev) => ({ ...prev, email: true }))} aria-invalid={emailError} className={emailError ? "border-red-500" : ""} placeholder="nom@domaine.com" maxLength={320} /></Field>
                  <Field label="WhatsApp *" hint={whatsappError ? "Saisissez entre 8 et 15 chiffres." : undefined}><Input name="whatsappPhone" value={formData.whatsappPhone} onChange={onTextChange} onBlur={() => setContactTouched((prev) => ({ ...prev, whatsappPhone: true }))} aria-invalid={whatsappError} className={whatsappError ? "border-red-500" : ""} placeholder="+237 6XX XXX XXX" maxLength={50} /></Field>
                  <Field label="Âge"><Input name="age" type="number" min="16" max="100" value={formData.age || ""} onChange={onTextChange} placeholder="Ex. 28" /></Field>
                </div>}
                {currentStep === 2 && <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {formData.projectType === "travail" && <><Field label="Secteur ou métier visé *"><Input name="sector" value={formData.sector || ""} onChange={onTextChange} placeholder="Ex. logistique, soins, informatique" maxLength={150} data-testid="eval-travail-sector" /></Field><Field label="Années d’expérience *"><Input name="yearsOfExperience" type="number" min="0" value={formData.yearsOfExperience ?? ""} onChange={onTextChange} placeholder="Ex. 5 (0 si débutant)" data-testid="eval-travail-experience" /></Field><Field label="Niveaux de langue *" full><Input name="languages" value={formData.languages || ""} onChange={onTextChange} placeholder="Français, anglais, test déjà passé…" maxLength={255} data-testid="eval-travail-languages" /></Field><p className="md:col-span-2 text-xs leading-5 text-slate-600">À l’étape Documents, un <strong>CV actualisé</strong> (fichier ou lien) sera exigé pour finaliser l’évaluation travail.</p></>}
                  {formData.projectType === "etudes" && <><Field label="Dernier niveau / diplôme obtenu *"><Select value={formData.educationLevel || ""} onValueChange={(value) => { update("educationLevel", value); update("diplomaLevel", value); }}><SelectTrigger data-testid="eval-etudes-niveau"><SelectValue placeholder="Sélectionner" /></SelectTrigger><SelectContent><SelectItem value="bac">Baccalauréat</SelectItem><SelectItem value="bts_dut">BTS / DUT</SelectItem><SelectItem value="licence">Licence / Bachelor</SelectItem><SelectItem value="master">Master</SelectItem><SelectItem value="doctorat">Doctorat</SelectItem><SelectItem value="autre">Autre</SelectItem></SelectContent></Select></Field><Field label="Cycle d’études visé *"><Select value={formData.studyCycle || ""} onValueChange={(value) => update("studyCycle", value)}><SelectTrigger data-testid="eval-etudes-cycle"><SelectValue placeholder="Licence, master…" /></SelectTrigger><SelectContent>{STUDY_CYCLE_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></Field><Field label="Filière / programme envisagé *" full><Input name="sector" value={formData.sector || ""} onChange={onTextChange} placeholder="Ex. informatique, santé, commerce…" maxLength={150} data-testid="eval-etudes-filiere" /></Field><Field label="Financement prévu" full><Input name="financialGuarantee" value={formData.financialGuarantee || ""} onChange={onTextChange} placeholder="Épargne, garant, bourse…" maxLength={255} /></Field><p className="md:col-span-2 text-xs leading-5 text-slate-600">À l’étape Documents, joignez vos <strong>diplômes</strong> et <strong>relevés de notes</strong> (ou confirmez qu’ils sont prêts) — indispensables à l’évaluation préalable études.</p></>}
                  {formData.projectType === "tourisme" && <><Field label="Votre statut *" full><Select value={formData.visitorStatus || ""} onValueChange={(value) => update("visitorStatus", value)}><SelectTrigger data-testid="eval-visiteurs-statut"><SelectValue placeholder="Chef d’entreprise, employé ou particulier" /></SelectTrigger><SelectContent>{VISITOR_STATUS_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>{formData.visitorStatus ? <p className="mt-1.5 text-xs leading-5 text-slate-600">{VISITOR_STATUS_OPTIONS.find((option) => option.value === formData.visitorStatus)?.hint}</p> : null}</Field><Field label="Motif du séjour *" full><Input name="visitReason" value={formData.visitReason || ""} onChange={onTextChange} placeholder="Visite familiale, tourisme, événement…" maxLength={255} data-testid="eval-visiteurs-motif" /></Field><Field label="Historique de voyages (facultatif)"><Input name="travelHistory" value={formData.travelHistory || ""} onChange={onTextChange} placeholder="Pays visités et années" maxLength={255} /></Field><Field label="Attaches dans le pays de résidence (facultatif)" full><Textarea name="socialTies" value={formData.socialTies || ""} onChange={onTextChange} placeholder="Emploi, entreprise, famille ou autres obligations" maxLength={2000} /></Field></>}
                  {formData.destinationCountry === "Canada" && <div className="md:col-span-2 rounded-xl border border-red-100 bg-red-50 p-4"><h4 className="font-black text-red-950">Questions Canada</h4><div className="mt-3 grid gap-4 md:grid-cols-2"><Field label="Test de langue ou niveau estimé"><Input name="canadaLanguageTest" value={formData.canadaLanguageTest || ""} onChange={onTextChange} placeholder="TEF, IELTS, niveau estimé…" maxLength={255} /></Field>{formData.projectType === "etudes" && <Field label="Projet d’études"><Input name="canadaStudyPlan" value={formData.canadaStudyPlan || ""} onChange={onTextChange} placeholder="Programme et objectif professionnel" maxLength={255} /></Field>}</div><p className="mt-3 text-xs text-red-900">Ces réponses servent à préparer un entretien ; elles ne confirment aucune admissibilité ou décision.</p></div>}
                  {formData.destinationCountry === "Luxembourg" && <div className="md:col-span-2 rounded-xl border border-amber-100 bg-amber-50 p-4"><h4 className="font-black text-amber-950">Questions Luxembourg</h4><div className="mt-3 grid gap-4 md:grid-cols-2"><Field label="Situation vis-à-vis d’un employeur"><Select value={formData.luxEmployerStatus || ""} onValueChange={(value) => update("luxEmployerStatus", value)}><SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger><SelectContent><SelectItem value="aucun">Aucun employeur identifié</SelectItem><SelectItem value="candidatures">Candidatures en cours</SelectItem><SelectItem value="contact">Contact ou entretien en cours</SelectItem><SelectItem value="offre">Offre ou proposition reçue</SelectItem></SelectContent></Select></Field><Field label="Situation ADEM / autorisation"><Input name="luxAademStatus" value={formData.luxAademStatus || ""} onChange={onTextChange} placeholder="À confirmer avec le conseiller" maxLength={255} /></Field></div><p className="mt-3 text-xs text-amber-900">Toute procédure liée à un employeur, à l’ADEM ou à une autorisation reste soumise aux règles officielles et à validation humaine.</p></div>}
                  {formData.destinationCountry === "France" && <div className="md:col-span-2 rounded-xl border border-blue-100 bg-blue-50 p-4"><h4 className="font-black text-blue-950">Question France</h4><Field label="Situation actuelle : admission, candidature ou employeur"><Input name="franceProjectStatus" value={formData.franceProjectStatus || ""} onChange={onTextChange} placeholder="Décrivez uniquement les éléments déjà obtenus ou en cours" maxLength={255} /></Field><p className="mt-3 text-xs text-blue-900">Le type de séjour, les ressources et les pièces définitives seront confirmés sur la source officielle et par un conseiller.</p></div>}
                  {formData.destinationCountry === "Belgique" && <div className="md:col-span-2 rounded-xl border border-blue-100 bg-blue-50 p-4"><h4 className="font-black text-blue-950">Question Belgique</h4><Field label="Région concernée si elle est connue"><Select value={formData.belgiumRegion || ""} onValueChange={(value) => update("belgiumRegion", value)}><SelectTrigger><SelectValue placeholder="À confirmer" /></SelectTrigger><SelectContent><SelectItem value="bruxelles">Bruxelles-Capitale</SelectItem><SelectItem value="flandre">Flandre</SelectItem><SelectItem value="wallonie">Wallonie</SelectItem><SelectItem value="inconnue">Je ne sais pas encore</SelectItem></SelectContent></Select></Field><p className="mt-3 text-xs text-blue-900">Les règles peuvent varier selon la région, l’établissement ou l’employeur : aucune procédure n’est confirmée automatiquement.</p></div>}
                  {formData.destinationCountry === "Allemagne" && <div className="md:col-span-2 rounded-xl border border-blue-100 bg-blue-50 p-4"><h4 className="font-black text-blue-950">Questions Allemagne</h4><div className="mt-3 grid gap-4 md:grid-cols-2"><Field label="Niveau d’allemand ou d’anglais"><Input name="germanyLanguageLevel" value={formData.germanyLanguageLevel || ""} onChange={onTextChange} placeholder="Ex. A2, B1, anglais professionnel" maxLength={255} /></Field><Field label="Situation de la qualification"><Input name="germanyRecognitionStatus" value={formData.germanyRecognitionStatus || ""} onChange={onTextChange} placeholder="À vérifier, traduction disponible, reconnaissance en cours…" maxLength={255} /></Field></div><p className="mt-3 text-xs text-blue-900">La reconnaissance dépend notamment du métier ; l’équipe vérifie les critères applicables avant toute démarche.</p></div>}
                  {programSections.length > 0 && <div className="md:col-span-2" data-testid="public-dynamic-sections"><DynamicFormSections sections={programSections} values={programAnswers} onChange={(key, value) => setProgramAnswers((previous) => ({ ...previous, [key]: value }))} idPrefix="pub" /></div>}
                  {formData.destinationCountry && <div className="md:col-span-2 rounded-2xl border border-violet-200 bg-violet-50 p-4"><div className="flex items-start gap-3"><Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-violet-700" aria-hidden="true" /><div><h4 className="font-black text-violet-950">Adapter les questions à votre projet</h4><p className="mt-1 text-sm leading-6 text-violet-950">Vous pouvez demander quelques questions de préparation adaptées à vos réponses. Elles aident à organiser l’échange avec le conseiller, sans confirmer une procédure ni un résultat.</p></div></div><label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-violet-100 bg-white p-3 text-sm text-slate-800"><input type="checkbox" checked={Boolean(formData.geminiAnalysisConsent)} onChange={(event) => { setFormData((previous) => ({ ...previous, geminiAnalysisConsent: event.target.checked })); if (!event.target.checked) { setOrientationPreview(null); setDynamicResponses([]); } }} className="mt-1 h-4 w-4 accent-[#0B2A52]" /><span><strong>J’accepte l’adaptation des questions à partir de mes réponses déclarées.</strong><br /><span className="text-xs leading-5 text-slate-600">N’indiquez pas de numéro de document, coordonnées bancaires, adresse précise, information médicale ou autre donnée sensible. Les fichiers joints ne sont pas utilisés pour cette préparation.</span></span></label><Button type="button" variant="outline" className="mt-3 w-full gap-2 border-violet-200 bg-white text-violet-900 hover:bg-violet-100" onClick={requestOrientationPreview} disabled={!formData.geminiAnalysisConsent || previewGeminiOrientation.isPending}>{previewGeminiOrientation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{previewGeminiOrientation.isPending ? "Préparation des questions…" : "Personnaliser mes questions"}</Button>{previewGeminiOrientation.isPending && <p role="status" aria-live="polite" className="mt-3 flex items-center gap-2 rounded-xl border border-violet-200 bg-white p-3 text-xs text-violet-950"><LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />Préparation personnalisée en cours. Vos pièces jointes ne sont pas concernées.</p>}{orientationPreview && <div className="mt-3 rounded-xl border border-violet-200 bg-white p-4" aria-live="polite"><h5 className="font-black text-violet-950">Questions complémentaires</h5>{dynamicResponses.length > 0 ? <div className="mt-3 space-y-4">{dynamicResponses.map((response, index) => <label key={response.question} className="block text-sm font-semibold text-slate-800">{response.question}<Textarea value={response.answer} onChange={(event) => setDynamicResponses((previous) => previous.map((item, itemIndex) => itemIndex === index ? { ...item, answer: event.target.value.slice(0, 1000) } : item))} maxLength={1000} className="mt-2 bg-white" placeholder="Réponse facultative, à compléter uniquement si vous disposez de l’information." /></label>)}</div> : <p className="mt-2 text-sm text-slate-700">Aucune précision complémentaire n’est nécessaire à cette étape. Vous pouvez poursuivre le questionnaire.</p>}<p className="mt-3 text-xs leading-5 text-slate-600">Les éléments ci-dessus restent préparatoires et seront revus par un conseiller avec les sources officielles.</p></div>}</div>}
                </div>}
                {currentStep === 3 && <div className="space-y-5"><div className="rounded-2xl border border-[#D8A928]/35 bg-amber-50/70 p-4"><div className="flex gap-3"><ClipboardList className="mt-0.5 h-5 w-5 shrink-0 text-[#9A7200]" /><div><h4 className="font-black text-slate-950">Catalogue documentaire — {formData.destinationCountry || "sélectionnez un pays"}</h4><p className="mt-1 text-sm text-slate-600">{formData.projectType === "tourisme" ? "Formulaire visiteurs : les pièces ci-dessous restent facultatives à ce stade ; le conseiller confirmera la liste selon votre statut." : formData.projectType === "etudes" ? "Pour l’évaluation études, diplômes et relevés de notes sont obligatoires (fichier ou confirmation de disponibilité)." : "Pour l’évaluation travail, un CV actualisé est obligatoire. Les autres pièces aident le conseiller."}</p></div></div><div className="mt-4 grid gap-2 sm:grid-cols-2">{requirements.map((item) => <div key={`${item.category}-${item.label}`} className="rounded-xl border border-amber-100 bg-white p-3"><span className="text-[11px] font-black uppercase tracking-wide text-[#9A7200]">{item.category} · {item.priority}</span><p className="mt-1 flex gap-2 text-sm font-bold text-slate-900"><FileText className="h-4 w-4 shrink-0 text-blue-700" />{item.label}</p><p className="mt-1 text-xs leading-5 text-slate-600">{item.detail}</p></div>)}</div></div><div className="rounded-2xl border border-blue-100 bg-slate-50 p-4" data-testid="evaluation-docs-privacy"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" /><div><h4 className="font-black text-slate-950">{formData.projectType === "tourisme" ? "Dépôt sécurisé (facultatif)" : formData.projectType === "etudes" ? "Dépôt sécurisé — diplômes & relevés" : "Dépôt sécurisé — CV obligatoire"}</h4><p className="mt-1 text-xs leading-5 text-slate-600">Ajoutez au maximum 5 fichiers PDF, JPG ou PNG de 10 Mo. Ils sont envoyés après la création du dossier, puis restent à vérifier par l’équipe.</p><ul className="mt-3 space-y-1.5 text-xs leading-5 text-slate-700"><li><strong>Qui y a accès :</strong> {DOCUMENT_VAULT_POLICY.access.fr}</li><li><strong>Pourquoi elles sont demandées :</strong> pour préparer votre dossier et permettre au conseiller de vérifier la cohérence avec la procédure — jamais pour une publication publique.</li><li><strong>Confidentialité :</strong>{" "}<a href={DOCUMENT_VAULT_POLICY.privacyPath} className="font-bold text-blue-800 underline underline-offset-2 hover:text-blue-950">Politique de confidentialité</a></li></ul></div></div><div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]"><Select value={selectedDocumentType} onValueChange={(value) => setSelectedDocumentType(value as EvaluationDocumentType)}><SelectTrigger data-testid="eval-document-type"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="passport">Passeport</SelectItem><SelectItem value="cv">CV</SelectItem><SelectItem value="diploma">Diplôme</SelectItem><SelectItem value="educational_transcript">Relevé de notes</SelectItem><SelectItem value="certificate">Attestation</SelectItem><SelectItem value="bank_statement">Ressources financières</SelectItem><SelectItem value="language_test">Test de langue</SelectItem><SelectItem value="other">Autre pièce</SelectItem></SelectContent></Select><Label className="flex cursor-pointer items-center justify-center gap-2 rounded-md bg-[#0B2A52] px-4 py-2 text-sm font-bold text-white hover:bg-[#163d73]"><UploadCloud className="h-4 w-4" />Ajouter<input className="sr-only" type="file" accept="application/pdf,image/jpeg,image/png" multiple onChange={(event) => { addDocuments(event.target.files); event.target.value = ""; }} /></Label></div>{selectedDocuments.length > 0 && <ul className="mt-3 space-y-2" aria-label="Documents sélectionnés">{selectedDocuments.map((item, index) => <li key={`${item.file.name}-${index}`} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"><span className="min-w-0 truncate"><strong>{item.file.name}</strong> <span className="text-slate-500">({Math.ceil(item.file.size / 1024)} Ko · {item.documentType})</span></span><Button type="button" variant="ghost" size="sm" onClick={() => setSelectedDocuments((items) => items.filter((_, itemIndex) => itemIndex !== index))}>Retirer</Button></li>)}</ul>}</div>{formData.projectType === "etudes" && <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-sm text-slate-800" data-testid="eval-etudes-transcript-ready"><input type="checkbox" checked={Boolean(formData.transcriptAvailable)} onChange={(event) => setFormData((prev) => ({ ...prev, transcriptAvailable: event.target.checked }))} className="mt-1 h-4 w-4 accent-[#0B2A52]" /><span><strong>Mes relevés de notes sont prêts</strong> (je les joins ici ou je les déposerai dès que le conseiller le demandera).</span></label>}{formData.projectType === "travail" ? <Field label="Lien vers votre CV (si pas de fichier) *"><Input name="cvLink" type="url" value={formData.cvLink || ""} onChange={onTextChange} placeholder="https://drive.google.com/..." maxLength={500} data-testid="eval-travail-cv-link" /><p className="mt-1.5 text-xs leading-5 text-slate-600">Obligatoire si vous n’avez pas ajouté de fichier CV. Utilisez un partage privé.</p></Field> : formData.projectType === "etudes" ? null : <Field label="Lien documentaire (optionnel)"><Input name="cvLink" type="url" value={formData.cvLink || ""} onChange={onTextChange} placeholder="https://drive.google.com/..." maxLength={500} /><p className="mt-1.5 text-xs leading-5 text-slate-600">Facultatif pour un visa visiteurs. Partage privé uniquement.</p></Field>}</div>}
                {currentStep === 4 && <div className="space-y-4"><div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><div className="flex gap-3"><MailCheck className="mt-0.5 h-5 w-5 text-emerald-700" /><div><h4 className="font-black text-emerald-950">Vérifiez votre évaluation avant l’envoi</h4><p className="mt-1 text-sm text-emerald-900">Utilisez Modifier pour corriger une étape. Aucun résultat automatique, visa, admission ou emploi n’est garanti.</p></div></div></div><SummarySection title="Projet" onEdit={() => setCurrentStep(0)} lines={[formData.projectType === "travail" ? "Visa travail" : formData.projectType === "etudes" ? "Visa études" : "Visa visiteurs", formData.destinationCountry, COUNTRY_GUIDANCE[formData.destinationCountry] || "Orientation à confirmer"]} /><SummarySection title="Profil" onEdit={() => setCurrentStep(1)} lines={[formData.fullName, formData.email, formData.whatsappPhone, formData.nationality]} /><SummarySection title="Critères" onEdit={() => setCurrentStep(2)} lines={[formData.projectType === "travail" ? [formData.sector && `Métier : ${formData.sector}`, formData.yearsOfExperience !== undefined && formData.yearsOfExperience !== null ? `Expérience : ${formData.yearsOfExperience} an(s)` : "", formData.languages && `Langues : ${formData.languages}`] : formData.projectType === "etudes" ? [formData.educationLevel && `Niveau obtenu : ${formData.educationLevel}`, formData.studyCycle ? `Cycle visé : ${STUDY_CYCLE_LABELS[formData.studyCycle]}` : "", formData.sector && `Filière : ${formData.sector}`, formData.financialGuarantee && `Financement : ${formData.financialGuarantee}`] : [formData.visitorStatus ? `Statut : ${VISITOR_STATUS_LABELS[formData.visitorStatus]}` : "", formData.visitReason && `Motif : ${formData.visitReason}`, formData.travelHistory && `Voyages : ${formData.travelHistory}`, formData.socialTies && `Attaches : ${formData.socialTies}`], formData.franceProjectStatus, formData.belgiumRegion, formData.germanyLanguageLevel, formData.germanyRecognitionStatus, dynamicResponses.filter((response) => response.answer.trim()).length ? `${dynamicResponses.filter((response) => response.answer.trim()).length} réponse(s) complémentaire(s)` : ""].flat().filter(Boolean) as string[]} /><SummarySection title="Documents" onEdit={() => setCurrentStep(3)} lines={[`${selectedDocuments.length} pièce(s) sélectionnée(s)`, formData.projectType === "travail" && formData.cvLink ? "Lien CV indiqué" : "", formData.projectType === "etudes" && formData.transcriptAvailable ? "Relevés confirmés prêts" : "", formData.projectType === "tourisme" ? "Pièces facultatives (formulaire visiteurs)" : ""].filter(Boolean) as string[]} /><p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-700">Après soumission, l’équipe examine les informations déclarées et les pièces séparément selon le type de visa. Seule une réponse relue et validée par un conseiller sera envoyée par e-mail et visible dans votre espace.</p></div>}
              </motion.section>
            </AnimatePresence>
            <div className="mt-7 flex items-center justify-between gap-3 border-t border-slate-100 pt-5"><Button type="button" variant="outline" onClick={previous} disabled={currentStep === 0} className="gap-2"><ChevronLeft className="h-4 w-4" />Précédent</Button>{currentStep < STEPS.length - 1 ? <Button type="button" onClick={next} className="gap-2 bg-[#0B2A52] text-white hover:bg-[#163d73]">Continuer<ChevronRight className="h-4 w-4" /></Button> : <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting} data-testid="evaluation-submit" className="gap-2 bg-[#D8A928] text-slate-950 hover:bg-[#c6971f]">{isSubmitting && <LoaderCircle className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}{isSubmitting ? (uploadProgress ? `Envoi des documents (${Math.min(uploadProgress.done + 1, uploadProgress.total)}/${uploadProgress.total})…` : "Envoi de votre évaluation…") : "Soumettre l’évaluation"}</Button>}</div>
            <p role="status" aria-live="polite" className="sr-only" data-testid="evaluation-submit-status">{isSubmitting ? (uploadProgress ? `Envoi des documents : ${Math.min(uploadProgress.done + 1, uploadProgress.total)} sur ${uploadProgress.total}` : "Envoi de votre évaluation en cours") : ""}</p>
          </form>
        )}
        {!isSuccessVisible && <div className="mt-5 grid gap-2 sm:grid-cols-2"><button type="button" onClick={() => window.open(`https://wa.me/237698104832?text=${encodeURIComponent(summary)}`, "_blank")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white transition-transform duration-150 hover:-translate-y-0.5 hover:bg-emerald-800 active:scale-[0.98]"><MessageCircleMore className="h-4 w-4" />Partager au conseiller WhatsApp</button><button type="button" onClick={async () => { try { await navigator.clipboard.writeText(summary); toast.success("Récapitulatif copié"); } catch { toast.error("Copie non disponible sur cet appareil"); } }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-3 text-sm font-bold text-white transition-transform duration-150 hover:-translate-y-0.5 hover:bg-slate-900 active:scale-[0.98]"><MailCheck className="h-4 w-4" />Copier le récapitulatif</button></div>}
        <p className="mt-5 text-center text-sm text-slate-600">Évaluation gratuite · Réponse sous 24 h ouvrées · Informations confidentielles</p>
      </Card>
    </motion.div>
  );
}

function SummarySection({ title, lines, onEdit }: { title: string; lines: string[]; onEdit: () => void }) {
  return <section className="rounded-xl border border-slate-200 bg-white p-4" aria-label={`Récapitulatif ${title}`}><div className="flex items-start justify-between gap-3"><div><h4 className="font-black text-slate-950">{title}</h4><ul className="mt-2 space-y-1 text-sm text-slate-700">{lines.length > 0 ? lines.map((line, index) => <li key={`${title}-${index}`}>{line}</li>) : <li>Non renseigné</li>}</ul></div><Button type="button" variant="outline" size="sm" className="shrink-0 gap-1" onClick={onEdit}><Pencil className="h-3.5 w-3.5" />Modifier</Button></div></section>;
}

function Field({ label, hint, full, children }: { label: string; hint?: string; full?: boolean; children: React.ReactNode }) {
  return <div className={full ? "md:col-span-2" : ""}><Label className="text-base font-semibold text-slate-900">{label}</Label><div className="mt-2">{children}</div>{hint && <p className="mt-1.5 text-sm font-medium text-red-700">{hint}</p>}</div>;
}
