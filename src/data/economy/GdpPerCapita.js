import { dataset } from '../_lib/meta';
import gdpPerCapita from './gdpPerCapita.json';

export const meta = dataset({
  id: 'real-gdp-per-capita',
  title: 'Economic output per person',
  unit: 'Real GDP per person, constant 2017 dollars',
  geography: 'Alberta',
  cadence: 'annual',
  lastChecked: '2026-09-02',
  nextExpected: '2026-11',
  sources: [
    {
      text: 'Statistics Canada. Table 36-10-0222-01 Gross domestic product, expenditure-based, provincial and territorial, annual. Alberta, chained (2017) dollars, GDP at market prices (vector v62788314).',
      url: 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3610022201',
      retrieved: '2026-09-02',
    },
    {
      text: 'Statistics Canada. Table 17-10-0009-01 Population estimates, quarterly. Alberta, July 1 of each year (vector v15).',
      url: 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1710000901',
      retrieved: '2026-09-02',
    },
  ],
  notes: [
    'This is a calculation rather than a published series: real GDP divided by the July 1 population, which is the standard mid-year denominator. Both inputs are in the data table so the division can be checked by hand.',
    'GDP is in chained 2017 dollars, so inflation is already removed. A change here is a change in output, not in prices.',
    'Total GDP and GDP per person can move in opposite directions, and in Alberta they often have. Output grew from $253 billion in 2005 to $368 billion in 2024, while output per person fell over the same period, because population grew faster than the economy.',
    'GDP counts what is produced in Alberta, not what Albertans are paid. A large share of it accrues to owners of capital, much of it outside the province, so this is not a measure of household living standards. Read it with the wage and income figures.',
    'It is heavily influenced by oil and gas prices and volumes, which are set outside Alberta. Movements here often say more about world markets than about anything decided in the province.',
  ],
});

export const gdpPerCapitaData = gdpPerCapita.series;
