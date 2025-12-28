'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import enTranslations from './translations/en.json';
import rwTranslations from './translations/rw.json';
import frTranslations from './translations/fr.json';

type Locale = 'en' | 'rw' | 'fr';
type Translations = typeof enTranslations;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const translations: Record<Locale, Translations> = {
  en: enTranslations,
  rw: rwTranslations,
  fr: frTranslations,
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    // Load saved language from localStorage
    const savedLang = localStorage.getItem('tumanow_language') as Locale;
    if (savedLang && (savedLang === 'en' || savedLang === 'rw' || savedLang === 'fr')) {
      setLocaleState(savedLang);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('tumanow_language', newLocale);
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[locale];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English if translation not found
        value = translations.en;
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            return key; // Return key if translation not found
          }
        }
        break;
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

