import { useLanguage } from '../i18n/useLanguage';
import type { Language } from '../i18n/translations';
import { SegmentedControl } from './ui';

export function LanguageSwitcher() {
    const { language, setLanguage, t } = useLanguage();

    return (
        <SegmentedControl<Language>
            size="sm"
            ariaLabel={t('app.language_label')}
            value={language}
            onChange={setLanguage}
            options={[
                { value: 'de', label: 'DE', ariaLabel: 'Deutsch' },
                { value: 'en', label: 'EN', ariaLabel: 'English' },
            ]}
        />
    );
}
