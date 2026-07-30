import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Copy, Check } from 'lucide-react';
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
}

export const SummaryModal: React.FC<SummaryModalProps> = ({
  isOpen,
  onClose,
  country,
  flag,
  summary,
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between sticky top-0 bg-white z-10 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{flag}</span>
            <div>
              <DialogTitle className="text-2xl">{country}</DialogTitle>
              <p className="text-sm text-gray-500 font-normal">{summary.type}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Main Summary */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-bold text-[#0a2540] mb-3">📋 Résumé</h3>
            <p className="text-gray-700 leading-relaxed text-sm">
              {summary.summary}
            </p>
          </div>

          {/* Key Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-xs text-gray-600 uppercase font-semibold mb-2">Durée du visa</p>
              <p className="text-lg font-bold text-[#0a2540]">{summary.duration}</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-xs text-gray-600 uppercase font-semibold mb-2">Délai de traitement</p>
              <p className="text-lg font-bold text-[#0a2540]">{summary.processingTime}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-xs text-gray-600 uppercase font-semibold mb-2">Coût estimé</p>
              <p className="text-lg font-bold text-[#0a2540]">{summary.cost}</p>
            </div>
          </div>

          {/* Requirements */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-bold text-[#0a2540] mb-3">✅ Documents & Conditions Requises</h3>
            <ul className="space-y-2">
              {summary.requirements.map((req, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-3 text-sm text-gray-700"
                >
                  <span className="text-green-600 font-bold mt-0.5">✓</span>
                  <span>{req}</span>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleCopy}
              variant="outline"
              className="flex-1 flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copié !
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copier le résumé
                </>
              )}
            </Button>
            <Button
              onClick={onClose}
              className="flex-1 bg-[#0a2540] hover:bg-[#0a2540]/90"
            >
              Fermer
            </Button>
          </div>

          {/* Info Footer */}
          <div className="p-3 bg-blue-100 rounded-lg border border-blue-300 text-xs text-gray-700">
            <p>
              <strong>💡 Conseil :</strong> Pour plus de détails, téléchargez le guide PDF complet ou contactez nos experts pour une consultation personnalisée.
            </p>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};
