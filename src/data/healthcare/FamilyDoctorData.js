import { dataset } from '../_lib/meta';

export const meta = dataset({
  id: 'primary-care-accepting-new-patients',
  title: 'Primary care providers accepting new patients',
  unit: 'Providers listed as accepting new patients',
  geography: 'Alberta',
  cadence: 'annual (as at March 31)',
  lastChecked: '2026-08-31',
  nextExpected: '2026-09',
  sources: [
    {
      text: 'Alberta Find a Doctor (Alberta Primary Care Networks) \u2014 "By the numbers" reporting.',
      url: 'https://albertafindadoctor.ca/news/visits-to-website-top-1-million-as-albertans-struggle-to-find-family-doctors',
      retrieved: '2026-08-31',
    },
    {
      text: 'Alberta Primary Care Networks. "Surge in provider availability fuels record visits to Alberta Find a Doctor", May 7, 2025.',
      url: 'https://albertapcns.ca/news/surge-in-provider-availability-fuels-record-visits-to-alberta-find-a-doctor',
      retrieved: '2026-08-31',
    },
  ],
  notes: [
    'Counts providers who have listed themselves as accepting new patients on Alberta Find a Doctor. It is a listing, not a registry: a provider who stops accepting patients but does not update their listing is still counted, and one who never lists is never counted.',
    'From 2025 the count includes nurse practitioners as well as family physicians (2025: 418 physicians + 44 nurse practitioners = 462). Earlier years counted family physicians only, so the jump between 2024 and 2025 overstates the change in physician availability.',
    'Alberta had roughly 3,800 family physicians listed on the site in total at last report, so this measures availability, not supply.',
  ],
});

// scope records what the count includes, because it changed in 2025.
export const familyDoctorData = [
  { year: 2020, providers: 887, scope: 'physicians' },
  { year: 2021, providers: 669, scope: 'physicians' },
  { year: 2022, providers: 390, scope: 'physicians' },
  { year: 2023, providers: 209, scope: 'physicians' },
  { year: 2024, providers: 163, scope: 'physicians' },
  { year: 2025, providers: 462, scope: 'physicians and nurse practitioners' },
];
