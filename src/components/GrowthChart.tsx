import { useMemo, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { cn } from '../lib/utils'
import { formatCHF, formatCompact } from '../lib/format'
import { useLanguage } from '../i18n/useLanguage'
import { Disclosure, SegmentedControl, Swatch } from './ui'

type GrowthChartProps = {
    currentLiquidAssets: number
    monthlyLiquidContribution: number
    current3aAssets: number
    monthly3aContribution: number
    currentPKAssets: number
    monthlyPKContribution: number
    currentLiquidAssets2?: number
    monthlyLiquidContribution2?: number
    current3aAssets2?: number
    monthly3aContribution2?: number
    currentPKAssets2?: number
    monthlyPKContribution2?: number
    months: number
    targetAmount: number
    targetMonthIndex?: number
    annualRateLiquid?: number
    annualRate3a?: number
    annualRatePK?: number
    className?: string
}

type GroupBy = 'asset' | 'person'
type SeriesKey = 'liquid' | 's3a' | 'pk' | 'p1' | 'p2'

type SeriesDef = {
    key: SeriesKey
    label: string
    color: string
    swatch: string
}

type Point = Record<SeriesKey | 'total', number> & { name: string; fullName: string }

// Same entity → same color as the equity progress bar in the result card.
const SERIES_STYLE: Record<SeriesKey, { color: string; swatch: string }> = {
    liquid: { color: 'var(--chart-blue)', swatch: 'bg-chart-blue' },
    s3a: { color: 'var(--chart-aqua)', swatch: 'bg-chart-aqua' },
    pk: { color: 'var(--chart-orange)', swatch: 'bg-chart-orange' },
    p1: { color: 'var(--chart-blue)', swatch: 'bg-chart-blue' },
    p2: { color: 'var(--chart-orange)', swatch: 'bg-chart-orange' },
}

type TooltipPayloadEntry = {
    dataKey?: string | number
    value?: number | string
    payload?: Point
}

function ChartTooltip({
    active,
    payload,
    series,
    totalLabel,
}: {
    active?: boolean
    payload?: TooltipPayloadEntry[]
    series: SeriesDef[]
    totalLabel: string
}) {
    if (!active || !payload?.length || !payload[0].payload) return null
    const point = payload[0].payload
    return (
        <div className="min-w-52 rounded-xl border border-border bg-surface p-3 text-sm shadow-lg">
            <div className="mb-2 font-medium text-fg">{point.fullName}</div>
            <div className="space-y-1">
                {[...series].reverse().map((s) => (
                    <div key={s.key} className="flex items-center gap-2">
                        <Swatch className={s.swatch} />
                        <span className="text-fg-secondary">{s.label}</span>
                        <span className="ml-auto pl-4 tabular-nums text-fg">{formatCHF(point[s.key], { decimals: 0 })}</span>
                    </div>
                ))}
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-border pt-2 font-semibold text-fg">
                <span>{totalLabel}</span>
                <span className="tabular-nums">{formatCHF(point.total, { decimals: 0 })}</span>
            </div>
        </div>
    )
}

export function GrowthChart({
    currentLiquidAssets,
    monthlyLiquidContribution,
    current3aAssets,
    monthly3aContribution,
    currentPKAssets,
    monthlyPKContribution,
    currentLiquidAssets2,
    monthlyLiquidContribution2,
    current3aAssets2,
    monthly3aContribution2,
    currentPKAssets2,
    monthlyPKContribution2,
    months,
    targetAmount,
    targetMonthIndex,
    annualRateLiquid = 0,
    annualRate3a = 0,
    annualRatePK = 0,
    className,
}: GrowthChartProps) {
    const { t, language } = useLanguage()
    const [groupBy, setGroupBy] = useState<GroupBy>('asset')
    const [selected, setSelected] = useState<Set<SeriesKey>>(new Set())
    const reduceMotion = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, [])

    const hasPerson2 = currentLiquidAssets2 !== undefined
    const effectiveGroupBy: GroupBy = hasPerson2 ? groupBy : 'asset'
    const locale = language === 'de' ? 'de-CH' : 'en-CH'

    const series = useMemo<SeriesDef[]>(() => {
        const keys: SeriesKey[] = effectiveGroupBy === 'person' ? ['p1', 'p2'] : ['liquid', 's3a', 'pk']
        const labels: Record<SeriesKey, string> = {
            liquid: t('charts.label_liquid'),
            s3a: t('charts.label_3a'),
            pk: t('charts.label_pk'),
            p1: t('charts.label_person1'),
            p2: t('charts.label_person2'),
        }
        return keys.map((key) => ({ key, label: labels[key], ...SERIES_STYLE[key] }))
    }, [effectiveGroupBy, t])

    // Ignore selections from the other grouping (e.g. after the partner was removed)
    const isFiltered = series.some((s) => selected.has(s.key))
    const isActive = (key: SeriesKey) => !isFiltered || selected.has(key)

    const toggleSeries = (key: SeriesKey) => {
        setSelected((prev) => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
        })
    }

    const data = useMemo<Point[]>(() => {
        if (months <= 0) return []

        const points: Point[] = []
        const now = new Date()
        const monthlyLiquid = annualRateLiquid > 0 ? annualRateLiquid / 12 : 0
        const monthly3a = annualRate3a > 0 ? annualRate3a / 12 : 0
        const monthlyPK = annualRatePK > 0 ? annualRatePK / 12 : 0

        // Iterative compound per asset class (linear when its rate is 0).
        let liquid = currentLiquidAssets
        let s3a = current3aAssets
        let pk = currentPKAssets
        let liquid2 = hasPerson2 ? currentLiquidAssets2! : 0
        let s3a2 = hasPerson2 ? current3aAssets2! : 0
        let pk2 = hasPerson2 ? currentPKAssets2! : 0

        for (let i = 0; i <= months; i++) {
            if (i > 0) {
                liquid = liquid * (1 + monthlyLiquid) + monthlyLiquidContribution
                s3a = s3a * (1 + monthly3a) + monthly3aContribution
                pk = pk * (1 + monthlyPK) + monthlyPKContribution
                if (hasPerson2) {
                    liquid2 = liquid2 * (1 + monthlyLiquid) + (monthlyLiquidContribution2 ?? 0)
                    s3a2 = s3a2 * (1 + monthly3a) + (monthly3aContribution2 ?? 0)
                    pk2 = pk2 * (1 + monthlyPK) + (monthlyPKContribution2 ?? 0)
                }
            }

            const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
            points.push({
                name: d.toLocaleDateString(locale, { month: 'short', year: '2-digit' }),
                fullName: d.toLocaleDateString(locale, { month: 'long', year: 'numeric' }),
                liquid: liquid + liquid2,
                s3a: s3a + s3a2,
                pk: pk + pk2,
                p1: liquid + s3a + pk,
                p2: liquid2 + s3a2 + pk2,
                total: liquid + s3a + pk + liquid2 + s3a2 + pk2,
            })
        }
        return points
    }, [currentLiquidAssets, monthlyLiquidContribution, current3aAssets, monthly3aContribution, currentPKAssets, monthlyPKContribution, currentLiquidAssets2, monthlyLiquidContribution2, current3aAssets2, monthly3aContribution2, currentPKAssets2, monthlyPKContribution2, months, locale, hasPerson2, annualRateLiquid, annualRate3a, annualRatePK])

    const hasTargetMonth = targetMonthIndex !== undefined && targetMonthIndex >= 0 && targetMonthIndex < data.length

    // Yearly rows plus the purchase month and the last projected month.
    const tableRows = useMemo(() => {
        const idx = new Set<number>()
        for (let i = 0; i < data.length; i += 12) idx.add(i)
        if (hasTargetMonth) idx.add(targetMonthIndex!)
        if (data.length) idx.add(data.length - 1)
        return [...idx].sort((a, b) => a - b).map((i) => ({ i, point: data[i] }))
    }, [data, hasTargetMonth, targetMonthIndex])

    if (!data.length) return null

    const atTarget = hasTargetMonth ? data[targetMonthIndex!] : data[data.length - 1]
    const summary = t('charts.aria_summary', {
        start: formatCHF(data[0].total, { decimals: 0 }),
        end: formatCHF(atTarget.total, { decimals: 0 }),
        date: atTarget.fullName,
        target: formatCHF(targetAmount, { decimals: 0 }),
    })

    return (
        <figure className={cn('w-full', className)}>
            <figcaption className="sr-only">{summary}</figcaption>

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={t('charts.legend_label')}>
                    {series.map((s) => (
                        <button
                            key={s.key}
                            type="button"
                            onClick={() => toggleSeries(s.key)}
                            aria-pressed={selected.has(s.key)}
                            className={cn(
                                'inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-colors',
                                selected.has(s.key)
                                    ? 'border-fg/30 bg-subtle text-fg'
                                    : isActive(s.key)
                                        ? 'border-border text-fg-secondary hover:bg-subtle hover:text-fg'
                                        : 'border-border text-fg-muted opacity-60 hover:opacity-100',
                            )}
                        >
                            <Swatch className={s.swatch} />
                            {s.label}
                        </button>
                    ))}
                </div>
                {hasPerson2 && (
                    <SegmentedControl<GroupBy>
                        size="sm"
                        ariaLabel={t('charts.group_by')}
                        value={groupBy}
                        onChange={(v) => {
                            setGroupBy(v)
                            setSelected(new Set())
                        }}
                        options={[
                            { value: 'asset', label: t('charts.group_asset') },
                            { value: 'person', label: t('charts.group_person') },
                        ]}
                    />
                )}
            </div>

            <div className="h-64 sm:h-72">
                <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 600, height: 288 }}>
                    <AreaChart data={data} margin={{ top: 20, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
                        <XAxis
                            dataKey="name"
                            tick={{ fontSize: 12, fill: 'var(--fg-muted)' }}
                            tickLine={false}
                            axisLine={{ stroke: 'var(--input)' }}
                            interval="preserveStartEnd"
                            minTickGap={32}
                            tickMargin={8}
                        />
                        <YAxis
                            width="auto"
                            tick={{ fontSize: 12, fill: 'var(--fg-muted)' }}
                            tickLine={false}
                            axisLine={false}
                            tickMargin={4}
                            tickFormatter={(value: number) => formatCompact(value, language)}
                        />
                        <Tooltip
                            cursor={{ stroke: 'var(--fg-muted)', strokeWidth: 1 }}
                            content={<ChartTooltip series={series} totalLabel={t('charts.label_total')} />}
                        />
                        {series.map((s) => (
                            <Area
                                key={s.key}
                                type="monotone"
                                dataKey={s.key}
                                name={s.label}
                                stackId="1"
                                stroke={s.color}
                                strokeWidth={2}
                                strokeOpacity={isActive(s.key) ? 1 : 0.25}
                                fill={s.color}
                                fillOpacity={isActive(s.key) ? 0.14 : 0.03}
                                activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--surface)' }}
                                isAnimationActive={!reduceMotion}
                            />
                        ))}
                        {targetAmount > 0 && (
                            <ReferenceLine
                                y={targetAmount}
                                stroke="var(--fg-secondary)"
                                strokeDasharray="4 4"
                                strokeWidth={1.5}
                                ifOverflow="extendDomain"
                                label={{
                                    value: `${t('charts.label_target')} ${formatCompact(targetAmount, language)}`,
                                    position: 'insideTopLeft',
                                    fill: 'var(--fg-secondary)',
                                    fontSize: 11,
                                    fontWeight: 600,
                                    dy: -14,
                                }}
                            />
                        )}
                        {hasTargetMonth && (
                            <ReferenceLine
                                x={data[targetMonthIndex!].name}
                                stroke="var(--fg-muted)"
                                strokeDasharray="3 3"
                                label={{
                                    value: t('charts.label_target_month'),
                                    position: 'insideTopRight',
                                    fill: 'var(--fg-muted)',
                                    fontSize: 11,
                                    fontWeight: 500,
                                }}
                            />
                        )}
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <Disclosure summary={t('charts.table_toggle')} className="mt-4">
                <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-right text-xs tabular-nums">
                        <thead className="bg-subtle text-fg-secondary">
                            <tr>
                                <th scope="col" className="px-3 py-2 text-left font-medium">{t('charts.table_date')}</th>
                                {series.map((s) => (
                                    <th key={s.key} scope="col" className="px-3 py-2 font-medium">{s.label}</th>
                                ))}
                                <th scope="col" className="px-3 py-2 font-medium">{t('charts.label_total')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border text-fg">
                            {tableRows.map(({ i, point }) => (
                                <tr key={i} className={cn(i === targetMonthIndex && 'bg-subtle/60 font-medium')}>
                                    <th scope="row" className="whitespace-nowrap px-3 py-2 text-left font-normal text-fg-secondary">
                                        {point.fullName}
                                        {i === targetMonthIndex && <span className="ml-1.5 text-fg-muted">· {t('charts.label_target_month')}</span>}
                                    </th>
                                    {series.map((s) => (
                                        <td key={s.key} className="whitespace-nowrap px-3 py-2">{formatCHF(point[s.key], { decimals: 0 })}</td>
                                    ))}
                                    <td className="whitespace-nowrap px-3 py-2 font-medium">{formatCHF(point.total, { decimals: 0 })}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Disclosure>
        </figure>
    )
}
