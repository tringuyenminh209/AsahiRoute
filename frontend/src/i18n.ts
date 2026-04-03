import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ja from './locales/ja.json';
import en from './locales/en.json';
import vi from './locales/vi.json';
import zh from './locales/zh.json';
import ko from './locales/ko.json';
import ne from './locales/ne.json';

const storedLang = localStorage.getItem('asahiroute-language') ?? 'ja';

i18n
  .use(initReactI18next)
  .init({
    resources: { ja: { translation: ja }, en: { translation: en }, vi: { translation: vi }, zh: { translation: zh }, ko: { translation: ko }, ne: { translation: ne } },
    lng: storedLang,
    fallbackLng: 'ja',
    interpolation: { escapeValue: false },
  });

export default i18n;
