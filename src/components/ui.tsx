import * as React from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { ChevronDown, Info } from 'lucide-react'
import { cn } from '../lib/utils'
import { popoverClass } from '../lib/styles'

// Shared presentational primitives. Colors come from the semantic tokens in
// index.css so light/dark mode needs no per-component overrides.

// Floating card: surface + card shadow (the 1px ring is part of the shadow).
export function Card({ className, ...props }: React.ComponentProps<'section'>) {
  return <section className={cn('rounded-card bg-surface shadow-card', className)} {...props} />
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
    <div className={cn('flex flex-wrap items-start justify-between gap-x-4 gap-y-3 px-5 pt-[18px]', className)}>
      <div className="flex min-w-0 flex-1 basis-60 items-start gap-3">
        {step != null && <StepBadge step={step} />}
        <div className="min-w-0">
          <h3 id={id} className="t-card-title text-fg">
            {title}
          </h3>
          {description != null && <p className="t-caption mt-0.5 text-fg-muted">{description}</p>}
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
      className="t-pill flex size-5 shrink-0 items-center justify-center rounded-full bg-subtle tabular-nums text-fg-muted"
    >
      {step}
    </span>
  )
}

export function CardBody({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('px-5 pb-5 pt-4', className)} {...props} />
}

export function SectionLabel({ className, ...props }: React.ComponentProps<'h2'>) {
  return <h2 className={cn('section-label', className)} {...props} />
}

// One solid red (primary) button per screen; everything else is a ghost.
type ButtonVariant = 'ghost' | 'outline' | 'primary' | 'danger' | 'plain'
type ButtonSize = 'sm' | 'md' | 'icon' | 'icon-sm'

const buttonVariants: Record<ButtonVariant, string> = {
  ghost: 'bg-subtle text-fg-label hover:bg-border',
  outline: 'text-fg-label shadow-[inset_0_0_0_1px_var(--border-strong)] hover:bg-subtle',
  primary: 'bg-brand text-white hover:bg-brand-hover',
  danger: 'bg-danger-tint text-danger hover:brightness-95 dark:hover:brightness-125',
  plain: 'text-fg-secondary hover:bg-subtle hover:text-fg',
}

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'h-7 gap-1.5 px-3',
  md: 'h-8 gap-1.5 px-3.5',
  icon: 'size-8',
  'icon-sm': 'size-7',
}

export function Button({
  variant = 'ghost',
  size = 'md',
  className,
  type = 'button',
  ...props
}: React.ComponentProps<'button'> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full text-[13px] font-medium transition-colors duration-150',
        'disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-3.5 [&_svg]:shrink-0',
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
// arrow keys move the selection. The selected segment is ink, not red.
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
      className={cn('inline-flex items-center gap-0.5 rounded-full bg-subtle p-0.5 shadow-[inset_0_0_0_1px_var(--border)]', className)}
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
              'inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-medium transition-colors duration-150 [&_svg]:size-3.5 [&_svg]:shrink-0',
              size === 'sm' ? 'h-7 px-3 text-xs' : 'h-8 px-3.5 text-[13px]',
              selected ? 'bg-fg text-surface' : 'text-fg-secondary hover:text-fg',
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
  success: 'bg-success-tint text-success',
  warning: 'bg-warning-tint text-warning-ink',
  danger: 'bg-danger-tint text-danger',
  neutral: 'bg-subtle text-fg-secondary',
}

// Status pill. A colour never stands alone: always pass the word as children.
export function Badge({ tone = 'neutral', className, ...props }: React.ComponentProps<'span'> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        't-pill inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-full px-2.5 [&_svg]:size-3 [&_svg]:shrink-0',
        badgeTones[tone],
        className,
      )}
      {...props}
    />
  )
}

const calloutTones: Record<Exclude<Tone, 'success'>, { box: string; icon: string }> = {
  warning: { box: 'bg-warning-tint', icon: 'text-warning-ink' },
  danger: { box: 'bg-danger-tint', icon: 'text-danger' },
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
    <div className={cn('t-small flex gap-2.5 rounded-item px-3.5 py-3 text-fg-secondary', styles.box, className)}>
      {icon != null && <span className={cn('mt-0.5 shrink-0 [&_svg]:size-4', styles.icon)}>{icon}</span>}
      <div className="min-w-0">
        {title != null && <p className="font-semibold text-fg">{title}</p>}
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
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-subtle hover:text-fg"
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
          className={cn(popoverClass, 't-small w-80 max-w-[calc(100vw-24px)] p-4 text-fg-secondary')}
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
      <summary className="t-small inline-flex cursor-pointer items-center gap-1 rounded-control font-medium text-accent hover:underline hover:underline-offset-2">
        {summary}
        <ChevronDown aria-hidden="true" className="size-3.5 transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  )
}

export function Swatch({ className }: { className: string }) {
  return <span aria-hidden="true" className={cn('inline-block size-2 shrink-0 rounded-full', className)} />
}
