import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle } from 'lucide-react';

interface TooltipContent {
  title: string;
  description: string;
  details: string[];
  creditCost: string;
}

interface InteractiveTooltipProps {
  content: TooltipContent;
  children?: React.ReactNode;
}

export const InteractiveTooltip: React.FC<InteractiveTooltipProps> = ({
  content,
  children,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      {/* Trigger Button */}
      <motion.button
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/20 hover:bg-white/30 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label="Afficher les détails"
      >
        <HelpCircle className="w-4 h-4 text-white" />
      </motion.button>

      {/* Tooltip Content */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50 w-80 pointer-events-none"
          >
            <div className="bg-slate-900 text-white rounded-lg shadow-2xl border border-slate-700 p-4">
              {/* Arrow */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-900" />

              {/* Title */}
              <h4 className="text-sm font-bold text-white mb-2">{content.title}</h4>

              {/* Description */}
              <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                {content.description}
              </p>

              {/* Details List */}
              <div className="space-y-2 mb-3 bg-slate-800/50 rounded p-3">
                <p className="text-xs font-semibold text-slate-200 mb-2">Détails :</p>
                {content.details.map((detail, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-blue-400 text-xs mt-1">•</span>
                    <span className="text-xs text-slate-300">{detail}</span>
                  </div>
                ))}
              </div>

              {/* Credit Cost */}
              <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded p-2">
                <p className="text-xs font-semibold text-orange-300">
                  Coût estimé : {content.creditCost}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {children}
    </div>
  );
};
