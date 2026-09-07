import { dataset } from '../_lib/meta';
import resourceRevenue from './resourceRevenue.json';

/**
 * How much of Alberta's provincial revenue comes from oil and gas royalties.
 *
 * The employment-based diversification measure is close to blind to resource
 * exposure, because oil and gas produces a large share of Alberta's output
 * with a small share of its jobs. This measures the exposure the other figures
 * miss: what happens to the province's income when the oil price moves.
 */
export const resourceRevenueMeta = dataset({
  id: 'resource-revenue-share',
  title: 'How much of provincial revenue comes from oil and gas',
  unit: '% of total Alberta government revenue',
  geography: 'Alberta',
  cadence: 'annual (fiscal year)',
  lastChecked: '2026-09-07',
  nextExpected: '2026-11',
  sources: [
    {
      text: 'Statistics Canada. Table 10-10-0017-01 Canadian government finance statistics for the provincial and territorial governments. Alberta, oil and gas royalties and total revenue.',
      url: 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1010001701',
      retrieved: '2026-09-07',
    },
    {
      text: 'Government of Alberta. Revenue, Budget 2026 and quarterly fiscal updates.',
      url: 'https://www.alberta.ca/revenue',
      retrieved: '2026-09-07',
    },
  ],
  notes: [
    'This is the share of every dollar of Alberta government revenue that came from oil and gas royalties. A higher share means more of what the province had to spend depended on resource prices that year.',
    'It has ranged from 6.2% in 2020-21 to 32.8% in 2022-23. A budget resting on a share that moves this far in two years is exposed to a price nobody in Alberta sets.',
    'Royalties are the province’s share of resources it owns, not a tax. Income and corporate taxes paid by energy companies and the people who work for them are counted in the other 70-odd per cent, so this understates how much of provincial revenue tracks the oil price.',
    'We calculate the share from two figures in the same Statistics Canada table rather than taking a published percentage. Both are in the data table so the division can be checked.',
    'Statistics Canada counts oil and gas royalties more narrowly than Alberta does. The province’s own "non-renewable resource revenue" also includes bonuses, Crown lease sales, rentals and fees, so budget documents quote a slightly larger figure for the same year.',
    'Years are fiscal years running April to March, labelled by the year they start. The table reports the fiscal year ending closest to 31 December, so its 2024 is Alberta’s 2024-25.',
  ],
});

export const resourceRevenueData = resourceRevenue.series;
