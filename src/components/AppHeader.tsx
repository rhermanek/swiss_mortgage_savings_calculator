import { Printer, Wand2 } from 'lucide-react'
import logoUrl from '../assets/logo.png'
import { useLanguage } from '../i18n/useLanguage'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ThemeToggle } from './ThemeToggle'
import { Button } from './ui'

// Page frame: beam, brand line, then the header with its accent rule. There is
// no global top bar; the title states the result as a claim.
export function AppHeader({
    claim,
    onOpenWizard,
    onPrint,
}: {
    claim: string
    onOpenWizard: () => void
    onPrint: () => void
}) {
    const { t } = useLanguage()

    return (
        <>
            <div aria-hidden="true" className="beam" />
            <header className="mx-auto w-full max-w-[1280px] px-4 pt-6 sm:px-8">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <img src={logoUrl} alt="" width={28} height={28} className="size-7 shrink-0" />
                        <span aria-hidden="true" className="h-4 w-px shrink-0 bg-border-strong" />
                        <span className="t-small truncate font-medium text-fg-secondary">{t('app.page_kind')}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <Button variant="outline" onClick={onOpenWizard} aria-label={t('app.btn_wizard')} className="max-sm:size-8 max-sm:px-0">
                            <Wand2 aria-hidden="true" />
                            <span className="hidden sm:inline">{t('app.btn_wizard')}</span>
                        </Button>
                        <LanguageSwitcher />
                        <ThemeToggle />
                    </div>
                </div>

                <div className="mt-7 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
                    <div className="accent-rule min-w-0">
                        <p className="t-kicker">{t('app.title')}</p>
                        <h1 className="t-page-title mt-1 text-fg">{claim}</h1>
                        <p className="mt-1.5 text-fg-muted">{t('app.tagline')}</p>
                    </div>
                    <Button variant="primary" onClick={onPrint}>
                        <Printer aria-hidden="true" />
                        {t('print.btn_open')}
                    </Button>
                </div>
            </header>
        </>
    )
}
