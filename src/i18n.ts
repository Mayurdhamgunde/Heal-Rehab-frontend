// src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend'; // 1. Import the new backend

i18n
  .use(HttpApi) // 2. Tell i18n to use the backend
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    
    // 3. Define the namespaces (your file names)
    ns: ['common', 'settings', 'dashboard'], 
    defaultNS: 'common', // If you don't specify a file, it checks common.json

    backend: {
      // 4. Tell Vite exactly where to find the JSON files in the public folder
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    },
    
    interpolation: {
      escapeValue: false // React handles XSS
    }
  });

export default i18n;