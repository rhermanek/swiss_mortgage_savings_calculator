import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'
import { AlertCircle, SlidersHorizontal } from 'lucide-react'
import { cn } from '../lib/utils'
import { formatNumber, isValidNumberInput, parseMoney } from '../lib/format'
import { useLanguage } from '../i18n/useLanguage'

type SliderInputProps = {
    id: string
    label: string
    value: string
    onChange: (value: string) => void
    min?: number
    max?: number
    step?: number
    unit?: 'chf' | 'percent'
    hint?: string
    warning?: string
    meta?: React.ReactNode
}

export function SliderInput({
    id,
    label,
    value,
    onChange,
    min = 0,
    max = 1000000,
    step = 1000,
    unit = 'chf',
    hint,
    warning,
    meta,
}: SliderInputProps) {
    const { t } = useLanguage()
    const [showSlider, setShowSlider] = React.useState(false)
    const numericValue = React.useMemo(() => parseMoney(value), [value])
    const isInvalid = !isValidNumberInput(value)
    const isPercent = unit === 'percent'

    const describedBy = [
        isInvalid && `${id}-error`,
        warning && `${id}-warning`,
        hint && `${id}-hint`,
    ].filter(Boolean).join(' ') || undefined

    const handleSliderChange = (vals: number[]) => {
        onChange(isPercent ? String(Math.round(vals[0] * 100) / 100) : formatNumber(vals[0]))
    }

    // Normalise money input to Swiss grouping once the user leaves the field.
    const handleBlur = () => {
        if (isPercent || isInvalid || !value.trim()) return
        const formatted = formatNumber(numericValue)
        if (formatted !== value) onChange(formatted)
    }

    return (
        <div className="space-y-1.5">
            <div className="flex min-h-5 items-baseline justify-between gap-3">
                <label htmlFor={id} className="text-sm font-medium text-fg">
                    {label}
                    <span className="sr-only"> ({isPercent ? '%' : 'CHF'})</span>
                </label>
                {meta != null && <span className="shrink-0 text-xs tabular-nums text-fg-muted">{meta}</span>}
            </div>

            <div
                className={cn(
                    'flex h-11 items-center rounded-xl border bg-surface shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-[border-color,box-shadow]',
                    'focus-within:ring-4',
                    isInvalid
                        ? 'border-danger focus-within:ring-danger/15'
                        : 'border-input hover:border-fg-muted/60 focus-within:border-fg-muted focus-within:ring-fg/8',
                )}
            >
                {!isPercent && (
                    <span aria-hidden="true" className="select-none pl-3 text-sm font-medium text-fg-muted">
                        CHF
                    </span>
                )}
                <input
                    id={id}
                    inputMode="decimal"
                    autoComplete="off"
                    spellCheck={false}
                    value={value}
                    aria-invalid={isInvalid || undefined}
                    aria-describedby={describedBy}
                    onChange={(e) => onChange(e.target.value)}
                    onBlur={handleBlur}
                    className="h-full min-w-0 flex-1 bg-transparent px-3 text-[15px] tabular-nums text-fg outline-none placeholder:text-fg-muted focus-visible:outline-none"
                />
                {isPercent && (
                    <span aria-hidden="true" className="select-none text-sm font-medium text-fg-muted">
                        %
                    </span>
                )}
                <button
                    type="button"
                    onClick={() => setShowSlider((s) => !s)}
                    aria-label={`${t('app.toggle_slider')}: ${label}`}
                    aria-expanded={showSlider}
                    aria-controls={`${id}-slider`}
                    className={cn(
                        'mx-1.5 flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                        showSlider
                            ? 'bg-subtle-strong text-fg'
                            : 'text-fg-muted hover:bg-subtle hover:text-fg',
                    )}
                >
                    <SlidersHorizontal className="size-4" />
                </button>
            </div>

            {showSlider && (
                <div id={`${id}-slider`} className="px-1 pb-1 pt-3">
                    <SliderPrimitive.Root
                        className="relative flex h-6 w-full touch-none select-none items-center"
                        value={[Math.min(max, numericValue)]}
                        max={max}
                        min={min}
                        step={step}
                        onValueChange={handleSliderChange}
                    >
                        <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-subtle-strong">
                            <SliderPrimitive.Range className="absolute h-full bg-fg" />
                        </SliderPrimitive.Track>
                        <SliderPrimitive.Thumb
                            aria-label={label}
                            className="block size-6 cursor-grab rounded-full border-2 border-fg bg-surface shadow-sm transition-shadow hover:ring-4 hover:ring-fg/10 active:cursor-grabbing"
                        />
                    </SliderPrimitive.Root>
                </div>
            )}

            {isInvalid && (
                <p id={`${id}-error`} className="flex items-center gap-1 text-xs text-danger">
                    <AlertCircle aria-hidden="true" className="size-3.5 shrink-0" />
                    {t('app.input_error')}
                </p>
            )}
            {warning ? (
                <p id={`${id}-warning`} className="flex items-start gap-1 text-xs leading-relaxed text-warning">
                    <AlertCircle aria-hidden="true" className="mt-px size-3.5 shrink-0" />
                    {warning}
                </p>
            ) : null}
            {hint ? (
                <p id={`${id}-hint`} className="text-xs leading-relaxed text-fg-muted">
                    {hint}
                </p>
            ) : null}
        </div>
    )
}
