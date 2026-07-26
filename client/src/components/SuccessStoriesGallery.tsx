import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  MapPin,
  Calendar,
  Users,
  Heart,
  Share2,
  ChevronRight,
  Filter,
  Search,
  Star,
  CheckCircle2,
  Award,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SuccessStory {
  id: string;
  name: string;
  country: string;
  visaType: string;
  destination: string;
  successDate: string;
  story: string;
  image?: string;
  rating: number;
  category: "education" | "work" | "family" | "tourism";
  likes: number;
  featured: boolean;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1 },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: (i = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, delay: i * 0.1 },
  }),
};

// ─── Composant : Carte de Réussite ───
const SuccessStoryCard = ({
  story,
  onLike,
  index,
}: {
  story: SuccessStory;
  onLike: (id: string) => void;
  index: number;
}) => {
  const [liked, setLiked] = useState(false);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "education":
        return "from-blue-500 to-blue-600";
      case "work":
        return "from-green-500 to-green-600";
      case "family":
        return "from-pink-500 to-pink-600";
      case "tourism":
        return "from-orange-500 to-orange-600";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      education: "Études",
      work: "Travail",
      family: "Regroupement Familial",
      tourism: "Tourisme",
    };
    return labels[category as keyof typeof labels] || category;
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={scaleIn}
      custom={index}
      whileHover={{ y: -5 }}
      className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow border border-gray-200"
    >
      {/* Image/Header */}
      <div className={`h-40 bg-gradient-to-br ${getCategoryColor(story.category)} relative overflow-hidden`}>
        {story.featured && (
          <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <Star className="w-3 h-3 fill-current" />
            Vedette
          </div>
        )}
        <div className="absolute inset-0 opacity-20 bg-pattern" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <Globe className="w-12 h-12 mx-auto mb-2 opacity-80" />
            <p className="text-sm font-semibold">{story.destination}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Category Badge */}
        <div className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold mb-3">
          {getCategoryLabel(story.category)}
        </div>

        {/* Name & Country */}
        <h3 className="font-bold text-gray-900 text-lg mb-1">{story.name}</h3>
        <p className="text-sm text-gray-600 flex items-center gap-1 mb-3">
          <MapPin className="w-4 h-4" />
          {story.country}
        </p>

        {/* Visa Info */}
        <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-2">
          <p className="text-sm">
            <span className="font-semibold text-gray-900">Type de Visa:</span>
            <span className="text-gray-600 ml-2">{story.visaType}</span>
          </p>
          <p className="text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-600" />
            <span className="text-gray-600">Accordé le {story.successDate}</span>
          </p>
        </div>

        {/* Story */}
        <p className="text-sm text-gray-700 line-clamp-3 mb-4">
          "{story.story}"
        </p>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < story.rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          ))}
          <span className="text-xs text-gray-600 ml-2">({story.rating}/5)</span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <button
            onClick={() => {
              setLiked(!liked);
              onLike(story.id);
            }}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
              liked
                ? "bg-red-100 text-red-600"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
            <span className="text-sm font-semibold">{story.likes}</span>
          </button>
          <Button size="sm" variant="outline" className="gap-1">
            <Share2 className="w-4 h-4" />
            Partager
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Composant : Statistiques ───
const StatsCard = ({
  icon,
  label,
  value,
  index,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  index: number;
}) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      custom={index}
      className="bg-white rounded-lg border border-gray-200 p-6 text-center shadow-sm"
    >
      <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 mx-auto mb-3">
        {icon}
      </div>
      <p className="text-gray-600 text-sm mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </motion.div>
  );
};

// ─── Composant Principal : SuccessStoriesGallery ───
export default function SuccessStoriesGallery() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | SuccessStory["category"]>("all");

  const stories: SuccessStory[] = [
    {
      id: "1",
      name: "Alain Fouda",
      country: "Canada",
      visaType: "Résidence Permanente",
      destination: "Toronto",
      successDate: "15 juillet 2026",
      story:
        "Grâce à 3M Travel, j'ai pu obtenir ma résidence permanente au Canada en seulement 4 mois. L'équipe était très professionnelle et m'a guidé à chaque étape du processus.",
      rating: 5,
      category: "work",
      likes: 245,
      featured: true,
    },
    {
      id: "2",
      name: "Marie Dupont",
      country: "France",
      visaType: "Visa Étudiant",
      destination: "Paris",
      successDate: "10 juillet 2026",
      story:
        "J'ai obtenu mon visa pour étudier à la Sorbonne. 3M Travel m'a aidée à préparer mon dossier et tout s'est déroulé sans problème. Merci!",
      rating: 5,
      category: "education",
      likes: 189,
      featured: true,
    },
    {
      id: "3",
      name: "Jean Martin",
      country: "Allemagne",
      visaType: "Visa Travail",
      destination: "Berlin",
      successDate: "05 juillet 2026",
      story:
        "Avec l'aide de 3M Travel, j'ai décroché un visa de travail pour une entreprise technologique à Berlin. Le processus était rapide et efficace.",
      rating: 5,
      category: "work",
      likes: 156,
      featured: false,
    },
    {
      id: "4",
      name: "Sophie Bernard",
      country: "Royaume-Uni",
      visaType: "Visa Étudiant",
      destination: "Londres",
      successDate: "01 juillet 2026",
      story:
        "J'ai réussi à obtenir mon visa pour étudier à l'Université de Londres. L'équipe de 3M Travel a été très supportive tout au long du processus.",
      rating: 4,
      category: "education",
      likes: 134,
      featured: false,
    },
    {
      id: "5",
      name: "Pierre Leclerc",
      country: "Canada",
      visaType: "Regroupement Familial",
      destination: "Vancouver",
      successDate: "28 juin 2026",
      story:
        "Après 2 ans d'attente, j'ai finalement pu faire venir ma famille au Canada grâce à 3M Travel. Merci pour votre patience et votre dévouement!",
      rating: 5,
      category: "family",
      likes: 267,
      featured: false,
    },
    {
      id: "6",
      name: "Isabelle Moreau",
      country: "Suisse",
      visaType: "Visa Tourisme",
      destination: "Zurich",
      successDate: "25 juin 2026",
      story:
        "Mon visa touristique pour la Suisse a été approuvé en moins de 2 semaines. 3M Travel a rendu le processus très simple et transparent.",
      rating: 4,
      category: "tourism",
      likes: 98,
      featured: false,
    },
  ];

  const filteredStories = stories.filter((story) => {
    const matchesSearch =
      story.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.destination.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || story.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const stats = [
    {
      icon: <CheckCircle2 className="w-6 h-6" />,
      label: "Visas Accordés",
      value: "1500+",
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      label: "Taux de Succès",
      value: "98%",
    },
    {
      icon: <Award className="w-6 h-6" />,
      label: "Pays Desservis",
      value: "30+",
    },
    {
      icon: <Users className="w-6 h-6" />,
      label: "Clients Satisfaits",
      value: "2000+",
    },
  ];

  const handleLike = (id: string) => {
    console.log(`Liked story ${id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Award className="w-8 h-8 text-blue-600" />
              Galerie de Réussites
            </h1>
            <p className="text-gray-600 mt-1">
              Découvrez les histoires de succès de nos clients
            </p>
          </motion.div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {stats.map((stat, index) => (
            <StatsCard key={index} {...stat} index={index} />
          ))}
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, pays ou destination..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(["all", "education", "work", "family", "tourism"] as const).map(
              (category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="capitalize"
                >
                  {category === "all"
                    ? "Tous"
                    : category === "education"
                    ? "Études"
                    : category === "work"
                    ? "Travail"
                    : category === "family"
                    ? "Famille"
                    : "Tourisme"}
                </Button>
              )
            )}
          </div>
        </div>

        {/* Stories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredStories.map((story, index) => (
            <SuccessStoryCard
              key={story.id}
              story={story}
              onLike={handleLike}
              index={index}
            />
          ))}
        </div>

        {filteredStories.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Aucune histoire trouvée</p>
          </motion.div>
        )}

        {/* CTA */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl p-8 text-center"
        >
          <h2 className="text-2xl font-bold mb-2">Prêt à Écrire Votre Histoire de Succès?</h2>
          <p className="text-blue-100 mb-6">
            Rejoignez des milliers de clients satisfaits qui ont réalisé leurs rêves
          </p>
          <Button className="gap-2 bg-white text-blue-600 hover:bg-gray-100">
            Commencer Maintenant
            <ChevronRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
