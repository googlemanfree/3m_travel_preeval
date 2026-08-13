import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Filter, Quote, Star } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";

interface Review {
  id?: number;
  displayName?: string;
  destinationCountry?: string;
  serviceType?: string;
  rating?: number;
  reviewText?: string;
  createdAt?: string | Date;
}

type DestinationFilter = "all" | "canada" | "schengen" | "other";

const SCHENGEN_DESTINATIONS = [
  "allemagne",
  "autriche",
  "belgique",
  "danemark",
  "espagne",
  "estonie",
  "finlande",
  "france",
  "grece",
  "grèce",
  "hongrie",
  "italie",
  "lettonie",
  "liechtenstein",
  "lituanie",
  "luxembourg",
  "malte",
  "norvege",
  "norvège",
  "pays-bas",
  "pays bas",
  "pologne",
  "portugal",
  "republique tcheque",
  "république tchèque",
  "slovaquie",
  "slovenie",
  "slovénie",
  "suede",
  "suède",
  "suisse",
  "islande",
  "schengen",
  "europe",
];

function isCanadaReview(review: Review) {
  return (review.destinationCountry ?? "").toLocaleLowerCase("fr-FR").includes("canada");
}

function isSchengenReview(review: Review) {
  const destination = (review.destinationCountry ?? "").toLocaleLowerCase("fr-FR");
  return SCHENGEN_DESTINATIONS.some((country) => destination.includes(country));
}

function formatReviewDate(value: Review["createdAt"], language: "fr" | "en") {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(language === "en" ? "en-GB" : "fr-FR");
}

export default function ApprovedReviewsSection() {
  const { language } = useLanguage();
  const { data: reviews, isLoading } = trpc.customerReview.listApproved.useQuery();
  const { data: stats } = trpc.customerReview.getStats.useQuery();
  const [destinationFilter, setDestinationFilter] = useState<DestinationFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const approvedReviews = useMemo(() => (reviews ?? []) as Review[], [reviews]);

  const displayedReviews = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase("fr-FR");
    const filtered = approvedReviews.filter((review) => {
      const matchesDestination =
        destinationFilter === "all" ||
        (destinationFilter === "canada" && isCanadaReview(review)) ||
        (destinationFilter === "schengen" && isSchengenReview(review)) ||
        (destinationFilter === "other" && !isCanadaReview(review) && !isSchengenReview(review));

      if (!matchesDestination) return false;
      if (!normalizedQuery) return true;

      const searchableText = [
        review.displayName,
        review.destinationCountry,
        review.serviceType,
        review.reviewText,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("fr-FR");

      return searchableText.includes(normalizedQuery);
    });

    return [...filtered]
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      .slice(0, 6);
  }, [approvedReviews, destinationFilter, searchQuery]);

  const labels = language === "en"
    ? {
        loading: "Loading approved reviews...",
        title: "What our clients say",
        subtitle: "Discover real experiences shared by our approved clients.",
        average: "Average rating",
        verified: "Approved reviews",
        all: "All destinations",
        canada: "Canada",
        schengen: "Schengen Area",
        other: "Other destinations",
        searchPlaceholder: "Search a country, service or keyword...",
        searchLabel: "Search testimonials",
        clearSearch: "Clear search",
        results: "approved reviews shown",
        empty: "No approved review matches your search.",
        share: "You can also share your experience.",
        leave: "Leave a review",
      }
    : {
        loading: "Chargement des avis approuvés...",
        title: "Ce que nos clients disent",
        subtitle: "Découvrez les expériences réelles partagées par nos clients approuvés.",
        average: "Note moyenne",
        verified: "Avis approuvés",
        all: "Toutes les destinations",
        canada: "Canada",
        schengen: "Espace Schengen",
        other: "Autres destinations",
        searchPlaceholder: "Rechercher un pays, un service ou un mot-clé...",
        searchLabel: "Rechercher dans les témoignages",
        clearSearch: "Effacer la recherche",
        results: "avis approuvés affichés",
        empty: "Aucun avis approuvé ne correspond à votre recherche.",
        share: "Vous aussi, partagez votre expérience.",
        leave: "Laisser un avis",
      };

  if (isLoading) {
    return (
      <div className="py-16 px-4 bg-gradient-to-b from-white to-slate-50" aria-busy="true">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-slate-500">{labels.loading}</p>
        </div>
      </div>
    );
  }

  if (approvedReviews.length === 0) return null;

  const filterOptions: Array<{ value: DestinationFilter; label: string; flag?: string }> = [
    { value: "all", label: labels.all },
    { value: "canada", label: labels.canada, flag: "🇨🇦" },
    { value: "schengen", label: labels.schengen, flag: "🇪🇺" },
    { value: "other", label: labels.other, flag: "🌍" },
  ];

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-white to-slate-50" aria-labelledby="approved-reviews-title">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 id="approved-reviews-title" className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            ⭐ {labels.title}
          </h2>
          <p className="text-lg text-slate-600 mb-6">{labels.subtitle}</p>

          {stats && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-8">
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-500">{stats.averageRating}</p>
                <div className="flex justify-center gap-1 mt-2" aria-label={`${stats.averageRating} / 5`}>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      aria-hidden="true"
                      className={`w-4 h-4 ${
                        index < Math.round(stats.averageRating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-slate-600 mt-2">{labels.average}</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{stats.totalReviews}</p>
                <p className="text-sm text-slate-600 mt-2">{labels.verified}</p>
              </div>
            </div>
          )}

          <div className="mx-auto mb-4 max-w-xl">
            <label htmlFor="approved-reviews-search" className="sr-only">{labels.searchLabel}</label>
            <div className="relative">
              <input
                id="approved-reviews-search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={labels.searchPlaceholder}
                className="w-full rounded-full border border-slate-200 bg-white px-5 py-3 pr-24 text-sm text-slate-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  aria-label={labels.clearSearch}
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mt-4" role="group" aria-label={language === "en" ? "Filter reviews by destination" : "Filtrer les avis par destination"}>
            {filterOptions.map((option) => {
              const isActive = destinationFilter === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setDestinationFilter(option.value)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                    isActive
                      ? option.value === "canada"
                        ? "bg-red-600 text-white shadow-md shadow-red-500/25"
                        : option.value === "schengen"
                          ? "bg-blue-800 text-white shadow-md shadow-blue-900/25"
                          : "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {option.value === "all" ? <Filter className="w-3.5 h-3.5" aria-hidden="true" /> : <span aria-hidden="true">{option.flag}</span>}
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-slate-500" aria-live="polite">
            {displayedReviews.length} {labels.results}
          </p>
        </motion.div>

        {displayedReviews.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {displayedReviews.map((review, index) => (
              <motion.div
                key={review.id ?? `${review.displayName}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <Quote className="w-8 h-8 text-orange-500 mb-4 opacity-50" aria-hidden="true" />
                <div className="flex gap-1 mb-3" aria-label={`${review.rating ?? 0} / 5`}>
                  {Array.from({ length: 5 }).map((_, starIndex) => (
                    <Star
                      key={starIndex}
                      aria-hidden="true"
                      className={`w-4 h-4 ${
                        starIndex < (review.rating ?? 0)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-slate-700 text-sm mb-4 line-clamp-4">“{review.reviewText}”</p>
                <div className="border-t pt-4">
                  <p className="font-semibold text-slate-900">{review.displayName}</p>
                  <p className="text-xs text-slate-500">
                    {review.destinationCountry}
                    {review.destinationCountry && review.serviceType ? " • " : ""}
                    {review.serviceType}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{formatReviewDate(review.createdAt, language)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center mb-8">
            <p className="text-slate-600">{labels.empty}</p>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-slate-600 mb-4">{labels.share}</p>
          <a
            href="/submit-review"
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 focus-visible:ring-offset-2"
          >
            {labels.leave}
          </a>
        </motion.div>
      </div>
    </section>
  );
}
