import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'
import { SlidersHorizontal } from 'lucide-react'
import { cn } from '../lib/utils'
import { useLanguage } from '../i18n/useLanguage'

type SliderInputProps = {
    id: string
    label: string
    value: string
    onChange: (value: string) => void
    min?: number
    max?: number
    step?: number
    icon?: React.ReactNode
    hint?: string
    warning?: string
    suffix?: string
}

function parseMoney(raw: string): number {
    const trimmed = raw.trim()
    if (!trimmed) return 0
    const normalized = trimmed
        .replaceAll('’', "'")
        .replaceAll(' ', '')
        .replaceAll("'", '')
        .replace(/[^\d,.-]/g, '')

    const hasDot = normalized.includes('.')
    const hasComma = normalized.includes(',')

    let numStr = normalized
    if (hasDot && hasComma) {
        numStr = numStr.replaceAll(',', '')
    } else if (!hasDot && hasComma) {
        numStr = numStr.replaceAll(',', '.')
    }

    const n = Number.parseFloat(numStr)
    return Number.isFinite(n) ? Math.max(0, n) : 0
}

export function SliderInput({
    id,
    label,
    value,
    onChange,
    min = 0,
    max = 1000000,
    step = 1000,
    icon,
    hint,
    warning,
    suffix,
}: SliderInputProps) {
    const { t } = useLanguage()
    const [showSlider, setShowSlider] = React.useState(false)
    const numericValue = React.useMemo(() => parseMoney(value), [value])

    const isInvalid = React.useMemo(() => {
        const trimmed = value.trim()
        if (!trimmed) return false
        const normalized = trimmed.replaceAll('’', '').replaceAll("'", '').replace(/\s/g, '')
        return !/^[0-9]+([.,][0-9]*)?$/.test(normalized)
    }, [value])

    const handleSliderChange = (vals: number[]) => {
        const newVal = vals[0]
        const formatted = new Intl.NumberFormat('de-CH').format(newVal).replaceAll('’', "'")
        onChange(formatted)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value)
    }

    return (
        <div className="space-y-2">
            <label htmlFor={id} className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {label}
            </label>

            <div className="relative">
                {icon ? (
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                        {icon}
                    </div>
                ) : null}
                <input
                    id={id}
                    inputMode="decimal"
                    value={value}
                    aria-describedby={hint ? `${id}-hint` : undefined}
                    onChange={handleInputChange}
                    className={cn(
                        "h-11 w-full rounded-xl border bg-white text-[15px] text-slate-900 shadow-sm outline-none transition",
                        "placeholder:text-slate-400 focus:ring-4",
                        isInvalid
                            ? "border-rose-400 focus:border-rose-400 focus:ring-rose-100 dark:border-rose-600 dark:focus:ring-rose-950/40"
                            : "border-slate-200 focus:border-slate-300 focus:ring-slate-100 dark:border-slate-800 dark:focus:ring-slate-800 dark:focus:border-slate-700",
                        "dark:bg-slate-950 dark:text-slate-100",
                        icon ? "pl-10" : "pl-3",
                        suffix ? "pr-16" : "pr-10",
                    )}
                />
                {suffix ? (
                    <span className="pointer-events-none absolute right-10 top-1/2 -translate-y-1/2 text-sm text-slate-500 dark:text-slate-400">
                        {suffix}
                    </span>
                ) : null}
                <button
                    type="button"
                    onClick={() => setShowSlider((s) => !s)}
                    aria-label={t('app.toggle_slider')}
                    aria-expanded={showSlider}
                    aria-controls={`${id}-slider`}
                    className={cn(
                        "absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 transition-colors",
                        showSlider
                            ? "text-slate-700 bg-slate-100 dark:text-slate-200 dark:bg-slate-800"
                            : "text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-500 dark:hover:text-slate-200 dark:hover:bg-slate-800",
                    )}
                >
                    <SlidersHorizontal className="h-4 w-4" />
                </button>
            </div>

            {showSlider && (
                <div id={`${id}-slider`} className="px-1 pt-2">
                    <SliderPrimitive.Root
                        className="relative flex w-full touch-none select-none items-center"
                        value={[numericValue]}
                        max={max}
                        min={min}
                        step={step}
                        onValueChange={handleSliderChange}
                    >
                        <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <SliderPrimitive.Range className="absolute h-full bg-slate-900 dark:bg-slate-50" />
                        </SliderPrimitive.Track>
                        <SliderPrimitive.Thumb
                            aria-label={label}
                            className="block h-6 w-6 rounded-full border-2 border-slate-900 bg-white ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:border-slate-50 dark:bg-slate-950 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300 shadow-sm cursor-grab active:cursor-grabbing"
                        />
                    </SliderPrimitive.Root>
                </div>
            )}

            {isInvalid && <div className="text-xs text-rose-500 dark:text-rose-400">{t('app.input_error')}</div>}
            {warning ? <div className="text-xs text-amber-600 dark:text-amber-400">{warning}</div> : null}
            {hint ? <div id={`${id}-hint`} className="text-xs text-slate-500 dark:text-slate-400">{hint}</div> : null}
        </div>
    )
}
