import { dataset } from '../_lib/meta';
import consumerDebt from './consumerDebt.json';

export const meta = dataset({
  id: 'consumer-debt-insolvency-margin',
  title: 'What share of Albertans are $200 from not covering their bills?',
  unit: '% of Alberta respondents',
  geography: 'Alberta',
  cadence: 'quarterly',
  lastChecked: '2026-09-08',
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
    {
      text: 'MNP LTD. "MNP Consumer Debt Index: Albertans experiencing financial whiplash as economic uncertainty persists", 13 April 2026. Wave 36, fielded 10 to 11 March 2026.',
      url: 'https://mnpdebt.ca/en/resources/mnp-debt-blog/albertans-experiencing-economic-uncertainty-persists',
      retrieved: '2026-09-08',
    },
    {
      text: 'MNP LTD. "MNP Consumer Debt Index: Albertans caught in pre-spent paycheque cycle amid sustained cost pressures", 13 July 2026. Wave 37, fielded 11 to 16 June 2026.',
      url: 'https://mnpdebt.ca/en/resources/mnp-debt-blog/mnp-consumer-debt-index-ab-caught-pre-spent-paycheque-cycle',
      retrieved: '2026-09-08',
    },
  ],
  notes: [
    'These are poll responses rather than an administrative statistic. People are asked how much money is left at month-end after bills and debt payments, and the figure combines those with $1–$200 left with those who already cannot cover what they owe.',
    'The Alberta subsample runs to about 220 people per wave, giving a margin of error near ±7 percentage points. Individual quarters move around a lot at that size, so the trend is the useful part.',
    'Points are labelled by the quarter the survey was in the field, which is usually a quarter before MNP published it.',
    'MNP’s stated quarter-over-quarter changes do not reconcile with its own published levels. The April 2026 release calls 42% a one-point rise from a level it published as 38%, and the July 2026 release calls 52% a thirteen-point rise from 42%. We record each release’s level, not its stated change.',
  ],
});

// Values live in consumerDebt.json so that the site, the freshness check and
// the data diff all read the same numbers. Quarters we do not have are listed
// with a null rather than left out: dropping them would place 2023-Q1 next to
// 2023-Q4 on a categorical axis, drawing three missing quarters as one step.
export const consumerDebtIndex = consumerDebt.series;
