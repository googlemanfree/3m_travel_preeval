import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface Review {
  id?: string;
  displayName?: string;
  destinationCountry?: string;
  serviceType?: string;
  rating?: number;
  reviewText?: string;
  createdAt?: string | Date;
}

export default function ApprovedReviewsSection() {
  const { data: reviews, isLoading } = trpc.customerReview.listApproved.useQuery();
  const { data: stats } = trpc.customerReview.getStats.useQuery();
  const [displayedReviews, setDisplayedReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (reviews) {
      // Afficher les 3 meilleurs avis (5 étoiles en priorité)
      const sorted = [...reviews]
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 3);
      setDisplayedReviews(sorted);
    }
  }, [reviews]);

  if (isLoading) {
    return (
      <div className="py-16 px-4 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-slate-500">Chargement des avis...</p>
        </div>
      </div>
    );
  }

  if (!displayedReviews || displayedReviews.length === 0) {
    return null;
  }

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            ⭐ Ce que nos clients disent
          </h2>
          <p className="text-lg text-slate-600 mb-6">
            Découvrez les expériences réelles de nos clients satisfaits
          </p>

          {/* Stats */}
          {stats && (
            <div className="flex justify-center gap-8 mb-8">
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-500">{stats.averageRating}</p>
                <div className="flex justify-center gap-1 mt-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.round(stats.averageRating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-slate-600 mt-2">Note moyenne</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{stats.totalReviews}</p>
                <p className="text-sm text-slate-600 mt-2">Avis vérifiés</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Reviews Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {displayedReviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              {/* Quote Icon */}
              <Quote className="w-8 h-8 text-orange-500 mb-4 opacity-50" />

              {/* Rating */}
              <div className="flex gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < review.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>

              {/* Review Text */}
              <p className="text-slate-700 text-sm mb-4 line-clamp-4">
                "{review.reviewText}"
              </p>

              {/* Reviewer Info */}
              <div className="border-t pt-4">
                <p className="font-semibold text-slate-900">{review.displayName}</p>
                <p className="text-xs text-slate-500">
                  {review.destinationCountry && (
                    <>
                      {review.destinationCountry}
                      {review.serviceType && " • "}
                    </>
                  )}
                  {review.serviceType && review.serviceType}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {new Date(review.createdAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-slate-600 mb-4">Vous aussi, partagez votre expérience !</p>
          <a
            href="/submit-review"
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
          >
            Laisser un Avis
          </a>
        </motion.div>
      </div>
    </section>
  );
}
