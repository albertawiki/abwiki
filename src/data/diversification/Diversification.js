import { dataset } from '../_lib/meta';
import diversification from './diversification.json';

const shared = {
  geography: 'Alberta',
  lastChecked: '2026-09-02',
  sources: [
    {
      text: 'Statistics Canada. Table 14-10-0023-01 Labour force characteristics by industry, annual. Alberta, employment, 19 non-overlapping industries.',
      url: 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1410002301',
      retrieved: '2026-09-02',
    },
    {
      text: 'Statistics Canada. Table 36-10-0711-01 Gross domestic product (GDP) at basic prices, by industry, provinces and territories. Alberta, current dollars, 20 two-digit NAICS sectors.',
      url: 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3610071101',
      retrieved: '2026-09-02',
    },
  ],
};

/** How spread out employment is across industries. */
export const concentrationMeta = dataset({
  ...shared,
  id: 'effective-industries-jobs',
  title: 'How many industries Alberta really has',
  unit: 'Effective number of industries, by employment',
  cadence: 'annual',
  nextExpected: '2027-01',
  notes: [
    'This is one divided by the Herfindahl-Hirschman index of industry shares: the number of equally sized industries that would produce the same concentration as Alberta actually has. Nineteen industries split perfectly evenly would score 19. A higher number means employment is more spread out.',
    'It is computed from 19 non-overlapping industries in the Labour Force Survey. Aggregates such as "goods-producing" are excluded, because they overlap the industries and would count the same jobs twice.',
    'The score depends on how finely industries are divided. Nineteen categories is what this survey publishes for a province; a finer split would give a higher number. Read the direction of travel rather than the level.',
    'This measures where people work, not what the economy earns. It is deliberately not based on GDP, because the share of GDP each industry contributes moves with prices — see the figure beside this one.',
    'Employment diversity says nothing about whether the work is well paid, secure, or productive. A province could score well here while its wages stagnate.',
  ],
});

/** The same question asked of output rather than jobs. */
export const oilShareMeta = dataset({
  ...shared,
  id: 'oil-and-gas-share',
  title: 'How much of Alberta is oil and gas',
  unit: '% share of the province',
  cadence: 'annual',
  nextExpected: '2027-01',
  notes: [
    'Two answers to the same question, and the gap between them is the point. Oil and gas has been a steady 5 to 8 per cent of Alberta jobs for forty years, while its share of output has swung between 12 and 33 per cent.',
    'The output line moves mostly with the world oil price, which is set outside Alberta. It fell to 12.9% in 2016 and 12.5% in 2020 — price collapses, not years in which Alberta built new industries. Any diversification measure based on shares of GDP will call a price crash a success.',
    'The two differ because oil and gas is capital-intensive: it produces a large share of the value with a small share of the workforce.',
    'Output shares use current dollars. Statistics Canada\u2019s inflation-adjusted industry figures are chained, which means the components do not sum to the total and cannot be turned into shares.',
    'The output line stops in 2022. Statistics Canada has not yet published current-dollar industry detail for Alberta beyond that year, so the recent end of this chart rests on the employment line alone.',
  ],
});

export const diversificationData = diversification.series;

/** Rows where the output-based measure exists, for the two-line comparison. */
export const oilShareData = diversification.series.filter((row) => row.oilShareOfGdp !== null);
