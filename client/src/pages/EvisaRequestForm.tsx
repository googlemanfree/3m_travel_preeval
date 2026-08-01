import { useState } from 'react';
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
  email: string;
  phone: string;
  nationality: string;
  dateOfBirth: string;
  countryCode: string;
  countryName: string;
  notes: string;
}

type FormStep = 'upload' | 'validation' | 'confirmation';

export default function EvisaRequestForm() {
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState<FormStep>('upload');
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    nationality: '',
    dateOfBirth: '',
    countryCode: new URLSearchParams(window.location.search).get('countryCode') || '',
    countryName: new URLSearchParams(window.location.search).get('countryName') || '',
    notes: '',
  });

  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [passportFileUrl, setPassportFileUrl] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const ACCOMPANIMENT_FEE = 25000;
  const CURRENCY = 'XOF';

  const formSteps = [
    {
      id: 'upload',
      label: 'Téléchargement',
      description: 'Téléchargez votre passeport pour l\'analyse IA',
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
      setCurrentStep('validation');
    },
    onError: (err: any) => {
      setError(err.message || 'Erreur lors de l\'analyse du passeport');
      setIsAnalyzing(false);
    },
  });

  // Mutation pour soumettre la demande
  const submitRequestMutation = trpc.evisa.submitRequest.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setError(null);
      setTimeout(() => {
        navigate('/evisas');
      }, 3000);
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

    if (!file) {
      setPassportFileUrl(null);
      return;
    }

    try {
      const uploadUrlResponse = await trpc.upload.getUploadUrl.useMutation().mutateAsync({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });

      const uploadResponse = await fetch(uploadUrlResponse.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Erreur lors du téléchargement du fichier');
      }

      const fileUrl = uploadUrlResponse.getUrl;
      setPassportFileUrl(fileUrl);

      // Analyser automatiquement le passeport avec l'IA
      setIsAnalyzing(true);
      analyzePassportMutation.mutate({
        passportUrl: fileUrl,
        fileType: file.type,
      });
    } catch (uploadError: any) {
      setError('Erreur lors du téléchargement du fichier passeport');
      setPassportFile(null);
    }
  };

  const handleValidationConfirm = (validatedData: ExtractedData) => {
    // Pré-remplir le formulaire avec les données validées
    setFormData(prev => ({
      ...prev,
      fullName: validatedData.fullName,
      dateOfBirth: validatedData.dateOfBirth || '',
      nationality: validatedData.nationality || '',
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
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Card className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Demande Soumise avec Succès !</h2>
            <p className="text-gray-600 mb-4">
              Votre demande d'e-visa pour {formData.countryName} a été soumise avec succès.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Vous allez être redirigé vers la page des e-visas dans 3 secondes...
            </p>
            <Button onClick={() => navigate('/evisas')} className="bg-blue-600 hover:bg-blue-700">
              Retour aux e-visas
            </Button>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* En-tête */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/evisas')}
            className="mb-4 text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux e-visas
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Demande d'E-Visa - {formData.countryName}
          </h1>
          <p className="text-gray-600">
            Suivez les étapes ci-dessous pour soumettre votre demande d'e-visa
          </p>
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
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  Téléchargement du Passeport (Analyse IA)
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Téléchargez votre passeport et l'IA extraira automatiquement vos informations pour pré-remplir le formulaire.
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

              {/* Informations E-Visa */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations E-Visa</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="countryCode" className="block text-sm font-medium text-gray-700 mb-2">
                        Code Pays
                      </Label>
                      <Input
                        id="countryCode"
                        name="countryCode"
                        type="text"
                        value={formData.countryCode}
                        disabled
                        className="w-full bg-gray-100"
                      />
                    </div>

                    <div>
                      <Label htmlFor="countryName" className="block text-sm font-medium text-gray-700 mb-2">
                        Pays de Destination
                      </Label>
                      <Input
                        id="countryName"
                        name="countryName"
                        type="text"
                        value={formData.countryName}
                        disabled
                        className="w-full bg-gray-100"
                      />
                    </div>
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
