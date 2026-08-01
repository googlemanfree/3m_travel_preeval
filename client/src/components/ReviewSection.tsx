import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, ThumbsUp, ThumbsDown, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReviewSectionProps {
  countryCode: string;
  onAddReview?: () => void;
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({ countryCode, onAddReview }) => {
  const [selectedRating, setSelectedRating] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(0);
  const limit = 5;

  // Récupérer les avis
  const { data: reviewsData, isLoading } = trpc.evisaReviews.getReviewsByCountry.useQuery({
    countryCode,
    limit,
    offset: page * limit,
    rating: selectedRating,
  });

  const reviews = (reviewsData?.reviews as any[]) || [];
  const stats = (reviewsData?.stats as any) || {};
  const total = (reviewsData?.total as number) || 0;

  // Marquer comme utile
  const markHelpfulMutation = trpc.evisaReviews.markHelpful.useMutation();

  const handleMarkHelpful = (reviewId: number, helpful: boolean) => {
    markHelpfulMutation.mutate({ reviewId, helpful });
  };

  const averageRating = stats.averageRating || 0;
  const totalReviews = stats.totalReviews || 0;

  const ratingDistribution = [
    { stars: 5, count: stats.fiveStars || 0 },
    { stars: 4, count: stats.fourStars || 0 },
    { stars: 3, count: stats.threeStars || 0 },
    { stars: 2, count: stats.twoStars || 0 },
    { stars: 1, count: stats.oneStar || 0 },
  ];

  const visaSuccessRate = totalReviews > 0 ? Math.round((stats.visaObtainedCount / totalReviews) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* En-tête avec statistiques */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Avis et Expériences</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Note moyenne */}
          <Card className="p-4 bg-white">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">Note moyenne</p>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold text-gray-900">{averageRating.toFixed(1)}</span>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={i < Math.round(averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Total d'avis */}
          <Card className="p-4 bg-white">
            <p className="text-sm text-gray-600 mb-1">Nombre d'avis</p>
            <p className="text-3xl font-bold text-gray-900">{totalReviews}</p>
          </Card>

          {/* Taux de succès */}
          <Card className="p-4 bg-white">
            <p className="text-sm text-gray-600 mb-1">Visa obtenu</p>
            <p className="text-3xl font-bold text-green-600">{visaSuccessRate}%</p>
          </Card>

          {/* Bouton ajouter avis */}
          <Card className="p-4 bg-white flex items-center justify-center">
            <Button
              onClick={onAddReview}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Ajouter un avis
            </Button>
          </Card>
        </div>
      </div>

      {/* Distribution des notes */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900">Distribution des notes</h3>
        {ratingDistribution.map(({ stars, count }) => {
          const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
          return (
            <div key={stars} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-20">
                <span className="text-sm font-medium text-gray-600">{stars}</span>
                <Star size={14} className="fill-yellow-400 text-yellow-400" />
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="bg-yellow-400 h-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
            </div>
          );
        })}
      </div>

      {/* Filtres par note */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedRating === undefined ? 'default' : 'outline'}
          onClick={() => setSelectedRating(undefined)}
          size="sm"
        >
          Tous les avis
        </Button>
        {[5, 4, 3, 2, 1].map((rating) => (
          <Button
            key={rating}
            variant={selectedRating === rating ? 'default' : 'outline'}
            onClick={() => {
              setSelectedRating(rating);
              setPage(0);
            }}
            size="sm"
            className="flex items-center gap-1"
          >
            {rating}
            <Star size={14} className="fill-current" />
          </Button>
        ))}
      </div>

      {/* Liste des avis */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader className="animate-spin text-blue-600" />
          </div>
        ) : reviews.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-600">Aucun avis disponible pour le moment.</p>
          </Card>
        ) : (
          <AnimatePresence>
            {(reviews as any[]).map((review: any, index: number) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-4 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">{review.title}</h4>
                        {review.visaObtained && (
                          <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
                            ✓ Visa obtenu
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">par {review.candidateName}</p>
                    </div>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-gray-700 mb-3">{review.comment}</p>

                  {review.travelDate && (
                    <p className="text-xs text-gray-500 mb-3">
                      Voyage: {new Date(review.travelDate).toLocaleDateString('fr-FR')}
                    </p>
                  )}

                  <div className="flex items-center gap-4 pt-3 border-t border-gray-200">
                    <span className="text-xs text-gray-500">
                      Utile? {review.helpful + review.unhelpful} votes
                    </span>
                    <div className="flex gap-2 ml-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkHelpful(review.id, true)}
                        className="flex items-center gap-1 text-gray-600 hover:text-green-600"
                      >
                        <ThumbsUp size={16} />
                        <span className="text-xs">{review.helpful}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkHelpful(review.id, false)}
                        className="flex items-center gap-1 text-gray-600 hover:text-red-600"
                      >
                        <ThumbsDown size={16} />
                        <span className="text-xs">{review.unhelpful}</span>
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="flex justify-center gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
          >
            Précédent
          </Button>
          <span className="flex items-center px-4 text-sm text-gray-600">
            Page {page + 1} sur {Math.ceil(total / limit)}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={(page + 1) * limit >= total}
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
};
