// Registry of every dataset published on the site.
//
// The integrity tests walk this list, so a dataset that is not registered here
// is not checked. Add new datasets to it.

import { meta as wages, wageCPIData } from './affordability/WageData';
import { meta as housing, housingAffordability } from './affordability/HousingAffordabilityData';
import { meta as consumerDebt, consumerDebtIndex } from './affordability/ConsumerDebt';
import { meta as poverty, povertyData } from './affordability/Poverty';
import { meta as erWaits, erWaitTimesData } from './healthcare/ERData';
import { meta as familyDoctors, familyDoctorData } from './healthcare/FamilyDoctorData';
import { meta as employment, employmentRateFallback } from './economy/Employment';
import { meta as householdDebt, householdDebtData } from './economy/HouseholdDebt';
import { meta as pisa, pisaData } from './education/PISA';

export const datasets = [
  { topic: 'Affordability', meta: wages, rows: wageCPIData },
  { topic: 'Affordability', meta: housing, rows: housingAffordability },
  { topic: 'Affordability', meta: consumerDebt, rows: consumerDebtIndex },
  { topic: 'Affordability', meta: poverty, rows: povertyData },
  { topic: 'Healthcare', meta: erWaits, rows: erWaitTimesData },
  { topic: 'Healthcare', meta: familyDoctors, rows: familyDoctorData },
  { topic: 'Economy', meta: employment, rows: employmentRateFallback },
  { topic: 'Economy', meta: householdDebt, rows: householdDebtData },
  { topic: 'Education', meta: pisa, rows: pisaData },
];
