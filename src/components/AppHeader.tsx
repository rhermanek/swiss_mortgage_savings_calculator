import { Wand2 } from 'lucide-react'
import logoUrl from '../assets/logo.png'
import { useLanguage } from '../i18n/useLanguage'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ThemeToggle } from './ThemeToggle'
import { Button } from './ui'

export function AppHeader({ onOpenWizard }: { onOpenWizard: () => void }) {
    const { t } = useLanguage()

    return (
        <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
            <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
                <div className="flex min-w-0 items-center gap-2.5">
                    <img src={logoUrl} alt="" width={32} height={32} className="size-8 shrink-0" />
                    <div className="min-w-0 leading-tight">
                        <h1 className="truncate text-[15px] font-semibold tracking-tight text-fg">{t('app.title')}</h1>
                        <p className="hidden truncate text-xs text-fg-muted sm:block">{t('app.tagline')}</p>
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                    <Button variant="secondary" size="sm" onClick={onOpenWizard} aria-label={t('app.btn_wizard')} className="max-sm:size-8 max-sm:px-0">
                        <Wand2 aria-hidden="true" />
                        <span className="hidden sm:inline">{t('app.btn_wizard')}</span>
                    </Button>
                    <LanguageSwitcher />
                    <ThemeToggle />
                </div>
            </div>
        </header>
    )
}
