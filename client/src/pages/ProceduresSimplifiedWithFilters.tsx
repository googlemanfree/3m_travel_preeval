import { useState, useMemo } from "react";
import { Search, ChevronDown, ChevronUp, Star, MessageCircle, FileText, Globe, CheckCircle, Badge as BadgeIcon, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import Footer from "@/components/Footer";
import { EvaluationFormModal } from "@/components/EvaluationFormModal";

// Données simplifiées
const REGIONS = [
  {
    id: "canada",
    name: "Canada",
    subtitle: "Études, travail et immigration",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop",
    destinations: [
      {
        id: "toronto",
        name: "Toronto",
        procedures: [
          { id: 1, title: "Visa d'études", type: "student", destination: "Canada", popularity: 95 },
          { id: 2, title: "Permis de travail", type: "work", destination: "Canada", popularity: 80 },
        ]
      },
      {
        id: "vancouver",
        name: "Vancouver",
        procedures: [
          { id: 3, title: "Immigration permanente", type: "permanent", destination: "Canada", popularity: 75 },
        ]
      }
    ]
  },
  {
    id: "europe",
    name: "Europe Schengen",
    subtitle: "Études, tourisme et travail",
    image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=400&fit=crop",
    destinations: [
      {
        id: "france",
        name: "France",
        procedures: [
          { id: 4, title: "Visa d'études", type: "student", destination: "France", popularity: 90 },
          { id: 5, title: "Visa de long séjour", type: "long_stay", destination: "France", popularity: 70 },
        ]
      },
      {
        id: "germany",
        name: "Allemagne",
        procedures: [
          { id: 6, title: "Visa d'études", type: "student", destination: "Allemagne", popularity: 85 },
        ]
      }
    ]
  },
  {
    id: "uk",
    name: "Royaume-Uni",
    subtitle: "Études et travail",
    image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=400&fit=crop",
    destinations: [
      {
        id: "london",
        name: "Londres",
        procedures: [
          { id: 7, title: "Visa d'études", type: "student", destination: "UK", popularity: 92 },
          { id: 8, title: "Visa de travail", type: "work", destination: "UK", popularity: 88 },
        ]
      }
    ]
  }
];

export default function ProceduresSimplifiedWithFilters() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [expandedDestination, setExpandedDestination] = useState<string | null>(null);
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [selectedProcedure, setSelectedProcedure] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Filtrage et tri
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"name" | "popularity" | "type">("name");
  
  // Types de visa disponibles
  const allVisaTypes = useMemo(() => {
    const types = new Set<string>();
    REGIONS.forEach(region => {
      region.destinations.forEach(dest => {
        dest.procedures.forEach(proc => {
          types.add(proc.type);
        });
      });
    });
    return Array.from(types).sort();
  }, []);

  const selectedRegionData = useMemo(
    () => REGIONS.find(r => r.id === activeRegion),
    [activeRegion]
  );

  const filteredRegions = useMemo(() => {
    let results = REGIONS;
    
    // Filtrer par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(region =>
        region.name.toLowerCase().includes(query) ||
        region.destinations.some(dest =>
          dest.name.toLowerCase().includes(query) ||
          dest.procedures.some(proc => proc.title.toLowerCase().includes(query))
        )
      );
    }
    
    // Filtrer par type de visa
    if (selectedTypes.length > 0) {
      results = results.map(region => ({
        ...region,
        destinations: region.destinations.map(dest => ({
          ...dest,
          procedures: dest.procedures.filter(proc => selectedTypes.includes(proc.type))
        })).filter(dest => dest.procedures.length > 0)
      })).filter(region => region.destinations.length > 0);
    }
    
    // Trier les procédures
    results = results.map(region => ({
      ...region,
      destinations: region.destinations.map(dest => ({
        ...dest,
        procedures: [...dest.procedures].sort((a, b) => {
          if (sortBy === "name") return a.title.localeCompare(b.title);
          if (sortBy === "type") return a.type.localeCompare(b.type);
          if (sortBy === "popularity") return (b.popularity || 0) - (a.popularity || 0);
          return 0;
        })
      }))
    }));
    
    return results;
  }, [searchQuery, selectedTypes, sortBy]);

  const handleSelectProcedure = (procedure: any) => {
    setSelectedProcedure(procedure);
    setShowDetailModal(true);
  };

  const toggleTypeFilter = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const resetFilters = () => {
    setSelectedTypes([]);
    setSortBy("name");
    setSearchQuery("");
  };

  const hasActiveFilters = selectedTypes.length > 0 || searchQuery.length > 0 || sortBy !== "name";

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white py-14 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <Badge className="bg-white/20 text-white border-white/30 mb-4 text-sm px-4 py-1">
            🌍 {REGIONS.length * 5}+ procédures officielles · {REGIONS.length} grandes régions · Mis à jour 2026
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
            Nous vous accompagnons<br />
            <span className="text-sky-300">partout dans le monde</span>
          </h1>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto mb-8">
            Canada, Europe Schengen, Royaume-Uni, États-Unis, Golfe & Moyen-Orient, Océanie, Caucase…
            Choisissez votre destination et découvrez toutes les procédures disponibles.
          </p>

          {/* ── Barre de recherche ── */}
          <div className="relative w-full max-w-2xl mx-auto mb-6">
            <div className={`flex items-center bg-white rounded-2xl shadow-xl transition-all duration-200 ${searchFocused ? "ring-4 ring-sky-300/50" : ""}`}>
              <Search className="w-5 h-5 text-gray-400 ml-4 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Rechercher un pays, un visa, une procédure..."
                className="flex-1 px-4 py-4 text-gray-800 bg-transparent outline-none text-base placeholder-gray-400"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="mr-3 text-gray-400 hover:text-gray-600">
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={() => setShowEvalModal(true)} className="bg-white text-blue-800 hover:bg-blue-50 font-bold px-6">
              <Star className="w-4 h-4 mr-2" /> Évaluation gratuite
            </Button>
            <a href="https://wa.me/237698104832?text=Bonjour%203M%20Travel%2C%20je%20souhaite%20des%20informations%20sur%20vos%20destinations" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="border-white text-white hover:bg-white/10 px-6">
                <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* ── Conformité ── */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
        <p className="max-w-5xl mx-auto text-xs text-amber-800 text-center">
          ⚖️ <strong>3M Travel & Services SARL</strong> — RC/YAO/2019/A/2567 | NIU : M112417203369H — Rôle de conseil et d'accompagnement. Les décisions d'octroi de visa appartiennent exclusivement aux autorités consulaires.
        </p>
      </div>

      {/* ── Contenu principal ── */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Vue grille - Affichée quand aucune région n'est sélectionnée */}
        {!activeRegion && (
          <>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-gray-900 mb-2">Choisissez votre région de destination</h2>
              <p className="text-gray-500 text-sm">Cliquez sur une région pour explorer toutes les procédures disponibles</p>
            </div>

            {/* ── Panneau de filtrage ── */}
            <div className="mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  variant={showFilters ? "default" : "outline"}
                  className="gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Filtres avancés
                  {hasActiveFilters && <Badge className="ml-2 bg-blue-600">Actifs</Badge>}
                </Button>
                {hasActiveFilters && (
                  <Button onClick={resetFilters} variant="outline" className="gap-2">
                    <X className="w-4 h-4" />
                    Réinitialiser
                  </Button>
                )}
              </div>

              {/* Tri */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Trier par :</label>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="name">Nom (A-Z)</option>
                  <option value="popularity">Popularité</option>
                  <option value="type">Type de visa</option>
                </select>
              </div>
            </div>

            {/* ── Panneau de filtres ── */}
            {showFilters && (
              <Card className="mb-8 p-6 bg-white border-blue-200">
                <h3 className="font-black text-gray-900 mb-4">Filtrer par type de visa</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {allVisaTypes.map(type => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={selectedTypes.includes(type)}
                        onChange={() => toggleTypeFilter(type)}
                      />
                      <span className="text-sm text-gray-700 capitalize">{type}</span>
                    </label>
                  ))}
                </div>
              </Card>
            )}

            {/* ── Résultats ── */}
            {filteredRegions.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-gray-600 mb-4">Aucune procédure ne correspond à vos critères.</p>
                <Button onClick={resetFilters} variant="outline">
                  Réinitialiser les filtres
                </Button>
              </Card>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-6">
                  {filteredRegions.reduce((sum, r) => sum + r.destinations.reduce((s, d) => s + d.procedures.length, 0), 0)} procédures trouvées
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredRegions.map(region => (
                    <Card
                      key={region.id}
                      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                      onClick={() => setActiveRegion(region.id)}
                    >
                      <div className="relative h-40 overflow-hidden">
                        <img
                          src={region.image}
                          alt={region.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-black text-gray-900">{region.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{region.subtitle}</p>
                        <div className="mt-3 text-xs text-gray-500">
                          {region.destinations.length} destinations · {region.destinations.reduce((sum, d) => sum + d.procedures.length, 0)} procédures
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {/* Stats rapides */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Procédures", value: `${REGIONS.reduce((sum, r) => sum + r.destinations.reduce((s, d) => s + d.procedures.length, 0), 0)}+`, icon: FileText, color: "text-blue-600" },
                { label: "Pays couverts", value: "30+", icon: Globe, color: "text-green-600" },
                { label: "Dossiers traités", value: "1 247+", icon: CheckCircle, color: "text-purple-600" },
                { label: "Taux de succès", value: "89%", icon: Star, color: "text-amber-600" },
              ].map(stat => (
                <Card key={stat.label} className="text-center p-4">
                  <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                  <div className="text-2xl font-black text-gray-900">{stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Vue détail région - Affichée quand une région est sélectionnée */}
        {activeRegion && selectedRegionData && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setActiveRegion(null)}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Toutes les régions
              </button>
              <span className="text-gray-300">|</span>
              <h2 className="text-xl font-black text-gray-900">{selectedRegionData.name}</h2>
            </div>

            {/* Hero région */}
            <div className="relative rounded-2xl overflow-hidden mb-8 h-48">
              <img src={selectedRegionData.image} alt={selectedRegionData.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex items-center px-8">
                <div>
                  <h3 className="text-white text-2xl font-black">{selectedRegionData.name}</h3>
                  <p className="text-white/80 text-sm mt-1">{selectedRegionData.subtitle}</p>
                </div>
              </div>
            </div>

            {/* Destinations et procédures */}
            <div className="space-y-4">
              {selectedRegionData.destinations.map(destination => (
                <Card key={destination.id} className="overflow-hidden">
                  <button
                    onClick={() => setExpandedDestination(expandedDestination === destination.id ? null : destination.id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-left">
                      <h4 className="font-black text-gray-900">{destination.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{destination.procedures.length} procédures disponibles</p>
                    </div>
                    {expandedDestination === destination.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {expandedDestination === destination.id && (
                    <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-2">
                      {destination.procedures.map(procedure => (
                        <button
                          key={procedure.id}
                          onClick={() => handleSelectProcedure(procedure)}
                          className="w-full text-left p-3 bg-white rounded-lg hover:bg-blue-50 transition-colors border border-gray-200 hover:border-blue-300"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-gray-900">{procedure.title}</div>
                              <div className="text-xs text-gray-500 mt-1">{procedure.destination}</div>
                            </div>
                            <Badge variant="outline" className="text-xs">{procedure.type}</Badge>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>

            {/* CTA bas de page */}
            <div className="mt-10 bg-blue-700 rounded-2xl p-6 text-white text-center">
              <h3 className="text-xl font-black mb-2">Vous ne savez pas quelle procédure choisir ?</h3>
              <p className="text-blue-100 text-sm mb-4">Nos conseillers analysent votre profil gratuitement et vous orientent vers la meilleure voie.</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button onClick={() => setShowEvalModal(true)} className="bg-white text-blue-800 hover:bg-blue-50 font-bold">
                  <Star className="w-4 h-4 mr-2" /> Évaluation gratuite
                </Button>
                <a href="https://wa.me/237698104832" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="border-white text-white hover:bg-white/10">
                    <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp direct
                  </Button>
                </a>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Modal Détail Procédure ── */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedProcedure?.title}</DialogTitle>
          </DialogHeader>
          {selectedProcedure && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">Destination</label>
                <p className="text-gray-900">{selectedProcedure.destination}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Type de visa</label>
                <Badge>{selectedProcedure.type}</Badge>
              </div>
              <Button onClick={() => setShowEvalModal(true)} className="w-full bg-blue-600 hover:bg-blue-700">
                Commencer une évaluation
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Modal Évaluation ── */}
      <Dialog open={showEvalModal} onOpenChange={setShowEvalModal}>
        <DialogContent className="max-w-md">
          <EvaluationFormModal isOpen={showEvalModal} onClose={() => setShowEvalModal(false)} />
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
