import { useState, useMemo } from "react";
import { Search, MapPin, Users, Briefcase, BookOpen, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DESTINATIONS, VISA_TYPES } from "@shared/visaData";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const CONTINENT_COLORS: Record<string, string> = {
  "Amérique du Nord": "bg-blue-100 text-blue-800",
  Europe: "bg-green-100 text-green-800",
  "Amérique du Sud": "bg-yellow-100 text-yellow-800",
  Asie: "bg-purple-100 text-purple-800",
  Afrique: "bg-orange-100 text-orange-800",
  Océanie: "bg-cyan-100 text-cyan-800",
};

const VISA_ICONS: Record<string, string> = {
  study: "📚",
  work: "💼",
  tourism: "✈️",
  permanent_residence: "🏠",
  family_reunification: "👨‍👩‍👧‍👦",
  business: "🤝",
};

export default function Destinations() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContinent, setSelectedContinent] = useState<string | null>(null);

  const destinationArray = Object.values(DESTINATIONS);
  const continents = Array.from(new Set(destinationArray.map((d) => d.continent)));

  const filteredDestinations = useMemo(() => {
    return destinationArray.filter((dest) => {
      const matchesSearch =
        dest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dest.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesContinent = !selectedContinent || dest.continent === selectedContinent;
      return matchesSearch && matchesContinent;
    });
  }, [searchQuery, selectedContinent]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Navbar />

      {/* En-tête */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Destinations</h1>
          <p className="text-lg text-blue-100 max-w-2xl">
            Découvrez nos destinations principales et explorez les opportunités de mobilité internationale
            disponibles dans chaque pays.
          </p>
        </div>
      </section>

      {/* Barre de recherche et filtres */}
      <section className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-4 top-3 text-gray-400" size={20} />
            <Input
              type="text"
              placeholder="Rechercher une destination..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 py-3 text-base"
            />
          </div>

          {/* Filtres par continent */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedContinent === null ? "default" : "outline"}
              onClick={() => setSelectedContinent(null)}
              className="rounded-full"
            >
              Tous les continents
            </Button>
            {continents.map((continent) => (
              <Button
                key={continent}
                variant={selectedContinent === continent ? "default" : "outline"}
                onClick={() => setSelectedContinent(continent)}
                className="rounded-full"
              >
                {continent}
              </Button>
            ))}
          </div>

          {/* Nombre de résultats */}
          <p className="text-sm text-gray-600">
            {filteredDestinations.length} destination{filteredDestinations.length !== 1 ? "s" : ""} trouvée
            {filteredDestinations.length !== 1 ? "s" : ""}
          </p>
        </div>
      </section>

      {/* Grille de destinations */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDestinations.map((dest) => (
            <Card
              key={dest.id}
              className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0 flex flex-col"
            >
              {/* En-tête avec drapeau et continent */}
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-5xl">{dest.flag}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${CONTINENT_COLORS[dest.continent] || "bg-gray-100 text-gray-800"}`}>
                    {dest.continent}
                  </span>
                </div>
                <h3 className="text-2xl font-bold">{dest.name}</h3>
              </div>

              {/* Contenu */}
              <div className="p-6 flex-1 space-y-4">
                {/* Description */}
                <p className="text-sm text-gray-700 line-clamp-3">{dest.description}</p>

                {/* Infos clés */}
                <div className="space-y-2 py-4 border-y">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin size={16} className="text-blue-600" />
                    <span className="text-gray-700">{dest.language}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-700">💱 {dest.currency}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-700">🌡️ {dest.climate}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-700">💰 {dest.costOfLiving}</span>
                  </div>
                </div>

                {/* Types de visa disponibles */}
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Visas disponibles</p>
                  <div className="flex flex-wrap gap-2">
                    {dest.visaTypes.map((visaId) => (
                      <span
                        key={visaId}
                        className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium"
                      >
                        {VISA_ICONS[visaId as keyof typeof VISA_ICONS]}
                        {VISA_TYPES[visaId as keyof typeof VISA_TYPES]?.name.split(" ")[0]}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Meilleur pour */}
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Idéal pour</p>
                  <p className="text-sm font-medium text-blue-900">{dest.bestFor}</p>
                </div>
              </div>

              {/* Bouton CTA */}
              <div className="p-6 pt-0">
                <Button
                  onClick={() => navigate("/open-dossier")}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Commencer ma demande
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Message si aucun résultat */}
        {filteredDestinations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">Aucune destination ne correspond à votre recherche.</p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setSelectedContinent(null);
              }}
              className="mt-4"
            >
              Réinitialiser les filtres
            </Button>
          </div>
        )}
      </section>

      {/* Section d'information */}
      <section className="bg-white py-16 border-t">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold mb-6 text-gray-900">Pourquoi ces destinations ?</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                Nous avons sélectionné les destinations les plus attractives pour les candidats à la
                mobilité internationale. Chaque pays offre des opportunités uniques selon votre profil et
                vos objectifs.
              </p>
              <p>
                Explorez les détails de chaque destination, consultez les types de visa disponibles, et
                commencez votre parcours vers la mobilité internationale. Notre équipe d'experts est prête
                à vous accompagner à chaque étape.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
