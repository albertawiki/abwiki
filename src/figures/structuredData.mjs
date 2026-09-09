/**
 * schema.org `Dataset` markup for a figure.
 *
 * This is what puts a chart into Google's dataset search, and this site is
 * unusually well placed to supply it: every figure already declares a title, a
 * unit, a geography, the date it was last checked and the original documents
 * it came from, because a reader is shown all of that. The markup is a second
 * rendering of the same `dataset()` record, not a second copy of it.
 *
 * Imports nothing, so both the React app and the prerender script can use it.
 *
 * The two things it will not do:
 *
 *   - **Overclaim the licence.** `license` covers what this site actually
 *     licenses, which is the chart and the compilation. The numbers belong to
 *     the bodies that published them, so they appear as `citation` and
 *     `isBasedOn`, and `usageInfo` says so in the same words the footer does.
 *   - **Invent a `distribution`.** Google recommends one, but there is no file
 *     to point at: the numbers are served as a table inside the page. A
 *     download URL that 404s is worse than an absent recommended field.
 */

import { SITE, SITE_ORIGIN } from './catalogue.mjs';

const LICENCE = 'https://creativecommons.org/licenses/by/4.0/';

const USAGE_INFO =
  'Original figures and calculations are free to use and share under CC BY 4.0. '
  + 'The underlying data remain the property of their respective publishers, '
  + 'listed under citation.';

const PUBLISHER = {
  '@type': 'Organization',
  name: SITE,
  url: `${SITE_ORIGIN}/`,
};

/** The month a calendar quarter opens, and the month it closes. */
const QUARTER_OPENS = { 1: '01', 2: '04', 3: '07', 4: '10' };
const QUARTER_CLOSES = { 1: '03', 2: '06', 3: '09', 4: '12' };

/**
 * One row's reporting period, as an ISO 8601 point or interval.
 *
 * Reference periods on this site are not interchangeable and the markup must
 * not flatten them. A fiscal year labelled `2020-21` runs April to March and
 * is written as that interval, not as the year 2020; a quarter labelled
 * `2019-Q4` covers October to December, not the whole of 2019. Getting this
 * wrong is how a series gets silently shifted by a year.
 */
function periodOf(row) {
  const label = row.fiscalYear ?? row.year ?? row.quarter;
  if (label === undefined || label === null) return null;

  const text = String(label);

  const quarter = text.match(/^(\d{4})-Q([1-4])$/);
  if (quarter) {
    const [, year, q] = quarter;
    return { start: `${year}-${QUARTER_OPENS[q]}`, end: `${year}-${QUARTER_CLOSES[q]}` };
  }

  // A fiscal year: April of the first year to March of the second. The label
  // abbreviates the second year to two digits, and the second year is always
  // the first plus one — deriving it by pasting the suffix onto the first
  // year's century turns 1999-00 into 1900. If the suffix disagrees with the
  // next year the label is not the fiscal year it looks like, and saying
  // nothing beats guessing which half is wrong.
  const fiscal = text.match(/^(\d{4})-(\d{2})$/);
  if (fiscal) {
    const [, first, suffix] = fiscal;
    const end = Number(first) + 1;
    if (end % 100 !== Number(suffix)) return null;
    return { start: `${first}-04`, end: `${end}-03` };
  }

  if (/^\d{4}$/.test(text)) return { start: text, end: text };

  return null;
}

/**
 * The span a series covers, as an ISO 8601 interval.
 *
 * Two datasets have no time dimension in their rows at all — one is a
 * snapshot compared across provinces, the other is grades against a
 * guideline — so their `meta` declares `temporalCoverage` instead. Returning
 * null when neither is available is deliberate: an absent field is honest, an
 * invented one is not.
 */
export function temporalCoverage(meta, rows = []) {
  if (meta.temporalCoverage) return meta.temporalCoverage;

  const periods = rows.map(periodOf).filter(Boolean);
  if (periods.length === 0) return null;

  const start = periods.reduce((a, b) => (a.start <= b.start ? a : b)).start;
  const end = periods.reduce((a, b) => (a.end >= b.end ? a : b)).end;

  return start === end ? start : `${start}/${end}`;
}

/**
 * The `Dataset` node for one figure.
 *
 * `figure` is a catalogue entry, `meta` the `dataset()` record it draws on,
 * `rows` the series behind it.
 */
export function datasetJsonLd(figure, meta, rows = []) {
  const url = `${SITE_ORIGIN}/f/${figure.id}`;
  const period = temporalCoverage(meta, rows);
  const sources = meta.sources ?? [];

  const node = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': url,
    name: figure.title,
    description: figure.description,
    url,
    license: LICENCE,
    usageInfo: USAGE_INFO,
    creator: PUBLISHER,
    publisher: PUBLISHER,
    isAccessibleForFree: true,
    includedInDataCatalog: {
      '@type': 'DataCatalog',
      name: SITE,
      url: `${SITE_ORIGIN}/${figure.topic}`,
    },
  };

  // `lastChecked` is the day a person read the number against the document it
  // cites, which is the honest answer to "when was this last known good".
  if (meta.lastChecked) node.dateModified = meta.lastChecked;
  if (period) node.temporalCoverage = period;

  if (meta.geography) {
    node.spatialCoverage = { '@type': 'Place', name: meta.geography };
  }

  if (meta.unit) {
    node.variableMeasured = {
      '@type': 'PropertyValue',
      name: meta.title,
      unitText: meta.unit,
    };
  }

  if (sources.length > 0) {
    node.citation = sources.map((source) => ({
      '@type': 'CreativeWork',
      name: source.text,
      url: source.url,
    }));
    node.isBasedOn = sources.map((source) => source.url);
  }

  return node;
}

/** The same node, as the text of a `application/ld+json` script. */
export const datasetJsonLdText = (...args) => JSON.stringify(datasetJsonLd(...args));
