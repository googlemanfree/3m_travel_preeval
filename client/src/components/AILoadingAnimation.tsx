/**
 * AILoadingAnimation — Animation de chargement interactive pour l'analyse IA du CV
 * Affiche les étapes : Extraction → Analyse → Génération → Envoi
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Zap, FileText, Brain, Mail, CheckCircle } from "lucide-react";

interface AILoadingAnimationProps {
  isVisible: boolean;
}

export default function AILoadingAnimation({ isVisible }: AILoadingAnimationProps) {
  const [currentStep, setCurrentStep] = useState(0);

  // Avancer automatiquement à travers les étapes
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < 3 ? prev + 1 : 0));
    }, 2500); // Changer d'étape toutes les 2.5 secondes

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  const steps = [
    {
      icon: FileText,
      label: "Extraction du CV",
      description: "Lecture et extraction du texte...",
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: Brain,
      label: "Analyse IA",
      description: "Évaluation intelligente en cours...",
      color: "from-purple-500 to-purple-600",
    },
    {
      icon: Zap,
      label: "Génération du rapport",
      description: "Création du rapport personnalisé...",
      color: "from-orange-500 to-orange-600",
    },
    {
      icon: Mail,
      label: "Envoi par email",
      description: "Transmission du rapport...",
      color: "from-green-500 to-green-600",
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4"
      >
        {/* En-tête */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="inline-block mb-4"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <Brain className="w-8 h-8 text-white" />
            </div>
          </motion.div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">Analyse IA en cours</h3>
          <p className="text-sm text-gray-500">Veuillez patienter quelques secondes...</p>
        </div>

        {/* Étapes animées */}
        <div className="space-y-3 mb-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <motion.div
                key={index}
                animate={{
                  backgroundColor: isActive ? "rgba(59, 130, 246, 0.1)" : "transparent",
                  scale: isActive ? 1.02 : 1,
                }}
                transition={{ duration: 0.3 }}
                className="p-3 rounded-lg border-2 border-transparent"
              >
                <div className="flex items-center gap-3">
                  {/* Icône avec animation */}
                  <motion.div
                    animate={isActive ? { scale: [1, 1.2, 1] } : {}}
                    transition={isActive ? { duration: 0.6, repeat: Infinity } : {}}
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br ${step.color}`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5 text-white" />
                    ) : (
                      <Icon className="w-5 h-5 text-white" />
                    )}
                  </motion.div>

                  {/* Texte */}
                  <div className="flex-1 min-w-0">
                    <motion.p
                      animate={{ opacity: isActive ? 1 : 0.6 }}
                      className="text-sm font-semibold text-gray-900"
                    >
                      {step.label}
                    </motion.p>
                    <motion.p
                      animate={{ opacity: isActive ? 1 : 0.4 }}
                      className="text-xs text-gray-500 truncate"
                    >
                      {isActive ? step.description : "Complété"}
                    </motion.p>
                  </div>

                  {/* Indicateur de progression */}
                  {isActive && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="flex-shrink-0"
                    >
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Barre de progression globale */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-gray-600">Progression</span>
            <span className="text-xs font-bold text-blue-600">{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
            />
          </div>
        </div>

        {/* Message d'encouragement */}
        <motion.p
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-center text-xs text-gray-500 italic"
        >
          ✨ Notre IA analyse votre profil pour vous proposer les meilleures destinations...
        </motion.p>
      </motion.div>
    </div>
  );
}
