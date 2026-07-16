import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en.json';
import twi from './twi.json';
import ewe from './ewe.json';
import ha from './ha.json';

const resources = {
  en: { translation: en },
  twi: { translation: twi },
  ewe: { translation: ewe },
  ha: { translation: ha }
};

// Simple manual detection to avoid external dependency
const getInitialLanguage = () => {
  const saved = localStorage.getItem('lydiacontactcenter_language');
  if (saved === 'ga') return 'ha';
  if (saved) return saved;
  return 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
