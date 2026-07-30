import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface SearchFilter {
  id: string;
  label: string;
  options: string[];
}

interface SearchItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  tags?: string[];
  icon?: string;
}

interface SearchBarWithFiltersProps {
  items: SearchItem[];
  filters?: SearchFilter[];
  onSearch?: (query: string, activeFilters: Record<string, string[]>) => void;
  onItemSelect?: (item: SearchItem) => void;
  placeholder?: string;
}

export const SearchBarWithFilters: React.FC<SearchBarWithFiltersProps> = ({
  items,
  filters = [],
  onSearch,
  onItemSelect,
  placeholder = 'Rechercher...',
}) => {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});

  // Filtrer les résultats basé sur la requête et les filtres actifs
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Filtre par texte
      const matchesQuery = query.length === 0 || 
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description?.toLowerCase().includes(query.toLowerCase()) ||
        item.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()));

      // Filtre par catégories sélectionnées
      const matchesFilters = Object.entries(activeFilters).every(([filterKey, selectedValues]) => {
        if (selectedValues.length === 0) return true;
        
        if (filterKey === 'category') {
          return selectedValues.includes(item.category);
        }
        
        if (filterKey === 'tags') {
          return selectedValues.some(tag => item.tags?.includes(tag));
        }
        
        return true;
      });

      return matchesQuery && matchesFilters;
    });
  }, [query, activeFilters, items]);

  const toggleFilter = (filterId: string, value: string) => {
    setActiveFilters(prev => {
      const current = prev[filterId] || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      
      return {
        ...prev,
        [filterId]: updated,
      };
    });

    if (onSearch) {
      onSearch(query, activeFilters);
    }
  };

  const clearFilters = () => {
    setActiveFilters({});
    setQuery('');
    if (onSearch) {
      onSearch('', {});
    }
  };

  const hasActiveFilters = Object.values(activeFilters).some(arr => arr.length > 0);

  return (
    <div className="w-full">
      {/* Barre de recherche principale */}
      <div className="relative mb-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder={placeholder}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowResults(e.target.value.length > 0 || hasActiveFilters);
              }}
              onFocus={() => setShowResults(true)}
              className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              aria-label="Rechercher"
            />
          </div>

          {/* Bouton filtres */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
            aria-label="Afficher les filtres"
          >
            <Filter className="w-4 h-4" />
            Filtres
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1">
                {Object.values(activeFilters).reduce((sum, arr) => sum + arr.length, 0)}
              </Badge>
            )}
          </Button>

          {/* Bouton réinitialiser */}
          {(query || hasActiveFilters) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              aria-label="Réinitialiser la recherche"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Panneau des filtres */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50"
            >
              <div className="space-y-4">
                {filters.map(filter => (
                  <div key={filter.id}>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {filter.label}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {filter.options.map(option => (
                        <Button
                          key={option}
                          variant={activeFilters[filter.id]?.includes(option) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => toggleFilter(filter.id, option)}
                          className="text-xs"
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Résultats de recherche */}
      <AnimatePresence>
        {showResults && filteredItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-40"
          >
            <div className="max-h-96 overflow-y-auto">
              {filteredItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    if (onItemSelect) {
                      onItemSelect(item);
                    }
                    setShowResults(false);
                  }}
                  className="p-3 border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors last:border-b-0"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (onItemSelect) {
                        onItemSelect(item);
                      }
                      setShowResults(false);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    {item.icon && <span className="text-xl">{item.icon}</span>}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm">
                        {item.title}
                      </h4>
                      {item.description && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs whitespace-nowrap">
                      {item.category}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message vide */}
      {showResults && filteredItems.length === 0 && query.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">Aucun résultat trouvé pour "{query}"</p>
        </div>
      )}

      {/* Fermer les résultats au clic extérieur */}
      {showResults && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowResults(false)}
        />
      )}
    </div>
  );
};

export default SearchBarWithFilters;
