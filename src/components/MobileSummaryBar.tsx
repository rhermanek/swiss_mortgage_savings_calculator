import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../lib/utils'
import { formatCHF } from '../lib/format'
import { useLanguage } from '../i18n/useLanguage'

type MobileSummaryBarProps = {
    targetId: string
    priceValid: boolean
    goalReached: boolean
    monthlySavingsTarget: number
    progress: number
}

// Below lg the result card sits after the inputs; this bar keeps the headline
// number visible while editing and hides itself once the card is on screen.
export function MobileSummaryBar({ targetId, priceValid, goalReached, monthlySavingsTarget, progress }: MobileSummaryBarProps) {
    const { t } = useLanguage()
    const [targetVisible, setTargetVisible] = useState(false)

    useEffect(() => {
        const el = document.getElementById(targetId)
        if (!el || typeof IntersectionObserver === 'undefined') return
        const observer = new IntersectionObserver(([entry]) => setTargetVisible(entry.isIntersecting), { threshold: 0.15 })
        observer.observe(el)
        return () => observer.disconnect()
    }, [targetId])

    if (!priceValid) return null

    const monthly = Number.isFinite(monthlySavingsTarget) ? formatCHF(Math.ceil(monthlySavingsTarget), { decimals: 0 }) : '—'

    return (
        <div
            aria-hidden={targetVisible || undefined}
            className={cn(
                'fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md transition-transform duration-300 lg:hidden',
                targetVisible && 'pointer-events-none translate-y-full',
            )}
        >
            <a
                href={`#${targetId}`}
                tabIndex={targetVisible ? -1 : undefined}
                className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6"
            >
                <div className="min-w-0 flex-1">
                    <p className="text-xs text-fg-muted">{goalReached ? t('app.result_title') : t('app.summary_rec_savings')}</p>
                    <p className="truncate text-lg font-semibold tracking-tight text-fg">
                        {goalReached ? t('app.hero_goal_reached') : <>{monthly} <span className="text-sm font-normal text-fg-muted">{t('app.per_month')}</span></>}
                    </p>
                </div>
                <div className="w-24 shrink-0">
                    <p className="text-right text-xs tabular-nums text-fg-muted">{t('app.progress_of_goal', { pct: Math.round(progress * 100) })}</p>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-chart-track">
                        <div className="h-full rounded-full bg-fg transition-[width] duration-500" style={{ width: `${Math.round(progress * 100)}%` }} />
                    </div>
                </div>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-subtle text-fg-secondary">
                    <ChevronDown aria-hidden="true" className="size-4" />
                </span>
            </a>
        </div>
    )
}
