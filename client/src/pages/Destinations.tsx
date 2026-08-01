import { useState, useMemo } from "react";
import { Search, MapPin, Users, Briefcase, BookOpen, Home, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DESTINATIONS, VISA_TYPES } from "@shared/visaData";
import { enhancedDestinationData, DestinationId, TestimonialData } from "@/data/enhancedDestinationData";
import { useLocation } from "wouter";
import Footer from "@/components/Footer";
import TestimonialsSection from "@/components/TestimonialsSection";
import { FilterPanel, SortDropdown, ActiveFilters } from "@/components/FilterPanel";

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
  const [selectedVisaTypes, setSelectedVisaTypes] = useState<Set<string>>(new Set());
  const [selectedClimates, setSelectedClimates] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState("name");
  const [showFilters, setShowFilters] = useState(false);
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  const destinationArray = Object.values(DESTINATIONS);
  const continents = Array.from(new Set(destinationArray.map((d) => d.continent)));
  const climates = Array.from(new Set(destinationArray.map((d) => d.climate)));
  const allVisaTypes = Array.from(
    new Set(destinationArray.flatMap((d) => d.visaTypes))
  );

  const filteredDestinations = useMemo(() => {
    let filtered = destinationArray.filter((dest) => {
      const matchesSearch =
        dest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dest.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesContinent = !selectedContinent || dest.continent === selectedContinent;
      const matchesVisa =
        selectedVisaTypes.size === 0 ||
        dest.visaTypes.some((visa) => selectedVisaTypes.has(visa));
      const matchesClimate =
        selectedClimates.size === 0 || selectedClimates.has(dest.climate);
      return matchesSearch && matchesContinent && matchesVisa && matchesClimate;
    });

    // Appliquer le tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "cost-asc": {
          const costA = extractCostValue(a.costOfLiving);
          const costB = extractCostValue(b.costOfLiving);
          return costA - costB;
        }
        case "cost-desc": {
          const costA = extractCostValue(a.costOfLiving);
          const costB = extractCostValue(b.costOfLiving);
          return costB - costA;
        }
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchQuery, selectedContinent, selectedVisaTypes, selectedClimates, sortBy]);

  const extractCostValue = (costString: string): number => {
    const match = costString.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  const activeFilters = [
    ...(selectedContinent ? [{ label: selectedContinent, id: `continent-${selectedContinent}` }] : []),
    ...Array.from(selectedVisaTypes).map((visa) => ({
      label: VISA_TYPES[visa as keyof typeof VISA_TYPES]?.name || visa,
      id: `visa-${visa}`,
    })),
    ...Array.from(selectedClimates).map((climate) => ({
      label: climate,
      id: `climate-${climate}`,
    })),
  ];

  const handleRemoveFilter = (filterId: string) => {
    if (filterId.startsWith("continent-")) {
      setSelectedContinent(null);
    } else if (filterId.startsWith("visa-")) {
      const visa = filterId.replace("visa-", "");
      const newVisas = new Set(selectedVisaTypes);
      newVisas.delete(visa);
      setSelectedVisaTypes(newVisas);
    } else if (filterId.startsWith("climate-")) {
      const climate = filterId.replace("climate-", "");
      const newClimates = new Set(selectedClimates);
      newClimates.delete(climate);
      setSelectedClimates(newClimates);
    }
  };

  const handleClearAllFilters = () => {
    setSearchQuery("");
    setSelectedContinent(null);
    setSelectedVisaTypes(new Set());
    setSelectedClimates(new Set());
    setSortBy("name");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">

      {/* En-tête */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Destinations</h1>
          <p className="text-lg text-blue-100 max-w-2xl">
            Découvrez nos destinations principales et explorez les opportunités de mobilité internationale
            disponibles dans chaque pays.
          </p>
            <Button
              onClick={() => navigate("/open-dossier")}
              className="mt-8 bg-white text-blue-600 hover:bg-blue-100 text-lg px-8 py-3 rounded-full shadow-lg transition-all duration-300 min-h-[44px]"
          >
            Commencez votre parcours vers l'étranger !
          </Button>
        </div>
      </section>

      {/* Barre de recherche et filtres */}
      <section className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Recherche */}
          <div className="relative">
            <Label htmlFor="destination-search" className="sr-only">Rechercher une destination</Label>
            <Search className="absolute left-4 top-3 text-gray-400" size={20} />
            <Input
              id="destination-search"
              type="text"
              placeholder="Rechercher une destination..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 py-3 text-base min-h-[44px]"
            />
          </div>

          {/* Bouton pour afficher/masquer les filtres avancés */}
          <div className="flex items-center justify-between">
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="gap-2 min-h-[44px]"
            >
              <SlidersHorizontal size={18} />
              Filtres avancés
            </Button>
            <SortDropdown sortBy={sortBy} onSortChange={setSortBy} />
          </div>

          {/* Filtres avancés */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FilterPanel
                title="Continents"
                options={continents.map((continent) => ({
                  id: continent,
                  label: continent,
                  count: destinationArray.filter((d) => d.continent === continent).length,
                }))}
                selectedOptions={selectedContinent ? new Set([selectedContinent]) : new Set()}
                onToggle={(continentId) => {
                  setSelectedContinent(
                    selectedContinent === continentId ? null : continentId
                  );
                }}
                isOpen={openFilter === "continents"}
                onToggleOpen={() =>
                  setOpenFilter(openFilter === "continents" ? null : "continents")
                }
              />
              <FilterPanel
                title="Types de visa"
                options={allVisaTypes.map((visa) => ({
                  id: visa,
                  label: VISA_TYPES[visa as keyof typeof VISA_TYPES]?.name || visa,
                  count: destinationArray.filter((d) =>
                    d.visaTypes.includes(visa)
                  ).length,
                }))}
                selectedOptions={selectedVisaTypes}
                onToggle={(visaId) => {
                  const newVisas = new Set(selectedVisaTypes);
                  if (newVisas.has(visaId)) {
                    newVisas.delete(visaId);
                  } else {
                    newVisas.add(visaId);
                  }
                  setSelectedVisaTypes(newVisas);
                }}
                isOpen={openFilter === "visas"}
                onToggleOpen={() =>
                  setOpenFilter(openFilter === "visas" ? null : "visas")
                }
              />
              <FilterPanel
                title="Climat"
                options={climates.map((climate) => ({
                  id: climate,
                  label: climate,
                  count: destinationArray.filter((d) => d.climate === climate)
                    .length,
                }))}
                selectedOptions={selectedClimates}
                onToggle={(climateId) => {
                  const newClimates = new Set(selectedClimates);
                  if (newClimates.has(climateId)) {
                    newClimates.delete(climateId);
                  } else {
                    newClimates.add(climateId);
                  }
                  setSelectedClimates(newClimates);
                }}
                isOpen={openFilter === "climates"}
                onToggleOpen={() =>
                  setOpenFilter(openFilter === "climates" ? null : "climates")
                }
              />
            </div>
          )}

          {/* Filtres actifs */}
          {activeFilters.length > 0 && (
            <ActiveFilters
              filters={activeFilters}
              onRemove={handleRemoveFilter}
              onClearAll={handleClearAllFilters}
            />
          )}

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
                  <span className="text-5xl" role="img" aria-label={`Drapeau de ${dest.name}`}>{dest.flag}</span>
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
                    <MapPin size={16} className="text-blue-600" aria-hidden="true" />
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
                  className="w-full bg-blue-600 hover:bg-blue-700 min-h-[44px]"
                >
                  Débloquez votre avenir maintenant !
                </Button>

                {/* Avantages */}
                {enhancedDestinationData[dest.id as DestinationId] && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Avantages</p>
                    <ul className="list-disc list-inside text-sm text-gray-700">
                      {enhancedDestinationData[dest.id as DestinationId].advantages.map((advantage: string, index: number) => (
                        <li key={index}>{advantage}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Coûts */}
                {enhancedDestinationData[dest.id as DestinationId] && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Coûts Estimés</p>
                    <ul className="list-disc list-inside text-sm text-gray-700">
                      {Object.entries(enhancedDestinationData[dest.id as DestinationId].costs).map(([key, value]) => (
                        <li key={key}>{key.replace(/([A-Z])/g, ' $1').toLowerCase()}: {value}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Témoignages */}
                {enhancedDestinationData[dest.id as DestinationId] && enhancedDestinationData[dest.id as DestinationId].testimonials.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Témoignages</p>
                    {enhancedDestinationData[dest.id as DestinationId].testimonials.map((testimonial: TestimonialData, index: number) => (
                      <div key={index} className="mb-2 p-2 bg-gray-50 rounded">
                        <p className="text-sm italic">\" {testimonial.comment} \"</p>
                        <p className="text-xs text-gray-600 text-right">- {testimonial.name}</p>
                      </div>
                    ))}
                  </div>
                )}
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
              onClick={handleClearAllFilters}
              className="mt-4 min-h-[44px]"
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

      <TestimonialsSection />

      <Footer />
    </div>
  );
}
