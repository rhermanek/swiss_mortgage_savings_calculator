import { cn } from './utils'

// Class recipes shared by components that cannot share a wrapper element.

// Frame for text inputs and input-like triggers.
export function fieldClass(invalid?: boolean) {
  return cn(
    'h-10 rounded-control border bg-surface transition-[border-color] duration-150',
    invalid ? 'border-danger' : 'border-border-strong hover:border-fg-faint',
  )
}

export const popoverClass = 'z-50 rounded-item bg-surface shadow-pop outline-none animate-pop-in'
