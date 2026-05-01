import { useEffect, useState } from 'react';
import { translations, type Language } from './translations';
import { LanguageContext } from './useLanguage';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>(() => {
        const stored = localStorage.getItem('language');
        if (stored === 'de' || stored === 'en') return stored;
        return 'de';
    });

    useEffect(() => {
        localStorage.setItem('language', language);
    }, [language]);

    const t = (path: string, params?: Record<string, string | number>): string => {
        const keys = path.split('.');
        let result: unknown = translations[language];

        for (const k of keys) {
            if (result && typeof result === 'object' && k in (result as Record<string, unknown>)) {
                result = (result as Record<string, unknown>)[k];
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
