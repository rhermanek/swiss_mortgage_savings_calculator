import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Banknote,
  Check,
  Coins,
  Info,
  Landmark,
  PiggyBank,
  UserMinus,
  UserPlus,
  Wallet,
  Wand2,
  X,
} from 'lucide-react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { GrowthChart } from './components/GrowthChart'
import { MonthPicker } from './components/MonthPicker'
import { SliderInput } from './components/SliderInput'
import { ThemeProvider } from './components/ThemeProvider'
import { ThemeToggle } from './components/ThemeToggle'
import { Wizard, type WizardValues } from './components/Wizard'
import logoUrl from './assets/logo.png'
import { LanguageProvider } from './i18n/LanguageContext'
import { useLanguage } from './i18n/useLanguage'
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
    .replace(/[^\d,.-]/g, '')

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

function PersonTabs({
  personTab,
  setPersonTab,
  t,
}: {
  personTab: '1' | '2'
  setPersonTab: (v: '1' | '2') => void
  t: (key: string, params?: Record<string, string | number>) => string
}) {
  const base = 'flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors'
  const active = 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
  const inactive = 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
  return (
    <div role="tablist" className="flex flex-1 items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800/60 p-1">
      <button
        type="button"
        role="tab"
        aria-selected={personTab === '1'}
        onClick={() => setPersonTab('1')}
        className={cx(base, personTab === '1' ? active : inactive)}
      >
        {t('app.person1_section')}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={personTab === '2'}
        onClick={() => setPersonTab('2')}
        className={cx(base, personTab === '2' ? active : inactive)}
      >
        {t('app.person2_section')}
      </button>
    </div>
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
  const { t, language } = useLanguage()

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
  const [confirmRemovePartner, setConfirmRemovePartner] = useState(false)
  const [personTab, setPersonTab] = useState<'1' | '2'>('1')

  const [saeule3aMonatlich, setSaeule3aMonatlich] = usePersistentState('saeule3aMonatlich', '500')
  const [pensionskasseMonatlich, setPensionskasseMonatlich] = usePersistentState('pensionskasseMonatlich', '0')
  const [sonstigeSparrateMonatlich, setSonstigeSparrateMonatlich] = usePersistentState('sonstigeSparrateMonatlich', '0')
  const [bruttoeinkommen, setBruttoeinkommen] = usePersistentState('bruttoeinkommen', '0')
  const [bruttoeinkommen2, setBruttoeinkommen2] = usePersistentState('bruttoeinkommen2', '0')

  // Person 2
  const [person2Active, setPerson2Active] = useState(() => localStorage.getItem('person2Active') === 'true')
  useEffect(() => { localStorage.setItem('person2Active', String(person2Active)) }, [person2Active])
  const [barvermoegen2, setBarvermoegen2] = usePersistentState('barvermoegen2', '0')
  const [saeule3a2, setSaeule3a2] = usePersistentState('saeule3a2', '0')
  const [pensionskasse2, setPensionskasse2] = usePersistentState('pensionskasse2', '0')
  const [andereVermoegen2, setAndereVermoegen2] = usePersistentState('andereVermoegen2', '0')
  const [saeule3aMonatlich2, setSaeule3aMonatlich2] = usePersistentState('saeule3aMonatlich2', '0')
  const [pensionskasseMonatlich2, setPensionskasseMonatlich2] = usePersistentState('pensionskasseMonatlich2', '0')
  const [sonstigeSparrateMonatlich2, setSonstigeSparrateMonatlich2] = usePersistentState('sonstigeSparrateMonatlich2', '0')

  const handleWizardComplete = (values: WizardValues) => {
    setKaufpreis(values.kaufpreis)
    setZielMonat(values.zielMonat)
    setBarvermoegen(values.barvermoegen)
    setSaeule3a(values.saeule3a)
    setPensionskasse(values.pensionskasse)
    setAndereVermoegen(values.andereVermoegen)
    setSaeule3aMonatlich(values.saeule3aMonatlich)
    setPensionskasseMonatlich(values.pensionskasseMonatlich)
    setSonstigeSparrateMonatlich(values.sonstigeSparrateMonatlich)
    setPerson2Active(values.person2Active)
    setBarvermoegen2(values.barvermoegen2)
    setSaeule3a2(values.saeule3a2)
    setPensionskasse2(values.pensionskasse2)
    setAndereVermoegen2(values.andereVermoegen2)
    setSaeule3aMonatlich2(values.saeule3aMonatlich2)
    setPensionskasseMonatlich2(values.pensionskasseMonatlich2)
    setSonstigeSparrateMonatlich2(values.sonstigeSparrateMonatlich2)
  }

  const kaufpreisN = useMemo(() => parseMoney(kaufpreis), [kaufpreis])
  const barN = useMemo(() => parseMoney(barvermoegen), [barvermoegen])
  const s3aN = useMemo(() => parseMoney(saeule3a), [saeule3a])
  const pkN = useMemo(() => parseMoney(pensionskasse), [pensionskasse])
  const otherN = useMemo(() => parseMoney(andereVermoegen), [andereVermoegen])
  const s3aMonthlyN = useMemo(() => parseMoney(saeule3aMonatlich), [saeule3aMonatlich])
  const pkMonthlyN = useMemo(() => parseMoney(pensionskasseMonatlich), [pensionskasseMonatlich])
  const otherMonthlySavingsN = useMemo(() => parseMoney(sonstigeSparrateMonatlich), [sonstigeSparrateMonatlich])

  const barN2 = useMemo(() => person2Active ? parseMoney(barvermoegen2) : 0, [person2Active, barvermoegen2])
  const s3aN2 = useMemo(() => person2Active ? parseMoney(saeule3a2) : 0, [person2Active, saeule3a2])
  const pkN2 = useMemo(() => person2Active ? parseMoney(pensionskasse2) : 0, [person2Active, pensionskasse2])
  const otherN2 = useMemo(() => person2Active ? parseMoney(andereVermoegen2) : 0, [person2Active, andereVermoegen2])
  const s3aMonthlyN2 = useMemo(() => person2Active ? parseMoney(saeule3aMonatlich2) : 0, [person2Active, saeule3aMonatlich2])
  const pkMonthlyN2 = useMemo(() => person2Active ? parseMoney(pensionskasseMonatlich2) : 0, [person2Active, pensionskasseMonatlich2])
  const otherMonthlySavingsN2 = useMemo(() => person2Active ? parseMoney(sonstigeSparrateMonatlich2) : 0, [person2Active, sonstigeSparrateMonatlich2])

  const totalRequired = useMemo(() => kaufpreisN * 0.2, [kaufpreisN])
  const hardRequired = useMemo(() => kaufpreisN * 0.1, [kaufpreisN])

  const priceValid = kaufpreisN > 0

  const monthsRemaining = useMemo(
    () => monthsBetweenNowAndTargetMonth(zielMonat),
    [zielMonat],
  )

  // Person 1 projections
  const s3aProjected1 = useMemo(() => s3aN + s3aMonthlyN * monthsRemaining, [monthsRemaining, s3aMonthlyN, s3aN])
  const pkProjected1 = useMemo(() => pkN + pkMonthlyN * monthsRemaining, [monthsRemaining, pkMonthlyN, pkN])
  const otherProjected1 = useMemo(() => otherN + otherMonthlySavingsN * monthsRemaining, [monthsRemaining, otherMonthlySavingsN, otherN])

  // Person 2 projections
  const s3aProjected2 = useMemo(() => s3aN2 + s3aMonthlyN2 * monthsRemaining, [monthsRemaining, s3aMonthlyN2, s3aN2])
  const pkProjected2 = useMemo(() => pkN2 + pkMonthlyN2 * monthsRemaining, [monthsRemaining, pkMonthlyN2, pkN2])
  const otherProjected2 = useMemo(() => otherN2 + otherMonthlySavingsN2 * monthsRemaining, [monthsRemaining, otherMonthlySavingsN2, otherN2])

  // Combined
  const s3aProjected = useMemo(() => s3aProjected1 + s3aProjected2, [s3aProjected1, s3aProjected2])
  const pkProjected = useMemo(() => pkProjected1 + pkProjected2, [pkProjected1, pkProjected2])
  const otherProjected = useMemo(() => otherProjected1 + otherProjected2, [otherProjected1, otherProjected2])

  const totalAssetsAtTarget = useMemo(
    () => (barN + barN2) + otherProjected + s3aProjected + pkProjected,
    [barN, barN2, otherProjected, pkProjected, s3aProjected],
  )
  const hardAssetsAtTarget = useMemo(
    () => (barN + barN2) + otherProjected + s3aProjected,
    [barN, barN2, otherProjected, s3aProjected],
  )

  // Per-person totals at target (for breakdown display)
  const hardP1AtTarget = useMemo(
    () => barN + otherProjected1 + s3aProjected1,
    [barN, otherProjected1, s3aProjected1],
  )
  const hardP2AtTarget = useMemo(
    () => barN2 + otherProjected2 + s3aProjected2,
    [barN2, otherProjected2, s3aProjected2],
  )

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

  const targetDateLabel = useMemo(() => {
    if (!zielMonat) return ''
    const [yyyyStr, mmStr] = zielMonat.split('-')
    const yyyy = Number(yyyyStr)
    const mm = Number(mmStr)
    if (!Number.isFinite(yyyy) || !Number.isFinite(mm)) return ''
    return new Date(yyyy, mm - 1, 1).toLocaleDateString(
      language === 'de' ? 'de-CH' : 'en-US',
      { month: 'long', year: 'numeric' },
    )
  }, [language, zielMonat])

  // Progress bar segments (capped at totalRequired)
  const hardCapped = Math.min(hardAssetsAtTarget, totalRequired)
  const softRemaining = Math.max(0, totalRequired - hardCapped)
  const softCapped = Math.min(pkProjected, softRemaining)
  const gapDisplay = Math.max(0, totalRequired - hardCapped - softCapped)
  const pct = (n: number) => (totalRequired > 0 ? (n / totalRequired) * 100 : 0)

  // Today's totals (sum of person 1 + 2 current values, before projection)
  const todayHardTotal = barN + barN2 + s3aN + s3aN2 + otherN + otherN2
  const todaySoftTotal = pkN + pkN2
  const todayTotal = todayHardTotal + todaySoftTotal
  const todayPct = totalRequired > 0 ? Math.min(100, (todayTotal / totalRequired) * 100) : 0

  // Tragbarkeit (Swiss affordability check)
  const incomeN = useMemo(() => parseMoney(bruttoeinkommen), [bruttoeinkommen])
  const incomeN2 = useMemo(() => person2Active ? parseMoney(bruttoeinkommen2) : 0, [person2Active, bruttoeinkommen2])
  const totalIncome = incomeN + incomeN2

  const TRAGBARKEIT_INTEREST_RATE = 0.05
  const TRAGBARKEIT_MAINTENANCE_RATE = 0.01
  const TRAGBARKEIT_AMORT_TARGET_LTV = 0.65
  const TRAGBARKEIT_AMORT_YEARS = 15
  const TRAGBARKEIT_MAX_RATIO = 1 / 3

  const mortgageAmount = useMemo(() => kaufpreisN * 0.8, [kaufpreisN])
  const annualInterest = useMemo(() => mortgageAmount * TRAGBARKEIT_INTEREST_RATE, [mortgageAmount])
  const annualAmortization = useMemo(() => {
    const targetMortgage = kaufpreisN * TRAGBARKEIT_AMORT_TARGET_LTV
    const excess = Math.max(0, mortgageAmount - targetMortgage)
    return excess / TRAGBARKEIT_AMORT_YEARS
  }, [kaufpreisN, mortgageAmount])
  const annualMaintenance = useMemo(() => kaufpreisN * TRAGBARKEIT_MAINTENANCE_RATE, [kaufpreisN])
  const annualHousingCost = annualInterest + annualAmortization + annualMaintenance

  const tragbarkeitRatio = totalIncome > 0 ? annualHousingCost / totalIncome : 0
  const tragbarkeitPasses = totalIncome > 0 && tragbarkeitRatio <= TRAGBARKEIT_MAX_RATIO
  const requiredIncome = annualHousingCost / TRAGBARKEIT_MAX_RATIO

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <div className="min-h-screen pb-20 font-sans text-slate-900 bg-slate-50 dark:bg-slate-950 dark:text-slate-50 transition-colors duration-300">
        <div className="mx-auto w-full max-w-7xl px-4 py-10">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <img src={logoUrl} alt="" className="h-10 sm:h-12 w-auto shrink-0 drop-shadow-[0_2px_3px_rgba(0,0,0,0.25)]" />
              <div className="flex flex-col min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-tight">
                  {t('app.title')}
                </h1>
                <div className="flex items-center gap-1">
                  <span className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <Landmark className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{t('app.badge_rules')}</span>
                  </span>
                  <PopoverPrimitive.Root>
                    <PopoverPrimitive.Trigger asChild>
                      <button
                        aria-label={t('app.info_rules_title')}
                        className="rounded-full p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    </PopoverPrimitive.Trigger>
                    <PopoverPrimitive.Portal>
                      <PopoverPrimitive.Content
                        side="bottom"
                        align="start"
                        sideOffset={6}
                        className="z-50 max-w-xs rounded-xl border border-slate-200 bg-white p-4 shadow-xl outline-none dark:bg-slate-900 dark:border-slate-800"
                      >
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 text-sm">{t('app.info_rules_title')}</h3>
                        <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
                          <div>
                            <div className="font-medium text-slate-800 dark:text-slate-200 mb-0.5">{t('app.info_rules_20pct')}</div>
                            <div>{t('app.info_rules_20pct_desc')}</div>
                          </div>
                          <div>
                            <div className="font-medium text-slate-800 dark:text-slate-200 mb-0.5">{t('app.info_rules_10pct')}</div>
                            <div>{t('app.info_rules_10pct_desc')}</div>
                          </div>
                          <div>
                            <div className="font-medium text-slate-800 dark:text-slate-200 mb-0.5">{t('app.info_rules_soft')}</div>
                            <div>{t('app.info_rules_soft_desc')}</div>
                          </div>
                        </div>
                        <PopoverPrimitive.Arrow className="fill-white dark:fill-slate-900" />
                      </PopoverPrimitive.Content>
                    </PopoverPrimitive.Portal>
                  </PopoverPrimitive.Root>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsWizardOpen(true)}
                aria-label={t('app.btn_wizard')}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30 transition-all whitespace-nowrap"
              >
                <Wand2 className="w-4 h-4" />
                <span className="hidden sm:inline">{t('app.btn_wizard')}</span>
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
              pensionskasseMonatlich,
              sonstigeSparrateMonatlich,
              person2Active,
              barvermoegen2,
              saeule3a2,
              pensionskasse2,
              andereVermoegen2,
              saeule3aMonatlich2,
              pensionskasseMonatlich2,
              sonstigeSparrateMonatlich2,
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
                      hasError={invalidDate}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="dark:bg-slate-900 dark:border-slate-800">
                <CardHeader className="dark:border-slate-800">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t('app.card_assets_title')}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {t('app.card_assets_desc')}
                      </div>
                    </div>
                    {!person2Active && (
                      <button
                        onClick={() => { setPerson2Active(true); setPersonTab('2') }}
                        className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        {t('app.add_partner_btn')}
                      </button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-8">
                  {person2Active && (
                    <div className="flex items-center gap-2">
                      <PersonTabs personTab={personTab} setPersonTab={setPersonTab} t={t} />
                      {confirmRemovePartner ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => { setPerson2Active(false); setConfirmRemovePartner(false); setPersonTab('1') }}
                            className="rounded-lg border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 text-xs font-medium text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950/60 transition-colors"
                            title={t('app.confirm_remove_partner')}
                          >
                            {t('app.confirm_yes')}
                          </button>
                          <button
                            onClick={() => setConfirmRemovePartner(false)}
                            className="rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            {t('app.confirm_cancel')}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmRemovePartner(true)}
                          aria-label={t('app.remove_partner_btn')}
                          title={t('app.remove_partner_btn')}
                          className="shrink-0 rounded-lg border border-rose-200 dark:border-rose-900 p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        >
                          <UserMinus className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  )}

                  {personTab === '1' || !person2Active ? (
                    <>
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
                    </>
                  ) : (
                    <>
                      <SliderInput
                        id="barvermoegen2"
                        label={t('app.label_bar')}
                        value={barvermoegen2}
                        onChange={setBarvermoegen2}
                        max={500000}
                        step={1000}
                        icon={<Wallet className="h-4 w-4" />}
                      />
                      <SliderInput
                        id="saeule3a2"
                        label={t('app.label_3a')}
                        value={saeule3a2}
                        onChange={setSaeule3a2}
                        max={200000}
                        step={1000}
                        icon={<PiggyBank className="h-4 w-4" />}
                      />
                      <SliderInput
                        id="pensionskasse2"
                        label={t('app.label_pk')}
                        value={pensionskasse2}
                        onChange={setPensionskasse2}
                        max={500000}
                        step={1000}
                        hint={t('app.hint_pk')}
                        icon={<Landmark className="h-4 w-4" />}
                      />
                      <SliderInput
                        id="andere2"
                        label={t('app.label_other')}
                        value={andereVermoegen2}
                        onChange={setAndereVermoegen2}
                        max={200000}
                        step={1000}
                        hint={t('app.hint_other')}
                        icon={<Coins className="h-4 w-4" />}
                      />
                    </>
                  )}
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
                  {person2Active && (
                    <PersonTabs personTab={personTab} setPersonTab={setPersonTab} t={t} />
                  )}
                  {personTab === '1' || !person2Active ? (
                    <>
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
                      <SliderInput
                        id="sonstigeSparrateMonatlich"
                        label={t('app.label_other_monthly')}
                        value={sonstigeSparrateMonatlich}
                        onChange={setSonstigeSparrateMonatlich}
                        max={20000}
                        step={50}
                        hint={t('app.hint_other_monthly')}
                        icon={<Wallet className="h-4 w-4" />}
                      />
                    </>
                  ) : (
                    <>
                      <SliderInput
                        id="saeule3aMonatlich2"
                        label={t('app.label_3a_monthly')}
                        value={saeule3aMonatlich2}
                        onChange={setSaeule3aMonatlich2}
                        max={3000}
                        step={50}
                        icon={<PiggyBank className="h-4 w-4" />}
                      />
                      <SliderInput
                        id="pensionskasseMonatlich2"
                        label={t('app.label_pk_monthly')}
                        value={pensionskasseMonatlich2}
                        onChange={setPensionskasseMonatlich2}
                        max={5000}
                        step={50}
                        hint={t('app.hint_pk_monthly')}
                        icon={<Landmark className="h-4 w-4" />}
                      />
                      <SliderInput
                        id="sonstigeSparrateMonatlich2"
                        label={t('app.label_other_monthly')}
                        value={sonstigeSparrateMonatlich2}
                        onChange={setSonstigeSparrateMonatlich2}
                        max={20000}
                        step={50}
                        hint={t('app.hint_other_monthly')}
                        icon={<Wallet className="h-4 w-4" />}
                      />
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="dark:bg-slate-900 dark:border-slate-800">
                <CardHeader className="dark:border-slate-800">
                  <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t('app.card_income_title')}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{t('app.card_income_desc')}</div>
                </CardHeader>
                <CardContent className="space-y-8">
                  {person2Active && (
                    <PersonTabs personTab={personTab} setPersonTab={setPersonTab} t={t} />
                  )}
                  {personTab === '1' || !person2Active ? (
                    <SliderInput
                      id="bruttoeinkommen"
                      label={t('app.label_income')}
                      value={bruttoeinkommen}
                      onChange={setBruttoeinkommen}
                      max={500000}
                      step={1000}
                      hint={t('app.hint_income')}
                      icon={<Banknote className="h-4 w-4" />}
                    />
                  ) : (
                    <SliderInput
                      id="bruttoeinkommen2"
                      label={t('app.label_income')}
                      value={bruttoeinkommen2}
                      onChange={setBruttoeinkommen2}
                      max={500000}
                      step={1000}
                      hint={t('app.hint_income')}
                      icon={<Banknote className="h-4 w-4" />}
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Analysis */}
            <div className="space-y-8 lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:pr-1 lg:pb-4">
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

                <CardContent className="space-y-7">
                  {/* Hero result */}
                  <div className="text-center">
                    {!priceValid ? (
                      <>
                        <div className="text-5xl font-bold tracking-tight text-slate-300 dark:text-slate-700">—</div>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                          {t('app.hero_no_price')}
                        </p>
                      </>
                    ) : savingsGap <= 0 ? (
                      <>
                        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                          <Check className="h-4 w-4" />
                          {t('app.hero_goal_reached')}
                        </div>
                        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                          {t('app.hero_goal_reached_desc', { date: targetDateLabel })}
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="text-5xl sm:text-6xl font-bold tracking-tight text-slate-900 dark:text-slate-50 tabular-nums">
                          {Number.isFinite(monthlySavingsTarget) ? formatCHF(roundTo2(monthlySavingsTarget)) : '—'}
                          <span className="ml-2 text-xl font-medium text-slate-500 dark:text-slate-400">{t('app.summary_per_month')}</span>
                        </div>
                        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                          {t('app.hero_subtitle', { date: targetDateLabel })}
                        </p>
                        {invalidDate && (
                          <div className="mt-2 text-sm text-amber-600 dark:text-amber-500">{t('app.summary_error_date')}</div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Progress bar to goal */}
                  {priceValid && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>0</span>
                        <span className="tabular-nums font-medium text-slate-700 dark:text-slate-300">
                          {Math.round(totalProgress * 100)}% · {formatCHF(totalAssetsAtTarget, { decimals: 0 })} / {formatCHF(totalRequired, { decimals: 0 })}
                        </span>
                      </div>
                      <div className="relative h-6 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className="flex h-full">
                          <div
                            className="h-full bg-emerald-500 transition-all"
                            style={{ width: `${pct(hardCapped)}%` }}
                            title={`${t('app.chart_hard')}: ${formatCHF(hardCapped, { decimals: 0 })}`}
                          />
                          <div
                            className="h-full bg-blue-500 transition-all"
                            style={{ width: `${pct(softCapped)}%` }}
                            title={`${t('app.chart_pk')}: ${formatCHF(softCapped, { decimals: 0 })}`}
                          />
                          <div
                            className="h-full bg-slate-300 dark:bg-slate-600 transition-all"
                            style={{ width: `${pct(gapDisplay)}%` }}
                            title={`${t('app.chart_gap')}: ${formatCHF(gapDisplay, { decimals: 0 })}`}
                          />
                        </div>
                        {/* 50% marker (10% hard hurdle) */}
                        <div
                          className="pointer-events-none absolute top-0 h-full w-px bg-slate-700/40 dark:bg-slate-200/40"
                          style={{ left: '50%' }}
                          title={t('app.progress_marker_hard')}
                        />
                        {/* "Today" tick */}
                        {todayPct > 0 && todayPct < 100 && (
                          <div
                            className="pointer-events-none absolute top-1/2 h-3 w-0.5 -translate-y-1/2 rounded-full bg-slate-900 dark:bg-slate-50"
                            style={{ left: `calc(${todayPct}% - 1px)` }}
                            title={`${t('app.progress_today')}: ${formatCHF(todayTotal, { decimals: 0 })}`}
                          />
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          {t('app.chart_hard')}
                          <span className="font-medium tabular-nums text-slate-700 dark:text-slate-300">{formatCHF(hardAssetsAtTarget, { decimals: 0 })}</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-blue-500" />
                          {t('app.chart_pk')}
                          <span className="font-medium tabular-nums text-slate-700 dark:text-slate-300">{formatCHF(pkProjected, { decimals: 0 })}</span>
                        </span>
                        {savingsGap > 0 && (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                            {t('app.chart_gap')}
                            <span className="font-medium tabular-nums text-slate-700 dark:text-slate-300">{formatCHF(savingsGap, { decimals: 0 })}</span>
                          </span>
                        )}
                        <span className="ml-auto inline-flex items-center gap-1.5">
                          <span className="h-2 w-0.5 rounded bg-slate-900 dark:bg-slate-50" />
                          {t('app.progress_today')}
                          <span className="font-medium tabular-nums text-slate-700 dark:text-slate-300">{formatCHF(todayTotal, { decimals: 0 })}</span>
                        </span>
                      </div>
                      {person2Active && (
                        <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-slate-500 dark:text-slate-400">
                          <div className="flex justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 dark:bg-slate-800/50">
                            <span>{t('app.person1_section')}</span>
                            <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-200">{formatCHF(hardP1AtTarget + pkProjected1, { decimals: 0 })}</span>
                          </div>
                          <div className="flex justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 dark:bg-slate-800/50">
                            <span>{t('app.person2_section')}</span>
                            <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-200">{formatCHF(hardP2AtTarget + pkProjected2, { decimals: 0 })}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {showHardWarning && (
                    <div className="flex items-start gap-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 p-4 text-sm text-amber-900 dark:text-amber-200 border border-amber-100 dark:border-amber-900/50">
                      <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500" />
                      <div>
                        <span className="font-semibold block mb-1">{t('app.warning_hard_title')}</span>
                        {t('app.warning_hard_desc', { amount: formatCHF(hardShortfallAtTarget) })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="dark:bg-slate-900 dark:border-slate-800">
                <CardHeader className="dark:border-slate-800">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t('app.card_tragbarkeit_title')}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{t('app.card_tragbarkeit_desc')}</div>
                    </div>
                    {priceValid && totalIncome > 0 && (
                      <Pill tone={tragbarkeitPasses ? 'ok' : 'warn'}>
                        {tragbarkeitPasses ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                        {tragbarkeitPasses ? t('app.tragbarkeit_pass') : t('app.tragbarkeit_fail')}
                      </Pill>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  {!priceValid || totalIncome <= 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t('app.tragbarkeit_no_income')}</p>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <div className="flex items-baseline justify-between">
                          <span className="text-sm text-slate-500 dark:text-slate-400">{t('app.tragbarkeit_ratio_label')}</span>
                          <span className={cx(
                            'text-2xl font-bold tabular-nums',
                            tragbarkeitPasses ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400',
                          )}>
                            {Math.round(tragbarkeitRatio * 100)}%
                          </span>
                        </div>
                        <div className="relative h-4 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className={cx(
                              'h-full transition-all',
                              tragbarkeitPasses ? 'bg-emerald-500' : 'bg-amber-500',
                            )}
                            style={{ width: `${Math.min(100, tragbarkeitRatio * 100)}%` }}
                          />
                          <div
                            className="pointer-events-none absolute top-0 h-full w-px bg-slate-700 dark:bg-slate-200"
                            style={{ left: `${TRAGBARKEIT_MAX_RATIO * 100}%` }}
                            title={t('app.tragbarkeit_threshold')}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span>0%</span>
                          <span className="ml-auto" style={{ marginRight: `${(1 - TRAGBARKEIT_MAX_RATIO) * 100 - 5}%` }}>{t('app.tragbarkeit_threshold')}</span>
                          <span>100%</span>
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2 text-sm">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          {t('app.tragbarkeit_breakdown_label')}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">{t('app.tragbarkeit_breakdown_interest')}</span>
                          <span className="tabular-nums font-medium">{formatCHF(annualInterest, { decimals: 0 })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">{t('app.tragbarkeit_breakdown_amortization')}</span>
                          <span className="tabular-nums font-medium">{formatCHF(annualAmortization, { decimals: 0 })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">{t('app.tragbarkeit_breakdown_maintenance')}</span>
                          <span className="tabular-nums font-medium">{formatCHF(annualMaintenance, { decimals: 0 })}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-2 font-semibold">
                          <span>{t('app.tragbarkeit_breakdown_total')}</span>
                          <span className="tabular-nums">{formatCHF(annualHousingCost, { decimals: 0 })}</span>
                        </div>
                      </div>

                      {!tragbarkeitPasses && (
                        <div className="flex items-start gap-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 p-3 text-sm text-amber-900 dark:text-amber-200 border border-amber-100 dark:border-amber-900/50">
                          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-500" />
                          <div>
                            <span className="font-medium">{t('app.tragbarkeit_required_income')}: </span>
                            <span className="tabular-nums font-semibold">{formatCHF(requiredIncome, { decimals: 0 })}</span>
                          </div>
                        </div>
                      )}

                      <details className="text-xs text-slate-500 dark:text-slate-400">
                        <summary className="cursor-pointer hover:text-slate-700 dark:hover:text-slate-200">
                          {t('app.tragbarkeit_assumptions_title')}
                        </summary>
                        <p className="mt-2 leading-relaxed">{t('app.tragbarkeit_assumptions_desc')}</p>
                      </details>
                    </>
                  )}
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
                    monthlyLiquidContribution={
                      otherMonthlySavingsN +
                      (Number.isFinite(monthlySavingsTarget) ? monthlySavingsTarget : 0)
                    }
                    current3aAssets={s3aN}
                    monthly3aContribution={s3aMonthlyN}
                    currentPKAssets={pkN}
                    monthlyPKContribution={pkMonthlyN}
                    {...(person2Active ? {
                      currentLiquidAssets2: barN2 + otherN2,
                      monthlyLiquidContribution2: otherMonthlySavingsN2,
                      current3aAssets2: s3aN2,
                      monthly3aContribution2: s3aMonthlyN2,
                      currentPKAssets2: pkN2,
                      monthlyPKContribution2: pkMonthlyN2,
                    } : {})}
                    months={monthsRemaining + 12}
                    targetAmount={totalRequired}
                    targetMonthIndex={monthsRemaining}
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
