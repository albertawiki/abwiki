// Shared helpers for describing a dataset's provenance.
//
// Every dataset in src/data must export a `meta` object built with
// `dataset()` so that charts, the sources drawer, and the data-integrity
// tests can all read the same provenance in one place.

/**
 * Describe a dataset.
 *
 * @param {object} d
 * @param {string} d.id          Stable slug, unique across the site.
 * @param {string} d.title       Human title, used as the chart heading.
 * @param {string} d.unit        What a value means, e.g. "% of population".
 * @param {string} d.geography   Usually "Alberta"; narrower for city series.
 * @param {string} d.cadence     "monthly" | "quarterly" | "annual" | "triennial"
 * @param {string} d.lastChecked ISO date a maintainer last verified this against the source.
 * @param {string} [d.nextExpected] ISO month the next release is expected, if known.
 * @param {Array}  d.sources     [{ text, url, retrieved }] — every original document.
 * @param {string[]} [d.notes]   Caveats a reader needs to interpret the series honestly.
 */
export const dataset = (d) => Object.freeze({ notes: [], nextExpected: null, ...d });
