import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Coins,
  Landmark,
  PiggyBank,
  Wallet,
  Wand2,
} from 'lucide-react'
import { DonutChart } from './components/DonutChart'
import { GrowthChart } from './components/GrowthChart'
import { MonthPicker } from './components/MonthPicker'
import { SliderInput } from './components/SliderInput'
import { ThemeProvider } from './components/ThemeProvider'
import { ThemeToggle } from './components/ThemeToggle'
import { Wizard, type WizardValues } from './components/Wizard'
import logoUrl from './assets/logo.png'
import { LanguageProvider, useLanguage } from './i18n/LanguageContext'
import { LanguageSwitcher } from './components/LanguageSwitcher'

// Helper utilities
function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0
  return Math.min(1, Math.max(0, n))
}

function roundTo2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

function parseMoney(raw: string): number {
  const trimmed = raw.trim()
  if (!trimmed) return 0

  const normalized = trimmed
    .replaceAll('’', "'")
    .replaceAll(' ', '')
    .replaceAll("'", '')
    .replace(/[^\d,.\-]/g, '')

  const hasDot = normalized.includes('.')
  const hasComma = normalized.includes(',')

  let numStr = normalized
  if (hasDot && hasComma) {
    numStr = numStr.replaceAll(',', '')
  } else if (!hasDot && hasComma) {
    numStr = numStr.replaceAll(',', '.')
  }

  const n = Number.parseFloat(numStr)
  return Number.isFinite(n) ? Math.max(0, n) : 0
}

function formatCHF(value: number, opts?: { decimals?: number }) {
  const decimals = opts?.decimals ?? 2
  const fmt = new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)

  return fmt.replaceAll('’', "'").replaceAll('\u00A0', ' ')
}

function monthsBetweenNowAndTargetMonth(targetYYYYMM: string): number {
  if (!targetYYYYMM) return 0
  const [yyyyStr, mmStr] = targetYYYYMM.split('-')
  const year = Number(yyyyStr)
  const monthIndex = Number(mmStr) - 1
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex)) return 0
  if (monthIndex < 0 || monthIndex > 11) return 0

  const now = new Date()
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const target = new Date(year, monthIndex, 1)

  const months =
    (target.getFullYear() - startOfCurrentMonth.getFullYear()) * 12 +
    (target.getMonth() - startOfCurrentMonth.getMonth())

  return Math.max(0, months)
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function Card(props: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cx(
        'rounded-2xl border border-slate-200 bg-white shadow-lg',
        props.className,
      )}
    >
      {props.children}
    </div>
  )
}

function CardHeader(props: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cx('border-b border-slate-200 px-5 py-4', props.className)}>
      {props.children}
    </div>
  )
}

function CardContent(props: React.PropsWithChildren<{ className?: string }>) {
  return <div className={cx('px-5 py-6', props.className)}>{props.children}</div>
}

function Label(props: React.PropsWithChildren<{ htmlFor: string }>) {
  return (
    <label htmlFor={props.htmlFor} className="text-sm font-medium text-slate-800 dark:text-slate-200">
      {props.children}
    </label>
  )
}

function Pill({
  tone,
  children,
}: React.PropsWithChildren<{ tone: 'ok' | 'warn' | 'info' }>) {
  const styles =
    tone === 'ok'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-200'
      : tone === 'warn'
        ? 'border-amber-200 bg-amber-50 text-amber-900 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-200'
        : 'border-slate-200 bg-slate-50 text-slate-800 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-200'
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        styles,
      )}
    >
      {children}
    </span>
  )
}

function AppContent() {
  const { t } = useLanguage()

  // helper hook for local storage persistence
  function usePersistentState(key: string, initialValue: string) {
    const [state, setState] = useState(() => {
      const stored = localStorage.getItem(key)
      return stored ?? initialValue
    })

    useEffect(() => {
      localStorage.setItem(key, state)
    }, [key, state])

    return [state, setState] as const
  }

  // State with persistence
  const [kaufpreis, setKaufpreis] = usePersistentState('kaufpreis', "800'000")

  // Custom logic for zielMonat
  const [zielMonat, setZielMonat] = useState<string>(() => {
    const stored = localStorage.getItem('zielMonat')
    if (stored) return stored

    // Default: 24 months in the future
    const now = new Date()
    const target = new Date(now.getFullYear(), now.getMonth() + 24, 1)
    const yyyy = target.getFullYear()
    const mm = String(target.getMonth() + 1).padStart(2, '0')
    return `${yyyy}-${mm}`
  })

  useEffect(() => {
    localStorage.setItem('zielMonat', zielMonat)
  }, [zielMonat])

  const [barvermoegen, setBarvermoegen] = usePersistentState('barvermoegen', "40'000")
  const [saeule3a, setSaeule3a] = usePersistentState('saeule3a', "30'000")
  const [pensionskasse, setPensionskasse] = usePersistentState('pensionskasse', "60'000")
  const [andereVermoegen, setAndereVermoegen] = usePersistentState('andereVermoegen', "10'000")

  const [isWizardOpen, setIsWizardOpen] = useState(false)

  const [saeule3aMonatlich, setSaeule3aMonatlich] = usePersistentState('saeule3aMonatlich', '500')
  const [pensionskasseMonatlich, setPensionskasseMonatlich] = usePersistentState('pensionskasseMonatlich', '0')

  const handleWizardComplete = (values: WizardValues) => {
    setKaufpreis(values.kaufpreis)
    setZielMonat(values.zielMonat)
    setBarvermoegen(values.barvermoegen)
    setSaeule3a(values.saeule3a)
    setPensionskasse(values.pensionskasse)
    setAndereVermoegen(values.andereVermoegen)
    setSaeule3aMonatlich(values.saeule3aMonatlich)
    setPensionskasseMonatlich(values.pensionskasseMonatlich)
  }

  const kaufpreisN = useMemo(() => parseMoney(kaufpreis), [kaufpreis])
  const barN = useMemo(() => parseMoney(barvermoegen), [barvermoegen])
  const s3aN = useMemo(() => parseMoney(saeule3a), [saeule3a])
  const pkN = useMemo(() => parseMoney(pensionskasse), [pensionskasse])
  const otherN = useMemo(() => parseMoney(andereVermoegen), [andereVermoegen])
  const s3aMonthlyN = useMemo(() => parseMoney(saeule3aMonatlich), [saeule3aMonatlich])
  const pkMonthlyN = useMemo(() => parseMoney(pensionskasseMonatlich), [pensionskasseMonatlich])

  const totalRequired = useMemo(() => kaufpreisN * 0.2, [kaufpreisN])
  const hardRequired = useMemo(() => kaufpreisN * 0.1, [kaufpreisN])

  const priceValid = kaufpreisN > 0

  const monthsRemaining = useMemo(
    () => monthsBetweenNowAndTargetMonth(zielMonat),
    [zielMonat],
  )

  const s3aProjected = useMemo(() => s3aN + s3aMonthlyN * monthsRemaining, [monthsRemaining, s3aMonthlyN, s3aN])
  const pkProjected = useMemo(() => pkN + pkMonthlyN * monthsRemaining, [monthsRemaining, pkMonthlyN, pkN])

  const totalAssetsAtTarget = useMemo(
    () => barN + otherN + s3aProjected + pkProjected,
    [barN, otherN, pkProjected, s3aProjected],
  )
  const hardAssetsAtTarget = useMemo(() => barN + otherN + s3aProjected, [barN, otherN, s3aProjected])

  const totalShortfallAtTarget = useMemo(
    () => Math.max(0, totalRequired - totalAssetsAtTarget),
    [totalAssetsAtTarget, totalRequired],
  )
  const hardShortfallAtTarget = useMemo(
    () => Math.max(0, hardRequired - hardAssetsAtTarget),
    [hardAssetsAtTarget, hardRequired],
  )

  const savingsGap = useMemo(
    () => Math.max(totalShortfallAtTarget, hardShortfallAtTarget),
    [hardShortfallAtTarget, totalShortfallAtTarget],
  )

  const monthlySavingsTarget = useMemo(() => {
    if (!priceValid) return NaN
    if (savingsGap <= 0) return 0
    if (monthsRemaining <= 0) return NaN
    return savingsGap / monthsRemaining
  }, [monthsRemaining, priceValid, savingsGap])

  const totalProgress = useMemo(() => {
    if (totalRequired <= 0) return 0
    return clamp01(totalAssetsAtTarget / totalRequired)
  }, [totalAssetsAtTarget, totalRequired])

  const hardRuleMet = hardAssetsAtTarget >= hardRequired
  const totalRuleMet = totalAssetsAtTarget >= totalRequired

  const showHardWarning = totalRuleMet && !hardRuleMet
  const invalidDate = priceValid && savingsGap > 0 && monthsRemaining <= 0

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <div className="min-h-screen pb-20 font-sans text-slate-900 bg-slate-50 dark:bg-slate-950 dark:text-slate-50 transition-colors duration-300">
        <div className="mx-auto w-full max-w-6xl px-4 py-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between mb-8 gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left w-full">
              <img src={logoUrl} alt="Logo" className="h-24 sm:h-32 w-auto shrink-0 drop-shadow-[0_5px_5px_rgba(0,0,0,0.4)]" />
              <div className="flex flex-col gap-2 w-full">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <h1 className="text-balance text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
                    {t('app.title')}
                  </h1>
                  <Pill tone="info">
                    <Landmark className="h-4 w-4 shrink-0" />
                    <span className="text-left">{t('app.badge_rules')}</span>
                  </Pill>
                </div>
                <p className="max-w-3xl text-lg text-slate-600 dark:text-slate-400">
                  {t('app.subtitle')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsWizardOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 hover:scale-105 transition-all whitespace-nowrap"
              >
                <Wand2 className="w-4 h-4" />
                {t('app.btn_wizard')}
              </button>
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </div>

          <Wizard
            isOpen={isWizardOpen}
            onClose={() => setIsWizardOpen(false)}
            onComplete={handleWizardComplete}
            initialValues={{
              kaufpreis,
              zielMonat,
              barvermoegen,
              saeule3a,
              pensionskasse,
              andereVermoegen,
              saeule3aMonatlich,
              pensionskasseMonatlich
            }}
          />

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Left Column: Inputs */}
            <div className="space-y-8">
              <Card className="dark:bg-slate-900 dark:border-slate-800">
                <CardHeader className="flex items-center justify-between gap-4 dark:border-slate-800">
                  <div>
                    <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t('app.card_obj_title')}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {t('app.card_obj_desc')}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-8">
                  <SliderInput
                    id="kaufpreis"
                    label={t('app.label_kaufpreis')}
                    value={kaufpreis}
                    onChange={setKaufpreis}
                    min={0}
                    max={10000000}
                    step={10000}
                    icon={<Coins className="h-4 w-4" />}
                  />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="zielmonat">{t('app.label_zielmonat')}</Label>
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{monthsRemaining} {t('app.months_remaining')}</span>
                    </div>
                    <MonthPicker
                      value={zielMonat}
                      onChange={setZielMonat}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="dark:bg-slate-900 dark:border-slate-800">
                <CardHeader className="dark:border-slate-800">
                  <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t('app.card_assets_title')}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    {t('app.card_assets_desc')}
                  </div>
                </CardHeader>
                <CardContent className="space-y-8">
                  <SliderInput
                    id="barvermoegen"
                    label={t('app.label_bar')}
                    value={barvermoegen}
                    onChange={setBarvermoegen}
                    max={500000}
                    step={1000}
                    icon={<Wallet className="h-4 w-4" />}
                  />
                  <SliderInput
                    id="saeule3a"
                    label={t('app.label_3a')}
                    value={saeule3a}
                    onChange={setSaeule3a}
                    max={200000}
                    step={1000}
                    icon={<PiggyBank className="h-4 w-4" />}
                  />
                  <SliderInput
                    id="pensionskasse"
                    label={t('app.label_pk')}
                    value={pensionskasse}
                    onChange={setPensionskasse}
                    max={500000}
                    step={1000}
                    hint={t('app.hint_pk')}
                    icon={<Landmark className="h-4 w-4" />}
                  />
                  <SliderInput
                    id="andere"
                    label={t('app.label_other')}
                    value={andereVermoegen}
                    onChange={setAndereVermoegen}
                    max={200000}
                    step={1000}
                    hint={t('app.hint_other')}
                    icon={<Coins className="h-4 w-4" />}
                  />
                </CardContent>
              </Card>

              <Card className="dark:bg-slate-900 dark:border-slate-800">
                <CardHeader className="dark:border-slate-800">
                  <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t('app.card_monthly_title')}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    {t('app.card_monthly_desc')}
                  </div>
                </CardHeader>
                <CardContent className="space-y-8">
                  <SliderInput
                    id="saeule3aMonatlich"
                    label={t('app.label_3a_monthly')}
                    value={saeule3aMonatlich}
                    onChange={setSaeule3aMonatlich}
                    max={3000}
                    step={50}
                    icon={<PiggyBank className="h-4 w-4" />}
                  />
                  <SliderInput
                    id="pensionskasseMonatlich"
                    label={t('app.label_pk_monthly')}
                    value={pensionskasseMonatlich}
                    onChange={setPensionskasseMonatlich}
                    max={5000}
                    step={50}
                    hint={t('app.hint_pk_monthly')}
                    icon={<Landmark className="h-4 w-4" />}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Analysis */}
            <div className="space-y-8">
              <Card className="overflow-hidden border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 dark:border-slate-800">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t('app.card_analysis_title')}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {t('app.label_20pct')} ({formatCHF(totalRequired)})
                      </div>
                    </div>
                    {!priceValid ? (
                      <Pill tone="warn">{t('app.status_enter_price')}</Pill>
                    ) : savingsGap <= 0 ? (
                      <Pill tone="ok">{t('app.status_goal_reached')}</Pill>
                    ) : (
                      <Pill tone="info">{Math.round(totalProgress * 100)}% {t('app.status_n_reached')}</Pill>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-8">
                  {/* Donut Chart Visualization */}
                  <div className="flex flex-col items-center">
                    <DonutChart
                      hardEquity={hardAssetsAtTarget}
                      softEquity={pkN + pkMonthlyN * monthsRemaining}
                      gap={savingsGap}
                      target={totalRequired}
                    />
                    <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <div className="h-3 w-3 rounded-full bg-emerald-500" />
                        <span>{t('app.chart_hard')} ({formatCHF(hardAssetsAtTarget, { decimals: 0 })})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="h-3 w-3 rounded-full bg-blue-500" />
                        <span>{t('app.chart_pk')} ({formatCHF(pkN + pkMonthlyN * monthsRemaining, { decimals: 0 })})</span>
                      </div>
                      {savingsGap > 0 && (
                        <div className="flex items-center gap-1.5">
                          <div className="h-3 w-3 rounded-full bg-slate-200 dark:bg-slate-700" />
                          <span>{t('app.chart_gap')} ({formatCHF(savingsGap, { decimals: 0 })})</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                    {/* Summary Boxes */}
                    <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-6 text-center">
                      <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">{t('app.summary_rec_savings')}</div>
                      <div className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                        {Number.isFinite(monthlySavingsTarget) ? formatCHF(roundTo2(monthlySavingsTarget)) : '—'}
                        <span className="text-lg font-medium text-slate-500 dark:text-slate-400 ml-1">{t('app.summary_per_month')}</span>
                      </div>
                      {!priceValid && <div className="mt-2 text-sm text-amber-600 dark:text-amber-500">{t('app.summary_error_price')}</div>}
                      {invalidDate && <div className="mt-2 text-sm text-amber-600 dark:text-amber-500">{t('app.summary_error_date')}</div>}
                    </div>

                    {showHardWarning && (
                      <div className="flex items-start gap-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 p-4 text-sm text-amber-900 dark:text-amber-200 border border-amber-100 dark:border-amber-900/50">
                        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500" />
                        <div>
                          <span className="font-semibold block mb-1">{t('app.warning_hard_title')}</span>
                          {t('app.warning_hard_desc', { amount: formatCHF(hardShortfallAtTarget) })}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="dark:bg-slate-900 dark:border-slate-800">
                <CardHeader className="dark:border-slate-800">
                  <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t('app.card_growth_title')}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{t('app.card_growth_desc')}</div>
                </CardHeader>
                <CardContent>
                  <GrowthChart
                    currentLiquidAssets={barN + otherN}
                    monthlyLiquidContribution={(Number.isFinite(monthlySavingsTarget) ? monthlySavingsTarget : 0)}
                    current3aAssets={s3aN}
                    monthly3aContribution={s3aMonthlyN}
                    currentPKAssets={pkN}
                    monthlyPKContribution={pkMonthlyN}
                    months={monthsRemaining + 12}
                    targetAmount={totalRequired}
                  />
                  <div className="text-center text-xs text-slate-400 dark:text-slate-500 mt-4">
                    {t('app.growth_note')}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  )
}
