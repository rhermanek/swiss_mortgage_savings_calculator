// Month-by-month asset projection, shared by the chart and the printable
// summary. Compounds monthly per asset class (linear when its rate is 0).

export type PersonAssets = {
  liquid: number
  liquidMonthly: number
  s3a: number
  s3aMonthly: number
  pk: number
  pkMonthly: number
}

export type ProjectionPoint = {
  date: Date
  liquid: number
  s3a: number
  pk: number
  p1: number
  p2: number
  total: number
}

const EMPTY: PersonAssets = { liquid: 0, liquidMonthly: 0, s3a: 0, s3aMonthly: 0, pk: 0, pkMonthly: 0 }

export function buildProjection(input: {
  months: number
  p1: PersonAssets
  p2?: PersonAssets | null
  rates: { liquid: number; s3a: number; pk: number }
}): ProjectionPoint[] {
  const { months, p1, rates } = input
  if (months <= 0) return []
  const p2 = input.p2 ?? EMPTY

  const rate = (annual: number) => (annual > 0 && Number.isFinite(annual) ? annual / 12 : 0)
  const rLiquid = rate(rates.liquid)
  const r3a = rate(rates.s3a)
  const rPK = rate(rates.pk)

  const a = { liquid: p1.liquid, s3a: p1.s3a, pk: p1.pk }
  const b = { liquid: p2.liquid, s3a: p2.s3a, pk: p2.pk }

  const points: ProjectionPoint[] = []
  const now = new Date()
  for (let i = 0; i <= months; i++) {
    if (i > 0) {
      a.liquid = a.liquid * (1 + rLiquid) + p1.liquidMonthly
      a.s3a = a.s3a * (1 + r3a) + p1.s3aMonthly
      a.pk = a.pk * (1 + rPK) + p1.pkMonthly
      b.liquid = b.liquid * (1 + rLiquid) + p2.liquidMonthly
      b.s3a = b.s3a * (1 + r3a) + p2.s3aMonthly
      b.pk = b.pk * (1 + rPK) + p2.pkMonthly
    }
    const sumA = a.liquid + a.s3a + a.pk
    const sumB = b.liquid + b.s3a + b.pk
    points.push({
      date: new Date(now.getFullYear(), now.getMonth() + i, 1),
      liquid: a.liquid + b.liquid,
      s3a: a.s3a + b.s3a,
      pk: a.pk + b.pk,
      p1: sumA,
      p2: sumB,
      total: sumA + sumB,
    })
  }
  return points
}

// Yearly rows plus the purchase month and the last projected month.
export function projectionRowIndices(length: number, targetMonthIndex: number): number[] {
  const idx = new Set<number>()
  for (let i = 0; i < length; i += 12) idx.add(i)
  if (targetMonthIndex >= 0 && targetMonthIndex < length) idx.add(targetMonthIndex)
  if (length) idx.add(length - 1)
  return [...idx].sort((x, y) => x - y)
}
