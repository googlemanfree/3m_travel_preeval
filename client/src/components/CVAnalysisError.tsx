import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface CVAnalysisErrorProps {
  isVisible: boolean;
  errorType: 'timeout' | 'network' | 'invalid_file' | 'unknown';
  onRetry: () => void;
  onCancel: () => void;
}

const ERROR_MESSAGES = {
  timeout: {
    title: '⏱️ Analyse Expirée',
    description: 'L\'analyse IA a dépassé le délai imparti. Veuillez réessayer.',
    icon: '⏳',
  },
  network: {
    title: '🌐 Erreur Réseau',
    description: 'Une erreur de connexion s\'est produite. Vérifiez votre connexion Internet.',
    icon: '📡',
  },
  invalid_file: {
    title: '📄 Fichier Invalide',
    description: 'Le fichier CV n\'est pas valide. Veuillez vérifier le format et la taille.',
    icon: '❌',
  },
  unknown: {
    title: '⚠️ Erreur Inconnue',
    description: 'Une erreur inattendue s\'est produite. Veuillez réessayer.',
    icon: '🔧',
  },
};

export default function CVAnalysisError({
  isVisible,
  errorType,
  onRetry,
  onCancel,
}: CVAnalysisErrorProps) {
  if (!isVisible) return null;

  const error = ERROR_MESSAGES[errorType];

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
        {/* Icon */}
        <motion.div
          animate={{ rotate: [0, -5, 5, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
          className="text-6xl text-center mb-4"
        >
          {error.icon}
        </motion.div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
          {error.title}
        </h2>

        {/* Description */}
        <p className="text-gray-600 text-center mb-6">
          {error.description}
        </p>

        {/* Error Details */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
        >
          <p className="text-sm text-red-700">
            <span className="font-semibold">Code d'erreur :</span> {errorType}
          </p>
          <p className="text-xs text-red-600 mt-2">
            Si le problème persiste, contactez notre support via WhatsApp.
          </p>
        </motion.div>

        {/* Buttons */}
        <div className="flex gap-3">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-1"
          >
            <Button
              onClick={onRetry}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2 rounded-lg transition-all"
            >
              🔄 Réessayer
            </Button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-1"
          >
            <Button
              onClick={onCancel}
              variant="outline"
              className="w-full border-2 border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2 rounded-lg transition-all"
            >
              Annuler
            </Button>
          </motion.div>
        </div>

        {/* Support Link */}
        <motion.a
          href="https://wa.me/237698104832?text=Bonjour%203M%20Travel%2C%20j%27ai%20besoin%20d%27aide%20pour%20l%27analyse%20de%20mon%20CV."
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.02 }}
          className="block text-center text-blue-600 hover:text-blue-700 text-sm font-medium mt-4 underline"
        >
          💬 Contacter le support WhatsApp
        </motion.a>
      </motion.div>
    </motion.div>
  );
}
