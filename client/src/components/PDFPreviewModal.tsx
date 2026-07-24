import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  countryName: string;
  pdfUrl: string;
  onDownload: () => void;
}

export const PDFPreviewModal: React.FC<PDFPreviewModalProps> = ({
  isOpen,
  onClose,
  countryName,
  pdfUrl,
  onDownload,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // Créer un lien temporaire et télécharger
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `Guide_${countryName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Fermer la modale après téléchargement
      setTimeout(() => {
        setIsDownloading(false);
        onClose();
      }, 500);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-[#0f1e4a] border border-white/20 rounded-xl">
        <DialogHeader className="border-b border-white/10 pb-4">
          <DialogTitle className="text-white text-2xl font-bold flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-400" />
            Guide d'immigration - {countryName}
          </DialogTitle>
        </DialogHeader>

        {/* Aperçu du PDF */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="my-6 p-6 bg-white/5 rounded-lg border border-white/10"
        >
          <div className="aspect-video bg-white/10 rounded-lg flex items-center justify-center mb-4 overflow-hidden">
            {/* Aperçu simplifié - dans un vrai projet, utiliser react-pdf */}
            <div className="text-center">
              <FileText className="w-16 h-16 text-blue-400 mx-auto mb-3 opacity-50" />
              <p className="text-white/60 text-sm">Aperçu du document PDF</p>
              <p className="text-white/40 text-xs mt-2">Guide complet d'immigration pour {countryName}</p>
            </div>
          </div>

          {/* Informations du document */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <p className="text-white/60 text-xs font-semibold">FORMAT</p>
              <p className="text-white font-bold">PDF</p>
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <p className="text-white/60 text-xs font-semibold">PAGES</p>
              <p className="text-white font-bold">12-20</p>
            </div>
            <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
              <p className="text-white/60 text-xs font-semibold">TAILLE</p>
              <p className="text-white font-bold">2-5 MB</p>
            </div>
          </div>

          {/* Description du contenu */}
          <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
            <p className="text-white/80 text-sm font-semibold mb-2">📋 Contenu du guide :</p>
            <ul className="text-white/60 text-xs space-y-1">
              <li>✓ Vue d'ensemble du pays et de l'économie</li>
              <li>✓ Types de visa et procédures d'immigration</li>
              <li>✓ Conditions d'admissibilité détaillées</li>
              <li>✓ Documents requis et délais de traitement</li>
              <li>✓ Coûts et frais administratifs</li>
              <li>✓ Conseils pratiques et ressources utiles</li>
            </ul>
          </div>
        </motion.div>

        {/* Boutons d'action */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-3 justify-end border-t border-white/10 pt-4"
        >
          <button
            onClick={onClose}
            disabled={isDownloading}
            className="px-4 py-2 rounded-lg border border-white/20 text-white/80 hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            Fermer
          </button>
          <motion.button
            onClick={handleDownload}
            disabled={isDownloading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isDownloading ? 'Téléchargement...' : 'Télécharger le PDF'}
          </motion.button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default PDFPreviewModal;
