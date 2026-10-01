import { useState } from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { ArrowLeft, ArrowRight, Check, Info, Users, X } from "lucide-react"
import { SliderInput } from "./SliderInput"
import { MonthPicker } from "./MonthPicker"
import { Button, Callout, SegmentedControl } from "./ui"
import { cn } from "../lib/utils"
import { useLanguage } from "../i18n/useLanguage"

export type WizardValues = {
    kaufpreis: string
    zielMonat: string
    barvermoegen: string
    saeule3a: string
    pensionskasse: string
    andereVermoegen: string
    saeule3aMonatlich: string
    pensionskasseMonatlich: string
    sonstigeSparrateMonatlich: string
    person2Active: boolean
    barvermoegen2: string
    saeule3a2: string
    pensionskasse2: string
    andereVermoegen2: string
    saeule3aMonatlich2: string
    pensionskasseMonatlich2: string
    sonstigeSparrateMonatlich2: string
}

type WizardProps = {
    isOpen: boolean
    onClose: () => void
    onComplete: (values: WizardValues) => void
    initialValues: WizardValues
}

export function Wizard({ isOpen, onClose, onComplete, initialValues }: WizardProps) {
    return (
        <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 backdrop-blur-[2px] animate-fade-in sm:items-center sm:p-4">
                    <DialogPrimitive.Content className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-surface shadow-2xl outline-none animate-pop-in sm:max-w-xl sm:rounded-2xl">
                        {/* Content unmounts on close, so each opening starts from the current values */}
                        <WizardContent onClose={onClose} onComplete={onComplete} initialValues={initialValues} />
                    </DialogPrimitive.Content>
                </DialogPrimitive.Overlay>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    )
}

function WizardContent({ onClose, onComplete, initialValues }: Omit<WizardProps, "isOpen">) {
    const { t } = useLanguage()
    const [step, setStep] = useState(0)
    const [values, setValues] = useState<WizardValues>(initialValues)
    const [personTab, setPersonTab] = useState<'1' | '2'>('1')

    const handleNext = () => setStep((s) => s + 1)
    const handleBack = () => setStep((s) => s - 1)

    const handleFinish = () => {
        onComplete(values)
        onClose()
    }

    const updateValue = (key: keyof WizardValues, val: string | boolean) => {
        setValues((prev) => ({ ...prev, [key]: val }))
    }

    const showP2 = values.person2Active && personTab === '2'

    const partnerToggle = (
        <button
            type="button"
            role="switch"
            aria-checked={values.person2Active}
            onClick={() => {
                const next = !values.person2Active
                updateValue("person2Active", next)
                if (!next) setPersonTab('1')
            }}
            className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-left text-sm font-medium text-fg transition-colors hover:bg-subtle"
        >
            <Users aria-hidden="true" className="size-4 shrink-0 text-fg-muted" />
            <span className="flex-1">{t('wizard.toggle_partner')}</span>
            <span
                aria-hidden="true"
                className={cn(
                    'relative h-5 w-9 shrink-0 rounded-full transition-colors',
                    values.person2Active ? 'bg-primary' : 'bg-subtle-strong',
                )}
            >
                <span
                    className={cn(
                        'absolute top-0.5 size-4 rounded-full bg-surface shadow transition-transform',
                        values.person2Active ? 'translate-x-4.5' : 'translate-x-0.5',
                    )}
                />
            </span>
        </button>
    )

    const personTabs = values.person2Active ? (
        <SegmentedControl<'1' | '2'>
            className="w-full"
            ariaLabel={t('app.person_switch_label')}
            value={personTab}
            onChange={setPersonTab}
            options={[
                { value: '1', label: t('wizard.person1_label') },
                { value: '2', label: t('wizard.partner_section') },
            ]}
        />
    ) : null

    const steps = [
        {
            title: t('wizard.step_1_title'),
            description: t('wizard.step_1_desc'),
            content: (
                <div className="space-y-4 text-sm text-fg-secondary">
                    <p>{t('wizard.step_1_text')}</p>
                    <ol className="space-y-2">
                        {[t('wizard.step_1_li_1'), t('wizard.step_1_li_2'), t('wizard.step_1_li_3')].map((item, i) => (
                            <li key={item} className="flex items-center gap-3 rounded-xl bg-subtle px-3.5 py-3 text-fg">
                                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-semibold tabular-nums text-fg-secondary ring-1 ring-border">
                                    {i + 1}
                                </span>
                                {item}
                            </li>
                        ))}
                    </ol>
                    <p>{t('wizard.step_1_end')}</p>
                </div>
            ),
        },
        {
            title: t('wizard.step_2_title'),
            description: t('wizard.step_2_desc'),
            content: (
                <div className="space-y-6">
                    <Callout icon={<Info />}>{t('wizard.step_2_info')}</Callout>
                    <SliderInput
                        id="wiz-kaufpreis"
                        label={t('wizard.label_kaufpreis')}
                        value={values.kaufpreis}
                        onChange={(v) => updateValue("kaufpreis", v)}
                        max={3000000}
                        step={10000}
                    />
                    <div className="space-y-1.5">
                        <label htmlFor="wiz-datum" className="text-sm font-medium text-fg">
                            {t('wizard.label_datum')}
                        </label>
                        <MonthPicker
                            id="wiz-datum"
                            value={values.zielMonat}
                            onChange={(v) => updateValue("zielMonat", v)}
                        />
                    </div>
                </div>
            ),
        },
        {
            title: t('wizard.step_3_title'),
            description: t('wizard.step_3_desc'),
            content: (
                <div className="space-y-6">
                    <Callout icon={<Info />}>{t('wizard.step_3_info')}</Callout>
                    {partnerToggle}
                    {personTabs}
                    <SliderInput
                        key={`bar-${personTab}`}
                        id={showP2 ? 'wiz-bar2' : 'wiz-bar'}
                        label={t('wizard.label_bar')}
                        value={showP2 ? values.barvermoegen2 : values.barvermoegen}
                        onChange={(v) => updateValue(showP2 ? "barvermoegen2" : "barvermoegen", v)}
                        max={500000}
                        step={1000}
                    />
                    <SliderInput
                        key={`3a-${personTab}`}
                        id={showP2 ? 'wiz-3a2' : 'wiz-3a'}
                        label={t('wizard.label_3a')}
                        value={showP2 ? values.saeule3a2 : values.saeule3a}
                        onChange={(v) => updateValue(showP2 ? "saeule3a2" : "saeule3a", v)}
                        max={200000}
                        step={1000}
                    />
                    <SliderInput
                        key={`pk-${personTab}`}
                        id={showP2 ? 'wiz-pk2' : 'wiz-pk'}
                        label={t('wizard.label_pk')}
                        value={showP2 ? values.pensionskasse2 : values.pensionskasse}
                        onChange={(v) => updateValue(showP2 ? "pensionskasse2" : "pensionskasse", v)}
                        max={1000000}
                        step={1000}
                    />
                </div>
            )
        },
        {
            title: t('wizard.step_4_title'),
            description: t('wizard.step_4_desc'),
            content: (
                <div className="space-y-6">
                    <Callout icon={<Info />}>{t('wizard.step_4_info')}</Callout>
                    {personTabs}
                    <SliderInput
                        key={`3a-mt-${personTab}`}
                        id={showP2 ? 'wiz-3a-mt2' : 'wiz-3a-mt'}
                        label={t('wizard.label_3a_monthly')}
                        value={showP2 ? values.saeule3aMonatlich2 : values.saeule3aMonatlich}
                        onChange={(v) => updateValue(showP2 ? "saeule3aMonatlich2" : "saeule3aMonatlich", v)}
                        max={3000}
                        step={50}
                    />
                    <SliderInput
                        key={`pk-mt-${personTab}`}
                        id={showP2 ? 'wiz-pk-mt2' : 'wiz-pk-mt'}
                        label={t('wizard.label_pk_monthly')}
                        value={showP2 ? values.pensionskasseMonatlich2 : values.pensionskasseMonatlich}
                        onChange={(v) => updateValue(showP2 ? "pensionskasseMonatlich2" : "pensionskasseMonatlich", v)}
                        max={5000}
                        step={50}
                        hint={t('wizard.hint_pk_monthly')}
                    />
                    <SliderInput
                        key={`other-mt-${personTab}`}
                        id={showP2 ? 'wiz-other-mt2' : 'wiz-other-mt'}
                        label={t('wizard.label_other_monthly')}
                        value={showP2 ? values.sonstigeSparrateMonatlich2 : values.sonstigeSparrateMonatlich}
                        onChange={(v) => updateValue(showP2 ? "sonstigeSparrateMonatlich2" : "sonstigeSparrateMonatlich", v)}
                        max={20000}
                        step={50}
                        hint={t('wizard.hint_other_monthly')}
                    />
                </div>
            )
        }
    ]

    const currentStep = steps[step]
    const isLastStep = step === steps.length - 1

    return (
        <>
            {/* Header */}
            <div className="px-6 pt-5">
                <div className="flex items-center justify-between gap-4">
                    <p className="text-xs font-medium tabular-nums text-fg-muted">
                        {t('wizard.step_progress', { current: step + 1, total: steps.length })}
                    </p>
                    <DialogPrimitive.Close asChild>
                        <Button variant="ghost" size="icon-sm" className="-mr-2" aria-label={t('wizard.btn_close')}>
                            <X />
                        </Button>
                    </DialogPrimitive.Close>
                </div>
                <div className="mt-3 flex gap-1.5" aria-hidden="true">
                    {steps.map((_, i) => (
                        <span
                            key={i}
                            className={cn('h-1 flex-1 rounded-full transition-colors', i <= step ? 'bg-brand' : 'bg-subtle-strong')}
                        />
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 pt-5">
                <DialogPrimitive.Title className="text-xl font-semibold tracking-tight text-fg">
                    {currentStep.title}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="mt-1 text-sm text-fg-muted">
                    {currentStep.description}
                </DialogPrimitive.Description>
                <div className="mt-6">{currentStep.content}</div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 border-t border-border bg-subtle/50 px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <Button variant="ghost" onClick={handleBack} disabled={step === 0} className={cn(step === 0 && 'invisible')}>
                    <ArrowLeft aria-hidden="true" />
                    {t('wizard.btn_back')}
                </Button>
                {isLastStep ? (
                    <Button variant="primary" onClick={handleFinish}>
                        <Check aria-hidden="true" />
                        {t('wizard.btn_apply')}
                    </Button>
                ) : (
                    <Button variant="primary" onClick={handleNext}>
                        {t('wizard.btn_next')}
                        <ArrowRight aria-hidden="true" />
                    </Button>
                )}
            </div>
        </>
    )
}
