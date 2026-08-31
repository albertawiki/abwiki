import { dataset } from '../_lib/meta';

export const meta = dataset({
  id: 'housing-affordability-rbc',
  title: 'Cost of owning a home',
  unit: 'Ownership costs as % of median pre-tax household income',
  geography: 'Calgary and Edmonton',
  cadence: 'quarterly',
  lastChecked: '2026-08-31',
  nextExpected: '2026-09',
  sources: [
    {
      text: 'RBC Economics. Housing Trends and Affordability / Focus on Canadian Housing, quarterly reports. Each point below cites the specific report it was taken from.',
      url: 'https://www.rbc.com/en/economics/canadian-analysis/canadian-housing/housing-affordability/',
      retrieved: '2026-08-31',
    },
  ],
  notes: [
    'RBC\u2019s aggregate affordability measure is the share of a median household\u2019s pre-tax income needed to cover mortgage payments, property taxes and utilities on a benchmark home. A lower number means housing is more affordable.',
    'It is a modelled measure, not a survey of what households actually pay. It assumes a 25-year amortization, a 20% down payment and a five-year fixed rate, so it moves with interest rates as much as with prices.',
    'RBC revises the series as its price and income inputs are restated. Each value below is recorded as first published, with the report it came from, so the chart is reproducible. This means a step in the line can reflect a revision rather than a change in the market.',
    'RBC\u2019s Q1 2026 report states an Edmonton figure of 36.8% while also saying it is "down 0.5 percentage points from Q4" \u2014 which had been published as 33.1%. The two statements cannot both be right, so Edmonton\u2019s Q1 2026 point is withheld pending confirmation. See docs/DATA_SOURCES.md.',
    'Long-run averages for reference: Calgary 39.2%, Edmonton 32.4% (RBC, Q4 2025 report).',
  ],
});

// Each row is one quarter as first published by RBC. `report` is the month of
// the RBC release the value was read from — keep it, it is what makes a
// revision visible instead of silent.
export const housingAffordability = [
  { quarter: '2019-Q4', calgary: 38.5, edmonton: 31.6, report: null },
  { quarter: '2020-Q1', calgary: 38.1, edmonton: 31.3, report: null },
  { quarter: '2020-Q2', calgary: 35.9, edmonton: 29.3, report: null },
  { quarter: '2020-Q3', calgary: 36.7, edmonton: 30.1, report: null },
  { quarter: '2020-Q4', calgary: 37.2, edmonton: 30.4, report: null },
  { quarter: '2021-Q1', calgary: 37.0, edmonton: 31.9, report: null },
  { quarter: '2021-Q2', calgary: 31.7, edmonton: 27.4, report: null },
  { quarter: '2021-Q3', calgary: 32.8, edmonton: 28.5, report: null },
  { quarter: '2021-Q4', calgary: 32.9, edmonton: 25.8, report: null },
  { quarter: '2022-Q1', calgary: 35.3, edmonton: 27.1, report: null },
  { quarter: '2022-Q2', calgary: 38.8, edmonton: 29.3, report: null },
  { quarter: '2022-Q3', calgary: 41.6, edmonton: 31.2, report: null },
  { quarter: '2022-Q4', calgary: 43.2, edmonton: 32.3, report: null },
  { quarter: '2023-Q1', calgary: 43.0, edmonton: 34.2, report: null },
  { quarter: '2023-Q2', calgary: 44.0, edmonton: 34.2, report: null },
  { quarter: '2023-Q3', calgary: 47.6, edmonton: 36.7, report: null },
  { quarter: '2023-Q4', calgary: 48.3, edmonton: 36.8, report: null },
  { quarter: '2024-Q1', calgary: 43.5, edmonton: 35.5, report: null },
  { quarter: '2024-Q2', calgary: 42.5, edmonton: 33.7, report: null },
  { quarter: '2024-Q3', calgary: 42.2, edmonton: 33.6, report: '2024-12' },
  { quarter: '2024-Q4', calgary: 41.5, edmonton: 33.6, report: '2025-03' },
  { quarter: '2025-Q1', calgary: 42.3, edmonton: 33.0, report: '2025-06' },
  { quarter: '2025-Q2', calgary: 40.9, edmonton: 32.2, report: '2025-10' },
  { quarter: '2025-Q3', calgary: 40.9, edmonton: 32.3, report: '2025-12' },
  { quarter: '2025-Q4', calgary: 41.5, edmonton: 33.1, report: '2026-03' },
  { quarter: '2026-Q1', calgary: 41.5, edmonton: null, report: '2026-06' },
];

/** Long-run averages RBC publishes alongside the measure, for chart reference lines. */
export const longRunAverage = { calgary: 39.2, edmonton: 32.4 };
