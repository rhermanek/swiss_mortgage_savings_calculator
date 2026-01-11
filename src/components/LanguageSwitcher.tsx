import { Languages } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage();

    const toggleLanguage = () => {
        setLanguage(language === 'de' ? 'en' : 'de');
    };

    return (
        <button
            onClick={toggleLanguage}
            className="inline-flex items-center justify-center rounded-md p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 dark:focus-visible:ring-slate-300"
            aria-label="Toggle language"
            title={language === 'de' ? 'Switch to English' : 'Auf Deutsch wechseln'}
        >
            <Languages className="h-[1.2rem] w-[1.2rem] text-slate-900 dark:text-slate-400" />
            <span className="ml-2 text-sm font-medium text-slate-700 dark:text-slate-300 w-6 text-center">
                {language.toUpperCase()}
            </span>
        </button>
    );
}
