import { dataset } from '../_lib/meta';

export const meta = dataset({
  id: 'pisa-alberta',
  title: 'Alberta results on international standardized tests',
  unit: 'PISA scale score',
  geography: 'Alberta',
  cadence: 'triennial',
  lastChecked: '2026-08-31',
  nextExpected: '2026-12',
  sources: [
    {
      text: 'OECD (2023), PISA 2022 Results (Volume I): The State of Learning and Equity in Education.',
      url: 'https://www.oecd.org/en/publications/pisa-2022-results-volume-i_53f23881-en.html',
      retrieved: '2026-08-31',
    },
    {
      text: 'OECD (2019), PISA 2018 Results (Volume I).',
      url: 'https://www.oecd.org/en/publications/pisa-2018-results-volume-i_5f07c754-en.html',
      retrieved: '2026-08-31',
    },
    {
      text: 'OECD (2016), PISA 2015 Results (Volume I).',
      url: 'https://www.oecd.org/en/publications/pisa-2015-results-volume-i_9789264266490-en.html',
      retrieved: '2026-08-31',
    },
    {
      text: 'Council of Ministers of Education, Canada \u2014 Canadian PISA reports with provincial breakdowns.',
      url: 'https://www.cmec.ca/252/Programme-for-International-Student-Assessment-(PISA).html',
      retrieved: '2026-08-31',
    },
  ],
  notes: [
    'PISA tests 15-year-olds every three years. A score difference of roughly 20 points is often described as about a year of schooling, but this is a rule of thumb, not a measurement.',
    'The 2022 round was written by students whose schooling was disrupted by the pandemic. Declines that year are near-universal across the OECD and should not be read as Alberta-specific.',
    'PISA 2025 was written in spring 2025; the OECD is expected to publish results in December 2026. This chart will not change before then.',
    'Provincial scores carry sampling error of roughly \u00b15 points. Small movements between rounds are not meaningful.',
  ],
});

export const pisaData = [
  { year: '2015', math: 511, reading: 533, science: 541 },
  { year: '2018', math: 511, reading: 532, science: 534 },
  { year: '2022', math: 504, reading: 525, science: 534 },
];

export const pisaDataBottomQuartile = [
  { year: '2015', math: 453, reading: 474, science: 479 },
  { year: '2018', math: 450, reading: 464, science: 468 },
  { year: '2022', math: 432, reading: 449, science: 462 },
];

export const pisaDataTopQuartile = [
  { year: '2015', math: 571, reading: 597, science: 605 },
  { year: '2018', math: 575, reading: 604, science: 602 },
  { year: '2022', math: 571, reading: 605, science: 608 },
];

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
