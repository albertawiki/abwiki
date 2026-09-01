import { dataset } from '../_lib/meta';
import housing from './housingAffordability.json';

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
// the release the value was read from — keep it, it is what makes a revision
// visible instead of silent.
export const housingAffordability = housing.series;

/** Long-run averages RBC publishes alongside the measure, for reference lines. */
export const longRunAverage = housing.longRunAverage;
