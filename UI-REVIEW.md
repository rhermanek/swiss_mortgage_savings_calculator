# UI/UX Review — Eigenmittel-Rechner

Review date: 2026-05-01
Reviewer: Claude (Opus 4.7)
Scope: visual + UX of webapp at desktop 1440 / mobile 375 / dark+light

## Verdict

No full redo. Architecture is solid (single state source in `App.tsx`, `useMemo` derivations,
`localStorage` persistence). Code quality fine. UI is generic shadcn-style but functional.
Iterate on info hierarchy, sticky layout, input verbosity. A redo would only pay off
combined with rebrand + adding interest/Tragbarkeit modelling.

---

## Findings

### 1. Layout

- `max-w-6xl` (1152px) too narrow at 1440px viewport — large empty gutters.
  Bump to `max-w-7xl` or `2xl:max-w-[1400px]`.
- Right "analysis" column ends well above left "inputs" column. While user scrolls
  inputs, the result is off-screen. Right column should be `sticky top-8` so the
  recommendation stays in view.
- `lg:grid-cols-2` breaks at 1024 — common 1366px laptops get a cramped two-column.
  Prefer `xl:grid-cols-[1fr_460px]` (fixed sidebar width).
- Three stacked input cards with `space-y-8` between waste vertical space. Consider
  one card with section dividers.

### 2. Information hierarchy (highest impact)

- Core output `CHF 333 / Monat` is buried below the donut chart at
  `src/App.tsx:762`. This is the single most actionable number in the app.
- Restructure analysis card top → bottom:
  1. **Hero**: `CHF X / Monat` — large font, one sentence: "to reach 20% by <date>".
  2. **Progress bar** today → at-target → goal. Single horizontal viz beats donut
     for "am I on track".
  3. Donut becomes secondary / optional.
  4. Hard-equity warning inline below.
- Donut center "95% des Ziels erreicht" + legend + status pill all repeat. Pick one.

### 3. Header bloat

- Header eats ~250px before any content (`src/App.tsx:327-393`).
- Logo `h-24 sm:h-32` too tall. `h-12` inline next to title.
- Subtitle "Planen Sie Ihr Eigenheim..." is filler — drop.
- Mobile: title + logo + pill + subtitle + 3 buttons ≈ 600px before scroll.
  Compact sticky header on scroll.

### 4. Inputs

- Slider + input combo on every money field — 7 fields, doubled to 14 with partner.
  Sliders bad for "exactly 60'000". Make slider opt-in (expand icon), or remove.
- Slider max values misleading: 3a max 200'000 (annual cap ~7.3k); PK max 500k
  (real PK can be 1M+). Gives false range.
- No live "today total" / "at target total" summary in input column.
- Each row could show projected delta: "30'000 → 42'000 by target".

### 5. Two-person mode

- Inputs duplicated in two stacked sections at `src/App.tsx:485-594`. Use tabs
  (P1 / P2) within one card — saves ~600px scroll.
- Wizard step 4 (`src/components/Wizard.tsx:198`) has the same duplication.

### 6. Growth chart (`src/components/GrowthChart.tsx`)

- `targetAmount` prop received but unused. Add `<ReferenceLine>` at the target
  amount.
- Add vertical line at target month.
- 6 stacked series with person2 is noisy. Add toggle "stack by person" vs
  "stack by asset type".
- Y-axis uses compact format — fine; add CHF prefix.

### 7. Accessibility

- Logo `alt="Logo"` non-descriptive (`src/App.tsx:329`).
- Slider thumb 20px — below 24px min touch target.
- Charts have no text alternative.
- Hint text `src/components/SliderInput.tsx:138` not linked via `aria-describedby`.
- Hardcoded "Ungültiger Wert / Invalid value" at
  `src/components/SliderInput.tsx:137` bypasses i18n.

### 8. Modeling gaps (UX-relevant)

- Linear projection only — PK and 3a actually compound. User estimate is off.
- No 3a withdrawal cap for WEF (Wohneigentumsförderung) modelled.
- No Tragbarkeit (affordability) check. User can hit 20% equity but fail income
  test → plan unusable in practice.
- No legal disclaimer ("nicht Anlageberatung").

### 9. Polish

- Inline confirm-remove-partner pattern (`src/App.tsx:529`) is good — keep.
- Wizard gradient blue→indigo + emerald — generic SaaS template feel. Pick one
  accent (Swiss red?) for brand.
- localStorage persistence is invisible. Small "gespeichert" indicator or Reset
  button would help.
- `parseMoney` curly-apostrophe handling is correct — keep.

---

## Priority order

1. **Sticky right column + wider container** (~1 hr)
2. **Hero result card restructure** (~2 hr)
3. **Tabs for P1/P2 in inputs** (~2 hr)
4. **`ReferenceLine` for target on growth chart** (~15 min)
5. **Compact header** (~30 min)
6. **Slider opt-in** (~1 hr)
7. **Tragbarkeit card** (~4 hr — biggest product impact)
