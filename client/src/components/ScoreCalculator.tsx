import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight, TrendingUp } from 'lucide-react';
import { useLocation } from 'wouter';

export default function ScoreCalculator() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [education, setEducation] = useState('');
  const [language, setLanguage] = useState('');
  const [destination, setDestination] = useState('');
  const [score, setScore] = useState<number | null>(null);

  const educationOptions = [
    { value: 'cap', label: 'CAP', points: 20 },
    { value: 'bac', label: 'Bac', points: 40 },
    { value: 'licence', label: 'Licence', points: 70 },
    { value: 'master', label: 'Master', points: 85 },
    { value: 'doctorat', label: 'Doctorat', points: 95 },
  ];

  const languageOptions = [
    { value: 'beginner', label: 'Débutant', points: 20 },
    { value: 'intermediate', label: 'Intermédiaire', points: 50 },
    { value: 'b2c1', label: 'B2/C1 Certifié', points: 85 },
  ];

  const destinationOptions = [
    { value: 'poland', label: '🇵🇱 Pologne', points: 70 },
    { value: 'canada', label: '🇨🇦 Canada', points: 75 },
    { value: 'uae', label: '🇦🇪 Émirats', points: 60 },
    { value: 'france', label: '🇫🇷 France', points: 65 },
    { value: 'luxembourg', label: '🇱🇺 Luxembourg', points: 80 },
    { value: 'belgium', label: '🇧🇪 Belgique', points: 68 },
  ];

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      calculateScore();
    }
  };

  const calculateScore = () => {
    const eduPoints = educationOptions.find(e => e.value === education)?.points || 0;
    const langPoints = languageOptions.find(l => l.value === language)?.points || 0;
    const destPoints = destinationOptions.find(d => d.value === destination)?.points || 0;
    
    const totalScore = Math.min(100, Math.round((eduPoints + langPoints + destPoints) / 3));
    setScore(totalScore);
  };

  const handleReset = () => {
    setStep(1);
    setEducation('');
    setLanguage('');
    setDestination('');
    setScore(null);
  };

  const handleValidate = () => {
    setLocation('/evaluation');
  };

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 px-4 py-2 rounded-full mb-4">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-600">Outil Interactif</span>
          </div>
          <h2 className="text-4xl font-black text-gray-900 mb-3">
            📊 Calculez vos chances d'éligibilité
          </h2>
          <p className="text-gray-600 text-lg">
            Répondez à 3 questions simples et découvrez votre indice de faisabilité en quelques secondes.
          </p>
        </div>

        <Card className="border-2 border-blue-100 shadow-xl">
          <CardContent className="p-8">
            {score === null ? (
              <div className="space-y-8">
                {/* Step 1: Education */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
                      <h3 className="text-xl font-bold text-gray-900">Quel est votre niveau d'études ?</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {educationOptions.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setEducation(opt.value)}
                          className={`p-4 text-left rounded-lg border-2 transition-all ${
                            education === opt.value
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="font-semibold text-gray-900">{opt.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 2: Language */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
                      <h3 className="text-xl font-bold text-gray-900">Quel est votre niveau de langue ?</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {languageOptions.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setLanguage(opt.value)}
                          className={`p-4 text-left rounded-lg border-2 transition-all ${
                            language === opt.value
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="font-semibold text-gray-900">{opt.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 3: Destination */}
                {step === 3 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
                      <h3 className="text-xl font-bold text-gray-900">Quelle est votre destination souhaitée ?</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {destinationOptions.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setDestination(opt.value)}
                          className={`p-4 text-left rounded-lg border-2 transition-all ${
                            destination === opt.value
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="font-semibold text-gray-900">{opt.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex gap-3 pt-6 border-t border-gray-200">
                  {step > 1 && (
                    <Button
                      onClick={() => setStep(step - 1)}
                      variant="outline"
                      className="flex-1"
                    >
                      Précédent
                    </Button>
                  )}
                  <Button
                    onClick={handleNext}
                    disabled={
                      (step === 1 && !education) ||
                      (step === 2 && !language) ||
                      (step === 3 && !destination)
                    }
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {step === 3 ? 'Calculer mon score' : 'Suivant'}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 text-center">
                <div>
                  <p className="text-gray-600 mb-2">Votre indice de faisabilité</p>
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                      <circle
                        cx="60"
                        cy="60"
                        r="54"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="8"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r="54"
                        fill="none"
                        stroke={score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'}
                        strokeWidth="8"
                        strokeDasharray={`${(score / 100) * 339.29} 339.29`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div>
                        <div className="text-4xl font-black text-gray-900">{score}</div>
                        <div className="text-sm text-gray-600">/100</div>
                      </div>
                    </div>
                  </div>
                  <p className="text-lg font-semibold text-gray-900 mt-4">
                    {score >= 75
                      ? '✅ Très éligible'
                      : score >= 50
                      ? '⚠️ Modérément éligible'
                      : '❌ Faiblement éligible'}
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    Cet indice est basé sur votre profil. Pour une évaluation complète et précise, validez votre bilan complet.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="flex-1"
                  >
                    Recommencer
                  </Button>
                  <Button
                    onClick={handleValidate}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    Valider mon bilan complet (65 000 FCFA) →
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
