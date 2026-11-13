import { createPortal } from 'react-dom'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Printer, X } from 'lucide-react'
import { useLanguage } from '../i18n/useLanguage'
import { PrintReport, type ReportData } from './PrintReport'
import { Button } from './ui'

// Paper preview plus the print trigger. A second copy of the sheet lives in
// #print-root, which is the only thing the print stylesheet keeps, so Ctrl+P
// yields the same document whether or not this dialog is open.
export function PrintDialog({ isOpen, onClose, data }: { isOpen: boolean; onClose: () => void; data: ReportData }) {
    const { t } = useLanguage()
    const printRoot = document.getElementById('print-root')

    return (
        <>
            {printRoot && createPortal(<PrintReport data={data} />, printRoot)}

            <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
                <DialogPrimitive.Portal>
                    <DialogPrimitive.Overlay className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 animate-fade-in sm:items-center sm:p-4">
                        <DialogPrimitive.Content className="flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-card bg-background shadow-pop outline-none animate-pop-in sm:max-w-[800px] sm:rounded-card">
                            <div className="flex items-start justify-between gap-4 bg-surface px-5 pb-4 pt-[18px] shadow-[0_1px_0_var(--border)]">
                                <div className="min-w-0">
                                    <DialogPrimitive.Title className="t-card-title text-fg">{t('print.dialog_title')}</DialogPrimitive.Title>
                                    <DialogPrimitive.Description className="t-caption mt-0.5 text-fg-muted">
                                        {t('print.dialog_desc')}
                                    </DialogPrimitive.Description>
                                </div>
                                <DialogPrimitive.Close asChild>
                                    <Button variant="plain" size="icon-sm" className="-mr-1.5 -mt-0.5" aria-label={t('wizard.btn_close')}>
                                        <X />
                                    </Button>
                                </DialogPrimitive.Close>
                            </div>

                            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
                                <PrintReport data={data} className="mx-auto max-w-[720px] overflow-hidden rounded-item shadow-card" />
                            </div>

                            <div className="flex items-center justify-between gap-3 border-t border-border bg-surface px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
                                <p className="t-caption hidden text-fg-muted sm:block">{t('print.dialog_hint')}</p>
                                <Button variant="primary" className="max-sm:w-full" onClick={() => window.print()}>
                                    <Printer aria-hidden="true" />
                                    {t('print.btn_print')}
                                </Button>
                            </div>
                        </DialogPrimitive.Content>
                    </DialogPrimitive.Overlay>
                </DialogPrimitive.Portal>
            </DialogPrimitive.Root>
        </>
    )
}
