import { dataset } from '../_lib/meta';
import poverty from './poverty.json';

export const meta = dataset({
  id: 'poverty-and-food-insecurity',
  title: 'Poverty and food insecurity',
  unit: '% of persons',
  geography: 'Alberta',
  cadence: 'annual',
  lastChecked: '2026-08-31',
  nextExpected: '2027-04',
  sources: [
    {
      text: 'Statistics Canada. Table 11-10-0093-01 Poverty and low-income statistics by selected demographic characteristics (Market Basket Measure, all persons, Alberta).',
      url: 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1110009301',
      retrieved: '2026-08-31',
    },
    {
      text: 'Statistics Canada. Table 13-10-0835-01 Food insecurity by selected demographic characteristics (all persons, Alberta).',
      url: 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1310083501',
      retrieved: '2026-08-31',
    },
    {
      text: 'Statistics Canada. Canadian Income Survey — survey description and reference periods.',
      url: 'https://www23.statcan.gc.ca/imdb/p2SV.pl?Function=getSurvey&SDDS=5200',
      retrieved: '2026-08-31',
    },
  ],
  notes: [
    'Years are reference years — the year the income and food security refer to. The Canadian Income Survey collects this data in the following calendar year. An earlier version of this chart labelled points by collection year, which shifted the whole series forward by one year.',
    'The Market Basket Measure is Canada\u2019s official poverty line. Statistics Canada rebased it in 2023; the 2018-base and 2023-base series are shown separately because they are not the same measure. Where they overlap they track closely, but splicing them into one line would invent a trend at the join.',
    'Food insecurity counts anyone in a household reporting marginal, moderate or severe food insecurity in the past 12 months.',
    'Pandemic-era benefits (CERB and successors) pushed measured poverty to a record low in 2020. The rise afterward is partly those benefits ending.',
  ],
});

// Reference year. povertyMBM2018 / povertyMBM2023: % of all persons below the
// Market Basket Measure on each base. foodInsecurity: % of all persons in
// households reporting any food insecurity. Values live in poverty.json so the
// source-freshness check reads the same numbers this chart does.
export const povertyData = poverty.series;
