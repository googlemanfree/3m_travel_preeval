import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Lightbulb, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useLocation } from 'wouter';

interface SearchItem {
  title: string;
  icon: string;
  path: string;
  keywords: string[];
}

interface NavbarSearchBarProps {
  compact?: boolean;
}

export const NavbarSearchBar: React.FC<NavbarSearchBarProps> = ({ compact = true }) => {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [, navigate] = useLocation();

  // Données de recherche rapide avec mots-clés
  const searchItems: SearchItem[] = [
    { title: 'Visa Étudiant', icon: '🎓', path: '/procedures', keywords: ['etudiant', 'student', 'study', 'education', 'ecole'] },
    { title: 'Permis de Travail', icon: '💼', path: '/procedures', keywords: ['travail', 'work', 'emploi', 'job', 'permit', 'professionnel'] },
    { title: 'Résidence Permanente', icon: '🏠', path: '/procedures', keywords: ['residence', 'permanent', 'pr', 'immigration', 'habiter'] },
    { title: 'Destinations', icon: '🌍', path: '/destinations', keywords: ['destination', 'pays', 'country', 'voyage', 'travel', 'aller'] },
    { title: 'Types de Visa', icon: '📄', path: '/visa-types', keywords: ['visa', 'type', 'categorie', 'category', 'classification'] },
    { title: 'Guide Complet', icon: '📚', path: '/guide', keywords: ['guide', 'complet', 'complete', 'information', 'help', 'aide'] },
    { title: 'Tarifs', icon: '💰', path: '/tarifs', keywords: ['tarif', 'prix', 'price', 'cost', 'fee', 'montant'] },
    { title: 'Blog', icon: '📝', path: '/blog', keywords: ['blog', 'article', 'news', 'actualite', 'information'] },
    { title: 'Avis Clients', icon: '⭐', path: '/avis', keywords: ['avis', 'review', 'temoignage', 'feedback', 'opinion'] },
    { title: 'Recherche Avancée', icon: '🔍', path: '/search', keywords: ['recherche', 'search', 'avancee', 'advanced', 'chercher'] },
  ];

  // Système de suggestions de termes alternatifs
  const suggestAlternatives = (searchTerm: string): SearchItem[] => {
    const term = searchTerm.toLowerCase().trim();
    
    const alternatives: { [key: string]: string[] } = {
      'canada': ['Visa Étudiant', 'Permis de Travail', 'Résidence Permanente'],
      'france': ['Destinations', 'Types de Visa', 'Guide Complet'],
      'usa': ['Destinations', 'Visa Étudiant', 'Permis de Travail'],
      'uk': ['Destinations', 'Visa Étudiant', 'Guide Complet'],
      'australie': ['Destinations', 'Permis de Travail', 'Types de Visa'],
      'immigration': ['Résidence Permanente', 'Types de Visa', 'Guide Complet'],
      'etude': ['Visa Étudiant', 'Destinations', 'Guide Complet'],
      'travail': ['Permis de Travail', 'Types de Visa', 'Destinations'],
      'prix': ['Tarifs', 'Blog', 'Avis Clients'],
      'avis': ['Avis Clients', 'Blog', 'Guide Complet'],
      'comment': ['Guide Complet', 'Blog', 'Recherche Avancée'],
      'quoi': ['Types de Visa', 'Guide Complet', 'Destinations'],
      'ou': ['Destinations', 'Types de Visa', 'Guide Complet'],
    };

    // Chercher les correspondances exactes
    if (alternatives[term]) {
      return searchItems.filter(item => alternatives[term].includes(item.title));
    }

    // Chercher les correspondances partielles
    for (const [key, values] of Object.entries(alternatives)) {
      if (key.includes(term) || term.includes(key)) {
        return searchItems.filter(item => values.includes(item.title));
      }
    }

    // Suggestions par défaut si rien ne correspond
    return searchItems.filter(item => 
      ['Destinations', 'Types de Visa', 'Guide Complet', 'Recherche Avancée'].includes(item.title)
    );
  };

  const filteredItems = useMemo(() => {
    if (query.length === 0) return [];
    const lowerQuery = query.toLowerCase();
    return searchItems.filter(item =>
      item.title.toLowerCase().includes(lowerQuery) ||
      item.keywords.some(keyword => keyword.includes(lowerQuery))
    );
  }, [query]);

  const suggestions = useMemo(() => {
    if (query.length === 0 || filteredItems.length > 0) return [];
    return suggestAlternatives(query);
  }, [query, filteredItems]);

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

      {/* Message vide avec suggestions */}
      <AnimatePresence>
        {showResults && filteredItems.length === 0 && query.length > 0 && (
          <>
            {/* Overlay pour fermer */}
            <div
              className="fixed inset-0 z-30"
              onClick={() => setShowResults(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-40 overflow-hidden"
            >
              {/* En-tête du message vide */}
              <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      Aucun résultat pour "{query}"
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Essayez l'une de ces suggestions :
                    </p>
                  </div>
                </div>
              </div>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="py-2">
                  {suggestions.map((suggestion, index) => (
                    <motion.button
                      key={suggestion.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        setQuery(suggestion.title);
                        handleItemClick(suggestion.path);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors flex items-center gap-3 group"
                    >
                      <span className="text-lg group-hover:scale-110 transition-transform">{suggestion.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{suggestion.title}</p>
                        <p className="text-xs text-gray-500">Suggestion alternative</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Lien vers recherche avancée */}
              <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={() => handleItemClick(`/search?q=${encodeURIComponent(query)}`)}
                  className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium py-2 px-3 rounded hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  Recherche avancée pour "{query}"
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NavbarSearchBar;
