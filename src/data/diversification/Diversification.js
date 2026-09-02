import { dataset } from '../_lib/meta';
import diversification from './diversification.json';
import concentration from './industryConcentration.json';

const shared = {
  geography: 'Alberta, Canada, Ontario, Quebec and British Columbia',
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
  title: 'How spread out employment is, compared with other provinces',
  unit: 'Effective number of industries, by employment',
  cadence: 'annual',
  nextExpected: '2027-01',
  notes: [
    'The measure is one divided by the Herfindahl-Hirschman index of industry shares, which gives the number of equally sized industries that would produce the same concentration Alberta actually has. Nineteen industries employing identical numbers of people would score 19. A higher score means employment is spread more evenly.',
    'A single score says nothing on its own, which is why Canada and Ontario are drawn beside Alberta. Quebec and British Columbia are in the data table. All five are computed the same way over the same 19 industries, so they can be compared with each other.',
    'The score depends on how finely industries are divided. Nineteen categories is what the Labour Force Survey publishes at provincial level; a finer split would raise every line without changing their order. Compare the lines and the direction of travel, not the level.',
    'It counts where people work, not what the economy earns. The share of output each industry contributes moves with prices, which is a different question and is shown in the figure beside this one.',
    'It is silent on whether the work is well paid, secure or productive. A province can score well here while its wages stagnate.',
    'Industries are the 19 non-overlapping categories in the survey. Aggregates such as "goods-producing" are excluded, because they contain the same jobs as the categories beneath them and counting both would distort the index.',
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
    'Oil and gas has been a steady 5 to 8 per cent of Alberta jobs for forty years, while its share of output has swung between 12 and 33 per cent. The two lines answer the same question about the same industry and disagree by a wide margin.',
    'The output line moves mostly with the world oil price, which is set outside Alberta. It fell to 12.9% in 2016 and 12.5% in 2020, both years when the oil price collapsed rather than years when Alberta built new industries. Any diversification measure based on shares of GDP will call a price crash a success.',
    'The two differ because oil and gas is capital-intensive: it produces a large share of the value with a small share of the workforce.',
    'Output shares use current dollars. Statistics Canada\u2019s inflation-adjusted industry figures are chained, which means the components do not sum to the total and cannot be turned into shares.',
    'The output line stops in 2022. Statistics Canada has not yet published current-dollar industry detail for Alberta beyond that year, so the recent end of this chart rests on the employment line alone.',
  ],
});

export const diversificationData = diversification.series;
export const concentrationData = concentration.series;

/** Rows where the output-based measure exists, for the two-line comparison. */
export const oilShareData = diversification.series.filter((row) => row.oilShareOfGdp !== null);
