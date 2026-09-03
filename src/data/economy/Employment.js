import { dataset } from '../_lib/meta';

export const meta = dataset({
  id: 'employment-rate',
  title: 'Who is working, and who is looking',
  unit: '% of population aged 15 and over',
  geography: 'Alberta',
  cadence: 'monthly',
  lastChecked: '2026-09-02',
  sources: [
    {
      text: 'Statistics Canada. Table 14-10-0287-01 Labour force characteristics, monthly, seasonally adjusted. Alberta, 15 years and over (vectors v2064518 employment rate, v2064517 participation rate).',
      url: 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1410028701',
      retrieved: '2026-09-02',
    },
    {
      text: 'Statistics Canada. Labour Force Survey — guide and concepts.',
      url: 'https://www.statcan.gc.ca/en/survey/household/3701',
      retrieved: '2026-09-02',
    },
  ],
  notes: [
    'The employment rate is the share of everyone aged 15 and over who has a job. It falls when people retire as well as when they lose work, which is why the participation rate is drawn beside it.',
    'The participation rate is the share who are either working or looking for work. When it falls while employment also falls, people are leaving the labour force rather than joining the ranks of the unemployed, and the unemployment rate will not show that.',
    'Both series are seasonally adjusted, so a January figure can be compared with a July one.',
    'Fetched live from Statistics Canada, so this chart shows the most recent Labour Force Survey month. If that call fails, the chart falls back to committed annual averages and says so.',
    'The Labour Force Survey is a sample of about 56,000 households nationally, so a single month can move for reasons that are not real. The trend matters more than any one point.',
  ],
});
