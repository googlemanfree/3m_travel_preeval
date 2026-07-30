import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const ANALYSIS_STEPS = [
  { id: 1, text: 'Analyse du CV en cours...', duration: 2000 },
  { id: 2, text: 'Extraction des compétences...', duration: 2000 },
  { id: 3, text: 'Évaluation de l\'expérience...', duration: 2000 },
  { id: 4, text: 'Calcul du score d\'admissibilité...', duration: 2000 },
  { id: 5, text: 'Génération des recommandations...', duration: 2000 },
];

interface CVAnalysisLoaderProps {
  isLoading: boolean;
  progress?: number;
}

export default function CVAnalysisLoader({ isLoading, progress = 0 }: CVAnalysisLoaderProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setCurrentStep(0);
      return;
    }

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < ANALYSIS_STEPS.length - 1) {
        stepIndex++;
        setCurrentStep(stepIndex);
      }
    }, ANALYSIS_STEPS[stepIndex]?.duration || 2000);

    return () => clearInterval(interval);
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-2xl font-bold text-[#0a2540] mb-2"
          >
            Analyse IA en cours
          </motion.h2>
          <p className="text-gray-600">Veuillez patienter...</p>
        </div>

        {/* Animated Logo */}
        <div className="flex justify-center mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl"
            >
              🤖
            </motion.div>
          </motion.div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: `${Math.min(progress, 95)}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600"
            />
          </div>
          <p className="text-sm text-gray-600 mt-2 text-center">
            {Math.min(progress, 95)}% complété
          </p>
        </div>

        {/* Status Messages */}
        <div className="space-y-3 mb-8">
          {ANALYSIS_STEPS.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: index <= currentStep ? 1 : 0.3,
                x: 0,
              }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-3"
            >
              {index < currentStep ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0"
                >
                  <span className="text-white text-sm">✓</span>
                </motion.div>
              ) : index === currentStep ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full flex-shrink-0"
                />
              ) : (
                <div className="w-6 h-6 border-2 border-gray-300 rounded-full flex-shrink-0" />
              )}
              <span
                className={`text-sm font-medium transition-colors ${
                  index <= currentStep ? 'text-gray-900' : 'text-gray-500'
                }`}
              >
                {step.text}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Animated Dots */}
        <div className="flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -8, 0] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              className="w-2 h-2 bg-blue-600 rounded-full"
            />
          ))}
        </div>

        {/* Estimated Time */}
        <p className="text-xs text-gray-500 text-center mt-6">
          Temps estimé : 10-15 secondes
        </p>
      </motion.div>
    </motion.div>
  );
}
