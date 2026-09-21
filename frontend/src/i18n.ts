import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import cs from './locales/cs.json';
import en from './locales/en.json';
import uk from './locales/uk.json';

export const LANGUAGES = [
  { code: 'cs', label: 'CS', name: 'Čeština' },
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'uk', label: 'UK', name: 'Українська' },
] as const;

export type LangCode = typeof LANGUAGES[number]['code'];

i18n
  .use(initReactI18next)
  .init({
    resources: {
      cs: { translation: cs },
      en: { translation: en },
      uk: { translation: uk },
    },
    lng: localStorage.getItem('lang') || 'cs',
    fallbackLng: 'cs',
    interpolation: { escapeValue: false },
  });

export function setLanguage(lang: LangCode) {
  localStorage.setItem('lang', lang);
  i18n.changeLanguage(lang);
}

export default i18n;
