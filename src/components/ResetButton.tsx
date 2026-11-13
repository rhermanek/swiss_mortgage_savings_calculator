import { useState } from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { RotateCcw } from 'lucide-react'
import { useLanguage } from '../i18n/useLanguage'
import { cn } from '../lib/utils'
import { popoverClass } from '../lib/styles'
import { Button } from './ui'

export function ResetButton({ onReset }: { onReset: () => void }) {
    const { t } = useLanguage()
    const [open, setOpen] = useState(false)

    return (
        <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
            <PopoverPrimitive.Trigger asChild>
                <Button variant="plain" size="sm" className="-mx-3">
                    <RotateCcw aria-hidden="true" />
                    {t('app.reset')}
                </Button>
            </PopoverPrimitive.Trigger>
            <PopoverPrimitive.Portal>
                <PopoverPrimitive.Content
                    side="top"
                    align="end"
                    sideOffset={6}
                    collisionPadding={12}
                    className={cn(popoverClass, 'w-72 p-4')}
                >
                    <p className="t-card-title text-fg">{t('app.reset_confirm_title')}</p>
                    <p className="t-small mt-1 text-fg-muted">{t('app.reset_confirm_desc')}</p>
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
