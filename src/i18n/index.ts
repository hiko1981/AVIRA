import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import da from "./locales/da.json";
import en from "./locales/en.json";

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: "v3",
    lng: "da",
    fallbackLng: "en",
    resources: {
      da: { translation: da },
      en: { translation: en }
    },
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
