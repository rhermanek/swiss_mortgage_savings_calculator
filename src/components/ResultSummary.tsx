import { AlertTriangle, ArrowDownRight, Check, CheckCircle2, CircleAlert, CircleDashed } from 'lucide-react'
import { cn } from '../lib/utils'
import { formatCHF, formatNumber } from '../lib/format'
import { useLanguage } from '../i18n/useLanguage'
import { Callout, Card, InfoPopover, Swatch } from './ui'

export type RuleStatus = 'pass' | 'fail' | 'pending'

type Amounts = { liquid: number; s3a: number; pk: number }

type ResultSummaryProps = {
    priceValid: boolean
    goalReached: boolean
    monthlySavingsTarget: number
    invalidDate: boolean
    targetDateLabel: string
    equityPct: number
    hardPct: number
    softPct: number
    totalRequired: number
    hardRequired: number
    usableTotal: number
    hardTotal: number
    progress: number
    amounts: Amounts
    segments: Amounts & { gap: number }
    todayTotal: number
    hardShortfall: number
    showHardWarning: boolean
    pkOverflow: number
    affordability: { status: RuleStatus; ratio: number; maxRatio: number }
    persons: { p1: number; p2: number } | null
}

const chf0 = (n: number) => formatCHF(n, { decimals: 0 })
const num0 = (n: number) => formatNumber(Math.round(n), 0)

export function ResultSummary(props: ResultSummaryProps) {
    const { t } = useLanguage()
    const {
        priceValid, goalReached, monthlySavingsTarget, invalidDate, targetDateLabel,
        equityPct, hardPct, softPct, totalRequired, hardRequired, usableTotal, hardTotal,
        progress, amounts, segments, todayTotal, hardShortfall, showHardWarning, pkOverflow,
        affordability, persons,
    } = props

    const progressPct = Math.round(progress * 100)
    // Round up: rounding down would leave the plan a few francs short.
    const monthly = Number.isFinite(monthlySavingsTarget) ? Math.ceil(monthlySavingsTarget) : NaN

    return (
        <Card id="ergebnis" aria-labelledby="result-title">
            <div className="px-5 pt-5 sm:px-6 sm:pt-6">
                <h2 id="result-title" className="sr-only">
                    {t('app.result_title')}
                </h2>

                {!priceValid ? (
                    <div>
                        <p className="text-5xl font-semibold tracking-tight text-fg-muted/40">—</p>
                        <p className="mt-2 text-sm text-fg-muted">{t('app.hero_no_price')}</p>
                    </div>
                ) : goalReached ? (
                    <div className="flex items-start gap-3">
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
                            <Check aria-hidden="true" className="size-5" />
                        </span>
                        <div>
                            <p className="text-2xl font-semibold tracking-tight text-fg">{t('app.hero_goal_reached')}</p>
                            <p className="mt-1 text-sm text-fg-muted">{t('app.hero_goal_reached_desc', { date: targetDateLabel })}</p>
                        </div>
                    </div>
                ) : (
                    <div>
                        <p className="text-sm font-medium text-fg-secondary">{t('app.summary_rec_savings')}</p>
                        <p className="mt-1 flex flex-wrap items-baseline gap-x-1.5">
                            <span className="text-2xl font-semibold text-fg-muted">CHF</span>
                            <span className="text-5xl font-semibold tracking-tight text-fg">
                                {Number.isFinite(monthly) ? num0(monthly) : '—'}
                            </span>
                            <span className="text-base text-fg-muted">{t('app.per_month')}</span>
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-fg-muted">
                            {t('app.hero_subtitle', { date: targetDateLabel, pct: equityPct, amount: chf0(totalRequired) })}
                        </p>
                        {invalidDate && (
                            <Callout tone="warning" icon={<AlertTriangle />} className="mt-3">
                                {t('app.summary_error_date')}
                            </Callout>
                        )}
                    </div>
                )}
            </div>

            {priceValid && (
                <div className="space-y-6 px-5 pb-5 pt-6 sm:px-6 sm:pb-6">
                    <EquityProgress
                        progressPct={progressPct}
                        usableTotal={usableTotal}
                        totalRequired={totalRequired}
                        hardRequired={hardRequired}
                        hardPct={hardPct}
                        amounts={amounts}
                        segments={segments}
                        todayTotal={todayTotal}
                    />

                    <div>
                        <div className="mb-2 flex items-center gap-1">
                            <h3 className="text-sm font-medium text-fg">{t('app.checks_title')}</h3>
                            <InfoPopover label={t('app.info_rules_title')}>
                                <RulesContent />
                            </InfoPopover>
                        </div>
                        <ul className="divide-y divide-border rounded-xl border border-border">
                            <CheckRow
                                status={usableTotal >= totalRequired ? 'pass' : 'fail'}
                                label={t('app.check_total', { pct: equityPct })}
                                value={`${num0(usableTotal)} / ${num0(totalRequired)}`}
                            />
                            <CheckRow
                                status={hardTotal >= hardRequired ? 'pass' : 'fail'}
                                label={t('app.check_hard', { pct: hardPct })}
                                value={`${num0(hardTotal)} / ${num0(hardRequired)}`}
                            />
                            <CheckRow
                                status={affordability.status}
                                label={t('app.check_affordability', { pct: Math.round(affordability.maxRatio * 100) })}
                                value={
                                    <a href="#tragbarkeit" className="inline-flex items-center gap-0.5 rounded underline-offset-2 hover:text-fg hover:underline">
                                        {affordability.status === 'pending'
                                            ? t('app.check_income_missing')
                                            : `${Math.round(affordability.ratio * 100)} %`}
                                        <ArrowDownRight aria-hidden="true" className="size-3.5" />
                                    </a>
                                }
                            />
                        </ul>
                    </div>

                    {showHardWarning && (
                        <Callout tone="warning" icon={<AlertTriangle />} title={t('app.warning_hard_title')}>
                            {t('app.warning_hard_desc', { amount: chf0(hardShortfall) })}
                        </Callout>
                    )}

                    {pkOverflow > 0 && (
                        <p className="text-xs leading-relaxed text-fg-muted">
                            {t('app.pk_overflow', { amount: chf0(pkOverflow), pct: softPct })}
                        </p>
                    )}

                    {persons && (
                        <dl className="grid grid-cols-2 gap-2">
                            <PersonTile label={t('app.person1_section')} value={chf0(persons.p1)} />
                            <PersonTile label={t('app.person2_section')} value={chf0(persons.p2)} />
                        </dl>
                    )}
                </div>
            )}
        </Card>
    )
}

function EquityProgress({
    progressPct,
    usableTotal,
    totalRequired,
    hardRequired,
    hardPct,
    amounts,
    segments,
    todayTotal,
}: {
    progressPct: number
    usableTotal: number
    totalRequired: number
    hardRequired: number
    hardPct: number
    amounts: Amounts
    segments: Amounts & { gap: number }
    todayTotal: number
}) {
    const { t } = useLanguage()
    const pctOf = (n: number) => (totalRequired > 0 ? Math.min(100, Math.max(0, (n / totalRequired) * 100)) : 0)
    const todayPct = pctOf(todayTotal)
    const hardMarkerPct = pctOf(hardRequired)

    const bar = [
        { key: 'liquid', value: segments.liquid, className: 'bg-chart-blue' },
        { key: 's3a', value: segments.s3a, className: 'bg-chart-aqua' },
        { key: 'pk', value: segments.pk, className: 'bg-chart-orange' },
        { key: 'gap', value: segments.gap, className: 'bg-chart-track' },
    ].filter((s) => s.value > 0)

    const legend = [
        { key: 'liquid', label: t('charts.label_liquid'), value: amounts.liquid, swatch: 'bg-chart-blue' },
        { key: 's3a', label: t('charts.label_3a'), value: amounts.s3a, swatch: 'bg-chart-aqua' },
        { key: 'pk', label: t('charts.label_pk'), value: amounts.pk, swatch: 'bg-chart-orange' },
        { key: 'gap', label: t('charts.label_gap'), value: segments.gap, swatch: 'bg-chart-track ring-1 ring-inset ring-border' },
    ]

    const ariaLabel = [
        t('app.progress_of_goal', { pct: progressPct }),
        ...legend.map((l) => `${l.label} ${chf0(l.value)}`),
    ].join(', ')

    return (
        <div>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
                <span className="font-medium text-fg">{t('app.progress_of_goal', { pct: progressPct })}</span>
                <span className="tabular-nums text-fg-muted">
                    {chf0(usableTotal)} / {num0(totalRequired)}
                </span>
            </div>

            <div className="relative mt-3">
                <div role="img" aria-label={ariaLabel} className="flex h-3 w-full gap-[2px]">
                    {bar.map((s) => (
                        <div
                            key={s.key}
                            className={cn('h-full first:rounded-l-full last:rounded-r-full transition-[flex-grow] duration-500 ease-out', s.className)}
                            style={{ flexGrow: s.value, flexBasis: 0 }}
                        />
                    ))}
                </div>
                {hardMarkerPct > 0 && hardMarkerPct < 100 && (
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -inset-y-1 border-l-2 border-dotted border-fg-secondary"
                        style={{ left: `calc(${hardMarkerPct}% - 1px)` }}
                    />
                )}
                {todayPct > 0 && todayPct < 100 && (
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -inset-y-1 w-0.5 rounded-full bg-fg ring-2 ring-surface"
                        style={{ left: `calc(${todayPct}% - 1px)` }}
                    />
                )}
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-2 text-xs">
                {legend.map((l) => (
                    <div key={l.key} className="flex min-w-0 items-center gap-2">
                        <Swatch className={l.swatch} />
                        <dt className="truncate text-fg-secondary">{l.label}</dt>
                        <dd className="ml-auto whitespace-nowrap font-medium tabular-nums text-fg">{num0(l.value)}</dd>
                    </div>
                ))}
            </dl>
            <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-border pt-3 text-xs">
                <div className="flex items-center gap-2">
                    <span aria-hidden="true" className="h-3 w-0.5 shrink-0 rounded-full bg-fg" />
                    <dt className="text-fg-secondary">{t('app.progress_today')}</dt>
                    <dd className="whitespace-nowrap font-medium tabular-nums text-fg">{num0(todayTotal)}</dd>
                </div>
                <div className="flex items-center gap-2">
                    <span aria-hidden="true" className="h-3 shrink-0 border-l-2 border-dotted border-fg-secondary" />
                    <dt className="text-fg-secondary">{t('app.progress_marker_hard', { pct: hardPct })}</dt>
                    <dd className="whitespace-nowrap font-medium tabular-nums text-fg">{num0(hardRequired)}</dd>
                </div>
            </dl>
        </div>
    )
}

function CheckRow({ status, label, value }: { status: RuleStatus; label: string; value: React.ReactNode }) {
    const { t } = useLanguage()
    const icon =
        status === 'pass' ? (
            <CheckCircle2 className="size-4 text-success" />
        ) : status === 'fail' ? (
            <CircleAlert className="size-4 text-warning" />
        ) : (
            <CircleDashed className="size-4 text-fg-muted" />
        )
    const statusText =
        status === 'pass' ? t('app.check_status_pass') : status === 'fail' ? t('app.check_status_fail') : t('app.check_status_pending')

    return (
        <li className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm">
            <span aria-hidden="true" className="shrink-0">{icon}</span>
            <span className="min-w-0 flex-1 text-fg">
                {label}
                <span className="sr-only">: {statusText}</span>
            </span>
            <span className="shrink-0 whitespace-nowrap text-right text-xs tabular-nums text-fg-secondary">{value}</span>
        </li>
    )
}

function PersonTile({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl bg-subtle px-3 py-2.5">
            <dt className="text-xs text-fg-muted">{label}</dt>
            <dd className="mt-0.5 text-sm font-semibold tabular-nums text-fg">{value}</dd>
        </div>
    )
}

function RulesContent() {
    const { t } = useLanguage()
    const rules = [
        [t('app.info_rules_20pct'), t('app.info_rules_20pct_desc')],
        [t('app.info_rules_10pct'), t('app.info_rules_10pct_desc')],
        [t('app.info_rules_soft'), t('app.info_rules_soft_desc')],
    ]
    return (
        <>
            <p className="mb-3 font-semibold text-fg">{t('app.info_rules_title')}</p>
            <dl className="space-y-3 text-xs leading-relaxed">
                {rules.map(([title, desc]) => (
                    <div key={title}>
                        <dt className="font-medium text-fg">{title}</dt>
                        <dd className="mt-0.5">{desc}</dd>
                    </div>
                ))}
            </dl>
        </>
    )
}
