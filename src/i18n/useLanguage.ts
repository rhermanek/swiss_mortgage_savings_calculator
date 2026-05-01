import { createContext, useContext } from 'react';
import type { Language } from './translations';

export type LanguageContextType = {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
};

export const LanguageContext = createContext<LanguageContextType | null>(null);

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
