# Swiss Mortgage Savings Calculator (Eigenmittel Rechner)

A modern, interactive React application designed to help future Swiss homeowners plan their savings and downpayment strategy. It specifically handles Swiss mortgage requirements, distinguishing between "Hard Equity" (Cash, Pillar 3a) and "Soft Equity" (Pension Fund).

## Features

-   **Interactive Inputs**: Real-time updates for purchase price, current assets, and monthly savings.
-   **Swiss Mortgage Rules**: Automatically checks for:
    -   Minimum 20% total equity.
    -   Minimum 10% "Hard Equity" (not from Pension Fund).
-   **Two-Person Mode**: Add a partner to combine assets and monthly contributions from both people.
-   **Sticky result panel**: Additional monthly savings needed, a segmented equity progress bar, and a checklist of the bank criteria (20 % equity, 10 % hard equity, affordability) stay in view while you edit inputs. On mobile, a bottom bar shows the same headline number.
-   **Affordability (Tragbarkeit) check**: Imputed housing cost vs. 33 % of gross income, with a cost breakdown.
-   **Visualizations**:
    -   **Equity progress bar**: Liquid assets, Pillar 3a and pension fund toward the target, with "today" and hard-equity markers.
    -   **Growth projection**: Stacked area chart, groupable by asset or by person, with a table view.
        -   **Blue**: Liquid assets (cash, savings).
        -   **Aqua**: Pillar 3a.
        -   **Orange**: Pension fund (soft equity).
    -   Series colors are identical in the progress bar and the chart, validated for color-vision deficiency in light and dark mode.
-   **Multi-Language Support**: Switch instantly between German 🇩🇪 and English 🇺🇸. Fully internationalized interface, including charts and date pickers.
-   **Setup Assistant (Wizard)**: A step-by-step assistant to guide beginners through the process of setting up their calculation, explaining key concepts (like Pension Fund vs. Cash) along the way.
-   **Target Date Planning**: Integrated custom **Month Picker** to easily set your buying horizon.
-   **Dark Mode**: Follows the OS setting by default; the toggle choice is persisted in localStorage.
-   **Persistent State**: All inputs are saved to localStorage and restored on reload. A reset action in the footer restores the defaults.
-   **Accessibility**: Keyboard-operable segmented controls, a focus-trapped wizard dialog, labelled fields with linked hints and errors, reduced-motion support.
-   **Helpful Hints**: Explanations for complex topics (e.g. Pension Fund employer contributions).

## Tech Stack

-   **Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Components**: [Radix UI](https://www.radix-ui.com/) (Primitives), [Lucide React](https://lucide.dev/) (Icons)
-   **Charts**: [Recharts](https://recharts.org/)
-   **Dates**: [date-fns](https://date-fns.org/)
-   **i18n**: Custom Context-based solution with `date-fns` integration.

## Getting Started

1.  **Install dependencies**
    ```bash
    npm install
    ```

2.  **Run development server**
    ```bash
    npm run dev
    ```

3.  **Build for production**
    ```bash
    npm run build
    ```

## Project Structure

-   `src/App.tsx`: All state, derived calculations, and layout.
-   `src/index.css`: Design tokens (colors for light/dark, chart series, status) exposed as Tailwind utilities.
-   `src/i18n/`: Internationalization — `translations.ts` (all strings), `LanguageContext.tsx` (`useLanguage` hook).
-   `src/components/ui.tsx`: Shared primitives (card, button, segmented control, badge, callout, popover, disclosure).
-   `src/components/AppHeader.tsx`: Sticky header with wizard, language and theme controls.
-   `src/components/ResetButton.tsx`: Footer reset action with confirmation popover.
-   `src/components/ResultSummary.tsx`: Sticky result panel (savings rate, progress bar, bank criteria).
-   `src/components/AffordabilityCard.tsx`: Tragbarkeit meter and cost breakdown.
-   `src/components/MobileSummaryBar.tsx`: Bottom summary bar on small screens.
-   `src/components/GrowthChart.tsx`: Stacked area chart (lazy-loaded); supports optional `*2` props for two-person mode.
-   `src/components/SliderInput.tsx`: Shared text input with optional slider for CHF and percent values.
-   `src/components/MonthPicker.tsx`: Accessible month/year selection (Radix Popover).
-   `src/components/Wizard.tsx`: Step-by-step setup dialog (Radix Dialog).
-   `src/components/ThemeProvider.tsx` / `ThemeToggle.tsx`: Light/dark theme support.
-   `src/components/LanguageSwitcher.tsx`: DE/EN language toggle.
