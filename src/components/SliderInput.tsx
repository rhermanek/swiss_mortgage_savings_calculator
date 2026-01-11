import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'
import { cn } from '../lib/utils'

// Reuse logic from App.tsx or similar, but for now we'll keep it self-contained or import 
// if I refactored the money parsing. 
// For simplicity in this component, I'll assume props handle the mixed string/number state 
// or I'll implement a clean interface.
// Ideally: The parent manages state as a string (since that's what the App currently does).
// This component will take `value` (string) and `onChange` (string).
// It will convert to number for the slider.

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
}

function parseMoney(raw: string): number {
    const trimmed = raw.trim()
    if (!trimmed) return 0
    const normalized = trimmed
        .replaceAll('’', "'")
        .replaceAll(' ', '')
        .replaceAll("'", '')
        .replace(/[^\d,.\-]/g, '')

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
}: SliderInputProps) {
    const numericValue = React.useMemo(() => parseMoney(value), [value])

    // Handlers
    const handleSliderChange = (vals: number[]) => {
        // When slider moves, we update the string value.
        // We might want to format it nicely? 
        // The existing app simply holds the string. 
        // Let's pass a clean string representation.
        const newVal = vals[0]
        // Use a simple formatting with ' for thousands for better UX if possible,
        // but the app's `parseMoney` handles ' so we can emit it.
        // For now, raw number string is safest to avoid cursor jumping if we were typing, 
        // but since this is slider drag, we can format.
        const formatted = new Intl.NumberFormat('de-CH').format(newVal).replaceAll('’', "'")
        onChange(formatted)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value)
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label htmlFor={id} className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {label}
                </label>
                {/* Optional: Show value on the right or rely on input */}
            </div>

            <div className="relative">
                <div className="relative mb-4">
                    {icon ? (
                        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                            {icon}
                        </div>
                    ) : null}
                    <input
                        id={id}
                        inputMode="decimal"
                        value={value}
                        onChange={handleInputChange}
                        className={cn(
                            "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-[15px] text-slate-900 shadow-sm outline-none transition",
                            "placeholder:text-slate-400 focus:border-slate-300 focus:ring-4 focus:ring-slate-100",
                            "dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 dark:focus:ring-slate-800 dark:focus:border-slate-700",
                            icon ? "pl-10" : ""
                        )}
                    />
                </div>

                {/* Slider */}
                <div className="px-1">
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
                        <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-slate-900 bg-white ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:border-slate-50 dark:bg-slate-950 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300 shadow-sm cursor-grab active:cursor-grabbing" />
                    </SliderPrimitive.Root>
                </div>
            </div>
            {hint ? <div className="text-xs text-slate-500 mt-1.5">{hint}</div> : null}
        </div>
    )
}
