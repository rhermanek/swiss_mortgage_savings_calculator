import * as React from 'react'
import { format, addMonths, subMonths, setMonth, setYear, getYear, getMonth } from 'date-fns'
import { de, enUS } from 'date-fns/locale'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../lib/utils'
import { fieldClass, popoverClass } from '../lib/styles'
import { useLanguage } from '../i18n/useLanguage'

type MonthPickerProps = {
    id?: string
    value: string // yyyy-mm
    onChange: (value: string) => void
    hasError?: boolean
    describedBy?: string
    className?: string
}

export function MonthPicker({ id, value, onChange, hasError, describedBy, className }: MonthPickerProps) {
    const { language, t } = useLanguage()
    const [open, setOpen] = React.useState(false)

    const currentLocale = language === 'en' ? enUS : de

    // Parse current value or fallback to today
    const dateValue = React.useMemo(() => {
        if (!value) return new Date()
        const [y, m] = value.split('-').map(Number)
        if (!y || !m) return new Date()
        return new Date(y, m - 1, 1)
    }, [value])

    const [viewDate, setViewDate] = React.useState(dateValue)

    const handleOpenChange = (next: boolean) => {
        setOpen(next)
        if (next) setViewDate(dateValue)
    }

    const now = new Date()
    const thisYear = now.getFullYear()
    const thisMonth = now.getMonth()

    const nextYear = () => setViewDate(d => addMonths(d, 12))
    const prevYear = () => setViewDate(d => subMonths(d, 12))

    const handleMonthSelect = (monthIndex: number) => {
        const newDate = setMonth(setYear(dateValue, getYear(viewDate)), monthIndex)
        const yyyy = getYear(newDate)
        const mm = String(getMonth(newDate) + 1).padStart(2, '0')
        onChange(`${yyyy}-${mm}`)
        setOpen(false)
    }

    const months = Array.from({ length: 12 }, (_, i) => i)
    const currentYear = getYear(viewDate)

    return (
        <PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange}>
            <PopoverPrimitive.Trigger asChild>
                <button
                    id={id}
                    type="button"
                    aria-describedby={describedBy}
                    aria-invalid={hasError || undefined}
                    className={cn(
                        'flex w-full items-center justify-between gap-2 px-3 text-left text-sm font-medium text-fg',
                        fieldClass(hasError),
                        className,
                    )}
                >
                    <span className="flex min-w-0 items-center gap-2">
                        <CalendarDays aria-hidden="true" className="size-4 shrink-0 text-fg-muted" />
                        <span className="truncate">
                            {value ? format(dateValue, 'MMMM yyyy', { locale: currentLocale }) : <span className="text-fg-faint">{t('app.picker_placeholder')}</span>}
                        </span>
                    </span>
                    <ChevronDown aria-hidden="true" className={cn('size-4 shrink-0 text-fg-muted transition-transform', open && 'rotate-180')} />
                </button>
            </PopoverPrimitive.Trigger>
            <PopoverPrimitive.Portal>
                <PopoverPrimitive.Content
                    align="start"
                    sideOffset={6}
                    collisionPadding={12}
                    className={cn(popoverClass, 'w-72 p-3')}
                >
                    <div className="mb-3 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={prevYear}
                            disabled={currentYear <= thisYear}
                            aria-label={t('app.picker_prev_year')}
                            className="flex size-8 items-center justify-center rounded-full text-fg-secondary transition-colors hover:bg-subtle hover:text-fg disabled:pointer-events-none disabled:opacity-45"
                        >
                            <ChevronLeft className="size-4" />
                        </button>
                        <div className="t-small font-semibold tabular-nums text-fg" aria-live="polite">
                            {currentYear}
                        </div>
                        <button
                            type="button"
                            onClick={nextYear}
                            aria-label={t('app.picker_next_year')}
                            className="flex size-8 items-center justify-center rounded-full text-fg-secondary transition-colors hover:bg-subtle hover:text-fg"
                        >
                            <ChevronRight className="size-4" />
                        </button>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                        {months.map(m => {
                            const isSelected = getYear(dateValue) === currentYear && getMonth(dateValue) === m
                            const isPast = currentYear < thisYear || (currentYear === thisYear && m < thisMonth)
                            const monthDate = new Date(currentYear, m, 1)
                            return (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => handleMonthSelect(m)}
                                    disabled={isPast && !isSelected}
                                    aria-pressed={isSelected}
                                    aria-label={format(monthDate, 'MMMM yyyy', { locale: currentLocale })}
                                    className={cn(
                                        't-small h-8 rounded-full font-medium transition-colors',
                                        'disabled:pointer-events-none disabled:opacity-45',
                                        isSelected
                                            ? 'bg-fg text-surface'
                                            : 'text-fg-secondary hover:bg-subtle hover:text-fg',
                                    )}
                                >
                                    {format(monthDate, 'MMM', { locale: currentLocale })}
                                </button>
                            )
                        })}
                    </div>
                </PopoverPrimitive.Content>
            </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
    )
}
