import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  User, MapPin, GraduationCap, Briefcase, DollarSign,
  Users, FileText, ChevronRight, ChevronLeft, Upload,
  CheckCircle, AlertCircle, X, Loader2
} from "lucide-react";
import { toast } from "sonner";
import AgreementProtocol from "@/components/AgreementProtocol";

// ─── Types ────────────────────────────────────────────────────────────────────

export type VisaCategory = "etude" | "travail" | "tourisme" | "residence" | "famille" | "affaires";

interface UploadedFile {
  type: string;
  url: string;
  key: string;
  name: string;
}

interface FormData {
  // Étape 1 — Visa & Destination
  visaType: VisaCategory | "";
  destination: string;
  formulaChosen: "integral" | "echelonne" | "garanti";
  // Étape 2 — État civil
  fullName: string;
  email: string;
  whatsappNumber: string;
  dateOfBirth: string;
  placeOfBirth: string;
  gender: string;
  maritalStatus: string;
  nationality: string;
  currentAddress: string;
  currentCity: string;
  currentCountry: string;
  // Étape 3 — Études & Diplômes
  academicLevel: string;
  diplomaTitle: string;
  diplomaInstitution: string;
  diplomaYear: string;
  fieldOfStudy: string;
  // Étape 4 — Situation professionnelle
  employmentStatus: string;
  currentEmployer: string;
  currentJobTitle: string;
  jobSector: string;
  experienceYears: string;
  languageSkills: string;
  // Étape 5 — Ressources financières
  monthlyIncome: string;
  incomeCurrency: string;
  bankBalance: string;
  bankBalanceCurrency: string;
  hasSponsorship: boolean;
  sponsorName: string;
  sponsorRelation: string;
  // Étape 6 — Situation familiale (conditionnelle)
  numberOfChildren: string;
  spouseFullName: string;
  spouseNationality: string;
  familyMemberInDestination: boolean;
  familyMemberRelation: string;
  familyMemberStatus: string;
  // Étape 7 — Documents
  documents: UploadedFile[];
}

const INITIAL_FORM: FormData = {
  visaType: "", destination: "", formulaChosen: "integral",
  fullName: "", email: "", whatsappNumber: "", dateOfBirth: "", placeOfBirth: "",
  gender: "", maritalStatus: "", nationality: "", currentAddress: "",
  currentCity: "", currentCountry: "",
  academicLevel: "", diplomaTitle: "", diplomaInstitution: "", diplomaYear: "",
  fieldOfStudy: "",
  employmentStatus: "", currentEmployer: "", currentJobTitle: "", jobSector: "",
  experienceYears: "", languageSkills: "",
  monthlyIncome: "", incomeCurrency: "XAF", bankBalance: "", bankBalanceCurrency: "XAF",
  hasSponsorship: false, sponsorName: "", sponsorRelation: "",
  numberOfChildren: "0", spouseFullName: "", spouseNationality: "",
  familyMemberInDestination: false, familyMemberRelation: "", familyMemberStatus: "",
  documents: [],
};

// ─── Constantes ───────────────────────────────────────────────────────────────

const VISA_TYPES: { value: VisaCategory; label: string; icon: string; color: string; description: string }[] = [
  { value: "etude", label: "Visa Étude", icon: "🎓", color: "bg-blue-500", description: "Études dans une institution reconnue à l'étranger" },
  { value: "travail", label: "Visa Travail", icon: "💼", color: "bg-green-500", description: "Emploi rémunéré chez un employeur étranger" },
  { value: "tourisme", label: "Visa Tourisme", icon: "✈️", color: "bg-orange-500", description: "Voyage, visite ou exploration" },
  { value: "residence", label: "Résidence Permanente", icon: "🏠", color: "bg-red-500", description: "Installation définitive avec droits de résident" },
  { value: "famille", label: "Regroupement Familial", icon: "👨‍👩‍👧", color: "bg-purple-500", description: "Rejoindre un membre de famille à l'étranger" },
  { value: "affaires", label: "Visa Affaires", icon: "🤝", color: "bg-teal-500", description: "Activités commerciales ou investissement" },
];

const DESTINATIONS = [
  { value: "canada", label: "🇨🇦 Canada" },
  { value: "pologne", label: "🇵🇱 Pologne" },
  { value: "luxembourg", label: "🇱🇺 Luxembourg" },
  { value: "allemagne", label: "🇩🇪 Allemagne" },
  { value: "france", label: "🇫🇷 France" },
  { value: "belgique", label: "🇧🇪 Belgique" },
  { value: "royaume_uni", label: "🇬🇧 Royaume-Uni" },
  { value: "usa", label: "🇺🇸 États-Unis" },
  { value: "australie", label: "🇦🇺 Australie" },
  { value: "qatar", label: "🇶🇦 Qatar" },
  { value: "emirats", label: "🇦🇪 Émirats Arabes Unis" },
  { value: "autre", label: "🌍 Autre pays" },
];

const DOCUMENT_TYPES: { type: string; label: string; required: boolean; visas?: VisaCategory[] }[] = [
  { type: "passeport", label: "Passeport (pages bio + visas)", required: true },
  { type: "cv", label: "Curriculum Vitae (CV)", required: true, visas: ["travail", "residence", "affaires"] },
  { type: "diplome", label: "Diplôme(s) / Attestation(s)", required: true, visas: ["etude", "travail", "residence"] },
  { type: "releve_bancaire", label: "Relevé bancaire (3 derniers mois)", required: true, visas: ["tourisme", "etude", "travail", "residence", "famille", "affaires"] },
  { type: "lettre_motivation", label: "Lettre de motivation", required: false, visas: ["etude", "travail"] },
  { type: "contrat_travail", label: "Contrat de travail / Offre d'emploi", required: true, visas: ["travail"] },
  { type: "lettre_admission", label: "Lettre d'admission (université)", required: true, visas: ["etude"] },
  { type: "acte_naissance", label: "Acte de naissance", required: true },
  { type: "acte_mariage", label: "Acte de mariage", required: false, visas: ["famille", "residence"] },
  { type: "justificatif_hebergement", label: "Justificatif d'hébergement", required: false, visas: ["famille", "tourisme"] },
  { type: "photo_identite", label: "Photos d'identité (format visa)", required: true },
  { type: "casier_judiciaire", label: "Casier judiciaire", required: false, visas: ["travail", "residence", "famille"] },
];

// ─── Étapes ───────────────────────────────────────────────────────────────────

interface StepConfig {
  id: number;
  title: string;
  icon: React.ReactNode;
  shortLabel: string;
  visasOnly?: VisaCategory[];
}

const ALL_STEPS: StepConfig[] = [
  { id: 1, title: "Type de Visa & Destination", icon: <MapPin className="w-4 h-4" />, shortLabel: "Visa" },
  { id: 2, title: "État Civil & Coordonnées", icon: <User className="w-4 h-4" />, shortLabel: "Identité" },
  { id: 3, title: "Études & Diplômes", icon: <GraduationCap className="w-4 h-4" />, shortLabel: "Études" },
  { id: 4, title: "Situation Professionnelle", icon: <Briefcase className="w-4 h-4" />, shortLabel: "Emploi" },
  { id: 5, title: "Ressources Financières", icon: <DollarSign className="w-4 h-4" />, shortLabel: "Finances" },
  { id: 6, title: "Situation Familiale", icon: <Users className="w-4 h-4" />, shortLabel: "Famille", visasOnly: ["famille", "residence"] },
  { id: 7, title: "Documents & Paiement", icon: <FileText className="w-4 h-4" />, shortLabel: "Documents" },
];

// ─── Composant principal ───────────────────────────────────────────────────────

interface FullDossierFormProps {
  initialVisaType?: VisaCategory;
  initialDestination?: string;
  procedureId?: string;
  procedureTitle?: string;
  onClose?: () => void;
}

export default function FullDossierForm({ initialVisaType, initialDestination, procedureId, procedureTitle, onClose }: FullDossierFormProps) {
  const [, navigate] = useLocation();
  const [form, setForm] = useState<FormData>(() => {
    try {
      const saved = localStorage.getItem("3m_dossier_draft");
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_FORM,
          ...parsed,
          visaType: initialVisaType ?? parsed.visaType ?? "",
          destination: initialDestination ?? parsed.destination ?? "",
        };
      }
    } catch (e) {
      // Ignore parse error
    }
    return {
      ...INITIAL_FORM,
      visaType: initialVisaType ?? "",
      destination: initialDestination ?? "",
    };
  });
  const [hasRestored, setHasRestored] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("3m_dossier_draft");
      if (saved && !hasRestored) {
        setHasRestored(true);
        toast.info("Brouillon de dossier restauré automatiquement", {
          description: "Vous pouvez continuer votre saisie là où vous l'aviez laissée.",
          duration: 4000,
        });
      }
    } catch (e) {}
  }, [hasRestored]);

  useEffect(() => {
    try {
      localStorage.setItem("3m_dossier_draft", JSON.stringify(form));
    } catch (e) {}
  }, [form]);
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAgreement, setShowAgreement] = useState(false);
  const [applicationResult, setApplicationResult] = useState<{ id: number; dossierNumber: string } | null>(null);

  const createApplication = trpc.application.createApplication.useMutation();

  // Étapes actives selon le type de visa
  const activeSteps = ALL_STEPS.filter(s =>
    !s.visasOnly || (form.visaType && s.visasOnly.includes(form.visaType as VisaCategory))
  );
  const totalSteps = activeSteps.length;
  const currentStepIndex = activeSteps.findIndex(s => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;

  const set = useCallback((field: keyof FormData, value: unknown) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
  }, []);

  // ─── Navigation ───────────────────────────────────────────────────────────

  const goNext = () => {
    const errs = validateStep(currentStep);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    const nextIdx = currentStepIndex + 1;
    if (nextIdx < totalSteps) {
      setDirection(1);
      setCurrentStep(activeSteps[nextIdx].id);
    }
  };

  const goPrev = () => {
    const prevIdx = currentStepIndex - 1;
    if (prevIdx >= 0) {
      setDirection(-1);
      setCurrentStep(activeSteps[prevIdx].id);
    }
  };

  // ─── Validation ───────────────────────────────────────────────────────────

  const validateStep = (step: number): Record<string, string> => {
    const e: Record<string, string> = {};
    if (step === 1) {
      if (!form.visaType) e.visaType = "Sélectionnez un type de visa";
      if (!form.destination) e.destination = "Sélectionnez une destination";
    }
    if (step === 2) {
      if (!form.fullName.trim()) e.fullName = "Nom complet requis";
      if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = "Email invalide";
      if (!form.whatsappNumber.trim()) e.whatsappNumber = "Numéro WhatsApp requis";
      if (!form.dateOfBirth) e.dateOfBirth = "Date de naissance requise";
      if (!form.nationality.trim()) e.nationality = "Nationalité requise";
    }
    if (step === 3) {
      if (!form.academicLevel) e.academicLevel = "Niveau d'études requis";
    }
    if (step === 4) {
      if (!form.employmentStatus) e.employmentStatus = "Situation professionnelle requise";
    }
    return e;
  };

  // ─── Upload de document ───────────────────────────────────────────────────

  const handleDocumentUpload = async (docType: string, file: File) => {
    setUploadingDoc(docType);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", docType);
      const res = await fetch("/api/candidate/upload-public", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Erreur upload");
      const data = await res.json();
      const newDoc: UploadedFile = { type: docType, url: data.url, key: data.key, name: file.name };
      setForm(prev => ({
        ...prev,
        documents: [...prev.documents.filter(d => d.type !== docType), newDoc],
        ...(docType === "passeport" ? { passportUrl: data.url } : {}),
        ...(docType === "cv" ? { cvUrl: data.url } : {}),
        ...(docType === "diplome" ? { diplomaUrl: data.url } : {}),
      }));
      toast.success(`${file.name} ajouté avec succès.`);
    } catch {
      toast.error("Impossible de téléverser le document.");
    } finally {
      setUploadingDoc(null);
    }
  };

  // ─── Soumission ───────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    const errs = validateStep(currentStep);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    try {
      const result = await createApplication.mutateAsync({
        fullName: form.fullName,
        email: form.email,
        whatsappNumber: form.whatsappNumber,
        destination: (form.destination || "autre") as "canada" | "luxembourg" | "pologne" | "europe" | "golfe" | "oceanie" | "caucase" | "autre",
        formulaChosen: form.formulaChosen,
        age: form.dateOfBirth ? new Date().getFullYear() - new Date(form.dateOfBirth).getFullYear() : undefined,
        nationality: form.nationality || undefined,
        academicLevel: form.academicLevel || undefined,
        experienceYears: form.experienceYears ? parseInt(form.experienceYears) : undefined,
        languageSkills: form.languageSkills || undefined,
        jobSector: form.jobSector || undefined,
        passportUrl: form.documents.find(d => d.type === "passeport")?.url,
        cvUrl: form.documents.find(d => d.type === "cv")?.url,
        diplomaUrl: form.documents.find(d => d.type === "diplome")?.url,
        procedureId: procedureId || undefined,
        procedureTitle: procedureTitle || undefined,
        // État civil
        dateOfBirth: form.dateOfBirth || undefined,
        placeOfBirth: form.placeOfBirth || undefined,
        gender: (form.gender as "homme" | "femme" | "autre") || undefined,
        maritalStatus: (form.maritalStatus as "celibataire" | "marie" | "divorce" | "veuf" | "union_libre") || undefined,
        currentAddress: form.currentAddress || undefined,
        currentCity: form.currentCity || undefined,
        currentCountry: form.currentCountry || undefined,
        // Diplômes
        diplomaTitle: form.diplomaTitle || undefined,
        diplomaInstitution: form.diplomaInstitution || undefined,
        diplomaYear: form.diplomaYear ? parseInt(form.diplomaYear) : undefined,
        fieldOfStudy: form.fieldOfStudy || undefined,
        // Emploi
        currentEmployer: form.currentEmployer || undefined,
        currentJobTitle: form.currentJobTitle || undefined,
        monthlyIncome: form.monthlyIncome ? parseInt(form.monthlyIncome) : undefined,
        bankBalance: form.bankBalance ? parseInt(form.bankBalance) : undefined,
        hasSponsorship: form.hasSponsorship,
        sponsorName: form.sponsorName || undefined,
        sponsorRelation: form.sponsorRelation || undefined,
        // Famille
        numberOfChildren: form.numberOfChildren ? parseInt(form.numberOfChildren) : 0,
        spouseFullName: form.spouseFullName || undefined,
        spouseNationality: form.spouseNationality || undefined,
        familyMemberInDestination: form.familyMemberInDestination,
        familyMemberRelation: form.familyMemberRelation || undefined,
        familyMemberStatus: form.familyMemberStatus || undefined,
        visaType: form.visaType || undefined,
      });

      // Afficher le Protocole d'Accord avant la vérification email
      setApplicationResult({ id: result.applicationId, dossierNumber: result.dossierNumber });
      setShowAgreement(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la soumission";
      toast.error(msg);
    }
  };

  // ─── Rendu des étapes ─────────────────────────────────────────────────────

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0, scale: 0.98 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0, scale: 0.98 }),
  };

  const inputClass = (field: string) =>
    `border ${errors[field] ? "border-red-400 focus:ring-red-300" : "border-gray-200 focus:ring-blue-300"} rounded-lg focus:outline-none focus:ring-2 transition-all`;

  // Si le Protocole d'Accord doit être affiché
  if (showAgreement && applicationResult) {
    return (
      <AgreementProtocol
        applicationId={applicationResult.id}
        dossierNumber={applicationResult.dossierNumber}
        candidateName={form.fullName}
        destination={form.destination}
        visaType={form.visaType || "travail"}
        formulaChosen={form.formulaChosen}
        onSigned={() => {
          try {
            localStorage.removeItem("3m_dossier_draft");
          } catch (e) {}
          localStorage.setItem('dossierConfirmation', JSON.stringify({
            dossierNumber: applicationResult.dossierNumber,
            candidateName: form.fullName,
            email: form.email,
            destination: form.destination,
            formula: form.formulaChosen,
          }));
          navigate('/dossier-confirmation');
        }}
        onBack={() => setShowAgreement(false)}
      />
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-auto overflow-hidden">

      {/* ── En-tête avec barre de progression ── */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 px-6 pt-5 pb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-white font-bold text-lg">Constitution de Dossier</h2>
            <p className="text-blue-200 text-sm">Étape {currentStepIndex + 1} sur {totalSteps} — {activeSteps[currentStepIndex]?.title}</p>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-blue-200 hover:text-white transition-colors p-1 rounded-full hover:bg-blue-600">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Barre de progression avec pourcentage */}
        <div className="flex items-center justify-between text-xs text-blue-200 mb-1.5 font-medium">
          <span>Progression globale</span>
          <span className="bg-blue-800/80 px-2 py-0.5 rounded-full text-amber-300 font-bold">{Math.round(progress)}% complété</span>
        </div>
        <div className="w-full bg-blue-950/60 rounded-full h-2.5 mb-3 p-0.5 border border-blue-600/30">
          <motion.div
            className="bg-gradient-to-r from-amber-400 to-amber-300 h-1.5 rounded-full shadow-sm"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between">
          {activeSteps.map((step, idx) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex flex-col items-center ${idx <= currentStepIndex ? "opacity-100" : "opacity-40"}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  idx < currentStepIndex ? "bg-amber-400 text-blue-900" :
                  idx === currentStepIndex ? "bg-white text-blue-700 ring-2 ring-amber-400" :
                  "bg-blue-600 text-blue-200"
                }`}>
                  {idx < currentStepIndex ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                </div>
                <span className="text-xs text-blue-200 mt-1 hidden sm:block">{step.shortLabel}</span>
              </div>
              {idx < activeSteps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 transition-all ${idx < currentStepIndex ? "bg-amber-400" : "bg-blue-600"}`} style={{ minWidth: 8 }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Corps du formulaire ── */}
      <div className="px-6 py-5 min-h-[380px] overflow-y-auto max-h-[60vh]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {currentStep === 1 && <Step1VisaDestination form={form} set={set} errors={errors} inputClass={inputClass} />}
            {currentStep === 2 && <Step2Identity form={form} set={set} errors={errors} inputClass={inputClass} />}
            {currentStep === 3 && <Step3Education form={form} set={set} errors={errors} inputClass={inputClass} />}
            {currentStep === 4 && <Step4Employment form={form} set={set} errors={errors} inputClass={inputClass} />}
            {currentStep === 5 && <Step5Finances form={form} set={set} errors={errors} inputClass={inputClass} />}
            {currentStep === 6 && <Step6Family form={form} set={set} errors={errors} inputClass={inputClass} />}
            {currentStep === 7 && (
              <Step7Documents
                form={form}
                uploadingDoc={uploadingDoc}
                onUpload={handleDocumentUpload}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Navigation ── */}
      <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
        <Button
          variant="outline"
          onClick={currentStepIndex === 0 && onClose ? onClose : goPrev}
          disabled={currentStepIndex === 0 && !onClose}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          {currentStepIndex === 0 ? "Annuler" : "Précédent"}
        </Button>

        <span className="text-sm text-gray-400">{currentStepIndex + 1}/{totalSteps}</span>

        {currentStepIndex < totalSteps - 1 ? (
          <Button onClick={goNext} className="bg-blue-700 hover:bg-blue-800 text-white flex items-center gap-2">
            Suivant
            <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={createApplication.isPending}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold flex items-center gap-2"
          >
            {createApplication.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Envoi...</>
            ) : (
              <><CheckCircle className="w-4 h-4" />Soumettre le dossier</>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Étape 1 : Visa & Destination ────────────────────────────────────────────

function Step1VisaDestination({ form, set, errors, inputClass }: StepProps) {
  return (
    <div className="space-y-5">
      <div>
        <Label className="text-sm font-semibold text-gray-700 mb-2 block">Type de visa souhaité *</Label>
        <div className="grid grid-cols-2 gap-2">
          {VISA_TYPES.map(v => (
            <button
              key={v.value}
              type="button"
              onClick={() => set("visaType", v.value)}
              className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all ${
                form.visaType === v.value
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
              }`}
            >
              <span className="text-xl">{v.icon}</span>
              <div>
                <div className="text-xs font-bold text-gray-800">{v.label}</div>
                <div className="text-xs text-gray-500 leading-tight">{v.description}</div>
              </div>
            </button>
          ))}
        </div>
        {errors.visaType && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.visaType}</p>}
      </div>

      <div>
        <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Destination *</Label>
        <Select value={form.destination} onValueChange={v => set("destination", v)}>
          <SelectTrigger className={inputClass("destination")}>
            <SelectValue placeholder="Choisissez votre destination" />
          </SelectTrigger>
          <SelectContent>
            {DESTINATIONS.map(d => (
              <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.destination && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.destination}</p>}
      </div>


    </div>
  );
}

// ─── Étape 2 : État civil ─────────────────────────────────────────────────────

function Step2Identity({ form, set, errors, inputClass }: StepProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label className="text-sm font-semibold text-gray-700 mb-1 block">Nom complet *</Label>
          <Input value={form.fullName} onChange={e => set("fullName", e.target.value)}
            placeholder="Prénom et Nom de famille" className={inputClass("fullName")} />
          {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-1 block">Email *</Label>
            <Input type="email" value={form.email} onChange={e => set("email", e.target.value)}
              placeholder="votre@email.com" className={inputClass("email")} />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-1 block">WhatsApp *</Label>
            <Input value={form.whatsappNumber} onChange={e => set("whatsappNumber", e.target.value)}
              placeholder="+237 6XX XXX XXX" className={inputClass("whatsappNumber")} />
            {errors.whatsappNumber && <p className="text-red-500 text-xs mt-1">{errors.whatsappNumber}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-1 block">Date de naissance *</Label>
            <Input type="date" value={form.dateOfBirth} onChange={e => set("dateOfBirth", e.target.value)}
              className={inputClass("dateOfBirth")} />
            {errors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</p>}
          </div>
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-1 block">Lieu de naissance</Label>
            <Input value={form.placeOfBirth} onChange={e => set("placeOfBirth", e.target.value)}
              placeholder="Ville, Pays" className={inputClass("placeOfBirth")} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-1 block">Genre</Label>
            <Select value={form.gender} onValueChange={v => set("gender", v)}>
              <SelectTrigger className={inputClass("gender")}><SelectValue placeholder="Genre" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="homme">Homme</SelectItem>
                <SelectItem value="femme">Femme</SelectItem>
                <SelectItem value="autre">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-1 block">Situation</Label>
            <Select value={form.maritalStatus} onValueChange={v => set("maritalStatus", v)}>
              <SelectTrigger className={inputClass("maritalStatus")}><SelectValue placeholder="Statut" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="celibataire">Célibataire</SelectItem>
                <SelectItem value="marie">Marié(e)</SelectItem>
                <SelectItem value="divorce">Divorcé(e)</SelectItem>
                <SelectItem value="veuf">Veuf/Veuve</SelectItem>
                <SelectItem value="union_libre">Union libre</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-1 block">Nationalité *</Label>
            <Input value={form.nationality} onChange={e => set("nationality", e.target.value)}
              placeholder="Ex: Camerounaise" className={inputClass("nationality")} />
            {errors.nationality && <p className="text-red-500 text-xs mt-1">{errors.nationality}</p>}
          </div>
        </div>
        <div>
          <Label className="text-sm font-semibold text-gray-700 mb-1 block">Adresse actuelle</Label>
          <Input value={form.currentAddress} onChange={e => set("currentAddress", e.target.value)}
            placeholder="Rue, Quartier" className={inputClass("currentAddress")} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-1 block">Ville</Label>
            <Input value={form.currentCity} onChange={e => set("currentCity", e.target.value)}
              placeholder="Ex: Yaoundé" className={inputClass("currentCity")} />
          </div>
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-1 block">Pays de résidence</Label>
            <Input value={form.currentCountry} onChange={e => set("currentCountry", e.target.value)}
              placeholder="Ex: Cameroun" className={inputClass("currentCountry")} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Étape 3 : Études ─────────────────────────────────────────────────────────

function Step3Education({ form, set, errors, inputClass }: StepProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-semibold text-gray-700 mb-1 block">Niveau d'études *</Label>
        <Select value={form.academicLevel} onValueChange={v => set("academicLevel", v)}>
          <SelectTrigger className={inputClass("academicLevel")}><SelectValue placeholder="Sélectionnez votre niveau" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="brevet">Brevet / BEPC</SelectItem>
            <SelectItem value="bac">Baccalauréat</SelectItem>
            <SelectItem value="bts_dut">BTS / DUT (Bac+2)</SelectItem>
            <SelectItem value="licence">Licence (Bac+3)</SelectItem>
            <SelectItem value="master">Master (Bac+5)</SelectItem>
            <SelectItem value="doctorat">Doctorat (Bac+8)</SelectItem>
            <SelectItem value="ingenieur">Diplôme d'Ingénieur</SelectItem>
            <SelectItem value="autre">Autre</SelectItem>
          </SelectContent>
        </Select>
        {errors.academicLevel && <p className="text-red-500 text-xs mt-1">{errors.academicLevel}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm font-semibold text-gray-700 mb-1 block">Intitulé du diplôme principal</Label>
          <Input value={form.diplomaTitle} onChange={e => set("diplomaTitle", e.target.value)}
            placeholder="Ex: Master en Informatique" className={inputClass("diplomaTitle")} />
        </div>
        <div>
          <Label className="text-sm font-semibold text-gray-700 mb-1 block">Établissement</Label>
          <Input value={form.diplomaInstitution} onChange={e => set("diplomaInstitution", e.target.value)}
            placeholder="Université / École" className={inputClass("diplomaInstitution")} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm font-semibold text-gray-700 mb-1 block">Année d'obtention</Label>
          <Input type="number" value={form.diplomaYear} onChange={e => set("diplomaYear", e.target.value)}
            placeholder="Ex: 2020" min="1990" max="2025" className={inputClass("diplomaYear")} />
        </div>
        <div>
          <Label className="text-sm font-semibold text-gray-700 mb-1 block">Domaine d'études</Label>
          <Input value={form.fieldOfStudy} onChange={e => set("fieldOfStudy", e.target.value)}
            placeholder="Ex: Informatique, Médecine..." className={inputClass("fieldOfStudy")} />
        </div>
      </div>
    </div>
  );
}

// ─── Étape 4 : Emploi ─────────────────────────────────────────────────────────

function Step4Employment({ form, set, errors, inputClass }: StepProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-semibold text-gray-700 mb-1 block">Situation professionnelle actuelle *</Label>
        <Select value={form.employmentStatus} onValueChange={v => set("employmentStatus", v)}>
          <SelectTrigger className={inputClass("employmentStatus")}><SelectValue placeholder="Votre situation" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="salarie">Salarié(e) — CDI</SelectItem>
            <SelectItem value="salarie_cdd">Salarié(e) — CDD</SelectItem>
            <SelectItem value="independant">Travailleur indépendant / Freelance</SelectItem>
            <SelectItem value="entrepreneur">Chef d'entreprise / Entrepreneur</SelectItem>
            <SelectItem value="etudiant">Étudiant(e)</SelectItem>
            <SelectItem value="chomeur">En recherche d'emploi</SelectItem>
            <SelectItem value="retraite">Retraité(e)</SelectItem>
            <SelectItem value="autre">Autre</SelectItem>
          </SelectContent>
        </Select>
        {errors.employmentStatus && <p className="text-red-500 text-xs mt-1">{errors.employmentStatus}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm font-semibold text-gray-700 mb-1 block">Employeur actuel</Label>
          <Input value={form.currentEmployer} onChange={e => set("currentEmployer", e.target.value)}
            placeholder="Nom de l'entreprise" className={inputClass("currentEmployer")} />
        </div>
        <div>
          <Label className="text-sm font-semibold text-gray-700 mb-1 block">Poste occupé</Label>
          <Input value={form.currentJobTitle} onChange={e => set("currentJobTitle", e.target.value)}
            placeholder="Ex: Ingénieur logiciel" className={inputClass("currentJobTitle")} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm font-semibold text-gray-700 mb-1 block">Secteur d'activité</Label>
          <Select value={form.jobSector} onValueChange={v => set("jobSector", v)}>
            <SelectTrigger className={inputClass("jobSector")}><SelectValue placeholder="Secteur" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="informatique">Informatique / Tech</SelectItem>
              <SelectItem value="sante">Santé / Médical</SelectItem>
              <SelectItem value="education">Éducation / Formation</SelectItem>
              <SelectItem value="ingenierie">Ingénierie / BTP</SelectItem>
              <SelectItem value="finance">Finance / Banque</SelectItem>
              <SelectItem value="commerce">Commerce / Vente</SelectItem>
              <SelectItem value="agriculture">Agriculture</SelectItem>
              <SelectItem value="transport">Transport / Logistique</SelectItem>
              <SelectItem value="autre">Autre</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm font-semibold text-gray-700 mb-1 block">Années d'expérience</Label>
          <Select value={form.experienceYears} onValueChange={v => set("experienceYears", v)}>
            <SelectTrigger className={inputClass("experienceYears")}><SelectValue placeholder="Expérience" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Aucune expérience</SelectItem>
              <SelectItem value="1">Moins d'1 an</SelectItem>
              <SelectItem value="2">1 à 2 ans</SelectItem>
              <SelectItem value="4">3 à 5 ans</SelectItem>
              <SelectItem value="7">6 à 10 ans</SelectItem>
              <SelectItem value="11">Plus de 10 ans</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label className="text-sm font-semibold text-gray-700 mb-1 block">Compétences linguistiques</Label>
        <div className="grid grid-cols-2 gap-2">
          {["Français (courant)", "Anglais (courant)", "Anglais (intermédiaire)", "Allemand", "Polonais", "Arabe"].map(lang => (
            <label key={lang} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.languageSkills.includes(lang)}
                onChange={e => {
                  const langs = form.languageSkills ? form.languageSkills.split(",").filter(Boolean) : [];
                  if (e.target.checked) set("languageSkills", [...langs, lang].join(","));
                  else set("languageSkills", langs.filter(l => l !== lang).join(","));
                }}
                className="rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-700">{lang}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Étape 5 : Finances ───────────────────────────────────────────────────────

function Step5Finances({ form, set, errors, inputClass }: StepProps) {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
        <strong>Pourquoi ces informations ?</strong> Les ambassades exigent la preuve de ressources suffisantes pour couvrir votre séjour. Ces données restent strictement confidentielles.
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm font-semibold text-gray-700 mb-1 block">Revenu mensuel net</Label>
          <Input type="number" value={form.monthlyIncome} onChange={e => set("monthlyIncome", e.target.value)}
            placeholder="Ex: 250000" className={inputClass("monthlyIncome")} />
        </div>
        <div>
          <Label className="text-sm font-semibold text-gray-700 mb-1 block">Devise</Label>
          <Select value={form.incomeCurrency} onValueChange={v => set("incomeCurrency", v)}>
            <SelectTrigger className={inputClass("incomeCurrency")}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="XAF">FCFA (XAF)</SelectItem>
              <SelectItem value="EUR">Euro (EUR)</SelectItem>
              <SelectItem value="USD">Dollar (USD)</SelectItem>
              <SelectItem value="CAD">Dollar CA (CAD)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm font-semibold text-gray-700 mb-1 block">Solde bancaire disponible</Label>
          <Input type="number" value={form.bankBalance} onChange={e => set("bankBalance", e.target.value)}
            placeholder="Ex: 1500000" className={inputClass("bankBalance")} />
        </div>
        <div>
          <Label className="text-sm font-semibold text-gray-700 mb-1 block">Devise</Label>
          <Select value={form.bankBalanceCurrency} onValueChange={v => set("bankBalanceCurrency", v)}>
            <SelectTrigger className={inputClass("bankBalanceCurrency")}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="XAF">FCFA (XAF)</SelectItem>
              <SelectItem value="EUR">Euro (EUR)</SelectItem>
              <SelectItem value="USD">Dollar (USD)</SelectItem>
              <SelectItem value="CAD">Dollar CA (CAD)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
          <input
            type="checkbox"
            checked={form.hasSponsorship}
            onChange={e => set("hasSponsorship", e.target.checked)}
            className="rounded border-gray-300 text-blue-600 w-4 h-4"
          />
          <span className="text-sm font-medium text-gray-700">J'ai un garant / sponsor financier</span>
        </label>
      </div>
      {form.hasSponsorship && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-1 block">Nom du garant</Label>
            <Input value={form.sponsorName} onChange={e => set("sponsorName", e.target.value)}
              placeholder="Nom complet" className={inputClass("sponsorName")} />
          </div>
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-1 block">Lien de parenté</Label>
            <Input value={form.sponsorRelation} onChange={e => set("sponsorRelation", e.target.value)}
              placeholder="Ex: Parent, Ami, Employeur" className={inputClass("sponsorRelation")} />
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ─── Étape 6 : Famille ────────────────────────────────────────────────────────

function Step6Family({ form, set, errors, inputClass }: StepProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm font-semibold text-gray-700 mb-1 block">Nombre d'enfants</Label>
          <Select value={form.numberOfChildren} onValueChange={v => set("numberOfChildren", v)}>
            <SelectTrigger className={inputClass("numberOfChildren")}><SelectValue /></SelectTrigger>
            <SelectContent>
              {[0,1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
              <SelectItem value="6">6 ou plus</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm font-semibold text-gray-700 mb-1 block">Nom du conjoint(e)</Label>
          <Input value={form.spouseFullName} onChange={e => set("spouseFullName", e.target.value)}
            placeholder="Si marié(e)" className={inputClass("spouseFullName")} />
        </div>
      </div>
      <div>
        <Label className="text-sm font-semibold text-gray-700 mb-1 block">Nationalité du conjoint(e)</Label>
        <Input value={form.spouseNationality} onChange={e => set("spouseNationality", e.target.value)}
          placeholder="Ex: Française, Canadienne..." className={inputClass("spouseNationality")} />
      </div>
      <div>
        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
          <input
            type="checkbox"
            checked={form.familyMemberInDestination}
            onChange={e => set("familyMemberInDestination", e.target.checked)}
            className="rounded border-gray-300 text-blue-600 w-4 h-4"
          />
          <span className="text-sm font-medium text-gray-700">J'ai un membre de famille dans le pays de destination</span>
        </label>
      </div>
      {form.familyMemberInDestination && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-1 block">Lien de parenté</Label>
            <Select value={form.familyMemberRelation} onValueChange={v => set("familyMemberRelation", v)}>
              <SelectTrigger className={inputClass("familyMemberRelation")}><SelectValue placeholder="Relation" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="conjoint">Conjoint(e)</SelectItem>
                <SelectItem value="parent">Parent (père/mère)</SelectItem>
                <SelectItem value="enfant">Enfant</SelectItem>
                <SelectItem value="frere_soeur">Frère / Sœur</SelectItem>
                <SelectItem value="autre">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-1 block">Statut dans le pays</Label>
            <Select value={form.familyMemberStatus} onValueChange={v => set("familyMemberStatus", v)}>
              <SelectTrigger className={inputClass("familyMemberStatus")}><SelectValue placeholder="Statut" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="citoyen">Citoyen</SelectItem>
                <SelectItem value="resident_permanent">Résident permanent</SelectItem>
                <SelectItem value="etudiant">Étudiant</SelectItem>
                <SelectItem value="travailleur">Travailleur (visa)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ─── Étape 7 : Documents ──────────────────────────────────────────────────────

function Step7Documents({
  form, uploadingDoc, onUpload,
}: {
  form: FormData;
  uploadingDoc: string | null;
  onUpload: (type: string, file: File) => void;
}) {
  const relevantDocs = DOCUMENT_TYPES.filter(
    d => !d.visas || (form.visaType && d.visas.includes(form.visaType as VisaCategory))
  );

  return (
    <div className="space-y-3">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
        <strong>Documents requis pour votre visa {form.visaType}.</strong> Formats acceptés : PDF, JPG, PNG (max 10 Mo). Les documents marqués * sont obligatoires.
      </div>
      <div className="space-y-2">
        {relevantDocs.map(doc => {
          const uploaded = form.documents.find(d => d.type === doc.type);
          const isUploading = uploadingDoc === doc.type;
          return (
            <div key={doc.type} className={`flex items-center justify-between p-3 rounded-lg border ${
              uploaded ? "border-green-300 bg-green-50" : "border-gray-200 bg-gray-50"
            }`}>
              <div className="flex items-center gap-2 min-w-0">
                {uploaded ? (
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                ) : (
                  <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <span className="text-sm font-medium text-gray-700 truncate block">
                    {doc.label} {doc.required && <span className="text-red-500">*</span>}
                  </span>
                  {uploaded && <span className="text-xs text-green-600 truncate block">{uploaded.name}</span>}
                </div>
              </div>
              <label className={`flex-shrink-0 ml-2 cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                uploaded
                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}>
                {isUploading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Upload className="w-3 h-3" />
                )}
                {isUploading ? "..." : uploaded ? "Remplacer" : "Téléverser"}
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  disabled={isUploading}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) onUpload(doc.type, file);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-500 text-center">Vous pourrez compléter les documents manquants après le paiement.</p>
    </div>
  );
}

// ─── Types partagés ───────────────────────────────────────────────────────────

interface StepProps {
  form: FormData;
  set: (field: keyof FormData, value: unknown) => void;
  errors: Record<string, string>;
  inputClass: (field: string) => string;
}
