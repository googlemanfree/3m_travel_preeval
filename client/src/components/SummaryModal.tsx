import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Copy, Check, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  country: string;
  flag: string;
  summary: {
    type: string;
    summary: string;
    requirements: string[];
    duration: string;
    processingTime: string;
    cost: string;
  };
  attractions?: { name: string; icon: string; description: string }[];
  gastronomy?: { name: string; icon: string; description: string }[];
}

export const SummaryModal: React.FC<SummaryModalProps> = ({
  isOpen,
  onClose,
  country,
  flag,
  summary,
  attractions = [],
  gastronomy = [],
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = `${country} - ${summary.type}\n\n${summary.summary}\n\nDurée: ${summary.duration}\nTraitement: ${summary.processingTime}\nCoût: ${summary.cost}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-0 bg-white">
        {/* Header with Gradient Background */}
        <DialogHeader className="sticky top-0 z-20 bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <span className="text-5xl">{flag}</span>
              <div>
                <DialogTitle className="text-3xl font-bold text-white">{country}</DialogTitle>
                <p className="text-blue-100 font-semibold text-lg mt-1">{summary.type}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-10 w-10 text-white hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </DialogHeader>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-8 space-y-8"
        >
          {/* Key Information Cards - Prominent */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-green-300 shadow-md hover:shadow-lg transition-shadow"
            >
              <p className="text-xs text-green-700 uppercase font-bold tracking-wider mb-2">⏱️ Durée du Visa</p>
              <p className="text-2xl font-bold text-green-900">{summary.duration}</p>
              <p className="text-xs text-green-600 mt-2">Validité du document</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border-2 border-orange-300 shadow-md hover:shadow-lg transition-shadow"
            >
              <p className="text-xs text-orange-700 uppercase font-bold tracking-wider mb-2">⚡ Délai de Traitement</p>
              <p className="text-2xl font-bold text-orange-900">{summary.processingTime}</p>
              <p className="text-xs text-orange-600 mt-2">Temps moyen de réponse</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border-2 border-purple-300 shadow-md hover:shadow-lg transition-shadow"
            >
              <p className="text-xs text-purple-700 uppercase font-bold tracking-wider mb-2">💰 Coût Estimé</p>
              <p className="text-2xl font-bold text-purple-900">{summary.cost}</p>
              <p className="text-xs text-purple-600 mt-2">Frais officiels</p>
            </motion.div>
          </div>

          {/* Main Summary - Large and Clear */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="p-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-300 shadow-md"
          >
            <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">📋</span> Résumé Complet
            </h3>
            <p className="text-lg leading-8 text-gray-800 font-medium">
              {summary.summary}
            </p>
          </motion.div>

          {/* Requirements Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-300 shadow-md"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="text-2xl">✅</span> Documents & Conditions Requises
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {summary.requirements.map((req, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + index * 0.05 }}
                  className="flex items-start gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all"
                >
                  <span className="text-green-600 font-bold text-xl flex-shrink-0 mt-1">✓</span>
                  <span className="text-gray-800 font-medium text-base leading-relaxed">{req}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Attractions Section */}
          {attractions.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="p-8 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl border-2 border-indigo-300 shadow-md"
            >
              <h3 className="text-xl font-bold text-indigo-900 mb-6 flex items-center gap-2">
                <span className="text-2xl">🎯</span> Attractions Touristiques Principales
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {attractions.map((attraction, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 + index * 0.05 }}
                    className="p-4 bg-white rounded-lg border border-indigo-200 hover:border-indigo-400 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-3xl flex-shrink-0">{attraction.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-bold text-indigo-900 text-base">{attraction.name}</h4>
                        <p className="text-sm text-gray-700 mt-1 leading-relaxed">{attraction.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Gastronomy Section */}
          {gastronomy.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: attractions.length > 0 ? 0.5 : 0.4 }}
              className="p-8 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border-2 border-orange-300 shadow-md"
            >
              <h3 className="text-xl font-bold text-orange-900 mb-6 flex items-center gap-2">
                <span className="text-2xl">🍽️</span> Gastronomie Locale
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gastronomy.map((dish, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (attractions.length > 0 ? 0.55 : 0.45) + index * 0.05 }}
                    className="p-4 bg-white rounded-lg border border-orange-200 hover:border-orange-400 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-3xl flex-shrink-0">{dish.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-bold text-orange-900 text-base">{dish.name}</h4>
                        <p className="text-sm text-gray-700 mt-1 leading-relaxed">{dish.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Information Box */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: attractions.length > 0 && gastronomy.length > 0 ? 0.6 : attractions.length > 0 || gastronomy.length > 0 ? 0.5 : 0.4 }}
            className="p-6 bg-amber-50 rounded-xl border-2 border-amber-300 shadow-md"
          >
            <p className="text-gray-800 font-medium">
              <strong className="text-amber-900">💡 Conseil Important :</strong> Pour plus de détails spécifiques à votre situation, consultez le guide PDF complet ou contactez nos experts pour une consultation personnalisée et adaptée à votre profil.
            </p>
          </motion.div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t-2 border-gray-200">
            <Button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>Résumé Copié !</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  <span>Copier le Résumé</span>
                </>
              )}
            </Button>
            <Button
              onClick={onClose}
              className="flex-1 bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 rounded-lg transition-all"
            >
              Fermer
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};
