import MedianWagesChart, { wageTable } from '../components/figures/MedianWages';
import HousingAffordabilityChart, { housingTable } from '../components/figures/HousingAffordability';
import ConsumerDebtChart, { consumerDebtTable } from '../components/figures/MNPConsumerDebtIndexChart';
import PovertyChart, { povertyTable } from '../components/figures/PovertyChart';
import ERWaitTimesChart, { erTable } from '../components/figures/ERWaitTimesChart';
import FamilyDoctorsChart, { familyDoctorTable } from '../components/figures/FamilyDoctorsChart';
import EmploymentChart, { employmentTable } from '../components/figures/EmploymentChart';
import UnemploymentChart, { unemploymentTable } from '../components/figures/UnemploymentChart';
import GdpPerCapitaChart, { gdpPerCapitaTable } from '../components/figures/GdpPerCapitaChart';
import HouseholdDebtChart, { householdDebtTable } from '../components/figures/HouseholdDebtChart';
import ResourceRevenueChart, { resourceRevenueTable } from '../components/figures/ResourceRevenueChart';
import IndustryConcentrationChart, { concentrationTable } from '../components/figures/IndustryConcentrationChart';
import OilShareChart, { oilShareTable } from '../components/figures/OilShareChart';
import PISAChart, { pisaTable } from '../components/figures/PISAChart';
import PISAGapChart, { pisaGapTable } from '../components/figures/PISAGapChart';

import { meta as wageMeta } from '../data/affordability/WageData';
import { meta as housingMeta } from '../data/affordability/HousingAffordabilityData';
import { meta as debtMeta } from '../data/affordability/ConsumerDebt';
import { meta as povertyMeta } from '../data/affordability/Poverty';
import { meta as erMeta } from '../data/healthcare/ERData';
import { meta as doctorMeta } from '../data/healthcare/FamilyDoctorData';
import { meta as employmentMeta } from '../data/economy/Employment';
import { meta as unemploymentMeta } from '../data/economy/Unemployment';
import { meta as gdpPerCapitaMeta } from '../data/economy/GdpPerCapita';
import { meta as householdDebtMeta } from '../data/economy/HouseholdDebt';
import { resourceRevenueMeta } from '../data/economy/ResourceRevenue';
import { concentrationMeta, oilShareMeta } from '../data/diversification/Diversification';
import { meta as pisaMeta } from '../data/education/PISA';

import { SITE_ORIGIN, topics, catalogue, featured, routes } from './catalogue.mjs';

/**
 * Every published figure, joined to the code that draws it.
 *
 * The dashboard, the topic pages and the per-figure permalinks all render from
 * this list. Before it existed the dashboard held the only copy of each
 * figure's description and ordering, in JSX, so there was no way to render one
 * figure anywhere else.
 *
 * What each figure *is* lives in `catalogue.mjs`, which imports nothing, so
 * the sitemap generator can read the same list the site renders. What draws it
 * lives here. A catalogue entry with no binding below fails a test rather than
 * rendering an empty card.
 */
const BINDINGS = {
  'median-weekly-wage-real': { Chart: MedianWagesChart, table: wageTable, meta: wageMeta },
  'housing-affordability-rbc': { Chart: HousingAffordabilityChart, table: housingTable, meta: housingMeta },
  'consumer-debt-insolvency-margin': { Chart: ConsumerDebtChart, table: consumerDebtTable, meta: debtMeta },
  'poverty-and-food-insecurity': { Chart: PovertyChart, table: povertyTable, meta: povertyMeta },
  'er-wait-time-physician-assessment': { Chart: ERWaitTimesChart, table: erTable, meta: erMeta },
  'primary-care-accepting-new-patients': { Chart: FamilyDoctorsChart, table: familyDoctorTable, meta: doctorMeta },
  'employment-rate': { Chart: EmploymentChart, table: employmentTable, meta: employmentMeta },
  'unemployment-rate': { Chart: UnemploymentChart, table: unemploymentTable, meta: unemploymentMeta },
  'real-gdp-per-capita': { Chart: GdpPerCapitaChart, table: gdpPerCapitaTable, meta: gdpPerCapitaMeta },
  'household-debt-to-income': { Chart: HouseholdDebtChart, table: householdDebtTable, meta: householdDebtMeta },
  'resource-revenue-share': { Chart: ResourceRevenueChart, table: resourceRevenueTable, meta: resourceRevenueMeta },
  'effective-industries-jobs': { Chart: IndustryConcentrationChart, table: concentrationTable, meta: concentrationMeta },
  'oil-and-gas-share': { Chart: OilShareChart, table: oilShareTable, meta: oilShareMeta },
  'pisa-alberta': { Chart: PISAChart, table: pisaTable, meta: pisaMeta },
  'pisa-alberta-gap': { Chart: PISAGapChart, table: pisaGapTable, meta: pisaMeta },
};

export { SITE_ORIGIN, topics, routes };


export const figures = catalogue.map((entry) => ({ ...entry, ...BINDINGS[entry.id] }));

/** Catalogue entries with nothing to draw them. Empty, or a test fails. */
export const unboundFigures = catalogue
  .filter(({ id }) => !BINDINGS[id])
  .map(({ id }) => id);

/** The figure with this permalink id, or undefined. */
export const figureById = (id) => figures.find((f) => f.id === id);

/** The home page rotation, resolved to full figures in catalogue order. */
export const featuredFigures = featured.map(figureById).filter(Boolean);

/** Featured ids naming no published figure. Empty, or a test fails. */
export const unknownFeatured = featured.filter((id) => !catalogue.some((f) => f.id === id));

/** The topic with this slug, or undefined. */
export const topicBySlug = (slug) => topics.find((t) => t.slug === slug);

/** Every figure on a topic page, in publication order. */
export const figuresForTopic = (slug) => figures.filter((f) => f.topic === slug);

/**
 * A topic's figures split into the ungrouped ones and its named sections, in
 * the order a page renders them.
 */
export const topicLayout = (topic) => {
  const mine = figuresForTopic(topic.slug);
  return {
    ungrouped: mine.filter((f) => !f.section),
    sections: (topic.sections || []).map((section) => ({
      ...section,
      figures: mine.filter((f) => f.section === section.id),
    })),
  };
};

/** What a figure calls itself: its own title, or its dataset's. */
export const figureTitle = (figure) => figure.title || figure.meta.title;

/** Canonical, absolute URL for a figure's permalink. */
export const figureUrl = (figure) => `${SITE_ORIGIN}/f/${figure.id}`;
