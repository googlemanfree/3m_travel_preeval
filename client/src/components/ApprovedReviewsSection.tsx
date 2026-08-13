import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, Quote, Filter } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface Review {
  id?: number;
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
  const [destinationFilter, setDestinationFilter] = useState<string>("all");
  const [displayedReviews, setDisplayedReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (reviews) {
      let filtered = [...reviews];
      if (destinationFilter === "canada") {
        filtered = filtered.filter((r) => r.destinationCountry?.toLowerCase().includes("canada"));
      } else if (destinationFilter === "schengen") {
        filtered = filtered.filter((r) => 
          r.destinationCountry?.toLowerCase().includes("france") || 
          r.destinationCountry?.toLowerCase().includes("allemagne") ||
          r.destinationCountry?.toLowerCase().includes("belgique") ||
          r.destinationCountry?.toLowerCase().includes("schengen")
        );
      }
      const sorted = filtered
        .sort((a, b) => (b.rating || 5) - (a.rating || 5))
        .slice(0, 6);
      setDisplayedReviews(sorted);
    }
  }, [reviews, destinationFilter]);

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
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-8">
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

          {/* Filtre de destination Canada / Schengen */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            <button
              onClick={() => setDestinationFilter("all")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                destinationFilter === "all"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              Tous les pays
            </button>
            <button
              onClick={() => setDestinationFilter("canada")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                destinationFilter === "canada"
                  ? "bg-red-600 text-white shadow-md shadow-red-500/25"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span>🇨🇦</span>
              <span>Canada (Spécialité)</span>
            </button>
            <button
              onClick={() => setDestinationFilter("schengen")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                destinationFilter === "schengen"
                  ? "bg-blue-800 text-white shadow-md shadow-blue-900/25"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span>🇪🇺</span>
              <span>Europe / Schengen</span>
            </button>
          </div>
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
