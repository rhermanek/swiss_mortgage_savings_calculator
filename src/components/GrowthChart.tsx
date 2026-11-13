import { useMemo, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { cn } from '../lib/utils'
import { formatCHF, formatCompact } from '../lib/format'
import { useLanguage } from '../i18n/useLanguage'
import { projectionRowIndices, type ProjectionPoint } from '../lib/projection'
import { Disclosure, SegmentedControl, Swatch } from './ui'

type GrowthChartProps = {
    points: ProjectionPoint[]
    hasPerson2: boolean
    targetAmount: number
    targetMonthIndex: number
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
    liquid: { color: 'var(--series-1)', swatch: 'bg-series-1' },
    s3a: { color: 'var(--series-2)', swatch: 'bg-series-2' },
    pk: { color: 'var(--series-3)', swatch: 'bg-series-3' },
    p1: { color: 'var(--series-1)', swatch: 'bg-series-1' },
    p2: { color: 'var(--series-2)', swatch: 'bg-series-2' },
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
        <div className="t-caption min-w-48 rounded-control bg-tooltip px-3 py-2.5 text-tooltip-ink">
            <div className="mb-1.5 font-semibold">{point.fullName}</div>
            <div className="space-y-1">
                {[...series].reverse().map((s) => (
                    <div key={s.key} className="flex items-center gap-2">
                        <Swatch className={s.swatch} />
                        <span className="opacity-80">{s.label}</span>
                        <span className="ml-auto pl-4 tabular-nums">{formatCHF(point[s.key], { decimals: 0 })}</span>
                    </div>
                ))}
            </div>
            <div className="mt-1.5 flex items-center justify-between border-t border-white/15 pt-1.5 font-semibold">
                <span>{totalLabel}</span>
                <span className="tabular-nums">{formatCHF(point.total, { decimals: 0 })}</span>
            </div>
        </div>
    )
}

export function GrowthChart({ points, hasPerson2, targetAmount, targetMonthIndex, className }: GrowthChartProps) {
    const { t, language } = useLanguage()
    const [groupBy, setGroupBy] = useState<GroupBy>('asset')
    const [selected, setSelected] = useState<Set<SeriesKey>>(new Set())
    const reduceMotion = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, [])

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

    const data = useMemo<Point[]>(
        () =>
            points.map(({ date, ...values }) => ({
                ...values,
                name: date.toLocaleDateString(locale, { month: 'short', year: '2-digit' }),
                fullName: date.toLocaleDateString(locale, { month: 'long', year: 'numeric' }),
            })),
        [points, locale],
    )

    const hasTargetMonth = targetMonthIndex >= 0 && targetMonthIndex < data.length

    const tableRows = useMemo(
        () => projectionRowIndices(data.length, targetMonthIndex).map((i) => ({ i, point: data[i] })),
        [data, targetMonthIndex],
    )

    if (!data.length) return null

    const atTarget = hasTargetMonth ? data[targetMonthIndex] : data[data.length - 1]
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
                                't-caption inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 font-medium transition-colors',
                                selected.has(s.key)
                                    ? 'bg-fg text-surface'
                                    : isActive(s.key)
                                        ? 'bg-subtle text-fg-secondary hover:text-fg'
                                        : 'bg-subtle text-fg-muted opacity-60 hover:opacity-100',
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
                        <CartesianGrid vertical={false} stroke="var(--border)" />
                        <XAxis
                            dataKey="name"
                            tick={{ fontSize: 12, fill: 'var(--ink-500)' }}
                            tickLine={false}
                            axisLine={{ stroke: 'var(--border-strong)' }}
                            interval="preserveStartEnd"
                            minTickGap={32}
                            tickMargin={8}
                        />
                        <YAxis
                            width="auto"
                            tick={{ fontSize: 12, fill: 'var(--ink-500)' }}
                            tickLine={false}
                            axisLine={false}
                            tickMargin={4}
                            tickFormatter={(value: number) => formatCompact(value, language)}
                        />
                        <Tooltip
                            cursor={{ stroke: 'var(--context-line)', strokeWidth: 1 }}
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
                                fillOpacity={isActive(s.key) ? 0.16 : 0.03}
                                activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--surface)' }}
                                isAnimationActive={!reduceMotion}
                            />
                        ))}
                        {targetAmount > 0 && (
                            <ReferenceLine
                                y={targetAmount}
                                stroke="var(--ink-700)"
                                strokeDasharray="4 4"
                                strokeWidth={1.5}
                                ifOverflow="extendDomain"
                                label={{
                                    value: `${t('charts.label_target')} ${formatCompact(targetAmount, language)}`,
                                    position: 'insideBottomLeft',
                                    fill: 'var(--ink-700)',
                                    fontSize: 11,
                                    fontWeight: 600,
                                }}
                            />
                        )}
                        {hasTargetMonth && (
                            <ReferenceLine
                                x={data[targetMonthIndex].name}
                                stroke="var(--context-line)"
                                strokeDasharray="3 3"
                                label={{
                                    value: t('charts.label_target_month'),
                                    position: 'insideTopRight',
                                    fill: 'var(--ink-500)',
                                    fontSize: 11,
                                    fontWeight: 500,
                                }}
                            />
                        )}
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <Disclosure summary={t('charts.table_toggle')} className="mt-4">
                <div className="overflow-x-auto">
                    <table className="t-small w-full text-right tabular-nums">
                        <thead className="t-pill border-b border-border text-fg-muted">
                            <tr>
                                <th scope="col" className="py-2 pr-3 text-left font-semibold">{t('charts.table_date')}</th>
                                {series.map((s) => (
                                    <th key={s.key} scope="col" className="px-3 py-2 font-semibold">{s.label}</th>
                                ))}
                                <th scope="col" className="py-2 pl-3 font-semibold">{t('charts.label_total')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border text-fg">
                            {tableRows.map(({ i, point }) => (
                                <tr key={i} className={cn(i === targetMonthIndex && 'font-semibold')}>
                                    <th scope="row" className="whitespace-nowrap py-2 pr-3 text-left [font-weight:inherit] text-fg-secondary">
                                        {point.fullName}
                                        {i === targetMonthIndex && <span className="ml-1.5 font-normal text-fg-muted">· {t('charts.label_target_month')}</span>}
                                    </th>
                                    {series.map((s) => (
                                        <td key={s.key} className="whitespace-nowrap px-3 py-2">{formatCHF(point[s.key], { decimals: 0 })}</td>
                                    ))}
                                    <td className="whitespace-nowrap py-2 pl-3 font-semibold">{formatCHF(point.total, { decimals: 0 })}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Disclosure>
        </figure>
    )
}
