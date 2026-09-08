import { dataset } from '../_lib/meta';
import wages from './wages.json';

export const meta = dataset({
  id: 'median-weekly-wage-real',
  title: 'What does a typical Alberta worker earn in a week?',
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
    'This is a median rather than an average, so half of Alberta employees earn less than the figure shown.',
    'Covers all employees aged 15 and over, full- and part-time, across all industries.',
    'The 2020 high point reflects who was working rather than what they were paid. Job losses that year fell most heavily on low-paid work, and the median counts only employees, so it rose from $1,040 to $1,120 a week as many of the lowest-paid stopped being counted. It fell back the following year.',
    'Adjusted using Alberta’s all-items CPI (2002 = 100). An earlier version of this chart used the national CPI, which understated Alberta inflation and so made real wages look better than they were.',
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
