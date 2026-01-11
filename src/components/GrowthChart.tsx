import { useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { cn } from '../lib/utils'
import { useLanguage } from '../i18n/LanguageContext'

type GrowthChartProps = {
    currentLiquidAssets: number
    monthlyLiquidContribution: number
    current3aAssets: number
    monthly3aContribution: number
    currentPKAssets: number
    monthlyPKContribution: number
    months: number
    targetAmount: number
    className?: string
}

const CustomTooltip = ({ active, payload, label }: any) => {
    const { t, language } = useLanguage()

    if (active && payload && payload.length) {
        const data = payload[0].payload
        return (
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xl ring-1 ring-slate-200 dark:bg-slate-950 dark:border-slate-800 dark:ring-slate-800">
                <div className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">{label}</div>
                {/* Reverse payload to match stack order (Top to Bottom visually) */}
                {[...payload].reverse().map((entry: any, index: number) => {
                    let name = t('charts.unknown')
                    if (entry.name === 'pk') name = t('charts.label_pk')
                    if (entry.name === 's3a') name = t('charts.label_3a')
                    if (entry.name === 'liquid') name = t('charts.label_liquid')

                    return (
                        <div key={index} className="flex items-center gap-3 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-slate-500 dark:text-slate-400">{name}</span>
                            </div>
                            <span className="ml-auto font-medium text-slate-900 dark:text-slate-100 tabular-nums">
                                CHF {new Intl.NumberFormat(language === 'de' ? 'de-CH' : 'en-US').format(entry.value)}
                            </span>
                        </div>
                    )
                })}
                <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-sm font-semibold dark:border-slate-800">
                    <span className="text-slate-900 dark:text-slate-100">{t('charts.label_total')}</span>
                    <span className="text-slate-900 dark:text-slate-100 tabular-nums">
                        CHF {new Intl.NumberFormat(language === 'de' ? 'de-CH' : 'en-US').format(data.total)}
                    </span>
                </div>
            </div>
        )
    }
    return null
}

export function GrowthChart({
    currentLiquidAssets,
    monthlyLiquidContribution,
    current3aAssets,
    monthly3aContribution,
    currentPKAssets,
    monthlyPKContribution,
    months,
    className,
}: GrowthChartProps) {
    const { language } = useLanguage()

    const data = useMemo(() => {
        if (months <= 0) return []

        const points = []
        const now = new Date()

        for (let i = 0; i <= months; i++) {
            const liquid = currentLiquidAssets + (monthlyLiquidContribution * i)
            const s3a = current3aAssets + (monthly3aContribution * i)
            const pk = currentPKAssets + (monthlyPKContribution * i)

            // Label: "Jan '25"
            const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
            const label = d.toLocaleDateString(language === 'de' ? 'de-CH' : 'en-US', { month: 'short', year: '2-digit' })

            points.push({
                name: label,
                liquid: liquid,
                s3a: s3a,
                pk: pk,
                total: liquid + s3a + pk,
            })
        }
        return points
    }, [currentLiquidAssets, monthlyLiquidContribution, current3aAssets, monthly3aContribution, currentPKAssets, monthlyPKContribution, months, language])

    if (!data.length) return null

    return (
        <div className={cn("h-64 w-full", className)}>
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
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{
                        top: 10,
                        right: 10,
                        left: 0,
                        bottom: 0,
                    }}
                >
                    <defs>
                        <linearGradient id="colorPk" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient id="colorS3a" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient id="colorLiquid" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                        </linearGradient>
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
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                        type="monotone"
                        dataKey="pk"
                        stackId="1"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#colorPk)"
                        name="pk"
                    />
                    <Area
                        type="monotone"
                        dataKey="s3a"
                        stackId="1"
                        stroke="#6366f1"
                        strokeWidth={2}
                        fill="url(#colorS3a)"
                        name="s3a"
                    />
                    <Area
                        type="monotone"
                        dataKey="liquid"
                        stackId="1"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fill="url(#colorLiquid)"
                        name="liquid"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
