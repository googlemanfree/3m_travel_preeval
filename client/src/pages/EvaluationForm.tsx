import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import CVAnalysisLoader from '@/components/CVAnalysisLoader';
import CVAnalysisError from '@/components/CVAnalysisError';

const CITIES = ['Yaoundé', 'Douala', 'Bafoussam', 'Garoua', 'Buea', 'Limbe', 'Bamenda'];
const COUNTRIES = ['Canada', 'France', 'Australie', 'Belgique', 'États-Unis', 'Royaume-Uni', 'Suisse', 'Allemagne', 'Pays-Bas', 'Nouvelle-Zélande'];
const PROJECT_TYPES = ['Visa Travail', 'Visa Études', 'Visa Tourisme/Visiteur'];
const SECTORS = ['Informatique', 'Santé', 'Éducation', 'Finance', 'Construction', 'Autre'];
const EXPERIENCE_YEARS = ['0-2 ans', '2-5 ans', '5-10 ans', '10+ ans'];
const DIPLOMAS = ['Bac', 'Licence', 'Master', 'Doctorat'];
const LANGUAGE_TESTS = ['TEF', 'TCF', 'IELTS', 'TOEFL', 'Aucun'];

export default function EvaluationForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1
    fullName: '',
    email: '',
    whatsapp: '',
    city: '',
    destinationCountry: '',
    projectType: '',
    // Step 2 - Conditional
    sector: '',
    experience: '',
    diploma: '',
    languageTest: '',
    passportAvailable: '',
    cv: null as File | null,
    // Step 2 - Studies
    admissionStatus: '',
    financialCapacity: '',
    // Step 2 - Tourism
    travelMotif: '',
    visaRefusal: '',
    socioEconomicAttachment: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisError, setAnalysisError] = useState<'timeout' | 'network' | 'invalid_file' | 'unknown' | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Nom requis';
    if (!formData.email.trim()) newErrors.email = 'Email requis';
    if (!formData.whatsapp.trim()) newErrors.whatsapp = 'Téléphone requis';
    if (!formData.city) newErrors.city = 'Ville requise';
    if (!formData.destinationCountry) newErrors.destinationCountry = 'Pays requis';
    if (!formData.projectType) newErrors.projectType = 'Type de projet requis';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    
    if (formData.projectType === 'Visa Travail') {
      if (!formData.sector) newErrors.sector = 'Secteur requis';
      if (!formData.experience) newErrors.experience = 'Expérience requise';
      if (!formData.diploma) newErrors.diploma = 'Diplôme requis';
      if (!formData.languageTest) newErrors.languageTest = 'Test de langue requis';
      if (!formData.passportAvailable) newErrors.passportAvailable = 'Passeport requis';
      if (!formData.cv) newErrors.cv = 'CV requis';
    } else if (formData.projectType === 'Visa Études') {
      if (!formData.diploma) newErrors.diploma = 'Diplôme requis';
      if (!formData.admissionStatus) newErrors.admissionStatus = 'Statut admission requis';
      if (!formData.financialCapacity) newErrors.financialCapacity = 'Capacité financière requise';
    } else if (formData.projectType === 'Visa Tourisme/Visiteur') {
      if (!formData.travelMotif) newErrors.travelMotif = 'Motif du voyage requis';
      if (!formData.visaRefusal) newErrors.visaRefusal = 'Historique visas requis';
      if (!formData.socioEconomicAttachment) newErrors.socioEconomicAttachment = 'Attaches requises';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setIsSubmitting(true);
    setAnalysisError(null);

    try {
      // Validate CV file
      if (formData.cv) {
        const file = formData.cv as File;
        if (file.size > 10 * 1024 * 1024) {
          setAnalysisError('invalid_file');
          setIsAnalyzing(false);
          setIsSubmitting(false);
          return;
        }
      }

      // Set timeout for analysis (30 seconds)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('TIMEOUT')), 30000);
      });

      // Simulate progress
      const progressInterval = setInterval(() => {
        setAnalysisProgress((prev) => Math.min(prev + Math.random() * 15, 90));
      }, 500);

      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'cv' && value) {
          formDataToSend.append(key, value);
        } else if (value !== null && value !== '') {
          formDataToSend.append(key, String(value));
        }
      });

      // TODO: Call tRPC mutation to submit evaluation
      console.log('Form submitted:', formData);

      clearInterval(progressInterval);
      setAnalysisProgress(100);

      // Simulate delay for analysis
      await Promise.race([
        new Promise((resolve) => setTimeout(resolve, 2000)),
        timeoutPromise,
      ]);
    } catch (error: any) {
      console.error('Submission error:', error);
      if (error.message === 'TIMEOUT') {
        setAnalysisError('timeout');
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        setAnalysisError('network');
      } else {
        setAnalysisError('unknown');
      }
    } finally {
      setIsSubmitting(false);
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  };

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    setAnalysisError(null);
    handleSubmit();
  };

  const handleCancelError = () => {
    setAnalysisError(null);
    setStep(1);
  };

  return (
    <>
      <CVAnalysisLoader isLoading={isAnalyzing} progress={analysisProgress} />
      <CVAnalysisError
        isVisible={analysisError !== null}
        errorType={analysisError || 'unknown'}
        onRetry={handleRetry}
        onCancel={handleCancelError}
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#0a2540] mb-2">Évaluation d'Admissibilité</h1>
            <p className="text-gray-600">Étape {step} sur 2</p>
            <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: step === 1 ? '50%' : '100%' }}
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-600"
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Step 1: Profil Général */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nom & Prénom *</Label>
                  <Input
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Jean Dupont"
                    className={errors.fullName ? 'border-red-500' : ''}
                  />
                  {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="jean@example.com"
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Téléphone / WhatsApp *</Label>
                  <Input
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="+237 6XX XXX XXX"
                    className={errors.whatsapp ? 'border-red-500' : ''}
                  />
                  {errors.whatsapp && <p className="text-red-500 text-sm mt-1">{errors.whatsapp}</p>}
                </div>
                <div>
                  <Label>Ville *</Label>
                  <Select value={formData.city} onValueChange={(value) => setFormData({ ...formData, city: value })}>
                    <SelectTrigger className={errors.city ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Sélectionnez votre ville" />
                    </SelectTrigger>
                    <SelectContent>
                      {CITIES.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Pays de destination *</Label>
                  <Select value={formData.destinationCountry} onValueChange={(value) => setFormData({ ...formData, destinationCountry: value })}>
                    <SelectTrigger className={errors.destinationCountry ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Sélectionnez le pays" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map(country => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.destinationCountry && <p className="text-red-500 text-sm mt-1">{errors.destinationCountry}</p>}
                </div>
                <div>
                  <Label>Type de projet *</Label>
                  <Select value={formData.projectType} onValueChange={(value) => setFormData({ ...formData, projectType: value })}>
                    <SelectTrigger className={errors.projectType ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Sélectionnez le type" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.projectType && <p className="text-red-500 text-sm mt-1">{errors.projectType}</p>}
                </div>
              </div>

              <Button
                onClick={handleNext}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3"
              >
                Continuer vers l'étape 2 →
              </Button>
            </motion.div>
          )}

          {/* Step 2: Champs Conditionnels */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Visa Travail */}
              {formData.projectType === 'Visa Travail' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Secteur d'activité *</Label>
                      <Select value={formData.sector} onValueChange={(value) => setFormData({ ...formData, sector: value })}>
                        <SelectTrigger className={errors.sector ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Sélectionnez" />
                        </SelectTrigger>
                        <SelectContent>
                          {SECTORS.map(sector => (
                            <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.sector && <p className="text-red-500 text-sm mt-1">{errors.sector}</p>}
                    </div>
                    <div>
                      <Label>Années d'expérience *</Label>
                      <Select value={formData.experience} onValueChange={(value) => setFormData({ ...formData, experience: value })}>
                        <SelectTrigger className={errors.experience ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Sélectionnez" />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPERIENCE_YEARS.map(exp => (
                            <SelectItem key={exp} value={exp}>{exp}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.experience && <p className="text-red-500 text-sm mt-1">{errors.experience}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Dernier diplôme *</Label>
                      <Select value={formData.diploma} onValueChange={(value) => setFormData({ ...formData, diploma: value })}>
                        <SelectTrigger className={errors.diploma ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Sélectionnez" />
                        </SelectTrigger>
                        <SelectContent>
                          {DIPLOMAS.map(dip => (
                            <SelectItem key={dip} value={dip}>{dip}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.diploma && <p className="text-red-500 text-sm mt-1">{errors.diploma}</p>}
                    </div>
                    <div>
                      <Label>Test de langue *</Label>
                      <Select value={formData.languageTest} onValueChange={(value) => setFormData({ ...formData, languageTest: value })}>
                        <SelectTrigger className={errors.languageTest ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Sélectionnez" />
                        </SelectTrigger>
                        <SelectContent>
                          {LANGUAGE_TESTS.map(test => (
                            <SelectItem key={test} value={test}>{test}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.languageTest && <p className="text-red-500 text-sm mt-1">{errors.languageTest}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Passeport disponible *</Label>
                      <Select value={formData.passportAvailable} onValueChange={(value) => setFormData({ ...formData, passportAvailable: value })}>
                        <SelectTrigger className={errors.passportAvailable ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Sélectionnez" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Oui">Oui</SelectItem>
                          <SelectItem value="Non">Non</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.passportAvailable && <p className="text-red-500 text-sm mt-1">{errors.passportAvailable}</p>}
                    </div>
                    <div>
                      <Label>Télécharger CV (PDF/DOC) *</Label>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => setFormData({ ...formData, cv: e.target.files?.[0] || null })}
                        className={`block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 ${errors.cv ? 'border-red-500' : ''}`}
                      />
                      {errors.cv && <p className="text-red-500 text-sm mt-1">{errors.cv}</p>}
                    </div>
                  </div>
                </>
              )}

              {/* Visa Études */}
              {formData.projectType === 'Visa Études' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Dernier diplôme *</Label>
                      <Select value={formData.diploma} onValueChange={(value) => setFormData({ ...formData, diploma: value })}>
                        <SelectTrigger className={errors.diploma ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Sélectionnez" />
                        </SelectTrigger>
                        <SelectContent>
                          {DIPLOMAS.map(dip => (
                            <SelectItem key={dip} value={dip}>{dip}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.diploma && <p className="text-red-500 text-sm mt-1">{errors.diploma}</p>}
                    </div>
                    <div>
                      <Label>Statut d'admission *</Label>
                      <Select value={formData.admissionStatus} onValueChange={(value) => setFormData({ ...formData, admissionStatus: value })}>
                        <SelectTrigger className={errors.admissionStatus ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Sélectionnez" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Non débuté">Non débuté</SelectItem>
                          <SelectItem value="En cours">En cours</SelectItem>
                          <SelectItem value="Admis">Admis</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.admissionStatus && <p className="text-red-500 text-sm mt-1">{errors.admissionStatus}</p>}
                    </div>
                  </div>

                  <div>
                    <Label>Capacité financière / Garant *</Label>
                    <Textarea
                      value={formData.financialCapacity}
                      onChange={(e) => setFormData({ ...formData, financialCapacity: e.target.value })}
                      placeholder="Décrivez votre capacité financière..."
                      className={errors.financialCapacity ? 'border-red-500' : ''}
                      rows={4}
                    />
                    {errors.financialCapacity && <p className="text-red-500 text-sm mt-1">{errors.financialCapacity}</p>}
                  </div>
                </>
              )}

              {/* Visa Tourisme */}
              {formData.projectType === 'Visa Tourisme/Visiteur' && (
                <>
                  <div>
                    <Label>Motif du voyage *</Label>
                    <Textarea
                      value={formData.travelMotif}
                      onChange={(e) => setFormData({ ...formData, travelMotif: e.target.value })}
                      placeholder="Décrivez le motif de votre voyage..."
                      className={errors.travelMotif ? 'border-red-500' : ''}
                      rows={3}
                    />
                    {errors.travelMotif && <p className="text-red-500 text-sm mt-1">{errors.travelMotif}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Refus antérieurs *</Label>
                      <Select value={formData.visaRefusal} onValueChange={(value) => setFormData({ ...formData, visaRefusal: value })}>
                        <SelectTrigger className={errors.visaRefusal ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Sélectionnez" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Oui">Oui</SelectItem>
                          <SelectItem value="Non">Non</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.visaRefusal && <p className="text-red-500 text-sm mt-1">{errors.visaRefusal}</p>}
                    </div>
                    <div>
                      <Label>Attaches socio-économiques *</Label>
                      <Select value={formData.socioEconomicAttachment} onValueChange={(value) => setFormData({ ...formData, socioEconomicAttachment: value })}>
                        <SelectTrigger className={errors.socioEconomicAttachment ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Sélectionnez" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Emploi CDI">Emploi CDI</SelectItem>
                          <SelectItem value="Entreprise">Entreprise</SelectItem>
                          <SelectItem value="Immobilier">Immobilier</SelectItem>
                          <SelectItem value="Autre">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.socioEconomicAttachment && <p className="text-red-500 text-sm mt-1">{errors.socioEconomicAttachment}</p>}
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-4">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="flex-1 py-3"
                >
                  ← Retour
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3"
                >
                  {isSubmitting ? 'Soumission...' : 'Soumettre mon évaluation'}
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
    </>
  );
}
