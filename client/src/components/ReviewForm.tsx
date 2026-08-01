import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Star, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface ReviewFormProps {
  countryCode: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({ countryCode, onClose, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [visaObtained, setVisaObtained] = useState(false);

  const createReviewMutation = trpc.evisaReviews.createReview.useMutation({
    onSuccess: () => {
      toast.success('Avis créé avec succès! Il sera publié après modération.');
      onClose();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la création de l\'avis');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!rating) {
      toast.error('Veuillez sélectionner une note');
      return;
    }

    if (!title.trim()) {
      toast.error('Veuillez entrer un titre');
      return;
    }

    if (!comment.trim() || comment.length < 10) {
      toast.error('Veuillez entrer un commentaire de au moins 10 caractères');
      return;
    }

    createReviewMutation.mutate({
      countryCode,
      rating,
      title,
      comment,
      travelDate: travelDate || undefined,
      visaObtained,
    });
  };

  const isValid = rating && title.trim() && comment.trim().length >= 10;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* En-tête */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Partager votre expérience</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sélection de la note */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Quelle est votre note?
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      size={32}
                      className={
                        star <= (hoverRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  Vous avez donné une note de {rating} étoile{rating > 1 ? 's' : ''}
                </p>
              )}
            </div>

            {/* Titre */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Titre de votre avis
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Processus simple et rapide"
                maxLength={100}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">{title.length}/100 caractères</p>
            </div>

            {/* Commentaire */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Votre expérience
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Décrivez votre expérience avec ce visa..."
                maxLength={1000}
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">{comment.length}/1000 caractères</p>
            </div>

            {/* Date du voyage */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Date du voyage (optionnel)
              </label>
              <input
                type="date"
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Visa obtenu */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="visaObtained"
                checked={visaObtained}
                onChange={(e) => setVisaObtained(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="visaObtained" className="text-sm font-medium text-gray-900">
                J'ai obtenu mon visa grâce à cette agence
              </label>
            </div>

            {/* Boutons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={!isValid || createReviewMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              >
                {createReviewMutation.isPending ? 'Envoi...' : 'Publier mon avis'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </motion.div>
  );
};
