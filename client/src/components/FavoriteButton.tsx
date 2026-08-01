/**
 * Bouton de Favoris pour E-Visas
 * Permet d'ajouter/retirer des e-visas des favoris
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';

interface FavoriteButtonProps {
  countryCode: string;
  countryName: string;
  price?: number;
  processingTime?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function FavoriteButton({
  countryCode,
  countryName,
  price,
  processingTime,
  className = '',
  size = 'md',
}: FavoriteButtonProps) {
  const { isAuthenticated } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Vérifier si c'est un favori
  const { data: favoriteStatus } = trpc.evisaFavorites.isFavorite.useQuery(
    { countryCode },
    { enabled: isAuthenticated }
  );

  useEffect(() => {
    if (favoriteStatus) {
      setIsFavorite(favoriteStatus.isFavorite);
    }
  }, [favoriteStatus]);

  // Mutations
  const addFavoriteMutation = trpc.evisaFavorites.addFavorite.useMutation();
  const removeFavoriteMutation = trpc.evisaFavorites.removeFavorite.useMutation();

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      alert('Veuillez vous connecter pour ajouter des favoris');
      return;
    }

    setIsLoading(true);

    try {
      if (isFavorite) {
        await removeFavoriteMutation.mutateAsync({ countryCode });
        setIsFavorite(false);
      } else {
        await addFavoriteMutation.mutateAsync({
          countryCode,
          countryName,
          price,
          processingTime,
        });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Erreur lors de la modification des favoris:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleToggleFavorite}
      disabled={isLoading}
      className={`
        ${sizeClasses[size]}
        flex items-center justify-center
        rounded-full
        transition-all
        ${isFavorite
          ? 'bg-red-100 text-red-600 hover:bg-red-200'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    >
      <motion.div
        animate={isFavorite ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <Heart
          className={`${iconSizes[size]} ${isFavorite ? 'fill-current' : ''}`}
        />
      </motion.div>
    </motion.button>
  );
}
