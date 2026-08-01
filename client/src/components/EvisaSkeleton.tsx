/**
 * Skeleton Screens pour les E-Visas
 * Animations de chargement fluides avec Framer Motion
 */

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

/**
 * Skeleton pour une carte e-visa
 */
export function EvisaCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="space-y-3">
          {/* Flag skeleton */}
          <motion.div
            className="w-12 h-8 bg-gray-200 rounded"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          {/* Titre skeleton */}
          <motion.div
            className="h-6 bg-gray-200 rounded w-3/4"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          {/* Sous-titre skeleton */}
          <motion.div
            className="h-4 bg-gray-200 rounded w-1/2"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Informations skeleton */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between items-center">
            <motion.div
              className="h-4 bg-gray-200 rounded w-1/3"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
            />
            <motion.div
              className="h-4 bg-gray-200 rounded w-1/4"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
            />
          </div>
        ))}
        {/* Bouton skeleton */}
        <motion.div
          className="h-10 bg-gray-200 rounded mt-4"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
        />
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton pour la grille d'e-visas
 */
export function EvisasGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <EvisaCardSkeleton />
        </motion.div>
      ))}
    </div>
  );
}

/**
 * Skeleton pour les filtres
 */
export function EvisasFilterSkeleton() {
  return (
    <div className="space-y-4 mb-6">
      <div className="flex gap-4 flex-wrap">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="h-10 bg-gray-200 rounded-full w-24"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
          />
        ))}
      </div>
      <motion.div
        className="h-10 bg-gray-200 rounded w-full"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
    </div>
  );
}

/**
 * Skeleton pour les statistiques
 */
export function EvisasStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {[1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="bg-white p-4 rounded-lg border border-gray-200"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
        >
          <div className="space-y-3">
            <motion.div
              className="h-4 bg-gray-200 rounded w-3/4"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <motion.div
              className="h-8 bg-gray-200 rounded w-1/2"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/**
 * Skeleton pour la page de détails d'un e-visa
 */
export function EvisaDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        <div className="flex items-start gap-4">
          <motion.div
            className="w-16 h-16 bg-gray-200 rounded"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <div className="flex-1 space-y-3">
            <motion.div
              className="h-8 bg-gray-200 rounded w-3/4"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <motion.div
              className="h-4 bg-gray-200 rounded w-1/2"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
            />
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Colonne gauche */}
        <div className="md:col-span-2 space-y-6">
          {[1, 2, 3].map((section) => (
            <div key={section} className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
              <motion.div
                className="h-6 bg-gray-200 rounded w-1/3"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <div className="space-y-3">
                {[1, 2, 3].map((line) => (
                  <motion.div
                    key={line}
                    className="h-4 bg-gray-200 rounded"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: line * 0.05 }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Colonne droite */}
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="bg-white p-4 rounded-lg border border-gray-200 space-y-3"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
            >
              <motion.div
                className="h-4 bg-gray-200 rounded w-2/3"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <motion.div
                className="h-6 bg-gray-200 rounded w-1/2"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton pour la liste de pagination
 */
export function EvisasPaginationSkeleton() {
  return (
    <div className="flex justify-center gap-2 mt-8">
      {[1, 2, 3, 4, 5].map((i) => (
        <motion.div
          key={i}
          className="w-10 h-10 bg-gray-200 rounded"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton pour le formulaire de demande e-visa
 */
export function EvisaFormSkeleton() {
  return (
    <div className="space-y-6">
      {/* Sélection du dossier */}
      <div className="space-y-3">
        <motion.div
          className="h-4 bg-gray-200 rounded w-1/4"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <motion.div
          className="h-10 bg-gray-200 rounded"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
        />
      </div>

      {/* Champs du formulaire */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-3">
          <motion.div
            className="h-4 bg-gray-200 rounded w-1/3"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.05 }}
          />
          <motion.div
            className="h-10 bg-gray-200 rounded"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.05 + 0.1 }}
          />
        </div>
      ))}

      {/* Bouton */}
      <motion.div
        className="h-12 bg-gray-200 rounded"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
      />
    </div>
  );
}
