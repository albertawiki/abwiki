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
import { meta as employment } from './economy/Employment';
import { meta as unemployment } from './economy/Unemployment';
import { meta as gdpPerCapita, gdpPerCapitaData } from './economy/GdpPerCapita';
import { labourForceFallback } from './economy/labourForceApi';
import { meta as householdDebt, householdDebtData } from './economy/HouseholdDebt';
import { resourceRevenueMeta, resourceRevenueData } from './economy/ResourceRevenue';
import { meta as pisa, pisaData } from './education/PISA';
import { pisaProvincesMeta, pisaProvincesData } from './education/PISAProvinces';
import { classSizeMeta, classSizeData } from './education/ClassSize';
import { concentrationMeta, oilShareMeta, concentrationData, oilShareData } from './diversification/Diversification';

export const datasets = [
  { topic: 'Affordability', meta: wages, rows: wageCPIData },
  { topic: 'Affordability', meta: housing, rows: housingAffordability },
  { topic: 'Affordability', meta: consumerDebt, rows: consumerDebtIndex },
  { topic: 'Affordability', meta: poverty, rows: povertyData },
  { topic: 'Healthcare', meta: erWaits, rows: erWaitTimesData },
  { topic: 'Healthcare', meta: familyDoctors, rows: familyDoctorData },
  { topic: 'Economy', meta: employment, rows: labourForceFallback },
  { topic: 'Economy', meta: unemployment, rows: labourForceFallback },
  { topic: 'Economy', meta: gdpPerCapita, rows: gdpPerCapitaData },
  { topic: 'Economy', meta: householdDebt, rows: householdDebtData },
  { topic: 'Diversification', meta: resourceRevenueMeta, rows: resourceRevenueData },
  { topic: 'Diversification', meta: concentrationMeta, rows: concentrationData },
  { topic: 'Diversification', meta: oilShareMeta, rows: oilShareData },
  { topic: 'Education', meta: pisa, rows: pisaData },
  { topic: 'Education', meta: pisaProvincesMeta, rows: pisaProvincesData },
  { topic: 'Education', meta: classSizeMeta, rows: classSizeData },
];
