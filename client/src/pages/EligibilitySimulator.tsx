/**
 * Page Simulateur d'Éligibilité
 * Aide les utilisateurs à déterminer leur éligibilité pour différents types de visa
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, HelpCircle, Download } from 'lucide-react';
import { ScrollAnimationWrapper } from '@/components/ScrollAnimationWrapper';

interface SimulatorQuestion {
  id: string;
  question: string;
  type: 'yes-no' | 'select' | 'text';
  options?: string[];
  required: boolean;
}

interface SimulatorResult {
  eligible: boolean;
  visaTypes: string[];
  score: number;
  recommendations: string[];
}

const SIMULATOR_QUESTIONS: SimulatorQuestion[] = [
  {
    id: 'purpose',
    question: 'Quel est votre objectif principal ?',
    type: 'select',
    options: ['Études', 'Travail', 'Tourisme', 'Immigration', 'Affaires'],
    required: true,
  },
  {
    id: 'education',
    question: 'Avez-vous un diplôme universitaire ?',
    type: 'yes-no',
    required: true,
  },
  {
    id: 'experience',
    question: 'Avez-vous une expérience professionnelle de plus de 2 ans ?',
    type: 'yes-no',
    required: true,
  },
  {
    id: 'language',
    question: 'Parlez-vous couramment l\'anglais ou une autre langue internationale ?',
    type: 'yes-no',
    required: true,
  },
  {
    id: 'financial',
    question: 'Disposez-vous de ressources financières suffisantes ?',
    type: 'yes-no',
    required: true,
  },
  {
    id: 'health',
    question: 'Êtes-vous en bonne santé (sans antécédents médicaux graves) ?',
    type: 'yes-no',
    required: true,
  },
];

const VISA_TYPES = {
  'Études': {
    icon: '🎓',
    description: 'Visa pour poursuivre des études supérieures',
    requirements: ['Diplôme secondaire', 'Ressources financières', 'Lettre d\'acceptation'],
  },
  'Travail': {
    icon: '💼',
    description: 'Visa de travail pour emploi qualifié',
    requirements: ['Expérience professionnelle', 'Offre d\'emploi', 'Qualification'],
  },
  'Tourisme': {
    icon: '✈️',
    description: 'Visa touristique pour voyages de loisir',
    requirements: ['Ressources financières', 'Billet retour', 'Assurance voyage'],
  },
  'Immigration': {
    icon: '🏠',
    description: 'Visa d\'immigration permanente',
    requirements: ['Points suffisants', 'Expérience', 'Ressources'],
  },
  'Affaires': {
    icon: '📊',
    description: 'Visa pour activités commerciales',
    requirements: ['Plan d\'affaires', 'Ressources', 'Expérience'],
  },
};

export default function EligibilitySimulator() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [result, setResult] = useState<SimulatorResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleAnswer = (value: any) => {
    const newAnswers = {
      ...answers,
      [SIMULATOR_QUESTIONS[currentStep].id]: value,
    };
    setAnswers(newAnswers);

    if (currentStep < SIMULATOR_QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      calculateResult(newAnswers);
    }
  };

  const calculateResult = (finalAnswers: Record<string, any>) => {
    const purpose = finalAnswers.purpose || '';
    const education = finalAnswers.education === 'yes';
    const experience = finalAnswers.experience === 'yes';
    const language = finalAnswers.language === 'yes';
    const financial = finalAnswers.financial === 'yes';
    const health = finalAnswers.health === 'yes';

    let score = 0;
    const recommendations: string[] = [];
    const visaTypes: string[] = [];

    // Calcul du score
    if (education) score += 20;
    if (experience) score += 20;
    if (language) score += 20;
    if (financial) score += 20;
    if (health) score += 20;

    // Déterminer les types de visa éligibles
    if (purpose === 'Études' && education && financial) {
      visaTypes.push('Études');
    }
    if (purpose === 'Travail' && experience && language) {
      visaTypes.push('Travail');
    }
    if (purpose === 'Tourisme' && financial) {
      visaTypes.push('Tourisme');
    }
    if (purpose === 'Immigration' && (education || experience) && language && financial) {
      visaTypes.push('Immigration');
    }
    if (purpose === 'Affaires' && experience && financial) {
      visaTypes.push('Affaires');
    }

    // Recommandations
    if (!education) recommendations.push('Obtenir un diplôme reconnu');
    if (!experience) recommendations.push('Acquérir une expérience professionnelle');
    if (!language) recommendations.push('Améliorer vos compétences linguistiques');
    if (!financial) recommendations.push('Constituer des ressources financières');
    if (!health) recommendations.push('Consulter un médecin pour les antécédents médicaux');

    const simulatorResult: SimulatorResult = {
      eligible: visaTypes.length > 0 && score >= 60,
      visaTypes,
      score,
      recommendations,
    };

    setResult(simulatorResult);
    setShowResult(true);
  };

  const resetSimulator = () => {
    setCurrentStep(0);
    setAnswers({});
    setResult(null);
    setShowResult(false);
  };

  const currentQuestion = SIMULATOR_QUESTIONS[currentStep];
  const progress = ((currentStep + 1) / SIMULATOR_QUESTIONS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pt-20">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <ScrollAnimationWrapper animation="slideUp" duration={0.7}>
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
              Simulateur d'Éligibilité
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Découvrez rapidement si vous êtes éligible pour le type de visa qui vous convient. Ce simulateur analyse votre profil en quelques minutes.
            </p>
          </div>
        </ScrollAnimationWrapper>

        {!showResult ? (
          <ScrollAnimationWrapper animation="slideUp" duration={0.7} delay={0.1}>
            <Card className="p-8 md:p-12 shadow-lg">
              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-700">
                    Question {currentStep + 1} sur {SIMULATOR_QUESTIONS.length}
                  </span>
                  <span className="text-sm font-semibold text-[#1E3A8A]">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* Question */}
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{currentQuestion.question}</h2>

                {/* Answer Options */}
                <div className="space-y-3">
                  {currentQuestion.type === 'yes-no' && (
                    <>
                      <Button
                        onClick={() => handleAnswer('yes')}
                        className="w-full py-3 bg-green-100 hover:bg-green-200 text-green-900 font-semibold rounded-lg transition-colors"
                      >
                        ✓ Oui
                      </Button>
                      <Button
                        onClick={() => handleAnswer('no')}
                        className="w-full py-3 bg-red-100 hover:bg-red-200 text-red-900 font-semibold rounded-lg transition-colors"
                      >
                        ✗ Non
                      </Button>
                    </>
                  )}

                  {currentQuestion.type === 'select' && currentQuestion.options && (
                    <>
                      {currentQuestion.options.map((option) => (
                        <Button
                          key={option}
                          onClick={() => handleAnswer(option)}
                          className="w-full py-3 bg-blue-100 hover:bg-blue-200 text-blue-900 font-semibold rounded-lg transition-colors"
                        >
                          {option}
                        </Button>
                      ))}
                    </>
                  )}
                </div>
              </motion.div>
            </Card>
          </ScrollAnimationWrapper>
        ) : result ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Result Card */}
            <Card className={`p-8 md:p-12 shadow-lg border-2 ${
              result.eligible ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'
            }`}>
              <div className="text-center mb-8">
                {result.eligible ? (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"
                    >
                      <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </motion.div>
                    <h2 className="text-3xl font-bold text-green-900 mb-2">Vous êtes éligible !</h2>
                    <p className="text-lg text-green-800">
                      Votre score d'éligibilité : <span className="font-bold">{result.score}/100</span>
                    </p>
                  </>
                ) : (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4"
                    >
                      <AlertCircle className="w-10 h-10 text-orange-600" />
                    </motion.div>
                    <h2 className="text-3xl font-bold text-orange-900 mb-2">Pas encore éligible</h2>
                    <p className="text-lg text-orange-800">
                      Votre score d'éligibilité : <span className="font-bold">{result.score}/100</span>
                    </p>
                  </>
                )}
              </div>

              {/* Eligible Visa Types */}
              {result.visaTypes.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Types de visa éligibles :</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.visaTypes.map((visaType) => {
                      const visa = VISA_TYPES[visaType as keyof typeof VISA_TYPES];
                      return (
                        <motion.div
                          key={visaType}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="bg-white p-4 rounded-lg border border-blue-200"
                        >
                          <div className="text-3xl mb-2">{visa.icon}</div>
                          <h4 className="font-bold text-gray-900 mb-1">{visaType}</h4>
                          <p className="text-sm text-gray-600 mb-3">{visa.description}</p>
                          <ul className="text-xs text-gray-700 space-y-1">
                            {visa.requirements.map((req) => (
                              <li key={req} className="flex items-start gap-2">
                                <span className="text-green-600 mt-0.5">✓</span>
                                <span>{req}</span>
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {result.recommendations.length > 0 && (
                <div className="mb-8 bg-white p-6 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3 mb-4">
                    <HelpCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-3">Recommandations :</h3>
                      <ul className="space-y-2">
                        {result.recommendations.map((rec) => (
                          <li key={rec} className="flex items-start gap-2 text-gray-700">
                            <span className="text-blue-600 mt-1">→</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={resetSimulator}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
                >
                  Recommencer
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Télécharger le rapport
                </Button>
              </div>

              <p className="text-center text-sm text-gray-600 mt-6">
                Pour une évaluation complète et personnalisée, <a href="/" className="text-blue-600 hover:underline font-semibold">contactez nos experts</a>.
              </p>
            </Card>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
