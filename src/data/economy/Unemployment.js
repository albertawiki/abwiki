import { dataset } from '../_lib/meta';

export const meta = dataset({
  id: 'unemployment-rate',
  title: 'Unemployment rate',
  unit: '% of the labour force',
  geography: 'Alberta',
  cadence: 'monthly',
  lastChecked: '2026-09-02',
  sources: [
    {
      text: 'Statistics Canada. Table 14-10-0287-01 Labour force characteristics, monthly, seasonally adjusted. Alberta, 15 years and over (vector v2064516).',
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
    'This counts people who are out of work and actively looking, as a share of everyone working or looking. It is not a share of the whole population, which is why it sits near 7% while the employment rate sits near 64%.',
    'Someone who stops looking for work drops out of this measure entirely, so the rate can fall because people gave up rather than because they found jobs. Read it alongside the participation rate in the figure above.',
    'It says nothing about the quality of work found. Someone who wants full-time hours but takes part-time work counts as employed.',
    'Seasonally adjusted, so months can be compared with each other.',
    'Fetched live from Statistics Canada. If that call fails, the chart falls back to committed annual averages and says so.',
  ],
});
