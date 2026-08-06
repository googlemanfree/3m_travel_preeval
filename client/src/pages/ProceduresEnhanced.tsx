import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Download, Filter, MapPin, Clock, DollarSign, FileText, ChevronDown, Star, Eye, EyeOff, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { procedures107Countries } from '@/data/procedures107Countries';

const REGIONS = ['Tous', 'Europe', 'Asie', 'Afrique', 'Amérique du Nord', 'Amérique du Sud', 'Océanie', 'Moyen-Orient'];

export default function ProceduresEnhanced() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('Tous');
  const [visaType, setVisaType] = useState<'travail' | 'etudes' | 'visiteur' | 'tous'>('tous');
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'cost' | 'time'>('name');
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);

  // Filter countries
  const filteredCountries = useMemo(() => {
    let filtered = procedures107Countries.filter(country => {
      const matchesSearch = country.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRegion = selectedRegion === 'Tous' || country.region === selectedRegion;
      const matchesVisaType = visaType === 'tous' || country.visaType === visaType;
      return matchesSearch && matchesRegion && matchesVisaType;
    });

    // Sort
    if (sortBy === 'cost') {
      filtered.sort((a, b) => {
        const costA = parseInt(a.cost.split('-')[0]);
        const costB = parseInt(b.cost.split('-')[0]);
        return costA - costB;
      });
    } else if (sortBy === 'time') {
      filtered.sort((a, b) => {
        const timeA = parseInt(a.processingTime.split('-')[0]);
        const timeB = parseInt(b.processingTime.split('-')[0]);
        return timeA - timeB;
      });
    } else {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  }, [searchQuery, selectedRegion, visaType, sortBy]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'facile':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'moyen':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'difficile':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleComparison = (countryId: string) => {
    setSelectedForComparison(prev =>
      prev.includes(countryId)
        ? prev.filter(id => id !== countryId)
        : [...prev, countryId].slice(-3) // Max 3 countries
    );
  };

  const comparisonCountries = selectedForComparison
    .map(id => procedures107Countries.find(c => c.id === id))
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            📋 Procédures Complètes - 107 Destinations
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Consultez les procédures officielles détaillées avec descriptions complètes, documents requis et comparaisons interactives.
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Rechercher un pays, une région..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 py-3 text-base border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Type de Visa Tabs */}
            <Tabs value={visaType} onValueChange={(v) => setVisaType(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-slate-100">
                <TabsTrigger value="tous">Tous (107)</TabsTrigger>
                <TabsTrigger value="travail">Travail (34)</TabsTrigger>
                <TabsTrigger value="etudes">Études (22)</TabsTrigger>
                <TabsTrigger value="visiteur">Visiteur (27)</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Region Filter */}
            <div className="flex flex-wrap gap-2">
              <Filter className="w-5 h-5 text-slate-500 my-auto" />
              {REGIONS.map(region => (
                <motion.button
                  key={region}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedRegion(region)}
                  className={`px-4 py-2 rounded-full font-medium transition-all ${
                    selectedRegion === region
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {region}
                </motion.button>
              ))}
            </div>

            {/* Sort and Comparison Controls */}
            <div className="flex flex-wrap gap-3 justify-between items-center">
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium hover:border-blue-500 transition-colors"
                >
                  <option value="name">Trier par: Nom</option>
                  <option value="cost">Trier par: Coût</option>
                  <option value="time">Trier par: Délai</option>
                </select>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowComparison(!showComparison)}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  showComparison
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {showComparison ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                Comparer ({selectedForComparison.length}/3)
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Comparison Table */}
        <AnimatePresence>
          {showComparison && comparisonCountries.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              <div className="p-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <ArrowUpDown className="w-6 h-6" /> Tableau Comparatif
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-slate-200 bg-slate-50">
                        <th className="text-left py-3 px-4 font-bold text-slate-900">Pays</th>
                        <th className="text-center py-3 px-4 font-bold text-slate-900">Région</th>
                        <th className="text-center py-3 px-4 font-bold text-slate-900">Type</th>
                        <th className="text-center py-3 px-4 font-bold text-slate-900">Délai</th>
                        <th className="text-center py-3 px-4 font-bold text-slate-900">Coût</th>
                        <th className="text-center py-3 px-4 font-bold text-slate-900">Difficulté</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonCountries.map((country, idx) => (
                        <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            {country.flag} {country.name}
                          </td>
                          <td className="text-center py-3 px-4 text-slate-600">{country.region}</td>
                          <td className="text-center py-3 px-4">
                            <Badge variant="outline" className="capitalize">{country.visaType}</Badge>
                          </td>
                          <td className="text-center py-3 px-4 text-slate-600 font-medium">{country.processingTime}</td>
                          <td className="text-center py-3 px-4 text-slate-600 font-medium">{country.cost}</td>
                          <td className="text-center py-3 px-4">
                            <Badge className={getDifficultyColor(country.difficulty)}>
                              {country.difficulty}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Count */}
        <div className="mb-6 text-slate-600 font-medium">
          {filteredCountries.length} destination{filteredCountries.length !== 1 ? 's' : ''} trouvée{filteredCountries.length !== 1 ? 's' : ''}
          {selectedForComparison.length > 0 && ` • ${selectedForComparison.length} sélectionnée(s) pour comparaison`}
        </div>

        {/* Countries Grid */}
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence>
            {filteredCountries.map((country) => {
              const isExpanded = expandedCountry === country.id;
              const isSelected = selectedForComparison.includes(country.id);

              return (
                <motion.div
                  key={country.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card
                    className={`overflow-hidden cursor-pointer transition-all hover:shadow-xl ${
                      isExpanded ? 'ring-2 ring-blue-500' : ''
                    } ${isSelected ? 'ring-2 ring-green-500' : ''}`}
                  >
                    {/* Card Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1" onClick={() => setExpandedCountry(isExpanded ? null : country.id)}>
                          <span className="text-4xl">{country.flag}</span>
                          <div>
                            <h3 className="text-xl font-bold">{country.name}</h3>
                            <p className="text-blue-100 text-sm flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {country.region}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {showComparison && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleComparison(country.id);
                              }}
                              className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                                isSelected
                                  ? 'bg-green-500 text-white'
                                  : 'bg-white/20 text-white hover:bg-white/30'
                              }`}
                            >
                              ✓
                            </button>
                          )}
                          <ChevronDown
                            className={`w-5 h-5 transition-transform cursor-pointer`}
                            onClick={() => setExpandedCountry(isExpanded ? null : country.id)}
                            style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 space-y-3">
                      <p className="text-slate-700 text-sm font-medium">{country.description}</p>

                      {/* Quick Info */}
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-slate-50 p-2 rounded">
                          <p className="text-slate-500 font-medium">Délai</p>
                          <p className="text-slate-900 font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {country.processingTime}
                          </p>
                        </div>
                        <div className="bg-slate-50 p-2 rounded">
                          <p className="text-slate-500 font-medium">Coût</p>
                          <p className="text-slate-900 font-bold flex items-center gap-1">
                            <DollarSign className="w-3 h-3" /> {country.cost}
                          </p>
                        </div>
                        <div className="bg-slate-50 p-2 rounded">
                          <p className="text-slate-500 font-medium">Difficulté</p>
                          <Badge className={`text-xs mt-1 ${getDifficultyColor(country.difficulty)}`}>
                            {country.difficulty}
                          </Badge>
                        </div>
                      </div>

                      {/* Highlights */}
                      <div className="flex flex-wrap gap-1">
                        {country.highlights.slice(0, 3).map((highlight, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {highlight}
                          </Badge>
                        ))}
                      </div>

                      {/* Download Button */}
                      <a
                        href={country.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="w-full"
                      >
                        <Button
                          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2 transition-all hover:shadow-lg"
                        >
                          <Download className="w-4 h-4" />
                          Télécharger le PDF
                        </Button>
                      </a>
                    </div>

                    {/* Expanded Content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-slate-200 p-4 bg-slate-50 space-y-4 max-h-96 overflow-y-auto"
                        >
                          {/* Detailed Description */}
                          <div>
                            <h4 className="font-bold text-slate-900 mb-2">📝 Description détaillée</h4>
                            <p className="text-sm text-slate-700 leading-relaxed">{country.detailedDescription}</p>
                          </div>

                          {/* Steps */}
                          <div>
                            <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                              <FileText className="w-4 h-4" /> Étapes du processus
                            </h4>
                            <ol className="space-y-1 text-sm text-slate-700">
                              {country.steps.map((step, idx) => (
                                <li key={idx} className="flex gap-2">
                                  <span className="font-bold text-blue-600 flex-shrink-0">{idx + 1}.</span>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ol>
                          </div>

                          {/* Required Documents */}
                          <div>
                            <h4 className="font-bold text-slate-900 mb-2">📄 Documents requis</h4>
                            <div className="space-y-2">
                              {country.requiredDocuments.map((category, idx) => (
                                <div key={idx} className="bg-white p-2 rounded border border-slate-200">
                                  <p className="font-semibold text-slate-800 text-xs mb-1">{category.category}</p>
                                  <ul className="space-y-1">
                                    {category.documents.map((doc, docIdx) => (
                                      <li key={docIdx} className="text-xs text-slate-600 flex gap-2">
                                        <span className="text-blue-600">•</span>
                                        <span>{doc}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Eligibility */}
                          {country.eligibilityRequirements && (
                            <div>
                              <h4 className="font-bold text-slate-900 mb-2">✅ Critères d\'éligibilité</h4>
                              <ul className="space-y-1 text-sm text-slate-700">
                                {country.eligibilityRequirements.map((req, idx) => (
                                  <li key={idx} className="flex gap-2">
                                    <span className="text-green-600">✓</span>
                                    <span>{req}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* Empty State */}
        {filteredCountries.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-lg text-slate-600">Aucune destination trouvée. Essayez une autre recherche.</p>
          </motion.div>
        )}

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 bg-white rounded-2xl shadow-lg p-8"
        >
          <h2 className="text-2xl font-bold text-slate-900 mb-4">📚 À propos de cette bibliothèque</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <Star className="w-8 h-8 text-yellow-500 mb-3" />
              <h3 className="font-bold text-slate-900 mb-2">107 Destinations</h3>
              <p className="text-slate-600 text-sm">Accès complet à tous les types de visas : Travail (34), Études (22), Visiteur (27)</p>
            </div>
            <div>
              <FileText className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="font-bold text-slate-900 mb-2">Guides Complets</h3>
              <p className="text-slate-600 text-sm">Descriptions détaillées, listes de documents, étapes précises et critères d\'éligibilité</p>
            </div>
            <div>
              <Download className="w-8 h-8 text-green-600 mb-3" />
              <h3 className="font-bold text-slate-900 mb-2">Comparaison Interactive</h3>
              <p className="text-slate-600 text-sm">Comparez jusqu\'à 3 destinations pour choisir la meilleure option</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
