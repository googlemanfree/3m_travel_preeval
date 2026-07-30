import React from 'react';
import { motion } from 'framer-motion';
import { Download, Eye, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FlagIcon from '@/components/FlagIcon';

interface CountryCardProps {
  country: string;
  capital: string;
  flagEmoji: string;
  type: string;
  typeColor: string;
  onViewSummary: () => void;
  onPreview: () => void;
  onDownload: () => void;
  onStartProcedure?: () => void;
}

// Données des capitales et couleurs par pays
const COUNTRY_DATA: Record<string, { capital: string; gradient: string; icon: string }> = {
  'Allemagne': { capital: 'Berlin', gradient: 'from-amber-400 to-orange-600', icon: '🏛️' },
  'Australie': { capital: 'Canberra', gradient: 'from-blue-400 to-cyan-600', icon: '🦘' },
  'Canada': { capital: 'Ottawa', gradient: 'from-red-400 to-red-600', icon: '🍁' },
  'France': { capital: 'Paris', gradient: 'from-purple-400 to-pink-600', icon: '🗼' },
  'États-Unis': { capital: 'Washington DC', gradient: 'from-blue-600 to-indigo-800', icon: '🏛️' },
  'Royaume-Uni': { capital: 'Londres', gradient: 'from-red-500 to-blue-600', icon: '🏰' },
  'Suisse': { capital: 'Berne', gradient: 'from-red-500 to-red-700', icon: '⛰️' },
  'Nouvelle-Zélande': { capital: 'Wellington', gradient: 'from-green-400 to-blue-600', icon: '🌿' },
  'Irlande': { capital: 'Dublin', gradient: 'from-green-500 to-emerald-700', icon: '🍀' },
  'Italie': { capital: 'Rome', gradient: 'from-red-500 to-green-600', icon: '🏛️' },
  'Pologne': { capital: 'Varsovie', gradient: 'from-red-500 to-white', icon: '🏰' },
  'Portugal': { capital: 'Lisbonne', gradient: 'from-green-500 to-red-600', icon: '🌊' },
  'Qatar': { capital: 'Doha', gradient: 'from-purple-600 to-pink-600', icon: '🏙️' },
  'Malaisie': { capital: 'Kuala Lumpur', gradient: 'from-yellow-400 to-red-600', icon: '🏗️' },
  'Kenya': { capital: 'Nairobi', gradient: 'from-red-600 to-green-600', icon: '🦁' },
  'Schengen': { capital: 'Bruxelles', gradient: 'from-blue-500 to-yellow-500', icon: '🇪🇺' },
};

export const CountryCard: React.FC<CountryCardProps> = ({
  country,
  flagEmoji,
  type,
  typeColor,
  onViewSummary,
  onPreview,
  onDownload,
  onStartProcedure,
}) => {
  const countryInfo = COUNTRY_DATA[country] || { capital: 'Capitale', gradient: 'from-blue-400 to-blue-600', icon: '🌍' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      viewport={{ once: true }}
      className={`relative overflow-hidden rounded-lg border-2 transition-all hover:shadow-2xl group h-full ${typeColor}`}
    >
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${countryInfo.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

      {/* Top Section with Flag and Capital Icon */}
      <div className={`relative bg-gradient-to-br ${countryInfo.gradient} p-6 text-white`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <FlagIcon country={country} className="w-16 h-12 rounded shadow-lg" />
            <span className="text-4xl">{countryInfo.icon}</span>
          </div>
          <motion.span
            whileHover={{ scale: 1.1 }}
            className="text-xs font-bold px-3 py-1 bg-white/90 rounded-full text-gray-800 shadow-md"
          >
            {type}
          </motion.span>
        </div>

        {/* Country Name and Capital */}
        <h3 className="text-2xl font-bold mb-1">{country}</h3>
        <p className="text-sm font-semibold text-white/90">📍 {countryInfo.capital}</p>
      </div>

      {/* Content Section */}
      <div className="relative p-6 space-y-4">
        <p className="text-sm text-gray-600 font-medium">
          Guide complet pour votre demande de visa
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-2">
          {onStartProcedure && (
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={onStartProcedure}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-bold text-sm shadow-lg"
              >
                <span className="text-lg">🚀</span>
                Lancer ma procédure
              </Button>
            </motion.div>
          )}

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={onViewSummary}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold text-sm shadow-md"
            >
              <BookOpen className="w-4 h-4" />
              Voir le résumé
            </Button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={onPreview}
              variant="outline"
              className="w-full flex items-center justify-center gap-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-50 hover:border-gray-400"
            >
              <Eye className="w-4 h-4" />
              Aperçu PDF
            </Button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <button
              onClick={onDownload}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-lg hover:from-slate-900 hover:to-black transition-all font-semibold text-sm shadow-md"
            >
              <Download className="w-4 h-4" />
              Télécharger
            </button>
          </motion.div>
        </div>

        {/* Bottom Info */}
        <div className="pt-3 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500 font-medium">
            ✨ Résumé + PDF + Support complet
          </p>
        </div>
      </div>

      {/* Hover Effect Border */}
      <motion.div
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        className="absolute inset-0 border-2 border-transparent group-hover:border-current rounded-lg pointer-events-none"
      />

      {/* Shine Effect */}
      <motion.div
        initial={{ x: '-100%' }}
        whileHover={{ x: '100%' }}
        transition={{ duration: 0.6 }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 pointer-events-none rounded-lg"
      />
    </motion.div>
  );
};
