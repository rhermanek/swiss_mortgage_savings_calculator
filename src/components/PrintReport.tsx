import { AlertTriangle, Check } from 'lucide-react'
import logoUrl from '../assets/logo.png'
import { cn } from '../lib/utils'
import { formatCHF, formatCompact, formatNumber } from '../lib/format'
import { projectionRowIndices, type ProjectionPoint } from '../lib/projection'
import { useLanguage } from '../i18n/useLanguage'
import type { RuleStatus } from './ResultSummary'

export type ReportPerson = {
    cash: number
    s3a: number
    pk: number
    other: number
    s3aMonthly: number
    pkMonthly: number
    otherMonthly: number
    income: number
}

export type ReportData = {
    claim: string
    priceValid: boolean
    price: number
    targetDateLabel: string
    monthsRemaining: number
    persons: ReportPerson[]
    assumptions: { equityPct: number; hardPct: number; softPct: number; rateLiquid: number; rate3a: number; ratePK: number }
    result: {
        goalReached: boolean
        monthly: number
        totalRequired: number
        hardRequired: number
        usableTotal: number
        hardTotal: number
        amounts: { liquid: number; s3a: number; pk: number }
        segments: { liquid: number; s3a: number; pk: number; gap: number }
        pkOverflow: number
    }
    affordability: {
        status: RuleStatus
        ratio: number
        maxRatio: number
        mortgageAmount: number
        mortgagePct: number
        interest: number
        amortization: number
        maintenance: number
        housingCost: number
        income: number
        requiredIncome: number
    }
    projection: ProjectionPoint[]
    targetMonthIndex: number
}

const chf0 = (n: number) => formatCHF(n, { decimals: 0 })
const num0 = (n: number) => formatNumber(Math.round(n), 0)
const pct1 = (n: number) => `${formatNumber(n, 1)}%`

const SERIES = [
    { key: 'liquid', color: 'var(--series-1)', label: 'charts.label_liquid' },
    { key: 's3a', color: 'var(--series-2)', label: 'charts.label_3a' },
    { key: 'pk', color: 'var(--series-3)', label: 'charts.label_pk' },
] as const

// The summary a customer takes to the bank: one fluid document that reads as a
// paper preview on screen and paginates to two A4 pages in print.
export function PrintReport({ data, className }: { data: ReportData; className?: string }) {
    const { t, language } = useLanguage()
    const { result, affordability, assumptions, persons } = data
    const couple = persons.length > 1
    const locale = language === 'de' ? 'de-CH' : 'en-CH'
    const today = new Date().toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const monthLabel = (d: Date) => d.toLocaleDateString(locale, { month: 'long', year: 'numeric' })

    const sum = (pick: (p: ReportPerson) => number) => persons.reduce((acc, p) => acc + pick(p), 0)
    const inputRows: Array<{ label: string; pick: (p: ReportPerson) => number; strong?: boolean; group?: string }> = [
        { group: t('print.group_assets'), label: t('app.label_bar'), pick: (p) => p.cash },
        { label: t('app.label_3a'), pick: (p) => p.s3a },
        { label: t('app.label_pk'), pick: (p) => p.pk },
        { label: t('app.label_other'), pick: (p) => p.other },
        { label: t('print.row_assets_total'), pick: (p) => p.cash + p.s3a + p.pk + p.other, strong: true },
        { group: t('print.group_monthly'), label: t('app.label_3a_monthly'), pick: (p) => p.s3aMonthly },
        { label: t('app.label_pk_monthly'), pick: (p) => p.pkMonthly },
        { label: t('app.label_other_monthly'), pick: (p) => p.otherMonthly },
        { group: t('print.group_income'), label: t('app.label_income'), pick: (p) => p.income },
    ]

    const monthly = Number.isFinite(result.monthly) ? Math.ceil(result.monthly) : NaN
    const tableIdx = projectionRowIndices(data.projection.length, data.targetMonthIndex)

    return (
        <article className={cn('sheet t-small', className)}>
            <div aria-hidden="true" className="beam" />

            <div className="px-5 pb-6 pt-5 sm:px-8 print:px-0 print:pb-0">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <img src={logoUrl} alt="" width={24} height={24} className="size-6 shrink-0" />
                        <span aria-hidden="true" className="h-4 w-px shrink-0 bg-border-strong" />
                        <span className="truncate font-medium text-fg-secondary">{t('app.title')}</span>
                    </div>
                    <span className="t-caption shrink-0 tabular-nums text-fg-muted">{t('print.created', { date: today })}</span>
                </div>

                <header className="accent-rule mt-6">
                    <p className="t-kicker">{t('print.kicker')}</p>
                    <h1 className="mt-1 text-[22px] font-semibold leading-[1.15] tracking-[-0.02em] text-fg">{data.claim}</h1>
                    {data.priceValid && (
                        <p className="mt-1.5 text-fg-muted">
                            {t('print.subtitle', { price: chf0(data.price), date: data.targetDateLabel, n: data.monthsRemaining })}
                        </p>
                    )}
                </header>

                {!data.priceValid ? (
                    <p className="mt-6 rounded-item bg-subtle px-4 py-5 text-center text-fg-muted">{t('print.empty')}</p>
                ) : (
                    <>
                        <dl className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 print:mt-5 print:grid-cols-4">
                            <Stat label={t('app.label_kaufpreis')} value={chf0(data.price)} />
                            <Stat label={t('print.stat_required', { pct: assumptions.equityPct })} value={chf0(result.totalRequired)} />
                            <Stat label={t('print.stat_projected')} value={chf0(result.usableTotal)} />
                            <Stat
                                label={t('print.stat_monthly')}
                                value={Number.isFinite(monthly) ? chf0(monthly) : '—'}
                                highlight
                            />
                        </dl>

                        <Section title={t('app.checks_title')}>
                            <table className="w-full tabular-nums">
                                <thead>
                                    <tr className="t-pill border-b border-border text-left text-fg-muted">
                                        <th scope="col" className="py-1.5 pr-3 font-semibold">{t('print.col_criterion')}</th>
                                        <th scope="col" className="px-3 py-1.5 text-right font-semibold">{t('print.col_projected')}</th>
                                        <th scope="col" className="px-3 py-1.5 text-right font-semibold">{t('print.col_required')}</th>
                                        <th scope="col" className="py-1.5 pl-3 text-right font-semibold">{t('print.col_status')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    <CriterionRow
                                        label={t('app.check_total', { pct: assumptions.equityPct })}
                                        actual={chf0(result.usableTotal)}
                                        required={chf0(result.totalRequired)}
                                        status={result.usableTotal >= result.totalRequired ? 'pass' : 'fail'}
                                    />
                                    <CriterionRow
                                        label={t('app.check_hard', { pct: assumptions.hardPct })}
                                        actual={chf0(result.hardTotal)}
                                        required={chf0(result.hardRequired)}
                                        status={result.hardTotal >= result.hardRequired ? 'pass' : 'fail'}
                                    />
                                    <CriterionRow
                                        label={t('app.card_tragbarkeit_title')}
                                        actual={affordability.status === 'pending' ? '—' : `${Math.round(affordability.ratio * 100)}%`}
                                        required={`≤ ${Math.round(affordability.maxRatio * 100)}%`}
                                        status={affordability.status}
                                    />
                                </tbody>
                            </table>

                            <div className="mt-4 flex h-2 w-full gap-[2px]" aria-hidden="true">
                                {[
                                    { key: 'liquid', value: result.segments.liquid, color: 'var(--series-1)' },
                                    { key: 's3a', value: result.segments.s3a, color: 'var(--series-2)' },
                                    { key: 'pk', value: result.segments.pk, color: 'var(--series-3)' },
                                    { key: 'gap', value: result.segments.gap, color: 'var(--context)' },
                                ]
                                    .filter((s) => s.value > 0)
                                    .map((s) => (
                                        <div
                                            key={s.key}
                                            className="h-full first:rounded-l-full last:rounded-r-full"
                                            style={{ flexGrow: s.value, flexBasis: 0, background: s.color }}
                                        />
                                    ))}
                            </div>
                            <dl className="t-caption mt-2.5 flex flex-wrap gap-x-5 gap-y-1">
                                {SERIES.map((s) => (
                                    <LegendItem key={s.key} color={s.color} label={t(s.label)} value={num0(result.amounts[s.key])} />
                                ))}
                                <LegendItem color="var(--context)" label={t('charts.label_gap')} value={num0(result.segments.gap)} />
                            </dl>
                            {result.pkOverflow > 0 && (
                                <p className="t-caption mt-2 text-fg-muted">
                                    {t('app.pk_overflow', { amount: chf0(result.pkOverflow), pct: assumptions.softPct })}
                                </p>
                            )}
                        </Section>

                        <Section title={t('print.section_inputs')}>
                            <table className="w-full tabular-nums">
                                <thead>
                                    <tr className="t-pill border-b border-border text-fg-muted">
                                        <th scope="col" className="py-1.5 pr-3 text-left font-semibold">{t('print.col_item')}</th>
                                        {couple ? (
                                            <>
                                                <th scope="col" className="px-3 py-1.5 text-right font-semibold">{t('app.person1_section')}</th>
                                                <th scope="col" className="px-3 py-1.5 text-right font-semibold">{t('app.person2_section')}</th>
                                                <th scope="col" className="py-1.5 pl-3 text-right font-semibold">{t('charts.label_total')}</th>
                                            </>
                                        ) : (
                                            <th scope="col" className="py-1.5 pl-3 text-right font-semibold">CHF</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {inputRows.map((row) => (
                                        <InputRow key={row.label} group={row.group} label={row.label} strong={row.strong} colSpan={couple ? 4 : 2}>
                                            {couple && persons.map((p, i) => (
                                                <td key={i} className="px-3 py-1.5 text-right print:py-1">{num0(row.pick(p))}</td>
                                            ))}
                                            <td className={cn('py-1.5 pl-3 text-right print:py-1', couple && 'font-semibold')}>{num0(sum(row.pick))}</td>
                                        </InputRow>
                                    ))}
                                </tbody>
                            </table>
                            <p className="t-caption mt-3 text-fg-muted">
                                <span className="font-semibold text-fg-secondary">{t('app.card_assumptions_title')}: </span>
                                {t('print.assumptions', {
                                    equity: formatNumber(assumptions.equityPct, 1),
                                    hard: formatNumber(assumptions.hardPct, 1),
                                    soft: formatNumber(assumptions.softPct, 1),
                                    liquid: pct1(assumptions.rateLiquid * 100),
                                    s3a: pct1(assumptions.rate3a * 100),
                                    pk: pct1(assumptions.ratePK * 100),
                                })}
                            </p>
                        </Section>

                        <Section title={t('app.card_growth_title')} subtitle={t('print.growth_desc')}>
                            <dl className="t-caption mb-2 flex flex-wrap gap-x-5 gap-y-1">
                                {SERIES.map((s) => (
                                    <LegendItem key={s.key} color={s.color} label={t(s.label)} />
                                ))}
                            </dl>
                            <SheetChart
                                points={data.projection}
                                targetAmount={result.totalRequired}
                                targetMonthIndex={data.targetMonthIndex}
                                targetLabel={`${t('charts.label_target')} ${chf0(result.totalRequired)}`}
                                purchaseLabel={t('charts.label_target_month')}
                                tickLabel={(d) => d.toLocaleDateString(locale, { month: 'short', year: '2-digit' })}
                                valueLabel={(v) => formatCompact(v, language)}
                            />
                            <div className="mt-3 overflow-x-auto">
                                <table className="w-full text-right tabular-nums">
                                    <thead>
                                        <tr className="t-pill border-b border-border text-fg-muted">
                                            <th scope="col" className="py-1.5 pr-3 text-left font-semibold">{t('charts.table_date')}</th>
                                            {SERIES.map((s) => (
                                                <th key={s.key} scope="col" className="px-3 py-1.5 font-semibold">{t(s.label)}</th>
                                            ))}
                                            <th scope="col" className="py-1.5 pl-3 font-semibold">{t('charts.label_total')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {tableIdx.map((i) => {
                                            const point = data.projection[i]
                                            const isTarget = i === data.targetMonthIndex
                                            return (
                                                <tr key={i} className={cn(isTarget && 'font-semibold')}>
                                                    <th scope="row" className="whitespace-nowrap py-1.5 pr-3 text-left [font-weight:inherit] text-fg-secondary">
                                                        {monthLabel(point.date)}
                                                        {isTarget && <span className="ml-1.5 font-normal text-fg-muted">· {t('charts.label_target_month')}</span>}
                                                    </th>
                                                    {SERIES.map((s) => (
                                                        <td key={s.key} className="whitespace-nowrap px-3 py-1.5">{num0(point[s.key])}</td>
                                                    ))}
                                                    <td className="whitespace-nowrap py-1.5 pl-3 font-semibold">{num0(point.total)}</td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <p className="t-caption mt-2 text-fg-muted">{t('print.growth_note')}</p>
                        </Section>

                        <Section
                            title={t('app.card_tragbarkeit_title')}
                            subtitle={t('app.card_tragbarkeit_desc')}
                            action={<StatusPill status={affordability.status} />}
                        >
                            {affordability.status === 'pending' ? (
                                <p className="text-fg-muted">{t('print.affordability_pending')}</p>
                            ) : (
                                <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2 print:grid-cols-2">
                                    <dl className="divide-y divide-border tabular-nums">
                                        <KeyValue label={t('app.tragbarkeit_breakdown_interest')} value={chf0(affordability.interest)} />
                                        <KeyValue label={t('app.tragbarkeit_breakdown_amortization')} value={chf0(affordability.amortization)} />
                                        <KeyValue label={t('app.tragbarkeit_breakdown_maintenance')} value={chf0(affordability.maintenance)} />
                                        <KeyValue label={t('print.housing_cost_year')} value={chf0(affordability.housingCost)} strong />
                                    </dl>
                                    <dl className="divide-y divide-border tabular-nums">
                                        <KeyValue label={t('app.tragbarkeit_mortgage', { pct: affordability.mortgagePct })} value={chf0(affordability.mortgageAmount)} />
                                        <KeyValue label={t('app.tragbarkeit_income')} value={chf0(affordability.income)} />
                                        <KeyValue label={t('app.tragbarkeit_required_income')} value={chf0(affordability.requiredIncome)} />
                                        <KeyValue
                                            label={t('app.tragbarkeit_ratio_label')}
                                            value={`${Math.round(affordability.ratio * 100)}% (${t('app.tragbarkeit_threshold', { pct: Math.round(affordability.maxRatio * 100) })})`}
                                            strong
                                        />
                                    </dl>
                                </div>
                            )}
                            <p className="t-caption mt-2.5 text-fg-muted">{t('app.tragbarkeit_assumptions_desc')}</p>
                        </Section>

                        <Section title={t('print.section_notes')}>
                            <div aria-hidden="true">
                                {Array.from({ length: 4 }, (_, i) => (
                                    <div key={i} className="h-8 border-b border-border-strong" />
                                ))}
                            </div>
                        </Section>
                    </>
                )}

                <footer className="t-caption sheet-section mt-8 print:mt-6 border-t border-border pt-3 text-fg-muted">
                    <p>{t('app.disclaimer')}</p>
                    <p className="mt-1 text-fg-faint">{t('print.footer', { date: today })}</p>
                </footer>
            </div>
        </article>
    )
}

function Section({
    title,
    subtitle,
    action,
    children,
}: {
    title: string
    subtitle?: string
    action?: React.ReactNode
    children: React.ReactNode
}) {
    return (
        <section className="sheet-section mt-7 print:mt-5">
            <div className="mb-2.5 flex items-center justify-between gap-3">
                <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-0.5">
                    <h2 className="section-label">{title}</h2>
                    {subtitle && <p className="t-caption text-fg-muted">{subtitle}</p>}
                </div>
                {action}
            </div>
            {children}
        </section>
    )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div className={cn('rounded-item px-3.5 py-3', highlight ? 'bg-brand-tint' : 'bg-subtle')}>
            <dt className="t-caption text-fg-muted">{label}</dt>
            <dd className="mt-1 whitespace-nowrap text-[19px] font-[650] leading-[1.1] tracking-[-0.02em] tabular-nums text-fg">
                {value}
            </dd>
        </div>
    )
}

function StatusPill({ status }: { status: RuleStatus }) {
    const { t } = useLanguage()
    const base = 't-pill inline-flex h-5 items-center gap-1 whitespace-nowrap rounded-full px-2 [&_svg]:size-3'
    if (status === 'pass') {
        return (
            <span className={cn(base, 'bg-success-tint text-success')}>
                <Check aria-hidden="true" />
                {t('app.check_status_pass')}
            </span>
        )
    }
    if (status === 'fail') {
        return (
            <span className={cn(base, 'bg-warning-tint text-warning-ink')}>
                <AlertTriangle aria-hidden="true" />
                {t('app.check_status_fail')}
            </span>
        )
    }
    return <span className={cn(base, 'bg-subtle text-fg-secondary')}>{t('app.check_status_pending')}</span>
}

function CriterionRow({ label, actual, required, status }: { label: string; actual: string; required: string; status: RuleStatus }) {
    return (
        <tr>
            <th scope="row" className="py-2 pr-3 text-left font-normal text-fg">{label}</th>
            <td className="whitespace-nowrap px-3 py-2 text-right font-semibold">{actual}</td>
            <td className="whitespace-nowrap px-3 py-2 text-right text-fg-muted">{required}</td>
            <td className="py-2 pl-3 text-right"><StatusPill status={status} /></td>
        </tr>
    )
}

function InputRow({
    group,
    label,
    strong,
    colSpan,
    children,
}: {
    group?: string
    label: string
    strong?: boolean
    colSpan: number
    children: React.ReactNode
}) {
    return (
        <>
            {group && (
                <tr>
                    <th scope="colgroup" colSpan={colSpan} className="t-caption pb-0.5 pt-3 text-left font-semibold text-fg-muted print:pt-2">
                        {group}
                    </th>
                </tr>
            )}
            <tr className={cn('border-b border-border', strong && 'font-semibold')}>
                <th scope="row" className={cn('py-1.5 pr-3 text-left [font-weight:inherit] print:py-1', strong ? 'text-fg' : 'text-fg-secondary')}>{label}</th>
                {children}
            </tr>
        </>
    )
}

function KeyValue({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
    return (
        <div className={cn('flex items-baseline justify-between gap-3 py-1.5', strong && 'font-semibold')}>
            <dt className={strong ? 'text-fg' : 'text-fg-secondary'}>{label}</dt>
            <dd className="whitespace-nowrap text-right text-fg">{value}</dd>
        </div>
    )
}

function LegendItem({ color, label, value }: { color: string; label: string; value?: string }) {
    return (
        <div className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ background: color }} />
            <dt className="text-fg-muted">{label}</dt>
            {value != null && <dd className="font-medium tabular-nums text-fg">{value}</dd>}
        </div>
    )
}

function niceStep(raw: number) {
    if (raw <= 0) return 1
    const pow = Math.pow(10, Math.floor(Math.log10(raw)))
    const n = raw / pow
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * pow
}

// Static stacked-area chart. Plain SVG with a viewBox, so it needs no layout
// measurement and prints at any width.
function SheetChart({
    points,
    targetAmount,
    targetMonthIndex,
    targetLabel,
    purchaseLabel,
    tickLabel,
    valueLabel,
}: {
    points: ProjectionPoint[]
    targetAmount: number
    targetMonthIndex: number
    targetLabel: string
    purchaseLabel: string
    tickLabel: (d: Date) => string
    valueLabel: (v: number) => string
}) {
    if (points.length < 2) return null

    const W = 720
    const H = 220
    const m = { l: 46, r: 10, t: 16, b: 24 }
    const innerW = W - m.l - m.r
    const innerH = H - m.t - m.b
    const last = points.length - 1

    const peak = Math.max(targetAmount, ...points.map((p) => p.total), 1)
    const step = niceStep(peak / 4)
    const maxY = Math.ceil((peak * 1.04) / step) * step
    const x = (i: number) => m.l + (i / last) * innerW
    const y = (v: number) => m.t + innerH - (v / maxY) * innerH

    const layers = SERIES.map((s, layer) => {
        const base = (p: ProjectionPoint) => SERIES.slice(0, layer).reduce((acc, k) => acc + p[k.key], 0)
        const top = points.map((p, i) => `${x(i).toFixed(1)},${y(base(p) + p[s.key]).toFixed(1)}`)
        const bottom = points.map((p, i) => `${x(i).toFixed(1)},${y(base(p)).toFixed(1)}`).reverse()
        return { ...s, area: `M${top.join('L')}L${bottom.join('L')}Z`, line: `M${top.join('L')}` }
    })

    const yTicks: number[] = []
    for (let v = 0; v <= maxY + 1e-6; v += step) yTicks.push(v)

    const hasTarget = targetMonthIndex > 0 && targetMonthIndex <= last
    // Start, purchase month and end always get a label; yearly ticks fill the gaps.
    const xTicks: number[] = []
    const candidates = [0, last, ...(hasTarget ? [targetMonthIndex] : []), ...projectionRowIndices(points.length, -1)]
    for (const i of candidates) {
        if (xTicks.every((j) => Math.abs(x(i) - x(j)) >= 62)) xTicks.push(i)
    }

    const text = { fontSize: 10, fill: 'var(--ink-500)', fontFamily: 'inherit' } as const

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={targetLabel}>
            {yTicks.map((v) => (
                <g key={v}>
                    <line x1={m.l} x2={W - m.r} y1={y(v)} y2={y(v)} stroke={v === 0 ? 'var(--border-strong)' : 'var(--border)'} strokeWidth={1} />
                    <text x={m.l - 6} y={y(v) + 3.5} textAnchor="end" style={text}>{valueLabel(v)}</text>
                </g>
            ))}
            {layers.map((l) => (
                <g key={l.key}>
                    <path d={l.area} fill={l.color} fillOpacity={0.2} />
                    <path d={l.line} fill="none" stroke={l.color} strokeWidth={1.75} strokeLinejoin="round" />
                </g>
            ))}
            {targetAmount > 0 && (
                <>
                    <line x1={m.l} x2={W - m.r} y1={y(targetAmount)} y2={y(targetAmount)} stroke="var(--ink-700)" strokeWidth={1.25} strokeDasharray="4 4" />
                    <text x={m.l + 6} y={y(targetAmount) - 5} style={{ ...text, fill: 'var(--ink-700)', fontWeight: 600, paintOrder: 'stroke', stroke: 'var(--surface)', strokeWidth: 3 }}>{targetLabel}</text>
                </>
            )}
            {hasTarget && (
                <>
                    <line x1={x(targetMonthIndex)} x2={x(targetMonthIndex)} y1={m.t} y2={m.t + innerH} stroke="var(--context-line)" strokeWidth={1} strokeDasharray="3 3" />
                    <text x={x(targetMonthIndex) - 5} y={m.t + innerH - 6} textAnchor="end" style={text}>{purchaseLabel}</text>
                </>
            )}
            {xTicks.map((i) => (
                <text
                    key={i}
                    x={x(i)}
                    y={H - 7}
                    textAnchor={i === 0 ? 'start' : i === last ? 'end' : 'middle'}
                    style={text}
                >
                    {tickLabel(points[i].date)}
                </text>
            ))}
        </svg>
    )
}
