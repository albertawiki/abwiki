import { dataset } from '../_lib/meta';
import consumerDebt from './consumerDebt.json';

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
    'These are poll responses rather than an administrative statistic. People are asked how much money is left at month-end after bills and debt payments, and the figure combines those with $1–$200 left with those who already cannot cover what they owe.',
    'The Alberta subsample runs to about 220 people per wave, giving a margin of error near ±7 percentage points. Individual quarters move around a lot at that size, so the trend is the useful part.',
    'Points are labelled by the quarter the survey was in the field, which is usually a quarter before MNP published it.',
    'Waves 36 (fielded March 2026) and 37 (fielded June 2026) are not yet included: MNP published national totals for those waves but the provincial breakdown deck was not retrievable at last check. See docs/DATA_SOURCES.md.',
  ],
});

// Values live in consumerDebt.json so that the site, the freshness check and
// the data diff all read the same numbers. Quarters we do not have are listed
// with a null rather than left out: dropping them would place 2023-Q1 next to
// 2023-Q4 on a categorical axis, drawing three missing quarters as one step.
export const consumerDebtIndex = consumerDebt.series;
