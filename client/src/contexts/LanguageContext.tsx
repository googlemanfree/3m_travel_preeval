/**
 * Contexte React pour la Gestion des Langues
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, getStoredLanguage, setLanguage as setStoredLanguage, t } from '@/lib/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('fr');
  const [isLoaded, setIsLoaded] = useState(false);

  // Charger la langue stockée au montage
  useEffect(() => {
    const stored = getStoredLanguage();
    setLanguageState(stored);
    setIsLoaded(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    setStoredLanguage(lang);
  };

  const translate = (key: string) => t(key, language);

  if (!isLoaded) {
    return null; // Ou un loading state
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translate }}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Hook pour utiliser le contexte des langues
 */
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}

export default LanguageContext;
