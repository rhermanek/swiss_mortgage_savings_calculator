# Swiss Mortgage Savings Calculator (Eigenmittel Rechner)

A modern, interactive React application designed to help future Swiss homeowners plan their savings and downpayment strategy. It specifically handles Swiss mortgage requirements, distinguishing between "Hard Equity" (Cash, Pillar 3a) and "Soft Equity" (Pension Fund).

## Features

-   **Interactive Inputs**: Real-time updates for purchase price, current assets, and monthly savings.
-   **Swiss Mortgage Rules**: Automatically checks for:
    -   Minimum 20% total equity.
    -   Minimum 10% "Hard Equity" (not from Pension Fund).
-   **Visualizations**:
    -   **Equity Breakdown**: Donut chart showing the composition of your potential downpayment.
    -   **Growth Projection**: 3-Way Stacked Area Chart projecting your future assets over time.
        -   **Blue**: Liquid Assets (Cash, Savings).
        -   **Indigo**: Pillar 3a (Restricted).
        -   **Green**: Pension Fund (Soft Equity).
    -   **Combined Tooltips**: Hover over charts to see exact values for specific dates.
-   **Target Date Planning**: Integrated custom **Month Picker** to easily set your buying horizon.

## Tech Stack

-   **Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Components**: [Radix UI](https://www.radix-ui.com/) (Primitives), [Lucide React](https://lucide.dev/) (Icons)
-   **Charts**: [Recharts](https://recharts.org/)
-   **Dates**: [date-fns](https://date-fns.org/)

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

-   `src/App.tsx`: Main application logic and layout.
-   `src/components/GrowthChart.tsx`: Custom stacked area chart visualization.
-   `src/components/MonthPicker.tsx`: Accessible month/year selection component.
-   `src/components/DonutChart.tsx`: Equity composition chart.
