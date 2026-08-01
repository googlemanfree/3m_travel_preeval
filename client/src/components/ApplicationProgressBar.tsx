/**
 * Barre de progression du dossier
 * Affiche l'avancement du dossier (Évaluation → Bilan → Traduction → Soumission → Visa)
 */

import { CheckCircle, Circle, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Step {
  name: string;
  completed: boolean;
}

interface ApplicationProgressBarProps {
  progress: number;
  steps: Step[];
  currentStep: string;
}

export function ApplicationProgressBar({
  progress,
  steps,
  currentStep,
}: ApplicationProgressBarProps) {
  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <CardTitle className="text-lg">Progression de votre dossier</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Barre de progression */}
        <div className="space-y-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-700">
              {progress}% complété
            </span>
            <span className="text-sm text-gray-600">
              Étape actuelle: <span className="font-semibold text-blue-600">{currentStep}</span>
            </span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        {/* Étapes */}
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={step.name} className="flex items-center gap-3">
              {/* Icône */}
              <div className="flex-shrink-0">
                {step.completed ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : currentStep === step.name ? (
                  <Clock className="w-6 h-6 text-blue-500 animate-pulse" />
                ) : (
                  <Circle className="w-6 h-6 text-gray-300" />
                )}
              </div>

              {/* Texte */}
              <div className="flex-1">
                <p
                  className={`font-medium ${
                    step.completed
                      ? 'text-green-600'
                      : currentStep === step.name
                      ? 'text-blue-600'
                      : 'text-gray-400'
                  }`}
                >
                  {step.name}
                </p>
              </div>

              {/* Badge */}
              {step.completed && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  Complété
                </span>
              )}
              {currentStep === step.name && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full animate-pulse">
                  En cours
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Message d'encouragement */}
        <div className="bg-white border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-gray-700">
            {progress === 100 ? (
              <span className="text-green-600 font-semibold">
                ✓ Félicitations! Votre dossier est complet. Nous vous contacterons bientôt avec les résultats.
              </span>
            ) : (
              <span>
                Continuez à suivre les étapes pour compléter votre dossier. Vous êtes à{' '}
                <span className="font-semibold">{progress}%</span> du chemin!
              </span>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
