import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Lock, SlidersHorizontal, User, Users } from 'lucide-react'
import { AffordabilityCard } from './components/AffordabilityCard'
import { AppHeader } from './components/AppHeader'
import { MobileSummaryBar } from './components/MobileSummaryBar'
import { MonthPicker } from './components/MonthPicker'
import { ResetButton } from './components/ResetButton'
import { ResultSummary, type RuleStatus } from './components/ResultSummary'
import { SliderInput } from './components/SliderInput'
import { ThemeProvider } from './components/ThemeProvider'
import { Card, CardBody, CardHeader, Disclosure, SegmentedControl } from './components/ui'
import { Wizard, type WizardValues } from './components/Wizard'
import { LanguageProvider } from './i18n/LanguageContext'
import { useLanguage } from './i18n/useLanguage'
import { formatCHF, formatNumber, parseMoney } from './lib/format'
import { useStickyTop } from './lib/useStickyTop'

// Recharts is the bulk of the bundle and the chart sits below the fold.
const GrowthChart = lazy(() => import('./components/GrowthChart').then((m) => ({ default: m.GrowthChart })))

// Helper utilities
function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0
  return Math.min(1, Math.max(0, n))
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

function clampNum(value: string, min: number, max: number, fallback: number) {
  const n = Number.parseFloat(value.replace(',', '.'))
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

// Future value with monthly contributions, compounding monthly. Falls back to
// linear when annualRate <= 0.
function projectCompound(principal: number, monthly: number, annualRate: number, months: number) {
  if (months <= 0) return principal
  if (annualRate <= 0 || !Number.isFinite(annualRate)) return principal + monthly * months
  const r = annualRate / 12
  const factor = Math.pow(1 + r, months)
  return principal * factor + monthly * (factor - 1) / r
}

// Default: 24 months in the future
function defaultTargetMonth() {
  const now = new Date()
  const target = new Date(now.getFullYear(), now.getMonth() + 24, 1)
  return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}`
}

const DEFAULTS = {
  kaufpreis: "800'000",
  barvermoegen: "40'000",
  saeule3a: "30'000",
  pensionskasse: "60'000",
  andereVermoegen: "10'000",
  saeule3aMonatlich: '500',
  pensionskasseMonatlich: '0',
  sonstigeSparrateMonatlich: '0',
  bruttoeinkommen: '0',
  bruttoeinkommen2: '0',
  equityPct: '20',
  softEquityPct: '10',
  growthRateLiquid: '0',
  growthRate3a: '0',
  growthRatePK: '0',
  barvermoegen2: '0',
  saeule3a2: '0',
  pensionskasse2: '0',
  andereVermoegen2: '0',
  saeule3aMonatlich2: '0',
  pensionskasseMonatlich2: '0',
  sonstigeSparrateMonatlich2: '0',
} as const

type PersistedKey = keyof typeof DEFAULTS

// localStorage-backed string state
function usePersistentState(key: PersistedKey) {
  const [state, setState] = useState(() => localStorage.getItem(key) ?? DEFAULTS[key])

  useEffect(() => {
    localStorage.setItem(key, state)
  }, [key, state])

  return [state, setState] as const
}

const PILLAR_3A_ANNUAL_CAP = 7258 // CHF, "kleine Säule 3a" with PK (2025 reference)

const TRAGBARKEIT_INTEREST_RATE = 0.05
const TRAGBARKEIT_MAINTENANCE_RATE = 0.01
const TRAGBARKEIT_AMORT_TARGET_LTV = 0.65
const TRAGBARKEIT_AMORT_YEARS = 15
const TRAGBARKEIT_MAX_RATIO = 1 / 3

function AppContent() {
  const { t, language } = useLanguage()

  // State with persistence
  const [kaufpreis, setKaufpreis] = usePersistentState('kaufpreis')

  const [zielMonat, setZielMonat] = useState<string>(() => localStorage.getItem('zielMonat') || defaultTargetMonth())

  useEffect(() => {
    localStorage.setItem('zielMonat', zielMonat)
  }, [zielMonat])

  const [barvermoegen, setBarvermoegen] = usePersistentState('barvermoegen')
  const [saeule3a, setSaeule3a] = usePersistentState('saeule3a')
  const [pensionskasse, setPensionskasse] = usePersistentState('pensionskasse')
  const [andereVermoegen, setAndereVermoegen] = usePersistentState('andereVermoegen')

  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [personTab, setPersonTab] = useState<'1' | '2'>('1')

  const [saeule3aMonatlich, setSaeule3aMonatlich] = usePersistentState('saeule3aMonatlich')
  const [pensionskasseMonatlich, setPensionskasseMonatlich] = usePersistentState('pensionskasseMonatlich')
  const [sonstigeSparrateMonatlich, setSonstigeSparrateMonatlich] = usePersistentState('sonstigeSparrateMonatlich')
  const [bruttoeinkommen, setBruttoeinkommen] = usePersistentState('bruttoeinkommen')
  const [bruttoeinkommen2, setBruttoeinkommen2] = usePersistentState('bruttoeinkommen2')

  const [equityPct, setEquityPct] = usePersistentState('equityPct')
  const [softEquityPct, setSoftEquityPct] = usePersistentState('softEquityPct')
  const [growthRateLiquid, setGrowthRateLiquid] = usePersistentState('growthRateLiquid')
  const [growthRate3a, setGrowthRate3a] = usePersistentState('growthRate3a')
  const [growthRatePK, setGrowthRatePK] = usePersistentState('growthRatePK')

  // Person 2
  const [person2Active, setPerson2Active] = useState(() => localStorage.getItem('person2Active') === 'true')
  useEffect(() => { localStorage.setItem('person2Active', String(person2Active)) }, [person2Active])
  const [barvermoegen2, setBarvermoegen2] = usePersistentState('barvermoegen2')
  const [saeule3a2, setSaeule3a2] = usePersistentState('saeule3a2')
  const [pensionskasse2, setPensionskasse2] = usePersistentState('pensionskasse2')
  const [andereVermoegen2, setAndereVermoegen2] = usePersistentState('andereVermoegen2')
  const [saeule3aMonatlich2, setSaeule3aMonatlich2] = usePersistentState('saeule3aMonatlich2')
  const [pensionskasseMonatlich2, setPensionskasseMonatlich2] = usePersistentState('pensionskasseMonatlich2')
  const [sonstigeSparrateMonatlich2, setSonstigeSparrateMonatlich2] = usePersistentState('sonstigeSparrateMonatlich2')

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

  const handleReset = () => {
    setKaufpreis(DEFAULTS.kaufpreis)
    setZielMonat(defaultTargetMonth())
    setBarvermoegen(DEFAULTS.barvermoegen)
    setSaeule3a(DEFAULTS.saeule3a)
    setPensionskasse(DEFAULTS.pensionskasse)
    setAndereVermoegen(DEFAULTS.andereVermoegen)
    setSaeule3aMonatlich(DEFAULTS.saeule3aMonatlich)
    setPensionskasseMonatlich(DEFAULTS.pensionskasseMonatlich)
    setSonstigeSparrateMonatlich(DEFAULTS.sonstigeSparrateMonatlich)
    setBruttoeinkommen(DEFAULTS.bruttoeinkommen)
    setBruttoeinkommen2(DEFAULTS.bruttoeinkommen2)
    setEquityPct(DEFAULTS.equityPct)
    setSoftEquityPct(DEFAULTS.softEquityPct)
    setGrowthRateLiquid(DEFAULTS.growthRateLiquid)
    setGrowthRate3a(DEFAULTS.growthRate3a)
    setGrowthRatePK(DEFAULTS.growthRatePK)
    setPerson2Active(false)
    setPersonTab('1')
    setBarvermoegen2(DEFAULTS.barvermoegen2)
    setSaeule3a2(DEFAULTS.saeule3a2)
    setPensionskasse2(DEFAULTS.pensionskasse2)
    setAndereVermoegen2(DEFAULTS.andereVermoegen2)
    setSaeule3aMonatlich2(DEFAULTS.saeule3aMonatlich2)
    setPensionskasseMonatlich2(DEFAULTS.pensionskasseMonatlich2)
    setSonstigeSparrateMonatlich2(DEFAULTS.sonstigeSparrateMonatlich2)
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

  const equityPctN = useMemo(() => clampNum(equityPct, 10, 50, 20), [equityPct])
  const softEquityCapN = equityPctN / 2 // legal max for soft = half of total equity
  const softEquityPctN = useMemo(() => clampNum(softEquityPct, 0, softEquityCapN, Math.min(10, softEquityCapN)), [softEquityCapN, softEquityPct])
  const growthRateLiquidN = useMemo(() => clampNum(growthRateLiquid, 0, 20, 0) / 100, [growthRateLiquid])
  const growthRate3aN = useMemo(() => clampNum(growthRate3a, 0, 20, 0) / 100, [growthRate3a])
  const growthRatePKN = useMemo(() => clampNum(growthRatePK, 0, 20, 0) / 100, [growthRatePK])

  // Keep stored softEquityPct in sync when its cap shrinks (e.g. user lowered equityPct)
  useEffect(() => {
    const stored = Number.parseFloat(softEquityPct)
    if (Number.isFinite(stored) && stored > softEquityCapN) {
      setSoftEquityPct(String(softEquityCapN))
    }
  }, [softEquityCapN, softEquityPct, setSoftEquityPct])

  const totalRequired = useMemo(() => kaufpreisN * (equityPctN / 100), [equityPctN, kaufpreisN])
  const hardRequired = useMemo(() => kaufpreisN * ((equityPctN - softEquityPctN) / 100), [equityPctN, kaufpreisN, softEquityPctN])
  const softMaxAllowed = useMemo(() => kaufpreisN * (softEquityPctN / 100), [kaufpreisN, softEquityPctN])

  const priceValid = kaufpreisN > 0

  const monthsRemaining = useMemo(
    () => monthsBetweenNowAndTargetMonth(zielMonat),
    [zielMonat],
  )

  // Person 1 projections (compound monthly when its growth rate > 0)
  const s3aProjected1 = useMemo(() => projectCompound(s3aN, s3aMonthlyN, growthRate3aN, monthsRemaining), [growthRate3aN, monthsRemaining, s3aMonthlyN, s3aN])
  const pkProjected1 = useMemo(() => projectCompound(pkN, pkMonthlyN, growthRatePKN, monthsRemaining), [growthRatePKN, monthsRemaining, pkMonthlyN, pkN])
  const otherProjected1 = useMemo(() => projectCompound(otherN, otherMonthlySavingsN, growthRateLiquidN, monthsRemaining), [growthRateLiquidN, monthsRemaining, otherMonthlySavingsN, otherN])

  // Person 2 projections
  const s3aProjected2 = useMemo(() => projectCompound(s3aN2, s3aMonthlyN2, growthRate3aN, monthsRemaining), [growthRate3aN, monthsRemaining, s3aMonthlyN2, s3aN2])
  const pkProjected2 = useMemo(() => projectCompound(pkN2, pkMonthlyN2, growthRatePKN, monthsRemaining), [growthRatePKN, monthsRemaining, pkMonthlyN2, pkN2])
  const otherProjected2 = useMemo(() => projectCompound(otherN2, otherMonthlySavingsN2, growthRateLiquidN, monthsRemaining), [growthRateLiquidN, monthsRemaining, otherMonthlySavingsN2, otherN2])

  // Combined
  const s3aProjected = useMemo(() => s3aProjected1 + s3aProjected2, [s3aProjected1, s3aProjected2])
  const pkProjected = useMemo(() => pkProjected1 + pkProjected2, [pkProjected1, pkProjected2])
  const otherProjected = useMemo(() => otherProjected1 + otherProjected2, [otherProjected1, otherProjected2])

  const liquidAtTarget = barN + barN2 + otherProjected
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

  // PK only counts toward equity up to softMaxAllowed (bank rule)
  const usableSoftAtTarget = useMemo(
    () => Math.min(pkProjected, softMaxAllowed),
    [pkProjected, softMaxAllowed],
  )
  const usableTotalAtTarget = useMemo(
    () => hardAssetsAtTarget + usableSoftAtTarget,
    [hardAssetsAtTarget, usableSoftAtTarget],
  )

  const totalShortfallAtTarget = useMemo(
    () => Math.max(0, totalRequired - usableTotalAtTarget),
    [totalRequired, usableTotalAtTarget],
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
    return clamp01(usableTotalAtTarget / totalRequired)
  }, [totalRequired, usableTotalAtTarget])

  const hardRuleMet = hardAssetsAtTarget >= hardRequired
  const totalRuleMet = usableTotalAtTarget >= totalRequired

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

  // Progress bar segments — soft capped at the legal/user soft limit, hard fills the rest
  const softCapped = Math.min(pkProjected, softMaxAllowed)
  const hardCapped = Math.min(hardAssetsAtTarget, Math.max(0, totalRequired - softCapped))
  const liquidCapped = Math.min(liquidAtTarget, hardCapped)
  const gapDisplay = Math.max(0, totalRequired - hardCapped - softCapped)

  // Today's totals (sum of person 1 + 2 current values, before projection)
  const todayTotal = barN + barN2 + s3aN + s3aN2 + otherN + otherN2 + pkN + pkN2

  // Tragbarkeit (Swiss affordability check)
  const incomeN = useMemo(() => parseMoney(bruttoeinkommen), [bruttoeinkommen])
  const incomeN2 = useMemo(() => person2Active ? parseMoney(bruttoeinkommen2) : 0, [person2Active, bruttoeinkommen2])
  const totalIncome = incomeN + incomeN2

  const mortgageAmount = useMemo(() => kaufpreisN * (1 - equityPctN / 100), [equityPctN, kaufpreisN])
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
  const tragbarkeitStatus: RuleStatus = !priceValid || totalIncome <= 0 ? 'pending' : tragbarkeitPasses ? 'pass' : 'fail'

  const asideRef = useRef<HTMLElement>(null)
  const stickyTop = useStickyTop(asideRef, 80)

  const showP2 = person2Active && personTab === '2'
  const pctLabel = (n: number) => formatNumber(n, 1)

  const setHousehold = (value: 'single' | 'couple') => {
    const on = value === 'couple'
    setPerson2Active(on)
    setPersonTab(on ? '2' : '1')
  }

  const personSwitch = person2Active ? (
    <SegmentedControl<'1' | '2'>
      className="w-full sm:col-span-2"
      ariaLabel={t('app.person_switch_label')}
      value={personTab}
      onChange={setPersonTab}
      options={[
        { value: '1', label: t('app.person1_section'), icon: <User aria-hidden="true" /> },
        { value: '2', label: t('app.person2_section'), icon: <User aria-hidden="true" /> },
      ]}
    />
  ) : null

  const s3aMonthlyShown = showP2 ? s3aMonthlyN2 : s3aMonthlyN
  const s3aCapWarning = s3aMonthlyShown * 12 > PILLAR_3A_ANNUAL_CAP
    ? t('app.warning_3a_cap', { cap: formatCHF(PILLAR_3A_ANNUAL_CAP, { decimals: 0 }), current: formatCHF(s3aMonthlyShown * 12, { decimals: 0 }) })
    : undefined

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <div className="min-h-dvh bg-background text-fg">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg"
        >
          {t('app.skip_to_content')}
        </a>

        <AppHeader onOpenWizard={() => setIsWizardOpen(true)} />

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

        <main id="main" className="mx-auto w-full max-w-7xl px-4 pb-32 pt-6 sm:px-6 lg:px-8 lg:pb-16 lg:pt-8">
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_440px]">
            {/* Inputs */}
            <div className="min-w-0 space-y-6">
              <Card aria-labelledby="sec-objekt">
                <CardHeader id="sec-objekt" step={1} title={t('app.card_obj_title')} description={t('app.card_obj_desc')} />
                <CardBody className="grid gap-5 sm:grid-cols-2">
                  <SliderInput
                    id="kaufpreis"
                    label={t('app.label_kaufpreis')}
                    value={kaufpreis}
                    onChange={setKaufpreis}
                    min={0}
                    max={5000000}
                    step={10000}
                  />
                  <div className="space-y-1.5">
                    <div className="flex min-h-5 items-baseline justify-between gap-3">
                      <label htmlFor="zielmonat" className="text-sm font-medium text-fg">{t('app.label_zielmonat')}</label>
                      <span className="text-xs tabular-nums text-fg-muted">{t('app.months_until', { n: monthsRemaining })}</span>
                    </div>
                    <MonthPicker id="zielmonat" value={zielMonat} onChange={setZielMonat} hasError={invalidDate} />
                  </div>
                </CardBody>
              </Card>

              <Card aria-labelledby="sec-assets">
                <CardHeader
                  id="sec-assets"
                  step={2}
                  title={t('app.card_assets_title')}
                  description={t('app.card_assets_desc')}
                  action={
                    <SegmentedControl<'single' | 'couple'>
                      size="sm"
                      ariaLabel={t('app.household_label')}
                      value={person2Active ? 'couple' : 'single'}
                      onChange={setHousehold}
                      options={[
                        { value: 'single', label: t('app.household_single'), icon: <User aria-hidden="true" /> },
                        { value: 'couple', label: t('app.household_couple'), icon: <Users aria-hidden="true" /> },
                      ]}
                    />
                  }
                />
                <CardBody className="grid gap-5 sm:grid-cols-2">
                  {personSwitch}
                  <SliderInput
                    key={`bar-${personTab}`}
                    id={showP2 ? 'barvermoegen2' : 'barvermoegen'}
                    label={t('app.label_bar')}
                    value={showP2 ? barvermoegen2 : barvermoegen}
                    onChange={showP2 ? setBarvermoegen2 : setBarvermoegen}
                    max={500000}
                    step={1000}
                  />
                  <SliderInput
                    key={`3a-${personTab}`}
                    id={showP2 ? 'saeule3a2' : 'saeule3a'}
                    label={t('app.label_3a')}
                    value={showP2 ? saeule3a2 : saeule3a}
                    onChange={showP2 ? setSaeule3a2 : setSaeule3a}
                    max={200000}
                    step={1000}
                  />
                  <SliderInput
                    key={`pk-${personTab}`}
                    id={showP2 ? 'pensionskasse2' : 'pensionskasse'}
                    label={t('app.label_pk')}
                    value={showP2 ? pensionskasse2 : pensionskasse}
                    onChange={showP2 ? setPensionskasse2 : setPensionskasse}
                    max={1000000}
                    step={1000}
                    hint={t('app.hint_pk')}
                  />
                  <SliderInput
                    key={`other-${personTab}`}
                    id={showP2 ? 'andere2' : 'andere'}
                    label={t('app.label_other')}
                    value={showP2 ? andereVermoegen2 : andereVermoegen}
                    onChange={showP2 ? setAndereVermoegen2 : setAndereVermoegen}
                    max={200000}
                    step={1000}
                    hint={t('app.hint_other')}
                  />
                </CardBody>
              </Card>

              <Card aria-labelledby="sec-monthly">
                <CardHeader id="sec-monthly" step={3} title={t('app.card_monthly_title')} description={t('app.card_monthly_desc')} />
                <CardBody className="grid gap-5 sm:grid-cols-2">
                  {personSwitch}
                  <SliderInput
                    key={`3a-mt-${personTab}`}
                    id={showP2 ? 'saeule3aMonatlich2' : 'saeule3aMonatlich'}
                    label={t('app.label_3a_monthly')}
                    value={showP2 ? saeule3aMonatlich2 : saeule3aMonatlich}
                    onChange={showP2 ? setSaeule3aMonatlich2 : setSaeule3aMonatlich}
                    max={3000}
                    step={50}
                    warning={s3aCapWarning}
                  />
                  <SliderInput
                    key={`pk-mt-${personTab}`}
                    id={showP2 ? 'pensionskasseMonatlich2' : 'pensionskasseMonatlich'}
                    label={t('app.label_pk_monthly')}
                    value={showP2 ? pensionskasseMonatlich2 : pensionskasseMonatlich}
                    onChange={showP2 ? setPensionskasseMonatlich2 : setPensionskasseMonatlich}
                    max={5000}
                    step={50}
                    hint={t('app.hint_pk_monthly')}
                  />
                  <SliderInput
                    key={`other-mt-${personTab}`}
                    id={showP2 ? 'sonstigeSparrateMonatlich2' : 'sonstigeSparrateMonatlich'}
                    label={t('app.label_other_monthly')}
                    value={showP2 ? sonstigeSparrateMonatlich2 : sonstigeSparrateMonatlich}
                    onChange={showP2 ? setSonstigeSparrateMonatlich2 : setSonstigeSparrateMonatlich}
                    max={20000}
                    step={50}
                    hint={t('app.hint_other_monthly')}
                  />
                </CardBody>
              </Card>

              <Card aria-labelledby="sec-income">
                <CardHeader id="sec-income" step={4} title={t('app.card_income_title')} description={t('app.card_income_desc')} />
                <CardBody className="grid gap-5 sm:grid-cols-2">
                  {personSwitch}
                  <SliderInput
                    key={`income-${personTab}`}
                    id={showP2 ? 'bruttoeinkommen2' : 'bruttoeinkommen'}
                    label={t('app.label_income')}
                    value={showP2 ? bruttoeinkommen2 : bruttoeinkommen}
                    onChange={showP2 ? setBruttoeinkommen2 : setBruttoeinkommen}
                    max={500000}
                    step={1000}
                    hint={t('app.hint_income')}
                  />
                  {person2Active && (
                    <div className="self-start rounded-xl bg-subtle px-4 py-3 sm:mt-6.5">
                      <p className="text-xs text-fg-muted">{t('app.household_income')}</p>
                      <p className="mt-0.5 text-sm font-semibold tabular-nums text-fg">{formatCHF(totalIncome, { decimals: 0 })}</p>
                    </div>
                  )}
                </CardBody>
              </Card>

              <details className="group rounded-2xl border border-border bg-surface shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
                <summary className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl px-5 py-5 sm:px-6">
                  <span className="flex min-w-0 items-start gap-3">
                    <span aria-hidden="true" className="mt-px flex size-6 shrink-0 items-center justify-center rounded-full bg-subtle text-fg-secondary ring-1 ring-inset ring-border">
                      <SlidersHorizontal className="size-3.5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-base font-semibold leading-6 tracking-tight text-fg">{t('app.card_assumptions_title')}</span>
                      <span className="mt-0.5 block text-sm text-fg-muted">
                        {t('app.assumptions_summary', {
                          equity: pctLabel(equityPctN),
                          soft: pctLabel(softEquityPctN),
                          rates: [growthRateLiquidN, growthRate3aN, growthRatePKN].map((r) => pctLabel(r * 100)).join(' / '),
                        })}
                      </span>
                    </span>
                  </span>
                  <ChevronDown aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-fg-muted transition-transform group-open:rotate-180" />
                </summary>
                <div className="space-y-6 border-t border-border px-5 py-5 sm:px-6 sm:py-6">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <SliderInput
                      id="equityPct"
                      label={t('app.label_equity_pct')}
                      value={equityPct}
                      onChange={setEquityPct}
                      min={10}
                      max={50}
                      step={1}
                      unit="percent"
                      hint={t('app.hint_equity_pct')}
                    />
                    <SliderInput
                      id="softEquityPct"
                      label={t('app.label_soft_pct')}
                      value={softEquityPct}
                      onChange={setSoftEquityPct}
                      min={0}
                      max={softEquityCapN}
                      step={1}
                      unit="percent"
                      hint={t('app.hint_soft_pct')}
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-fg">{t('app.growth_rates_title')}</h3>
                    <p className="mt-0.5 text-xs leading-relaxed text-fg-muted">{t('app.growth_rate_hint')}</p>
                    <div className="mt-4 grid gap-5 sm:grid-cols-3">
                      <SliderInput
                        id="growthRateLiquid"
                        label={t('app.label_growth_liquid')}
                        value={growthRateLiquid}
                        onChange={setGrowthRateLiquid}
                        min={0}
                        max={10}
                        step={0.1}
                        unit="percent"
                      />
                      <SliderInput
                        id="growthRate3a"
                        label={t('app.label_growth_3a')}
                        value={growthRate3a}
                        onChange={setGrowthRate3a}
                        min={0}
                        max={10}
                        step={0.1}
                        unit="percent"
                      />
                      <SliderInput
                        id="growthRatePK"
                        label={t('app.label_growth_pk')}
                        value={growthRatePK}
                        onChange={setGrowthRatePK}
                        min={0}
                        max={10}
                        step={0.1}
                        unit="percent"
                      />
                    </div>
                  </div>
                  <Disclosure summary={t('app.info_wef_title')}>
                    <p className="text-xs leading-relaxed text-fg-muted">{t('app.info_wef_text')}</p>
                  </Disclosure>
                </div>
              </details>
            </div>

            {/* Result */}
            <aside ref={asideRef} className="min-w-0 lg:sticky" style={{ top: stickyTop }}>
              <ResultSummary
                priceValid={priceValid}
                goalReached={savingsGap <= 0}
                monthlySavingsTarget={monthlySavingsTarget}
                invalidDate={invalidDate}
                targetDateLabel={targetDateLabel}
                equityPct={equityPctN}
                hardPct={equityPctN - softEquityPctN}
                softPct={softEquityPctN}
                totalRequired={totalRequired}
                hardRequired={hardRequired}
                usableTotal={usableTotalAtTarget}
                hardTotal={hardAssetsAtTarget}
                progress={totalProgress}
                amounts={{ liquid: liquidAtTarget, s3a: s3aProjected, pk: pkProjected }}
                segments={{ liquid: liquidCapped, s3a: hardCapped - liquidCapped, pk: softCapped, gap: gapDisplay }}
                todayTotal={todayTotal}
                hardShortfall={hardShortfallAtTarget}
                showHardWarning={showHardWarning}
                pkOverflow={priceValid ? Math.max(0, pkProjected - softMaxAllowed) : 0}
                affordability={{ status: tragbarkeitStatus, ratio: tragbarkeitRatio, maxRatio: TRAGBARKEIT_MAX_RATIO }}
                persons={person2Active ? { p1: hardP1AtTarget + pkProjected1, p2: hardP2AtTarget + pkProjected2 } : null}
              />
            </aside>
          </div>

          {/* Details */}
          <div className="mt-6 grid items-start gap-6 lg:mt-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_440px]">
            <Card aria-labelledby="sec-growth" className="min-w-0">
              <CardHeader id="sec-growth" title={t('app.card_growth_title')} description={t('app.card_growth_desc')} />
              <CardBody>
                <Suspense fallback={<div className="h-80 animate-pulse rounded-xl bg-subtle" />}>
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
                    annualRateLiquid={growthRateLiquidN}
                    annualRate3a={growthRate3aN}
                    annualRatePK={growthRatePKN}
                  />
                </Suspense>
                <p className="mt-4 text-xs text-fg-muted">{t('app.growth_note')}</p>
              </CardBody>
            </Card>

            <AffordabilityCard
              priceValid={priceValid}
              totalIncome={totalIncome}
              ratio={tragbarkeitRatio}
              passes={tragbarkeitPasses}
              maxRatio={TRAGBARKEIT_MAX_RATIO}
              mortgageAmount={mortgageAmount}
              mortgagePct={100 - equityPctN}
              annualInterest={annualInterest}
              annualAmortization={annualAmortization}
              annualMaintenance={annualMaintenance}
              annualHousingCost={annualHousingCost}
              requiredIncome={requiredIncome}
            />
          </div>

          <footer className="mt-12 flex flex-col gap-4 border-t border-border pt-6 text-xs text-fg-muted sm:flex-row sm:items-start sm:justify-between">
            <p className="max-w-2xl leading-relaxed">{t('app.disclaimer')}</p>
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 sm:shrink-0">
              <span className="inline-flex items-center gap-1.5">
                <Lock aria-hidden="true" className="size-3.5" />
                {t('app.saved_locally')}
              </span>
              <ResetButton onReset={handleReset} />
            </div>
          </footer>
        </main>

        <MobileSummaryBar
          targetId="ergebnis"
          priceValid={priceValid}
          goalReached={savingsGap <= 0}
          monthlySavingsTarget={monthlySavingsTarget}
          progress={totalProgress}
        />
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
