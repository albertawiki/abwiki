import { dataset } from '../_lib/meta';
import housing from './housingAffordability.json';

export const meta = dataset({
  id: 'housing-affordability-rbc',
  title: 'How affordable is a home in Calgary and Edmonton?',
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
    'RBC’s aggregate measure is the share of a median household’s pre-tax income needed to cover mortgage payments, property taxes and utilities on a benchmark home. Lower is more affordable.',
    'It is modelled rather than surveyed, so it does not describe what households actually pay. The model assumes a 25-year amortization, a 20% down payment and a five-year fixed rate, which means interest rates move it as much as prices do.',
    'RBC revises this series when its price and income inputs are restated. We record each value as first published, along with the report it came from, which keeps the chart reproducible but does mean a step in the line can come from a revision rather than from the market.',
    'RBC\u2019s Q1 2026 report states an Edmonton figure of 36.8% while also saying it is "down 0.5 percentage points from Q4", which had been published as 33.1%. The two statements cannot both be right, so Edmonton\u2019s Q1 2026 point is withheld pending confirmation. See docs/DATA_SOURCES.md.',
    'Long-run averages for reference: Calgary 39.2%, Edmonton 32.4% (RBC, Q4 2025 report).',
  ],
});

// Each row is one quarter as first published by RBC. `report` is the month of
// the release the value was read from — keep it, it is what makes a revision
// visible instead of silent.
export const housingAffordability = housing.series;

/** Long-run averages RBC publishes alongside the measure, for reference lines. */
export const longRunAverage = housing.longRunAverage;
