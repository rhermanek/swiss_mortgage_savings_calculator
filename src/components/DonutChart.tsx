import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { cn } from '../lib/utils'
import { useLanguage } from '../i18n/LanguageContext'

type DonutChartProps = {
    hardEquity: number
    softEquity: number
    gap: number
    target: number
    className?: string
}

export function DonutChart({ hardEquity, softEquity, gap, target, className }: DonutChartProps) {
    const { t, language } = useLanguage()

    const data = useMemo(() => {
        const effectiveHard = Math.min(hardEquity, target)
        const effectiveSoft = Math.min(softEquity, Math.max(0, target - effectiveHard))
        const effectiveGap = Math.max(0, target - effectiveHard - effectiveSoft)

        return [
            { name: t('charts.label_hard'), value: effectiveHard, color: '#10b981' }, // emerald-500
            { name: t('charts.label_pk'), value: effectiveSoft, color: '#3b82f6' }, // blue-500
            { name: t('charts.label_gap'), value: effectiveGap, color: 'var(--color-gap)' }, // Use CSS variable!
        ]
    }, [hardEquity, softEquity, gap, target, t])

    // Center text calculation
    const totalAssets = hardEquity + softEquity
    const percentage = Math.min(100, Math.round((totalAssets / target) * 100))

    return (
        <div className={cn("relative h-64 w-full", className)}>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                        startAngle={90}
                        endAngle={-270}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value: any) => `CHF ${new Intl.NumberFormat(language === 'de' ? 'de-CH' : 'en-US').format(value)}`}
                        contentStyle={{
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            backgroundColor: 'var(--color-tooltip-bg)',
                            color: 'var(--color-tooltip-text)'
                        }}
                        itemStyle={{ color: 'var(--color-tooltip-text)' }}
                    />
                </PieChart>
            </ResponsiveContainer>

            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">{percentage}%</span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 text-center px-4">
                    {t('charts.donut_center_label')}
                </span>
            </div>

            {/* CSS Variables for Chart Colors injection */}
            <style>{`
                :root {
                    --color-gap: #e2e8f0;
                    --color-tooltip-bg: #ffffff;
                    --color-tooltip-text: #0f172a;
                }
                .dark {
                    --color-gap: #334155; /* slate-700 */
                    --color-tooltip-bg: #020617; /* slate-950 */
                    --color-tooltip-text: #f8fafc;
                }
            `}</style>
        </div>
    )
}
