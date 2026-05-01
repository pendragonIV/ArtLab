"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  LangCode,
  TranslationKey,
  LANGUAGES,
  detectBrowserLanguage,
  getTranslation,
} from '@/lib/translations';

type LanguageContextType = {
  lang: LangCode;
  setLang: (lang: LangCode) => void;
  t: (key: TranslationKey) => string;
  currentLangMeta: typeof LANGUAGES[0];
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const detected = detectBrowserLanguage();
    setLangState(detected);
    setMounted(true);
  }, []);

  const setLang = (newLang: LangCode) => {
    setLangState(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('artlab-lang', newLang);
    }
  };

  const t = (key: TranslationKey) => getTranslation(lang, key);
  const currentLangMeta = LANGUAGES.find(l => l.code === lang) ?? LANGUAGES[0];

  // Avoid hydration mismatch - render with 'en' on server, then update on client
  if (!mounted) {
    return (
      <LanguageContext.Provider value={{ lang: 'en', setLang, t: (k) => getTranslation('en', k), currentLangMeta: LANGUAGES[0] }}>
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, currentLangMeta }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return ctx;
}
