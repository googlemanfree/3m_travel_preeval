import { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, Loader, AlertCircle, Sparkles, FileText, Upload, X, ExternalLink } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { motion } from 'framer-motion';
import { DestinationAutocomplete } from '@/components/DestinationAutocomplete';
import { PremiumCoverImage } from '@/components/PremiumCoverImage';
import Cropper, { type Area } from 'react-easy-crop';
import { createCroppedCvFile, type CropPixels } from '@/lib/cvImageCrop';
import { AI_ANALYSIS_CONSENT_DETAIL, AI_ANALYSIS_CONSENT_LABEL, CV_ANALYSIS_CONSENT_DETAIL, CV_ANALYSIS_CONSENT_LABEL, CV_NOT_STORED_MESSAGE, CV_REQUIRED_MESSAGE } from '@shared/evaluationCv';
import { COLUMN_FIELD_KEYS, FAMILY_RULES, deriveDestination, getDomain, getProgram, isColumnFieldKey, missingRequiredFields, resolveDynamicForm, splitFormValues, visibleSections, type FormValues } from '@shared/dynamicForm';
import { DynamicFormSections } from '@/components/DynamicFormSections';
import { DynamicDocumentsHint, DynamicProjectChoice } from '@/components/DynamicProjectChoice';
import { normalizePublicEvaluationProject } from '@shared/evaluationFormRequirements';
import { isEvaluationProjectType, PROJECT_EVALUATION_CONFIG, type EvaluationProjectType } from '@/lib/projectEvaluationConfig';
import { getAllDestinationOptionsForProject, getProcedureById, getProceduresForCountry } from '@/lib/destinationProcedureCatalog';
import { getServiceVisual } from '@/data/premiumVisuals';
import { setPageSeo } from '@/lib/pageSeo';
import { useCandidateAuth } from '@/hooks/useCandidateAuth';
import { toast } from 'sonner';

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

export default function Evaluation() {
  const { candidate } = useCandidateAuth();
  const heroVisual = getServiceVisual('dossier');
  const projectFromUrl = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('project');
  const onboardingFromRegistration = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('onboarding') === 'registration';
  const normalizedProjectFromUrl = normalizePublicEvaluationProject(projectFromUrl) ?? (isEvaluationProjectType(projectFromUrl) ? projectFromUrl : null);
  const initialProject = normalizedProjectFromUrl ?? initialForm.projectType;

  useEffect(() => {
    setPageSeo({
      title: 'Évaluation gratuite | 3M TRAVEL AGENCY',
      description:
        'Évaluez gratuitement votre profil pour un projet de mobilité internationale avec 3M TRAVEL AGENCY à Yaoundé.',
      image: heroVisual.desktop,
      imageAlt: heroVisual.alt,
    });
  }, [heroVisual.desktop, heroVisual.alt]);
  // Pré-remplit avec le premier pays de préférence déclaré à l'inscription plutôt que de faire
  // ressaisir une information déjà connue — le candidat reste libre de le changer.
  const preferredDestination = candidate?.preferredDestinations?.[0];
  const initialProjectForm = {
    ...initialForm,
    fullName: candidate?.fullName ?? '',
    email: candidate?.email ?? '',
    projectType: initialProject,
    visaType: PROJECT_EVALUATION_CONFIG[initialProject].recommendedVisaTypes[0] ?? initialForm.visaType,
    ...(preferredDestination ? { destinationCountry: preferredDestination, ...deriveDestination(preferredDestination, initialProject) } : {}),
  };
  const [form, setForm] = useState<FormState>(initialProjectForm);
  const formRef = useRef<FormState>(initialProjectForm);
  const acquisitionParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const rawSource = acquisitionParams.get("source")?.toLowerCase();
  const acquisitionSource = rawSource === "whatsapp" || rawSource === "wa" ? "whatsapp" : rawSource === "facebook" || rawSource === "fb" ? "facebook" : "direct";
  const acquisitionCampaign = acquisitionParams.get("campaign") || acquisitionParams.get("campagne") || undefined;
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [formError, setFormError] = useState('');
  // Accords facultatifs, décochés par défaut et volontairement hors du brouillon enregistré : à redonner à chaque envoi.
  const [aiAnalysisConsent, setAiAnalysisConsent] = useState(false);
  const [cvAnalysisConsent, setCvAnalysisConsent] = useState(false);
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const DRAFT_KEY = 'eval_draft';
  const DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
  // Le brouillon contient des données personnelles : il est lié au compte connecté et expire,
  // pour ne jamais réapparaître chez un autre candidat sur un poste partagé.
  const draftOwner = candidate?.email ?? '';
  const initialSnapshot = useRef(JSON.stringify(initialProjectForm));
  const draftTouched = useRef(false);
  const clearDraft = () => { try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ } };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as { savedAt?: number; owner?: string; form?: Partial<FormState> };
      const expired = typeof saved.savedAt !== 'number' || Date.now() - saved.savedAt > DRAFT_MAX_AGE_MS;
      if (!saved.form || expired || saved.owner !== draftOwner) { clearDraft(); return; }
      // Un projet choisi explicitement dans l'URL prime sur un ancien brouillon.
      if (normalizedProjectFromUrl && saved.form.projectType !== normalizedProjectFromUrl) return;
      const restored = { ...initialProjectForm, ...saved.form };
      formRef.current = restored;
      setForm(restored);
      toast.info('Brouillon restauré', {
        description: 'Votre saisie précédente a été récupérée. Sur un ordinateur partagé, effacez-la.',
        duration: 10000,
        action: { label: 'Effacer', onClick: () => { clearDraft(); draftTouched.current = false; formRef.current = initialProjectForm; setForm(initialProjectForm); } },
      });
    } catch { clearDraft(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (JSON.stringify(form) === initialSnapshot.current) {
          if (draftTouched.current) clearDraft();
          return;
        }
        draftTouched.current = true;
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ savedAt: Date.now(), owner: draftOwner, form }));
      } catch { /* quota exceeded — ignore */ }
    }, 1000);
    return () => clearTimeout(timer);
  }, [form, draftOwner]);


  const submitMutation = trpc.evaluation.submit.useMutation({
    onSuccess: clearDraft,
  });
  const extractCvMutation = trpc.evaluation.extractFromCV.useMutation();
  const inspectPdfMutation = trpc.evaluation.inspectPdfPages.useMutation();
  const dynamicForm = useMemo(
    () => resolveDynamicForm({ country: form.destinationCountry, projectType: form.projectType, programId: form.projectDetails.programId, domainId: form.projectDetails.domainId }),
    [form.destinationCountry, form.projectType, form.projectDetails.programId, form.projectDetails.domainId],
  );
  const dynamicValues = useMemo<FormValues>(() => {
    const columns: FormValues = {};
    for (const key of COLUMN_FIELD_KEYS) columns[key] = form[key];
    return { ...columns, ...form.projectDetails };
  }, [form]);
  const dynamicSections = useMemo(() => visibleSections(dynamicForm, dynamicValues), [dynamicForm, dynamicValues]);
  const destinationOptions = getAllDestinationOptionsForProject(form.projectType);
  const availableProcedures = form.destinationCountry ? getProceduresForCountry(form.projectType, form.destinationCountry) : [];
  const selectedProcedure = getProcedureById(form.projectDetails.procedureId);

  // Progression : une étape par bloc réellement affiché. Elle change avec le formulaire.
  const SECTION_SHORT_LABEL: Record<string, string> = { education: 'Études', experience: 'Expérience', languages: 'Langues', program: 'Visa', domain: 'Domaine', country: 'Pays' };
  const progressSteps = useMemo(() => {
    const answered = (key: string) => Boolean((dynamicValues[key] ?? '').trim());
    const steps = [
      { label: 'Projet', done: Boolean(form.destinationCountry && form.projectDetails.programId) },
      { label: 'État civil', done: Boolean(form.fullName && form.email && form.phone) },
      ...dynamicSections.map((section) => ({
        label: SECTION_SHORT_LABEL[section.id] ?? section.title,
        done: section.fields.some((field) => answered(field.key)) && section.fields.filter((field) => field.required).every((field) => answered(field.key)),
      })),
    ];
    return [...steps, { label: 'Historique', done: steps.every((step) => step.done) }];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dynamicSections, dynamicValues, form.destinationCountry, form.projectDetails.programId, form.fullName, form.email, form.phone]);
  const progressPercent = Math.round((progressSteps.filter((step) => step.done).length / progressSteps.length) * 100);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    const next = { ...formRef.current, [key]: value };
    formRef.current = next;
    setForm(next);
  };

  const updateProjectDetails = (key: string, value: string) => update('projectDetails', { ...formRef.current.projectDetails, [key]: value });

  const changeDynamicValue = (key: string, value: string) => {
    if (isColumnFieldKey(key)) update(key, value as FormState[typeof key]);
    else updateProjectDetails(key, value);
  };

  // Le guide 3M associé au pays et au type de projet est rattaché automatiquement ; le candidat peut en choisir un autre s'il y en a plusieurs.
  const withGuide = (country: string, projectType: EvaluationProjectType, keep: Record<string, string> = {}) => {
    const guide = country ? getProceduresForCountry(projectType, country)[0] : undefined;
    return { ...keep, ...(guide ? { procedureId: guide.id, selectedProcedure: guide.procedureLabel } : {}) };
  };
  // Les réponses ne sont jamais effacées par un changement de choix : les questions masquées gardent leur réponse et ne sont simplement pas envoyées.
  const retainAnswers = (details: Record<string, string>): Record<string, string> => {
    const { programId: _programId, procedureId: _procedureId, selectedProcedure: _selectedProcedure, ...rest } = details;
    return rest;
  };
  const keepChoices = (details: Record<string, string>): Record<string, string> => ({ ...(details.programId ? { programId: details.programId } : {}), ...(details.domainId ? { domainId: details.domainId } : {}) });

  const selectProjectType = (projectType: EvaluationProjectType) => {
    const derived = deriveDestination(formRef.current.destinationCountry, projectType);
    const next = { ...formRef.current, projectType, projectDetails: withGuide(formRef.current.destinationCountry, projectType, retainAnswers(formRef.current.projectDetails)), destinationCategory: derived.destinationCategory, visaType: derived.visaType };
    formRef.current = next;
    setForm(next);
  };

  const selectDestinationCountry = (country: string) => {
    const derived = deriveDestination(country, formRef.current.projectType);
    const next = {
      ...formRef.current,
      destinationCountry: country,
      destinationCategory: derived.destinationCategory,
      visaType: derived.visaType,
      projectDetails: withGuide(country, formRef.current.projectType, keepChoices(formRef.current.projectDetails)),
    };
    formRef.current = next;
    setForm(next);
    setCustomDestinationMode(false);
  };

  const chooseCustomDestination = () => {
    const next = { ...formRef.current, destinationCountry: '', destinationCategory: 'autre', visaType: 'autre', projectDetails: keepChoices(formRef.current.projectDetails) };
    formRef.current = next;
    setForm(next);
    setCustomDestinationMode(true);
  };

  const updateCustomDestination = (country: string) => {
    const derived = deriveDestination(country, formRef.current.projectType);
    const next = { ...formRef.current, destinationCountry: country, destinationCategory: derived.destinationCategory, visaType: derived.visaType };
    formRef.current = next;
    setForm(next);
  };

  const selectProgram = (programId: string) => {
    const program = getProgram(programId);
    const details: Record<string, string> = { ...formRef.current.projectDetails, programId };
    // Un programme qui ne dépend pas du métier retire le domaine choisi (ses réponses sont conservées si le candidat revient).
    if (program && !FAMILY_RULES[program.family].domain) delete details.domainId;
    const next = { ...formRef.current, projectDetails: details };
    formRef.current = next;
    setForm(next);
  };

  const selectDomain = (domainId: string) => {
    const previous = getDomain(formRef.current.projectDetails.domainId);
    const domain = getDomain(domainId);
    const details = { ...formRef.current.projectDetails };
    if (domainId) details.domainId = domainId; else delete details.domainId;
    // Le secteur d'activité se renseigne seul, sans écraser une saisie du candidat.
    const sector = formRef.current.industrySector;
    const industrySector = domain && (!sector || sector === previous?.label) ? domain.label : !domain && sector === previous?.label ? '' : sector;
    const next = { ...formRef.current, projectDetails: details, industrySector };
    formRef.current = next;
    setForm(next);
  };

  const selectProcedure = (procedureId: string) => {
    const procedure = getProcedureById(procedureId);
    update('projectDetails', { ...formRef.current.projectDetails, procedureId, selectedProcedure: procedure?.procedureLabel ?? '' });
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
    setFieldErrors({});

    // Chaque refus nomme le champ concerné, le marque (aria-invalid) et y place le focus : un lecteur d'écran sait où corriger.
    const failValidation = (message: string, fieldIds: string[] = []) => {
      setFormError(message);
      setFieldErrors(Object.fromEntries(fieldIds.map((id) => [id, message])));
      if (fieldIds[0]) window.setTimeout(() => document.getElementById(fieldIds[0])?.focus(), 0);
      return undefined;
    };

    if (form.fullName.trim().length < 3) return failValidation('Merci d\'indiquer votre nom complet.', ['evaluation-full-name']);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return failValidation('Adresse email invalide.', ['evaluation-email']);
    if (form.phone.trim().length < 8) return failValidation('Numéro de téléphone invalide.', ['evaluation-phone']);
    if (!form.destinationCountry.trim()) return failValidation('Merci de sélectionner ou préciser le pays de destination.', ['evaluation-destination']);
    if (!form.projectDetails.programId) return failValidation('Merci de choisir le visa ou programme qui vous correspond (ou « Je ne sais pas encore »).', ['dyn-program']);
    const missingProjectFields = missingRequiredFields(dynamicForm, dynamicValues);
    if (missingProjectFields.length) return failValidation(`Merci de compléter les informations requises pour votre projet : ${missingProjectFields.map((field) => field.label).join(', ')}.`, missingProjectFields.map((field) => `dyn-${field.key}`));

    // CV obligatoire selon le visa ou programme choisi (travail qualifié) ; recommandé ou facultatif ailleurs.
    const cvMandatory = dynamicForm.cv === 'required';
    if (cvMandatory && !cvFile) {
      setCvAnalysisNotice(CV_REQUIRED_MESSAGE);
      document.getElementById('cv-upload')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return setFormError(CV_REQUIRED_MESSAGE);
    }

    const { columns, details } = splitFormValues(dynamicForm, dynamicValues, form.projectDetails);
    const derived = deriveDestination(form.destinationCountry, form.projectType);

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
      educationLevel: columns.educationLevel,
      diplomaTitle: columns.diplomaTitle,
      graduationYear: columns.graduationYear,
      fieldOfStudy: columns.fieldOfStudy,
      employmentStatus: columns.employmentStatus,
      currentJobTitle: columns.currentJobTitle,
      yearsOfExperience: columns.yearsOfExperience,
      industrySector: columns.industrySector ?? dynamicForm.domain?.label,
      mainTasks: columns.mainTasks,
      frenchLevel: columns.frenchLevel,
      englishLevel: columns.englishLevel,
      languageTestsTaken: columns.languageTestsTaken,
      destinationCategory: derived.destinationCategory,
      destinationCountry: form.destinationCountry || undefined,
      visaType: derived.visaType,
      travelReason: form.travelReason || dynamicForm.program.label,
      availableBudget: form.availableBudget || undefined,
      projectType: form.projectType,
      projectDetails: details,
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
      geminiAnalysisConsent: aiAnalysisConsent,
      cvAnalysisConsent: aiAnalysisConsent && cvAnalysisConsent && Boolean(cvFile),
    });
  };

  if (submitMutation.data?.success) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-blue-50 to-white">
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
            {submitMutation.data?.cvStored === false && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-left text-sm text-red-800" role="alert" data-testid="cv-not-stored">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{CV_NOT_STORED_MESSAGE}</span>
              </div>
            )}
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
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <section className="relative overflow-hidden px-4 pb-12 pt-16 text-white sm:px-6">
        <PremiumCoverImage
          visual={heroVisual}
          priority
          className="absolute inset-0"
          imgClassName="h-full w-full object-cover object-center opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#061a36]/92 via-[#0a3264]/80 to-[#0e5b9f]/55" />
        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <p className="text-xs font-black uppercase tracking-[.18em] text-blue-100">3M TRAVEL AGENCY</p>
          <span className="mt-4 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-blue-50 ring-1 ring-white/25">
            <Sparkles className="w-3 h-3" /> Évaluation structurée du profil
          </span>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">Évaluation complète de votre profil</h1>
          <p className="mt-3 text-base leading-7 text-blue-50">Ces informations nous permettent d&apos;évaluer votre éligibilité pour n&apos;importe quelle destination — Canada RP, Europe, et bien d&apos;autres.</p>
          {acquisitionSource !== "direct" && (
            <div className="mx-auto mt-4 max-w-xl rounded-xl border border-cyan-200/40 bg-cyan-950/40 px-4 py-3 text-left text-sm text-cyan-50" role="status" aria-live="polite">
              <strong>Parcours identifié :</strong> {acquisitionSource === "whatsapp" ? "WhatsApp Business" : "Facebook"}{acquisitionCampaign ? ` — campagne « ${acquisitionCampaign} »` : ""}. Votre demande sera rattachée à ce contexte pour faciliter le suivi par notre équipe.
            </div>
          )}
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 py-12">

        {/* Barre de progression multi-étapes */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Progression du formulaire</span>
            <span className="text-xs font-black text-blue-700">{progressPercent} %</span>
          </div>
          <div
            className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200"
            role="progressbar"
            aria-label="Progression du formulaire"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPercent}
          >
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-blue-600"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
          <div className="mt-2 grid gap-1" style={{ gridTemplateColumns: `repeat(${progressSteps.length}, minmax(0, 1fr))` }} aria-hidden="true" data-testid="progress-steps">
            {progressSteps.map((step) => (
              <div key={step.label} className="text-center">
                <div className={`mx-auto mb-1 h-1.5 rounded-full ${step.done ? "bg-blue-600" : "bg-slate-200"}`} />
                <span className={`hidden text-[10px] font-medium leading-tight sm:block ${step.done ? "text-blue-700" : "text-slate-500"}`}>{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        <Card className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {onboardingFromRegistration && <div role="status" aria-live="polite" className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-950"><strong>Votre compte est activé.</strong> Complétez votre évaluation préparatoire en sélectionnant votre projet, votre pays et la procédure concernée. Les critères et pièces définitifs seront confirmés par un conseiller à partir des sources institutionnelles.</div>}
            <div className="rounded-2xl border border-blue-100 bg-white p-4 md:p-5" data-testid="project-destination">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Étape 1 — destination</p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="evaluation-destination">Destination ciblée *</Label>
                  <DestinationAutocomplete id="evaluation-destination" value={customDestinationMode ? '' : form.destinationCountry} options={destinationOptions} onSelect={selectDestinationCountry} onCustom={chooseCustomDestination} />
                  <p className="mt-1 text-xs text-slate-500">Recherchez un pays : le formulaire se recompose selon la langue, la zone et les démarches de la destination.</p>
                </div>
                {customDestinationMode && <div className="sm:col-span-2">
                  <Label htmlFor="evaluation-custom-destination">Précisez la destination</Label>
                  <Input id="evaluation-custom-destination" value={form.destinationCountry} onChange={(event) => updateCustomDestination(event.target.value)} placeholder="Ex. Japon, Brésil, Cameroun…" maxLength={100} className="mt-1" />
                </div>}
                <div><Label htmlFor="evaluation-budget">Budget disponible (FCFA)</Label><Input id="evaluation-budget" value={form.availableBudget} onChange={(e) => update('availableBudget', e.target.value)} maxLength={50} className="mt-1" /></div>
              </div>
            </div>

            <DynamicProjectChoice form={dynamicForm} projectKind={form.projectType} programId={form.projectDetails.programId ?? ''} domainId={form.projectDetails.domainId ?? ''} onKind={selectProjectType} onProgram={selectProgram} onDomain={selectDomain} />

            {availableProcedures.length > 0 && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-950" data-testid="project-guide">
              {availableProcedures.length > 1
                ? <div className="min-w-0 flex-1"><Label htmlFor="evaluation-guide">Guide 3M associé</Label><select id="evaluation-guide" value={form.projectDetails.procedureId ?? ''} onChange={(event) => selectProcedure(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm">{availableProcedures.map((procedure) => <option key={procedure.id} value={procedure.id}>{procedure.procedureLabel}</option>)}</select></div>
                : <span><strong>Guide 3M associé :</strong> {availableProcedures[0].procedureLabel} — {availableProcedures[0].country}</span>}
              {selectedProcedure?.guideUrl && <a href={selectedProcedure.guideUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-emerald-800 underline underline-offset-2"><FileText className="h-3.5 w-3.5" />Consulter le guide 3M<ExternalLink className="h-3 w-3" /></a>}
            </div>}
            {form.destinationCountry && availableProcedures.length === 0 && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><strong>Destination à comparer :</strong> aucun guide spécifique n’est encore associé à cette combinaison. Votre dossier est néanmoins enregistré pour vérification par un conseiller.</div>}

            <SectionTitle>État civil & famille</SectionTitle>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label htmlFor="evaluation-full-name">Nom complet *</Label><Input id="evaluation-full-name" value={form.fullName} onChange={(e) => update('fullName', e.target.value)} aria-invalid={Boolean(fieldErrors['evaluation-full-name'])} maxLength={255} className="mt-1" /></div>
              <div><Label>Date de naissance</Label><Input type="date" value={form.dateOfBirth} onChange={(e) => update('dateOfBirth', e.target.value)} className="mt-1" /></div>
              <div><Label htmlFor="evaluation-email">Email *</Label><Input id="evaluation-email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} aria-invalid={Boolean(fieldErrors['evaluation-email'])} maxLength={320} className="mt-1" /></div>
              <div><Label htmlFor="evaluation-phone">Téléphone *</Label><Input id="evaluation-phone" value={form.phone} onChange={(e) => update('phone', e.target.value)} aria-invalid={Boolean(fieldErrors['evaluation-phone'])} placeholder="+237 6XX XXX XXX" maxLength={50} className="mt-1" /></div>
              <div><Label>Nationalité</Label><Input value={form.nationality} onChange={(e) => update('nationality', e.target.value)} maxLength={100} className="mt-1" /></div>
              <div><Label>Ville de résidence</Label><Input value={form.cityOfResidence} onChange={(e) => update('cityOfResidence', e.target.value)} maxLength={100} className="mt-1" /></div>
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

            <DynamicFormSections sections={dynamicSections} values={dynamicValues} onChange={changeDynamicValue} autoFilled={autoFilledFields} invalid={new Set(Object.keys(fieldErrors))} />
            <DynamicDocumentsHint form={dynamicForm} />

            <SectionTitle>Historique & antécédents</SectionTitle>
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.priorVisaRefusal} onChange={(e) => update('priorVisaRefusal', e.target.checked)} />
                Refus de visa antérieur
              </label>
              {form.priorVisaRefusal && (
                <Input value={form.priorVisaRefusalCountry} onChange={(e) => update('priorVisaRefusalCountry', e.target.value)} placeholder="Préciser le pays" maxLength={100} className="ml-6" />
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
                    {dynamicForm.cv === 'required'
                      ? 'CV (obligatoire — PDF, JPG ou PNG)'
                      : 'CV (facultatif — PDF, JPG ou PNG)'}
                  </Label>
                  <p className="mt-1 text-xs text-blue-800/75">
                    {dynamicForm.cv === 'required'
                      ? 'Pour un visa travail, un CV actualisé est obligatoire pour finaliser l’évaluation. PDF, JPG ou PNG, 5 Mo maximum.'
                      : dynamicForm.cv === 'recommended' ? 'Le CV n’est pas exigé pour ce visa ou programme, mais il aide votre conseiller à préparer le dossier. PDF, JPG ou PNG, 5 Mo maximum.' : 'Le CV n’est pas exigé pour ce visa ou programme. Vous pouvez en joindre un si utile. PDF, JPG ou PNG, 5 Mo maximum.'}
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

            <div><Label>Message complémentaire</Label><Textarea value={form.message} onChange={(e) => update('message', e.target.value)} rows={3} maxLength={2000} className="mt-1" /></div>

            <fieldset className="rounded-xl border border-violet-100 bg-violet-50/40 p-4" aria-label="Accords facultatifs sur l’analyse par intelligence artificielle">
              <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-800">
                <input
                  type="checkbox"
                  checked={aiAnalysisConsent}
                  onChange={(event) => { setAiAnalysisConsent(event.target.checked); if (!event.target.checked) setCvAnalysisConsent(false); }}
                  className="mt-1 h-4 w-4 accent-violet-700"
                />
                <span><strong>{AI_ANALYSIS_CONSENT_LABEL}</strong><br /><span className="text-xs leading-5 text-slate-600">{AI_ANALYSIS_CONSENT_DETAIL}</span></span>
              </label>
              <label className={`mt-3 flex items-start gap-3 text-sm ${aiAnalysisConsent && cvFile ? 'cursor-pointer text-slate-800' : 'cursor-not-allowed text-slate-400'}`}>
                <input
                  type="checkbox"
                  checked={cvAnalysisConsent}
                  disabled={!aiAnalysisConsent || !cvFile}
                  onChange={(event) => setCvAnalysisConsent(event.target.checked)}
                  className="mt-1 h-4 w-4 accent-violet-700"
                />
                <span><strong>{CV_ANALYSIS_CONSENT_LABEL}</strong><br /><span className="text-xs leading-5">{CV_ANALYSIS_CONSENT_DETAIL}</span></span>
              </label>
            </fieldset>

            {(formError || submitMutation.error) && (
              <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700" role="alert" aria-live="assertive" aria-atomic="true">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <span>{formError || submitMutation.error?.message}</span>
                  {Object.keys(fieldErrors).length > 0 && <p className="mt-1 text-xs text-red-800">Le champ concerné a été ciblé automatiquement. Corrigez-le puis renvoyez le formulaire.</p>}
                </div>
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
    </main>
  );
}
