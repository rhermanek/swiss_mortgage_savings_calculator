import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Coins,
  Landmark,
  PiggyBank,
  Wallet,
} from 'lucide-react'
import { DonutChart } from './components/DonutChart'
import { GrowthChart } from './components/GrowthChart'
import { MonthPicker } from './components/MonthPicker'
import { SliderInput } from './components/SliderInput'
import logoUrl from './assets/logo.png'

// Helper utilities (kept locally or could be imported if moved to utils)
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
        'rounded-2xl border border-slate-200 bg-white shadow-sm',
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
    <label htmlFor={props.htmlFor} className="text-sm font-medium text-slate-800">
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
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : tone === 'warn'
        ? 'border-amber-200 bg-amber-50 text-amber-900'
        : 'border-slate-200 bg-slate-50 text-slate-800'
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium',
        styles,
      )}
    >
      {children}
    </span>
  )
}

function App() {
  const [kaufpreis, setKaufpreis] = useState<string>("800'000")
  const [zielMonat, setZielMonat] = useState<string>('') // yyyy-mm

  const [barvermoegen, setBarvermoegen] = useState<string>("40'000")
  const [saeule3a, setSaeule3a] = useState<string>("30'000")
  const [pensionskasse, setPensionskasse] = useState<string>("60'000")
  const [andereVermoegen, setAndereVermoegen] = useState<string>("10'000")

  const [saeule3aMonatlich, setSaeule3aMonatlich] = useState<string>('500')
  const [pensionskasseMonatlich, setPensionskasseMonatlich] = useState<string>('0')

  useEffect(() => {
    // Default: 24 months in the future (month selector expects yyyy-mm)
    const now = new Date()
    const target = new Date(now.getFullYear(), now.getMonth() + 24, 1)
    const yyyy = target.getFullYear()
    const mm = String(target.getMonth() + 1).padStart(2, '0')
    setZielMonat(`${yyyy}-${mm}`)
  }, [])

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



  // Projection to target date (linear, no return) based on user-defined monthly contributions.
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

  // Additional savings needed (beyond the planned PK/3a monthly payments) to satisfy both rules.
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
    <div className="min-h-screen pb-20 font-sans text-slate-900">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="flex items-center gap-6 mb-10">
          <img src={logoUrl} alt="Logo" className="h-32 w-auto shrink-0" />
          <div className="flex flex-col gap-2 w-full">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Eigenmittel
              </h1>
              <Pill tone="info">
                <Landmark className="h-4 w-4" />
                Regeln: 20% Eigenmittel / mind. 10% harte Eigenmittel
              </Pill>
            </div>
            <p className="max-w-3xl text-lg text-slate-600">
              Planen Sie Ihr Eigenheim in der Schweiz: Interaktiv und einfach.
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left Column: Inputs */}
          <div className="space-y-8">
            <Card>
              <CardHeader className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold text-slate-900">Kaufobjekt</div>
                  <div className="text-sm text-slate-500">
                    Kaufpreis und Zeithorizont
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-8">
                <SliderInput
                  id="kaufpreis"
                  label="Kaufpreis (CHF)"
                  value={kaufpreis}
                  onChange={setKaufpreis}
                  min={0}
                  max={3000000}
                  step={10000}
                  icon={<Coins className="h-4 w-4" />}
                />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="zielmonat">Ziel-Kaufdatum</Label>
                    <span className="text-sm font-medium text-slate-900">{monthsRemaining} Monate</span>
                  </div>
                  <MonthPicker
                    value={zielMonat}
                    onChange={setZielMonat}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="text-lg font-semibold text-slate-900">Vermögenswerte (Aktuell)</div>
                <div className="text-sm text-slate-500">
                  Was steht heute bereits zur Verfügung?
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                <SliderInput
                  id="barvermoegen"
                  label="Barvermögen / Ersparnisse"
                  value={barvermoegen}
                  onChange={setBarvermoegen}
                  max={500000}
                  step={1000}
                  icon={<Wallet className="h-4 w-4" />}
                />
                <SliderInput
                  id="saeule3a"
                  label="Säule 3a"
                  value={saeule3a}
                  onChange={setSaeule3a}
                  max={200000}
                  step={1000}
                  icon={<PiggyBank className="h-4 w-4" />}
                />
                <SliderInput
                  id="pensionskasse"
                  label="Pensionskasse"
                  value={pensionskasse}
                  onChange={setPensionskasse}
                  max={500000}
                  step={1000}
                  hint="2. Säule – zählt NICHT zu den harten Eigenmitteln"
                  icon={<Landmark className="h-4 w-4" />}
                />
                <SliderInput
                  id="andere"
                  label="Andere Vermögenswerte"
                  value={andereVermoegen}
                  onChange={setAndereVermoegen}
                  max={200000}
                  step={1000}
                  hint="als liquide angenommen"
                  icon={<Coins className="h-4 w-4" />}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="text-lg font-semibold text-slate-900">Monatliche Einzahlungen</div>
                <div className="text-sm text-slate-500">
                  Geplante Sparraten bis zum Ziel
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                <SliderInput
                  id="saeule3aMonatlich"
                  label="Einzahlung Säule 3a / Monat"
                  value={saeule3aMonatlich}
                  onChange={setSaeule3aMonatlich}
                  max={3000}
                  step={50}
                  icon={<PiggyBank className="h-4 w-4" />}
                />
                <SliderInput
                  id="pensionskasseMonatlich"
                  label="Einzahlung Pensionskasse / Monat"
                  value={pensionskasseMonatlich}
                  onChange={setPensionskasseMonatlich}
                  max={5000}
                  step={50}
                  hint="nur für die 20%-Regel relevant"
                  icon={<Landmark className="h-4 w-4" />}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Analysis */}
          <div className="space-y-8">
            <Card className="overflow-hidden border-slate-200">
              <CardHeader className="bg-slate-50/50">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold text-slate-900">Ziel-Erreichung</div>
                    <div className="text-sm text-slate-500">
                      20% Eigenmittel ({formatCHF(totalRequired)})
                    </div>
                  </div>
                  {!priceValid ? (
                    <Pill tone="warn">Kaufpreis eingeben</Pill>
                  ) : savingsGap <= 0 ? (
                    <Pill tone="ok">Ziel erreicht</Pill>
                  ) : (
                    <Pill tone="info">{Math.round(totalProgress * 100)}% erreicht</Pill>
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
                  <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs font-medium text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <div className="h-3 w-3 rounded-full bg-emerald-500" />
                      <span>Hart ({formatCHF(hardAssetsAtTarget, { decimals: 0 })})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-3 w-3 rounded-full bg-blue-500" />
                      <span>PK ({formatCHF(pkN + pkMonthlyN * monthsRemaining, { decimals: 0 })})</span>
                    </div>
                    {savingsGap > 0 && (
                      <div className="flex items-center gap-1.5">
                        <div className="h-3 w-3 rounded-full bg-slate-200" />
                        <span>Fehlend ({formatCHF(savingsGap, { decimals: 0 })})</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6 pt-6 border-t border-slate-100">
                  {/* Summary Boxes */}
                  <div className="rounded-2xl bg-slate-50 p-6 text-center">
                    <div className="text-sm text-slate-500 mb-1">Empfohlene zusätzliche Sparrate</div>
                    <div className="text-4xl font-bold tracking-tight text-slate-900">
                      {Number.isFinite(monthlySavingsTarget) ? formatCHF(roundTo2(monthlySavingsTarget)) : '—'}
                      <span className="text-lg font-medium text-slate-500 ml-1">/ Mt</span>
                    </div>
                    {!priceValid && <div className="mt-2 text-sm text-amber-600">Bitte Kaufpreis eingeben</div>}
                    {invalidDate && <div className="mt-2 text-sm text-amber-600">Bitte Zieldatum anpassen</div>}
                  </div>

                  {showHardWarning && (
                    <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-900 border border-amber-100">
                      <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
                      <div>
                        <span className="font-semibold block mb-1">10% harte Eigenmittel nicht gedeckt</span>
                        Sie haben zwar genug Gesamtvermögen, aber zu viel davon liegt in der Pensionskasse. Sie benötigen noch {formatCHF(hardShortfallAtTarget)} aus flüssigen Mitteln.
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="text-lg font-semibold text-slate-900">Vermögensentwicklung</div>
                <div className="text-sm text-slate-500">Prognose bis zum Zielmonat unter Einhaltung der empfohlenen Sparrate</div>
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
                <div className="text-center text-xs text-slate-400 mt-4">
                  Grafik zeigt theoretischen Verlauf inkl. empfohlener Sparrate
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
