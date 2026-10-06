import React, { createContext, useContext, useState, useEffect } from 'react';
import { SupportedLanguage, SUPPORTED_LANGUAGES, translations } from './translations';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: keyof typeof translations['pt']) => string;
  languages: typeof SUPPORTED_LANGUAGES;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem('dk_language');
    if (saved && (saved in translations)) {
      return saved as SupportedLanguage;
    }
    return 'pt';
  });

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('dk_language', lang);
  };

  const t = (key: keyof typeof translations['pt']): string => {
    const langDict = translations[language] || translations['pt'];
    return (langDict as any)[key] || (translations['pt'] as any)[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languages: SUPPORTED_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
