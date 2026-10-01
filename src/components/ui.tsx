import * as React from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { ChevronDown, Info } from 'lucide-react'
import { cn } from '../lib/utils'

// Shared presentational primitives. Colors come from the semantic tokens in
// index.css so light/dark mode needs no per-component overrides.

export function Card({ className, ...props }: React.ComponentProps<'section'>) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-border bg-surface shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
        className,
      )}
      {...props}
    />
  )
}

export function CardHeader({
  id,
  step,
  title,
  description,
  action,
  className,
}: {
  id?: string
  step?: number
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-x-4 gap-y-3 px-5 pt-5 sm:px-6 sm:pt-6', className)}>
      <div className="flex min-w-0 flex-1 basis-60 items-start gap-3">
        {step != null && <StepBadge step={step} />}
        <div className="min-w-0">
          <h2 id={id} className="text-base font-semibold leading-6 tracking-tight text-fg">
            {title}
          </h2>
          {description != null && <p className="mt-0.5 text-sm text-fg-muted">{description}</p>}
        </div>
      </div>
      {action != null && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function StepBadge({ step }: { step: number }) {
  return (
    <span
      aria-hidden="true"
      className="mt-px flex size-6 shrink-0 items-center justify-center rounded-full bg-subtle text-xs font-semibold tabular-nums text-fg-secondary ring-1 ring-inset ring-border"
    >
      {step}
    </span>
  )
}

export function CardBody({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('px-5 pb-5 pt-5 sm:px-6 sm:pb-6', className)} {...props} />
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'icon' | 'icon-sm'

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-fg shadow-sm hover:bg-primary/85',
  secondary:
    'border border-border bg-surface text-fg shadow-[0_1px_2px_rgb(0_0_0/0.04)] hover:bg-subtle',
  ghost: 'text-fg-secondary hover:bg-subtle hover:text-fg',
  danger: 'bg-danger text-white shadow-sm hover:bg-danger/90 dark:text-[#1a0503]',
}

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-sm',
  md: 'h-10 gap-2 rounded-xl px-4 text-sm',
  icon: 'size-9 rounded-lg',
  'icon-sm': 'size-8 rounded-lg',
}

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: React.ComponentProps<'button'> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex shrink-0 items-center justify-center whitespace-nowrap font-medium transition-colors',
        'disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    />
  )
}

type SegmentOption<T extends string> = {
  value: T
  label: React.ReactNode
  icon?: React.ReactNode
  ariaLabel?: string
}

// Radio-group semantics with roving tabindex: Tab focuses the selected option,
// arrow keys move the selection.
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  size = 'md',
  className,
}: {
  value: T
  onChange: (value: T) => void
  options: SegmentOption<T>[]
  ariaLabel: string
  size?: 'sm' | 'md'
  className?: string
}) {
  const refs = React.useRef<Array<HTMLButtonElement | null>>([])

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    const last = options.length - 1
    let next = -1
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = index === last ? 0 : index + 1
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = index === 0 ? last : index - 1
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = last
    if (next < 0) return
    e.preventDefault()
    onChange(options[next].value)
    refs.current[next]?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn('inline-flex items-center gap-0.5 rounded-[10px] bg-subtle p-0.5 ring-1 ring-inset ring-border', className)}
    >
      {options.map((option, index) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            ref={(el) => {
              refs.current[index] = el
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.ariaLabel}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(e) => onKeyDown(e, index)}
            className={cn(
              'inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-medium transition-[color,background-color,box-shadow] [&_svg]:size-3.5 [&_svg]:shrink-0',
              size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-sm',
              selected
                ? 'bg-surface text-fg shadow-[0_1px_2px_rgb(0_0_0/0.08)] ring-1 ring-border dark:bg-subtle-strong'
                : 'text-fg-muted hover:text-fg',
            )}
          >
            {option.icon}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

type Tone = 'success' | 'warning' | 'danger' | 'neutral'

const badgeTones: Record<Tone, string> = {
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  neutral: 'bg-subtle text-fg-secondary',
}

export function Badge({ tone = 'neutral', className, ...props }: React.ComponentProps<'span'> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium [&_svg]:size-3.5 [&_svg]:shrink-0',
        badgeTones[tone],
        className,
      )}
      {...props}
    />
  )
}

const calloutTones: Record<Exclude<Tone, 'success'>, { box: string; icon: string }> = {
  warning: { box: 'bg-warning-soft', icon: 'text-warning' },
  danger: { box: 'bg-danger-soft', icon: 'text-danger' },
  neutral: { box: 'bg-subtle', icon: 'text-fg-muted' },
}

export function Callout({
  tone = 'neutral',
  icon,
  title,
  children,
  className,
}: {
  tone?: Exclude<Tone, 'success'>
  icon?: React.ReactNode
  title?: React.ReactNode
  children?: React.ReactNode
  className?: string
}) {
  const styles = calloutTones[tone]
  return (
    <div className={cn('flex gap-3 rounded-xl p-3.5 text-sm leading-relaxed text-fg-secondary', styles.box, className)}>
      {icon != null && <span className={cn('mt-0.5 shrink-0 [&_svg]:size-4', styles.icon)}>{icon}</span>}
      <div className="min-w-0">
        {title != null && <p className="font-medium text-fg">{title}</p>}
        {children}
      </div>
    </div>
  )
}

export function InfoPopover({
  label,
  children,
  align = 'start',
}: {
  label: string
  children: React.ReactNode
  align?: 'start' | 'center' | 'end'
}) {
  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label={label}
          className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-subtle hover:text-fg"
        >
          <Info className="size-3.5" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          side="bottom"
          align={align}
          sideOffset={6}
          collisionPadding={12}
          className="z-50 w-80 max-w-[calc(100vw-24px)] rounded-xl border border-border bg-surface p-4 text-sm text-fg-secondary shadow-lg outline-none animate-pop-in"
        >
          {children}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

export function Disclosure({
  summary,
  children,
  className,
}: {
  summary: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <details className={cn('group', className)}>
      <summary className="inline-flex cursor-pointer items-center gap-1 rounded-md text-sm font-medium text-fg-secondary transition-colors hover:text-fg">
        {summary}
        <ChevronDown aria-hidden="true" className="size-4 transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  )
}

export function Swatch({ className }: { className: string }) {
  return <span aria-hidden="true" className={cn('inline-block size-2.5 shrink-0 rounded-[3px]', className)} />
}
