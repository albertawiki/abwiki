/**
 * The series that can be checked, and refreshed, without a person reading a PDF.
 *
 * Both `check-sources.mjs` and `refresh-data.mjs` read this. They have to
 * agree about what the source says: a refresh that computed a value one way
 * and a check that computed it another would spend its life proposing changes
 * the check then rejected.
 *
 * Everything else on the site comes out of a published document — RBC's
 * quarterly report, MNP's wave deck, Alberta Health's annual report, the OECD
 * volumes. Those are listed in `documentSeries` so that a release date passing
 * is noticed by something other than luck, but nothing here can read them.
 */

/**
 * A dataset whose numbers come from Statistics Canada vectors.
 *
 * `required` names the columns a year must have before it can be added. It is
 * not simply "all of them": the 2018-base poverty line was discontinued and is
 * legitimately null from 2024 on, and demanding it would mean no poverty year
 * is ever added again.
 *
 * `module` is where `lastChecked` lives, which is the date a person or this
 * job last held the published number against the source.
 */
export const machineReadable = [
  {
    id: 'median-weekly-wage-real',
    label: 'Median weekly wage',
    file: 'src/data/affordability/wages.json',
    module: 'src/data/affordability/WageData.js',
    recipe: 'vector-per-column',
    required: ['wage', 'cpi'],
  },
  {
    id: 'poverty-and-food-insecurity',
    label: 'Poverty and food insecurity',
    file: 'src/data/affordability/poverty.json',
    module: 'src/data/affordability/Poverty.js',
    recipe: 'vector-per-column',
    required: ['povertyMBM2023', 'foodInsecurity'],
  },
  {
    id: 'household-debt-to-income',
    label: 'Household debt to income',
    file: 'src/data/economy/householdDebt.json',
    module: 'src/data/economy/HouseholdDebt.js',
    recipe: 'vector-per-column',
    required: ['alberta', 'canada'],
  },
  {
    id: 'real-gdp-per-capita',
    label: 'Real GDP per person',
    file: 'src/data/economy/gdpPerCapita.json',
    module: 'src/data/economy/GdpPerCapita.js',
    recipe: 'vector-per-column',
    required: ['realGdpMillions', 'population'],
  },
  {
    id: 'resource-revenue-share',
    label: 'Oil and gas share of provincial revenue',
    file: 'src/data/economy/resourceRevenue.json',
    module: 'src/data/economy/ResourceRevenue.js',
    recipe: 'vector-per-column',
    required: ['royaltiesMillions', 'totalRevenueMillions'],
  },
  {
    id: 'effective-industries-jobs',
    label: 'Effective number of industries, by employment',
    file: 'src/data/diversification/industryConcentration.json',
    module: 'src/data/diversification/Diversification.js',
    recipe: 'effective-industries',
    required: ['canada', 'quebec', 'ontario', 'alberta', 'britishColumbia'],
  },
];

/** Series behind a published document. Nothing here can read one. */
export const documentSeries = [
  { label: 'Housing affordability (RBC)', module: 'src/data/affordability/HousingAffordabilityData.js' },
  { label: 'Consumer debt (MNP/Ipsos)', module: 'src/data/affordability/ConsumerDebt.js' },
  { label: 'ER wait times (Alberta Health)', module: 'src/data/healthcare/ERData.js' },
  { label: 'Accepting providers (Alberta Find a Doctor)', module: 'src/data/healthcare/FamilyDoctorData.js' },
  { label: 'PISA (OECD)', module: 'src/data/education/PISA.js' },
  { label: 'PISA by province (CMEC)', module: 'src/data/education/PISAProvinces.js' },
  { label: 'Class size (Alberta Education)', module: 'src/data/education/ClassSize.js' },
];

/**
 * Columns this site works out rather than reads.
 *
 * Both inputs to each of these are committed alongside the result, so a reader
 * can do the division themselves — which means the result has to be recomputed
 * when an input changes, never carried over. Statistics Canada revises GDP and
 * population separately, and a `perCapita` copied from the old row while its
 * numerator moved would be a number that came from nowhere.
 */
const DERIVED = {
  'src/data/economy/gdpPerCapita.json': (row) => ({
    perCapita: Math.round((row.realGdpMillions * 1000000) / row.population),
  }),
  'src/data/economy/resourceRevenue.json': (row, year) => ({
    // Alberta's fiscal year runs April to March, and the label names both
    // calendar years it touches. The second is the first plus one; pasting the
    // suffix onto the first year's century turns 1999-00 into 1900.
    fiscalYear: `${year}-${String((year + 1) % 100).padStart(2, '0')}`,
    share: Math.round((row.royaltiesMillions / row.totalRevenueMillions) * 1000) / 10,
  }),
};

/** Apply a file's derived columns to a row of source values. */
export function derive(file, row, year) {
  const rule = DERIVED[file];
  return rule ? { ...row, ...rule(row, year) } : row;
}

/** Whether a file has derived columns at all. */
export const hasDerived = (file) => Boolean(DERIVED[file]);

/** Every vector a dataset needs, flattened. */
export function vectorsFor(entry, data) {
  if (entry.recipe === 'effective-industries') {
    return Object.values(data.statcan).flatMap((industries) => Object.values(industries));
  }
  return Object.values(data.statcan);
}

/**
 * The effective number of industries: one divided by the Herfindahl-Hirschman
 * index of industry shares.
 *
 * Nineteen industries employing equal numbers would score 19. The same
 * nineteen non-overlapping labour force categories are used for every
 * geography, which is what makes the provinces comparable with each other.
 */
export function effectiveIndustries(employment) {
  const total = employment.reduce((sum, n) => sum + n, 0);
  const hhi = employment.reduce((sum, n) => sum + (n / total) ** 2, 0);
  return Math.round((1 / hhi) * 100) / 100;
}

/** Every year any of a dataset's vectors carries an observation for. */
function yearsIn(vectors, byVector) {
  const years = new Set();
  for (const vector of vectors) {
    for (const point of byVector[vector]) years.add(point.year);
  }
  return years;
}

/**
 * What the source says each year's row should be, as `{ [year]: row }`.
 *
 * Only complete years appear: a year missing any required column is left out
 * rather than written with a hole in it. `byYear` is passed the reference
 * period the dataset declares, so a quarterly vector read annually is read at
 * the right quarter rather than at whichever one was published last.
 */
export function sourceRows(entry, data, byVector, byYear) {
  const periods = data.statcanPeriod || {};
  const rows = {};

  if (entry.recipe === 'effective-industries') {
    const provinces = Object.entries(data.statcan);
    const years = yearsIn(vectorsFor(entry, data), byVector);

    for (const year of years) {
      const row = {};
      let complete = true;

      for (const [province, industries] of provinces) {
        const employment = Object.values(industries)
          .map((vector) => byYear(byVector[vector], periods[province])[year]);

        // One missing industry makes the whole index wrong rather than
        // slightly small, because it changes the denominator every share is
        // taken over. A part-year is not a smaller answer, it is a different
        // question.
        if (employment.some((n) => n === undefined || n === null)) {
          complete = false;
          break;
        }

        row[province] = effectiveIndustries(employment);
      }

      if (complete) rows[year] = row;
    }

    return rows;
  }

  const columns = Object.entries(data.statcan);
  const byColumn = Object.fromEntries(
    columns.map(([column, vector]) => [column, byYear(byVector[vector], periods[column])]),
  );

  for (const year of yearsIn(vectorsFor(entry, data), byVector)) {
    const present = Object.fromEntries(
      columns
        .map(([column]) => [column, byColumn[column][year]])
        .filter(([, value]) => value !== undefined),
    );

    const usable = entry.required
      .every((column) => present[column] !== undefined && present[column] !== null);
    if (!usable) continue;

    // A column the source publishes as null is a null in our row too, not an
    // absence: the 2018-base poverty line has genuinely stopped, and saying so
    // is the honest rendering.
    const row = Object.fromEntries(
      columns.map(([column]) => [column, present[column] === undefined ? null : present[column]]),
    );

    rows[year] = derive(entry.file, row, year);
  }

  return rows;
}
