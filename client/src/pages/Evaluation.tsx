import { useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, Loader, AlertCircle, Sparkles, FileText, Upload, X, ExternalLink } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { motion } from 'framer-motion';
import { DestinationAutocomplete } from '@/components/DestinationAutocomplete';
import Cropper, { type Area } from 'react-easy-crop';
import { createCroppedCvFile, type CropPixels } from '@/lib/cvImageCrop';
import { isEvaluationProjectType, PROJECT_EVALUATION_CONFIG, type EvaluationProjectType } from '@/lib/projectEvaluationConfig';
import { getCountriesForProject, getDestinationOptionsForProject, getCountryProcedureFields, getProcedureById, getProceduresForCountry, getSuggestedDestinationCategory, type ProcedureGuide } from '@/lib/destinationProcedureCatalog';

interface FormState {
  fullName: string; email: string; phone: string; dateOfBirth: string; nationality: string;
  cityOfResidence: string; maritalStatus: string; numberOfDependents: string;
  educationLevel: string; diplomaTitle: string; graduationYear: string; fieldOfStudy: string;
  employmentStatus: string; currentJobTitle: string; yearsOfExperience: string; industrySector: string; mainTasks: string;
  frenchLevel: string; englishLevel: string; languageTestsTaken: string;
  destinationCategory: string; destinationCountry: string; visaType: string; travelReason: string; availableBudget: string;
  projectType: EvaluationProjectType; projectDetails: Record<string, string>;
  priorVisaRefusal: boolean; priorVisaRefusalCountry: string; criminalRecord: boolean; familyAbroad: boolean;
  message: string;
}

const initialForm: FormState = {
  fullName: '', email: '', phone: '', dateOfBirth: '', nationality: '',
  cityOfResidence: '', maritalStatus: '', numberOfDependents: '',
  educationLevel: '', diplomaTitle: '', graduationYear: '', fieldOfStudy: '',
  employmentStatus: '', currentJobTitle: '', yearsOfExperience: '', industrySector: '', mainTasks: '',
  frenchLevel: '', englishLevel: '', languageTestsTaken: '',
  destinationCategory: 'canada', destinationCountry: '', visaType: 'canada_rp', travelReason: '', availableBudget: '',
  projectType: 'immigration', projectDetails: {},
  priorVisaRefusal: false, priorVisaRefusalCountry: '', criminalRecord: false, familyAbroad: false,
  message: '',
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-bold text-blue-900 mb-4 mt-8 first:mt-0 border-b border-blue-100 pb-2">{children}</h2>;
}

function PrefillLabel({ children, active }: { children: React.ReactNode; active: boolean }) {
  return <div className="flex min-h-5 items-center justify-between gap-2"><Label>{children}</Label>{active && <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-800"><Sparkles className="h-3 w-3" />Pré-rempli depuis le CV</span>}</div>;
}

function ProjectDetailsSection({ projectType, values, onChange, countryFields, procedure }: { projectType: EvaluationProjectType; values: Record<string, string>; onChange: (key: string, value: string) => void; countryFields: ReturnType<typeof getCountryProcedureFields>; procedure?: ProcedureGuide }) {
  const config = PROJECT_EVALUATION_CONFIG[projectType];
  const fields = [...config.requiredDetails, ...countryFields.filter((field) => field.key !== 'selectedProcedure')];
  return <section className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4 md:p-5" aria-labelledby="project-details-title">
    <div className="mb-4">
      <p className="text-xs font-bold uppercase tracking-wide text-blue-700">{config.subtitle}</p>
      <h2 id="project-details-title" className="mt-1 text-lg font-bold text-slate-900">Informations utiles pour votre projet {config.label}</h2>
      <p className="mt-1 text-sm leading-6 text-slate-600">{config.objective}</p>
      <p className="mt-3 rounded-lg border border-blue-100 bg-white/80 px-3 py-2 text-xs leading-5 text-slate-700"><strong>Dossier à préparer :</strong> {config.dossierHint}</p>
      {procedure && <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-950">
        <span><strong>Référence sélectionnée :</strong> {procedure.procedureLabel} — {procedure.country}</span>
        {procedure.guideUrl && <a href={procedure.guideUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-emerald-800 underline underline-offset-2"><FileText className="h-3.5 w-3.5" />Consulter le guide 3M<ExternalLink className="h-3 w-3" /></a>}
      </div>}
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => <div key={field.key} className={field.kind === 'textarea' ? 'sm:col-span-2' : ''}>
        <Label htmlFor={`project-${field.key}`}>{field.label}{field.required ? ' *' : ''}</Label>
        {field.kind === 'select' ? <select id={`project-${field.key}`} value={values[field.key] ?? ''} onChange={(event) => onChange(field.key, event.target.value)} className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Sélectionner…</option>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : field.kind === 'textarea' ? <Textarea id={`project-${field.key}`} value={values[field.key] ?? ''} onChange={(event) => onChange(field.key, event.target.value)} placeholder={field.placeholder} rows={3} className="mt-1 bg-white" /> : <Input id={`project-${field.key}`} type={field.kind === 'date' ? 'date' : 'text'} value={values[field.key] ?? ''} onChange={(event) => onChange(field.key, event.target.value)} placeholder={field.placeholder} className="mt-1 bg-white" />}
      </div>)}
    </div>
  </section>;
}

export default function Evaluation() {
  const projectFromUrl = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('project');
  const initialProject = isEvaluationProjectType(projectFromUrl) ? projectFromUrl : initialForm.projectType;
  const initialProjectForm = { ...initialForm, projectType: initialProject, visaType: PROJECT_EVALUATION_CONFIG[initialProject].recommendedVisaTypes[0] ?? initialForm.visaType };
  const [form, setForm] = useState<FormState>(initialProjectForm);
  const formRef = useRef<FormState>(initialProjectForm);
  const acquisitionParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const rawSource = acquisitionParams.get("source")?.toLowerCase();
  const acquisitionSource = rawSource === "whatsapp" || rawSource === "wa" ? "whatsapp" : rawSource === "facebook" || rawSource === "fb" ? "facebook" : "direct";
  const acquisitionCampaign = acquisitionParams.get("campaign") || acquisitionParams.get("campagne") || undefined;
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [formError, setFormError] = useState('');
  const [isExtractingCv, setIsExtractingCv] = useState(false);
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());
  const [autoFilledValues, setAutoFilledValues] = useState<Partial<FormState>>({});
  const [prefillOriginalValues, setPrefillOriginalValues] = useState<Partial<FormState>>({});
  const [cvAnalysisNotice, setCvAnalysisNotice] = useState('');
  const [isPreparingCv, setIsPreparingCv] = useState(false);
  const [pdfPageCount, setPdfPageCount] = useState(0);
  const [selectedPdfPages, setSelectedPdfPages] = useState<number[]>([]);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [cropZoom, setCropZoom] = useState(1);
  const [cropPixels, setCropPixels] = useState<CropPixels | null>(null);
  const [customDestinationMode, setCustomDestinationMode] = useState(false);

  const submitMutation = trpc.evaluation.submit.useMutation();
  const extractCvMutation = trpc.evaluation.extractFromCV.useMutation();
  const inspectPdfMutation = trpc.evaluation.inspectPdfPages.useMutation();
  const availableCountries = getCountriesForProject(form.projectType);
  const destinationOptions = getDestinationOptionsForProject(form.projectType);
  const isLibraryCountry = availableCountries.includes(form.destinationCountry);
  const availableProcedures = form.destinationCountry ? getProceduresForCountry(form.projectType, form.destinationCountry) : [];
  const selectedProcedure = getProcedureById(form.projectDetails.procedureId);
  const countryProcedureFields = getCountryProcedureFields(form.projectType, form.destinationCountry, selectedProcedure);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    const next = { ...formRef.current, [key]: value };
    formRef.current = next;
    setForm(next);
  };

  const updateProjectDetails = (key: string, value: string) => update('projectDetails', { ...formRef.current.projectDetails, [key]: value });

  const selectProjectType = (projectType: EvaluationProjectType) => {
    const recommendedVisa = PROJECT_EVALUATION_CONFIG[projectType].recommendedVisaTypes[0];
    const next = { ...formRef.current, projectType, projectDetails: {}, destinationCountry: '', destinationCategory: 'autre', visaType: recommendedVisa ?? formRef.current.visaType };
    formRef.current = next;
    setForm(next);
    setCustomDestinationMode(false);
  };

  const selectDestinationCountry = (country: string) => {
    const procedures = getProceduresForCountry(formRef.current.projectType, country);
    const procedure = procedures[0];
    const next = {
      ...formRef.current,
      destinationCountry: country,
      destinationCategory: getSuggestedDestinationCategory(country),
      projectDetails: procedure ? { procedureId: procedure.id, selectedProcedure: procedure.procedureLabel } : {},
    };
    formRef.current = next;
    setForm(next);
    setCustomDestinationMode(false);
  };

  const chooseCustomDestination = () => {
    const next = { ...formRef.current, destinationCountry: '', destinationCategory: 'autre', projectDetails: {} };
    formRef.current = next;
    setForm(next);
    setCustomDestinationMode(true);
  };

  const selectProcedure = (procedureId: string) => {
    const procedure = getProcedureById(procedureId);
    update('projectDetails', {
      ...formRef.current.projectDetails,
      procedureId,
      selectedProcedure: procedure?.procedureLabel ?? '',
    });
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const prefillKeys: Array<keyof Pick<FormState, 'educationLevel' | 'diplomaTitle' | 'graduationYear' | 'fieldOfStudy' | 'employmentStatus' | 'currentJobTitle' | 'yearsOfExperience' | 'industrySector' | 'mainTasks' | 'frenchLevel' | 'englishLevel' | 'languageTestsTaken'>> = [
    'educationLevel', 'diplomaTitle', 'graduationYear', 'fieldOfStudy', 'employmentStatus', 'currentJobTitle', 'yearsOfExperience', 'industrySector', 'mainTasks', 'frenchLevel', 'englishLevel', 'languageTestsTaken',
  ];
  const prefillClass = (field: (typeof prefillKeys)[number]) => autoFilledFields.has(field) ? 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-200 focus-visible:ring-indigo-500' : '';
  const getCvMimeType = (file: File) => file.type || (file.name.toLowerCase().endsWith('.png') ? 'image/png' : file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg') ? 'image/jpeg' : 'application/pdf');

  const extractAndAutoFill = async (file: File, selectedPages?: number[]) => {
    setIsExtractingCv(true);
    setCvAnalysisNotice('');
    try {
      const result = await extractCvMutation.mutateAsync({ cvBase64: await fileToBase64(file), cvMimeType: getCvMimeType(file) as 'application/pdf' | 'image/png' | 'image/jpeg', selectedPages });
      if (!result.success) {
        const analysisMessage = 'message' in result ? result.message : undefined;
        setCvAnalysisNotice(analysisMessage || 'Le CV est joint. Vous pouvez compléter le formulaire manuellement.');
        return;
      }
      const filled = new Set<string>();
      const extracted = result.fields as Partial<Record<(typeof prefillKeys)[number], string>>;
      const originals: Partial<FormState> = {};
      const applied: Partial<FormState> = {};
      const next = { ...formRef.current };
      prefillKeys.forEach((key) => {
        const value = extracted[key]?.trim();
        const unchangedAiValue = autoFilledFields.has(key) && next[key] === autoFilledValues[key];
        if (value && (!next[key] || unchangedAiValue)) {
          originals[key] = unchangedAiValue ? (prefillOriginalValues[key] ?? '') : next[key];
          next[key] = value;
          applied[key] = value;
          filled.add(key);
        }
      });
      formRef.current = next;
      setForm(next);
      if (filled.size) {
        setAutoFilledFields((current) => new Set(Array.from(current).concat(Array.from(filled))));
        setAutoFilledValues((current) => ({ ...current, ...applied }));
        setPrefillOriginalValues((current) => ({ ...current, ...originals }));
        setCvAnalysisNotice('');
      } else {
        setCvAnalysisNotice('Aucun nouveau champ n’a été pré-rempli : vos saisies existantes sont conservées.');
      }
    } catch {
      setCvAnalysisNotice('L’analyse automatique n’est pas disponible. Votre CV reste joint et vous pouvez compléter le formulaire manuellement.');
    } finally {
      setIsExtractingCv(false);
    }
  };

  const clearCvTargeting = () => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setPdfPageCount(0);
    setSelectedPdfPages([]);
    setImagePreviewUrl('');
    setCropPosition({ x: 0, y: 0 });
    setCropZoom(1);
    setCropPixels(null);
  };

  const togglePdfPage = (page: number) => {
    setSelectedPdfPages((current) => current.includes(page) ? current.filter((value) => value !== page) : [...current, page].sort((a, b) => a - b));
  };

  const launchTargetedAnalysis = async () => {
    if (!cvFile) return;
    if (getCvMimeType(cvFile) === 'application/pdf') {
      if (!selectedPdfPages.length) {
        setCvAnalysisNotice('Sélectionnez au moins une page du CV avant l’analyse.');
        return;
      }
      await extractAndAutoFill(cvFile, selectedPdfPages);
      return;
    }
    if (!imagePreviewUrl || !cropPixels) {
      setCvAnalysisNotice('Ajustez la zone de recadrage avant de lancer l’OCR.');
      return;
    }
    try {
      await extractAndAutoFill(await createCroppedCvFile(imagePreviewUrl, cropPixels, cvFile.name));
    } catch {
      setCvAnalysisNotice('Le recadrage n’a pas pu être appliqué. Ajustez la zone puis réessayez.');
    }
  };

  const handleCvChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const accepted = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'].includes(getCvMimeType(file)) || /\.(pdf|png|jpe?g)$/i.test(file.name);
    if (!accepted) {
      setCvFile(null);
      setFormError('Le CV doit être au format PDF, JPG ou PNG.');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setCvFile(null);
      setFormError('Le CV ne doit pas dépasser 5 Mo.');
      event.target.value = '';
      return;
    }

    setFormError('');
    clearCvTargeting();
    setCvFile(file);
    if (getCvMimeType(file) === 'application/pdf') {
      setIsPreparingCv(true);
      setCvAnalysisNotice('Lecture du PDF en cours : choisissez les pages utiles avant l’analyse.');
      try {
        const inspected = await inspectPdfMutation.mutateAsync({ cvBase64: await fileToBase64(file) });
        setPdfPageCount(inspected.totalPages);
        setSelectedPdfPages([1]);
        setCvAnalysisNotice(`CV de ${inspected.totalPages} page(s) : sélectionnez les pages utiles, puis lancez l’analyse.`);
      } catch {
        setCvAnalysisNotice('Impossible de lire les pages du PDF. Vous pouvez remplacer le fichier ou compléter le formulaire manuellement.');
      } finally {
        setIsPreparingCv(false);
      }
    } else {
      setImagePreviewUrl(URL.createObjectURL(file));
      setCvAnalysisNotice('Recadrez l’image sur les rubriques utiles de votre CV, puis lancez l’OCR.');
    }
  };

  const removeCv = () => {
    setCvFile(null);
    clearCvTargeting();
    setAutoFilledFields(new Set());
    setAutoFilledValues({});
    setPrefillOriginalValues({});
    setCvAnalysisNotice('');
    const input = document.getElementById('cv-upload') as HTMLInputElement | null;
    if (input) input.value = '';
  };

  const reanalyzeCv = () => {
    if (!cvFile) {
      setCvAnalysisNotice('Choisissez un CV avant de lancer une analyse.');
      return;
    }
    void launchTargetedAnalysis();
  };

  const cancelAutoFill = () => {
    const next = { ...formRef.current };
    autoFilledFields.forEach((field) => {
      const key = field as (typeof prefillKeys)[number];
      if (next[key] === autoFilledValues[key]) next[key] = prefillOriginalValues[key] ?? '';
    });
    formRef.current = next;
    setForm(next);
    setAutoFilledFields(new Set());
    setAutoFilledValues({});
    setPrefillOriginalValues({});
    setCvAnalysisNotice('Le pré-remplissage a été annulé. Vos modifications manuelles sont conservées.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (form.fullName.trim().length < 3) return setFormError('Merci d\'indiquer votre nom complet.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setFormError('Adresse email invalide.');
    if (form.phone.trim().length < 8) return setFormError('Numéro de téléphone invalide.');
    if (!form.destinationCategory) return setFormError('Merci de sélectionner une destination.');
    if (!form.destinationCountry.trim()) return setFormError('Merci de sélectionner ou préciser le pays de destination.');
    const availableCountryProcedures = getProceduresForCountry(form.projectType, form.destinationCountry);
    if (availableCountryProcedures.length > 0 && !form.projectDetails.procedureId) return setFormError('Merci de sélectionner la procédure correspondant au pays choisi.');
    const selectedProcedure = getProcedureById(form.projectDetails.procedureId);
    const requiredProjectFields = [
      ...PROJECT_EVALUATION_CONFIG[form.projectType].requiredDetails,
      ...getCountryProcedureFields(form.projectType, form.destinationCountry, selectedProcedure),
    ];
    const missingProjectFields = requiredProjectFields.filter((field) => field.required && !form.projectDetails[field.key]?.trim());
    if (missingProjectFields.length) return setFormError(`Merci de compléter les informations requises pour votre projet : ${missingProjectFields.map((field) => field.label).join(', ')}.`);

    let cvBase64: string | undefined;
    if (cvFile) {
      try {
        cvBase64 = await fileToBase64(cvFile);
      } catch {
        setFormError('Erreur lors de la lecture du CV.');
        return;
      }
    }

    submitMutation.mutate({
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      dateOfBirth: form.dateOfBirth || undefined,
      nationality: form.nationality || undefined,
      cityOfResidence: form.cityOfResidence || undefined,
      maritalStatus: form.maritalStatus || undefined,
      numberOfDependents: form.numberOfDependents ? parseInt(form.numberOfDependents) : undefined,
      educationLevel: form.educationLevel || undefined,
      diplomaTitle: form.diplomaTitle || undefined,
      graduationYear: form.graduationYear || undefined,
      fieldOfStudy: form.fieldOfStudy || undefined,
      employmentStatus: form.employmentStatus || undefined,
      currentJobTitle: form.currentJobTitle || undefined,
      yearsOfExperience: form.yearsOfExperience || undefined,
      industrySector: form.industrySector || undefined,
      mainTasks: form.mainTasks || undefined,
      frenchLevel: form.frenchLevel || undefined,
      englishLevel: form.englishLevel || undefined,
      languageTestsTaken: form.languageTestsTaken || undefined,
      destinationCategory: form.destinationCategory as any,
      destinationCountry: form.destinationCountry || undefined,
      visaType: form.visaType as any,
      travelReason: form.travelReason || undefined,
      availableBudget: form.availableBudget || undefined,
      projectType: form.projectType,
      projectDetails: form.projectDetails,
      priorVisaRefusal: form.priorVisaRefusal,
      priorVisaRefusalCountry: form.priorVisaRefusalCountry || undefined,
      criminalRecord: form.criminalRecord,
      familyAbroad: form.familyAbroad,
      message: form.message || undefined,
      cvBase64,
      cvFileName: cvFile?.name,
      cvMimeType: cvFile?.type,
      acquisitionSource,
      acquisitionCampaign,
    });
  };

  if (submitMutation.data?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-blue-50 to-white">
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.32, ease: 'easeOut' }}
          className="w-full max-w-lg"
        >
          <Card className="p-8 text-center shadow-lg">
            <motion.div
              initial={{ scale: 0.5, rotate: -12 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.12 }}
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100"
            >
              <CheckCircle2 className="h-10 w-10 text-green-600" aria-hidden="true" />
            </motion.div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-green-700">Confirmation reçue</p>
            <h2 className="mb-3 text-2xl font-bold text-gray-900">Votre évaluation a bien été envoyée</h2>
            <p className="text-sm leading-6 text-gray-600">
              Merci pour votre confiance. Notre équipe analyse maintenant votre profil. Le résultat sera envoyé par email et disponible dans votre espace candidat.
            </p>
            <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-left text-sm text-blue-900" role="status" aria-live="polite">
              <strong>Prochaine étape :</strong> surveillez votre boîte email et votre espace candidat pour consulter votre rapport.
            </div>
            {submitMutation.data?.emailSent ? (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-left text-sm text-green-800" role="status">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span><strong>Confirmation envoyée.</strong> Un e-mail de réception a été envoyé à {form.email}.</span>
              </div>
            ) : (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-800" role="status">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Votre évaluation est enregistrée, mais l’e-mail de confirmation n’a pas pu être envoyé. Consultez votre espace candidat.</span>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
              <Sparkles className="w-3 h-3" /> Évaluation structurée du profil
            </span>
          <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-2">Évaluation complète de votre profil</h1>
          <p className="text-gray-600">Ces informations nous permettent d'évaluer votre éligibilité pour n'importe quelle destination — Canada RP, Europe, et bien d'autres.</p>
          {acquisitionSource !== "direct" && (
            <div className="mx-auto mt-4 max-w-xl rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-left text-sm text-cyan-950" role="status" aria-live="polite">
              <strong>Parcours identifié :</strong> {acquisitionSource === "whatsapp" ? "WhatsApp Business" : "Facebook"}{acquisitionCampaign ? ` — campagne « ${acquisitionCampaign} »` : ""}. Votre demande sera rattachée à ce contexte pour faciliter le suivi par notre équipe.
            </div>
          )}
        </div>

        <Card className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <SectionTitle>État civil & famille</SectionTitle>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Nom complet *</Label><Input value={form.fullName} onChange={(e) => update('fullName', e.target.value)} className="mt-1" /></div>
              <div><Label>Date de naissance</Label><Input type="date" value={form.dateOfBirth} onChange={(e) => update('dateOfBirth', e.target.value)} className="mt-1" /></div>
              <div><Label>Email *</Label><Input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className="mt-1" /></div>
              <div><Label>Téléphone *</Label><Input value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+237 6XX XXX XXX" className="mt-1" /></div>
              <div><Label>Nationalité</Label><Input value={form.nationality} onChange={(e) => update('nationality', e.target.value)} className="mt-1" /></div>
              <div><Label>Ville de résidence</Label><Input value={form.cityOfResidence} onChange={(e) => update('cityOfResidence', e.target.value)} className="mt-1" /></div>
              <div>
                <Label>Situation matrimoniale</Label>
                <select value={form.maritalStatus} onChange={(e) => update('maritalStatus', e.target.value)} className="mt-1 w-full h-10 px-3 border border-gray-300 rounded-md text-sm">
                  <option value="">Sélectionner...</option>
                  <option value="celibataire">Célibataire</option>
                  <option value="marie">Marié(e)</option>
                  <option value="divorce">Divorcé(e)</option>
                  <option value="veuf">Veuf/Veuve</option>
                </select>
              </div>
              <div><Label>Nombre d'enfants à charge</Label><Input type="number" min="0" value={form.numberOfDependents} onChange={(e) => update('numberOfDependents', e.target.value)} className="mt-1" /></div>
            </div>

            <SectionTitle>Études & académique</SectionTitle>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <PrefillLabel active={autoFilledFields.has('educationLevel')}>Niveau d'études le plus élevé</PrefillLabel>
                <select value={form.educationLevel} onChange={(e) => update('educationLevel', e.target.value)} className={`mt-1 w-full h-10 px-3 border border-gray-300 rounded-md text-sm ${prefillClass('educationLevel')}`}>
                  <option value="">Sélectionner...</option>
                  <option value="bac">Baccalauréat</option>
                  <option value="bac2">Bac+2 / BTS / DUT</option>
                  <option value="licence">Licence</option>
                  <option value="master">Master ou plus</option>
                  <option value="doctorat">Doctorat</option>
                </select>
              </div>
              <div><PrefillLabel active={autoFilledFields.has('diplomaTitle')}>Intitulé exact du diplôme</PrefillLabel><Input value={form.diplomaTitle} onChange={(e) => update('diplomaTitle', e.target.value)} className={`mt-1 ${prefillClass('diplomaTitle')}`} /></div>
              <div><PrefillLabel active={autoFilledFields.has('graduationYear')}>Année d'obtention</PrefillLabel><Input value={form.graduationYear} onChange={(e) => update('graduationYear', e.target.value)} placeholder="2022" className={`mt-1 ${prefillClass('graduationYear')}`} /></div>
              <div><PrefillLabel active={autoFilledFields.has('fieldOfStudy')}>Domaine d'études</PrefillLabel><Input value={form.fieldOfStudy} onChange={(e) => update('fieldOfStudy', e.target.value)} className={`mt-1 ${prefillClass('fieldOfStudy')}`} /></div>
            </div>

            <SectionTitle>Expérience professionnelle</SectionTitle>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <PrefillLabel active={autoFilledFields.has('employmentStatus')}>Situation professionnelle</PrefillLabel>
                <select value={form.employmentStatus} onChange={(e) => update('employmentStatus', e.target.value)} className={`mt-1 w-full h-10 px-3 border border-gray-300 rounded-md text-sm ${prefillClass('employmentStatus')}`}>
                  <option value="">Sélectionner...</option>
                  <option value="employe">Employé(e)</option>
                  <option value="independant">Indépendant(e)</option>
                  <option value="sans_emploi">Sans emploi</option>
                  <option value="etudiant">Étudiant(e)</option>
                </select>
              </div>
              <div><PrefillLabel active={autoFilledFields.has('currentJobTitle')}>Intitulé du poste actuel</PrefillLabel><Input value={form.currentJobTitle} onChange={(e) => update('currentJobTitle', e.target.value)} className={`mt-1 ${prefillClass('currentJobTitle')}`} /></div>
              <div>
                <PrefillLabel active={autoFilledFields.has('yearsOfExperience')}>Années d'expérience continue</PrefillLabel>
                <select value={form.yearsOfExperience} onChange={(e) => update('yearsOfExperience', e.target.value)} className={`mt-1 w-full h-10 px-3 border border-gray-300 rounded-md text-sm ${prefillClass('yearsOfExperience')}`}>
                  <option value="">Sélectionner...</option>
                  <option value="0-1">Moins d'1 an</option>
                  <option value="1-3">1 à 3 ans</option>
                  <option value="3-5">3 à 5 ans</option>
                  <option value="5-10">5 à 10 ans</option>
                  <option value="10+">10 ans ou plus</option>
                </select>
              </div>
              <div><PrefillLabel active={autoFilledFields.has('industrySector')}>Secteur d'activité</PrefillLabel><Input value={form.industrySector} onChange={(e) => update('industrySector', e.target.value)} className={`mt-1 ${prefillClass('industrySector')}`} /></div>
            </div>
            <div><PrefillLabel active={autoFilledFields.has('mainTasks')}>Tâches principales</PrefillLabel><Textarea value={form.mainTasks} onChange={(e) => update('mainTasks', e.target.value)} rows={2} className={`mt-1 ${prefillClass('mainTasks')}`} /></div>

            <SectionTitle>Compétences linguistiques</SectionTitle>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <PrefillLabel active={autoFilledFields.has('frenchLevel')}>Niveau en français</PrefillLabel>
                <select value={form.frenchLevel} onChange={(e) => update('frenchLevel', e.target.value)} className={`mt-1 w-full h-10 px-3 border border-gray-300 rounded-md text-sm ${prefillClass('frenchLevel')}`}>
                  <option value="">Sélectionner...</option>
                  <option value="natif">Natif</option>
                  <option value="c1_c2">C1 / C2 (courant)</option>
                  <option value="b2">B2</option>
                  <option value="b1">B1</option>
                  <option value="debutant">Débutant</option>
                </select>
              </div>
              <div>
                <PrefillLabel active={autoFilledFields.has('englishLevel')}>Niveau en anglais</PrefillLabel>
                <select value={form.englishLevel} onChange={(e) => update('englishLevel', e.target.value)} className={`mt-1 w-full h-10 px-3 border border-gray-300 rounded-md text-sm ${prefillClass('englishLevel')}`}>
                  <option value="">Sélectionner...</option>
                  <option value="natif">Natif</option>
                  <option value="c1_c2">C1 / C2 (courant)</option>
                  <option value="b2">B2</option>
                  <option value="b1">B1</option>
                  <option value="debutant">Débutant / Basique</option>
                </select>
              </div>
            </div>
            <div><PrefillLabel active={autoFilledFields.has('languageTestsTaken')}>Tests officiels passés ou à passer</PrefillLabel><Input value={form.languageTestsTaken} onChange={(e) => update('languageTestsTaken', e.target.value)} placeholder="Ex: TEF, TCF, IELTS..." className={`mt-1 ${prefillClass('languageTestsTaken')}`} /></div>

            <SectionTitle>Projet & pays cible</SectionTitle>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Projet à évaluer *</Label>
                <select value={form.projectType} onChange={(e) => isEvaluationProjectType(e.target.value) && selectProjectType(e.target.value)} className="mt-1 w-full h-10 px-3 border border-gray-300 rounded-md text-sm">
                  {(Object.keys(PROJECT_EVALUATION_CONFIG) as EvaluationProjectType[]).map((projectType) => <option key={projectType} value={projectType}>{PROJECT_EVALUATION_CONFIG[projectType].label} — {PROJECT_EVALUATION_CONFIG[projectType].subtitle}</option>)}
                </select>
              </div>
              <div>
                <Label>Catégorie de destination *</Label>
                <select value={form.destinationCategory} onChange={(e) => update('destinationCategory', e.target.value)} className="mt-1 w-full h-10 px-3 border border-gray-300 rounded-md text-sm">
                  <option value="canada">Canada</option>
                  <option value="schengen">Europe / Schengen</option>
                  <option value="autre">Monde — laissez-nous comparer les possibilités</option>
                </select>
              </div>
              <div>
                <Label htmlFor="evaluation-destination">Destination ciblée *</Label>
                <DestinationAutocomplete id="evaluation-destination" value={customDestinationMode ? '' : form.destinationCountry} options={destinationOptions} onSelect={selectDestinationCountry} onCustom={chooseCustomDestination} />
                <p className="mt-1 text-xs text-slate-500">Recherchez par pays, sélectionnez une destination avec son drapeau, puis choisissez la procédure associée.</p>
              </div>
              {customDestinationMode && <div>
                <Label>Précisez la destination</Label>
                <Input value={form.destinationCountry} onChange={(event) => update('destinationCountry', event.target.value)} placeholder="Ex. Japon, Brésil, Cameroun…" className="mt-1" />
              </div>}
              {availableProcedures.length > 0 && <div>
                <Label>Procédure à évaluer *</Label>
                <select value={form.projectDetails.procedureId ?? ''} onChange={(event) => selectProcedure(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm">
                  <option value="">Sélectionner une procédure</option>
                  {availableProcedures.map((procedure) => <option key={procedure.id} value={procedure.id}>{procedure.procedureLabel}</option>)}
                </select>
              </div>}
              <div>
                <Label>Type de visa recherché *</Label>
                <select value={form.visaType} onChange={(e) => update('visaType', e.target.value)} className="mt-1 w-full h-10 px-3 border border-gray-300 rounded-md text-sm">
                  <option value="canada_rp">Canada — Résidence Permanente</option>
                  <option value="canada_etude">Canada — Études</option>
                  <option value="canada_tourisme">Canada — Visiteur</option>
                  <option value="schengen_travail">Europe — Travail</option>
                  <option value="schengen_etude">Europe — Études</option>
                  <option value="schengen_tourisme">Europe — Visiteur</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <div><Label>Budget disponible (FCFA)</Label><Input value={form.availableBudget} onChange={(e) => update('availableBudget', e.target.value)} className="mt-1" /></div>
            </div>
            <div><Label>Motif du séjour</Label><Input value={form.travelReason} onChange={(e) => update('travelReason', e.target.value)} placeholder="Travail, études, recrutement, visite, installation…" className="mt-1" /></div>
            {form.destinationCountry && availableProcedures.length === 0 && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><strong>Destination à comparer :</strong> aucun guide spécifique n’est encore associé à cette combinaison. Votre dossier est néanmoins enregistré pour vérification par un conseiller.</div>}

            <ProjectDetailsSection projectType={form.projectType} values={form.projectDetails} onChange={updateProjectDetails} countryFields={countryProcedureFields} procedure={selectedProcedure} />

            <SectionTitle>Historique & antécédents</SectionTitle>
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.priorVisaRefusal} onChange={(e) => update('priorVisaRefusal', e.target.checked)} />
                Refus de visa antérieur
              </label>
              {form.priorVisaRefusal && (
                <Input value={form.priorVisaRefusalCountry} onChange={(e) => update('priorVisaRefusalCountry', e.target.value)} placeholder="Préciser le pays" className="ml-6" />
              )}
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.criminalRecord} onChange={(e) => update('criminalRecord', e.target.checked)} />
                Antécédents judiciaires
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.familyAbroad} onChange={(e) => update('familyAbroad', e.target.checked)} />
                Présence de famille à l'étranger
              </label>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-white p-2 text-blue-700 shadow-sm" aria-hidden="true">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <Label htmlFor="cv-upload" className="text-sm font-semibold text-blue-950">
                    CV (PDF, JPG ou PNG, optionnel mais recommandé)
                  </Label>
                  <p className="mt-1 text-xs text-blue-800/75">
                    Ajoutez votre CV pour permettre une évaluation plus précise. PDF, JPG ou PNG, 5 Mo maximum. Les images sont lues par OCR sécurisé.
                  </p>
                  <input
                    id="cv-upload"
                    type="file"
                    accept="application/pdf,image/png,image/jpeg,.pdf,.png,.jpg,.jpeg"
                    onChange={handleCvChange}
                    className="sr-only"
                  />
                  <label
                    htmlFor="cv-upload"
                    className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
                  >
                    <Upload className="h-4 w-4" aria-hidden="true" />
                    {cvFile ? 'Remplacer le CV' : 'Choisir mon CV'}
                  </label>

                  {cvFile && (
                    <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800" role="status" aria-live="polite">
                      <span className="flex min-w-0 items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span className="truncate">{cvFile.name}</span>
                      </span>
                      <button
                        type="button"
                        onClick={removeCv}
                        className="rounded p-1 text-green-700 transition hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                        aria-label="Supprimer le CV sélectionné"
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  )}
                  {cvFile && getCvMimeType(cvFile) === 'application/pdf' && pdfPageCount > 0 && (
                    <div className="mt-3 rounded-xl border border-blue-200 bg-white p-3" aria-label="Sélection des pages PDF à analyser">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-blue-950">Pages à analyser</p>
                          <p className="mt-1 text-xs text-blue-800/75">Choisissez uniquement les pages contenant formation, expérience ou langues.</p>
                        </div>
                        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">{selectedPdfPages.length}/{pdfPageCount}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {Array.from({ length: pdfPageCount }, (_, index) => index + 1).map((page) => {
                          const selected = selectedPdfPages.includes(page);
                          return <button key={page} type="button" aria-pressed={selected} onClick={() => togglePdfPage(page)} className={`min-h-10 min-w-10 rounded-lg border px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${selected ? 'border-blue-700 bg-blue-700 text-white' : 'border-blue-200 bg-white text-blue-800 hover:bg-blue-50'}`}>Page {page}</button>;
                        })}
                      </div>
                      <Button type="button" size="sm" disabled={isPreparingCv || !selectedPdfPages.length} onClick={() => void launchTargetedAnalysis()} className="mt-3 bg-blue-700 hover:bg-blue-800">
                        {isPreparingCv ? <Loader className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}Analyser les pages sélectionnées
                      </Button>
                    </div>
                  )}
                  {cvFile && imagePreviewUrl && (
                    <div className="mt-3 rounded-xl border border-blue-200 bg-white p-3" aria-label="Recadrage de l’image du CV">
                      <div>
                        <p className="text-sm font-semibold text-blue-950">Ciblez les rubriques utiles</p>
                        <p className="mt-1 text-xs text-blue-800/75">Déplacez le cadre sur les expériences, diplômes ou langues. Seule cette zone sera envoyée à l’OCR.</p>
                      </div>
                      <div className="relative mt-3 h-64 overflow-hidden rounded-lg bg-slate-900">
                        <Cropper image={imagePreviewUrl} crop={cropPosition} zoom={cropZoom} aspect={4 / 5} onCropChange={setCropPosition} onZoomChange={setCropZoom} onCropComplete={(_area: Area, pixels: Area) => setCropPixels(pixels)} />
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <Label htmlFor="cv-crop-zoom" className="whitespace-nowrap text-xs text-blue-900">Zoom</Label>
                        <input id="cv-crop-zoom" type="range" min="1" max="3" step="0.1" value={cropZoom} onChange={(event) => setCropZoom(Number(event.target.value))} className="w-full accent-blue-700" />
                      </div>
                      <Button type="button" size="sm" disabled={!cropPixels || isExtractingCv} onClick={() => void launchTargetedAnalysis()} className="mt-3 bg-blue-700 hover:bg-blue-800">
                        {isExtractingCv ? <Loader className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}Analyser la zone recadrée
                      </Button>
                    </div>
                  )}
                  {isExtractingCv && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800" role="status" aria-live="polite">
                      <Loader className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
                      <span>Lecture de votre CV en cours — pré-remplissage automatique du formulaire…</span>
                    </div>
                  )}
                  {!isExtractingCv && autoFilledFields.size > 0 && (
                    <div className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-3 text-sm text-indigo-800" role="status" aria-live="polite">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>{autoFilledFields.size} champ(s) pré-rempli(s) depuis votre CV — repérez le badge « Pré-rempli depuis le CV » et vérifiez chaque valeur.</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button type="button" size="sm" variant="outline" disabled={!cvFile || isExtractingCv} onClick={reanalyzeCv} className="border-indigo-300 bg-white text-indigo-800 hover:bg-indigo-100">
                          <Sparkles className="mr-1.5 h-3.5 w-3.5" />Réanalyser le CV
                        </Button>
                        <Button type="button" size="sm" variant="ghost" disabled={isExtractingCv} onClick={cancelAutoFill} className="text-indigo-800 hover:bg-indigo-100">
                          Annuler le pré-remplissage
                        </Button>
                      </div>
                    </div>
                  )}
                  {!isExtractingCv && cvAnalysisNotice && <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900" role="status">{cvAnalysisNotice}</p>}
                </div>
              </div>
            </div>

            <div><Label>Message complémentaire</Label><Textarea value={form.message} onChange={(e) => update('message', e.target.value)} rows={3} className="mt-1" /></div>

            {(formError || submitMutation.error) && (
              <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{formError || submitMutation.error?.message}</span>
              </div>
            )}

            <Button type="submit" disabled={submitMutation.isPending} className="w-full py-6 text-base bg-blue-600 hover:bg-blue-700">
              {submitMutation.isPending ? (
                <span className="flex items-center gap-2"><Loader className="w-4 h-4 animate-spin" /> Envoi en cours...</span>
              ) : (
                'Envoyer mon évaluation'
              )}
            </Button>
            <p className="text-xs text-gray-400 text-center">Limité à 2 évaluations gratuites par personne.</p>
          </form>
        </Card>
      </div>
    </div>
  );
}
