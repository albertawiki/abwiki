/**
 * A fixed Labour Force Survey response, in Statistics Canada's WDS shape.
 *
 * The labour charts fetch live, which makes them useless as visual baselines:
 * the series gains a month every few weeks, so the screenshot would fail
 * regularly for a reason that is not a regression. Serving this instead keeps
 * the baseline stable while still exercising the real fetch, parse and merge
 * path — including the merge-by-reference-month logic, which a hand-written
 * array of rows would skip entirely.
 *
 * Shape copied from a real response on 2026-09-02.
 */
const VECTORS = {
  2064516: 'unemploymentRate',
  2064517: 'participationRate',
  2064518: 'employmentRate',
};

const START_YEAR = 2021;
const MONTHS = 66;

// Deterministic, and shaped like the real series: a recovery, then a drift.
const SERIES = {
  unemploymentRate: [
    9.9, 9.6, 9.2, 8.9, 8.7, 8.5, 8.3, 8.1, 8.0, 7.8, 7.6, 7.4,
    7.2, 7.0, 6.6, 6.2, 5.9, 5.7, 5.6, 5.5, 5.6, 5.7, 5.8, 5.9,
    5.8, 5.7, 5.8, 5.9, 5.9, 6.0, 5.9, 5.8, 5.9, 6.0, 6.1, 6.2,
    6.4, 6.6, 6.8, 7.0, 7.1, 7.2, 7.1, 7.0, 7.1, 7.2, 7.3, 7.4,
    7.3, 7.2, 7.3, 7.2, 7.1, 7.2, 7.3, 7.2, 7.1, 7.0, 7.1, 7.2,
    7.0, 6.9, 6.8, 6.7, 6.8, 7.0,
  ],
  participationRate: [
    69.1, 69.2, 69.4, 69.3, 69.5, 69.6, 69.7, 69.8, 69.7, 69.6, 69.8, 69.9,
    69.8, 69.7, 69.6, 69.7, 69.6, 69.5, 69.6, 69.7, 69.6, 69.5, 69.6, 69.7,
    69.6, 69.5, 69.6, 69.5, 69.6, 69.7, 69.6, 69.5, 69.6, 69.5, 69.4, 69.5,
    69.4, 69.3, 69.2, 69.3, 69.2, 69.1, 69.2, 69.3, 69.2, 69.1, 69.2, 69.1,
    69.0, 68.9, 68.8, 68.9, 68.8, 68.9, 68.8, 68.7, 68.8, 68.9, 68.8, 68.7,
    69.0, 69.1, 69.0, 69.2, 69.1, 69.2,
  ],
  employmentRate: [
    62.4, 62.7, 62.9, 63.1, 63.4, 63.6, 63.5, 63.8, 64.0, 64.2, 64.3, 64.5,
    64.7, 64.9, 65.1, 65.4, 65.6, 65.8, 65.9, 66.0, 65.9, 65.8, 65.7, 65.6,
    65.7, 65.6, 65.5, 65.6, 65.5, 65.4, 65.5, 65.4, 65.3, 65.4, 65.3, 65.2,
    65.0, 64.9, 64.8, 64.6, 64.5, 64.4, 64.3, 64.4, 64.2, 64.1, 64.0, 63.9,
    63.8, 63.7, 63.9, 63.8, 63.9, 64.0, 63.9, 64.1, 64.0, 63.9, 64.1, 64.2,
    64.3, 64.4, 64.4, 64.6, 64.6, 64.3,
  ],
};

const refPer = (i) => {
  const month = (i % 12) + 1;
  const year = START_YEAR + Math.floor(i / 12);
  return `${year}-${String(month).padStart(2, '0')}-01`;
};

/** Build a WDS reply for exactly the vectors the page asked for, in order. */
function replyFor(requestBody) {
  const asked = JSON.parse(requestBody);
  return asked.map(({ vectorId }) => {
    const key = VECTORS[vectorId];
    if (!key) return { status: 'NO_DATA', object: {} };
    return {
      status: 'SUCCESS',
      object: {
        vectorId,
        vectorDataPoint: Array.from({ length: MONTHS }, (_, i) => ({
          refPer: refPer(i),
          value: SERIES[key][i],
          decimals: 1,
        })),
      },
    };
  });
}

const STATCAN_WDS = '**/www150.statcan.gc.ca/t1/wds/**';

/** Route Statistics Canada to the fixture for this page. */
async function stubLabourForce(page) {
  await page.route(STATCAN_WDS, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(replyFor(route.request().postData() || '[]')),
    }),
  );
}

/** Make every Statistics Canada call fail, to exercise the fallback. */
async function breakLabourForce(page) {
  await page.route(STATCAN_WDS, (route) => route.fulfill({ status: 500, body: '' }));
}

module.exports = { stubLabourForce, breakLabourForce, STATCAN_WDS };
