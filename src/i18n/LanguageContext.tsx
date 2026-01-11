import { createContext, useContext, useEffect, useState } from 'react';
import { translations, type Language } from './translations';

type LanguageContextType = {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>(() => {
        const stored = localStorage.getItem('language');
        // Validate stored language
        if (stored === 'de' || stored === 'en') return stored;
        // Default to German
        return 'de';
    });

    useEffect(() => {
        localStorage.setItem('language', language);
    }, [language]);

    const t = (path: string, params?: Record<string, string | number>): string => {
        const keys = path.split('.');
        let result: any = translations[language];

        for (const k of keys) {
            if (result && typeof result === 'object' && k in result) {
                result = result[k as keyof typeof result];
            } else {
                console.warn(`Missing translation for key: ${path} in language: ${language}`);
                return path;
            }
        }

        if (typeof result !== 'string') {
            return path;
        }

        let text = result;
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                text = text.replace(`{${key}}`, String(value));
            });
        }

        return text;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
