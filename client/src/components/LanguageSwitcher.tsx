/**
 * Sélecteur de Langue
 * Permet aux utilisateurs de changer la langue de l'interface
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Globe } from 'lucide-react';
import { Language } from '@/lib/i18n';

interface LanguageSwitcherProps {
  className?: string;
  showLabel?: boolean;
}

export function LanguageSwitcher({ className = '', showLabel = true }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
  ];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && (
        <Globe size={18} className="text-[#1E3A8A]" />
      )}

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {languages.map((lang) => (
          <motion.button
            key={lang.code}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setLanguage(lang.code)}
            className={`px-3 py-1.5 rounded-md transition-all duration-200 text-sm font-medium ${
              language === lang.code
                ? 'bg-white text-[#1E3A8A] shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            aria-label={`Switch to ${lang.label}`}
            aria-pressed={language === lang.code}
          >
            <span className="mr-1">{lang.flag}</span>
            {lang.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export default LanguageSwitcher;
