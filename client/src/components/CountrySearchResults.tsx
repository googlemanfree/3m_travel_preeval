import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, MapPin, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { CountryData } from '@/data/countriesData';
import PDFPreviewModal from '@/components/PDFPreviewModal';

interface CountrySearchResultsProps {
  countries: CountryData[];
  isLoading?: boolean;
  onClose?: () => void;
}

const difficultyColors = {
  facile: 'bg-green-500/20 text-green-300 border-green-500/30',
  moyen: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  difficile: 'bg-red-500/20 text-red-300 border-red-500/30',
};

const difficultyIcons = {
  facile: <CheckCircle className="w-4 h-4" />,
  moyen: <AlertCircle className="w-4 h-4" />,
  difficile: <AlertCircle className="w-4 h-4" />,
};

export const CountrySearchResults: React.FC<CountrySearchResultsProps> = ({
  countries,
  isLoading = false,
  onClose,
}) => {
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);
  const [showPDFModal, setShowPDFModal] = useState(false);

  if (countries.length === 0 && !isLoading) {
    return null;
  }

  const handlePDFClick = (country: CountryData) => {
    setSelectedCountry(country);
    setShowPDFModal(true);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="absolute top-full left-0 right-0 mt-3 bg-[#0f1e4a]/98 backdrop-blur-lg border border-white/20 rounded-xl shadow-2xl z-50 overflow-hidden max-h-96 overflow-y-auto"
      >
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <p className="text-white/60 mt-3">Recherche en cours...</p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {countries.map((country, idx) => (
              <motion.div
                key={country.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * idx }}
                className="p-4 hover:bg-white/5 transition-colors"
              >
                {/* En-tête : drapeau + nom + difficulté */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{country.emoji}</span>
                    <div>
                      <h3 className="text-white font-bold text-lg">{country.name}</h3>
                      <p className="text-white/50 text-sm">{country.frenchName}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full border flex items-center gap-2 text-xs font-semibold ${difficultyColors[country.difficulty]}`}>
                    {difficultyIcons[country.difficulty]}
                    {country.difficulty.charAt(0).toUpperCase() + country.difficulty.slice(1)}
                  </div>
                </div>

                {/* Description */}
                <p className="text-white/70 text-sm mb-3">{country.description}</p>

                {/* Infos clés */}
                <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                  <div className="flex items-center gap-2 text-white/60">
                    <MapPin className="w-4 h-4 text-blue-400" />
                    <span><strong>Région :</strong> {country.region}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/60">
                    <Clock className="w-4 h-4 text-orange-400" />
                    <span><strong>Délai :</strong> {country.processingTime}</span>
                  </div>
                </div>

                {/* Types de visa */}
                <div className="mb-3">
                  <p className="text-white/60 text-xs font-semibold mb-2">Types de visa disponibles :</p>
                  <div className="flex flex-wrap gap-2">
                    {country.visaTypes.map((visa, i) => (
                      <span key={i} className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs border border-blue-500/30">
                        {visa}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Avantages */}
                <div className="mb-3">
                  <p className="text-white/60 text-xs font-semibold mb-2">Avantages clés :</p>
                  <ul className="text-white/50 text-xs space-y-1">
                    {country.advantages.slice(0, 2).map((adv, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-400" />
                        {adv}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bouton téléchargement PDF */}
                <motion.button
                  onClick={() => handlePDFClick(country)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-lg font-semibold text-sm transition-all duration-200 w-full justify-center"
                >
                  <Download className="w-4 h-4" />
                  Télécharger le guide PDF
                </motion.button>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Modale d'aperçu PDF */}
      {selectedCountry && (
        <PDFPreviewModal
          isOpen={showPDFModal}
          onClose={() => setShowPDFModal(false)}
          countryName={selectedCountry.name}
          pdfUrl={selectedCountry.pdfGuide}
          onDownload={() => {}}
          onSelectSimilar={(countryId) => {
            // Optionnel: charger le nouveau pays
            console.log('Guide similaire sélectionné:', countryId);
          }}
        />
      )}
    </AnimatePresence>
  );
};

export default CountrySearchResults;
