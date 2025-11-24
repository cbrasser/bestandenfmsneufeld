import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Language } from './locales';
import { translations } from './locales';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations.de) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const STORAGE_KEY = 'grade-tracker-language';

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Try to load from localStorage, default to German
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && (saved === 'de' || saved === 'fr' || saved === 'en' || saved === 'it')) {
        return saved as Language;
      }
    } catch (error) {
      console.error('Error reading language from localStorage:', error);
    }
    return 'de';
  });

  useEffect(() => {
    // Save language to localStorage whenever it changes
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch (error) {
      console.error('Error saving language to localStorage:', error);
    }
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: keyof typeof translations.de): string => {
    return translations[language][key];
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

