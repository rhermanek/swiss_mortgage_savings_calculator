import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Coins,
  Landmark,
  PiggyBank,
  Wallet,
} from 'lucide-react'

type MoneyInputProps = {
  id: string
  label: string
  value: string
  onChange: (next: string) => void
  hint?: string
  icon?: React.ReactNode
}

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0
  return Math.min(1, Math.max(0, n))
}

function roundTo2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

function parseMoney(raw: string): number {
  // Accepts: 1000, 1'000, 1’000.50, 1000.50, 1 000, 1'000,50
  const trimmed = raw.trim()
  if (!trimmed) return 0

  const normalized = trimmed
    .replaceAll('’', "'")
    .replaceAll(' ', '')
    .replaceAll("'", '')
    // Keep only digits, - , . , ,
    .replace(/[^\d,.\-]/g, '')

  const hasDot = normalized.includes('.')
  const hasComma = normalized.includes(',')

  let numStr = normalized
  if (hasDot && hasComma) {
    // Assume comma is thousands separator; keep dot as decimal.
    numStr = numStr.replaceAll(',', '')
  } else if (!hasDot && hasComma) {
    // Assume comma is decimal separator.
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

  // de-CH often uses a right single quote (’). Requirement asks for apostrophe (').
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
  return <div className={cx('px-5 py-4', props.className)}>{props.children}</div>
}

function Label(props: React.PropsWithChildren<{ htmlFor: string }>) {
  return (
    <label htmlFor={props.htmlFor} className="text-sm font-medium text-slate-800">
      {props.children}
    </label>
  )
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props
  return (
    <input
      className={cx(
        'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-[15px] text-slate-900 shadow-sm outline-none transition',
        'placeholder:text-slate-400 focus:border-slate-300 focus:ring-4 focus:ring-slate-100',
        'disabled:bg-slate-50 disabled:text-slate-500',
        className,
      )}
      {...rest}
    />
  )
}

function MoneyInput({ id, label, value, onChange, hint, icon }: MoneyInputProps) {
  const [isFocused, setIsFocused] = useState(false)

  const numericValue = useMemo(() => parseMoney(value), [value])
  const displayValue = useMemo(() => {
    if (isFocused) return value
    if (!value) return ''
    return formatCHF(numericValue)
  }, [isFocused, numericValue, value])

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        {icon ? (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        ) : null}
        <TextInput
          id={id}
          inputMode="decimal"
          placeholder="CHF 0.00"
          value={displayValue}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={(e) => onChange(e.target.value)}
          className={cx(icon ? 'pl-10' : undefined)}
        />
      </div>
      {hint ? <div className="text-xs leading-5 text-slate-500">{hint}</div> : null}
    </div>
  )
}

function ProgressBar({
  value,
  labelLeft,
  labelRight,
}: {
  value: number
  labelLeft: string
  labelRight: string
}) {
  const pct = Math.round(clamp01(value) * 100)
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-800">{labelLeft}</span>
        <span className="text-slate-600">{labelRight}</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-slate-900 transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
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

  const totalAssetsNow = useMemo(() => barN + s3aN + pkN + otherN, [barN, s3aN, pkN, otherN])
  // const hardAssetsNow = useMemo(() => barN + s3aN + otherN, [barN, s3aN, otherN]) // optional (not used in UI)

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
  const limitingFactor = useMemo(() => {
    if (hardShortfallAtTarget > totalShortfallAtTarget) return 'Harte Eigenmittel (10%)'
    if (totalShortfallAtTarget > hardShortfallAtTarget) return 'Gesamt-Eigenmittel (20%)'
    return 'Kein Engpass'
  }, [hardShortfallAtTarget, totalShortfallAtTarget])

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

  const hardProgress = useMemo(() => {
    if (hardRequired <= 0) return 0
    return clamp01(hardAssetsAtTarget / hardRequired)
  }, [hardAssetsAtTarget, hardRequired])

  const hardRuleMet = hardAssetsAtTarget >= hardRequired
  const totalRuleMet = totalAssetsAtTarget >= totalRequired

  const showHardWarning = totalRuleMet && !hardRuleMet
  const invalidDate = priceValid && savingsGap > 0 && monthsRemaining <= 0

  return (
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-balance text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Eigenmittel-Rechner (Schweiz)
            </h1>
            <Pill tone="info">
              <Landmark className="h-4 w-4" />
              Regeln: 20% Eigenmittel / mind. 10% harte Eigenmittel
            </Pill>
          </div>
          <p className="max-w-3xl text-sm text-slate-600">
            Client-side Rechner zur Planung der Eigenmittel. Keine Daten werden gespeichert oder gesendet.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-slate-900">Eingaben</div>
                <div className="mt-0.5 text-sm text-slate-600">
                  Beträge können auch mit <span className="font-medium">1'000.00</span> eingegeben werden.
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
                <CalendarClock className="h-4 w-4" />
                Ziel: Monat/Jahr
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <MoneyInput
                  id="kaufpreis"
                  label="Kaufpreis (CHF)"
                  value={kaufpreis}
                  onChange={setKaufpreis}
                  icon={<Coins className="h-4 w-4" />}
                />

                <div className="space-y-1.5">
                  <Label htmlFor="zielmonat">Ziel-Kaufdatum</Label>
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <CalendarClock className="h-4 w-4" />
                    </div>
                    <TextInput
                      id="zielmonat"
                      type="month"
                      value={zielMonat}
                      onChange={(e) => setZielMonat(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="text-xs text-slate-500">
                    Verbleibende Monate: <span className="font-medium text-slate-700">{monthsRemaining}</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <MoneyInput
                  id="barvermoegen"
                  label="Barvermögen / Ersparnisse"
                  value={barvermoegen}
                  onChange={setBarvermoegen}
                  icon={<Wallet className="h-4 w-4" />}
                />
                <MoneyInput
                  id="saeule3a"
                  label="Säule 3a"
                  value={saeule3a}
                  onChange={setSaeule3a}
                  icon={<PiggyBank className="h-4 w-4" />}
                />
                <MoneyInput
                  id="pensionskasse"
                  label="Pensionskasse"
                  value={pensionskasse}
                  onChange={setPensionskasse}
                  hint="2. Säule – zählt NICHT zu den harten Eigenmitteln"
                  icon={<Landmark className="h-4 w-4" />}
                />
                <MoneyInput
                  id="andere"
                  label="Andere Vermögenswerte"
                  value={andereVermoegen}
                  onChange={setAndereVermoegen}
                  hint="als liquide angenommen"
                  icon={<Coins className="h-4 w-4" />}
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-sm font-medium text-slate-900">Monatliche Einzahlungen (bis Ziel)</div>
                <div className="mt-0.5 text-xs text-slate-600">
                  Wird bis zum Zielmonat linear hochgerechnet (ohne Rendite/Verzinsung).
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <MoneyInput
                    id="saeule3aMonatlich"
                    label="Einzahlung Säule 3a / Monat"
                    value={saeule3aMonatlich}
                    onChange={setSaeule3aMonatlich}
                    icon={<PiggyBank className="h-4 w-4" />}
                  />
                  <MoneyInput
                    id="pensionskasseMonatlich"
                    label="Einzahlung Pensionskasse / Monat"
                    value={pensionskasseMonatlich}
                    onChange={setPensionskasseMonatlich}
                    hint="nur für die 20%-Regel relevant"
                    icon={<Landmark className="h-4 w-4" />}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-slate-900">Monatliches Sparziel</div>
                  <div className="mt-0.5 text-sm text-slate-600">
                    Basis ist die grössere Lücke: <span className="font-medium text-slate-800">{limitingFactor}</span>
                  </div>
                </div>
                {!priceValid ? (
                  <Pill tone="warn">
                    <AlertTriangle className="h-4 w-4" />
                    Kaufpreis eingeben
                  </Pill>
                ) : savingsGap <= 0 ? (
                  <Pill tone="ok">
                    <CheckCircle2 className="h-4 w-4" />
                    Ziel bereits erreicht
                  </Pill>
                ) : invalidDate ? (
                  <Pill tone="warn">
                    <AlertTriangle className="h-4 w-4" />
                    Zieldatum prüfen
                  </Pill>
                ) : (
                  <Pill tone="info">
                    <CalendarClock className="h-4 w-4" />
                    {monthsRemaining} Monate
                  </Pill>
                )}
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
                  <div className="text-sm text-slate-600">Sie sollten sparen:</div>
                  <div className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                    {Number.isFinite(monthlySavingsTarget)
                      ? formatCHF(roundTo2(monthlySavingsTarget))
                      : '—'}
                    <span className="ml-2 text-base font-medium text-slate-600">/ Monat</span>
                  </div>
                  {!priceValid ? (
                    <div className="mt-2 text-sm text-amber-900">
                      Bitte geben Sie zuerst einen Kaufpreis grösser als CHF 0 ein.
                    </div>
                  ) : null}
                  {invalidDate ? (
                    <div className="mt-2 text-sm text-amber-900">
                      Bitte wählen Sie ein zukünftiges Ziel-Kaufdatum (mindestens nächsten Monat).
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <div className="text-xs text-slate-500">Zu sparen (Total)</div>
                    <div className="mt-1 text-lg font-semibold text-slate-900">
                      {formatCHF(roundTo2(savingsGap))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <div className="text-xs text-slate-500">Eigenmittel am Ziel (Prognose)</div>
                    <div className="mt-1 text-lg font-semibold text-slate-900">
                      {formatCHF(roundTo2(totalAssetsAtTarget))}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Aktuell: <span className="font-medium text-slate-700">{formatCHF(roundTo2(totalAssetsNow))}</span>
                    </div>
                  </div>
                </div>

                {showHardWarning ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
                      <div>
                        <div className="font-medium">
                          Achtung: 10% harte Eigenmittel sind noch nicht gedeckt.
                        </div>
                        <div className="mt-1 text-amber-900/90">
                          Sie haben genug Gesamtvermögen für 20%, aber mind. 10% des Kaufpreises müssen aus Barvermögen,
                          Säule 3a oder anderen (liquiden) Mitteln kommen — nicht aus der Pensionskasse.
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="text-sm font-medium text-slate-900">Fortschritt & Aufschlüsselung</div>
                <div className="mt-0.5 text-sm text-slate-600">
                  Prognose zum Zieltermin (inkl. monatlicher Einzahlungen).
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone={totalRuleMet ? 'ok' : 'info'}>
                    {totalRuleMet ? <CheckCircle2 className="h-4 w-4" /> : <Coins className="h-4 w-4" />}
                    20% Gesamt: {totalRuleMet ? 'gedeckt' : 'offen'}
                  </Pill>
                  <Pill tone={hardRuleMet ? 'ok' : 'warn'}>
                    {hardRuleMet ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                    10% hart:{' '}
                    {hardRuleMet
                      ? 'gedeckt'
                      : `offen (${formatCHF(roundTo2(hardShortfallAtTarget), { decimals: 0 })})`}
                  </Pill>
                </div>
                <ProgressBar
                  value={totalProgress}
                  labelLeft="Gesamt-Eigenmittel (20%)"
                  labelRight={`${formatCHF(roundTo2(totalAssetsAtTarget), { decimals: 0 })} von ${formatCHF(roundTo2(totalRequired), { decimals: 0 })}`}
                />
                <ProgressBar
                  value={hardProgress}
                  labelLeft="Harte Eigenmittel (10%)"
                  labelRight={`${formatCHF(roundTo2(hardAssetsAtTarget), { decimals: 0 })} von ${formatCHF(roundTo2(hardRequired), { decimals: 0 })}`}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-sm font-medium text-slate-900">20% Ziel (Total)</div>
                    <div className="mt-3 flex flex-1 flex-col gap-2 text-sm">
                      <div className="flex items-start justify-between gap-3">
                        <span className="min-w-0 text-slate-600">Ziel (20%)</span>
                        <span className="whitespace-nowrap text-right font-medium tabular-nums text-slate-900">
                          {formatCHF(roundTo2(totalRequired))}
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <span className="min-w-0 text-slate-600">Prognose am Ziel</span>
                        <span className="whitespace-nowrap text-right font-medium tabular-nums text-slate-900">
                          {formatCHF(roundTo2(totalAssetsAtTarget))}
                        </span>
                      </div>
                      <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-2">
                        <span className="text-slate-600">Fehlbetrag</span>
                        <span className="whitespace-nowrap text-right font-semibold tabular-nums text-slate-900">
                          {formatCHF(roundTo2(totalShortfallAtTarget))}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-sm font-medium text-slate-900">10% harte Eigenmittel</div>
                    <div className="mt-3 flex flex-1 flex-col gap-2 text-sm">
                      <div className="flex items-start justify-between gap-3">
                        <span className="min-w-0 text-slate-600">Ziel (10%)</span>
                        <span className="whitespace-nowrap text-right font-medium tabular-nums text-slate-900">
                          {formatCHF(roundTo2(hardRequired))}
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <span className="min-w-0 text-slate-600">Prognose am Ziel (hart)</span>
                        <span className="whitespace-nowrap text-right font-medium tabular-nums text-slate-900">
                          {formatCHF(roundTo2(hardAssetsAtTarget))}
                        </span>
                      </div>
                      <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-2">
                        <span className="text-slate-600">Fehlbetrag</span>
                        <span className="whitespace-nowrap text-right font-semibold tabular-nums text-slate-900">
                          {formatCHF(roundTo2(hardShortfallAtTarget))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                    <span className="inline-flex items-center gap-1.5">
                      <Wallet className="h-4 w-4" /> Hart: Barvermögen
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <PiggyBank className="h-4 w-4" /> Hart: Säule 3a
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Coins className="h-4 w-4" /> Hart: Andere (liquid)
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Landmark className="h-4 w-4" /> Nicht-hart: Pensionskasse
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-slate-800">Geplante Einzahlungen / Monat</span>
                    <span>
                      3a:{' '}
                      <span className="font-semibold text-slate-900">{formatCHF(roundTo2(s3aMonthlyN))}</span>
                      {' · '}PK:{' '}
                      <span className="font-semibold text-slate-900">{formatCHF(roundTo2(pkMonthlyN))}</span>
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-8 text-xs text-slate-500">
          Hinweis: Dieser Rechner bildet die Mindestanforderungen (20% Eigenmittel / 10% harte Eigenmittel) ab. Banken
          können je nach Objekt/Profil zusätzliche Anforderungen stellen.
        </div>
      </div>
    </div>
  )
}

export default App
