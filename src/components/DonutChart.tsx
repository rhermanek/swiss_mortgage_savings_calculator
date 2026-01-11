import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { cn } from '../lib/utils'

type DonutChartProps = {
    hardEquity: number
    softEquity: number
    gap: number
    target: number
    className?: string
}

export function DonutChart({ hardEquity, softEquity, gap, target, className }: DonutChartProps) {
    const data = useMemo(() => {
        // We want to show segments relative to the TARGET (20% of price).
        // If we have more than target, the chart should ideally reflect that or cap it.
        // For this visual, let's normalize to the Target amount for the "full circle" effect,
        // or better: show Proportions.

        // A simple approach: Pie chart sectors are:
        // 1. Hard Equity (Bar + 3a + Other)
        // 2. Soft Equity (PK)
        // 3. Gap (Remaining to reach target)

        // Note: If Hard + Soft > Target, the Gap is 0.
        // If Hard + Soft > Target, we might want to scale the pie or just show the surplus.
        // Let's stick to: "Composition of the 20%".

        const effectiveHard = Math.min(hardEquity, target)
        const effectiveSoft = Math.min(softEquity, Math.max(0, target - effectiveHard))
        const effectiveGap = Math.max(0, target - effectiveHard - effectiveSoft)

        return [
            { name: 'Harte Eigenmittel', value: effectiveHard, color: '#10b981' }, // emerald-500
            { name: 'Pensionskasse', value: effectiveSoft, color: '#3b82f6' }, // blue-500
            { name: 'Fehlbetrag', value: effectiveGap, color: '#e2e8f0' }, // slate-200 (gap)
        ]
    }, [hardEquity, softEquity, gap, target])

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
                        formatter={(value: any) => `CHF ${new Intl.NumberFormat('de-CH').format(value)}`}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                </PieChart>
            </ResponsiveContainer>

            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-slate-800">{percentage}%</span>
                <span className="text-xs font-medium text-slate-500 text-center px-4">
                    des Ziels erreicht
                </span>
            </div>
        </div>
    )
}
