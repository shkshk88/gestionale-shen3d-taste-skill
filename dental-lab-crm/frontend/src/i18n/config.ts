import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import it from './locales/it.json'
import en from './locales/en.json'
import fr from './locales/fr.json'
import he from './locales/he.json'

export const resources = {
  it: { translation: it },
  en: { translation: en },
  fr: { translation: fr },
  he: { translation: he },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'it',
    supportedLngs: ['it', 'en', 'fr', 'he'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  })

export default i18n
