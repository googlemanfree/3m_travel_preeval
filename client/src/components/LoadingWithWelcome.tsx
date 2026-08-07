import { motion } from 'framer-motion';
import { Sparkles, CheckCircle2 } from 'lucide-react';

interface LoadingWithWelcomeProps {
  userName?: string;
  stage?: 'loading' | 'success';
  message?: string;
  onComplete?: () => void;
}

export default function LoadingWithWelcome({
  userName = 'Bienvenue',
  stage = 'loading',
  message = 'Création de votre compte en cours...',
  onComplete,
}: LoadingWithWelcomeProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
      },
    },
  };

  const pulseVariants = {
    initial: { scale: 1, opacity: 0.5 },
    animate: {
      scale: [1, 1.2, 1],
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 2,
        repeat: Infinity,
      },
    },
  };

  const rotateVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 3,
        repeat: Infinity,
      },
    },
  };

  if (stage === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center z-50"
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center max-w-md mx-4"
        >
          {/* Icône de succès animée */}
      <motion.div
        animate={{ rotate: 360, scale: [1, 1.1, 1] }}
        transition={{ duration: 0.8 }}
        className="mb-6 flex justify-center"
      >
            <CheckCircle2 className="w-24 h-24 text-green-600" />
          </motion.div>

          {/* Titre */}
          <motion.h1
            variants={itemVariants}
            className="text-4xl font-bold text-gray-900 mb-2"
          >
            Bienvenue {userName} ! 🎉
          </motion.h1>

          {/* Sous-titre */}
          <motion.p
            variants={itemVariants}
            className="text-lg text-gray-600 mb-6"
          >
            Votre compte a été créé avec succès.
          </motion.p>

          {/* Message personnalisé */}
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-lg p-6 border-2 border-green-200 mb-6"
          >
            <p className="text-gray-700 font-semibold">
              ✨ Prêt à démarrer votre évaluation gratuite ?
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Vous avez accès à tous les outils pour trouver votre destination idéale.
            </p>
          </motion.div>

          {/* Bouton de redirection */}
          <motion.button
            variants={itemVariants}
            onClick={onComplete}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all"
          >
            Commencer mon Évaluation Rapide →
          </motion.button>

          {/* Indicateurs de confiance */}
          <motion.div
            variants={itemVariants}
            className="flex justify-center gap-4 mt-8 text-sm text-gray-600"
          >
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span>Gratuit</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span>24h</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span>Sécurisé</span>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center z-50"
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="text-center max-w-md mx-4"
      >
        {/* Animation de chargement - Cercles concentriques */}
        <div className="mb-8 flex justify-center">
          <div className="relative w-32 h-32">
            {/* Cercle externe */}
            <motion.div
              variants={pulseVariants}
              initial="initial"
              animate="animate"
              className="absolute inset-0 rounded-full border-4 border-blue-200"
            />

            {/* Cercle interne avec rotation */}
            <motion.div
              variants={rotateVariants}
              animate="animate"
              className="absolute inset-2 rounded-full border-4 border-transparent border-t-blue-600 border-r-blue-400"
            />

            {/* Icône centrale */}
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Sparkles className="w-12 h-12 text-blue-600" />
            </motion.div>
          </div>
        </div>

        {/* Titre principal */}
        <motion.h1
          variants={itemVariants}
          className="text-4xl font-bold text-gray-900 mb-2"
        >
          Bienvenue {userName} ! 👋
        </motion.h1>

        {/* Message de chargement */}
        <motion.p
          variants={itemVariants}
          className="text-lg text-gray-600 mb-6"
        >
          {message}
        </motion.p>

        {/* Indicateurs de progression textuels */}
        <motion.div
          variants={itemVariants}
          className="space-y-3 mb-8"
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-3 text-left"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, delay: 0.5 }}
              className="w-3 h-3 rounded-full bg-green-500"
            />
            <span className="text-gray-700">Création du compte</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1 }}
            className="flex items-center gap-3 text-left"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, delay: 1 }}
              className="w-3 h-3 rounded-full bg-blue-500"
            />
            <span className="text-gray-700">Configuration du profil</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.5 }}
            className="flex items-center gap-3 text-left"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, delay: 1.5 }}
              className="w-3 h-3 rounded-full bg-indigo-500"
            />
            <span className="text-gray-700">Activation de votre espace</span>
          </motion.div>
        </motion.div>

        {/* Barre de progression */}
        <motion.div
          variants={itemVariants}
          className="w-full bg-gray-200 rounded-full h-2 overflow-hidden mb-6"
        >
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 3, ease: 'easeInOut' }}
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
          />
        </motion.div>

        {/* Message encourageant */}
          <motion.p
            variants={itemVariants}
            className="text-sm text-gray-600 italic"
          >
            Cela ne prendra que quelques secondes...
          </motion.p>
      </motion.div>
    </motion.div>
  );
}
