import React from 'react';
import { motion } from 'framer-motion';

interface SessionLoaderProps {
  isLoading: boolean;
}

export const SessionLoader: React.FC<SessionLoaderProps> = ({ isLoading }) => {
  if (!isLoading) return null;

  const containerVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const skeletonVariants = {
    animate: {
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut' as const,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="fixed inset-0 bg-gradient-to-b from-[#0a2540] via-white to-white z-50 flex items-center justify-center"
    >
      {/* Contenu du loader */}
      <div className="w-full max-w-md px-6">
        {/* Logo skeleton */}
        <motion.div
          variants={skeletonVariants}
          animate="animate"
          className="w-24 h-24 mx-auto mb-8 bg-gradient-to-r from-slate-200 to-slate-300 rounded-full"
        />

        {/* Texte skeleton */}
        <motion.div
          variants={skeletonVariants}
          animate="animate"
          className="h-8 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg mb-4"
        />

        {/* Sous-texte skeleton */}
        <motion.div
          variants={skeletonVariants}
          animate="animate"
          className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg mb-8 w-3/4 mx-auto"
        />

        {/* Barres de chargement animées */}
        <div className="space-y-3 mb-8">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              variants={skeletonVariants}
              animate="animate"
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut' as const,
                delay: index * 0.2,
              }}
              className="h-3 bg-gradient-to-r from-blue-200 to-blue-300 rounded-full"
            />
          ))}
        </div>

        {/* Texte de statut */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center text-gray-600 text-sm font-medium"
        >
          Restauration de votre session...
        </motion.p>

        {/* Indicateur de progression */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut' as const,
          }}
          className="h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mt-4 origin-left"
        />
      </div>

      {/* Particules animées en arrière-plan */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            initial={{
              x: Math.random() * 100 - 50,
              y: Math.random() * 100 - 50,
              opacity: 0,
            }}
            animate={{
              x: Math.random() * 200 - 100,
              y: Math.random() * 200 - 100,
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut' as const,
              delay: i * 0.4,
            }}
            className="absolute w-2 h-2 bg-blue-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default SessionLoader;
