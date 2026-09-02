import { dataset } from '../_lib/meta';
import householdDebt from './householdDebt.json';

export const meta = dataset({
  id: 'household-debt-to-income',
  title: 'Household debt compared with income',
  unit: 'Debt as a % of disposable income',
  geography: 'Alberta, with Canada for comparison',
  cadence: 'annual (fourth quarter)',
  lastChecked: '2026-09-02',
  nextExpected: '2026-12',
  sources: [
    {
      text: 'Statistics Canada. Table 36-10-0665-01 Distributions of household economic accounts, wealth indicators, Canada, regions and provinces, quarterly. Debt to disposable income ratio, all households (vectors v1277975997 Alberta, v1277975440 Canada).',
      url: 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3610066501',
      retrieved: '2026-09-02',
    },
    {
      text: 'Statistics Canada. Distributions of household economic accounts — methodology and concepts.',
      url: 'https://www.statcan.gc.ca/en/statistical-programs/document/5257_D1_V1',
      retrieved: '2026-09-02',
    },
  ],
  notes: [
    'A reading of 180 means households owe $1.80 for every dollar of after-tax income they receive in a year. It compares a stock of debt against a year of income, so it is a measure of leverage rather than of how hard the payments are to make.',
    'Because it is a ratio, it moves when incomes move as well as when borrowing does. Alberta’s jump in 2016 came mostly from the oil price collapse cutting incomes while existing mortgages stayed where they were.',
    'Canada is shown alongside because a debt ratio on its own says very little. What matters is whether Alberta households are carrying more or less than households elsewhere.',
    'This measures leverage across all Alberta households together. It says nothing about how that debt is distributed, so a falling ratio is consistent with some households being in serious difficulty.',
    'Statistics Canada published this annually to 2019 and quarterly from 2020. We take the fourth quarter of each year throughout, so the change in reporting frequency does not show up as a change in the line.',
  ],
});

export const householdDebtData = householdDebt.series;
