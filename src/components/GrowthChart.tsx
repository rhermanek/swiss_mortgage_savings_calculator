import { useMemo, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { cn } from '../lib/utils'
import { useLanguage } from '../i18n/useLanguage'

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
    annualRate?: number
    className?: string
}

const COLORS = {
    pk: '#10b981',
    s3a: '#8b5cf6',
    liquid: '#3b82f6',
    pk2: '#f59e0b',
    s3a2: '#f43f5e',
    liquid2: '#06b6d4',
} as const

type SeriesKey = keyof typeof COLORS

const BASE_SERIES_KEYS = ['pk', 's3a', 'liquid'] as const
const PERSON2_SERIES_KEYS = ['pk2', 's3a2', 'liquid2'] as const

type LegendItem = {
    key: SeriesKey
    label: string
}

type TooltipPayloadEntry = {
    name?: string | number
    value?: number | string
    color?: string
    payload?: Record<string, number | string>
}

type CustomTooltipProps = {
    active?: boolean
    payload?: TooltipPayloadEntry[]
    label?: string | number
    t: (key: string, params?: Record<string, string | number>) => string
    language: string
    hasPerson2: boolean
    isFiltered: boolean
    selectedSeries: Set<SeriesKey>
    activeSeriesKeys: SeriesKey[]
    isSeriesSelected: (key: SeriesKey) => boolean
}

function CustomTooltip({
    active,
    payload,
    label,
    t,
    language,
    hasPerson2,
    isFiltered,
    selectedSeries,
    activeSeriesKeys,
    isSeriesSelected,
}: CustomTooltipProps) {
    if (!active || !payload || !payload.length) return null
    const d = payload[0].payload ?? {}
    const fmt = new Intl.NumberFormat(language === 'de' ? 'de-CH' : 'en-US')
    return (
        <div className="max-w-[280px] w-max rounded-xl border border-slate-200 bg-white p-3 shadow-xl ring-1 ring-slate-200 dark:bg-slate-950 dark:border-slate-800 dark:ring-slate-800">
            <div className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">{label}</div>
            {[...payload]
                .reverse()
                .filter((entry) => isSeriesSelected(entry.name as SeriesKey))
                .map((entry, index) => {
                    let name = t('charts.unknown')
                    const p1 = t('charts.label_person1')
                    const p2 = t('charts.label_person2')
                    if (hasPerson2) {
                        if (entry.name === 'pk') name = `${p1} – ${t('charts.label_pk')}`
                        else if (entry.name === 's3a') name = `${p1} – ${t('charts.label_3a')}`
                        else if (entry.name === 'liquid') name = `${p1} – ${t('charts.label_liquid')}`
                        else if (entry.name === 'pk2') name = `${p2} – ${t('charts.label_pk')}`
                        else if (entry.name === 's3a2') name = `${p2} – ${t('charts.label_3a')}`
                        else if (entry.name === 'liquid2') name = `${p2} – ${t('charts.label_liquid')}`
                    } else {
                        if (entry.name === 'pk') name = t('charts.label_pk')
                        else if (entry.name === 's3a') name = t('charts.label_3a')
                        else if (entry.name === 'liquid') name = t('charts.label_liquid')
                    }
                    return (
                        <div key={index} className="flex items-center gap-3 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-slate-500 dark:text-slate-400">{name}</span>
                            </div>
                            <span className="ml-auto font-medium text-slate-900 dark:text-slate-100 tabular-nums">
                                CHF {fmt.format(Number(entry.value) || 0)}
                            </span>
                        </div>
                    )
                })}
            <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-sm font-semibold dark:border-slate-800">
                <span className="text-slate-900 dark:text-slate-100">{t('charts.label_total')}</span>
                <span className="text-slate-900 dark:text-slate-100 tabular-nums">
                    CHF {fmt.format(
                        isFiltered
                            ? activeSeriesKeys
                                .filter((key) => selectedSeries.has(key))
                                .reduce((sum, key) => sum + (Number(d[key]) || 0), 0)
                            : Number(d.total) || 0,
                    )}
                </span>
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
    annualRate = 0,
    className,
}: GrowthChartProps) {
    const { t, language } = useLanguage()
    const [selectedSeries, setSelectedSeries] = useState<Set<SeriesKey>>(new Set())

    const hasPerson2 = currentLiquidAssets2 !== undefined
    const isFiltered = selectedSeries.size > 0

    const activeSeriesKeys = useMemo(() => {
        return hasPerson2 ? [...BASE_SERIES_KEYS, ...PERSON2_SERIES_KEYS] : [...BASE_SERIES_KEYS]
    }, [hasPerson2])

    const legendItems = useMemo<LegendItem[]>(() => {
        const person1Suffix = hasPerson2 ? ` (${t('charts.label_person1')})` : ''
        const items: LegendItem[] = []

        if (hasPerson2) {
            // Group by asset type: PK, 3a, Liquid (each with both persons)
            items.push(
                { key: 'pk', label: `${t('charts.label_pk')} (${t('charts.label_person1')})` },
                { key: 'pk2', label: `${t('charts.label_pk')} (${t('charts.label_person2')})` },
                { key: 's3a', label: `${t('charts.label_3a')} (${t('charts.label_person1')})` },
                { key: 's3a2', label: `${t('charts.label_3a')} (${t('charts.label_person2')})` },
                { key: 'liquid', label: `${t('charts.label_liquid')}${person1Suffix}` },
                { key: 'liquid2', label: `${t('charts.label_liquid')} (${t('charts.label_person2')})` },
            )
        } else {
            items.push(
                { key: 'pk', label: `${t('charts.label_pk')}${person1Suffix}` },
                { key: 's3a', label: `${t('charts.label_3a')}${person1Suffix}` },
                { key: 'liquid', label: `${t('charts.label_liquid')}${person1Suffix}` },
            )
        }

        return items
    }, [hasPerson2, t])

    const legendLabelByKey = useMemo(() => {
        const labels = {} as Record<SeriesKey, string>
        legendItems.forEach(({ key, label }) => {
            labels[key] = label
        })
        return labels
    }, [legendItems])

    const legendRows = useMemo<SeriesKey[][]>(() => {
        if (hasPerson2) {
            return [
                ['pk', 'pk2'],
                ['s3a', 's3a2'],
                ['liquid', 'liquid2'],
            ]
        }

        return [['pk', 's3a', 'liquid']]
    }, [hasPerson2])

    const toggleSeries = (key: SeriesKey) => {
        setSelectedSeries((prev) => {
            const next = new Set(prev)
            if (next.has(key)) {
                next.delete(key)
            } else {
                next.add(key)
            }
            return next
        })
    }

    const isSeriesSelected = (key: SeriesKey) => !isFiltered || selectedSeries.has(key)

    const data = useMemo(() => {
        if (months <= 0) return []

        const points = []
        const now = new Date()
        const monthlyRate = annualRate > 0 ? annualRate / 12 : 0

        // Iterative compound (or linear when monthlyRate === 0): each step grows the
        // prior balance by monthlyRate and adds the monthly contribution.
        let liquid = currentLiquidAssets
        let s3a = current3aAssets
        let pk = currentPKAssets
        let liquid2 = hasPerson2 ? currentLiquidAssets2! : 0
        let s3a2 = hasPerson2 ? current3aAssets2! : 0
        let pk2 = hasPerson2 ? currentPKAssets2! : 0

        for (let i = 0; i <= months; i++) {
            if (i > 0) {
                liquid = liquid * (1 + monthlyRate) + monthlyLiquidContribution
                s3a = s3a * (1 + monthlyRate) + monthly3aContribution
                pk = pk * (1 + monthlyRate) + monthlyPKContribution
                if (hasPerson2) {
                    liquid2 = liquid2 * (1 + monthlyRate) + (monthlyLiquidContribution2 ?? 0)
                    s3a2 = s3a2 * (1 + monthlyRate) + (monthly3aContribution2 ?? 0)
                    pk2 = pk2 * (1 + monthlyRate) + (monthlyPKContribution2 ?? 0)
                }
            }

            const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
            const label = d.toLocaleDateString(language === 'de' ? 'de-CH' : 'en-US', { month: 'short', year: '2-digit' })

            const point: Record<string, number | string> = {
                name: label,
                liquid,
                s3a,
                pk,
                total: liquid + s3a + pk + liquid2 + s3a2 + pk2,
            }
            if (hasPerson2) {
                point.liquid2 = liquid2
                point.s3a2 = s3a2
                point.pk2 = pk2
            }
            points.push(point)
        }
        return points
    }, [currentLiquidAssets, monthlyLiquidContribution, current3aAssets, monthly3aContribution, currentPKAssets, monthlyPKContribution, currentLiquidAssets2, monthlyLiquidContribution2, current3aAssets2, monthly3aContribution2, currentPKAssets2, monthlyPKContribution2, months, language, hasPerson2, annualRate])

    if (!data.length) return null

    return (
        <div className={cn("w-full", className)}>
            <style>{`
                :root {
                    --color-grid: #e2e8f0;
                    --color-text: #64748b;
                }
                .dark {
                    --color-grid: #334155;
                    --color-text: #94a3b8;
                }
            `}</style>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                    <defs>
                        {Object.entries(COLORS).map(([key, color]) => (
                            <linearGradient key={key} id={`color_${key}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                                <stop offset="95%" stopColor={color} stopOpacity={0.05} />
                            </linearGradient>
                        ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-grid)" />
                    <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12, fill: 'var(--color-text)' }}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                        minTickGap={30}
                    />
                    <YAxis
                        tick={{ fontSize: 12, fill: 'var(--color-text)' }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => new Intl.NumberFormat(language === 'de' ? 'de-CH' : 'en-US', { notation: "compact" }).format(value)}
                    />
                    <Tooltip
                        content={
                            <CustomTooltip
                                t={t}
                                language={language}
                                hasPerson2={hasPerson2}
                                isFiltered={isFiltered}
                                selectedSeries={selectedSeries}
                                activeSeriesKeys={activeSeriesKeys}
                                isSeriesSelected={isSeriesSelected}
                            />
                        }
                    />
                    {BASE_SERIES_KEYS.map((key) => (
                        <Area key={key} type="monotone" dataKey={key} stackId="1"
                            stroke={COLORS[key]}
                            strokeWidth={isSeriesSelected(key) ? 2.5 : 1.25}
                            strokeOpacity={isSeriesSelected(key) ? 1 : 0.25}
                            fill={`url(#color_${key})`}
                            fillOpacity={isSeriesSelected(key) ? 1 : 0.08}
                            name={key}
                        />
                    ))}
                    {hasPerson2 && PERSON2_SERIES_KEYS.map((key) => (
                        <Area key={key} type="monotone" dataKey={key} stackId="1"
                            stroke={COLORS[key]}
                            strokeWidth={isSeriesSelected(key) ? 2.5 : 1.25}
                            strokeOpacity={isSeriesSelected(key) ? 1 : 0.25}
                            fill={`url(#color_${key})`}
                            fillOpacity={isSeriesSelected(key) ? 1 : 0.08}
                            name={key}
                        />
                    ))}
                    {targetAmount > 0 && (
                        <ReferenceLine
                            y={targetAmount}
                            stroke="#ef4444"
                            strokeDasharray="4 4"
                            strokeWidth={1.5}
                            ifOverflow="extendDomain"
                            label={{
                                value: `${t('charts.label_target')} ${new Intl.NumberFormat(language === 'de' ? 'de-CH' : 'en-US', { notation: 'compact' }).format(targetAmount)}`,
                                position: 'insideTopLeft',
                                fill: '#ef4444',
                                fontSize: 11,
                                fontWeight: 600,
                            }}
                        />
                    )}
                    {targetMonthIndex !== undefined && targetMonthIndex >= 0 && targetMonthIndex < data.length && (
                        <ReferenceLine
                            x={data[targetMonthIndex].name as string}
                            stroke="#94a3b8"
                            strokeDasharray="3 3"
                            strokeWidth={1.5}
                            label={{
                                value: t('charts.label_target_month'),
                                position: 'insideTopRight',
                                fill: '#64748b',
                                fontSize: 11,
                                fontWeight: 500,
                            }}
                        />
                    )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="mt-4 space-y-2">
                {legendRows.map((row, rowIndex) => (
                    <div
                        key={rowIndex}
                        className={cn(
                            'flex justify-center gap-x-5 gap-y-2',
                            hasPerson2 ? 'flex-col sm:flex-row' : 'flex-wrap',
                        )}
                    >
                        {row.map((key) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => toggleSeries(key)}
                                className={cn(
                                    'flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs transition-colors',
                                    isSeriesSelected(key)
                                        ? 'border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                                        : 'border-transparent bg-transparent text-slate-400 dark:text-slate-500',
                                )}
                                aria-pressed={selectedSeries.has(key)}
                            >
                                <div
                                    className="h-2.5 w-2.5 rounded-full"
                                    style={{ backgroundColor: COLORS[key], opacity: isSeriesSelected(key) ? 1 : 0.45 }}
                                />
                                <span>{legendLabelByKey[key]}</span>
                            </button>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}
