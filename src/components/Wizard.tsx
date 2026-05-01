import { useState } from "react"
import { ChevronRight, Check, X, Users } from "lucide-react"
import { SliderInput } from "./SliderInput"
import { MonthPicker } from "./MonthPicker"
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
    if (!isOpen) return null
    return (
        <WizardContent
            onClose={onClose}
            onComplete={onComplete}
            initialValues={initialValues}
        />
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

    const partnerToggle = (
        <button
            type="button"
            onClick={() => {
                const next = !values.person2Active
                updateValue("person2Active", next)
                if (!next) setPersonTab('1')
            }}
            className={`flex items-center gap-2 w-full px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                values.person2Active
                    ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                    : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400 hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20'
            }`}
        >
            <Users className="w-4 h-4 shrink-0" />
            <span className="flex-1 text-left">{t('wizard.toggle_partner')}</span>
            <div className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${values.person2Active ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${values.person2Active ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
        </button>
    )

    const tabBase = 'flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors'
    const tabActive = 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
    const tabInactive = 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
    const personTabsEl = (
        <div role="tablist" className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800/60 p-1">
            <button
                type="button"
                role="tab"
                aria-selected={personTab === '1'}
                onClick={() => setPersonTab('1')}
                className={`${tabBase} ${personTab === '1' ? tabActive : tabInactive}`}
            >
                {t('wizard.person1_label')}
            </button>
            <button
                type="button"
                role="tab"
                aria-selected={personTab === '2'}
                onClick={() => setPersonTab('2')}
                className={`${tabBase} ${personTab === '2' ? tabActive : tabInactive}`}
            >
                {t('wizard.partner_section')}
            </button>
        </div>
    )

    const steps = [
        {
            title: t('wizard.step_1_title'),
            description: t('wizard.step_1_desc'),
            content: (
                <div className="space-y-4 text-slate-600 dark:text-slate-400">
                    <p>{t('wizard.step_1_text')}</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>{t('wizard.step_1_li_1')}</li>
                        <li>{t('wizard.step_1_li_2')}</li>
                        <li>{t('wizard.step_1_li_3')}</li>
                    </ul>
                    <p>{t('wizard.step_1_end')}</p>
                </div>
            ),
        },
        {
            title: t('wizard.step_2_title'),
            description: t('wizard.step_2_desc'),
            content: (
                <div className="space-y-8">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-sm text-blue-800 dark:text-blue-200">
                        {t('wizard.step_2_info')}
                    </div>
                    <SliderInput
                        id="wiz-kaufpreis"
                        label={t('wizard.label_kaufpreis')}
                        value={values.kaufpreis}
                        onChange={(v) => updateValue("kaufpreis", v)}
                        max={3000000}
                        step={10000}
                    />
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            {t('wizard.label_datum')}
                        </label>
                        <MonthPicker
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
                <div className="space-y-8">
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl text-sm text-amber-800 dark:text-amber-200">
                        {t('wizard.step_3_info')}
                    </div>
                    {partnerToggle}
                    {values.person2Active && personTabsEl}
                    {personTab === '1' || !values.person2Active ? (
                        <>
                            <SliderInput
                                id="wiz-bar"
                                label={t('wizard.label_bar')}
                                value={values.barvermoegen}
                                onChange={(v) => updateValue("barvermoegen", v)}
                                max={500000}
                                step={1000}
                            />
                            <SliderInput
                                id="wiz-3a"
                                label={t('wizard.label_3a')}
                                value={values.saeule3a}
                                onChange={(v) => updateValue("saeule3a", v)}
                                max={200000}
                                step={1000}
                            />
                            <SliderInput
                                id="wiz-pk"
                                label={t('wizard.label_pk')}
                                value={values.pensionskasse}
                                onChange={(v) => updateValue("pensionskasse", v)}
                                max={500000}
                                step={1000}
                            />
                        </>
                    ) : (
                        <>
                            <SliderInput
                                id="wiz-bar2"
                                label={t('wizard.label_bar')}
                                value={values.barvermoegen2}
                                onChange={(v) => updateValue("barvermoegen2", v)}
                                max={500000}
                                step={1000}
                            />
                            <SliderInput
                                id="wiz-3a2"
                                label={t('wizard.label_3a')}
                                value={values.saeule3a2}
                                onChange={(v) => updateValue("saeule3a2", v)}
                                max={200000}
                                step={1000}
                            />
                            <SliderInput
                                id="wiz-pk2"
                                label={t('wizard.label_pk')}
                                value={values.pensionskasse2}
                                onChange={(v) => updateValue("pensionskasse2", v)}
                                max={500000}
                                step={1000}
                            />
                        </>
                    )}
                </div>
            )
        },
        {
            title: t('wizard.step_4_title'),
            description: t('wizard.step_4_desc'),
            content: (
                <div className="space-y-8">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl text-sm text-emerald-800 dark:text-emerald-200">
                        {t('wizard.step_4_info')}
                    </div>
                    {values.person2Active && personTabsEl}
                    {personTab === '1' || !values.person2Active ? (
                        <>
                            <SliderInput
                                id="wiz-3a-mt"
                                label={t('wizard.label_3a_monthly')}
                                value={values.saeule3aMonatlich}
                                onChange={(v) => updateValue("saeule3aMonatlich", v)}
                                max={3000}
                                step={50}
                            />
                            <SliderInput
                                id="wiz-pk-mt"
                                label={t('wizard.label_pk_monthly')}
                                value={values.pensionskasseMonatlich}
                                onChange={(v) => updateValue("pensionskasseMonatlich", v)}
                                max={5000}
                                step={50}
                                hint={t('wizard.hint_pk_monthly')}
                            />
                            <SliderInput
                                id="wiz-other-mt"
                                label={t('wizard.label_other_monthly')}
                                value={values.sonstigeSparrateMonatlich}
                                onChange={(v) => updateValue("sonstigeSparrateMonatlich", v)}
                                max={20000}
                                step={50}
                                hint={t('wizard.hint_other_monthly')}
                            />
                        </>
                    ) : (
                        <>
                            <SliderInput
                                id="wiz-3a-mt2"
                                label={t('wizard.label_3a_monthly')}
                                value={values.saeule3aMonatlich2}
                                onChange={(v) => updateValue("saeule3aMonatlich2", v)}
                                max={3000}
                                step={50}
                            />
                            <SliderInput
                                id="wiz-pk-mt2"
                                label={t('wizard.label_pk_monthly')}
                                value={values.pensionskasseMonatlich2}
                                onChange={(v) => updateValue("pensionskasseMonatlich2", v)}
                                max={5000}
                                step={50}
                                hint={t('wizard.hint_pk_monthly')}
                            />
                            <SliderInput
                                id="wiz-other-mt2"
                                label={t('wizard.label_other_monthly')}
                                value={values.sonstigeSparrateMonatlich2}
                                onChange={(v) => updateValue("sonstigeSparrateMonatlich2", v)}
                                max={20000}
                                step={50}
                                hint={t('wizard.hint_other_monthly')}
                            />
                        </>
                    )}
                </div>
            )
        }
    ]

    const currentStep = steps[step]
    const isLastStep = step === steps.length - 1

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        {t('wizard.step_progress', { current: step + 1, total: steps.length })}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">
                        {currentStep.title}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-8">
                        {currentStep.description}
                    </p>
                    {currentStep.content}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <button
                        onClick={handleBack}
                        disabled={step === 0}
                        className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {t('wizard.btn_back')}
                    </button>
                    <div className="flex gap-2">
                        {isLastStep ? (
                            <button
                                onClick={handleFinish}
                                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                            >
                                <Check className="w-4 h-4" />
                                {t('wizard.btn_apply')}
                            </button>
                        ) : (
                            <button
                                onClick={handleNext}
                                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                            >
                                {t('wizard.btn_next')}
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
