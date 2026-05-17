import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import ru from '../locales/ru';
import en from '../locales/en';

export type Lang = 'auto' | 'ru' | 'en';

export function getDeviceLang(): 'ru' | 'en' {
  const tag = Localization.getLocales()[0]?.languageTag ?? 'ru';
  return tag.startsWith('ru') ? 'ru' : 'en';
}

export function applyLang(lang: Lang) {
  const effective = lang === 'auto' ? getDeviceLang() : lang;
  i18n.changeLanguage(effective);
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ru: { translation: ru },
      en: { translation: en },
    },
    lng: getDeviceLang(),
    fallbackLng: 'ru',
    interpolation: { escapeValue: false },
    compatibilityJSON: 'v4',
  });

export default i18n;
