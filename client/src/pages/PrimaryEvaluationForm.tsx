import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { startLogin } from '@/const';
import { trpc } from '@/lib/trpc';

interface EvaluationFormData {
  fullName: string;
  email: string;
  phone: string;
  destination: string;
  visaType: string;
  education: string;
  experience: number;
  englishLevel: string;
  currentJob: string;
  sector: string;
  cvFile: File | null;
}

const sectors = [
  'Santé',
  'Documentation',
  'Éducation',
  'Finance',
  'Technologie',
  'Administration',
  'RH',
  'Métiers mécaniques',
  'Autre',
];

const destinations = [
  'Canada',
  'Luxembourg',
  'France',
  'Allemagne',
  'Suisse',
  'Belgique',
  'Pays-Bas',
  'Autre',
];

const visaTypes = [
  'Travail',
  'Études',
  'Visiteur',
  'Résidence permanente',
];

const educationLevels = [
  'Master / Diplôme supérieur',
  'Licence / Diplôme universitaire',
  'Baccalauréat',
  'Autre',
];

const englishLevels = [
  'Courant (C1/C2)',
  'Avancé (B2)',
  'Intermédiaire (B1)',
  'Débutant (A1/A2)',
  'Absent',
];

export default function PrimaryEvaluationForm() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState<EvaluationFormData>({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    destination: '',
    visaType: '',
    education: '',
    experience: 0,
    englishLevel: '',
    currentJob: '',
    sector: '',
    cvFile: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const submitMutation = trpc.evaluation.submit.useMutation();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Authentification requise</h2>
          <p className="text-gray-600 mb-6">
            Vous devez être connecté pour soumettre une évaluation.
          </p>
          <Button onClick={() => startLogin()} className="w-full">
            Se connecter
          </Button>
        </Card>
      </div>
    );
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.phone.trim()) newErrors.phone = 'Le téléphone est requis';
    if (!formData.destination) newErrors.destination = 'La destination est requise';
    if (!formData.visaType) newErrors.visaType = 'Le type de visa est requis';
    if (!formData.education) newErrors.education = 'Le niveau d\'études est requis';
    if (formData.experience < 0) newErrors.experience = 'L\'expérience doit être positive';
    if (!formData.englishLevel) newErrors.englishLevel = 'Le niveau d\'anglais est requis';
    if (!formData.currentJob.trim()) newErrors.currentJob = 'L\'emploi actuel est requis';
    if (!formData.sector) newErrors.sector = 'Le secteur est requis';
    if (!formData.cvFile) newErrors.cvFile = 'Le CV est requis';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'experience' ? parseInt(value) || 0 : value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          cvFile: 'Le CV doit être un fichier PDF ou Word',
        }));
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          cvFile: 'Le CV ne doit pas dépasser 5MB',
        }));
        return;
      }
      setFormData((prev) => ({
        ...prev,
        cvFile: file,
      }));
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.cvFile;
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors((previous) => {
      const next = { ...previous };
      delete next.submit;
      return next;
    });

    try {
      const destinationCategory = formData.destination === "Canada"
        ? "canada"
        : ["Luxembourg", "France", "Allemagne", "Suisse", "Belgique", "Pays-Bas"].includes(formData.destination)
          ? "schengen"
          : "autre";
      const visaType = destinationCategory === "canada"
        ? formData.visaType === "Études" ? "canada_etude" : formData.visaType === "Visiteur" ? "canada_tourisme" : "canada_rp"
        : destinationCategory === "schengen"
          ? formData.visaType === "Études" ? "schengen_etude" : formData.visaType === "Visiteur" ? "schengen_tourisme" : "schengen_travail"
          : "autre";

      let cvBase64: string | undefined;
      if (formData.cvFile) {
        cvBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error("Impossible de lire le CV"));
          reader.readAsDataURL(formData.cvFile as File);
        });
      }

      await submitMutation.mutateAsync({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        destinationCategory,
        destinationCountry: formData.destination,
        visaType,
        educationLevel: formData.education,
        yearsOfExperience: String(formData.experience),
        englishLevel: formData.englishLevel,
        industrySector: formData.sector,
        currentJobTitle: formData.currentJob,
        cvBase64,
        cvFileName: formData.cvFile?.name,
        cvMimeType: formData.cvFile?.type,
      });

      setSubmitSuccess(true);
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Une erreur est survenue lors de la soumission' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Évaluation soumise avec succès !
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Votre évaluation a été reçue. Vous recevrez les résultats par email
              dans les 24 heures. Vous pouvez également consulter votre espace pour
              voir l'état de votre évaluation.
            </p>
            {errors.submit && <p className="text-sm text-red-600">{errors.submit}</p>}
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                Votre demande est enregistrée. Consultez votre espace candidat pour suivre son traitement.
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Évaluation Primaire
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Soumettez vos informations et votre CV pour une évaluation par IA
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.submit && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{errors.submit}</p>}
            {/* Informations personnelles */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Informations Personnelles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+237 6XX XXX XXX"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.phone && (
                    <p className="text-red-600 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Destination et visa */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Destination et Type de Visa
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Destination souhaitée *
                  </label>
                  <select
                    name="destination"
                    value={formData.destination}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                      errors.destination ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Sélectionnez une destination</option>
                    {destinations.map((dest) => (
                      <option key={dest} value={dest}>
                        {dest}
                      </option>
                    ))}
                  </select>
                  {errors.destination && (
                    <p className="text-red-600 text-sm mt-1">{errors.destination}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de visa *
                  </label>
                  <select
                    name="visaType"
                    value={formData.visaType}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                      errors.visaType ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Sélectionnez un type</option>
                    {visaTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  {errors.visaType && (
                    <p className="text-red-600 text-sm mt-1">{errors.visaType}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Qualifications */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Qualifications
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Niveau d'études *
                  </label>
                  <select
                    name="education"
                    value={formData.education}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                      errors.education ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Sélectionnez un niveau</option>
                    {educationLevels.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                  {errors.education && (
                    <p className="text-red-600 text-sm mt-1">{errors.education}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Années d'expérience *
                  </label>
                  <input
                    type="number"
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    min="0"
                    max="70"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                      errors.experience ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.experience && (
                    <p className="text-red-600 text-sm mt-1">{errors.experience}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Niveau d'anglais *
                  </label>
                  <select
                    name="englishLevel"
                    value={formData.englishLevel}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                      errors.englishLevel ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Sélectionnez un niveau</option>
                    {englishLevels.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                  {errors.englishLevel && (
                    <p className="text-red-600 text-sm mt-1">{errors.englishLevel}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Emploi et secteur */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Emploi et Secteur
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emploi actuel *
                  </label>
                  <input
                    type="text"
                    name="currentJob"
                    value={formData.currentJob}
                    onChange={handleInputChange}
                    placeholder="Ex: Ingénieur Logiciel"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                      errors.currentJob ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.currentJob && (
                    <p className="text-red-600 text-sm mt-1">{errors.currentJob}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Secteur *
                  </label>
                  <select
                    name="sector"
                    value={formData.sector}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                      errors.sector ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Sélectionnez un secteur</option>
                    {sectors.map((sector) => (
                      <option key={sector} value={sector}>
                        {sector}
                      </option>
                    ))}
                  </select>
                  {errors.sector && (
                    <p className="text-red-600 text-sm mt-1">{errors.sector}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Upload CV */}
            <div className="pb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Télécharger votre CV
              </h2>
              <div className={`border-2 border-dashed rounded-lg p-6 text-center ${
                errors.cvFile ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-gray-50'
              }`}>
                <svg
                  className="w-12 h-12 mx-auto mb-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <label className="cursor-pointer">
                  <span className="text-blue-600 font-medium hover:text-blue-700">
                    Cliquez pour télécharger
                  </span>
                  <input
                    type="file"
                    name="cvFile"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                  />
                </label>
                <p className="text-gray-600 text-sm mt-2">
                  ou glissez-déposez votre CV
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  PDF ou Word (max 5MB)
                </p>
                {formData.cvFile && (
                  <p className="text-green-600 font-medium mt-3">
                    ✓ {formData.cvFile.name}
                  </p>
                )}
                {errors.cvFile && (
                  <p className="text-red-600 text-sm mt-2">{errors.cvFile}</p>
                )}
              </div>
            </div>

            {/* Erreur générale */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600">{errors.submit}</p>
              </div>
            )}

            {/* Boutons */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <Button variant="outline" className="flex-1">
                Annuler
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? 'Envoi en cours...' : 'Soumettre l\'évaluation'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
