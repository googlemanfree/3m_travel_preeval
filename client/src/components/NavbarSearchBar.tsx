import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';

interface NavbarSearchBarProps {
  compact?: boolean;
}

export const NavbarSearchBar: React.FC<NavbarSearchBarProps> = ({ compact = true }) => {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [, navigate] = useLocation();

  // Données de recherche rapide
  const searchItems = [
    { title: 'Visa Étudiant', icon: '🎓', path: '/procedures' },
    { title: 'Permis de Travail', icon: '💼', path: '/procedures' },
    { title: 'Résidence Permanente', icon: '🏠', path: '/procedures' },
    { title: 'Destinations', icon: '🌍', path: '/destinations' },
    { title: 'Types de Visa', icon: '📄', path: '/visa-types' },
    { title: 'Guide Complet', icon: '📚', path: '/guide' },
    { title: 'Tarifs', icon: '💰', path: '/tarifs' },
    { title: 'Blog', icon: '📝', path: '/blog' },
    { title: 'Avis Clients', icon: '⭐', path: '/avis' },
    { title: 'Recherche Avancée', icon: '🔍', path: '/search' },
  ];

  const filteredItems = useMemo(() => {
    if (query.length === 0) return [];
    return searchItems.filter(item =>
      item.title.toLowerCase().includes(query.toLowerCase())
    );
  }, [query]);

  const handleItemClick = (path: string) => {
    navigate(path);
    setShowResults(false);
    setQuery('');
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.length > 0) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setShowResults(false);
      setQuery('');
    }
  };

  return (
    <div className={`relative ${compact ? 'w-full md:w-64' : 'w-full'}`}>
      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <Input
          type="text"
          placeholder={compact ? "Rechercher..." : "Recherchez un visa, une procédure..."}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(e.target.value.length > 0);
          }}
          onFocus={() => setShowResults(query.length > 0)}
          onKeyDown={handleSearch}
          className="pl-9 pr-9 py-2 text-sm rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          aria-label="Rechercher"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setShowResults(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Effacer la recherche"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Résultats de recherche */}
      <AnimatePresence>
        {showResults && filteredItems.length > 0 && (
          <>
            {/* Overlay pour fermer */}
            <div
              className="fixed inset-0 z-30"
              onClick={() => setShowResults(false)}
            />

            {/* Dropdown des résultats */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-40 max-h-80 overflow-y-auto"
            >
              {filteredItems.map((item, index) => (
                <motion.button
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => handleItemClick(item.path)}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors flex items-center gap-3"
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm font-medium text-gray-900">{item.title}</span>
                </motion.button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Message vide */}
      {showResults && filteredItems.length === 0 && query.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center z-40"
        >
          <p className="text-sm text-gray-500">
            Aucun résultat pour "{query}"
          </p>
          <button
            onClick={() => handleItemClick(`/search?q=${encodeURIComponent(query)}`)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-2"
          >
            Voir la recherche avancée →
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default NavbarSearchBar;
