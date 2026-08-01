/**
 * Page Mes Favoris
 * Affiche tous les e-visas sauvegardés par l'utilisateur
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FavoriteButton } from '@/components/FavoriteButton';
import {
  Heart,
  Clock,
  DollarSign,
  FileText,
  ChevronRight,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';

export function MyFavorites() {
  const [selectedFavorites, setSelectedFavorites] = useState<number[]>([]);

  // Récupérer les favoris
  const { data: favoritesData, isLoading, refetch } = trpc.evisaFavorites.getFavorites.useQuery();

  // Mutations
  const removeFavoriteMutation = trpc.evisaFavorites.removeFavorite.useMutation();
  const clearFavoriteMutation = trpc.evisaFavorites.clearFavorites.useMutation();

  const favorites = favoritesData?.data || [];

  const handleRemoveFavorite = async (countryCode: string) => {
    try {
      await removeFavoriteMutation.mutateAsync({ countryCode });
      refetch();
    } catch (error) {
      console.error('Erreur lors de la suppression du favori:', error);
    }
  };

  const handleClearAllFavorites = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer tous vos favoris ?')) {
      try {
        await clearFavoriteMutation.mutateAsync();
        refetch();
      } catch (error) {
        console.error('Erreur lors de la suppression des favoris:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-32 bg-gray-200" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 text-white rounded-lg p-8">
        <div className="flex items-center gap-3 mb-2">
          <Heart className="w-8 h-8 fill-current" />
          <h1 className="text-4xl font-bold">Mes Favoris</h1>
        </div>
        <p className="text-red-100">
          {favorites.length} e-visa{favorites.length !== 1 ? 's' : ''} sauvegardé
          {favorites.length !== 1 ? 's' : ''}
        </p>
      </div>

      {favorites.length > 0 ? (
        <>
          {/* Bouton de suppression globale */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleClearAllFavorites}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Effacer tous les favoris
            </Button>
          </div>

          {/* Grille des favoris */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(favorites as any[]).map((favorite: any, index: number) => (
              <motion.div
                key={favorite.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {favorite.countryName}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          Ajouté le{' '}
                          {new Date(favorite.addedAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <FavoriteButton
                        countryCode={favorite.countryCode}
                        countryName={favorite.countryName}
                        price={favorite.price}
                        processingTime={favorite.processingTime}
                        size="md"
                      />
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 flex-1">
                    {/* Informations principales */}
                    <div className="space-y-2">
                      {favorite.price && (
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="font-semibold">
                            {favorite.price.toLocaleString('fr-FR')} XOF
                          </span>
                        </div>
                      )}

                      {favorite.processingTime && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-orange-600" />
                          <span>{favorite.processingTime}</span>
                        </div>
                      )}
                    </div>

                    {/* Boutons d'action */}
                    <div className="pt-4 border-t space-y-2">
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() =>
                          (window.location.href = `/evisas/${favorite.countryCode}`)
                        }
                      >
                        <span>Demander un e-visa</span>
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleRemoveFavorite(favorite.countryCode)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Retirer des favoris
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <AlertCircle className="w-12 h-12 text-gray-400" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Aucun favori pour le moment
                </h3>
                <p className="text-gray-600 mb-4">
                  Explorez nos e-visas et ajoutez-les à vos favoris pour les consulter plus tard.
                </p>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => (window.location.href = '/evisas')}
                >
                  Découvrir les e-visas
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
