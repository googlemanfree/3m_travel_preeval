import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getEvaluationDocumentRequirements } from "@/data/evaluationDocumentCatalogue";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import { useLocation } from "wouter";
import { CheckCircle2, ChevronLeft, ChevronRight, ClipboardList, FileText, MailCheck, MessageCircleMore } from "lucide-react";

type ProjectType = "travail" | "etudes" | "tourisme";

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
  languages?: string;
  financialGuarantee?: string;
  visitReason?: string;
  travelHistory?: string;
  socialTies?: string;
  cvLink?: string;
  canadaLanguageTest?: string;
  canadaStudyPlan?: string;
  luxEmployerStatus?: "aucun" | "candidatures" | "contact" | "offre";
  luxAademStatus?: string;
};

type CountryOption = { value: string; label: string; flag: string; hint: string };

const STEPS = [
  { label: "Profil", description: "Vos coordonnées" },
  { label: "Projet", description: "Pays et objectif" },
  { label: "Critères", description: "Questions ciblées" },
  { label: "Checklist", description: "Pièces à préparer" },
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
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  const projectParam = searchParams.get("project") as ProjectType | null;
  const destinationParam = searchParams.get("destination") || "";
  const initialProject = projectParam && ["travail", "etudes", "tourisme"].includes(projectParam) ? projectParam : "travail";
  const [currentStep, setCurrentStep] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccessVisible, setIsSuccessVisible] = React.useState(false);
  const [contactTouched, setContactTouched] = React.useState({ email: false, whatsappPhone: false });
  const [formData, setFormData] = React.useState<FormData>({ fullName: "", email: "", whatsappPhone: "", nationality: "", destinationCountry: destinationParam, projectType: initialProject });

  const isEmailValid = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  const isWhatsappValid = (value: string) => { const digits = value.replace(/\D/g, ""); return digits.length >= 8 && digits.length <= 15; };
  const emailError = contactTouched.email && formData.email.length > 0 && !isEmailValid(formData.email);
  const whatsappError = contactTouched.whatsappPhone && formData.whatsappPhone.length > 0 && !isWhatsappValid(formData.whatsappPhone);
  const requirements = formData.destinationCountry ? getEvaluationDocumentRequirements(formData.destinationCountry, formData.projectType) : [];
  const progress = Math.round(((currentStep + 1) / STEPS.length) * 100);

  React.useEffect(() => {
    if (projectParam && ["travail", "etudes", "tourisme"].includes(projectParam)) setFormData((prev) => ({ ...prev, projectType: projectParam }));
    if (destinationParam) setFormData((prev) => ({ ...prev, destinationCountry: destinationParam }));
  }, [destinationParam, projectParam]);

  const submitEvaluation = trpc.evaluation.submitEvaluation.useMutation({
    onSuccess: () => {
      toast.success("Évaluation soumise avec succès. Vérifiez votre e-mail.");
      setIsSuccessVisible(true);
    },
    onError: (error: { message?: string }) => toast.error(error.message || "Erreur lors de la soumission"),
  });

  const update = (name: keyof FormData, value: string) => setFormData((prev) => ({ ...prev, [name]: value }));
  const onTextChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => update(event.target.name as keyof FormData, event.target.value);

  const validateStep = (step: number) => {
    if (step === 0) {
      setContactTouched({ email: true, whatsappPhone: true });
      if (!formData.fullName || !formData.email || !formData.whatsappPhone || !formData.nationality || !isEmailValid(formData.email) || !isWhatsappValid(formData.whatsappPhone)) {
        toast.error("Complétez vos coordonnées avec un e-mail et un WhatsApp valides.");
        return false;
      }
    }
    if (step === 1 && !formData.destinationCountry) {
      toast.error("Sélectionnez le pays de destination afin d’afficher la checklist adaptée.");
      return false;
    }
    return true;
  };

  const next = () => { if (validateStep(currentStep)) setCurrentStep((step) => Math.min(step + 1, STEPS.length - 1)); };
  const previous = () => setCurrentStep((step) => Math.max(step - 1, 0));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateStep(0) || !validateStep(1)) return;
    setIsSubmitting(true);
    try {
      await submitEvaluation.mutateAsync({
        ...formData,
        age: formData.age ? Number(formData.age) : undefined,
        yearsOfExperience: formData.yearsOfExperience ? Number(formData.yearsOfExperience) : undefined,
        destinationCategory: categoryForCountry(formData.destinationCountry),
      });
    } finally { setIsSubmitting(false); }
  };

  const summary = `Bonjour 3M Travel, voici mon projet :\n- Nom : ${formData.fullName || "Non renseigné"}\n- Destination : ${formData.destinationCountry || "Non renseignée"}\n- Projet : ${formData.projectType}\n- Secteur / filière : ${formData.sector || "Non renseigné"}`;

  return (
    <motion.div className="w-full max-w-2xl mx-auto" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
      <Card className="border border-slate-100 bg-white p-5 shadow-xl sm:p-8">
        <div className="mb-7">
          <div className="flex items-end justify-between gap-3"><div><h2 className="text-2xl font-black text-slate-950">Évaluation guidée</h2><p className="mt-1 text-sm text-slate-600">Un parcours adapté à votre pays et à votre projet.</p></div><span className="text-sm font-bold text-blue-800">{progress}%</span></div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Progression de l’évaluation" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
            <motion.div className="h-full rounded-full bg-gradient-to-r from-[#0B2A52] via-blue-700 to-[#D8A928]" initial={false} animate={{ width: `${progress}%` }} transition={{ duration: 0.32, ease: "easeOut" }} />
          </div>
          <ol className="mt-4 grid grid-cols-4 gap-1" aria-label="Étapes de l’évaluation">
            {STEPS.map((step, index) => <li key={step.label} className="text-center"><span className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${index < currentStep ? "bg-emerald-600 text-white" : index === currentStep ? "bg-[#0B2A52] text-white ring-4 ring-blue-100" : "bg-slate-100 text-slate-500"}`}>{index < currentStep ? <CheckCircle2 className="h-4 w-4" /> : index + 1}</span><span className="mt-1 block text-[10px] font-bold text-slate-600 sm:text-xs">{step.label}</span></li>)}
          </ol>
        </div>

        {isSuccessVisible ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center" role="status" aria-live="polite"><CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" /><h3 className="mt-3 text-xl font-black text-emerald-950">Votre évaluation a été transmise</h3><p className="mt-2 text-sm leading-6 text-emerald-900">Un conseiller examinera les éléments communiqués. Cette pré-évaluation ne constitue pas une décision de visa, d’admission ou d’emploi.</p><Button type="button" className="mt-5 bg-emerald-700 text-white hover:bg-emerald-800" onClick={() => { setIsSuccessVisible(false); setCurrentStep(0); }}>Envoyer une autre évaluation</Button></div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <AnimatePresence mode="wait" initial={false}>
              <motion.section key={currentStep} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.2, ease: "easeOut" }} aria-labelledby={`evaluation-step-${currentStep}`}>
                <h3 id={`evaluation-step-${currentStep}`} className="mb-1 text-lg font-black text-slate-950">{STEPS[currentStep].label}</h3><p className="mb-5 text-sm text-slate-600">{STEPS[currentStep].description}</p>
                {currentStep === 0 && <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Nom complet *"><Input name="fullName" value={formData.fullName} onChange={onTextChange} placeholder="Jean Dupont" /></Field>
                  <Field label="Nationalité *"><Input name="nationality" value={formData.nationality} onChange={onTextChange} placeholder="Camerounaise" /></Field>
                  <Field label="E-mail *" hint={emailError ? "Saisissez une adresse e-mail valide." : undefined}><Input name="email" type="email" value={formData.email} onChange={onTextChange} onBlur={() => setContactTouched((prev) => ({ ...prev, email: true }))} aria-invalid={emailError} className={emailError ? "border-red-500" : ""} placeholder="nom@domaine.com" /></Field>
                  <Field label="WhatsApp *" hint={whatsappError ? "Saisissez entre 8 et 15 chiffres." : undefined}><Input name="whatsappPhone" value={formData.whatsappPhone} onChange={onTextChange} onBlur={() => setContactTouched((prev) => ({ ...prev, whatsappPhone: true }))} aria-invalid={whatsappError} className={whatsappError ? "border-red-500" : ""} placeholder="+237 6XX XXX XXX" /></Field>
                  <Field label="Âge"><Input name="age" type="number" min="16" max="100" value={formData.age || ""} onChange={onTextChange} placeholder="Ex. 28" /></Field>
                </div>}
                {currentStep === 1 && <div className="space-y-5">
                  <Field label="Type de projet *"><Select value={formData.projectType} onValueChange={(value) => setFormData((prev) => ({ ...prev, projectType: value as ProjectType, destinationCountry: "" }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="travail">Travail / professionnel</SelectItem><SelectItem value="etudes">Études</SelectItem><SelectItem value="tourisme">Tourisme / visite</SelectItem></SelectContent></Select></Field>
                  <Field label="Pays de destination *"><Select value={formData.destinationCountry} onValueChange={(value) => update("destinationCountry", value)}><SelectTrigger><SelectValue placeholder="Sélectionner un pays" /></SelectTrigger><SelectContent>{COUNTRIES_BY_PROJECT[formData.projectType].map((country) => <SelectItem key={country.value} value={country.value}>{country.flag} {country.label} — {country.hint}</SelectItem>)}</SelectContent></Select></Field>
                  {formData.destinationCountry && <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-950"><strong>Repère pour {formData.destinationCountry} :</strong> {COUNTRY_GUIDANCE[formData.destinationCountry]}</div>}
                </div>}
                {currentStep === 2 && <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {formData.projectType === "travail" && <><Field label="Secteur ou métier visé"><Input name="sector" value={formData.sector || ""} onChange={onTextChange} placeholder="Ex. logistique, soins, informatique" /></Field><Field label="Années d’expérience"><Input name="yearsOfExperience" type="number" min="0" value={formData.yearsOfExperience || ""} onChange={onTextChange} placeholder="Ex. 5" /></Field><Field label="Niveaux de langue" full><Input name="languages" value={formData.languages || ""} onChange={onTextChange} placeholder="Français, anglais, test déjà passé…" /></Field></>}
                  {formData.projectType === "etudes" && <><Field label="Niveau d’études"><Select value={formData.educationLevel || ""} onValueChange={(value) => update("educationLevel", value)}><SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger><SelectContent><SelectItem value="bac">Baccalauréat</SelectItem><SelectItem value="licence">Licence</SelectItem><SelectItem value="master">Master</SelectItem></SelectContent></Select></Field><Field label="Filière / programme envisagé"><Input name="sector" value={formData.sector || ""} onChange={onTextChange} placeholder="Ex. informatique, santé…" /></Field><Field label="Financement prévu" full><Input name="financialGuarantee" value={formData.financialGuarantee || ""} onChange={onTextChange} placeholder="Épargne, garant, bourse…" /></Field></>}
                  {formData.projectType === "tourisme" && <><Field label="Motif du séjour"><Input name="visitReason" value={formData.visitReason || ""} onChange={onTextChange} placeholder="Visite familiale, tourisme, événement…" /></Field><Field label="Historique de voyages"><Input name="travelHistory" value={formData.travelHistory || ""} onChange={onTextChange} placeholder="Pays visités et années" /></Field><Field label="Attaches dans le pays de résidence" full><Textarea name="socialTies" value={formData.socialTies || ""} onChange={onTextChange} placeholder="Emploi, études, famille ou autres obligations" /></Field></>}
                  {formData.destinationCountry === "Canada" && <div className="md:col-span-2 rounded-xl border border-red-100 bg-red-50 p-4"><h4 className="font-black text-red-950">Questions Canada</h4><div className="mt-3 grid gap-4 md:grid-cols-2"><Field label="Test de langue ou niveau estimé"><Input name="canadaLanguageTest" value={formData.canadaLanguageTest || ""} onChange={onTextChange} placeholder="TEF, IELTS, niveau estimé…" /></Field>{formData.projectType === "etudes" && <Field label="Projet d’études"><Input name="canadaStudyPlan" value={formData.canadaStudyPlan || ""} onChange={onTextChange} placeholder="Programme et objectif professionnel" /></Field>}</div><p className="mt-3 text-xs text-red-900">Ces réponses servent à préparer un entretien ; elles ne confirment aucune admissibilité ou décision.</p></div>}
                  {formData.destinationCountry === "Luxembourg" && <div className="md:col-span-2 rounded-xl border border-amber-100 bg-amber-50 p-4"><h4 className="font-black text-amber-950">Questions Luxembourg</h4><div className="mt-3 grid gap-4 md:grid-cols-2"><Field label="Situation vis-à-vis d’un employeur"><Select value={formData.luxEmployerStatus || ""} onValueChange={(value) => update("luxEmployerStatus", value)}><SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger><SelectContent><SelectItem value="aucun">Aucun employeur identifié</SelectItem><SelectItem value="candidatures">Candidatures en cours</SelectItem><SelectItem value="contact">Contact ou entretien en cours</SelectItem><SelectItem value="offre">Offre ou proposition reçue</SelectItem></SelectContent></Select></Field><Field label="Situation ADEM / autorisation"><Input name="luxAademStatus" value={formData.luxAademStatus || ""} onChange={onTextChange} placeholder="À confirmer avec le conseiller" /></Field></div><p className="mt-3 text-xs text-amber-900">Toute procédure liée à un employeur, à l’ADEM ou à une autorisation reste soumise aux règles officielles et à validation humaine.</p></div>}
                </div>}
                {currentStep === 3 && <div className="space-y-5"><div className="rounded-2xl border border-[#D8A928]/35 bg-amber-50/70 p-4"><div className="flex gap-3"><ClipboardList className="mt-0.5 h-5 w-5 shrink-0 text-[#9A7200]" /><div><h4 className="font-black text-slate-950">Catalogue documentaire — {formData.destinationCountry || "sélectionnez un pays"}</h4><p className="mt-1 text-sm text-slate-600">Préparez ces pièces à l’avance. La liste finale est confirmée par l’équipe selon votre cas et la procédure officielle.</p></div></div><div className="mt-4 grid gap-2 sm:grid-cols-2">{requirements.map((item) => <div key={`${item.category}-${item.label}`} className="rounded-xl border border-amber-100 bg-white p-3"><span className="text-[11px] font-black uppercase tracking-wide text-[#9A7200]">{item.category} · {item.priority}</span><p className="mt-1 flex gap-2 text-sm font-bold text-slate-900"><FileText className="h-4 w-4 shrink-0 text-blue-700" />{item.label}</p><p className="mt-1 text-xs leading-5 text-slate-600">{item.detail}</p></div>)}</div></div><Field label="Lien vers votre CV (optionnel)"><Input name="cvLink" type="url" value={formData.cvLink || ""} onChange={onTextChange} placeholder="https://drive.google.com/..." /></Field><p className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">En soumettant, vous demandez une pré-évaluation. Les pièces ne doivent être transmises que via les canaux indiqués par l’équipe ; aucune décision officielle n’est garantie.</p></div>}
              </motion.section>
            </AnimatePresence>
            <div className="mt-7 flex items-center justify-between gap-3 border-t border-slate-100 pt-5"><Button type="button" variant="outline" onClick={previous} disabled={currentStep === 0} className="gap-2"><ChevronLeft className="h-4 w-4" />Précédent</Button>{currentStep < STEPS.length - 1 ? <Button type="button" onClick={next} className="gap-2 bg-[#0B2A52] text-white hover:bg-[#163d73]">Continuer<ChevronRight className="h-4 w-4" /></Button> : <Button type="submit" disabled={isSubmitting} className="bg-[#D8A928] text-slate-950 hover:bg-[#c6971f]">{isSubmitting ? "Envoi…" : "Soumettre l’évaluation"}</Button>}</div>
          </form>
        )}
        {!isSuccessVisible && <div className="mt-5 grid gap-2 sm:grid-cols-2"><button type="button" onClick={() => window.open(`https://wa.me/237698104832?text=${encodeURIComponent(summary)}`, "_blank")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition-transform duration-150 hover:-translate-y-0.5 hover:bg-emerald-700 active:scale-[0.98]"><MessageCircleMore className="h-4 w-4" />Partager au conseiller WhatsApp</button><button type="button" onClick={async () => { try { await navigator.clipboard.writeText(summary); toast.success("Récapitulatif copié"); } catch { toast.error("Copie non disponible sur cet appareil"); } }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-3 text-sm font-bold text-white transition-transform duration-150 hover:-translate-y-0.5 hover:bg-slate-900 active:scale-[0.98]"><MailCheck className="h-4 w-4" />Copier le récapitulatif</button></div>}
        <p className="mt-5 text-center text-xs text-slate-500">Évaluation gratuite · Réponse par un conseiller · Informations confidentielles</p>
      </Card>
    </motion.div>
  );
}

function Field({ label, hint, full, children }: { label: string; hint?: string; full?: boolean; children: React.ReactNode }) {
  return <div className={full ? "md:col-span-2" : ""}><Label className="font-semibold text-slate-800">{label}</Label><div className="mt-2">{children}</div>{hint && <p className="mt-1 text-xs font-medium text-red-600">{hint}</p>}</div>;
}
