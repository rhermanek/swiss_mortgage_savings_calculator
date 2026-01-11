export const translations = {
    de: {
        app: {
            title: 'Eigenmittel',
            subtitle: 'Planen Sie Ihr Eigenheim in der Schweiz: Interaktiv und einfach.',
            badge_rules: 'Regeln: 20% Eigenmittel / mind. 10% harte Eigenmittel',
            btn_wizard: 'Assistent starten',

            card_obj_title: 'Kaufobjekt',
            card_obj_desc: 'Kaufpreis und Zeithorizont',
            label_kaufpreis: 'Kaufpreis (CHF)',
            label_zielmonat: 'Ziel-Kaufdatum',
            months_remaining: 'Monate',

            card_assets_title: 'Vermögenswerte (Aktuell)',
            card_assets_desc: 'Was steht heute bereits zur Verfügung?',
            label_bar: 'Barvermögen / Ersparnisse',
            label_3a: 'Säule 3a',
            label_pk: 'Pensionskasse',
            hint_pk: '2. Säule – zählt NICHT zu den harten Eigenmitteln',
            label_other: 'Andere Vermögenswerte',
            hint_other: 'als liquide angenommen',

            card_monthly_title: 'Monatliche Einzahlungen',
            card_monthly_desc: 'Geplante Sparraten bis zum Ziel',
            label_3a_monthly: 'Einzahlung Säule 3a / Monat',
            label_pk_monthly: 'Einzahlung Pensionskasse / Monat',
            hint_pk_monthly: 'nur für die 20%-Regel relevant',

            card_analysis_title: 'Ziel-Erreichung',
            label_20pct: '20% Eigenmittel',
            status_enter_price: 'Kaufpreis eingeben',
            status_goal_reached: 'Ziel erreicht',
            status_n_reached: 'erreicht',

            chart_hard: 'Hart',
            chart_pk: 'PK',
            chart_gap: 'Fehlend',

            summary_rec_savings: 'Empfohlene zusätzliche Sparrate',
            summary_per_month: '/ Mt',
            summary_error_price: 'Bitte Kaufpreis eingeben',
            summary_error_date: 'Bitte Zieldatum anpassen',

            warning_hard_title: '10% harte Eigenmittel nicht gedeckt',
            warning_hard_desc: 'Sie haben zwar genug Gesamtvermögen, aber zu viel davon liegt in der Pensionskasse. Sie benötigen noch {amount} aus flüssigen Mitteln.',

            card_growth_title: 'Vermögensentwicklung',
            card_growth_desc: 'Prognose bis zum Zielmonat unter Einhaltung der empfohlenen Sparrate',
            growth_note: 'Grafik zeigt theoretischen Verlauf inkl. empfohlener Sparrate',
            picker_placeholder: 'Datum wählen',
        },
        charts: {
            label_liquid: 'Liquide Mittel',
            label_3a: 'Säule 3a',
            label_pk: 'Pensionskasse',
            label_hard: 'Harte Eigenmittel',
            label_gap: 'Fehlbetrag',
            label_total: 'Total',
            unknown: 'Unbekannt',
            donut_center_label: 'des Ziels erreicht',
        },
        wizard: {
            step_1_title: 'Willkommen',
            step_1_desc: 'Lassen Sie uns gemeinsam Ihre Eigenmittel berechnen. Dieser Assistent führt Sie Schritt für Schritt durch die wichtigsten Angaben.',
            step_1_text: 'Wir werden gemeinsam folgende Punkte durchgehen:',
            step_1_li_1: 'Ihr Wunsch-Kaufobjekt und den Zeitrahmen',
            step_1_li_2: 'Ihr aktuelles Vermögen (Eigenkapital)',
            step_1_li_3: 'Ihre monatlichen Sparmöglichkeiten',
            step_1_end: 'Am Ende erhalten Sie eine detaillierte Auswertung und einen Sparplan.',

            step_2_title: 'Das Ziel',
            step_2_desc: 'Wie teuer darf das Traumhaus sein und wann möchten Sie es kaufen?',
            step_2_info: 'Der Kaufpreis bestimmt, wie viel Eigenmittel (mind. 20%) Sie benötigen. Das Datum bestimmt, wie viel Zeit Ihnen zum Sparen bleibt.',
            label_kaufpreis: 'Geschätzter Kaufpreis (CHF)',
            label_datum: 'Geplantes Kaufdatum',

            step_3_title: 'Vorhandenes Vermögen',
            step_3_desc: 'Was bringen Sie bereits mit?',
            step_3_info: 'Wichtig: Mindestens 10% des Kaufpreises müssen "harte" Eigenmittel sein (Sparguthaben, 3a, etc.). Pensionskassen-Guthaben gilt als "weich".',
            label_bar: 'Barvermögen / Sparkonto',
            label_3a: 'Guthaben Säule 3a',
            label_pk: 'Pensionskasse (Vorbezug oder Verpfändung)',

            step_4_title: 'Monatliches Sparen',
            step_4_desc: 'Wie viel können Sie bis zum Kaufdatum monatlich zur Seite legen?',
            step_4_info: 'Regular payments into Pillar 3a along with other savings measures help reach the goal faster.',
            label_3a_monthly: 'Monatlich in Säule 3a',
            label_pk_monthly: 'Monatlich in Pensionskasse',
            hint_pk_monthly: 'Dieser Betrag umfasst Ihren Lohnabzug für die Pensionskasse plus den Arbeitgeberbeitrag.',

            step_progress: 'Schritt {current} von {total}',
            btn_back: 'Zurück',
            btn_next: 'Weiter',
            btn_apply: 'Übernehmen'
        }
    },
    en: {
        app: {
            title: 'Equity',
            subtitle: 'Plan your home ownership in Switzerland: Interactive and simple.',
            badge_rules: 'Rules: 20% equity / min. 10% hard equity',
            btn_wizard: 'Start Wizard',

            card_obj_title: 'Property',
            card_obj_desc: 'Purchase price and time horizon',
            label_kaufpreis: 'Purchase Price (CHF)',
            label_zielmonat: 'Target Purchase Date',
            months_remaining: 'Months',

            card_assets_title: 'Assets (Current)',
            card_assets_desc: 'What is currently available?',
            label_bar: 'Cash / Savings',
            label_3a: 'Pillar 3a',
            label_pk: 'Pension Fund',
            hint_pk: '2nd Pillar – does NOT count as hard equity',
            label_other: 'Other Assets',
            hint_other: 'assumed to be liquid',

            card_monthly_title: 'Monthly Contributions',
            card_monthly_desc: 'Planned savings rates until the goal',
            label_3a_monthly: 'Contribution Pillar 3a / Month',
            label_pk_monthly: 'Contribution Pension Fund / Month',
            hint_pk_monthly: 'only relevant for the 20% rule',

            card_analysis_title: 'Goal Achievement',
            label_20pct: '20% Equity',
            status_enter_price: 'Enter Price',
            status_goal_reached: 'Goal Reached',
            status_n_reached: 'reached',

            chart_hard: 'Hard',
            chart_pk: 'Pension',
            chart_gap: 'Missing',

            summary_rec_savings: 'Recommended Additional Savings',
            summary_per_month: '/ mo',
            summary_error_price: 'Please enter purchase price',
            summary_error_date: 'Please adjust target date',

            warning_hard_title: '10% hard equity not covered',
            warning_hard_desc: 'You have enough total assets, but too much is in the pension fund. You still need {amount} from liquid funds.',

            card_growth_title: 'Asset Growth',
            card_growth_desc: 'Projection until target month maintaining recommended savings rate',
            growth_note: 'Graph shows theoretical progression including recommended savings',
            picker_placeholder: 'Select Date',
        },
        charts: {
            label_liquid: 'Liquid Assets',
            label_3a: 'Pillar 3a',
            label_pk: 'Pension Fund',
            label_hard: 'Hard Equity',
            label_gap: 'Missing',
            label_total: 'Total',
            unknown: 'Unknown',
            donut_center_label: 'of goal reached',
        },
        wizard: {
            step_1_title: 'Welcome',
            step_1_desc: 'Let us calculate your equity together. This wizard guides you step by step through the most important details.',
            step_1_text: 'We will go through the following points together:',
            step_1_li_1: 'Your desired property and timeline',
            step_1_li_2: 'Your current assets (equity)',
            step_1_li_3: 'Your monthly savings potential',
            step_1_end: 'At the end, you will receive a detailed evaluation and a savings plan.',

            step_2_title: 'The Goal',
            step_2_desc: 'How expensive can the dream house be and when do you want to buy it?',
            step_2_info: 'The purchase price determines how much equity (min. 20%) you need. The date determines how much time you have to save.',
            label_kaufpreis: 'Estimated Purchase Price (CHF)',
            label_datum: 'Planned Purchase Date',

            step_3_title: 'Existing Assets',
            step_3_desc: 'What do you already bring to the table?',
            step_3_info: 'Important: At least 10% of the purchase price must be "hard" equity (savings, 3a, etc.). Pension fund assets count as "soft".',
            label_bar: 'Cash / Savings Account',
            label_3a: 'Pillar 3a Assets',
            label_pk: 'Pension Fund (Withdrawal or Pledge)',

            step_4_title: 'Monthly Savings',
            step_4_desc: 'How much can you save monthly until the purchase date?',
            step_4_info: 'Regular payments into Pillar 3a along with other savings measures help reach the goal faster.',
            label_3a_monthly: 'Monthly into Pillar 3a',
            label_pk_monthly: 'Monthly into Pension Fund',
            hint_pk_monthly: 'This amount includes your salary deduction for the pension fund plus the employer contribution.',

            step_progress: 'Step {current} of {total}',
            btn_back: 'Back',
            btn_next: 'Next',
            btn_apply: 'Apply'
        }
    }
} as const;

export type Language = keyof typeof translations;
export type TranslationKey = string; // Simplified
