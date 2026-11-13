import { AlertTriangle, Check } from 'lucide-react'
import { cn } from '../lib/utils'
import { formatCHF } from '../lib/format'
import { useLanguage } from '../i18n/useLanguage'
import { Badge, Card, CardBody, CardHeader, Disclosure } from './ui'

type AffordabilityCardProps = {
    priceValid: boolean
    totalIncome: number
    ratio: number
    passes: boolean
    maxRatio: number
    mortgageAmount: number
    mortgagePct: number
    annualInterest: number
    annualAmortization: number
    annualMaintenance: number
    annualHousingCost: number
    requiredIncome: number
}

const chf0 = (n: number) => formatCHF(n, { decimals: 0 })

// Meter spans 0–50 % so the 33 % limit sits in the readable middle of the bar.
const METER_MAX = 0.5

export function AffordabilityCard(props: AffordabilityCardProps) {
    const { t } = useLanguage()
    const {
        priceValid, totalIncome, ratio, passes, maxRatio, mortgageAmount, mortgagePct,
        annualInterest, annualAmortization, annualMaintenance, annualHousingCost, requiredIncome,
    } = props
    const hasData = priceValid && totalIncome > 0
    const limitPct = Math.round(maxRatio * 100)

    return (
        <Card id="tragbarkeit" aria-labelledby="tragbarkeit-title">
            <CardHeader
                id="tragbarkeit-title"
                title={t('app.card_tragbarkeit_title')}
                description={t('app.card_tragbarkeit_desc')}
                action={
                    hasData ? (
                        <Badge tone={passes ? 'success' : 'warning'}>
                            {passes ? <Check aria-hidden="true" /> : <AlertTriangle aria-hidden="true" />}
                            {passes ? t('app.tragbarkeit_pass') : t('app.tragbarkeit_fail')}
                        </Badge>
                    ) : undefined
                }
            />
            <CardBody className="space-y-5">
                {!hasData ? (
                    <div className="rounded-item bg-subtle px-5 py-6 text-center">
                        <p className="t-small mx-auto max-w-xs text-fg-muted">{t('app.tragbarkeit_no_income')}</p>
                        <a
                            href="#bruttoeinkommen"
                            className="t-small mt-2 inline-block rounded-control font-medium text-accent hover:underline hover:underline-offset-2"
                        >
                            {t('app.tragbarkeit_enter_income')}
                        </a>
                    </div>
                ) : (
                    <>
                        <div>
                            <p className="t-caption text-fg-muted">{t('app.tragbarkeit_ratio_label')}</p>
                            <p className="t-kpi mt-1 text-fg">
                                {Math.round(ratio * 100)}%{' '}
                                <span className="t-small font-normal tracking-normal text-fg-muted">
                                    {t('app.tragbarkeit_threshold', { pct: limitPct })}
                                </span>
                            </p>
                            <div className="relative mt-3">
                                <div
                                    role="meter"
                                    aria-label={t('app.tragbarkeit_ratio_label')}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-valuenow={Math.round(ratio * 100)}
                                    aria-valuetext={`${Math.round(ratio * 100)}%`}
                                    className="h-1.5 w-full overflow-hidden rounded-full bg-subtle shadow-[inset_0_0_0_1px_var(--border)]"
                                >
                                    <div
                                        className={cn(
                                            'h-full rounded-full transition-[width] duration-200 ease-out',
                                            passes ? 'bg-success' : 'bg-warning',
                                        )}
                                        style={{ width: `${Math.min(100, (ratio / METER_MAX) * 100)}%` }}
                                    />
                                </div>
                                <div
                                    aria-hidden="true"
                                    className="pointer-events-none absolute -inset-y-1 w-0.5 rounded-full bg-fg ring-2 ring-surface"
                                    style={{ left: `calc(${(maxRatio / METER_MAX) * 100}% - 1px)` }}
                                />
                            </div>
                            <div aria-hidden="true" className="t-pill relative mt-2 h-4 font-medium tabular-nums text-fg-muted">
                                <span className="absolute left-0">0%</span>
                                <span className="absolute -translate-x-1/2 font-semibold text-fg-secondary" style={{ left: `${(maxRatio / METER_MAX) * 100}%` }}>
                                    {limitPct}%
                                </span>
                                <span className="absolute right-0">{Math.round(METER_MAX * 100)}%+</span>
                            </div>
                        </div>

                        <div>
                            <h4 className="t-small font-semibold text-fg">{t('app.tragbarkeit_breakdown_label')}</h4>
                            <dl className="t-small mt-1 divide-y divide-border">
                                <Row label={t('app.tragbarkeit_breakdown_interest')} value={chf0(annualInterest)} />
                                <Row label={t('app.tragbarkeit_breakdown_amortization')} value={chf0(annualAmortization)} />
                                <Row label={t('app.tragbarkeit_breakdown_maintenance')} value={chf0(annualMaintenance)} />
                                <Row label={t('app.tragbarkeit_breakdown_total')} value={chf0(annualHousingCost)} strong />
                            </dl>
                            <dl className="t-caption mt-3 space-y-1.5 rounded-item bg-subtle px-3.5 py-3 text-fg-muted">
                                <div className="flex justify-between gap-3">
                                    <dt>{t('app.tragbarkeit_mortgage', { pct: mortgagePct })}</dt>
                                    <dd className="tabular-nums text-fg">{chf0(mortgageAmount)}</dd>
                                </div>
                                <div className="flex justify-between gap-3">
                                    <dt>{t('app.tragbarkeit_income')}</dt>
                                    <dd className="tabular-nums text-fg">{chf0(totalIncome)}</dd>
                                </div>
                                <div className="flex justify-between gap-3">
                                    <dt className={cn(!passes && 'font-semibold text-warning-ink')}>{t('app.tragbarkeit_required_income')}</dt>
                                    <dd className={cn('tabular-nums', passes ? 'text-fg' : 'font-semibold text-warning-ink')}>{chf0(requiredIncome)}</dd>
                                </div>
                            </dl>
                        </div>

                        <Disclosure summary={t('app.tragbarkeit_assumptions_title')}>
                            <p className="t-caption text-fg-muted">{t('app.tragbarkeit_assumptions_desc')}</p>
                        </Disclosure>
                    </>
                )}
            </CardBody>
        </Card>
    )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
    return (
        <div className={cn('flex items-center justify-between gap-3 py-2', strong && 'font-semibold text-fg')}>
            <dt className={strong ? undefined : 'text-fg-secondary'}>{label}</dt>
            <dd className="whitespace-nowrap tabular-nums text-fg">{value}</dd>
        </div>
    )
}
