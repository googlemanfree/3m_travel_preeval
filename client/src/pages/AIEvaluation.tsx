import { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { startLogin } from '@/const';
import { trpc } from '@/lib/trpc';

interface QuizStep {
  id: string;
  title: string;
  question: string;
  type: 'select' | 'radio' | 'checkbox' | 'text' | 'number';
  options?: { value: string; label: string }[];
  required: boolean;
}

const quizSteps: QuizStep[] = [
  {
    id: 'destination',
    title: 'Destination souhaitée',
    question: 'Quel pays souhaitez-vous pour votre projet ?',
    type: 'select',
    options: [
      { value: 'canada', label: 'Canada' },
      { value: 'luxembourg', label: 'Luxembourg' },
      { value: 'france', label: 'France' },
      { value: 'allemagne', label: 'Allemagne' },
      { value: 'suisse', label: 'Suisse' },
      { value: 'autre', label: 'Autre destination' },
    ],
    required: true,
  },
  {
    id: 'visaType',
    title: 'Type de visa',
    question: 'Quel type de visa vous intéresse ?',
    type: 'radio',
    options: [
      { value: 'travail', label: 'Visa de travail' },
      { value: 'etudes', label: 'Visa d\'études' },
      { value: 'visiteur', label: 'Visa visiteur' },
      { value: 'residence', label: 'Résidence permanente' },
    ],
    required: true,
  },
  {
    id: 'education',
    title: 'Niveau d\'études',
    question: 'Quel est votre niveau d\'études le plus élevé ?',
    type: 'radio',
    options: [
      { value: 'master', label: 'Master / Diplôme supérieur' },
      { value: 'licence', label: 'Licence / Diplôme universitaire' },
      { value: 'bac', label: 'Baccalauréat' },
      { value: 'autre', label: 'Autre' },
    ],
    required: true,
  },
  {
    id: 'experience',
    title: 'Expérience professionnelle',
    question: 'Combien d\'années d\'expérience professionnelle avez-vous ?',
    type: 'number',
    required: true,
  },
  {
    id: 'language',
    title: 'Niveau de langue',
    question: 'Quel est votre niveau d\'anglais ?',
    type: 'radio',
    options: [
      { value: 'fluent', label: 'Courant (C1/C2)' },
      { value: 'advanced', label: 'Avancé (B2)' },
      { value: 'intermediate', label: 'Intermédiaire (B1)' },
      { value: 'beginner', label: 'Débutant (A1/A2)' },
    ],
    required: true,
  },
  {
    id: 'budget',
    title: 'Budget disponible',
    question: 'Quel est votre budget approximatif (en EUR) ?',
    type: 'number',
    required: false,
  },
  {
    id: 'timeline',
    title: 'Délai souhaité',
    question: 'Dans combien de mois souhaitez-vous partir ?',
    type: 'number',
    required: true,
  },
];

export default function AIEvaluation() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);

  // Rediriger vers login si non authentifié
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      startLogin();
    }
  }, [authLoading, isAuthenticated]);

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
            Vous devez être connecté pour effectuer une évaluation.
          </p>
          <Button onClick={() => startLogin()} className="w-full">
            Se connecter
          </Button>
        </Card>
      </div>
    );
  }

  const handleResponseChange = (value: any) => {
    const step = quizSteps[currentStep];
    setResponses({
      ...responses,
      [step.id]: value,
    });
  };

  const handleNext = () => {
    const step = quizSteps[currentStep];
    if (step.required && !responses[step.id]) {
      alert('Veuillez répondre à cette question');
      return;
    }
    if (currentStep < quizSteps.length - 1) {
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
      // Pour maintenant, on simule juste l'évaluation
      const score = Math.floor(Math.random() * 40 + 60); // Score entre 60-100
      const destinations = [
        { country: 'Canada', score: 85, reason: 'Excellent profil pour le Canada' },
        { country: 'Luxembourg', score: 78, reason: 'Très bon potentiel pour Luxembourg' },
        { country: 'France', score: 72, reason: 'Profil compatible avec la France' },
      ];
      
      setEvaluationResult({
        aiScore: score,
        aiReport: `Basé sur vos réponses, vous avez un profil ${score > 75 ? 'très favorable' : 'favorable'} pour les visas de ${responses.visaType}. Votre expérience de ${responses.experience} ans et votre niveau de langue ${responses.language} sont des atouts majeurs.`,
        recommendedDestinations: destinations,
      });
    } catch (error) {
      console.error('Erreur lors de la génération de l\'évaluation:', error);
      alert('Une erreur est survenue lors de la génération de l\'évaluation');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Afficher le résultat de l'évaluation
  if (evaluationResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Résultats de votre évaluation
              </h1>
              <p className="text-lg text-gray-600">
                Score: {evaluationResult.aiScore}/100
              </p>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8 rounded">
              <h2 className="text-2xl font-bold text-blue-900 mb-4">
                Recommandations personnalisées
              </h2>
              <div className="prose max-w-none">
                {evaluationResult.aiReport && (
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {evaluationResult.aiReport}
                  </p>
                )}
              </div>
            </div>

            {evaluationResult.recommendedDestinations && (
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Destinations recommandées
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {evaluationResult.recommendedDestinations.map((dest: any, idx: number) => (
                    <Card key={idx} className="p-4 border-2 border-blue-200">
                      <h4 className="font-bold text-lg text-gray-900">
                        {dest.country}
                      </h4>
                      <p className="text-sm text-gray-600 mt-2">
                        Score de compatibilité: {dest.score}%
                      </p>
                      <p className="text-sm text-gray-700 mt-2">
                        {dest.reason}
                      </p>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => setLocation('/mon-espace')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Ouvrir un dossier
              </Button>
              <Button
                onClick={() => {
                  setCurrentStep(0);
                  setResponses({});
                  setEvaluationResult(null);
                }}
                variant="outline"
              >
                Nouvelle évaluation
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Afficher le quiz
  const step = quizSteps[currentStep];
  const progress = ((currentStep + 1) / quizSteps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          {/* Barre de progression */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <h1 className="text-3xl font-bold text-gray-900">
                Évaluation IA
              </h1>
              <span className="text-sm font-medium text-gray-600">
                Étape {currentStep + 1} / {quizSteps.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Question */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {step.title}
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              {step.question}
            </p>

            {/* Options de réponse */}
            <div className="space-y-3">
              {step.type === 'select' && (
                <select
                  value={responses[step.id] || ''}
                  onChange={(e) => handleResponseChange(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Sélectionnez une option...</option>
                  {step.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}

              {step.type === 'radio' && (
                <div className="space-y-2">
                  {step.options?.map((opt) => (
                    <label key={opt.value} className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50">
                      <input
                        type="radio"
                        name={step.id}
                        value={opt.value}
                        checked={responses[step.id] === opt.value}
                        onChange={(e) => handleResponseChange(e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="ml-3 text-gray-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
              )}

              {step.type === 'number' && (
                <input
                  type="number"
                  value={responses[step.id] || ''}
                  onChange={(e) => handleResponseChange(e.target.value)}
                  placeholder="Entrez un nombre..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              )}

              {step.type === 'text' && (
                <input
                  type="text"
                  value={responses[step.id] || ''}
                  onChange={(e) => handleResponseChange(e.target.value)}
                  placeholder="Entrez votre réponse..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              )}
            </div>
          </div>

          {/* Boutons de navigation */}
          <div className="flex gap-4 justify-between">
            <Button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              variant="outline"
            >
              Précédent
            </Button>

            {currentStep === quizSteps.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? 'Traitement...' : 'Soumettre l\'évaluation'}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Suivant
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
