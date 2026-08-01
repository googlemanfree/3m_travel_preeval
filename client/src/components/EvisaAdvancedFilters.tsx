/**
 * Filtres Avancés pour E-Visas
 * Recherche, filtres par continent, prix et délai
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Search,
  X,
  Globe,
  DollarSign,
  Clock,
  Filter,
  RotateCcw,
} from 'lucide-react';

interface EvisaAdvancedFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  totalResults?: number;
}

export interface FilterState {
  searchTerm: string;
  continents: string[];
  priceRange: [number, number];
  processingTimeRange: [number, number];
}

const CONTINENTS = [
  { id: 'Afrique', label: 'Afrique', icon: '🌍', color: 'bg-orange-100 text-orange-700' },
  { id: 'Asie', label: 'Asie', icon: '🏯', color: 'bg-red-100 text-red-700' },
  { id: 'Europe', label: 'Europe', icon: '🏰', color: 'bg-blue-100 text-blue-700' },
  { id: 'Amérique', label: 'Amérique', icon: '🗽', color: 'bg-green-100 text-green-700' },
  { id: 'Océanie', label: 'Océanie', icon: '🏝️', color: 'bg-cyan-100 text-cyan-700' },
];

export function EvisaAdvancedFilters({
  onFilterChange,
  totalResults = 0,
}: EvisaAdvancedFiltersProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContinents, setSelectedContinents] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500000]);
  const [processingTimeRange, setProcessingTimeRange] = useState<[number, number]>([1, 90]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Mettre à jour les filtres
  const handleFilterChange = () => {
    onFilterChange({
      searchTerm,
      continents: selectedContinents,
      priceRange,
      processingTimeRange,
    });
  };

  // Réinitialiser les filtres
  const handleReset = () => {
    setSearchTerm('');
    setSelectedContinents([]);
    setPriceRange([0, 500000]);
    setProcessingTimeRange([1, 90]);
    onFilterChange({
      searchTerm: '',
      continents: [],
      priceRange: [0, 500000],
      processingTimeRange: [1, 90],
    });
  };

  // Vérifier si des filtres sont actifs
  const hasActiveFilters = useMemo(() => {
    return (
      searchTerm.length > 0 ||
      selectedContinents.length > 0 ||
      priceRange[0] > 0 ||
      priceRange[1] < 500000 ||
      processingTimeRange[0] > 1 ||
      processingTimeRange[1] < 90
    );
  }, [searchTerm, selectedContinents, priceRange, processingTimeRange]);

  const toggleContinent = (continent: string) => {
    setSelectedContinents((prev) =>
      prev.includes(continent)
        ? prev.filter((c) => c !== continent)
        : [...prev, continent]
    );
  };

  return (
    <div className="space-y-4">
      {/* Barre de recherche principale */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Rechercher un pays, un continent..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              handleFilterChange();
            }}
            className="pl-12 pr-12 h-12 text-base"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                handleFilterChange();
              }}
              className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </motion.div>

      {/* Filtres par continent */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            Continents
          </h3>
          <Badge variant="secondary">{selectedContinents.length}</Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {CONTINENTS.map((continent) => (
            <motion.button
              key={continent.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                toggleContinent(continent.id);
                handleFilterChange();
              }}
              className={`p-3 rounded-lg border-2 transition-all ${
                selectedContinents.includes(continent.id)
                  ? `${continent.color} border-current`
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <div className="text-xl mb-1">{continent.icon}</div>
                <div className="text-xs font-semibold">{continent.label}</div>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Filtres avancés */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Button
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full justify-between"
        >
          <span className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtres avancés
          </span>
          <motion.span
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            ▼
          </motion.span>
        </Button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 space-y-6 p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              {/* Filtre par prix */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-gray-900 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    Prix (XOF)
                  </label>
                  <span className="text-sm text-gray-600">
                    {priceRange[0].toLocaleString('fr-FR')} -{' '}
                    {priceRange[1].toLocaleString('fr-FR')}
                  </span>
                </div>
                <Slider
                  value={priceRange}
                  onValueChange={(value) => {
                    setPriceRange(value as [number, number]);
                    handleFilterChange();
                  }}
                  min={0}
                  max={500000}
                  step={10000}
                  className="w-full"
                />
              </div>

              {/* Filtre par délai de traitement */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-gray-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    Délai de traitement (jours)
                  </label>
                  <span className="text-sm text-gray-600">
                    {processingTimeRange[0]} - {processingTimeRange[1]}
                  </span>
                </div>
                <Slider
                  value={processingTimeRange}
                  onValueChange={(value) => {
                    setProcessingTimeRange(value as [number, number]);
                    handleFilterChange();
                  }}
                  min={1}
                  max={90}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Bouton de réinitialisation */}
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="w-full text-red-600 hover:text-red-700"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Réinitialiser les filtres
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Résumé des résultats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
      >
        <span className="text-sm text-gray-700">
          <span className="font-semibold text-blue-600">{totalResults}</span> e-visa
          {totalResults !== 1 ? 's' : ''} trouvé
          {totalResults !== 1 ? 's' : ''}
        </span>
        {hasActiveFilters && (
          <Badge variant="secondary" className="cursor-pointer" onClick={handleReset}>
            Filtres actifs
          </Badge>
        )}
      </motion.div>

      {/* Filtres actifs */}
      {hasActiveFilters && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap gap-2"
        >
          {searchTerm && (
            <Badge
              variant="outline"
              className="cursor-pointer hover:bg-gray-100"
              onClick={() => {
                setSearchTerm('');
                handleFilterChange();
              }}
            >
              🔍 {searchTerm}
              <X className="w-3 h-3 ml-1" />
            </Badge>
          )}

          {selectedContinents.map((continent) => {
            const continentData = CONTINENTS.find((c) => c.id === continent);
            return (
              <Badge
                key={continent}
                variant="outline"
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => {
                  toggleContinent(continent);
                  handleFilterChange();
                }}
              >
                {continentData?.icon} {continent}
                <X className="w-3 h-3 ml-1" />
              </Badge>
            );
          })}

          {(priceRange[0] > 0 || priceRange[1] < 500000) && (
            <Badge
              variant="outline"
              className="cursor-pointer hover:bg-gray-100"
              onClick={() => {
                setPriceRange([0, 500000]);
                handleFilterChange();
              }}
            >
              💰 {priceRange[0].toLocaleString('fr-FR')} - {priceRange[1].toLocaleString('fr-FR')} XOF
              <X className="w-3 h-3 ml-1" />
            </Badge>
          )}

          {(processingTimeRange[0] > 1 || processingTimeRange[1] < 90) && (
            <Badge
              variant="outline"
              className="cursor-pointer hover:bg-gray-100"
              onClick={() => {
                setProcessingTimeRange([1, 90]);
                handleFilterChange();
              }}
            >
              ⏱️ {processingTimeRange[0]} - {processingTimeRange[1]} jours
              <X className="w-3 h-3 ml-1" />
            </Badge>
          )}
        </motion.div>
      )}
    </div>
  );
}
