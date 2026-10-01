// Shared number parsing/formatting. Amounts always use Swiss conventions
// (1'234.50) regardless of UI language.

export function parseMoney(raw: string): number {
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

export function isValidNumberInput(raw: string): boolean {
  const trimmed = raw.trim()
  if (!trimmed) return true
  const normalized = trimmed.replaceAll('’', '').replaceAll("'", '').replace(/\s/g, '')
  return /^[0-9]+([.,][0-9]*)?$/.test(normalized)
}

function swiss(s: string) {
  return s.replaceAll('’', "'").replaceAll(' ', ' ')
}

export function formatNumber(value: number, maximumFractionDigits = 2) {
  return swiss(new Intl.NumberFormat('de-CH', { maximumFractionDigits }).format(value))
}

export function formatCHF(value: number, opts?: { decimals?: number }) {
  const decimals = opts?.decimals ?? 2
  return swiss(
    new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value),
  )
}

// Axis/label shorthand: "160K" in English, "160'000" / "1.6 Mio." in German.
export function formatCompact(value: number, language: string) {
  const locale = language === 'en' ? 'en-CH' : 'de-CH'
  return swiss(new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(value))
}
