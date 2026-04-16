# Swiss Mortgage Savings Calculator (Eigenmittel Rechner)

A modern, interactive React application designed to help future Swiss homeowners plan their savings and downpayment strategy. It specifically handles Swiss mortgage requirements, distinguishing between "Hard Equity" (Cash, Pillar 3a) and "Soft Equity" (Pension Fund).

## Features

-   **Interactive Inputs**: Real-time updates for purchase price, current assets, and monthly savings.
-   **Swiss Mortgage Rules**: Automatically checks for:
    -   Minimum 20% total equity.
    -   Minimum 10% "Hard Equity" (not from Pension Fund).
-   **Two-Person Mode**: Add a partner to combine assets and monthly contributions from both people.
-   **Visualizations**:
    -   **Equity Breakdown**: Donut chart showing the composition of your potential downpayment.
    -   **Growth Projection**: Stacked Area Chart projecting your future assets over time.
        -   **Blue**: Liquid Assets (Cash, Savings).
        -   **Violet**: Pillar 3a (Restricted).
        -   **Green**: Pension Fund (Soft Equity).
    -   **Combined Tooltips**: Hover over charts to see exact values for specific dates.
-   **Multi-Language Support**: Switch instantly between German 🇩🇪 and English 🇺🇸. Fully internationalized interface, including charts and date pickers.
-   **Setup Assistant (Wizard)**: A step-by-step assistant to guide beginners through the process of setting up their calculation, explaining key concepts (like Pension Fund vs. Cash) along the way.
-   **Target Date Planning**: Integrated custom **Month Picker** to easily set your buying horizon.
-   **Dark Mode**: Toggle between light and dark themes, persisted in localStorage.
-   **Persistent State**: All inputs are saved to localStorage and restored on reload.
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
-   `src/i18n/`: Internationalization — `translations.ts` (all strings), `LanguageContext.tsx` (`useLanguage` hook).
-   `src/components/GrowthChart.tsx`: Stacked area chart; supports optional `*2` props for two-person mode.
-   `src/components/DonutChart.tsx`: Equity composition donut chart.
-   `src/components/SliderInput.tsx`: Shared slider + text input for money values.
-   `src/components/MonthPicker.tsx`: Accessible month/year selection (Radix Popover).
-   `src/components/Wizard.tsx`: Step-by-step setup modal.
-   `src/components/ThemeProvider.tsx` / `ThemeToggle.tsx`: Light/dark theme support.
-   `src/components/LanguageSwitcher.tsx`: DE/EN language toggle.
