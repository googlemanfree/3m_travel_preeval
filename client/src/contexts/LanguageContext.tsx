import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'fr' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (frText: string, enText: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'fr',
  setLanguage: () => {},
  t: (fr) => fr,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('3m_travel_lang');
      return (saved === 'en' || saved === 'fr') ? saved : 'fr';
    } catch (e) {
      return 'fr';
    }
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('3m_travel_lang', lang);
      document.documentElement.setAttribute('lang', lang);
    } catch (e) {}
  };

  useEffect(() => {
    try {
      document.documentElement.setAttribute('lang', language);
    } catch (e) {}
  }, [language]);

  const t = (frText: string, enText: string) => {
    return language === 'en' ? enText : frText;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
