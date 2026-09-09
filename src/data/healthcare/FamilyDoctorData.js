import { dataset } from '../_lib/meta';
import familyDoctors from './familyDoctors.json';

export const meta = dataset({
  id: 'primary-care-accepting-new-patients',
  title: 'How many providers are taking new patients?',
  unit: 'Providers listed as accepting new patients',
  geography: 'Alberta',
  cadence: 'annual (as at March 31)',
  lastChecked: '2026-09-09',
  nextExpected: '2026-12',
  sources: [
    {
      text: 'Alberta Find a Provider, formerly Alberta Find a Doctor (Alberta Primary Care Networks) \u2014 "By the numbers" reporting.',
      url: 'https://albertafindaprovider.ca/news/visits-to-website-top-1-million-as-albertans-struggle-to-find-family-doctors',
      retrieved: '2026-09-09',
    },
    {
      text: 'Alberta Primary Care Networks. "Surge in provider availability fuels record visits to Alberta Find a Doctor", May 7, 2025.',
      url: 'https://albertapcns.ca/news/surge-in-provider-availability-fuels-record-visits-to-alberta-find-a-doctor',
      retrieved: '2026-08-31',
    },
  ],
  notes: [
    'This counts providers who have listed themselves as accepting new patients on Alberta Find a Doctor. Because it is a listing rather than a registry, someone who stops accepting patients without updating their entry still gets counted, and someone who never lists never does.',
    'From 2025 the count includes nurse practitioners alongside family physicians (418 physicians plus 44 nurse practitioners). Earlier years counted physicians only, so the jump between 2024 and 2025 overstates how much physician availability actually changed.',
    'Alberta had roughly 3,800 family physicians listed on the site in total at last report. This chart measures how many are advertising availability, not how many exist.',
  ],
});

// scope records what the count includes, because it changed in 2025.
export const familyDoctorData = familyDoctors.series;
