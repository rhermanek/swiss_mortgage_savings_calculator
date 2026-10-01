import { useState } from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { RotateCcw } from 'lucide-react'
import { useLanguage } from '../i18n/useLanguage'
import { Button } from './ui'

export function ResetButton({ onReset }: { onReset: () => void }) {
    const { t } = useLanguage()
    const [open, setOpen] = useState(false)

    return (
        <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
            <PopoverPrimitive.Trigger asChild>
                <Button variant="ghost" size="sm" className="-mx-2 text-xs">
                    <RotateCcw aria-hidden="true" className="size-3.5!" />
                    {t('app.reset')}
                </Button>
            </PopoverPrimitive.Trigger>
            <PopoverPrimitive.Portal>
                <PopoverPrimitive.Content
                    side="top"
                    align="end"
                    sideOffset={6}
                    collisionPadding={12}
                    className="z-50 w-72 rounded-xl border border-border bg-surface p-4 shadow-lg outline-none animate-pop-in"
                >
                    <p className="text-sm font-semibold text-fg">{t('app.reset_confirm_title')}</p>
                    <p className="mt-1 text-sm leading-relaxed text-fg-muted">{t('app.reset_confirm_desc')}</p>
                    <div className="mt-4 flex justify-end gap-2">
                        <PopoverPrimitive.Close asChild>
                            <Button variant="ghost" size="sm">{t('app.confirm_cancel')}</Button>
                        </PopoverPrimitive.Close>
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={() => {
                                onReset()
                                setOpen(false)
                            }}
                        >
                            {t('app.reset_confirm_yes')}
                        </Button>
                    </div>
                </PopoverPrimitive.Content>
            </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
    )
}
