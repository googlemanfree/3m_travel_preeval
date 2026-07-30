import { useState } from "react";
import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { VISA_TYPES } from "@shared/visaData";
import { useLocation } from "wouter";
import Footer from "@/components/Footer";

export default function VisaTypes() {
  const [, navigate] = useLocation();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);
  const [selectedCostRange, setSelectedCostRange] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const visaArray = Object.values(VISA_TYPES);

  // Filtrer les visas selon les critères
  const filteredVisas = visaArray.filter((visa) => {
    // Filtre par recherche textuelle
    const matchesSearch = searchQuery === "" || 
      visa.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      visa.description.toLowerCase().includes(searchQuery.toLowerCase());

    // Filtre par durée de traitement
    const matchesDuration = !selectedDuration || visa.processingTime.includes(selectedDuration);

    // Filtre par gamme de coût
    const matchesCost = !selectedCostRange || visa.cost.includes(selectedCostRange);

    return matchesSearch && matchesDuration && matchesCost;
  });

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedDuration(null);
    setSelectedCostRange(null);
  };

  const hasActiveFilters = searchQuery !== "" || selectedDuration !== null || selectedCostRange !== null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">

      {/* En-tête */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Types de Visa</h1>
          <p className="text-lg text-blue-100 max-w-2xl">
            Explorez les 6 catégories principales de visas et trouvez celle qui correspond à votre projet
            de mobilité internationale.
          </p>
        </div>
      </section>

      {/* Section Filtres */}
      <section className="container mx-auto px-4 py-8 bg-white border-b border-gray-200">
        <div className="space-y-4">
          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <Input
              type="text"
              placeholder="Rechercher un type de visa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Filtres */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtre Durée */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Durée de traitement</label>
              <select
                value={selectedDuration || ""}
                onChange={(e) => setSelectedDuration(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Toutes les durées</option>
                <option value="semaines">Quelques semaines</option>
                <option value="mois">Quelques mois</option>
                <option value="rapide">Rapide (5-15 jours)</option>
              </select>
            </div>

            {/* Filtre Coût */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Gamme de coût</label>
              <select
                value={selectedCostRange || ""}
                onChange={(e) => setSelectedCostRange(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les coûts</option>
                <option value="50">Économique (moins de 500 USD)</option>
                <option value="500">Moyen (500-1500 USD)</option>
                <option value="1500">Premium (plus de 1500 USD)</option>
              </select>
            </div>

            {/* Bouton Réinitialiser */}
            <div className="flex items-end">
              {hasActiveFilters && (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Réinitialiser les filtres
                </Button>
              )}
            </div>
          </div>

          {/* Résultat du filtrage */}
          <div className="text-sm text-gray-600">
            {filteredVisas.length === visaArray.length ? (
              <p>Affichage de tous les {visaArray.length} types de visa</p>
            ) : (
              <p>{filteredVisas.length} type(s) de visa correspond(ent) à vos critères</p>
            )}
          </div>
        </div>
      </section>

      {/* Grille de cartes */}
      <section className="container mx-auto px-4 py-16">
        {filteredVisas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-gray-600 mb-4">Aucun visa ne correspond à vos critères de recherche.</p>
            <Button
              onClick={clearFilters}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Réinitialiser les filtres
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVisas.map((visa) => (
            <Card
              key={visa.id}
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border-0"
              onClick={() => toggleExpand(visa.id)}
            >
              {/* En-tête de la carte */}
              <div
                className="p-6 text-white"
                style={{ backgroundColor: visa.color }}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-4xl">{visa.icon}</span>
                  <ChevronDown
                    size={24}
                    className={`transition-transform ${
                      expandedId === visa.id ? "rotate-180" : ""
                    }`}
                  />
                </div>
                <h3 className="text-xl font-bold mb-2">{visa.name}</h3>
                <p className="text-sm opacity-90">{visa.description}</p>
              </div>

              {/* Contenu détaillé (expandable) */}
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  expandedId === visa.id ? "max-h-96" : "max-h-0"
                }`}
              >
                <div className="p-6 space-y-4 bg-white">
                  {/* Délai et coût */}
                  <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase">Délai</p>
                      <p className="text-sm font-semibold text-gray-900">{visa.processingTime}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase">Coût</p>
                      <p className="text-sm font-semibold text-gray-900">{visa.cost}</p>
                    </div>
                  </div>

                  {/* Conditions d'éligibilité */}
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Conditions</p>
                    <ul className="text-sm space-y-1">
                      {visa.eligibility.slice(0, 3).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-green-500 font-bold">✓</span>
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Avantages */}
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Avantages</p>
                    <ul className="text-sm space-y-1">
                      {visa.advantages.slice(0, 2).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-blue-500 font-bold">★</span>
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Bouton CTA */}
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/open-dossier");
                    }}
                    className="w-full mt-4"
                    style={{ backgroundColor: visa.color }}
                  >
                    Commencer l'évaluation
                  </Button>
                </div>
              </div>
            </Card>
            ))}
          </div>
        )}
      </section>

      {/* Section d'information supplémentaire */}
      <section className="bg-white py-16 border-t">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold mb-6 text-gray-900">Comment choisir votre visa ?</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                Le choix du type de visa dépend de plusieurs facteurs : votre objectif principal (études,
                travail, visite), votre situation personnelle, vos qualifications professionnelles et votre
                destination souhaitée.
              </p>
              <p>
                Chaque type de visa a ses propres critères d'admissibilité, délais de traitement et coûts.
                Notre équipe d'experts peut vous aider à déterminer le visa le plus approprié pour votre
                situation.
              </p>
              <p>
                Cliquez sur chaque type de visa pour voir plus de détails, ou consultez notre page{" "}
                <button
                  onClick={() => navigate("/guide")}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Guide complet
                </button>{" "}
                pour les procédures étape par étape.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
