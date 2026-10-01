import { Check, Scale, X } from 'lucide-react'
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
                            {passes ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}
                            {passes ? t('app.tragbarkeit_pass') : t('app.tragbarkeit_fail')}
                        </Badge>
                    ) : undefined
                }
            />
            <CardBody className="space-y-6">
                {!hasData ? (
                    <div className="flex flex-col items-center rounded-xl border border-dashed border-border px-6 py-8 text-center">
                        <span className="flex size-10 items-center justify-center rounded-full bg-subtle text-fg-muted">
                            <Scale aria-hidden="true" className="size-5" />
                        </span>
                        <p className="mt-3 max-w-xs text-sm text-fg-muted">{t('app.tragbarkeit_no_income')}</p>
                        <a
                            href="#bruttoeinkommen"
                            className="mt-3 text-sm font-medium text-fg underline underline-offset-4 hover:no-underline"
                        >
                            {t('app.tragbarkeit_enter_income')}
                        </a>
                    </div>
                ) : (
                    <>
                        <div>
                            <div className="flex items-end justify-between gap-3">
                                <div>
                                    <p className="text-sm text-fg-muted">{t('app.tragbarkeit_ratio_label')}</p>
                                    <p className="mt-0.5 text-4xl font-semibold tracking-tight text-fg">
                                        {Math.round(ratio * 100)} %
                                    </p>
                                </div>
                                <p className="pb-1 text-sm text-fg-muted">{t('app.tragbarkeit_threshold', { pct: limitPct })}</p>
                            </div>
                            <div className="relative mt-4">
                                <div
                                    role="meter"
                                    aria-label={t('app.tragbarkeit_ratio_label')}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-valuenow={Math.round(ratio * 100)}
                                    aria-valuetext={`${Math.round(ratio * 100)} %`}
                                    className="h-2.5 w-full overflow-hidden rounded-full bg-chart-track"
                                >
                                    <div
                                        className={cn(
                                            'h-full rounded-full transition-[width] duration-500 ease-out',
                                            passes ? 'bg-status-good' : 'bg-status-warning',
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
                            <div aria-hidden="true" className="relative mt-2 h-4 text-[11px] tabular-nums text-fg-muted">
                                <span className="absolute left-0">0 %</span>
                                <span className="absolute -translate-x-1/2 font-medium text-fg-secondary" style={{ left: `${(maxRatio / METER_MAX) * 100}%` }}>
                                    {limitPct} %
                                </span>
                                <span className="absolute right-0">{Math.round(METER_MAX * 100)} %+</span>
                            </div>
                        </div>

                        <div>
                            <h3 className="mb-2 text-sm font-medium text-fg">{t('app.tragbarkeit_breakdown_label')}</h3>
                            <dl className="divide-y divide-border overflow-hidden rounded-xl border border-border text-sm">
                                <Row label={t('app.tragbarkeit_breakdown_interest')} value={chf0(annualInterest)} />
                                <Row label={t('app.tragbarkeit_breakdown_amortization')} value={chf0(annualAmortization)} />
                                <Row label={t('app.tragbarkeit_breakdown_maintenance')} value={chf0(annualMaintenance)} />
                                <Row label={t('app.tragbarkeit_breakdown_total')} value={chf0(annualHousingCost)} strong />
                            </dl>
                            <dl className="mt-3 space-y-1.5 px-1 text-xs text-fg-muted">
                                <div className="flex justify-between gap-3">
                                    <dt>{t('app.tragbarkeit_mortgage', { pct: mortgagePct })}</dt>
                                    <dd className="tabular-nums text-fg-secondary">{chf0(mortgageAmount)}</dd>
                                </div>
                                <div className="flex justify-between gap-3">
                                    <dt>{t('app.tragbarkeit_income')}</dt>
                                    <dd className="tabular-nums text-fg-secondary">{chf0(totalIncome)}</dd>
                                </div>
                                <div className={cn('flex justify-between gap-3', !passes && 'font-medium text-warning')}>
                                    <dt>{t('app.tragbarkeit_required_income')}</dt>
                                    <dd className={cn('tabular-nums', passes ? 'text-fg-secondary' : 'text-warning')}>{chf0(requiredIncome)}</dd>
                                </div>
                            </dl>
                        </div>

                        <Disclosure summary={t('app.tragbarkeit_assumptions_title')}>
                            <p className="text-xs leading-relaxed text-fg-muted">{t('app.tragbarkeit_assumptions_desc')}</p>
                        </Disclosure>
                    </>
                )}
            </CardBody>
        </Card>
    )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
    return (
        <div className={cn('flex items-center justify-between gap-3 px-3.5 py-2.5', strong && 'bg-subtle font-semibold text-fg')}>
            <dt className={strong ? undefined : 'text-fg-secondary'}>{label}</dt>
            <dd className="whitespace-nowrap tabular-nums text-fg">{value}</dd>
        </div>
    )
}
