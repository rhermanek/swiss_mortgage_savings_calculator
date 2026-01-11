import * as React from 'react'
import { format, addMonths, subMonths, setMonth, setYear, getYear, getMonth } from 'date-fns'
import { de } from 'date-fns/locale'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { CalendarClock, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../lib/utils'

type MonthPickerProps = {
    value: string // yyyy-mm
    onChange: (value: string) => void
    label?: string
    className?: string
}


export function MonthPicker({ value, onChange, label, className }: MonthPickerProps) {
    const [open, setOpen] = React.useState(false)

    // Parse current value or fallback to today
    const dateValue = React.useMemo(() => {
        if (!value) return new Date()
        const [y, m] = value.split('-').map(Number)
        if (!y || !m) return new Date()
        return new Date(y, m - 1, 1)
    }, [value])

    // View state (which year we are looking at in the picker)
    const [viewDate, setViewDate] = React.useState(dateValue)

    // Sync view date when opening
    React.useEffect(() => {
        if (open) {
            setViewDate(dateValue)
        }
    }, [open, dateValue])

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
        <div className={cn("space-y-1.5", className)}>
            {label && (
                <label className="text-sm font-medium text-slate-800">
                    {label}
                </label>
            )}
            <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
                <PopoverPrimitive.Trigger asChild>
                    <button
                        className={cn(
                            "flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 text-[15px] text-slate-900 shadow-sm outline-none transition",
                            "hover:bg-slate-50 focus:border-slate-300 focus:ring-4 focus:ring-slate-100",
                            "disabled:bg-slate-50 disabled:text-slate-500"
                        )}
                    >
                        <span className="flex items-center gap-2">
                            <CalendarClock className="h-4 w-4 text-slate-400" />
                            <span>
                                {value ? format(dateValue, 'MMMM yyyy', { locale: de }) : <span className="text-slate-400">Datum wählen</span>}
                            </span>
                        </span>
                    </button>
                </PopoverPrimitive.Trigger>
                <PopoverPrimitive.Portal>
                    <PopoverPrimitive.Content
                        align="start"
                        className="z-50 w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                    >
                        <div className="flex items-center justify-between mb-4 px-1">
                            <button
                                onClick={prevYear}
                                className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <div className="font-semibold text-slate-900">
                                {currentYear}
                            </div>
                            <button
                                onClick={nextYear}
                                className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {months.map(m => {
                                const isSelected = getYear(dateValue) === currentYear && getMonth(dateValue) === m
                                const monthName = format(new Date(2000, m, 1), 'MMM', { locale: de })
                                return (
                                    <button
                                        key={m}
                                        onClick={() => handleMonthSelect(m)}
                                        className={cn(
                                            "rounded-lg px-2 py-2 text-sm font-medium transition",
                                            isSelected
                                                ? "bg-slate-900 text-white shadow-sm"
                                                : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                                        )}
                                    >
                                        {monthName}
                                    </button>
                                )
                            })}
                        </div>
                    </PopoverPrimitive.Content>
                </PopoverPrimitive.Portal>
            </PopoverPrimitive.Root>
        </div>
    )
}
