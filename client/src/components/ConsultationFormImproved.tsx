import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const FORM_STEPS = [
  { id: 'personal', label: 'Informations Personnelles', fields: ['fullName', 'email', 'phone'] },
  { id: 'academic', label: 'Profil Académique', fields: ['education', 'field', 'gpa'] },
  { id: 'financial', label: 'Situation Financière', fields: ['income', 'savings', 'sponsorship'] },
  { id: 'linguistic', label: 'Compétences Linguistiques', fields: ['languages', 'testScores'] },
  { id: 'goals', label: 'Objectifs', fields: ['targetCountry', 'targetProgram', 'message'] },
];

export function ConsultationFormImproved() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    education: '',
    field: '',
    gpa: '',
    income: '',
    savings: '',
    sponsorship: false,
    languages: '',
    testScores: '',
    targetCountry: '',
    targetProgram: '',
    message: '',
  });

  const currentStepData = FORM_STEPS[currentStep];
  const progressPercentage = ((currentStep + 1) / FORM_STEPS.length) * 100;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    if (currentStep < FORM_STEPS.length - 1) {
      setCompletedSteps([...completedSteps, currentStep]);
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setCompletedSteps([...completedSteps, currentStep]);
      // Handle success
      console.log('Form submitted:', formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-gray-900">
            Étape {currentStep + 1} / {FORM_STEPS.length}
          </h2>
          <span className="text-sm font-medium text-gray-600">{Math.round(progressPercentage)}%</span>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between mt-4">
          {FORM_STEPS.map((step, index) => (
            <motion.div
              key={step.id}
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-all ${
                  index < currentStep
                    ? 'bg-green-500 text-white'
                    : index === currentStep
                    ? 'bg-blue-500 text-white ring-2 ring-blue-300'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index < currentStep ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-bold">{index + 1}</span>
                )}
              </div>
              <span className="text-xs text-center text-gray-600 max-w-[60px]">{step.label}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">{currentStepData.label}</h3>

          <div className="space-y-4">
            {currentStep === 0 && (
              <>
                <div>
                  <Label htmlFor="fullName">Nom Complet</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Ex: Jean Dupont"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Ex: jean@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Ex: +237 6XX XXX XXX"
                  />
                </div>
              </>
            )}

            {currentStep === 1 && (
              <>
                <div>
                  <Label htmlFor="education">Niveau d'Études</Label>
                  <Select value={formData.education} onValueChange={(value) => handleSelectChange('education', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez votre niveau" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bac">Baccalauréat</SelectItem>
                      <SelectItem value="licence">Licence</SelectItem>
                      <SelectItem value="master">Master</SelectItem>
                      <SelectItem value="doctorat">Doctorat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="field">Domaine d'Études</Label>
                  <Input
                    id="field"
                    name="field"
                    value={formData.field}
                    onChange={handleInputChange}
                    placeholder="Ex: Informatique, Médecine, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="gpa">Moyenne Générale (GPA ou Note)</Label>
                  <Input
                    id="gpa"
                    name="gpa"
                    value={formData.gpa}
                    onChange={handleInputChange}
                    placeholder="Ex: 3.8 ou 18/20"
                  />
                </div>
              </>
            )}

            {currentStep === 2 && (
              <>
                <div>
                  <Label htmlFor="income">Revenu Annuel (USD)</Label>
                  <Input
                    id="income"
                    name="income"
                    type="number"
                    value={formData.income}
                    onChange={handleInputChange}
                    placeholder="Ex: 50000"
                  />
                </div>
                <div>
                  <Label htmlFor="savings">Épargne (USD)</Label>
                  <Input
                    id="savings"
                    name="savings"
                    type="number"
                    value={formData.savings}
                    onChange={handleInputChange}
                    placeholder="Ex: 25000"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="sponsorship"
                    checked={formData.sponsorship}
                    onChange={(e) => setFormData(prev => ({ ...prev, sponsorship: e.target.checked }))}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="sponsorship" className="cursor-pointer">Avez-vous une bourse ou parrainage?</Label>
                </div>
              </>
            )}

            {currentStep === 3 && (
              <>
                <div>
                  <Label htmlFor="languages">Langues Parlées</Label>
                  <Input
                    id="languages"
                    name="languages"
                    value={formData.languages}
                    onChange={handleInputChange}
                    placeholder="Ex: Français, Anglais, Allemand"
                  />
                </div>
                <div>
                  <Label htmlFor="testScores">Scores de Tests Linguistiques</Label>
                  <Input
                    id="testScores"
                    name="testScores"
                    value={formData.testScores}
                    onChange={handleInputChange}
                    placeholder="Ex: TOEFL 100, DELF B2"
                  />
                </div>
              </>
            )}

            {currentStep === 4 && (
              <>
                <div>
                  <Label htmlFor="targetCountry">Pays de Destination</Label>
                  <Select value={formData.targetCountry} onValueChange={(value) => handleSelectChange('targetCountry', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un pays" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="france">France</SelectItem>
                      <SelectItem value="canada">Canada</SelectItem>
                      <SelectItem value="belgique">Belgique</SelectItem>
                      <SelectItem value="suisse">Suisse</SelectItem>
                      <SelectItem value="allemagne">Allemagne</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="targetProgram">Programme Cible</Label>
                  <Input
                    id="targetProgram"
                    name="targetProgram"
                    value={formData.targetProgram}
                    onChange={handleInputChange}
                    placeholder="Ex: Master en Informatique"
                  />
                </div>
                <div>
                  <Label htmlFor="message">Message Supplémentaire</Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Parlez-nous de vos objectifs et de vos préoccupations..."
                    rows={4}
                  />
                </div>
              </>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Navigation Buttons */}
      <div className="flex justify-between gap-3">
        <Button
          onClick={handlePrevious}
          disabled={currentStep === 0}
          variant="outline"
          className="flex-1"
        >
          Précédent
        </Button>

        {currentStep < FORM_STEPS.length - 1 ? (
          <Button
            onClick={handleNext}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Suivant
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              'Soumettre'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
