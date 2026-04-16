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

**Theme:** Light/dark via `ThemeProvider` (wraps the app) + `ThemeToggle`. Storage key: `vite-ui-theme`.

**Two-person mode:** Person 2 assets are conditionally included in projections. Toggled via `person2Active` (localStorage persisted).

**Wizard:** Modal overlay (`src/components/Wizard.tsx`) that mirrors all `AppContent` inputs. On complete, calls `handleWizardComplete` which sets all state in one shot.

## Key files

| File | Role |
|------|------|
| `src/App.tsx` | All state, derived calculations, layout |
| `src/i18n/translations.ts` | All UI strings (DE + EN) |
| `src/i18n/LanguageContext.tsx` | `useLanguage()` / `t()` |
| `src/components/GrowthChart.tsx` | Stacked area chart; accepts optional `*2` props for person 2 |
| `src/components/DonutChart.tsx` | Equity composition chart |
| `src/components/SliderInput.tsx` | Shared slider + text input for money values |
| `src/components/Wizard.tsx` | Step-by-step setup modal; exports `WizardValues` type |
| `src/components/MonthPicker.tsx` | Custom month/year picker (Radix Popover) |

## Deployment

Pushes to `main` trigger GitHub Actions → GitHub Pages (`./dist`).
