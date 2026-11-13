# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # start dev server (Vite)
npm run build      # tsc -b && vite build
npm run lint       # ESLint
npm run preview    # preview production build
```

No test suite exists yet.

## Architecture

Single-page React + Vite app. All state lives in `App.tsx` (`AppContent`); there is no global store.

**Data flow:**
1. User input → `usePersistentState` (localStorage) → raw string values (e.g. `"800'000"`)
2. `parseMoney()` converts strings → numbers
3. Derived values computed via `useMemo` (projected totals, shortfalls, monthly savings target)
4. Computed values passed as props to chart components

**Swiss mortgage rules baked in:**
- 20% total equity required (`kaufpreisN * 0.2`)
- 10% must be "hard equity" — cash + Pillar 3a + other (not pension fund)
- Pension fund (`pensionskasse`) counts as "soft equity" only

**i18n:** Custom context in `src/i18n/`. `useLanguage()` hook exposes `t(key, params?)`. All strings go through `translations.ts`. Default language is German (`de`).

**Design system:** AiOS (Sunrise Red, Inter, floating white cards). Tokens are CSS variables in `src/index.css` (`:root` / `.dark`) mapped to Tailwind utilities via `@theme inline` (`bg-surface`, `text-fg-muted`, `bg-brand`, `bg-series-1`, `rounded-card`, `shadow-card`, ...); type styles are `t-*` utilities (`t-page-title`, `t-kpi`, `t-card-title`, `t-small`, `t-caption`, `t-pill`), plus `section-label`, `beam`, `accent-rule`. Use these instead of raw palette classes so dark mode needs no `dark:` overrides. Rules: one solid red (`primary`) button per screen, selected state is ink (`bg-fg text-surface`), status colours always carry their word, series colours in order (`series-1..3`), percent without a space (`20%`). Shared primitives live in `src/components/ui.tsx`, shared class recipes in `src/lib/styles.ts`.

**Print / PDF:** `PrintDialog` previews `PrintReport` (the two-page A4 summary for a bank meeting) and calls `window.print()`. A second copy is portalled into `#print-root` (in `index.html`); the print stylesheet hides everything else, so Ctrl+P always prints the summary. `.sheet` pins light tokens. `ReportData` is assembled in `App.tsx`. The sheet's chart is plain SVG (no Recharts) so it needs no layout measurement.

**Theme:** Light/dark via `ThemeProvider` (wraps the app) + `ThemeToggle`. Defaults to the OS setting; storage key: `vite-ui-theme`. An inline script in `index.html` applies the class before first paint.

**Two-person mode:** Person 2 assets are conditionally included in projections. Toggled via `person2Active` (localStorage persisted).

**Wizard:** Radix Dialog (`src/components/Wizard.tsx`) that mirrors the core `AppContent` inputs. On complete, calls `handleWizardComplete` which sets all state in one shot.

**Layout:** Page frame is beam → brand line → header (kicker, claim title, primary print button); no top bar. Inputs left, `ResultSummary` in a sticky right column (`useStickyTop` keeps a tall panel reachable without a nested scrollbar), chart + affordability below. Below `lg`, `MobileSummaryBar` shows the headline number.

## Key files

| File | Role |
|------|------|
| `src/App.tsx` | All state, derived calculations, layout |
| `src/i18n/translations.ts` | All UI strings (DE + EN) |
| `src/i18n/LanguageContext.tsx` | `useLanguage()` / `t()` |
| `src/index.css` | Design tokens (light/dark, chart series, status), type utilities, print rules |
| `src/lib/projection.ts` | Month-by-month projection shared by chart and print summary |
| `src/components/PrintReport.tsx` / `PrintDialog.tsx` | Printable summary sheet and its preview dialog |
| `src/components/ui.tsx` | Card, Button, SegmentedControl, Badge, Callout, InfoPopover, Disclosure |
| `src/components/ResultSummary.tsx` | Sticky result panel: savings rate, equity bar, bank criteria |
| `src/components/AffordabilityCard.tsx` | Tragbarkeit meter + breakdown |
| `src/components/GrowthChart.tsx` | Stacked area chart (lazy-loaded); accepts optional `*2` props for person 2 |
| `src/components/SliderInput.tsx` | Shared text input (CHF or %) with optional slider |
| `src/lib/format.ts` | `parseMoney`, `formatCHF`, `formatNumber`, `formatCompact` |
| `src/components/Wizard.tsx` | Step-by-step setup modal; exports `WizardValues` type |
| `src/components/MonthPicker.tsx` | Custom month/year picker (Radix Popover) |

## Deployment

Pushes to `main` trigger GitHub Actions → GitHub Pages (`./dist`).
