import { dataset } from '../_lib/meta';
import provinces from './pisaProvinces.json';

/**
 * Alberta's PISA scores beside the other provinces.
 *
 * A PISA score alone tells a reader almost nothing: 504 is meaningful only
 * against the scale's other numbers. The provinces are the comparison most
 * Albertans actually want, and PISA is designed to support it, because Canada
 * over-samples so that every province is separately reportable.
 */
export const pisaProvincesMeta = dataset({
  id: 'pisa-provinces',
  title: 'How does Alberta compare with other provinces?',
  unit: 'PISA scale score, 2022',
  geography: 'Alberta, Canada and Ontario charted; every province in the data table',
  cadence: 'triennial',
  lastChecked: '2026-09-07',
  nextExpected: '2026-12',
  sources: [
    {
      text: 'Council of Ministers of Education, Canada. Measuring Up: Canadian Results of the OECD PISA 2022 Study, Appendix B, tables of average scores and confidence intervals.',
      url: 'https://www.cmec.ca/Publications/Lists/Publications/Attachments/438/PISA-2022_Canadian_Report_EN.pdf',
      retrieved: '2026-09-07',
    },
    {
      text: 'OECD (2023), PISA 2022 Results (Volume I): The State of Learning and Equity in Education.',
      url: 'https://www.oecd.org/en/publications/pisa-2022-results-volume-i_53f23881-en.html',
      retrieved: '2026-09-07',
    },
  ],
  notes: [
    'Scores are on the PISA scale, where the OECD average is set near 500. Higher is a stronger result. Every province is sampled separately, so the provinces can be compared with each other.',
    'A gap between two jurisdictions means little unless it is large against both standard errors, which are in the data table. Alberta scores 504 in mathematics against a Canadian average of 497, and the report classes Alberta as at the Canadian average rather than above it, because the Alberta standard error is 5.7.',
    'Alberta is above the Canadian average in reading (525 against 507) and science (534 against 515). Quebec is the only province above the Canadian average in mathematics.',
    'The report states that results for Canada and most provinces should be treated with caution, because one or more PISA technical standards were not met. Prince Edward Island, New Brunswick and Saskatchewan are the exceptions.',
    'This is the 2022 round. Students who sat it had their schooling disrupted by the pandemic, and scores fell across most of the OECD that year, so a low score is not an Alberta-specific result.',
    'PISA tests 15-year-olds in mathematics, reading and science. It does not measure what a curriculum covers, and it says nothing about the years of schooling before or after age 15.',
  ],
});

export const pisaProvincesData = provinces.series;

/** The same figures arranged for a chart grouped by subject. */
export const pisaProvincesBySubject = [
  { subject: 'Mathematics', key: 'mathematics' },
  { subject: 'Reading', key: 'reading' },
  { subject: 'Science', key: 'science' },
].map(({ subject, key }) => {
  const at = (jurisdiction) =>
    provinces.series.find((row) => row.jurisdiction === jurisdiction)[key];
  return {
    subject,
    alberta: at('Alberta'),
    canada: at('Canada'),
    ontario: at('Ontario'),
  };
});
