import { dataset } from '../_lib/meta';
import wages from './wages.json';

export const meta = dataset({
  id: 'median-weekly-wage-real',
  title: 'Median weekly wage, adjusted for inflation',
  unit: 'Constant 2025 dollars per week',
  geography: 'Alberta',
  cadence: 'annual',
  lastChecked: '2026-08-31',
  nextExpected: '2027-04',
  sources: [
    {
      text: 'Statistics Canada. Table 14-10-0064-01 Employee wages by industry, annual (vector v2292739).',
      url: 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1410006401',
      retrieved: '2026-08-31',
    },
    {
      text: 'Statistics Canada. Table 18-10-0005-01 Consumer Price Index, annual average, not seasonally adjusted, Alberta, all-items (vector v41694625).',
      url: 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1810000501',
      retrieved: '2026-08-31',
    },
  ],
  notes: [
    'Median weekly wage for all employees aged 15 and over, both full- and part-time, all industries.',
    'Deflated by the Alberta all-items CPI (2002 = 100), not the national CPI. Earlier versions of this chart used national CPI, which understated Alberta inflation and so overstated real wage growth.',
    'A median is not an average: half of Alberta employees earn less than this figure.',
  ],
});

// The numbers live in wages.json so that both this module and
// scripts/check-sources.mjs read exactly the same values. To add a year, edit
// that file — nothing here needs to change.
export const BASE_YEAR = wages.baseYear;
export const wageCPIData = wages.series;

const baseCPI = wageCPIData.find((d) => d.year === BASE_YEAR).cpi;

/** Median weekly wage restated in BASE_YEAR dollars. */
export const getAdjustedWageData = () =>
  wageCPIData.map(({ year, wage, cpi }) => ({
    year,
    wage: Math.round((wage * baseCPI) / cpi * 100) / 100,
    nominalWage: wage,
  }));

export const rawWageData = wageCPIData;
