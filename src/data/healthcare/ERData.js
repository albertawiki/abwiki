import { dataset } from '../_lib/meta';
import erWaitTimes from './erWaitTimes.json';

export const meta = dataset({
  id: 'er-wait-time-physician-assessment',
  title: 'Emergency department wait to see a doctor',
  unit: 'Hours (90th percentile)',
  geography: 'Alberta\u2019s 16 largest emergency departments',
  cadence: 'annual (fiscal year)',
  lastChecked: '2026-08-31',
  nextExpected: '2026-09',
  sources: [
    {
      text: 'Government of Alberta. Health Annual Report 2024\u201325, Performance Measure 1.a.',
      url: 'https://open.alberta.ca/dataset/4bb6bc99-ab59-47fd-a633-dfc27d7a049e/resource/6920038c-39c3-4dbd-ad36-14c649bff0a6/download/hlth-annual-report-2024-2025.pdf',
      retrieved: '2026-08-31',
    },
    {
      text: 'Government of Alberta. Health annual reports (all years).',
      url: 'https://open.alberta.ca/publications/2367-9824',
      retrieved: '2026-08-31',
    },
    {
      text: 'Health Quality Alberta \u2014 Patient time to see an emergency doctor (site-level detail).',
      url: 'https://focus.hqa.ca/charts/patient-time-to-see-an-emergency-doctor/',
      retrieved: '2026-08-31',
    },
  ],
  notes: [
    'The 90th percentile is the wait that nine in ten patients came in under. It is deliberately not the average \u2014 it describes the bad days, which is what capacity problems look like.',
    'Covers only the 16 largest sites, so it says little about rural emergency departments, some of which close intermittently.',
    'Alberta Health restated 2021\u201322 from 4.6 to 4.5 hours and 2022\u201323 from 6.3 to 6.2 hours in the 2024\u201325 report. The restated values are used here.',
    'Fiscal years run April 1 to March 31.',
  ],
});

export const erWaitTimesData = erWaitTimes.series;
