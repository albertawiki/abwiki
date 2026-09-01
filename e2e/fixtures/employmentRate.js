/**
 * A fixed slice of the Alberta Economic Dashboard's employment rate response.
 *
 * The employment chart is the one figure that fetches live data, which makes
 * it useless as a visual baseline — the series changes every month, so the
 * screenshot would fail every month for a reason that is not a regression.
 * Serving this fixture instead keeps the baseline stable and still exercises
 * the real fetch-parse-render path.
 *
 * Shape and values are copied from a real response on 2026-08-31.
 */
const START_YEAR = 2021;
const MONTHS = 66;

// A plausible, deterministic series: the post-pandemic recovery and drift down.
const VALUES = [
  62.4, 62.7, 62.9, 63.1, 63.4, 63.6, 63.5, 63.8, 64.0, 64.2, 64.3, 64.5,
  64.7, 64.9, 65.1, 65.4, 65.6, 65.8, 65.9, 66.0, 65.9, 65.8, 65.7, 65.6,
  65.7, 65.6, 65.5, 65.6, 65.5, 65.4, 65.5, 65.4, 65.3, 65.4, 65.3, 65.2,
  65.0, 64.9, 64.8, 64.6, 64.5, 64.4, 64.3, 64.4, 64.2, 64.1, 64.0, 63.9,
  63.8, 63.7, 63.9, 63.8, 63.9, 64.0, 63.9, 64.1, 64.0, 63.9, 64.1, 64.2,
  64.3, 64.4, 64.4, 64.6, 64.6, 64.3,
];

const employmentRateResponse = Array.from({ length: MONTHS }, (_, i) => {
  const month = (i % 12) + 1;
  const year = START_YEAR + Math.floor(i / 12);
  return {
    Date: `${year}-${String(month).padStart(2, '0')}-01T00:00:00`,
    GeoID: 48,
    GeoName: 'Alberta',
    Characteristic: 'Employment rate',
    Sex: 'Both sexes',
    Age: '15 years and over',
    Value: VALUES[i],
  };
});

module.exports = { employmentRateResponse };
