import { createContext, useContext, useState, ReactNode } from 'react';
import i18n from '../../i18n';

export type Language = 'ja' | 'en' | 'vi' | 'zh' | 'ko' | 'ne';

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}

export const languages: LanguageOption[] = [
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', flag: '🇳🇵' },
];

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (lang: Language) => void;
  getCurrentLanguageOption: () => LanguageOption;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('ja');

  const setLanguage = (lang: Language) => {
    setCurrentLanguage(lang);
    localStorage.setItem('asahiroute-language', lang);
    i18n.changeLanguage(lang);
  };

  const getCurrentLanguageOption = () => {
    return languages.find(l => l.code === currentLanguage) || languages[0];
  };

  // Load language from localStorage on mount
  useState(() => {
    const stored = localStorage.getItem('asahiroute-language') as Language;
    if (stored && languages.find(l => l.code === stored)) {
      setCurrentLanguage(stored);
    }
  });

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage, getCurrentLanguageOption }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
