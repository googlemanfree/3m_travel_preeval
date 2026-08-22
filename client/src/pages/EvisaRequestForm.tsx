import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, ArrowLeft, Loader, Sparkles } from 'lucide-react';
import Footer from '@/components/Footer';
import { FileUploadField } from '@/components/FileUploadField';
import { ValidationStep } from '@/components/ValidationStep';
import { FormProgressBar } from '@/components/FormProgressBar';
import { SuccessConfirmation } from '@/components/SuccessConfirmation';
import { PassportAssistanceWidget } from '@/components/PassportAssistanceWidget';
import { trpc } from '@/lib/trpc';

interface ExtractedData {
  fullName: string;
  firstName?: string | null;
  lastName?: string | null;
  dateOfBirth?: string | null;
  nationality?: string | null;
  passportNumber?: string | null;
  issuingCountry?: string | null;
  issueDate?: string | null;
  expiryDate?: string | null;
  gender?: string | null;
  placeOfBirth?: string | null;
}

interface FormData {
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationality: string;
  dateOfBirth: string;
  passportNumber: string;
  issuingCountry: string;
  issueDate: string;
  expiryDate: string;
  gender: string;
  placeOfBirth: string;
  countryCode: string;
  countryName: string;
  notes: string;
}

type FormStep = 'upload' | 'validation' | 'confirmation';

function createEmptyPassportData(): ExtractedData {
  return {
    fullName: '',
    firstName: null,
    lastName: null,
    dateOfBirth: null,
    nationality: null,
    passportNumber: null,
    issuingCountry: null,
    issueDate: null,
    expiryDate: null,
    gender: null,
    placeOfBirth: null,
  };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const commaIndex = result.indexOf(',');
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
    };
    reader.onerror = () => reject(new Error('Impossible de lire le fichier sélectionné.'));
    reader.readAsDataURL(file);
  });
}

export default function EvisaRequestForm() {
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState<FormStep>('upload');
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    nationality: '',
    dateOfBirth: '',
    passportNumber: '',
    issuingCountry: '',
    issueDate: '',
    expiryDate: '',
    gender: '',
    placeOfBirth: '',
    countryCode: new URLSearchParams(window.location.search).get('countryCode') || 'ca',
    countryName: new URLSearchParams(window.location.search).get('countryName') || 'Canada',
    notes: '',
  });

  const queryCountryCode = new URLSearchParams(window.location.search).get('countryCode') || 'ca';
  const queryCountryName = new URLSearchParams(window.location.search).get('countryName') || '';

  const { data: evisaDetails } = trpc.evisa.getEvisaByCountry.useQuery(
    { countryCode: queryCountryCode },
    { enabled: !!queryCountryCode }
  );

  const [currency, setCurrency] = useState<'XAF' | 'EUR' | 'USD'>('XAF');
  const [proformaUrl, setProformaUrl] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Taux de conversion indicatifs basés sur XAF (1 EUR = 656 XAF, 1 USD = 600 XAF)
  const baseFeeXaf = 65000;
  const ACCOMPANIMENT_FEE = currency === 'EUR' ? Math.round(baseFeeXaf / 656) : currency === 'USD' ? Math.round(baseFeeXaf / 600) : baseFeeXaf;
  const CURRENCY = currency;

  const saveCloudDraftMutation = trpc.evisa.saveCloudDraft.useMutation();
  const getCloudDraftQuery = trpc.evisa.getCloudDraft.useQuery(
    { email: formData.email, countryCode: queryCountryCode },
    { enabled: !!formData.email && formData.email.includes('@') }
  );
  const generateProformaMutation = trpc.evisa.generateProformaPdf.useMutation();



  useEffect(() => {
    if (evisaDetails?.data) {
      const country = evisaDetails.data;
      setFormData(prev => ({
        ...prev,
        countryCode: country.countryCode || queryCountryCode,
        countryName: country.countryName || queryCountryName || prev.countryName,
      }));
    } else if (queryCountryName) {
      setFormData(prev => ({
        ...prev,
        countryCode: queryCountryCode,
        countryName: queryCountryName,
      }));
    }
  }, [evisaDetails, queryCountryCode, queryCountryName]);

  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [passportFileUrl, setPassportFileUrl] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [passportEntryMode, setPassportEntryMode] = useState<'ai' | 'manual'>('ai');
  const [analysisNotice, setAnalysisNotice] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [submitted, setSubmitted] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [draftSavedMessage, setDraftSavedMessage] = useState<string | null>(null);

  // Charger le brouillon existant au montage pour ce pays
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(`3m_evisa_draft_${queryCountryCode}`);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed && typeof parsed === 'object') {
          setFormData(prev => ({ ...prev, ...parsed }));
        }
      }
    } catch (e) {
      console.error("Erreur de chargement du brouillon", e);
    }
  }, [queryCountryCode]);

  // Fonction pour sauvegarder le brouillon
  const handleSaveDraft = async () => {
    try {
      localStorage.setItem(`3m_evisa_draft_${queryCountryCode}`, JSON.stringify(formData));
      setDraftSavedMessage("Brouillon sauvegardé !");
      setTimeout(() => setDraftSavedMessage(null), 3000);

      // Synchronisation cloud si l'email est valide
      if (formData.email && formData.email.includes('@')) {
        saveCloudDraftMutation.mutate({
          email: formData.email,
          countryCode: queryCountryCode,
          draftData: { ...formData },
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateProforma = async () => {
    setIsGeneratingPdf(true);
    try {
      const res = await generateProformaMutation.mutateAsync({
        fullName: formData.fullName || 'Candidat 3M',
        email: formData.email || 'candidat@3mtravel.com',
        phone: formData.phone || '+237000000000',
        countryName: formData.countryName,
        totalCost: ACCOMPANIMENT_FEE,
        currency: CURRENCY,
      });
      if (res.success && res.url) {
        setProformaUrl(res.url);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingPdf(false);
    }
  };





  const formSteps = [
    {
      id: 'upload',
      label: 'Téléchargement',
      description: 'Téléchargez votre passeport pour préparer les informations du formulaire',
    },
    {
      id: 'validation',
      label: 'Validation',
      description: 'Vérifiez et corrigez les informations extraites',
    },
    {
      id: 'confirmation',
      label: 'Confirmation',
      description: 'Complétez le formulaire et soumettez votre demande',
    },
  ];

  const currentStepIndex = formSteps.findIndex(s => s.id === currentStep);

  // Mutation pour analyser le passeport
  const analyzePassportMutation = trpc.passportAnalysis.analyzePassport.useMutation({
    onSuccess: (result) => {
      setIsAnalyzing(false);
      setExtractedData(result.data);
      setPassportEntryMode('ai');
      setAnalysisNotice(null);
      setCurrentStep('validation');
    },
  });

  // Mutation pour soumettre la demande
  const submitRequestMutation = trpc.evisa.submitRequest.useMutation({
    onSuccess: (result: any) => {
      setRequestId(result.requestId || 'N/A');
      setSubmitted(true);
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message || 'Une erreur est survenue lors de la soumission');
      setIsLoading(false);
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileSelect = async (file: File | null) => {
    setPassportFile(file);
    setError(null);
    setExtractedData(null);
    setAnalysisNotice(null);

    if (!file) {
      setPassportFileUrl(null);
      return;
    }

    try {
      // L’aperçu reste local, mais l’analyse reçoit le fichier encodé puis stocké côté serveur.
      const previewUrl = URL.createObjectURL(file);
      setPassportFileUrl(previewUrl);
      setIsAnalyzing(true);

      const fileBase64 = await fileToBase64(file);
      await analyzePassportMutation.mutateAsync({
        fileBase64,
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
      });
    } catch (uploadError: any) {
      setIsAnalyzing(false);
      setError(null);
      setExtractedData(createEmptyPassportData());
      setPassportEntryMode('manual');
      setAnalysisNotice('Le pré-remplissage automatique est momentanément indisponible. Vous pouvez poursuivre immédiatement en renseignant les informations de votre passeport ; elles seront vérifiées par nos experts.');
      setCurrentStep('validation');
    }
  };

  const handleValidationConfirm = (validatedData: ExtractedData) => {
    // Pré-remplir le formulaire avec les données validées
    setFormData(prev => ({
      ...prev,
      fullName: validatedData.fullName,
      firstName: validatedData.firstName || '',
      lastName: validatedData.lastName || '',
      dateOfBirth: validatedData.dateOfBirth || '',
      nationality: validatedData.nationality || '',
      passportNumber: validatedData.passportNumber || '',
      issuingCountry: validatedData.issuingCountry || '',
      issueDate: validatedData.issueDate || '',
      expiryDate: validatedData.expiryDate || '',
      gender: validatedData.gender || '',
      placeOfBirth: validatedData.placeOfBirth || '',
    }));
    setCurrentStep('confirmation');
  };

  const handleEditPassport = () => {
    setCurrentStep('upload');
    setExtractedData(null);
    setPassportFile(null);
    setPassportFileUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validation basique
    if (!formData.fullName || !formData.email || !formData.phone || !formData.countryCode) {
      setError('Veuillez remplir tous les champs obligatoires');
      setIsLoading(false);
      return;
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Veuillez entrer une adresse email valide');
      setIsLoading(false);
      return;
    }

    const finalPassportFileUrl = passportFileUrl || '';
    const passportFileName = passportFile?.name || '';
    const passportFileSize = passportFile?.size || 0;

    submitRequestMutation.mutate({
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      nationality: formData.nationality || 'Non spécifiée',
      dateOfBirth: formData.dateOfBirth || '',
      countryCode: formData.countryCode,
      countryName: formData.countryName,
      evisaType: 'Tourism',
      visaFee: 0,
      accompanimentFee: ACCOMPANIMENT_FEE,
      totalCost: ACCOMPANIMENT_FEE,
      currency: CURRENCY,
      notes: formData.notes,
      passportFile: finalPassportFileUrl,
      passportFileName: passportFileName,
      passportFileSize: passportFileSize,
      passportExtractedData: extractedData ? { ...extractedData } : undefined,
      passportValidatedData: {
        fullName: formData.fullName,
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        nationality: formData.nationality,
        passportNumber: formData.passportNumber,
        issuingCountry: formData.issuingCountry,
        issueDate: formData.issueDate,
        expiryDate: formData.expiryDate,
        gender: formData.gender,
        placeOfBirth: formData.placeOfBirth,
      },
    });
  };

  if (submitted) {
    return (
      <>
        <SuccessConfirmation
          fullName={formData.fullName}
          countryName={formData.countryName}
          countryCode={formData.countryCode}
          email={formData.email}
          totalCost={ACCOMPANIMENT_FEE}
          currency={CURRENCY}
          requestId={requestId || undefined}
          onReturnHome={() => navigate('/evisas')}
        />
        <Footer />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/evisas')}
              className="text-blue-600 hover:text-blue-700 p-0"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux e-visas
            </Button>
            <div className="flex items-center gap-2">
              {/* Sélecteur de devises */}
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as any)}
                className="text-xs font-bold bg-white border border-blue-200 text-blue-900 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="XAF">XAF (FCFA)</option>
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
                className="border-blue-200 text-blue-700 hover:bg-blue-50 text-xs font-semibold rounded-xl"
              >
                💾 Sauvegarder
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateProforma}
                disabled={isGeneratingPdf}
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-xs font-semibold rounded-xl"
              >
                {isGeneratingPdf ? 'Génération...' : '📄 PDF Proforma'}
              </Button>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Demande d'E-Visa - {formData.countryName}
          </h1>
          <p className="text-gray-600 mb-4">
            Formulaire sécurisé avec validation par nos experts.
          </p>

          {/* Message brouillon sauvegardé */}
          {draftSavedMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center justify-between">
              <span>{draftSavedMessage}</span>
              {getCloudDraftQuery.data?.data && (
                <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">Synchronisé Cloud ☁️</span>
              )}
            </div>
          )}

          {/* Lien PDF Proforma généré (affiché uniquement si généré) */}
          {proformaUrl && (
            <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 font-medium flex items-center justify-between shadow-sm">
              <span className="font-semibold">📄 Récapitulatif proforma prêt au téléchargement :</span>
              <a
                href={proformaUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold shadow text-xs flex items-center gap-1.5"
              >
                📥 Télécharger le PDF Proforma
              </a>
            </div>
          )}

          {/* Aperçu en direct des exigences consulaires et bouton de reprise brouillon */}
          <div className="bg-blue-50/80 border border-blue-200/60 p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wide">Exigences Consulaires & Délais ({formData.countryName})</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    try {
                      const saved = localStorage.getItem(`3m_evisa_draft_${queryCountryCode}`);
                      if (saved) {
                        setFormData(prev => ({ ...prev, ...JSON.parse(saved) }));
                        setDraftSavedMessage("Brouillon précédent rechargé avec succès !");
                        setTimeout(() => setDraftSavedMessage(null), 3000);
                      } else {
                        setError("Aucun brouillon enregistré pour cette destination.");
                        setTimeout(() => setError(null), 3000);
                      }
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="text-xs text-blue-700 hover:bg-blue-100 h-7 px-2.5 rounded-lg border border-blue-200 font-semibold"
                >
                  📂 Reprendre mon brouillon
                </Button>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">Estimé : {ACCOMPANIMENT_FEE.toLocaleString()} {CURRENCY}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-blue-900 pt-1 border-t border-blue-200/40">
              <div>
                <p className="font-semibold text-blue-950">⏱️ Délai estimé :</p>
                <p className="text-slate-700">{evisaDetails?.data?.processingTime || '48h - 72h ouvrées'}</p>
              </div>
              <div>
                <p className="font-semibold text-blue-950">📋 Pièces obligatoires :</p>
                <p className="text-slate-700">{evisaDetails?.data?.docs || 'Passeport valide, Photo d’identité, Justificatif de domicile'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Barre de progression */}
        <FormProgressBar steps={formSteps} currentStep={currentStepIndex} />

        {/* Messages d'erreur */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Contenu selon l'étape */}
        <Card className="p-8">
          {currentStep === 'upload' && (
            <div className="space-y-6">
              <PassportAssistanceWidget />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  Téléchargement du passeport
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Téléchargez votre passeport : les informations utiles seront préremplies afin que vous puissiez les vérifier avant de poursuivre.
                </p>
                <FileUploadField
                  onFileSelect={handleFileSelect}
                  label="Copie de votre passeport"
                  description="Formats acceptés: PDF, JPG, PNG (Max 5 MB). Assurez-vous que tous les détails sont lisibles."
                  acceptedFormats={['application/pdf', 'image/jpeg', 'image/png']}
                  maxFileSize={5 * 1024 * 1024}
                />
                {isAnalyzing && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
                    <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                    <p className="text-sm text-blue-700">Analyse de votre passeport en cours...</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 'validation' && extractedData && (
            <ValidationStep
              extractedData={extractedData}
              passportFileUrl={passportFileUrl}
              passportFileType={passportFile?.type}
              passportFileName={passportFile?.name}
              entryMode={passportEntryMode}
              analysisNotice={analysisNotice}
              onConfirm={handleValidationConfirm}
              onEdit={handleEditPassport}
              isLoading={isLoading}
            />
          )}

          {currentStep === 'confirmation' && (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Informations Personnelles */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations Personnelles</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                      Nom Complet *
                    </Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      type="text"
                      placeholder="Votre nom complet"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                      className="w-full"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="votre.email@example.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                        Téléphone *
                      </Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+221 77 123 45 67"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nationality" className="block text-sm font-medium text-gray-700 mb-2">
                        Nationalité
                      </Label>
                      <Input
                        id="nationality"
                        name="nationality"
                        type="text"
                        placeholder="Votre nationalité"
                        value={formData.nationality}
                        onChange={handleInputChange}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <Label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
                        Date de Naissance
                      </Label>
                      <Input
                        id="dateOfBirth"
                        name="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Données passeport confirmées */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 space-y-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-base font-bold text-emerald-950 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      Données du passeport vérifiées
                    </h3>
                    <p className="text-xs text-emerald-800 mt-1">
                      Les corrections confirmées à l’étape précédente sont conservées ici. Vous pouvez encore les ajuster avant l’envoi.
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setCurrentStep('validation')} className="w-fit border-emerald-300 text-emerald-800 hover:bg-emerald-100">
                    Modifier les données extraites
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    ['firstName', 'Prénom(s)', 'Ex. AUREOL', 'text'],
                    ['lastName', 'Nom de famille', 'Ex. DONFACK', 'text'],
                    ['passportNumber', 'Numéro de passeport', 'Numéro inscrit sur le passeport', 'text'],
                    ['issuingCountry', 'Pays d’émission', 'Ex. Cameroun', 'text'],
                    ['issueDate', 'Date d’émission', '', 'date'],
                    ['expiryDate', 'Date d’expiration', '', 'date'],
                    ['gender', 'Genre', 'Ex. M ou F', 'text'],
                    ['placeOfBirth', 'Lieu de naissance', 'Ville et pays si disponibles', 'text'],
                  ].map(([name, label, placeholder, type]) => (
                    <div key={name}>
                      <Label htmlFor={`confirmed-${name}`} className="block text-sm font-medium text-emerald-950 mb-2">{label}</Label>
                      <Input
                        id={`confirmed-${name}`}
                        name={name}
                        type={type}
                        placeholder={placeholder}
                        value={formData[name as keyof FormData] as string}
                        onChange={handleInputChange}
                        className="w-full border-emerald-200 bg-white"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Informations E-Visa ciblées */}
              <div className="rounded-2xl bg-blue-50/70 border border-blue-200 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-blue-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    Procédure ciblée : {formData.countryName || 'Destination sélectionnée'}
                  </h3>
                  <span className="text-xs font-bold bg-blue-700 text-white px-3 py-1 rounded-full uppercase">e-Visa Officiel</span>
                </div>
                <p className="text-xs text-blue-800">
                  Formulaire spécifique et pièces requises ajustées pour cette destination. Nos experts vérifient chaque justificatif avant le dépôt consulaire.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="countryName" className="block text-sm font-medium text-gray-700 mb-2">
                      Destination
                    </Label>
                    <Input
                      id="countryName"
                      name="countryName"
                      type="text"
                      value={formData.countryName}
                      disabled
                      className="w-full bg-white font-bold text-blue-900"
                    />
                  </div>

                  <div>
                    <Label htmlFor="countryCode" className="block text-sm font-medium text-gray-700 mb-2">
                      Code Destination
                    </Label>
                    <Input
                      id="countryCode"
                      name="countryCode"
                      type="text"
                      value={formData.countryCode}
                      disabled
                      className="w-full bg-white text-gray-700 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Tarification */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tarification</h3>
                <Card className="p-4 bg-blue-50 border-blue-200">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Frais d'accompagnement</span>
                      <span className="font-semibold text-gray-900">
                        {ACCOMPANIMENT_FEE.toLocaleString('fr-FR')} {CURRENCY}
                      </span>
                    </div>
                    <div className="border-t border-blue-200 pt-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-900">Montant Total</span>
                        <span className="text-xl font-bold text-blue-600">
                          {ACCOMPANIMENT_FEE.toLocaleString('fr-FR')} {CURRENCY}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Notes supplémentaires */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes Supplémentaires</h3>
                <Label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Informations Additionnelles
                </Label>
                <textarea
                  id="notes"
                  name="notes"
                  placeholder="Ajoutez des informations supplémentaires si nécessaire..."
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep('validation')}
                  className="flex-1"
                >
                  Retour
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  {isLoading ? 'Soumission en cours...' : 'Soumettre la Demande'}
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
      <Footer />
    </div>
  );
}
