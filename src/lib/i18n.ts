import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import es from '../locales/es.json';
import en from '../locales/en.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
    },
    fallbackLng: 'es',
    interpolation: { escapeValue: false },
  });

// Sincronizar el atributo lang de <html> con el idioma activo
i18n.on('languageChanged', (lng) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng ? lng.split('-')[0] : 'es';
  }
});

if (typeof document !== 'undefined' && i18n.language) {
  document.documentElement.lang = i18n.language.split('-')[0];
}

export default i18n;
