import { dataset } from '../_lib/meta';
import pisa from './pisa.json';

export const meta = dataset({
  id: 'pisa-alberta',
  title: 'How do Alberta students score on international tests?',
  unit: 'PISA scale score',
  geography: 'Alberta',
  cadence: 'triennial',
  lastChecked: '2026-08-31',
  nextExpected: '2026-12',
  // Cited by DOI rather than by the oecd.org page. A DOI is meant to outlive a
  // publisher's site reorganisations, and OECD has already moved these once —
  // the current URLs are a newer scheme than the one they were published under.
  // A reader is redirected to exactly the same page.
  //
  // It does not make them checkable. oecd.org sits behind a bot challenge that
  // answers every automated request with a 403, and check-links follows the
  // redirect into it, so these three stay the only citations on the site the
  // automation reports as blocked rather than verified. Worth knowing when
  // reading its output: blocked means unverified, not sound.
  sources: [
    {
      text: 'OECD (2023), PISA 2022 Results (Volume I): The State of Learning and Equity in Education.',
      url: 'https://doi.org/10.1787/53f23881-en',
      retrieved: '2026-08-31',
    },
    {
      text: 'OECD (2019), PISA 2018 Results (Volume I).',
      url: 'https://doi.org/10.1787/5f07c754-en',
      retrieved: '2026-08-31',
    },
    {
      text: 'OECD (2016), PISA 2015 Results (Volume I).',
      url: 'https://doi.org/10.1787/9789264266490-en',
      retrieved: '2026-08-31',
    },
    {
      text: 'Council of Ministers of Education, Canada \u2014 Canadian PISA reports with provincial breakdowns.',
      url: 'https://www.cmec.ca/252/Programme-for-International-Student-Assessment-(PISA).html',
      retrieved: '2026-08-31',
    },
  ],
  notes: [
    'PISA tests 15-year-olds every three years. A gap of roughly 20 points is often described as about a year of schooling, though that is a rule of thumb rather than a measurement.',
    'Students who sat the 2022 round had their schooling disrupted by the pandemic. Declines that year show up across almost the whole OECD, so they are not an Alberta-specific result.',
    'PISA 2025 was written in spring 2025; the OECD is expected to publish results in December 2026. This chart will not change before then.',
    'Alberta’s movements between rounds are small next to their sampling error, and the publisher does not call them changes. CMEC reports Alberta mathematics as 511 in 2015, 511 in 2018 and 504 in 2022, with standard errors of 5.9, 6.1 and 6.7, and marks none as significantly different from its 2012 baseline.',
    'Reading fell from 532 in 2018 to 525 in 2022. CMEC marks that as not significant, while the Canadian decline over the same period, 520 to 507, is marked significant. Science was stable across the provinces except Nova Scotia.',
  ],
});

export const pisaData = pisa.series;
export const pisaDataBottomQuartile = pisa.bottomQuartile;
export const pisaDataTopQuartile = pisa.topQuartile;

/** Spread between the 75th and 25th percentile of Alberta students. */
export const combinedData = pisaData.map((d, i) => ({
  year: d.year,
  math: d.math,
  reading: d.reading,
  science: d.science,
  gapMath: pisaDataTopQuartile[i].math - pisaDataBottomQuartile[i].math,
  gapReading: pisaDataTopQuartile[i].reading - pisaDataBottomQuartile[i].reading,
  gapScience: pisaDataTopQuartile[i].science - pisaDataBottomQuartile[i].science,
}));
