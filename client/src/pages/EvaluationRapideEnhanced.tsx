import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle2, ChevronRight, ChevronLeft, Zap } from 'lucide-react';
import { useLocation } from 'wouter';
import { procedures107Complete } from '@/data/procedures107Complete';

const STEPS = [
  { id: 1, title: 'Destination', icon: '🌍' },
  { id: 2, title: 'Type de Visa', icon: '📋' },
  { id: 3, title: 'Profil', icon: '👤' },
  { id: 4, title: 'Expérience', icon: '💼' },
  { id: 5, title: 'Budget', icon: '💰' },
  { id: 6, title: 'Délai', icon: '⏱️' },
  { id: 7, title: 'Résultats', icon: '✨' },
];

export default function EvaluationRapideEnhanced() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    destination: '',
    visaType: '',
    education: '',
    experience: '',
    budget: '',
    timeline: '',
  });

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Authentification requise</h2>
          <p className="text-gray-600 mb-6">
            Vous devez être connecté pour accéder à l'évaluation rapide.
          </p>
          <Button onClick={() => navigate('/')} className="w-full">
            Retour à l'accueil
          </Button>
        </Card>
      </div>
    );
  }

  const progressPercentage = (currentStep / STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = () => {
    console.log('Évaluation soumise:', formData);
    navigate('/payment/success');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* En-tête avec titre et badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="inline-block mb-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-block"
            >
              <Zap className="w-6 h-6 text-orange-500" />
            </motion.div>
            <span className="ml-2 text-sm font-bold text-orange-600 bg-orange-100 px-3 py-1 rounded-full">
              Évaluation Rapide
            </span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Trouvez votre destination idéale
          </h1>
          <p className="text-lg text-gray-600">
            Répondez à quelques questions pour obtenir des recommandations personnalisées
          </p>
        </motion.div>

        {/* Indicateurs d'étapes */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-semibold text-gray-700">
              Étape {currentStep} sur {STEPS.length}
            </span>
            <span className="text-sm font-semibold text-blue-600">
              {Math.round(progressPercentage)}% complété
            </span>
          </div>

          {/* Barre de progression */}
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden mb-6">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
            />
          </div>

          {/* Indicateurs d'étapes circulaires */}
          <div className="flex justify-between gap-2 overflow-x-auto pb-2">
            {STEPS.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setCurrentStep(step.id)}
                className="flex flex-col items-center cursor-pointer flex-shrink-0"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                    currentStep === step.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : currentStep > step.id
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {currentStep > step.id ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    step.icon
                  )}
                </motion.div>
                <span className="text-xs font-semibold text-gray-700 mt-1 text-center">
                  {step.title}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Contenu de l'étape */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl p-8 shadow-lg mb-8"
        >
          {/* Étape 1: Destination */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Quelle destination vous intéresse ?
              </h2>
              <p className="text-gray-600 mb-6">
                Choisissez le pays où vous aimeriez vous installer ou étudier.
              </p>
              <div className="space-y-3">
                {procedures107Complete.map(
                  (country) => (
                    <label
                      key={country.id}
                      className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                    >
                      <input
                        type="radio"
                        name="destination"
                        value={country.name}
                        checked={formData.destination === country.name}
                        onChange={(e) =>
                          handleInputChange('destination', e.target.value)
                        }
                        className="w-5 h-5"
                      />
                      <span className="ml-3 font-semibold text-gray-900">
                        {country.name}
                      </span>
                    </label>
                  )
                )}
              </div>
            </div>
          )}

          {/* Étape 2: Type de Visa */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Quel type de visa ?
              </h2>
              <p className="text-gray-600 mb-6">
                Sélectionnez votre catégorie de visa.
              </p>
              <Select
                value={formData.visaType}
                onValueChange={(value) =>
                  handleInputChange('visaType', value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choisissez un type de visa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="travail">Visa Travail</SelectItem>
                  <SelectItem value="etudes">Visa Études</SelectItem>
                  <SelectItem value="visiteur">Visa Visiteur</SelectItem>
                  <SelectItem value="entrepreneur">Visa Entrepreneur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Étape 3: Profil */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Votre niveau d'études
              </h2>
              <p className="text-gray-600 mb-6">
                Quel est votre plus haut niveau d'éducation ?
              </p>
              <Select
                value={formData.education}
                onValueChange={(value) =>
                  handleInputChange('education', value)
                }
              >
                <SelectTrigger className="w-full">
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
          )}

          {/* Étape 4: Expérience */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Votre expérience professionnelle
              </h2>
              <p className="text-gray-600 mb-6">
                Combien d'années d'expérience avez-vous ?
              </p>
              <Input
                type="number"
                placeholder="Nombre d'années"
                value={formData.experience}
                onChange={(e) =>
                  handleInputChange('experience', e.target.value)
                }
                className="w-full"
              />
            </div>
          )}

          {/* Étape 5: Budget */}
          {currentStep === 5 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Votre budget disponible
              </h2>
              <p className="text-gray-600 mb-6">
                Quel est votre budget pour ce projet ?
              </p>
              <Select
                value={formData.budget}
                onValueChange={(value) =>
                  handleInputChange('budget', value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionnez votre budget" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-500">0 - 500 000 FCFA</SelectItem>
                  <SelectItem value="500-1000">
                    500 000 - 1 000 000 FCFA
                  </SelectItem>
                  <SelectItem value="1000-2000">
                    1 000 000 - 2 000 000 FCFA
                  </SelectItem>
                  <SelectItem value="2000+">2 000 000+ FCFA</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Étape 6: Délai */}
          {currentStep === 6 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Quel est votre délai ?
              </h2>
              <p className="text-gray-600 mb-6">
                Dans combien de temps souhaitez-vous partir ?
              </p>
              <Select
                value={formData.timeline}
                onValueChange={(value) =>
                  handleInputChange('timeline', value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionnez votre délai" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">Urgent (moins de 3 mois)</SelectItem>
                  <SelectItem value="court">Court terme (3-6 mois)</SelectItem>
                  <SelectItem value="moyen">Moyen terme (6-12 mois)</SelectItem>
                  <SelectItem value="long">Long terme (plus de 12 mois)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Étape 7: Résultats */}
          {currentStep === 7 && (
            <div className="text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1 }}
                className="mb-6 flex justify-center"
              >
                <CheckCircle2 className="w-20 h-20 text-green-600" />
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Évaluation complète !
              </h2>
              <p className="text-gray-600 mb-6">
                Nous avons analysé votre profil et généré des recommandations personnalisées.
              </p>
              <div className="bg-blue-50 rounded-lg p-6 mb-6">
                <h3 className="font-bold text-gray-900 mb-3">
                  Résumé de votre profil :
                </h3>
                <ul className="text-left space-y-2 text-gray-700">
                  <li>
                    <strong>Destination :</strong> {formData.destination}
                  </li>
                  <li>
                    <strong>Type de visa :</strong> {formData.visaType}
                  </li>
                  <li>
                    <strong>Niveau d'études :</strong> {formData.education}
                  </li>
                  <li>
                    <strong>Expérience :</strong> {formData.experience} ans
                  </li>
                  <li>
                    <strong>Budget :</strong> {formData.budget}
                  </li>
                  <li>
                    <strong>Délai :</strong> {formData.timeline}
                  </li>
                </ul>
              </div>
            </div>
          )}
        </motion.div>

        {/* Boutons de navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex gap-4 justify-between"
        >
          <Button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Précédent
          </Button>

          {currentStep === STEPS.length ? (
            <Button
              onClick={handleSubmit}
              className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
            >
              Soumettre l'évaluation
              <CheckCircle2 className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
            >
              Suivant
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
