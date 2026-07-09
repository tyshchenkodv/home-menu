import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '../locales/en/translation.json';
import uk from '../locales/uk/translation.json';

export const SUPPORTED_LANGUAGES = ['uk', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const LANGUAGE_STORAGE_KEY = 'home-menu-language';
const DEFAULT_LANGUAGE: SupportedLanguage = 'uk';

const isSupportedLanguage = (value: string | null): value is SupportedLanguage => {
  return SUPPORTED_LANGUAGES.includes(value as SupportedLanguage);
};

const readStoredLanguage = (): SupportedLanguage => {
  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);

  return isSupportedLanguage(stored) ? stored : DEFAULT_LANGUAGE;
};

export const i18n = createInstance();

void i18n.use(initReactI18next).init({
  lng: readStoredLanguage(),
  fallbackLng: 'en',
  supportedLngs: SUPPORTED_LANGUAGES,
  defaultNS: 'translation',
  ns: ['translation'],
  resources: {
    uk: { translation: uk },
    en: { translation: en },
  },
  interpolation: {
    escapeValue: false,
  },
});

i18n.on('languageChanged', language => {
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
});
