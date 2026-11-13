import { AlertTriangle, ArrowDownRight, Check, Printer } from 'lucide-react'
import { cn } from '../lib/utils'
import { formatCHF, formatNumber } from '../lib/format'
import { useLanguage } from '../i18n/useLanguage'
import { Badge, Button, Callout, Card, InfoPopover, Swatch } from './ui'

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
    onPrint: () => void
}

const chf0 = (n: number) => formatCHF(n, { decimals: 0 })
const num0 = (n: number) => formatNumber(Math.round(n), 0)

export function ResultSummary(props: ResultSummaryProps) {
    const { t } = useLanguage()
    const {
        priceValid, goalReached, monthlySavingsTarget, invalidDate, targetDateLabel,
        equityPct, hardPct, softPct, totalRequired, hardRequired, usableTotal, hardTotal,
        progress, amounts, segments, todayTotal, hardShortfall, showHardWarning, pkOverflow,
        affordability, persons, onPrint,
    } = props

    const progressPct = Math.round(progress * 100)
    // Round up: rounding down would leave the plan a few francs short.
    const monthly = Number.isFinite(monthlySavingsTarget) ? Math.ceil(monthlySavingsTarget) : NaN

    return (
        <Card id="ergebnis" aria-labelledby="result-title">
            <div className="px-5 pt-[18px]">
                <h3 id="result-title" className="sr-only">
                    {t('app.result_title')}
                </h3>

                {!priceValid ? (
                    <div className="pb-5">
                        <p className="t-kpi text-fg-ghost">—</p>
                        <p className="t-small mt-1.5 text-fg-muted">{t('app.hero_no_price')}</p>
                    </div>
                ) : goalReached ? (
                    <div>
                        <Badge tone="success">
                            <Check aria-hidden="true" />
                            {t('app.hero_goal_reached')}
                        </Badge>
                        <p className="t-kpi mt-2.5 text-fg">
                            {chf0(0)} <span className="t-small font-normal tracking-normal text-fg-muted">{t('app.per_month')}</span>
                        </p>
                        <p className="t-caption mt-1.5 text-fg-muted">{t('app.hero_goal_reached_desc', { date: targetDateLabel })}</p>
                    </div>
                ) : (
                    <div>
                        <p className="t-caption text-fg-muted">{t('app.summary_rec_savings')}</p>
                        <p className="t-kpi mt-1 text-fg">
                            {Number.isFinite(monthly) ? chf0(monthly) : '—'}{' '}
                            <span className="t-small font-normal tracking-normal text-fg-muted">{t('app.per_month')}</span>
                        </p>
                        <p className="t-caption mt-1.5 text-fg-muted">
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
                <div className="space-y-5 px-5 pb-5 pt-5">
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

                    <div className="border-t border-border pt-4">
                        <div className="flex items-center gap-0.5">
                            <h4 className="t-small font-semibold text-fg">{t('app.checks_title')}</h4>
                            <InfoPopover label={t('app.info_rules_title')}>
                                <RulesContent />
                            </InfoPopover>
                        </div>
                        <ul className="mt-1 divide-y divide-border">
                            <CheckRow
                                status={usableTotal >= totalRequired ? 'pass' : 'fail'}
                                label={t('app.check_total', { pct: equityPct })}
                                value={`${chf0(usableTotal)} / ${num0(totalRequired)}`}
                            />
                            <CheckRow
                                status={hardTotal >= hardRequired ? 'pass' : 'fail'}
                                label={t('app.check_hard', { pct: hardPct })}
                                value={`${chf0(hardTotal)} / ${num0(hardRequired)}`}
                            />
                            <CheckRow
                                status={affordability.status}
                                label={t('app.check_affordability', { pct: Math.round(affordability.maxRatio * 100) })}
                                value={
                                    <a href="#tragbarkeit" className="inline-flex items-center gap-0.5 rounded-control text-accent hover:underline hover:underline-offset-2">
                                        {affordability.status === 'pending'
                                            ? t('app.tragbarkeit_enter_income')
                                            : t('app.check_affordability_value', { pct: Math.round(affordability.ratio * 100) })}
                                        <ArrowDownRight aria-hidden="true" className="size-3" />
                                    </a>
                                }
                            />
                        </ul>
                    </div>

                    {showHardWarning && (
                        <Callout tone="warning" icon={<AlertTriangle />} title={t('app.warning_hard_title', { pct: hardPct })}>
                            {t('app.warning_hard_desc', { amount: chf0(hardShortfall) })}
                        </Callout>
                    )}

                    {pkOverflow > 0 && (
                        <p className="t-caption text-fg-muted">
                            {t('app.pk_overflow', { amount: chf0(pkOverflow), pct: softPct })}
                        </p>
                    )}

                    {persons && (
                        <dl className="grid grid-cols-2 gap-2">
                            <PersonTile label={t('app.person1_section')} value={chf0(persons.p1)} />
                            <PersonTile label={t('app.person2_section')} value={chf0(persons.p2)} />
                        </dl>
                    )}

                    <Button variant="outline" className="w-full" onClick={onPrint}>
                        <Printer aria-hidden="true" />
                        {t('print.btn_open')}
                    </Button>
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
        { key: 'liquid', value: segments.liquid, className: 'bg-series-1' },
        { key: 's3a', value: segments.s3a, className: 'bg-series-2' },
        { key: 'pk', value: segments.pk, className: 'bg-series-3' },
        { key: 'gap', value: segments.gap, className: 'bg-context' },
    ].filter((s) => s.value > 0)

    const legend = [
        { key: 'liquid', label: t('charts.label_liquid'), value: amounts.liquid, swatch: 'bg-series-1' },
        { key: 's3a', label: t('charts.label_3a'), value: amounts.s3a, swatch: 'bg-series-2' },
        { key: 'pk', label: t('charts.label_pk'), value: amounts.pk, swatch: 'bg-series-3' },
        { key: 'gap', label: t('charts.label_gap'), value: segments.gap, swatch: 'bg-context' },
    ]

    const ariaLabel = [
        t('app.progress_of_goal', { pct: progressPct }),
        ...legend.map((l) => `${l.label} ${chf0(l.value)}`),
    ].join(', ')

    return (
        <div>
            <div className="t-small flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <span className="font-semibold text-fg">{t('app.progress_of_goal', { pct: progressPct })}</span>
                <span className="t-caption tabular-nums text-fg-muted">
                    {chf0(usableTotal)} / {num0(totalRequired)}
                </span>
            </div>

            <div className="relative mt-2.5">
                <div role="img" aria-label={ariaLabel} className="flex h-2 w-full gap-[2px]">
                    {bar.map((s) => (
                        <div
                            key={s.key}
                            className={cn('h-full first:rounded-l-full last:rounded-r-full transition-[flex-grow] duration-200 ease-out', s.className)}
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

            <dl className="t-caption mt-3.5 grid grid-cols-2 gap-x-5 gap-y-1.5">
                {legend.map((l) => (
                    <div key={l.key} className="flex min-w-0 items-center gap-2">
                        <Swatch className={l.swatch} />
                        <dt className="truncate text-fg-muted">{l.label}</dt>
                        <dd className="ml-auto whitespace-nowrap font-medium tabular-nums text-fg">{num0(l.value)}</dd>
                    </div>
                ))}
            </dl>
            <dl className="t-caption mt-2.5 flex flex-wrap gap-x-5 gap-y-1.5">
                <div className="flex items-center gap-2">
                    <span aria-hidden="true" className="h-3 w-0.5 shrink-0 rounded-full bg-fg" />
                    <dt className="text-fg-muted">{t('app.progress_today')}</dt>
                    <dd className="whitespace-nowrap font-medium tabular-nums text-fg">{num0(todayTotal)}</dd>
                </div>
                <div className="flex items-center gap-2">
                    <span aria-hidden="true" className="h-3 shrink-0 border-l-2 border-dotted border-fg-secondary" />
                    <dt className="text-fg-muted">{t('app.progress_marker_hard', { pct: hardPct })}</dt>
                    <dd className="whitespace-nowrap font-medium tabular-nums text-fg">{num0(hardRequired)}</dd>
                </div>
            </dl>
        </div>
    )
}

export function StatusPill({ status }: { status: RuleStatus }) {
    const { t } = useLanguage()
    if (status === 'pass') {
        return (
            <Badge tone="success">
                <Check aria-hidden="true" />
                {t('app.check_status_pass')}
            </Badge>
        )
    }
    if (status === 'fail') {
        return (
            <Badge tone="warning">
                <AlertTriangle aria-hidden="true" />
                {t('app.check_status_fail')}
            </Badge>
        )
    }
    return <Badge>{t('app.check_status_pending')}</Badge>
}

function CheckRow({ status, label, value }: { status: RuleStatus; label: string; value: React.ReactNode }) {
    return (
        <li className="flex items-center gap-3 py-2.5">
            <div className="min-w-0 flex-1">
                <p className="t-small text-fg">{label}</p>
                <p className="t-caption tabular-nums text-fg-muted">{value}</p>
            </div>
            <StatusPill status={status} />
        </li>
    )
}

function PersonTile({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-item bg-subtle px-3.5 py-2.5">
            <dt className="t-caption text-fg-muted">{label}</dt>
            <dd className="t-small mt-0.5 font-semibold tabular-nums text-fg">{value}</dd>
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
            <p className="t-card-title mb-3 text-fg">{t('app.info_rules_title')}</p>
            <dl className="t-caption space-y-3">
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
