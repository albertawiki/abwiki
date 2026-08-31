import { dataset } from '../_lib/meta';

export const meta = dataset({
  id: 'consumer-debt-insolvency-margin',
  title: 'Albertans within $200 of insolvency each month',
  unit: '% of Alberta respondents',
  geography: 'Alberta',
  cadence: 'quarterly',
  lastChecked: '2026-08-31',
  nextExpected: '2026-10',
  sources: [
    {
      text: 'MNP Consumer Debt Index (conducted by Ipsos). Quarterly wave decks, regional breakdown, "Finances at Month-End — % $200 or less from insolvency".',
      url: 'https://mnpdebt.ca/en/resources/mnp-consumer-debt-index',
      retrieved: '2026-08-31',
    },
    {
      text: 'Ipsos Public Affairs — MNP Consumer Debt Index releases.',
      url: 'https://www.ipsos.com/en-ca/mnp-consumer-debt-index',
      retrieved: '2026-08-31',
    },
  ],
  notes: [
    'This is an opinion poll, not an administrative statistic. Respondents are asked how much is left over each month after bills and debt payments; the figure combines those with $1–$200 left and those who already cannot cover their obligations.',
    'The Alberta subsample is roughly n=220 per wave, so the margin of error on a provincial figure is around ±7 percentage points. Read the trend, not any single quarter.',
    'Each point is labelled by the quarter the survey was in the field, not the quarter MNP published it.',
    'Waves 36 (fielded March 2026) and 37 (fielded June 2026) are not yet included: MNP published national totals for those waves but the provincial breakdown deck was not retrievable at last check. See docs/DATA_SOURCES.md.',
  ],
});

// quarter: the quarter the survey was fielded. wave: MNP's own wave number,
// so a reader can find the exact deck the number came from.
export const consumerDebtIndex = [
  { quarter: '2023-Q1', wave: 24, percentage: 47 },
  { quarter: '2023-Q4', wave: 27, percentage: 37 },
  { quarter: '2024-Q1', wave: 28, percentage: 34 },
  { quarter: '2024-Q2', wave: 29, percentage: 47 },
  { quarter: '2024-Q3', wave: 30, percentage: 44 },
  { quarter: '2024-Q4', wave: 31, percentage: 43 },
  { quarter: '2025-Q1', wave: 32, percentage: 45 },
  { quarter: '2025-Q2', wave: 33, percentage: 47 },
  { quarter: '2025-Q3', wave: 34, percentage: 50 },
  { quarter: '2025-Q4', wave: 35, percentage: 38 },
];
