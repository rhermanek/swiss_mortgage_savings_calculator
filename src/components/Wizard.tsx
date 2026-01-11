import { useState, useEffect } from "react"
import { ChevronRight, Check, X } from "lucide-react"
import { SliderInput } from "./SliderInput"
import { MonthPicker } from "./MonthPicker"

export type WizardValues = {
    kaufpreis: string
    zielMonat: string
    barvermoegen: string
    saeule3a: string
    pensionskasse: string
    andereVermoegen: string
    saeule3aMonatlich: string
    pensionskasseMonatlich: string
}

type WizardProps = {
    isOpen: boolean
    onClose: () => void
    onComplete: (values: WizardValues) => void
    initialValues: WizardValues
}

export function Wizard({ isOpen, onClose, onComplete, initialValues }: WizardProps) {
    const [step, setStep] = useState(0)
    const [values, setValues] = useState<WizardValues>(initialValues)

    // Reset internal state when opening
    useEffect(() => {
        if (isOpen) {
            setValues(initialValues)
            setStep(0)
        }
    }, [isOpen, initialValues])

    if (!isOpen) return null

    const handleNext = () => setStep((s) => s + 1)
    const handleBack = () => setStep((s) => s - 1)

    const handleFinish = () => {
        onComplete(values)
        onClose()
    }

    const updateValue = (key: keyof WizardValues, val: string) => {
        setValues((prev) => ({ ...prev, [key]: val }))
    }

    const steps = [
        {
            title: "Willkommen",
            description: "Lassen Sie uns gemeinsam Ihre Eigenmittel berechnen. Dieser Assistent führt Sie Schritt für Schritt durch die wichtigsten Angaben.",
            content: (
                <div className="space-y-4 text-slate-600 dark:text-slate-400">
                    <p>
                        Wir werden gemeinsam folgende Punkte durchgehen:
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Ihr Wunsch-Kaufobjekt und den Zeitrahmen</li>
                        <li>Ihr aktuelles Vermögen (Eigenkapital)</li>
                        <li>Ihre monatlichen Sparmöglichkeiten</li>
                    </ul>
                    <p>
                        Am Ende erhalten Sie eine detaillierte Auswertung und einen Sparplan.
                    </p>
                </div>
            ),
        },
        {
            title: "Das Ziel",
            description: "Wie teuer darf das Traumhaus sein und wann möchten Sie es kaufen?",
            content: (
                <div className="space-y-8">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-sm text-blue-800 dark:text-blue-200">
                        Der Kaufpreis bestimmt, wie viel Eigenmittel (mind. 20%) Sie benötigen. Das Datum bestimmt, wie viel Zeit Ihnen zum Sparen bleibt.
                    </div>
                    <SliderInput
                        id="wiz-kaufpreis"
                        label="Geschätzter Kaufpreis (CHF)"
                        value={values.kaufpreis}
                        onChange={(v) => updateValue("kaufpreis", v)}
                        max={3000000}
                        step={10000}
                    />
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            Geplantes Kaufdatum
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
            title: "Vorhandenes Vermögen",
            description: "Was bringen Sie bereits mit?",
            content: (
                <div className="space-y-8">
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl text-sm text-amber-800 dark:text-amber-200">
                        Wichtig: Mindestens 10% des Kaufpreises müssen "harte" Eigenmittel sein (Sparguthaben, 3a, etc.). Pensionskassen-Guthaben gilt als "weich".
                    </div>
                    <SliderInput
                        id="wiz-bar"
                        label="Barvermögen / Sparkonto"
                        value={values.barvermoegen}
                        onChange={(v) => updateValue("barvermoegen", v)}
                        max={500000}
                        step={1000}
                    />
                    <SliderInput
                        id="wiz-3a"
                        label="Guthaben Säule 3a"
                        value={values.saeule3a}
                        onChange={(v) => updateValue("saeule3a", v)}
                        max={200000}
                        step={1000}
                    />
                    <SliderInput
                        id="wiz-pk"
                        label="Pensionskasse (Vorbezug oder Verpfändung)"
                        value={values.pensionskasse}
                        onChange={(v) => updateValue("pensionskasse", v)}
                        max={500000}
                        step={1000}
                    />
                </div>
            )
        },
        {
            title: "Monatliches Sparen",
            description: "Wie viel können Sie bis zum Kaufdatum monatlich zur Seite legen?",
            content: (
                <div className="space-y-8">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl text-sm text-emerald-800 dark:text-emerald-200">
                        Regelmäßige Einzahlungen in die Säule 3a nebst anderen Sparmassnahmen helfen, das Ziel schneller zu erreichen.
                    </div>
                    <SliderInput
                        id="wiz-3a-mt"
                        label="Monatlich in Säule 3a"
                        value={values.saeule3aMonatlich}
                        onChange={(v) => updateValue("saeule3aMonatlich", v)}
                        max={3000}
                        step={50}
                    />
                    <SliderInput
                        id="wiz-pk-mt"
                        label="Monatlich in Pensionskasse"
                        value={values.pensionskasseMonatlich}
                        onChange={(v) => updateValue("pensionskasseMonatlich", v)}
                        max={5000}
                        step={50}
                        hint="Dieser Betrag umfasst Ihren Lohnabzug für die Pensionskasse plus den Arbeitgeberbeitrag."
                    />
                </div>
            )
        }
    ]

    const currentStep = steps[step]
    const isLastStep = step === steps.length - 1

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            Schritt {step + 1} von {steps.length}
                        </div>
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
                        Zurück
                    </button>

                    <div className="flex gap-2">
                        {isLastStep ? (
                            <button
                                onClick={handleFinish}
                                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                            >
                                <Check className="w-4 h-4" />
                                Übernehmen
                            </button>
                        ) : (
                            <button
                                onClick={handleNext}
                                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                            >
                                Weiter
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
