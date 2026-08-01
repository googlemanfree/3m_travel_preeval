import { CheckCircle, Circle } from 'lucide-react';

interface Step {
  id: string;
  label: string;
  description?: string;
}

interface FormProgressBarProps {
  steps: Step[];
  currentStep: number;
}

export function FormProgressBar({ steps, currentStep }: FormProgressBarProps) {
  return (
    <div className="mb-8">
      {/* Barre de progression visuelle */}
      <div className="flex items-center justify-between mb-6">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            {/* Cercle étape */}
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  index < currentStep
                    ? 'bg-green-600 text-white'
                    : index === currentStep
                    ? 'bg-blue-600 text-white ring-4 ring-blue-200'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index < currentStep ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <p className="text-xs font-medium text-gray-700 mt-2 text-center max-w-[80px]">
                {step.label}
              </p>
            </div>

            {/* Ligne de connexion */}
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-1 mx-2 transition-all ${
                  index < currentStep ? 'bg-green-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Description de l'étape actuelle */}
      {steps[currentStep]?.description && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">{steps[currentStep].description}</p>
        </div>
      )}
    </div>
  );
}
