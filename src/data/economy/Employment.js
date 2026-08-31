import { dataset } from '../_lib/meta';

export const meta = dataset({
  id: 'employment-rate',
  title: 'Employment rate',
  unit: '% of population aged 15 and over',
  geography: 'Alberta',
  cadence: 'monthly',
  lastChecked: '2026-08-31',
  sources: [
    {
      text: 'Government of Alberta Economic Dashboard \u2014 Employment rate (live API).',
      url: 'https://economicdashboard.alberta.ca/dashboard/employment-rate/',
      retrieved: '2026-08-31',
    },
    {
      text: 'Statistics Canada. Table 14-10-0287-01 Labour force characteristics, monthly, seasonally adjusted (the underlying source).',
      url: 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1410028701',
      retrieved: '2026-08-31',
    },
  ],
  notes: [
    'The employment rate is the share of everyone aged 15 and over who is employed. It falls when people retire as well as when they lose work, so it is read alongside the unemployment rate rather than instead of it.',
    'Fetched live from the Government of Alberta\u2019s Economic Dashboard API, so this chart reflects the most recent Labour Force Survey month.',
    'The dashboard\u2019s older code-based API endpoint was retired; this chart uses the table query endpoint.',
  ],
});

/** Live endpoint. Monthly, seasonally adjusted, Alberta, both sexes, 15+. */
export const EMPLOYMENT_RATE_API =
  'https://api.economicdata.alberta.ca/data?table=EmploymentRate_14100287' +
  '&characteristic=employment%20rate&geoname=alberta' +
  '&sex=both%20sexes&age=15%20years%20and%20over';

/**
 * Annual averages, used when the live API is unreachable so the chart shows
 * something true rather than an empty frame. Computed from the same series.
 */
export const employmentRateFallback = [
  { year: 2019, employmentRate: 66.77 },
  { year: 2020, employmentRate: 61.07 },
  { year: 2021, employmentRate: 63.70 },
  { year: 2022, employmentRate: 65.60 },
  { year: 2023, employmentRate: 65.49 },
  { year: 2024, employmentRate: 64.34 },
  { year: 2025, employmentRate: 63.88 },
];
